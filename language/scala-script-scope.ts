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
import * as ast from "./generated/ast.js";
import { LangiumServices } from "langium/lsp";
import { TypeSystem } from "./scala-script-types.js";
import { enterLog, exitLog, traceLog } from "../language/scala-script-util.js";
import chalk from "chalk";

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
    const scopeLog = enterLog("getScope", scopeId);

    // target element of member calls
    if (context.property !== "element") {
      exitLog(scopeLog + "Exit4");
      return super.getScope(context);
    }

    // for now, `this` and `super` simply target the container class type
    // this, super가 [NamedElement:'this'] 인 경우에 호출된다. 지금처럼 keyword 인 경우에는
    // ref 처리가 되지 않아서 여기가 호출되지 않는다.
    if (context.reference.$refText === "this" || context.reference.$refText === "super") {
      const classItem = AstUtils.getContainerOfType(context.container, ast.isObjectDef);
      if (classItem) {
        traceLog("this or super");
        return this.scopeObjectDef(context, classItem);
      } else {
        console.error("this or super: empty");
        return EMPTY_SCOPE;
      }
    }

    // (isFunction?='(' Arguments? ')')? 와 같이 Arguments라는 fragment를 사용하면 Arguments를 그대로 대입한
    // args+=Expression ... 과 동작이 동일할 것 같은데 그렇지 않다. 실제로는 Arguments는 타입은 존재하진 않아도
    // args를 바로 사용하는 것과는 다른 규칙으로 존재하는 것으로 보이며 이로 인해 함수의 인수가 있는 경우 즉
    // callChain.args가 있는 경우에 AST node has no document 에러를 유발하게 된다. 개발 노트를 참고
    // 이 코드는 이를 확인하기 위한 것이다.
    const callChain = context.container as ast.CallChain;
    if (callChain.args == undefined) {
      traceLog("CallChain.args is undefined");
    }

    const previous = callChain.previous;
    traceLog(`CallChain.previous is ${previous?.$type}`);
    if (!previous) {
      const scope = super.getScope(context);
      exitLog(scopeLog + "Exit1");
      return scope;
    }

    // previous 의 타입을 추론한 결과가...
    const prevTypeDesc = TypeSystem.inferType(previous, new Map(), 1);

    // union type이면 포함된 타입중에 class, string, ... 등이 있는지 확인하고 있으면 이를 추론 타입으로 사용한다.
    let classDesc = prevTypeDesc;
    let stringDesc = prevTypeDesc;
    let numberDesc = prevTypeDesc;
    let arrayDesc = prevTypeDesc;
    let anyDesc = prevTypeDesc;
    if (TypeSystem.isUnionType(prevTypeDesc)) {
      for (const t of prevTypeDesc.elementTypes) {
        if (TypeSystem.isClassType(t)) {
          classDesc = t;
          break;
        }
        if (TypeSystem.isStringType(t)) {
          stringDesc = t;
          break;
        }
        if (TypeSystem.isNumberType(t)) {
          numberDesc = t;
          break;
        }
        if (TypeSystem.isArrayType(t)) {
          arrayDesc = t;
          break;
        }
        if (TypeSystem.isAnyType(t)) {
          anyDesc = t;
          break;
        }
      }
    }

    // 클래스이면
    // 해당 클래스와 이 클래스의 모든 부모 클래스의 모든 멤버들을 스코프로 구성해서 리턴한다.
    if (TypeSystem.isClassType(classDesc)) {
      traceLog(`FIND Class: ${previous.$type}, ${classDesc.literal?.$type}`);
      exitLog(scopeLog + "Exit2");
      if (ast.isObjectDef(classDesc.literal)) {
        return this.scopeObjectDef(context, classDesc.literal);
      } else if (ast.isObjectType(classDesc.literal)) {
        return this.scopeObjectType(context, classDesc.literal);
      } else {
        console.log(chalk.red("find class, but error:", classDesc.literal?.$type));
      }
    }

    // 문자열이면
    // 문자열이나 배열 관련 빌트인 함수들은 전역으로 class $string$ { ... } 형태로 저장되어져 있기 때문에
    // 전역 클래스 중 이름이 $string$인 것의 멤버들을 scope로 구성해서 리턴한다.
    else if (TypeSystem.isStringType(stringDesc)) {
      traceLog(`FIND string type: ${previous.$type}, ${stringDesc.literal?.$type}`);
      exitLog(scopeLog + "Exit2");
      return this.scopeSpecificClass(context, "$string$");
    }

    // number이면
    else if (TypeSystem.isNumberType(numberDesc)) {
      traceLog(`FIND number type: ${previous.$type}, ${numberDesc.literal?.$type}`);
      exitLog(scopeLog + "Exit2");
      return this.scopeSpecificClass(context, "$number$");
    }

    // 배열이면
    else if (TypeSystem.isArrayType(arrayDesc)) {
      traceLog(`FIND array type: ${previous.$type}, element-type:${arrayDesc.elementType.$type}`);
      exitLog(scopeLog + "Exit2");
      return this.scopeSpecificClass(context, "$array$");
    }

    // any 타입이면
    else if (TypeSystem.isAnyType(anyDesc)) {
      traceLog(`FIND any-type: ${previous.$type}`);
      exitLog(scopeLog + "Exit2");
      return this.scopeAnytype(context, previous);
    }

    // When the target of our member call isn't a class
    // This means it is either a primitive type or a type resolution error
    // Simply return an empty scope
    exitLog(scopeLog + "Exit3");
    return super.getScope(context);
  }

  /**
   *
   * @param context
   * @param classItem
   * @returns
   */
  private scopeObjectDef(context: ReferenceInfo, classItem: ast.ObjectDef): Scope {
    // console.log("find class, class name:", classItem.name);
    const allMembers = TypeSystem.getClassChain(classItem).flatMap((e) => e.body.elements);
    const removedBypass = allMembers.filter((e) => !ast.isBypass(e));
    removedBypass.forEach((e) => {
      if (ast.isVariableDef(e) || ast.isFunctionDef(e)) {
        traceLog("scopeObjectDef", e.name);
      }
    });
    return this.createScopeForNodes(removedBypass);
  }

  /**
   *
   * @param context
   * @param classType
   * @returns
   */
  private scopeObjectType(context: ReferenceInfo, classType: ast.ObjectType): Scope {
    // console.log("find object, object name:", classType.$cstNode?.text);
    const removedBypass = classType.elements.filter((e) => !ast.isBypass(e));
    removedBypass.forEach((e) => {
      if (ast.isVariableDef(e) || ast.isFunctionDef(e)) {
        traceLog("scopeObjectType", e.name);
      }
    });
    return this.createScopeForNodes(removedBypass);
  }

  /**
   *
   * @param context
   * @param className
   * @returns
   */
  private scopeSpecificClass(context: ReferenceInfo, className: string): Scope {
    // console.log("find specific class, class name:", className);
    const scope: Scope = this.getGlobalScope("ObjectDef", context);
    const sc = scope.getAllElements().find((d) => d.name == className);
    if (ast.isObjectDef(sc?.node)) {
      const allMembers = sc?.node.body.elements;
      if (allMembers) {
        // const names = allMembers.map((m) => m.$cstNode?.text ?? "unknown");
        // console.log(`FIND string: '${context.reference.$refText}' in`, names);
        return this.createScopeForNodes(allMembers);
      }
    }
    return super.getScope(context);
  }

  /**
   * any type의 경우 member 검사를 하지 않는다. 엄밀하게는 무조건 멤버를 생성하고 리턴한다.
   *
   * @param context
   * @param previous
   * @returns
   */
  private scopeAnytype(context: ReferenceInfo, previous: ast.Expression): Scope {
    // console.log("find any type, ref text:", context.reference.$refText);
    const elements: AstNode[] = [previous];
    const s = stream(elements)
      .map((e) => {
        const name = this.nameProvider.getName(e);
        if (name) return this.descriptions.createDescription(e, name);
        return this.descriptions.createDescription(e, context.reference.$refText);
      })
      .nonNullable();
    return new StreamScope(s);
  }
}
