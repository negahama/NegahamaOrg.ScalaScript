import {
  AstNode,
  AstUtils,
  DefaultScopeProvider,
  EMPTY_SCOPE,
  ReferenceInfo,
  Scope,
  stream,
  StreamScope,
} from "langium";
import {
  Class,
  Code,
  isArrayType,
  isClass,
  isField,
  isLambdaType,
  isMemberCall,
  isMethod,
  isObjectType,
  isTupleType,
  isType,
  isTypeDeclaration,
  isVariableDeclaration,
  MemberCall,
  ObjectType,
  Program,
  Type,
  VariableDeclaration,
} from "./generated/ast.js";
import { LangiumServices } from "langium/lsp";

export interface TypeDescription {
  $type: string;
  message?: string;
  class?: Class;
  object?: ObjectType;
  returnType?: TypeDescription;
}

export class ScalaScriptScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumServices) {
    super(services);
  }

  haveDone: boolean = false;
  variables: { name: string; node: VariableDeclaration }[] = [];
  findVariableNames(node: AstNode) {
    if (this.haveDone) return;
    const root = AstUtils.findRootNode(node) as Program;
    root.codes.forEach((c) => {
      const code = c as Code;
      if (isVariableDeclaration(code)) {
        code.names.forEach((name) => {
          // console.log("add variable:", name);
          this.variables.push({ name: name, node: code });
        });
      }
    });
    this.haveDone = true;
  }

  override getScope(context: ReferenceInfo): Scope {
    // console.log(`getScope: ${context.container.$type}.${context.property} = ${context.reference.$refText}`);
    // target element of member calls
    if (context.property === "element") {
      // for now, `this` and `super` simply target the container class type
      if (context.reference.$refText === "this" || context.reference.$refText === "super") {
        const classItem = AstUtils.getContainerOfType(context.container, isClass);
        if (classItem) {
          return this.scopeClassMembers(classItem);
        } else {
          return EMPTY_SCOPE;
        }
      }
      const memberCall = context.container as MemberCall;
      const previous = memberCall.previous;
      if (!previous) {
        // console.log("    previous is null");
        this.findVariableNames(context.container);
        const filtered = this.variables.filter((v) => v.name == context.reference.$refText);
        if (filtered && filtered.length != 0) {
          const elements = filtered.map((f) => f.node);
          const s = stream(elements)
            .map((e) => {
              const name = context.reference.$refText; //this.nameProvider.getName(e);
              if (name) {
                return this.descriptions.createDescription(e, name);
              }
              return undefined;
            })
            .nonNullable();
          return new StreamScope(s);
        }
        return super.getScope(context);
      }

      // console.log("    previous is", previous.$type);
      if (isMemberCall(previous)) {
        // console.log("    previous's this:", previous.this);
        if (previous.this == "this") {
          const classItem = AstUtils.getContainerOfType(context.container, isClass); //previous면 안됨
          if (classItem) {
            return this.scopeClassMembers(classItem);
          } else {
            return EMPTY_SCOPE;
          }
        }
      }

      const prevTypeDesc = this.inferType(previous, new Map());
      if (prevTypeDesc.$type === "class") {
        // console.log("FIND Class:", previous.$type, prevTypeDesc.class?.$type, isClass(prevTypeDesc.class));
        if (prevTypeDesc.class) return this.scopeClassMembers(prevTypeDesc.class);
      }

      // When the target of our member call isn't a class
      // This means it is either a primitive type or a type resolution error
      // Simply return an empty scope
      return EMPTY_SCOPE;
    }
    return super.getScope(context);
  }

  private inferType(node: AstNode | undefined, cache: Map<AstNode, TypeDescription>): TypeDescription {
    // console.log("enter inferType: node=", node?.$type);
    let type: TypeDescription | undefined;
    if (!node) {
      return {
        $type: "error",
        message: "Could not infer type for undefined",
      };
    }

    const existing = cache.get(node);
    if (existing) {
      return existing;
    }

    // Prevent recursive inference errors
    cache.set(node, {
      $type: "error",
      message: "Recursive definition",
    });

    if (isMemberCall(node)) {
      // console.log("node.element?.$refText:", node.element?.$refText);
      type = this.inferMemberCall(node, cache);
      if (node.explicitCall) {
        if (type.$type == "method") {
          type = type.returnType;
        }
      }
    } else if (isVariableDeclaration(node)) {
      // 단일 대입문인 경우
      // console.log("variable name:", node.name);
      // console.log("variable name:", node.names);
      if (node.type) {
        type = this.inferType(node.type, cache);
      } else if (node.value) {
        type = this.inferType(node.value, cache);
      } else {
        type = {
          $type: "error",
          message: "No type hint for this element",
        };
      }
    } else if (isClass(node)) {
      // console.log("class name:", node.name);
      type = {
        $type: "class",
        class: node,
      };
    } else if (isField(node)) {
      // console.log("field name:", node.name);
      if (node.type) type = this.inferTypeRef(node.type, cache);
    } else if (isMethod(node)) {
      // console.log("method name:", node.name);
      // type = {
      //   $type: "class",
      //   class: node,
      // };
    } else if (isType(node)) {
      type = this.inferTypeRef(node, cache);
    }

    if (!type) {
      type = {
        $type: "error",
        message: "Could not infer type for " + node.$type,
      };
    }

    cache.set(node, type);
    // console.log("return inferType: type=", type.$type, type.message);
    return type;
  }

  private inferMemberCall(node: MemberCall, cache: Map<AstNode, TypeDescription>): TypeDescription {
    // console.log("ref 참조전:", node.element?.$refText);
    const element = node.element?.ref;
    // console.log("ref 참조후:", node.element?.$refText);
    if (element) {
      return this.inferType(element, cache);
    } else if (node.explicitCall && node.previous) {
      const previousType = this.inferType(node.previous, cache);
      if (previousType.$type == "method") {
        if (previousType.returnType) return previousType.returnType;
      }
      return {
        $type: "error",
        message: "Cannot call operation on non-function type",
      };
    }
    return {
      $type: "error",
      message: "Could not infer type for element " + node.element?.$refText,
    };
  }

  private inferTypeRef(node: Type, cache: Map<AstNode, TypeDescription>): TypeDescription {
    if (node.primitive) {
      if (node.primitive === "number") {
        return { $type: "number" };
      } else if (node.primitive === "string") {
        return { $type: "string" };
      } else if (node.primitive === "boolean") {
        return { $type: "boolean" };
      } else if (node.primitive === "void") {
        return { $type: "void" };
      }
    } else if (node.reference) {
      if (node.reference.ref) {
        // console.log("node.reference.ref", node.reference.$refText);
        const ref = node.reference.ref;
        if (isClass(ref)) {
          return {
            $type: "class",
            class: ref,
          };
        } else if (isTypeDeclaration(ref)) {
          return {
            $type: "object",
            object: ref.value,
          };
        }
      }
    } else if (isLambdaType(node)) {
      // console.log("this is lambda type");
    } else if (isArrayType(node)) {
      // console.log("this is array type");
    } else if (isTupleType(node)) {
      // console.log("this is tuple type");
    } else if (isObjectType(node)) {
      // console.log("this is object type");
    }
    return {
      $type: "error",
      message: "Could not infer type for this reference",
    };
  }

  private scopeClassMembers(classItem: Class): Scope {
    // Since Lox allows class-inheritance,
    // we also need to look at all members of possible super classes for scoping
    const allMembers = this.getClassChain(classItem).flatMap((e) => e.members);
    // console.log(allMembers.map((m) => m.name));
    return this.createScopeForNodes(allMembers);
  }

  private getClassChain(classItem: Class): Class[] {
    const set = new Set<Class>();
    let value: Class | undefined = classItem;
    while (value && !set.has(value)) {
      set.add(value);
      value = value.superClass?.ref;
    }
    // Sets preserve insertion order
    return Array.from(set);
  }
}
