import {
  AstNode,
  // AstNodeDescription,
  // AstUtils,
  DefaultScopeComputation,
  DefaultScopeProvider,
  EMPTY_SCOPE,
  LangiumDocument,
  // interruptAndCheck,
  // MultiMap,
  PrecomputedScopes,
  ReferenceInfo,
  Scope,
  // stream,
  // Stream,
  // StreamScope,
} from "langium";
import {
  Class,
  isArrayType,
  isClass,
  isField,
  isMemberCall,
  isMethod,
  isType,
  isLambdaType,
  isObjectType,
  isTupleType,
  isTypeDeclaration,
  isVariableDeclaration,
  MemberCall,
  ObjectType,
  Type,
  Method,
} from "./generated/ast.js";
import { LangiumServices } from "langium/lsp";
// import { CancellationToken } from "vscode-languageserver";

export interface TypeDescription {
  $type: string;
  source?: AstNode;
  message?: string;
  class?: Class;
  object?: ObjectType;
  parameters?: FunctionParameter[];
  returnType?: TypeDescription;
}

export interface FunctionParameter {
  name: string;
  type: TypeDescription;
}

export function createErrorType(message: string, source?: AstNode): TypeDescription {
  return {
    $type: "error",
    message,
    source,
  };
}

const extensionFunctions: { type: string; name: string; node: Method }[] = [];

// function findExtensionByType(type: Type): string[] {
//   const result = extensionFunctions.filter((e) => type == e.type);
//   if (result.length > 0) return result.map((e) => e.name);
//   return [];
// }
// function findExtensionByName(name: string): Method | undefined {
//   const result = extensionFunctions.find((e) => name == e.name);
//   if (result) return result.node;
//   return undefined;
// }

export class ScalaScriptScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumServices) {
    super(services);
  }

  override getScope(context: ReferenceInfo): Scope {
    const scopeId = `${context.container.$type}.${context.property} = ${context.reference.$refText}`;
    console.log(`Enter getScope: ${scopeId}`);
    // const scopes: Array<Stream<AstNodeDescription>> = [];
    // const referenceType = this.reflection.getReferenceType(context);
    // const precomputed = AstUtils.getDocument(context.container).precomputedScopes;
    // if (precomputed) {
    //   let currentNode: AstNode | undefined = context.container;
    //   console.log("precomputed:");
    //   do {
    //     console.log("  currNode:", currentNode.$type);
    //     const allDescriptions = precomputed.get(currentNode);
    //     if (allDescriptions.length > 0) {
    //       allDescriptions.forEach((d) => {
    //         console.log("    " + d.name);
    //       });
    //       scopes.push(stream(allDescriptions).filter((desc) => this.reflection.isSubtype(desc.type, referenceType)));
    //     }
    //     currentNode = currentNode.$container;
    //   } while (currentNode);
    // }

    // console.log("global-scope:");
    // let result: Scope = this.getGlobalScope(referenceType, context);
    // result.getAllElements().forEach((d) => {
    //   console.log("  " + d.name);
    // });
    // for (let i = scopes.length - 1; i >= 0; i--) {
    //   result = this.createScope(scopes[i], result);
    // }
    // // return result;

    // target element of member calls
    if (context.property === "element") {
      // // for now, `this` and `super` simply target the container class type
      // if (context.reference.$refText === "this" || context.reference.$refText === "super") {
      //   const classItem = AstUtils.getContainerOfType(context.container, isClass);
      //   if (classItem) {
      //     return this.scopeClassMembers(classItem);
      //   } else {
      //     return EMPTY_SCOPE;
      //   }
      // }
      const memberCall = context.container as MemberCall;
      if (memberCall.args == undefined) {
        console.log("    memberCall.args is undefined");
      }

      const previous = memberCall.previous;
      if (!previous) {
        console.log("    previous is null");
        const scope = super.getScope(context);
        console.log(`Exit1 getScope: ${scopeId}`);
        return scope;
      }

      console.log(`    previous is ${previous.$type}`);
      // if (isMemberCall(previous)) {
      //   console.log("    previous's this:", previous.this);
      //   if (previous.this == "this") {
      //     const classItem = AstUtils.getContainerOfType(context.container, isClass); //previous면 안됨
      //     if (classItem) {
      //       return this.scopeClassMembers(classItem);
      //     } else {
      //       return EMPTY_SCOPE;
      //     }
      //   }
      // }

      const prevTypeDesc = this.inferType(previous, new Map(), 1);
      if (prevTypeDesc.$type === "class") {
        console.log(`    FIND Class: ${previous.$type}, ${prevTypeDesc.class?.$type}, ${isClass(prevTypeDesc.class)}`);
        if (prevTypeDesc.class) {
          console.log(`Exit2 getScope: ${scopeId}`);
          return this.scopeClassMembers(prevTypeDesc.class);
        }
      } else if (prevTypeDesc.$type === "string") {
        console.log(`    FIND string: ${previous.$type}`);
        const allMembers = this.getExtensionFunction();
        console.log(allMembers.map((m) => m.name));
        return this.createScopeForNodes(allMembers);
      }

      // When the target of our member call isn't a class
      // This means it is either a primitive type or a type resolution error
      // Simply return an empty scope
      console.log(`Exit3 getScope: ${scopeId}`);
      return EMPTY_SCOPE;
    }
    console.log(`Exit4 getScope: ${scopeId}`);
    return super.getScope(context);
  }

  private inferType(node: AstNode | undefined, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const inferTypeId = `node is ${node?.$type}`;
    const space = "    ".repeat(indent);
    const space2 = "    ".repeat(indent + 1);
    console.log(space + `Enter inferType: ${inferTypeId}`);

    let type: TypeDescription | undefined;
    if (!node) {
      console.log(space + `Exit1 inferType: ${inferTypeId}`);
      return createErrorType("Could not infer type for undefined", node);
    }

    const existing = cache.get(node);
    if (existing) {
      console.log(space + `Exit2 inferType: ${inferTypeId}`);
      return existing;
    }

    // Prevent recursive inference errors
    cache.set(node, createErrorType("Recursive definition", node));

    if (isMemberCall(node)) {
      console.log(space2 + "MemberCall name:", node.element?.$refText);
      type = this.inferMemberCall(node, cache, indent + 1);
      if (node.explicitCall) {
        console.log(space2 + "membercall is explicitCall");
        if (type.$type == "method") {
          type = type.returnType;
          console.log(space2 + "membercall is mehod:", type?.$type);
        }
      }
      console.log(space2 + "MemberCall END:", node.element?.$refText);
    } else if (isVariableDeclaration(node)) {
      console.log(space2 + "VariableDeclaration name:", node.names);
      if (node.type) {
        type = this.inferType(node.type, cache, indent + 1);
      } else if (node.value) {
        type = this.inferType(node.value, cache, indent + 1);
      } else {
        type = {
          $type: "error",
          message: "No type hint for this element",
        };
      }
    } else if (isClass(node)) {
      console.log(space2 + "Class name:", node.name);
      type = {
        $type: "class",
        class: node,
      };
    } else if (isField(node)) {
      console.log(space2 + "Field name:", node.name);
      if (node.type) type = this.inferTypeRef(node.type, cache);
      console.log(space2 + "result of inferTypeRef:", type?.$type);
    } else if (isMethod(node)) {
      console.log(space2 + "Method name:", node.name);
      console.log(space2 + "return type:");
      const returnType = this.inferType(node.returnType, cache, indent + 2);
      console.log(space2 + "parameters type:");
      const parameters = node.parameters.map((e) => ({
        name: e.name,
        type: this.inferType(e.type, cache, indent + 2),
      }));
      type = {
        $type: "method",
        parameters,
        returnType,
      };
    } else if (isType(node)) {
      console.log(space2 + "Node is Type");
      type = this.inferTypeRef(node, cache);
      console.log(space2 + "result of inferTypeRef:", type.$type);
    }

    if (!type) {
      type = createErrorType("Could not infer type for " + node.$type, node);
    }

    cache.set(node, type);
    console.log(space + `Exit3 inferType: ${inferTypeId},`, `type: ${type.$type}, message: ${type.message}`);
    return type;
  }

  private inferMemberCall(node: MemberCall, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const inferMemberCallId = node.element?.$refText;
    const space = "    ".repeat(indent);
    console.log(space + `Enter inferMemberCall: ${inferMemberCallId}`);
    console.log(space + "ref 참조전:", inferMemberCallId);
    const element = node.element?.ref;
    console.log(space + "ref 참조후:", inferMemberCallId);
    if (element) {
      return this.inferType(element, cache, indent + 1);
    } else if (node.explicitCall && node.previous) {
      const previousType = this.inferType(node.previous, cache, indent + 1);
      if (previousType.$type == "method") {
        if (previousType.returnType) {
          console.log(space + "Exit1 inferMemberCall:", inferMemberCallId);
          return previousType.returnType;
        }
      }
      console.log(space + "Exit2 inferMemberCall:", inferMemberCallId);
      return createErrorType("Cannot call operation on non-function type", node);
    }
    console.log(space + "Exit3 inferMemberCall:", inferMemberCallId);
    return createErrorType("Could not infer type for element " + node.element?.$refText, node);
  }

  private inferTypeRef(node: Type, cache: Map<AstNode, TypeDescription>): TypeDescription {
    if (node.primitive) {
      return { $type: node.primitive };
    } else if (node.reference) {
      if (node.reference.ref) {
        const ref = node.reference.ref;
        if (isClass(ref)) {
          return {
            $type: "class",
            class: ref,
          };
        } else if (isTypeDeclaration(ref)) {
          return {
            $type: "type-dec",
            object: ref.value,
          };
        } else {
          return { $type: "other-ref" };
        }
      } else {
        console.log("  it's not node.reference.ref");
      }
    } else if (isLambdaType(node)) {
      return { $type: "lambda" };
    } else if (isArrayType(node)) {
      return { $type: "array" };
    } else if (isTupleType(node)) {
      return { $type: "tuple" };
    } else if (isObjectType(node)) {
      return { $type: "object" };
    }
    return createErrorType("Could not infer type for this reference", node);
  }

  private scopeClassMembers(classItem: Class): Scope {
    // Since Lox allows class-inheritance,
    // we also need to look at all members of possible super classes for scoping
    const allMembers = this.getClassChain(classItem).flatMap((e) => e.members);
    console.log(allMembers.map((m) => m.name));
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

  private getExtensionFunction(): Method[] {
    return extensionFunctions.map((e) => e.node);
  }
}

export class ScalaScriptScopeComputation extends DefaultScopeComputation {
  constructor(services: LangiumServices) {
    super(services);
  }

  // override async computeExports(
  //   document: LangiumDocument,
  //   cancelToken = CancellationToken.None
  // ): Promise<AstNodeDescription[]> {
  //   const parentNode: AstNode = document.parseResult.value;
  //   const children: (root: AstNode) => Iterable<AstNode> = AstUtils.streamContents;
  //   const exports: AstNodeDescription[] = [];

  //   console.log("computeExports:");
  //   this.exportNode(parentNode, exports, document);
  //   for (const node of children(parentNode)) {
  //     await interruptAndCheck(cancelToken);
  //     this.exportNode(node, exports, document);
  //   }
  //   return exports;
  // }

  /**
   * Add a single node to the list of exports if it has a name. Override this method to change how
   * symbols are exported, e.g. by modifying their exported name.
   */
  // override exportNode(node: AstNode, exports: AstNodeDescription[], document: LangiumDocument): void {
  //   const name = this.nameProvider.getName(node);
  //   console.log("  node:", node.$type, name);
  //   if (name) {
  //     exports.push(this.descriptions.createDescription(node, name, document));
  //   }
  // }

  // override async computeLocalScopes(
  //   document: LangiumDocument,
  //   cancelToken = CancellationToken.None
  // ): Promise<PrecomputedScopes> {
  //   const rootNode = document.parseResult.value;
  //   const scopes = new MultiMap<AstNode, AstNodeDescription>();

  //   console.log("computeLocalScopes:");
  //   // Here we navigate the full AST - local scopes shall be available in the whole document
  //   for (const node of AstUtils.streamAllContents(rootNode)) {
  //     await interruptAndCheck(cancelToken);
  //     this.processNode(node, document, scopes);
  //   }
  //   return scopes;
  // }

  /**
   * Process a single node during scopes computation. The default implementation makes the node visible
   * in the subtree of its container (if the node has a name). Override this method to change this,
   * e.g. by increasing the visibility to a higher level in the AST.
   */
  override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
    const container = node.$container;
    if (container) {
      if (isVariableDeclaration(node)) {
        console.log("  node:", node.$type);
        node.names.forEach((name) => {
          console.log("    ", name);
          scopes.add(container, this.descriptions.createDescription(node, name, document));
        });
      } else if (isMethod(node)) {
        if (node.extension?.primitive) {
          console.log("extension function:", node.extension.primitive, node.name);
          extensionFunctions.push({ type: node.extension.primitive, name: node.name, node: node });
        }
      } else {
        const name = this.nameProvider.getName(node);
        console.log("  node:", node.$type, name);
        if (name) {
          scopes.add(container, this.descriptions.createDescription(node, name, document));
        }
      }
    }
  }
}
