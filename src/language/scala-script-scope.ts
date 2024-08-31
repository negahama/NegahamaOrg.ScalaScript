import {
  AstNode,
  AstUtils,
  DefaultScopeComputation,
  DefaultScopeProvider,
  EMPTY_SCOPE,
  LangiumDocument,
  PrecomputedScopes,
  ReferenceInfo,
  Scope,
} from "langium";
import * as ast from "./generated/ast.js";
import { LangiumServices } from "langium/lsp";
import { enterLog, traceLog, exitLog, TypeSystem } from "./scala-script-types.js";

/**
 *
 */
export class ScalaScriptScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumServices) {
    super(services);
  }

  /**
   * getScope()는 cross-reference를 처리하기 위해 호출된다는 점이 중요하다.
   *
   * 이것은 a.b 와 같은 구문에서 b가 무엇을 가르키는 것인지를 확인하기 위한 것이다.
   * 이를 위해서 a가 무엇인지를 먼저 파악하고 이것이 클래스이면 클래스의 멤버들 이름을 모두 제시해 준다.
   * 여기서는 b의 후보가 될 수 있는 것들을 제시만 할 뿐 실제 b를 결정하는 것은 linker에서 처리한다.
   * a가 문자열이거나 배열이고 b가 문자열이나 배열 관련 함수일 수도 있다.
   * 이를 위해서 확장 함수를 등록해 주고 이를 사용한다.
   *
   * @param context
   * @returns
   */
  override getScope(context: ReferenceInfo): Scope {
    const scopeId = `${context.container.$type}.${context.property} = '${context.reference.$refText}'`;
    const scopeLog = enterLog("getScope", scopeId, 0);

    // DefaultScopeProvider의 getScope() 코드이다.
    // Scope에 대한 default 처리가 어떻게 되는지 확인하기 위한 것이다.
    // // const scopes: Array<Stream<AstNodeDescription>> = [];
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
    //       // scopes.push(stream(allDescriptions).filter((desc) => this.reflection.isSubtype(desc.type, referenceType)));
    //     }
    //     currentNode = currentNode.$container;
    //   } while (currentNode);
    // }

    // console.log("global-scope:");
    // let result: Scope = this.getGlobalScope(referenceType, context);
    // result.getAllElements().forEach((d) => {
    //   console.log("  " + d.name);
    // });
    // // for (let i = scopes.length - 1; i >= 0; i--) {
    // //   result = this.createScope(scopes[i], result);
    // // }
    // // return result;

    // target element of member calls
    if (context.property !== "element") {
      exitLog(scopeLog.replace("Exit", "Exit4"));
      return super.getScope(context);
    }

    // for now, `this` and `super` simply target the container class type
    if (context.reference.$refText === "this" || context.reference.$refText === "super") {
      const classItem = AstUtils.getContainerOfType(context.container, ast.isClass);
      if (classItem) {
        traceLog(1, "this or super");
        return this.scopeClassMembers(classItem);
      } else {
        console.error("this or super: empty");
        return EMPTY_SCOPE;
      }
    }

    // (explicitCall?='(' Arguments? ')')? 와 같이 Arguments라는 fragment를 사용하면 Arguments를 그대로 대입한
    // args+=Expression ... 과 동작이 동일할 것 같은데 그렇지 않다. 실제로는 Arguments는 타입은 존재하진 않아도
    // args를 바로 사용하는 것과는 다른 규칙으로 존재하는 것으로 보이며 이로 인해 함수의 인수가 있는 경우 즉
    // methodCall.args가 있는 경우에 AST node has no document 에러를 유발하게 된다. 개발 노트를 참고
    // 이 코드는 이를 확인하기 위한 것이다.
    const methodCall = context.container as ast.MethodCall;
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

    // previous 의 타입을 추론한 결과가...
    const prevTypeDesc = TypeSystem.inferType(previous, new Map(), 1);

    // 클래스이면
    // 해당 클래스와 이 클래스의 모든 부모 클래스의 모든 멤버들을 스코프로 구성해서 리턴한다.
    if (TypeSystem.isClassType(prevTypeDesc)) {
      traceLog(1, `FIND Class: ${previous.$type}, ${prevTypeDesc.literal?.$type}`);
      exitLog(scopeLog.replace("Exit", "Exit2"));
      return this.scopeClassMembers(prevTypeDesc.literal);
    }

    // 문자열이면
    // 문자열이나 배열 관련 빌트인 함수들은 전역으로 class $string$ { ... } 형태로 저장되어져 있기 때문에
    // 전역 클래스 중 이름이 $string$인 것의 멤버들을 scope로 구성해서 리턴한다.
    else if (TypeSystem.isStringType(prevTypeDesc)) {
      traceLog(1, `FIND string: ${previous.$type}, ${prevTypeDesc.literal?.$type}`);
      exitLog(scopeLog.replace("Exit", "Exit2"));
      return this.scopeSpecificClassMembers(context, "$string$");
    }

    // 배열이면
    else if (TypeSystem.isArrayType(prevTypeDesc)) {
      traceLog(1, `FIND array: ${previous.$type}, element-type:${prevTypeDesc.elementType.$type}`);
      exitLog(scopeLog.replace("Exit", "Exit2"));
      return this.scopeSpecificClassMembers(context, "$array$");
    }

    // When the target of our member call isn't a class
    // This means it is either a primitive type or a type resolution error
    // Simply return an empty scope
    exitLog(scopeLog.replace("Exit", "Exit3"));
    return super.getScope(context);
  }

  /**
   *
   * @param classItem
   * @returns
   */
  private scopeClassMembers(classItem: ast.Class): Scope {
    // Since Lox allows class-inheritance,
    // we also need to look at all members of possible super classes for scoping
    const allMembers = TypeSystem.getClassChain(classItem).flatMap((e) => e.statements);
    const removedBypass = allMembers.filter((e) => !ast.isBypass(e));
    removedBypass.forEach((e) => {
      if (ast.isMethod(e) || ast.isField(e)) {
        traceLog(0, "scopeClassMembers", e.name);
      } else console.error("error");
    });
    return this.createScopeForNodes(removedBypass);
  }

  /**
   *
   * @param context
   * @param className
   * @returns
   */
  private scopeSpecificClassMembers(context: ReferenceInfo, className: string): Scope {
    const scope: Scope = this.getGlobalScope("Class", context);
    const sc = scope.getAllElements().find((d) => d.name == className);
    if (ast.isClass(sc?.node)) {
      const allMembers = sc?.node.statements;
      if (allMembers) {
        // const names = allMembers.map((m) => m.$cstNode?.text ?? "unknown");
        // console.log("FIND string:", names);
        return this.createScopeForNodes(allMembers);
      }
    }
    return super.getScope(context);
  }
}

/**
 *
 */
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
   *
   * 이 함수는 위의 computeLocalScopes()에서 rootNode부터 모든 contents에 대해서 호출된다.
   * 디폴트 동작은 NameProvider에서 해당 AstNode의 이름을 받아서 기타 정보들과 함께 description을 구성하고
   * 이를 precomputedScopes에 추가해 주는 것이다.
   *
   * 내 경우는 다중 대입문 지원으로 인해 변수 선언시 이름이 names에 있기 때문에 Langium의 디폴트 처리로는
   * 변수명을 인식하지 못하기 때문에 여기서 names에 있는 모든 이름을 등록해 주고, 매서드나 클래스 구문 중에서
   * 확장 함수가 있으면 이를 확장 함수 테이블에 등록해 준다.
   *
   * @param node
   * @param document
   * @param scopes
   */
  override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
    const defaultProcess = (node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes) => {
      const container = node.$container;
      if (container) {
        const name = this.nameProvider.getName(node);
        traceLog(0, `  node: ${node.$type} '${name}'`);
        if (name) {
          scopes.add(container, this.descriptions.createDescription(node, name, document));
        }
      }
    };

    const container = node.$container;
    if (!container) return;

    let isProcessed = false;

    // 변수 선언문에서의 이름을 처리한다
    if (ast.isVariable(node)) {
      traceLog(0, "  node:", node.$type);
      node.names.forEach((name) => {
        traceLog(1, `'${name}'`);
        scopes.add(container, this.descriptions.createDescription(node, name, document));
      });
      isProcessed = true;
    }

    // 함수 중에 확장 함수가 있으면 이를 처리한다.
    else if (ast.isMethod(node) && node.extension) {
      console.log("Not support...");
    }

    if (!isProcessed) {
      defaultProcess(node, document, scopes);
    }
  }
}
