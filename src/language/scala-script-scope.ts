import {
  AstNode,
  // AstNodeDescription,
  AstUtils,
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
import { Class, isClass, isMethod, isVariable, MethodCall, Method } from "./generated/ast.js";
import { LangiumServices } from "langium/lsp";
import { enterLog, traceLog, exitLog, getClassChain, inferType, isClassType } from "./scala-script-types.js";
// import { CancellationToken } from "vscode-languageserver";

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
    const scopeLog = enterLog("getScope", scopeId, 0);
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
    if (context.property !== "element") {
      exitLog(scopeLog.replace("Exit", "Exit4"));
      return super.getScope(context);
    }

    // for now, `this` and `super` simply target the container class type
    if (context.reference.$refText === "this" || context.reference.$refText === "super") {
      const classItem = AstUtils.getContainerOfType(context.container, isClass);
      if (classItem) {
        traceLog(1, "this or super");
        return this.scopeClassMembers(classItem);
      } else {
        console.error("this or super: empty");
        return EMPTY_SCOPE;
      }
    }

    const methodCall = context.container as MethodCall;
    if (methodCall.args == undefined) {
      traceLog(1, "MethodCall.args is undefined");
    }

    const previous = methodCall.previous;
    traceLog(1, `MethodCall.previous is ${previous?.$type}`);
    if (!previous) {
      const scope = super.getScope(context);
      exitLog(scopeLog.replace("Exit", "Exit1"));
      return scope;
    }

    const prevTypeDesc = inferType(previous, new Map(), 1);
    if (isClassType(prevTypeDesc)) {
      traceLog(1, `FIND Class: ${previous.$type}, ${prevTypeDesc.literal?.$type}, ${isClass(prevTypeDesc.literal)}`);
      exitLog(scopeLog.replace("Exit", "Exit2"));
      return this.scopeClassMembers(prevTypeDesc.literal);
    } else if (prevTypeDesc.$type === "string") {
      traceLog(1, `FIND string: ${previous.$type}`);
      const allMembers = this.getExtensionFunction();
      traceLog(
        0,
        "",
        allMembers.map((m) => m.name)
      );
      return this.createScopeForNodes(allMembers);
    }

    // When the target of our member call isn't a class
    // This means it is either a primitive type or a type resolution error
    // Simply return an empty scope
    exitLog(scopeLog.replace("Exit", "Exit3"));
    return super.getScope(context);
  }

  private scopeClassMembers(classItem: Class): Scope {
    // Since Lox allows class-inheritance,
    // we also need to look at all members of possible super classes for scoping
    const allMembers = getClassChain(classItem).flatMap((e) => e.members);
    traceLog(
      0,
      "",
      allMembers.map((m) => m.name)
    );
    return this.createScopeForNodes(allMembers);
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
    const defaultProcess = (node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes) => {
      const container = node.$container;
      if (container) {
        const name = this.nameProvider.getName(node);
        traceLog(0, "  node:", node.$type, name);
        if (name) {
          scopes.add(container, this.descriptions.createDescription(node, name, document));
        }
      }
    };

    const container = node.$container;
    if (container) {
      if (isVariable(node)) {
        traceLog(0, "  node:", node.$type);
        node.names.forEach((name) => {
          traceLog(1, name);
          scopes.add(container, this.descriptions.createDescription(node, name, document));
        });
      } else if (isMethod(node)) {
        if (node.extension?.primitive) {
          traceLog(0, "extension function:", node.extension.primitive, node.name);
          extensionFunctions.push({ type: node.extension.primitive, name: node.name, node: node });
        } else {
          defaultProcess(node, document, scopes);
        }
      } else {
        defaultProcess(node, document, scopes);
      }
    }
  }
}
