import { AstNode, AstUtils, type ValidationAcceptor, type ValidationChecks } from "langium";
import * as ast from "./generated/ast.js";
import type { ScalaScriptServices } from "./scala-script-module.js";
import { TypeDescription, TypeSystem } from "./scala-script-types.js";
import chalk from "chalk";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScalaScriptValidator;
  const checks: ValidationChecks<ast.ScalaScriptAstType> = {
    TObject: validator.checkClassDeclaration,
    TFunction: validator.checkFunctionReturnType,
    TVariable: validator.checkVariableDeclaration,
    Assignment: validator.checkAssignment,
    UnaryExpression: validator.checkUnaryOperationAllowed,
    BinaryExpression: validator.checkBinaryOperationAllowed,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ScalaScriptValidator {
  /**
   *
   * @param declaration
   * @param accept
   */
  checkClassDeclaration(declaration: ast.TObject, accept: ValidationAcceptor): void {
    // TODO: implement classes
    // console.log("checkClassDeclaration");
    // accept("error", "Classes are currently unsupported.", {
    //   node: declaration,
    //   property: "name",
    // });
  }

  /**
   *
   * @param expr
   * @param accept
   */
  checkVariableDeclaration(expr: ast.TVariable, accept: ValidationAcceptor): void {
    // console.log("checkVariableDeclaration");
    // const text = AstUtils.getDocument(expr).parseResult.value.$cstNode?.text;
    // const text = (AstUtils.getDocument(expr).parseResult.value.$cstNode as RootCstNode).fullText;
    // console.log(text);
    // const thenKeyword = GrammarUtils.findNodeForKeyword(expr.$cstNode, "=");
    // if (thenKeyword) {
    //   const index = thenKeyword.offset;
    //   const previousChar = text.charAt(index - 1);
    //   if (previousChar !== ' ') {
    //     acceptor('error', ...);
    //   }
    // }

    // console.log("    expr.names:", expr.names);
    // console.log("    expr.type:", `'${expr.type?.$cstNode?.text}'`);
    // console.log("    expr.value:", `${expr.value?.$type}, '${expr.value?.$cstNode?.text}'`);
    if (expr.type == undefined) {
      if (ast.isLiteral(expr.value)) {
        // console.log("    expr.value:", expr.value.$type, expr.value.value, typeof expr.value.value);
      }
    }
    if (expr.type && expr.value) {
      const map = getTypeCache();
      const left = TypeSystem.inferType(expr.type, map);
      let right = TypeSystem.inferType(expr.value, map);
      if (TypeSystem.isFunctionType(right)) right = right.returnType;

      if (!isAssignable(right, left)) {
        accept(
          "error",
          `Type '${TypeSystem.typeToString(right)}' is not assignable to type '${TypeSystem.typeToString(left)}'.`,
          {
            node: expr,
            property: "value",
          }
        );
      }
    } else if (!expr.type && !expr.value) {
      accept("error", "Variables require a type hint or an assignment at creation", {
        node: expr,
        property: "name",
      });
    }
  }

  /**
   *
   * @param expr
   * @param accept
   */
  checkAssignment(expr: ast.Assignment, accept: ValidationAcceptor): void {
    // console.log("checkAssignment");
    // console.log(`    left: ${expr.assign.$container.$type}, ${expr.assign.$type}, ${expr.assign.$cstNode?.text}`);
    // console.log(`    right: ${expr.value.$container.$type}, ${expr.value.$type}, ${expr.value.$cstNode?.text}`);
    const map = getTypeCache();
    const left = TypeSystem.inferType(expr.assign, map);
    let right = TypeSystem.inferType(expr.value, map);
    if (TypeSystem.isFunctionType(right)) right = right.returnType;

    if (!isAssignable(right, left)) {
      const msg = `Type '${TypeSystem.typeToString(right)}' is not assignable to type '${TypeSystem.typeToString(
        left
      )}'.`;
      accept("error", msg, {
        node: expr,
        property: "value",
      });
    }
  }

  /**
   *
   * @param unary
   * @param accept
   */
  checkUnaryOperationAllowed(unary: ast.UnaryExpression, accept: ValidationAcceptor): void {
    // console.log("checkUnaryOperationAllowed");
    const item = TypeSystem.inferType(unary.value, getTypeCache());
    if (!isLegalOperation(unary.operator, item)) {
      accept(
        "error",
        `Cannot perform operation '${unary.operator}' on value of type '${TypeSystem.typeToString(item)}'.`,
        {
          node: unary,
        }
      );
    }
  }

  /**
   *
   * @param binary
   * @param accept
   */
  checkBinaryOperationAllowed(binary: ast.BinaryExpression, accept: ValidationAcceptor): void {
    // console.log("checkBinaryOperationAllowed");
    // const expr = `'${binary.left.$cstNode?.text}' '${binary.operator}' '${binary.right.$cstNode?.text}'`;
    // console.log(`    expression: ${expr}`);

    const map = getTypeCache();
    const left = TypeSystem.inferType(binary.left, map);
    const right = TypeSystem.inferType(binary.right, map);
    // console.log(`    type1: ${left.$type}, ${right.$type}`);
    // console.log(`    type2: ${TypeSystem.typeToString(left)}, ${TypeSystem.typeToString(right)}`);
    if (!isLegalOperation(binary.operator, left, right)) {
      const msg =
        `Cannot perform operation '${binary.operator}' on values of type ` +
        `'${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}'.`;
      accept("error", msg, { node: binary });
    } else if (["==", "!="].includes(binary.operator)) {
      if (!isLegalOperation(binary.operator, left, right)) {
        const msg = `This comparison will always return '${
          binary.operator === "==" ? "false" : "true"
        }' as types '${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}' are not compatible.`;
        accept("warning", msg, {
          node: binary,
          property: "operator",
        });
      }
    }
  }

  /**
   *
   * @param method
   * @param accept
   * @returns
   */
  checkFunctionReturnType(method: ast.TFunction, accept: ValidationAcceptor): void {
    checkMethodReturnType(method, accept);
  }
}

/**
 *
 * @returns
 */
export function getTypeCache(): Map<AstNode, TypeDescription> {
  return new Map();
}

/**
 * 연산자가 적법한 타입을 취하는지 확인한다.
 * any type은 모든 타입과 연산이 가능하다.
 * nil type은 일반적으로는 모든 타입과 연산이 안되지만 연산자마다 조금씩 다르다
 *
 * @param operator
 * @param left
 * @param right
 * @returns
 */
export function isLegalOperation(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  // Union type이면 모든 내부 타입들을 하나씩 적용해서 적법한 연산이 있는지 확인한다.
  if (TypeSystem.isUnionType(left)) {
    for (const l of left.elementTypes) {
      if (right && TypeSystem.isUnionType(right)) {
        for (const r of right.elementTypes) {
          if (isLegalOperation_(operator, l, r)) return true;
        }
      } else return isLegalOperation_(operator, l, right);
    }
  } else {
    if (right && TypeSystem.isUnionType(right)) {
      for (const r of right.elementTypes) {
        if (isLegalOperation_(operator, left, r)) return true;
      }
    } else return isLegalOperation_(operator, left, right);
  }
  return false;
}

function isLegalOperation_(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  if (TypeSystem.isAnyType(left) || (right != undefined && TypeSystem.isAnyType(right))) {
    return true;
  }

  // 문자열 접합 연산자
  if (operator === "..") {
    if (!right) {
      console.log(chalk.red("internal error"));
      return false;
    }
    // 문자열 접합 연산자이지만 문자열이 아닌 다른 자료형은 암묵적 형변환을 한다고 가정한다.
    // 그렇다고 해도 숫자형과 boolean형만 가능하다.
    return (
      (TypeSystem.isStringType(left) || TypeSystem.isNumberType(left) || TypeSystem.isBooleanType(left)) &&
      (TypeSystem.isStringType(right) || TypeSystem.isNumberType(right) || TypeSystem.isBooleanType(right))
    );
  }

  // 동등 연산자
  else if (["==", "!="].includes(operator)) {
    if (!right) {
      console.log(chalk.red("internal error"));
      return false;
    }
    /**
     * 비교 가능한지를 리턴한다. 비교 가능한 경우는 다음과 같다.
     *
     * 두 대상의 타입이 동일한 경우
     * 한 대상의 타입이 any 타입인 경우
     * 한 대상의 타입이 nil 타입인 경우 - 모든 타입은 nil 인지를 검사할 수 있다.
     */
    if (
      TypeSystem.isAnyType(left) ||
      TypeSystem.isAnyType(right) ||
      TypeSystem.isNilType(left) ||
      TypeSystem.isNilType(right)
    ) {
      return true;
    }

    return left.$type === right.$type;
  }

  // plus, minus 연산자. Unary, Binary operator를 모두 포함한다.
  else if (["-", "+"].includes(operator)) {
    if (!right) return TypeSystem.isNumberType(left);
    return TypeSystem.isNumberType(left) && TypeSystem.isNumberType(right);
  }

  // 각종 산술 연산자, 비교 연산자
  else if (["**", "*", "/", "%", "<", "<=", ">", ">="].includes(operator)) {
    if (!right) {
      console.log(chalk.red("internal error"));
      return false;
    }
    // 모두 숫자 타입과 관련된 연산자이다
    return TypeSystem.isNumberType(left) && TypeSystem.isNumberType(right);
  }

  // 논리 연산자
  else if (["and", "or", "&&", "||"].includes(operator)) {
    if (!right) {
      console.log(chalk.red("internal error"));
      return false;
    }
    return TypeSystem.isBooleanType(left) && TypeSystem.isBooleanType(right);
  }

  // 부정(논리적 NOT) 단항 연산자는 문자열과 숫자에도 적용되는데 빈 문자열과 0 을 거짓으로 취급한다.
  else if (["not", "!"].includes(operator)) {
    return TypeSystem.isBooleanType(left) || TypeSystem.isStringType(left) || TypeSystem.isNumberType(left);
  }

  // typeof, instanceof 연산자
  else if (["typeof", "instanceof"].includes(operator)) {
    return true;
  }
  return true;
}

/**
 * any type은 모든 타입과 연산이 가능하며 nil type은 모든 타입과 가능한 연산이 없다.
 *
 * @param from
 * @param to
 * @returns
 */
export function isAssignable(from: TypeDescription, to: TypeDescription): boolean {
  // console.log(`isAssignable: ${to.$type} = ${from.$type}`);
  if (TypeSystem.isAnyType(from) || TypeSystem.isAnyType(to)) {
    return true;
  }
  if (TypeSystem.isNilType(from) || TypeSystem.isNilType(to)) {
    return false;
  }

  if (TypeSystem.isClassType(from)) {
    if (!TypeSystem.isClassType(to)) {
      return false;
    }
    // const fromLit = from.literal;
    // if (ast.isClass(fromLit)) {
    //   const fromChain = TypeSystem.getClassChain(fromLit);
    //   const toClass = to.literal;
    //   for (const fromClass of fromChain) {
    //     if (fromClass === toClass) {
    //       return true;
    //     }
    //   }
    // }
    // return false;
  }
  if (TypeSystem.isVoidType(from)) {
    return TypeSystem.isClassType(to);
  }
  if (TypeSystem.isFunctionType(from)) {
    if (!TypeSystem.isFunctionType(to)) {
      return false;
    }
    if (!isAssignable(from.returnType, to.returnType)) {
      return false;
    }
    if (from.parameters.length !== to.parameters.length) {
      return false;
    }
    for (let i = 0; i < from.parameters.length; i++) {
      const fromParam = from.parameters[i];
      const toParam = to.parameters[i];
      if (!isAssignable(fromParam.type, toParam.type)) {
        return false;
      }
    }
    return true;
  }

  return from.$type === to.$type;
}

/**
 *
 * @param method
 * @param accept
 * @returns
 */
export function checkMethodReturnType(method: ast.TFunction, accept: ValidationAcceptor): void {
  // console.log("checkMethodReturnType");
  if (method.body && method.returnType) {
    const map = getTypeCache();
    const returnStatements = AstUtils.streamAllContents(method.body).filter(ast.isReturnExpression).toArray();
    const expectedType = TypeSystem.inferType(method.returnType, map);
    if (returnStatements.length === 0 && !TypeSystem.isVoidType(expectedType)) {
      accept("error", "A function whose declared type is not 'void' must return a value.", {
        node: method.returnType,
      });
      return;
    }
    //todo
    // for (const returnStatement of returnStatements) {
    //   const returnValueType = TypeSystem.inferType(returnStatement, map);
    //   if (!isAssignable(returnValueType, expectedType)) {
    //     const msg = `Type '${TypeSystem.typeToString(
    //       returnValueType
    //     )}' is not assignable to type '${TypeSystem.typeToString(expectedType)}'.`;
    //     accept("error", msg, {
    //       node: returnStatement,
    //     });
    //   }
    // }
  }
}
