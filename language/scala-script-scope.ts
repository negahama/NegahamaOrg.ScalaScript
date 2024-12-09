import { AstNode, AstUtils, DefaultScopeProvider, MapScope, ReferenceInfo, Scope, stream, StreamScope } from 'langium'
import * as ast from './generated/ast.js'
import { LangiumServices } from 'langium/lsp'
import { TypeSystem } from './scala-script-types.js'
import { enterLog, exitLog, traceLog } from './scala-script-util.js'
import { ScalaScriptCache } from './scala-script-cache.js'
import chalk from 'chalk'

/**
 * Provides scope resolution for ScalaScript language elements.
 * Extends the DefaultScopeProvider to handle specific scope requirements
 * for ScalaScript, including handling of type chains, call chains, and
 * built-in types like string, number, and array.
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
   * getScope()는 cross-reference를 처리하기 위해 호출된다는 점이 중요하다.
   *
   * 이것은 a.b 와 같은 구문에서 b가 무엇을 가르키는 것인지를 확인하기 위한 것이다.
   * 이를 위해서 a가 무엇인지를 먼저 파악하고 이것이 오브젝트이면 오브젝트의 프로퍼티 이름을 모두 제시해 준다.
   * 여기서는 b의 후보가 될 수 있는 것들을 제시만 할 뿐 실제 b를 결정하는 것은 linker에서 처리한다.
   * a가 문자열이거나 배열이고 b가 문자열이나 배열 관련 함수일 수도 있다.
   * 이들 string, number, array 함수 처리를 위해 내부 오브젝트가 라이브러리 형태로 등록되어져 있다.
   * 이들 string, number, array 관련 빌트인 함수들은 아래와 같은 형태로 저장되어져 있고
   * def $string$ = { ... }, def $number$ = { ... }, def $array$ = { ... }
   * 라이브러리로 빠져있기 때문에 전역 오브젝트로 되어져 있다. 따라서 previous가 string이면
   * 전역 오브젝트 중 이름이 $string$인 것의 프로퍼티들을 scope로 구성해서 리턴해 주면 된다.
   *
   * Scope caching에 대해서...
   * Scope에 대한 잦은 참조가 있기 때문에 이곳에서 caching을 사용하였는데
   * 이것은 편집시 편집 내용이 반영되지 않는 원인이 되었다.
   *
   * @param context
   * @returns
   */
  override getScope(context: ReferenceInfo): Scope {
    const refText = context.reference.$refText
    const scopeId = `${context.container.$type}.${context.property} = '${refText}'`
    const scopeLog = enterLog('getScope', scopeId)
    const superScope = super.getScope(context)

    // 현재 node의 ref를 구하는 것은 유용할 수 있지만 ref를 호출하면 그 ref의 scope를 처리하기 위해서
    // 다시 getScope가 호출되기 때문에 Error: Cyclic reference resolution detected 에러가 발생된다.
    // const refNode = context.reference.ref
    // console.log(`getScope: ${scopeId}, ${refNode?.$cstNode?.text}('${refNode?.$type})'`)

    // 타입의 참조는 따로 처리한다.
    if (ast.isTypeChain(context.container)) {
      const scope = this.scopeTypeChain(context, superScope)
      exitLog(scopeLog, undefined, 'Exit(typechain)')
      return scope
    }

    // check if the reference is CallChain or RefCall
    if (context.property !== 'element') {
      exitLog(scopeLog, undefined, 'Exit(NOT callchain)')
      return superScope
    }

    // // this, super가 [NamedElement:'this'] 인 경우에 호출된다.
    // // 지금처럼 keyword 인 경우에는 ref 처리가 되지 않아서 여기가 호출되지 않는다.
    // if (refText === 'this' || refText === 'super') {
    //   const objectDef = AstUtils.getContainerOfType(context.container, ast.isObjectDef)
    //   if (objectDef) {
    //     traceLog('this or super')
    //     return this.scopeObjectDef(context, undefined, objectDef)
    //   } else {
    //     console.error(chalk.red('this or super is empty in scopes.ts'))
    //     return EMPTY_SCOPE
    //   }
    // }

    const callChain = context.container as ast.CallChain

    // (isFunction?='(' Arguments? ')')? 와 같이 Arguments라는 fragment를 사용하면 Arguments를 그대로 대입한
    // args+=Expression ... 과 동작이 동일할 것 같은데 그렇지 않다. 실제로는 Arguments는 타입은 존재하진 않아도
    // args를 바로 사용하는 것과는 다른 규칙으로 존재하는 것으로 보이며 이로 인해 함수의 인수가 있는 경우 즉
    // callChain.args가 있는 경우에 AST node has no document 에러를 유발하게 된다. 개발 노트를 참고
    // 이 코드는 이를 확인하기 위한 것이다.
    // if (callChain.args == undefined) {
    //   traceLog(`'${refText}'.args is undefined`)
    // }

    const previous = callChain.previous
    traceLog(`'${refText}'.previous is '${previous?.$cstNode?.text}'(${previous?.$type})`)
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

    // previous 의 타입을 추론한 결과가...
    const prevTypeDesc = TypeSystem.inferType(previous)

    // union type이면 포함된 타입중에 class, string, ... 등이 있는지 확인하고 있으면 이를 추론 타입으로 사용한다.
    let classDesc = prevTypeDesc
    let stringDesc = prevTypeDesc
    let numberDesc = prevTypeDesc
    let arrayDesc = prevTypeDesc
    let anyDesc = prevTypeDesc
    if (TypeSystem.isUnionType(prevTypeDesc)) {
      for (const t of prevTypeDesc.elementTypes) {
        if (TypeSystem.isObjectType(t)) {
          classDesc = t
          break
        }
        if (TypeSystem.isStringType(t)) {
          stringDesc = t
          break
        }
        if (TypeSystem.isNumberType(t)) {
          numberDesc = t
          break
        }
        if (TypeSystem.isArrayType(t)) {
          arrayDesc = t
          break
        }
        if (TypeSystem.isAnyType(t)) {
          anyDesc = t
          break
        }
      }
    }

    traceLog(`Finding scope: curr: ${refText}, previous: '${previous.$cstNode?.text}'`)

    let scope: Scope | undefined
    if (TypeSystem.isObjectType(classDesc)) {
      if (ast.isObjectDef(classDesc.node)) {
        scope = this.scopeObjectDef(context, previous, classDesc.node)
      } else if (ast.isObjectType(classDesc.node)) {
        scope = this.scopeObjectType(context, previous, classDesc.node)
      } else {
        console.error(chalk.red('internal error in classDesc:', classDesc))
      }
    } else if (TypeSystem.isStringType(stringDesc)) {
      scope = this.scopeString(context, previous)
    } else if (TypeSystem.isNumberType(numberDesc)) {
      scope = this.scopeNumber(context, previous)
    } else if (TypeSystem.isArrayType(arrayDesc)) {
      scope = this.scopeArray(context, previous)
    } else if (TypeSystem.isAnyType(anyDesc)) {
      scope = this.scopeAny(context, previous)
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
  scopeTypeChain(context: ReferenceInfo, superScope: Scope): Scope {
    const typeChain = context.container as ast.TypeChain
    const log = enterLog('scopeTypeChain', typeChain.$cstNode?.text)

    // generic의 추가로 TypeChain에서 superScope로 처리되지 않는 즉 reference가 없는 경우가 생긴다.
    // generic의 Id로 예를들어 T, K, V 등이 사용될때 이것과 동일한 이름의 오브젝트가 존재하는 경우에도 문제가 된다.
    // 그래서 먼저 generic인지를 확인하고 generic이면 새로운 scope를 생성해서 리턴한다.
    const container = AstUtils.getContainerOfType(context.container, ast.isObjectDef)
    if (container && container.generic?.types.includes(context.reference.$refText)) {
      const s = this.descriptions.createDescription(context.container, context.reference.$refText)
      const scope = new MapScope([s])
      exitLog(log, undefined, 'Exit(make scope for generic)')
      return scope
    }

    const previous = typeChain.previous
    traceLog(`TypeChain.previous is ${previous?.$type}`)
    if (!previous) {
      exitLog(log, undefined, 'Exit(NO previous)')
      return superScope
    }

    // previous 의 타입을 추론한 결과가...
    const prevTypeDesc = TypeSystem.inferType(previous)

    //todo 타입인데...
    // 클래스이면 해당 클래스와 이 클래스의 모든 부모 클래스의 모든 멤버들을 스코프로 구성해서 리턴한다.
    if (TypeSystem.isObjectType(prevTypeDesc)) {
      traceLog(`FIND Class: ${previous.$type}, ${prevTypeDesc.node?.$type}`)
      console.log(`FIND Class: ${previous.$type}, ${prevTypeDesc.node?.$type}`)
      if (!ast.isObjectType(prevTypeDesc.node)) {
        console.error(chalk.red('internal error: prevTypeDesc is not object type:', prevTypeDesc.node.$type))
        return superScope
      }
      const removedBypass = prevTypeDesc.node.elements.filter(e => !ast.isBypass(e))
      const scope = this.createScopeForNodes(removedBypass)
      exitLog(log, prevTypeDesc, 'Exit6')
      return scope
    } else console.error(chalk.red('internal error in typechain:', prevTypeDesc))
    return superScope
  }

  /**
   * 아래 함수들은 모두 동일한 메커니즘으로 동작한다.
   * 예를 들어 corp.process() 이란 구문이 있을 때 현재 값(context.reference)은 process인데
   * 이것의 scope를 제공하기 위해서 corp를 찾는다. corp의 종류에 따라서 ObjectDef, ObjectType, any type등으로
   * 나눠지지만 모두 corp에서 가능한 모든 이름을 Scope로 리턴한다.
   */
  /**
   * Retrieves the scope for a specific class within the given context.
   *
   * @param context - The reference information context.
   * @param className - The name of the class for which the scope is being retrieved.
   * @param object - An optional object definition to use for creating the scope.
   * @returns The scope associated with the specified class.
   *
   * This method first checks if the scope is cached locally. If not, it attempts to create the scope
   * by examining the class chain and filtering out bypass elements. If the class is found in the global
   * scope and is exported, it caches and returns the scope. If an object definition is provided, it creates
   * and caches the scope locally. If none of these conditions are met, it logs an error and returns the
   * default scope from the superclass.
   */
  /*
    이 함수는 previous의 추론 타입이 object이고 ref의 astNode가 ObjectDef인 경우에 호출된다.
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

    Corp.process()

    var corp = new Corp()
    corp.process()

    val f = (Corp: Corp) => {
      return Corp.process
    }
    ```
    위와 같은 코드가 있을 때 첫번째 process는 static으로 정의되어진 것이 호출되어야 한다.
    반면 두번째와 세번째 process static이 아닌 것이 호출되어야 한다.
    위 코드는 다음과 같이 나와야 한다.
    ```
    console.log(`scopeObjectDef: ${previous.$cstNode?.text}, staticOnly: ${staticOnly}`)

    scopeObjectDef: console, staticOnly: true
    scopeObjectDef: console, staticOnly: true
    scopeObjectDef: Corp, staticOnly: true
    scopeObjectDef: corp, staticOnly: false
    scopeObjectDef: Corp, staticOnly: false
    ``` 
  */
  scopeObjectDef(context: ReferenceInfo, previous: ast.Expression, object: ast.ObjectDef) {
    const log = enterLog('scopeObjectDef', object.$cstNode?.text)

    // previous와 object의 이름이 동일하면 일단 static으로 처리한다.
    let staticOnly = false
    const previousNodeText = previous?.$cstNode?.text
    if (previousNodeText && previousNodeText === object.name) {
      staticOnly = true
    }

    // 하지만 previous가 변수나 파라메터의 이름인 경우에는 static이 아닌 것으로 처리한다.
    const variableNode = ScalaScriptCache.findVariableDefWithName(previous, previousNodeText)
    if (variableNode) {
      staticOnly = false
    }

    let scope = this.getGlobalObjectDef(object.name, staticOnly, context)
    if (!scope) scope = this.createScopeWithOption(object, { staticOnly })
    exitLog(log)
    return scope
  }

  /**
   * Constructs a scope object for a given object type by including all members of the class
   * and its parent classes, if applicable.
   *
   * @param context - The reference information for the current context.
   * @param previous - The previous AST expression.
   * @param type - The object type for which the scope is being constructed.
   * @returns The constructed scope object.
   */
  /*
    이 함수는 previous의 추론 타입이 object이고 ref의 astNode가 ObjectType인 아래와 같은 경우에 호출된다.
    ```
    val result: {
      var 누적매출: number
      var 누적매입: number
    } = {
      누적매출: 0
      누적매입: 0
    }
    result.누적매출 += 1
    ```
  */
  scopeObjectType(context: ReferenceInfo, previous: ast.Expression, type: ast.ObjectType) {
    const log = enterLog('scopeObjectType', type.$cstNode?.text)

    // 클래스이면 해당 클래스와 이 클래스의 모든 부모 클래스의 모든 멤버들을 스코프로 구성해서 리턴한다.
    const removedBypass = type.elements.filter(e => !ast.isBypass(e))
    const scope = this.createScopeForNodes(removedBypass)
    exitLog(log)
    return scope
  }

  /**
   * Constructs the scope for string-related built-in functions.
   *
   * This method checks if the given context and previous expression indicate a string.
   * If so, it retrieves the global object definition for string-related functions,
   * which are stored globally in the form `def $string$ = { ... }`.
   *
   * @param context - The reference information for the current context.
   * @param previous - The previous AST expression.
   * @returns The scope containing members of the global object named `$string$`.
   */
  scopeString(context: ReferenceInfo, previous: ast.Expression) {
    const log = enterLog('scopeString')
    const scope = this.getGlobalObjectDef('$string$', false, context)
    exitLog(log)
    return scope
  }

  /**
   * Retrieves the global object definition for the number scope.
   *
   * @param context - The reference information context.
   * @param previous - The previous AST expression.
   * @returns The global object definition for the number scope.
   */
  scopeNumber(context: ReferenceInfo, previous: ast.Expression) {
    const log = enterLog('scopeNumber')
    const scope = this.getGlobalObjectDef('$number$', false, context)
    exitLog(log)
    return scope
  }

  /**
   * Retrieves the global object definition for an array scope.
   *
   * @param context - The reference information used to retrieve the scope.
   * @param previous - The previous AST expression.
   * @returns The global object definition for the array scope.
   */
  scopeArray(context: ReferenceInfo, previous: ast.Expression) {
    const log = enterLog('scopeArray')
    const scope = this.getGlobalObjectDef('$array$', false, context)
    exitLog(log)
    return scope
  }

  /**
   * Creates a scope for any type based on the provided context and previous expression.
   *
   * 이 코드는 DefaultScopeProvider의 createScopeForNodes()와 거의 동일하다.
   * 차이점은 원래 코드는 이름이 없으면 undefined를 리턴하지만 여기서는 이름이 없으면 이름을 생성해서 리턴한다.   *
   * 이는 expr이 any type이기 때문에 member 검사를 하지 않고 무조건 멤버가 있다고 보고 처리하는 것이다.
   * 이것 자체는 문제가 안되는데 이름이 있는 경우에는 문제가 될 수 있다.
   *
   * @param context - The reference information used to create the scope.
   * @param previous - The previous AST expression used as a starting point.
   * @returns A new scope containing the descriptions of the elements.
   */
  scopeAny(context: ReferenceInfo, previous: ast.Expression) {
    const log = enterLog('scopeAny', `ref text: ${previous.$cstNode?.text}, ${context.reference.$refText}`)
    const elements: AstNode[] = [previous]
    const s = stream(elements)
      .map(e => {
        const name = this.nameProvider.getName(e)
        if (name) {
          console.log(chalk.magenta('Name is provided in getScopeForAnytype:', name, e))
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
   * Creates a scope for the given object definition.
   *
   * @param obj - The object definition for which the scope is to be created.
   * @param options - Optional parameters to customize the scope creation.
   * @param options.staticOnly - If true, only static members will be included in the scope.
   * @returns The created scope for the given object definition.
   */
  private createScopeWithOption(
    obj: ast.ObjectDef,
    options: {
      staticOnly: boolean
    }
  ) {
    const allMembers = TypeSystem.getClassChain(obj).flatMap(e => e.body.elements)
    const removedBypass = allMembers.filter(e => !ast.isBypass(e))
    // for debugging...
    // removedBypass.forEach(e => {
    //   if (ast.isVariableDef(e) || ast.isFunctionDef(e) || ast.isObjectDef(e)) {
    //     console.log('  getScopeForObjectDef:', e.name)
    //   }
    // })

    if (options?.staticOnly) {
      const onlyStatic = removedBypass.filter(e =>
        (ast.isVariableDef(e) || ast.isFunctionDef(e)) && e.static ? true : false
      )
      return this.createScopeForNodes(onlyStatic)
    } else return this.createScopeForNodes(removedBypass)
  }

  /**
   * Retrieves the global object definition for a given name.
   *
   * @param name - The name of the global object definition to retrieve.
   * @param onlyStatic - A boolean indicating whether to retrieve only static definitions.
   * @param context - The reference information context.
   * @returns The scope of the global object definition if found and exported, otherwise undefined.
   */
  private getGlobalObjectDef(name: string, onlyStatic: boolean, context: ReferenceInfo) {
    const global = this.getGlobalScope('ObjectDef', context)
    const sc = global.getElement(name)
    if (sc) {
      const node = sc.node as ast.ObjectDef
      // 비록 Langium의 GlobalScope에는 존재하더라도 export되어진 것이 아니라면 사용하지 않는다.
      if (node.export) {
        return this.createScopeWithOption(node, { staticOnly: onlyStatic })
      }
    }
    return undefined
  }
}
