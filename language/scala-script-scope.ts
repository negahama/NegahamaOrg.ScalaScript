import { AstNode, DefaultScopeProvider, ReferenceInfo, Scope, stream, StreamScope } from 'langium'
import * as ast from './generated/ast.js'
import { LangiumServices } from 'langium/lsp'
import { TypeSystem } from './scala-script-types.js'
import { enterLog, exitLog, traceLog } from '../language/scala-script-util.js'
import chalk from 'chalk'

/**
 *
 */
export class ScalaScriptScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumServices) {
    super(services)
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
   * Scope caching에 대해서...
   * 예를들어 다음과 같이 동일한 참조가 있을때 context, previous는 모두 다르다.
   * 즉 corp1을 처리할 때의 이들의 값과 corp2를 처리할때의 값이 다르기 때문에 context, previous를 키로 해서
   * 정보를 저장해도 다시 사용할 수 없다.
   * var corp1: Engine.Corp
   * var corp2: Engine.Corp
   *
   * 하지만 prevTypeDesc.literal는 동일하다. 이는 이 literal을 ref 를 통해서 얻었기 때문이다.
   * TypeSystem.inferTypeSimpleType()을 참고
   *
   * @param context
   * @returns
   */
  override getScope(context: ReferenceInfo): Scope {
    const refText = context.reference.$refText
    const scopeId = `${context.container.$type}.${context.property} = '${refText}'`
    const scopeLog = enterLog('getScope', scopeId)
    const superScope = super.getScope(context)

    // 타입의 참조는 따로 처리한다.
    if (ast.isTypeChain(context.container)) {
      const typeChain = context.container as ast.TypeChain
      const previous = typeChain.previous
      traceLog(`TypeChain.previous is ${previous?.$type}`)
      if (!previous) {
        exitLog(scopeLog, undefined, 'Exit(NO previous)')
        return superScope
      }

      // previous 의 타입을 추론한 결과가...
      const prevTypeDesc = TypeSystem.inferType(previous, new Map())

      // 클래스이면
      // 해당 클래스와 이 클래스의 모든 부모 클래스의 모든 멤버들을 스코프로 구성해서 리턴한다.
      if (TypeSystem.isObjectType(prevTypeDesc)) {
        traceLog(`FIND Class: ${previous.$type}, ${prevTypeDesc.literal?.$type}`)
        exitLog(scopeLog, prevTypeDesc, 'Exit6')
        return this.getScopeForObject(context, prevTypeDesc.literal)
      } else console.error(chalk.red('internal error in typechain:', prevTypeDesc))
      return superScope
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
    //     return this.getScopeForObject(context, objectDef)
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
    const prevTypeDesc = TypeSystem.inferType(previous, new Map())

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

    // 클래스이면
    // 해당 클래스와 이 클래스의 모든 부모 클래스의 모든 멤버들을 스코프로 구성해서 리턴한다.
    if (TypeSystem.isObjectType(classDesc)) {
      traceLog(`FIND class type: ${previous.$type}, ${classDesc.literal?.$type}, ${refText}`)
      exitLog(scopeLog, prevTypeDesc, 'Exit2')
      return this.getScopeForObject(context, classDesc.literal)
    }

    // 문자열이면
    // string, number, array 관련 빌트인 함수들은 전역으로 def $string$ = { ... } 형태로 저장되어져 있기 때문에
    // 전역 클래스 중 이름이 $string$인 것의 멤버들을 scope로 구성해서 리턴한다.
    else if (TypeSystem.isStringType(stringDesc)) {
      traceLog(`FIND string type: ${previous.$type}, ${stringDesc.literal?.$type}, ${refText}`)
      exitLog(scopeLog, prevTypeDesc, 'Exit2')
      return this.getScopeForObject(context, '$string$')
    }

    // number이면
    else if (TypeSystem.isNumberType(numberDesc)) {
      traceLog(`FIND number type: ${previous.$type}, ${numberDesc.literal?.$type}, ${refText}`)
      exitLog(scopeLog, prevTypeDesc, 'Exit2')
      return this.getScopeForObject(context, '$number$')
    }

    // 배열이면
    else if (TypeSystem.isArrayType(arrayDesc)) {
      traceLog(`FIND array type: ${previous.$type}, ${arrayDesc.elementType.$type}, ${refText}`)
      exitLog(scopeLog, prevTypeDesc, 'Exit2')
      return this.getScopeForObject(context, '$array$')
    }

    // any 타입이면
    else if (TypeSystem.isAnyType(anyDesc)) {
      traceLog(`FIND any-type: ${previous.$type}, ${refText}`)
      exitLog(scopeLog, prevTypeDesc, 'Exit2')
      return this.getScopeForAnytype(context, previous)
    }

    // When the target of our member call isn't a class
    // This means it is either a primitive type or a type resolution error
    // Simply return an empty scope
    exitLog(scopeLog, prevTypeDesc, 'Exit(reach end)')
    return superScope
  }

  scopeCacheForObjectType = new Map<ast.ObjectType, Scope>()
  localScopeCacheForObjectDef = new Map<string, Scope>()
  globalScopeCacheForObjectDef = new Map<string, Scope>()

  /**
   * 아래 함수들은 모두 동일한 메커니즘으로 동작한다.
   * corp.process()에서 현재 값(context.reference)은 process인데 이것의 scope를 제공하기 위해서 corp를 찾는다.
   * corp의 종류에 따라서 ObjectDef, ObjectType, any type으로 나눠지지만 모두 corp에서 가능한 모든 이름을
   * Scope로 리턴한다.
   *
   * @param context
   * @param object
   * @returns
   */
  private getScopeForObject(
    context: ReferenceInfo,
    object: ast.ObjectDef | ast.ObjectType | ast.ObjectValue | string
  ): Scope {
    if (ast.isObjectDef(object)) {
      return this.getScopeForObjectDef(context, object.name, object)
    } else if (ast.isObjectType(object)) {
      return this.getScopeForObjectType(context, object)
    } else if (typeof object === 'string') {
      return this.getScopeForObjectDef(context, object)
    } else {
      console.error(chalk.red('find class, but error:', object?.$type, object.$cstNode?.text))
    }

    return super.getScope(context)
  }

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
  private getScopeForObjectDef(context: ReferenceInfo, className: string, object?: ast.ObjectDef): Scope {
    // console.log('getScopeForObjectDef, class name:', className)
    let scope = this.localScopeCacheForObjectDef.get(className)
    if (scope) return scope

    const createScope = (obj: ast.ObjectDef) => {
      const allMembers = TypeSystem.getClassChain(obj).flatMap(e => e.body.elements)
      const removedBypass = allMembers.filter(e => !ast.isBypass(e))
      // for debugging...
      // removedBypass.forEach(e => {
      //   if (ast.isVariableDef(e) || ast.isFunctionDef(e) || ast.isObjectDef(e)) {
      //     console.log('  getScopeForObjectDef:', e.name)
      //   }
      // })
      return this.createScopeForNodes(removedBypass)
    }

    //todo 지금은 참조시 등록되지만 선언시 등록되어야 한다.
    scope = this.getGlobalScope('ObjectDef', context)
    const sc = scope.getElement(className)
    if (sc) {
      const node = sc.node as ast.ObjectDef
      // 비록 Langium의 GlobalScope에는 존재하더라도 export되어진 것이 아니라면 사용하지 않는다.
      if (node.export) {
        scope = this.globalScopeCacheForObjectDef.get(className)
        if (scope) return scope

        scope = createScope(node)
        this.globalScopeCacheForObjectDef.set(className, scope)
        return scope
      }
    }

    if (ast.isObjectDef(object)) {
      scope = createScope(object)
      this.localScopeCacheForObjectDef.set(className, scope)
      return scope
    } else {
      console.error(chalk.red('internal error in getScopeForObjectDef', className))
    }
    return super.getScope(context)
  }

  /**
   * Retrieves the scope for a given object type. If the scope is already cached, it returns the cached scope.
   * Otherwise, it creates a new scope for the object type, caches it, and then returns it.
   *
   * @param context - The reference information context.
   * @param object - The object type for which the scope is to be retrieved.
   * @returns The scope associated with the given object type.
   */
  private getScopeForObjectType(context: ReferenceInfo, object: ast.ObjectType): Scope {
    let scope = this.scopeCacheForObjectType.get(object)
    if (scope) return scope

    // console.log('getScopeForObjectType, name:', object.$cstNode?.text)
    const removedBypass = object.elements.filter(e => !ast.isBypass(e))
    scope = this.createScopeForNodes(removedBypass)
    this.scopeCacheForObjectType.set(object, scope)
    return scope
  }

  /**
   * Create a scope for the given collection of AST nodes, which need to be transformed into respective
   * descriptions first. This is done using the `NameProvider` and `AstNodeDescriptionProvider` services.
   *
   * 이 코드는 DefaultScopeProvider의 createScopeForNodes()와 거의 동일하다.
   * 차이점은 원래 코드는 이름이 없으면 undefined를 리턴하지만 여기서는 이름이 없으면 이름을 생성해서 리턴한다.   *
   * 이는 expr이 any type이기 때문에 member 검사를 하지 않고 무조건 멤버가 있다고 보고 처리하는 것이다.
   * 이것 자체는 문제가 안되는데 이름이 있는 경우에는 문제가 될 수 있다.
   *
   * @param context - The reference information containing the context for the type.
   * @param expr - The AST expression node.
   * @returns A `Scope` object that represents the scope for the given type.
   */
  private getScopeForAnytype(context: ReferenceInfo, expr: ast.Expression): Scope {
    // console.log('getScopeForAnytype, ref text:', expr.$cstNode?.text, context.reference.$refText)
    const elements: AstNode[] = [expr]
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
    return new StreamScope(s)
  }
}
