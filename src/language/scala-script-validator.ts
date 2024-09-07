import { AstNode, type ValidationAcceptor, type ValidationChecks } from "langium";
import * as ast from "./generated/ast.js";
import type { ScalaScriptServices } from "./scala-script-module.js";
import { TypeDescription, TypeSystem } from "./scala-script-types.js";
import { ObjectComponent } from "../components/class-components.js";
import { FunctionComponent } from "../components/methodcall-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { BinaryExpressionComponent, UnaryExpressionComponent } from "../components/expression-components.js";
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
    ObjectComponent.validationChecks(declaration, accept);
  }

  /**
   *
   * @param expr
   * @param accept
   */
  checkVariableDeclaration(expr: ast.TVariable, accept: ValidationAcceptor): void {
    VariableComponent.validationChecks(expr, accept);
  }

  /**
   *
   * @param expr
   * @param accept
   */
  checkAssignment(expr: ast.Assignment, accept: ValidationAcceptor): void {
    AssignmentComponent.validationChecks(expr, accept);
  }

  /**
   *
   * @param unary
   * @param accept
   */
  checkUnaryOperationAllowed(unary: ast.UnaryExpression, accept: ValidationAcceptor): void {
    UnaryExpressionComponent.validationChecks(unary, accept);
  }

  /**
   *
   * @param binary
   * @param accept
   */
  checkBinaryOperationAllowed(binary: ast.BinaryExpression, accept: ValidationAcceptor): void {
    BinaryExpressionComponent.validationChecks(binary, accept);
  }

  /**
   *
   * @param method
   * @param accept
   * @returns
   */
  checkFunctionReturnType(method: ast.TFunction, accept: ValidationAcceptor): void {
    FunctionComponent.validationChecks(method, accept);
  }
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
 * @returns
 */
export function getTypeCache(): Map<AstNode, TypeDescription> {
  return new Map();
}
