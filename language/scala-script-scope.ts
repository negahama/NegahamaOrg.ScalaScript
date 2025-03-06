import {
  AstNode,
  AstUtils,
  DefaultScopeComputation,
  DefaultScopeProvider,
  LangiumDocument,
  MapScope,
  PrecomputedScopes,
  ReferenceInfo,
  Scope,
  stream,
  StreamScope,
} from 'langium'
import * as ast from './generated/ast.js'
import { LangiumServices } from 'langium/lsp'
import { AnyTypeDescriptor, TypeDescriptor, TypeSystem, UnionTypeDescriptor } from './scala-script-types.js'
import { enterLog, exitLog, traceLog, reduceLog, findVariableDefWithName } from './scala-script-util.js'
import chalk from 'chalk'

/**
 * Provides scope resolution for ScalaScript language elements.
 * Extends the DefaultScopeProvider to handle specific scope requirements for ScalaScript,
 * including handling of type chains, call chains, and built-in types like string, number, and array.
 *
 * @extends DefaultScopeProvider
 */
export class ScalaScriptScopeProvider extends DefaultScopeProvider {
  /**
   * Creates an instance of the ScalaScript scope.
   *
   * @param services - The language services provided by Langium.
   */
  constructor(services: LangiumServices) {
    super(services)
  }

  /**
   * `getScope()`는 cross-reference를 처리하기 위해 호출된다는 점이 중요하다.
   *
   * 이것은 `a.b` 와 같은 구문에서 `b`가 무엇을 가르키는 것인지를 확인하기 위한 것이다.
   * 예를 들어 `corp.process()` 이란 구문이 있을 때 현재 값(`context.reference`)은 `process`이지만
   * 이것의 scope를 제공하기 위해서는 `corp`가 무엇인지를 먼저 파악하고 이것이 class이면 이 class의 프로퍼티 모두를
   * scope로 리턴해 준다. 이 scope에 `process`가 있으며 linker가 이를 인식하고 `corp.process`에서의 `process`가
   * 무엇인지를 정확히 알게 되는 것이다. 이 과정에서 `getScope()`가 재귀적으로 호출될 수 있다.
   *
   * `a`가 문자열이거나 배열이고 `b`가 문자열이나 배열 관련 함수일 수도 있다.
   * 이들 string, number, array 관련 빌트인 함수들은 `scala-script-library.ts`에 아래와 같은 형태로 저장되어져 있고
   * `def $string$ = { ... }, def $number$ = { ... }, def $array$ = { ... }`
   * 라이브러리로 빠져있기 때문에 전역 오브젝트로 되어져 있다.
   * 따라서 previous가 string type이면 전역 오브젝트 중 이름이 `$string$`인 것의 프로퍼티들을 scope로 구성해서 리턴해 주면 된다.
   *
   * scope를 매우 정밀하게 제공할 수도 있다.
   * 예를들면 `ary.push()`에서 `push`의 scope를 `def $array$`가 아니라 `push()` 함수 자체로 한정할 수도 있다.
   * 하지만 scope내의 element의 이름이 중복되는 경우가 아니라면 이 작업은 의미가 없다. Langium에서 대신 해 준다.
   *
   * Scope caching에 대해서...
   * Scope에 대한 잦은 참조가 있기 때문에 이곳에서 caching을 사용하였는데
   * 이것은 편집시 편집 내용이 실시간으로 반영되지 않는 원인이 되어 제거하었다.
   *
   * @param context
   * @returns
   */
  override getScope(context: ReferenceInfo): Scope {
    const refText = context.reference.$refText
    const scopeId = `${context.container.$type}.${context.property} = '${refText}'`
    const scopeLog = enterLog('getScope', undefined, scopeId)
    const superScope = super.getScope(context)

    // 현재 `node`의 `ref`를 구하는 것은 유용할 수 있지만 `ref`를 호출하면 그 `ref`의 scope를 처리하기 위해서
    // 다시 `getScope()`가 호출되기 때문에 `Error: Cyclic reference resolution detected` 에러가 생길 수 있다.
    // const refNode = context.reference.ref
    // console.log(`getScope: ${scopeId}, '${refNode?.$cstNode?.text}'(${refNode?.$type})`)

    // 타입의 참조는 따로 처리한다.
    // 이것은 generic과 같이 타입이라고 되어진 Id(예: T, K, V)가 ClassDef의 이름이 아닌 경우를 처리하기 위한 것이다.
    // generic의 Id는 `RefType`과 동일하지만 reference가 없기 때문에 새로운 scope를 제공해줘야 에러가 아닌 걸로 인식이 된다.
    // superScope에는 타입으로써 사용될 수 있는 모든 이름들이 포함되어져 있으며 superScope에 이미 있으면
    // `scopeRefType()`를 처리하지 않도록 하였으나 오히려 살짝 느려졌다.
    if (ast.isRefType(context.container)) {
      // && !superScope.getElement(context.reference.$refText)) {
      const scope = this.scopeRefType(context)
      exitLog(scopeLog, undefined, 'Exit(type-chain)')
      return scope ? scope : superScope
    }

    // check if the reference is CallChain or RefCall
    if (context.property !== 'element') {
      exitLog(scopeLog, undefined, 'Exit(NOT callchain)')
      return superScope
    }

    // this, super가 [NamedElement:'this'] 인 경우에 호출된다.
    // 지금처럼 keyword 인 경우에는 ref 처리가 되지 않아서 여기가 호출되지 않는다.
    // if (refText === 'this' || refText === 'super') {
    //   const classDef = AstUtils.getContainerOfType(context.container, ast.isClassDef)
    //   if (classDef) {
    //     traceLog('this or super')
    //     return this.scopeClass(context, undefined, classDef)
    //   } else {
    //     console.error(chalk.red('this or super is empty in scopes.ts'))
    //     return EMPTY_SCOPE
    //   }
    // }

    const previous = (context.container as ast.CallChain).previous
    traceLog(`'${refText}'.previous is '${reduceLog(previous?.$cstNode?.text)}'(${previous?.$type})`)
    if (!previous) {
      exitLog(scopeLog, undefined, 'Exit(NOT previous)')
      return superScope
    }

    // precomputedScopes가 있는지를 확인해 본다
    // let previousNode: AstNode | undefined = previous
    // const found = superScope.getAllElements().find(e => e.name == previous.$cstNode?.text)
    // if (found) {
    //   previousNode = found.node
    // }

    // 아래와 같이 CallChain을 inferType을 통하지 않고 ref로 처리할 수 있다.
    // 이 방법을 써도 결국은 ref의 타입이 무엇인지를 알아야 하기 때문에 inferType을 사용해야 한다.
    // 그리고 동일한 이름 즉 오브젝트나 변수(또는 함수)의 이름이 동일한 경우에는 ref가 제대로 되어져 있지 않기 때문에 문제가 된다.
    // let prevTypeDesc: TypeDescription | undefined
    // if (ast.isCallChain(previous)) {
    //   if (!previous.element || previous.$cstNode?.text == 'this' || previous.$cstNode?.text == 'super') {
    //     let scope: Scope | undefined
    //     const classItem = AstUtils.getContainerOfType(context.container, ast.isClassDef)
    //     if (classItem) scope = this.createScopeForNodes(classItem?.body.elements)
    //     exitLog(scopeLog, undefined, 'Exit1')
    //     return scope ? scope : superScope
    //   }
    //   const ref = previous.element?.ref
    //   if (!ref) {
    //     console.log(`ref is undefined`)
    //     return superScope
    //   }
    //   //console.log(chalk.blue(ref.name, ref.$cstNode?.text))
    //   prevTypeDesc = TypeSystem.inferType(ref).actual
    // } else {
    //   prevTypeDesc = TypeSystem.inferType(previous).actual
    // }

    // previous 의 타입을 추론한 결과가...
    const prevTypeDesc = TypeSystem.inferType(previous).actual

    let scope: Scope | undefined
    if (TypeSystem.isAnyType(prevTypeDesc)) {
      scope = this.scopeAny(context, previous)
    } else if (TypeSystem.isUnionType(prevTypeDesc)) {
      scope = this.scopeUnion(context, prevTypeDesc, previous)
    } else {
      const candidates = this.getCandidatesByType(context, prevTypeDesc, previous)
      scope = this.createScopeForNodes(candidates)
    }

    if (scope) {
      exitLog(scopeLog, prevTypeDesc, 'Exit1')
      return scope
    }

    // When the target of our member call isn't a class
    // This means it is either a primitive type or a type resolution error
    // Simply return an empty scope
    exitLog(scopeLog, prevTypeDesc, 'Exit(reach end)')
    return superScope
  }

  /**
   * Generates a scope based on the type chain of the given context and super scope.
   *
   * @param context - The reference information containing the type chain and reference details.
   * @param superScope - The parent scope to be used if no specific scope is found.
   * @returns A new scope based on the type chain or the super scope if no specific scope is found.
   *
   * This function performs the following steps:
   * 1. Retrieves the type chain from the context.
   * 2. Logs the entry into the function.
   * 3. Checks if the reference is found in the super scope.
   * 4. If not found, checks if the reference is a generic type and creates a new scope for it.
   * 5. If the reference is found, infers the type of the previous element in the type chain.
   * 6. If the previous element is an object type, creates a scope for the object type and its members.
   * 7. Returns the created scope or the super scope if no specific scope is found.
   */
  scopeRefType(context: ReferenceInfo): Scope | undefined {
    const log = enterLog('scopeRefType', context.container)

    // ClassDef의 generic Id를 처리하기 위한 것이다.
    // 이것은 generic을 가지는 class의 내부에서 generic Id를 처리하는 것이라서 generic Id와 동일한 이름의 class에 영향을 받지 않는다.
    // generic은 사용될 때 타입이 결정되므로 여기서 할 수 있는 것은 any type처럼 generic Id가 문제가 없도록
    // 적절한 scope를 제공해 주는 것이 전부이다.
    const classNode = AstUtils.getContainerOfType(context.container, ast.isClassDef)
    if (classNode && classNode.generic?.types.includes(context.reference.$refText)) {
      const desc = this.descriptions.createDescription(context.container, context.reference.$refText)
      const scope = new MapScope([desc])
      exitLog(log, undefined, 'Exit(make scope for generic)')
      return scope
    }
    // undefined를 리턴하면 superScope로 처리된다.
    exitLog(log)
    return undefined
  }

  /**
   * Creates a scope for any type based on the provided context and previous expression.
   *
   * 스칼라스크립트는 아직 몇몇 경우에 any type을 사용한다.
   * `JSON.parse()`과 같이 타입스크립트에서도 any type을 사용하는 함수들도 있지만 아직 완벽하게 처리되지 않은 몇몇 부분에서
   * any type을 사용함으로써 타입 검사를 회피하고 있다. any type을 사용하는 경우는 `scala-script-library.ts`를 참고한다.
   *
   * `scopeAny()`는 `DefaultScopeProvider`의 `createScopeForNodes()`와 거의 동일하다.
   * 차이점은 원래 코드는 이름이 없으면 undefined를 리턴하지만 여기서는 이름이 없으면 이름을 생성해서 리턴한다.
   *
   * 주의할 점은 이름이 있는지를 확인하는 대상은 previous이지만 이름이 없을 때 생성하는 대상은 current라는 것이다.
   * 예를들어 `corp.process()`에서 `process`의 scope를 검사할때 `corp`가 any type이면 previous인 `corp`의 이름이 있으면
   * 있는 걸 사용하고, 없으면 `corp`라는 이름을 생성하는 것이 아니라 `context.reference.$refText`인 `process`라는
   * 이름을 생성해서 리턴한다. 즉 `corp`가 any type이기 때문에 member 검사를 하지 않고 무조건 멤버가 있다고
   * 보고 처리하는 것이다.
   *
   * 문제는 이름이 있는 경우이다. 발생한 적이 없는 것 같긴 한데 이름이 있는 경우에는 `corp`를 넘기고 그렇지 않은 경우
   * `process`를 넘기는 것 자체가 잘못되어져 있고 이름이 있을 경우 `process`를 다시 확인하는 코드도 없어 문제가 될 수 있다.
   *
   * @param context - The reference information used to create the scope.
   * @param previous - The previous AST expression used as a starting point.
   * @returns A new scope containing the descriptions of the elements.
   */
  scopeAny(context: ReferenceInfo, previous: ast.Expression) {
    const log = enterLog('scopeAny', undefined, `ref text: ${previous.$cstNode?.text}, ${context.reference.$refText}`)
    // for debugging...
    // console.trace(chalk.red('scopeAny'), `ref text: ${previous.$cstNode?.text}, ${context.reference.$refText}`)
    const elements: AstNode[] = [previous]
    const s = stream(elements)
      .map(e => {
        const name = this.nameProvider.getName(e)
        if (name) {
          console.log(chalk.magenta('Name is provided in scopeAny:', name, e))
          return this.descriptions.createDescription(e, name)
        }
        return this.descriptions.createDescription(e, context.reference.$refText)
      })
      .nonNullable()
    const scope = new StreamScope(s)
    exitLog(log)
    return scope
  }

  /**
   * Computes the scope for a union type by considering all the types included in the union.
   * If the union type contains `any` type, it directly computes the scope for `any` type.
   * Otherwise, it gathers scope candidates for each type in the union and creates a combined scope.
   *
   * @param context - The reference information context.
   * @param type - The union type descriptor containing the types to be considered.
   * @param previous - The previous AST expression.
   * @returns The computed scope for the union type.
   */
  scopeUnion(context: ReferenceInfo, type: UnionTypeDescriptor, previous: ast.Expression) {
    const log = enterLog('scopeUnion', undefined, type.toString(), context.reference.$refText)

    // union type이면 포함된 타입 모두를 대상으로 scope를 구한다.
    // 단 any type이 포함되어져 있으면 다른 타입은 처리할 필요가 없다.
    let scope: Scope | undefined
    if (type.isContain(new AnyTypeDescriptor())) {
      scope = this.scopeAny(context, previous)
    } else {
      const candidates = type.elementTypes.map(t => this.getCandidatesByType(context, t, previous)).flat()
      // for debugging...
      // const names = candidates.map(e => (ast.isVariableDef(e) || ast.isFunctionDef(e) ? e.name : ''))
      // traceLog('candidates:', names.join(', '))
      scope = this.createScopeForNodes(candidates)
    }

    exitLog(log)
    return scope
  }

  /**
   * Retrieves candidate members based on the provided type and context.
   *
   * @param context - The reference information context.
   * @param type - The type descriptor to determine the candidates.
   * @param previous - The previous expression node.
   * @returns An array of AST nodes representing the candidate members.
   *
   * This function handles different types (class, object, string, number, array) and retrieves
   * the appropriate members based on the type. It also considers whether the members should be
   * static or instance members based on the context and previous expression.
   *
   * - For class types, it retrieves members from the class definition, considering static and instance members.
   * - For object types, it retrieves members from the object type definition.
   * - For string, number, and array types, it retrieves members from predefined global classes ('$string$', '$number$', '$array$').
   */
  getCandidatesByType(context: ReferenceInfo, type: TypeDescriptor, previous: ast.Expression) {
    /**
     * Retrieves candidate members from a class definition, either from the global scope or a provided node.
     *
     * @param name - The name of the class to retrieve candidates from.
     * @param node - An optional class definition node to retrieve candidates from if not found in the global scope.
     * @param staticOnly - A boolean indicating whether to retrieve only static members.
     * @returns An array of `AstNode` representing the candidate members.
     */
    const getCandidates = (name: string, node: ast.ClassDef | undefined = undefined, staticOnly: boolean = false) => {
      const staticFilter = (e: ast.ClassBodyElement) =>
        (ast.isVariableDef(e) || ast.isFunctionDef(e)) && e.static ? true : false
      const normalFilter = (e: ast.ClassBodyElement) =>
        (ast.isVariableDef(e) || ast.isFunctionDef(e)) && e.static ? false : true

      let result: AstNode[] = []
      // 먼저 local scope에서 찾아본다. node가 필요하고 export 여부를 검사하지 않는다.
      if (node) {
        const allMembers = TypeSystem.getClassChain(node).flatMap(e => e.body.elements)
        const removedBypass = allMembers.filter(e => !ast.isBypass(e))
        // for debugging...
        // removedBypass.forEach(e => {
        //   if (ast.isVariableDef(e) || ast.isFunctionDef(e)) {
        //     console.log('  createScopeWithOption:', e.name)
        //   } else console.log('  createScopeWithOption:', e.$type)
        // })

        let filter = normalFilter
        if (staticOnly) filter = staticFilter
        result = result.concat(removedBypass.filter(filter))
      }
      // local scope에서 찾았으면 리턴한다.
      if (result.length > 0) return result

      // 전역 스코프에서 찾아본다.
      const global = this.getGlobalScope('ClassDef', context)
      const clazz = global.getElement(name)
      if (clazz) {
        const classNode = clazz.node as ast.ClassDef
        // 비록 Langium의 GlobalScope에는 존재하더라도 export되어진 것이 아니라면 사용하지 않는다.
        if (classNode.export) {
          const allMembers = TypeSystem.getClassChain(classNode).flatMap(e => e.body.elements)
          const removedBypass = allMembers.filter(e => !ast.isBypass(e))
          let filter = normalFilter
          if (staticOnly) filter = staticFilter
          result = result.concat(removedBypass.filter(filter))
        }
      }

      return result
    }

    const log = enterLog('getCandidatesByType', undefined, type.toString(), context.reference.$refText)
    let candidates: AstNode[] = []

    if (TypeSystem.isClassType(type)) {
      /*
        ClassDef에서 static method 호출에 대해서...
        ```
        def Corp = {
          var name: string
          var process = () => {
            console.log('process')
          }
          static var process = () => {
            console.log('static process')
          }
        }

        Corp.process() // static method 호출

        var corp = new Corp()
        corp.process()

        val f = (Corp: Corp) => {
          return Corp.process
        }
        ```
        위와 같은 코드가 있을 때 첫번째 `Corp.process()`는 static으로 정의되어진 것이 호출되어야 한다.
        반면 두번째와 세번째 `process`는 static이 아닌 것이 호출되어야 한다.
        위 코드는 다음과 같이 나와야 한다.
        ```
        console.log(`scopeClass: ${previous.$cstNode?.text}, staticOnly: ${staticOnly}`)

        scopeClass: console, staticOnly: true
        scopeClass: console, staticOnly: true
        scopeClass: Corp, staticOnly: true
        scopeClass: corp, staticOnly: false
        scopeClass: Corp, staticOnly: false
        ``` 
      */
      // previous와 class의 이름이 동일하면 static으로 처리한다.
      let staticOnly = false
      const className = type.node.name
      const previousNodeText = previous?.$cstNode?.text
      if (previousNodeText && previousNodeText === className) {
        staticOnly = true
      }

      // 함수나 변수가 static이면 여기서 사용되는 this는 static property만을 대상으로 해야 한다.
      // 예를들면 static function = () => { this.something }에서 something이 static이어야 한다.
      // 이를 처리하기 위해서는 this가 포함된 함수나 변수가 정의된 유의미한 노드를 정확히 찾아야 하는데
      // 일단은 함수나 함수형 변수인 상위 노드들을 모두 검사해서 static이 있는지 확인한다.
      if (previousNodeText == 'this') {
        let item: AstNode | undefined = context.container
        while (item) {
          if (ast.isFunctionDef(item) || (ast.isVariableDef(item) && ast.isFunctionValue(item.value))) {
            if (item.static) {
              staticOnly = true
            }
          }
          item = item.$container
        }
      }

      // previous가 변수나 파라메터의 이름인 경우에는 static이 아닌 것으로 처리한다.
      const variableNode = findVariableDefWithName(previous, previousNodeText)
      if (variableNode) {
        staticOnly = false
      }

      // getGlobalClass()는 전역적인 ClassDef만을 대상으로 하므로 className을 사용한다.
      candidates = getCandidates(className, type.node, staticOnly)
    } else if (TypeSystem.isObjectType(type)) {
      /*
        previous의 추론 타입이 object일 때는 다른 것과 처리 과정이 사뭇 다르다.
        다른 것들은 모두 previous가 ClassDef의 형태로 존재하지만 이 경우는 ObjectType의 형태로 존재한다.
        아래와 같은 코드에서 previous인 result는 ObjectType이다.
        ```
        val result: {
          revenue: number
          expenditure: number
        } = {
          revenue: 0
          expenditure: 0
        }
        result.revenue += 1
        ```
      */
      // ObjectType, ObjectValue 모두를 대상으로 한다.
      if (ast.isObjectValue(type.node)) {
        // console.log(chalk.red('scopeObjectType: internal error, ObjectValue'))
        // console.log(`> previous '${previous.$cstNode?.text}'s type: ${type.toString()}`)
        candidates = type.node.elements.filter(e => !ast.isBypass(e))
      } else {
        candidates = type.node.elements.filter(e => !ast.isBypass(e))
      }
    } else if (TypeSystem.isStringType(type)) {
      candidates = getCandidates('$string$')
    } else if (TypeSystem.isNumberType(type)) {
      candidates = getCandidates('$number$')
    } else if (TypeSystem.isArrayType(type)) {
      candidates = getCandidates('$array$')
    }

    // for debugging...
    // candidates.forEach((e, i) => {
    //   console.log(`> candidate #${i}: '${e.$cstNode?.text}' (${e.$type})`)
    // })

    exitLog(log)
    return candidates
  }
}

/**
 *
 */
export class ScalaScriptScopeComputation extends DefaultScopeComputation {
  constructor(services: LangiumServices) {
    super(services)
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
      const container = node.$container
      if (container) {
        const name = this.nameProvider.getName(node)
        // traceLog(`node: ${node.$type} '${name}'`)
        if (name) {
          scopes.add(container, this.descriptions.createDescription(node, name, document))
        }
      }
    }

    const container = node.$container
    if (!container) return
    let isProcessed = false

    // Import 문에서의 이름을 처리한다
    if (ast.isImportStatement(node)) {
      const log = enterLog('ScopeComputation.processNode', node)
      node.import.forEach(e => {
        scopes.add(container, this.descriptions.createDescription(node, e, document))
      })
      exitLog(log)
      isProcessed = true
    }

    if (!isProcessed) {
      defaultProcess(node, document, scopes)
    }
  }
}
