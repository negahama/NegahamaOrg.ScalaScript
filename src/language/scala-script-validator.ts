import { AstNode, type ValidationAcceptor, type ValidationChecks } from "langium";
import * as ast from "./generated/ast.js";
import type { ScalaScriptServices } from "./scala-script-module.js";
import { TypeDescription, TypeSystem } from "./scala-script-types.js";
import { ClassComponent } from "../components/class-components.js";
import { FunctionComponent } from "../components/methodcall-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { BinaryExpressionComponent, UnaryExpressionComponent } from "../components/expression-components.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScalaScriptValidator;
  const checks: ValidationChecks<ast.ScalaScriptAstType> = {
    Class: validator.checkClassDeclaration,
    TFunction: validator.checkFunctionReturnType,
    Variable: validator.checkVariableDeclaration,
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
  checkClassDeclaration(declaration: ast.Class, accept: ValidationAcceptor): void {
    ClassComponent.validationChecks(declaration, accept);
  }

  /**
   *
   * @param expr
   * @param accept
   */
  checkVariableDeclaration(expr: ast.Variable, accept: ValidationAcceptor): void {
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
 *
 * @param from
 * @param to
 * @returns
 */
export function isAssignable(from: TypeDescription, to: TypeDescription): boolean {
  // console.log("isAssignable:", from.$type, to.$type);
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
