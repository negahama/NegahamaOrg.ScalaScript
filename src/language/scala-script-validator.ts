import { AstNode, AstUtils, type ValidationAcceptor, type ValidationChecks } from "langium";
import {
  Variable,
  Class,
  Method,
  UnaryExpression,
  BinaryExpression,
  isReturnExpression,
  type Assignment,
  type ScalaScriptAstType,
} from "./generated/ast.js";
import type { ScalaScriptServices } from "./scala-script-module.js";
import { TypeSystem, TypeDescription } from "./scala-script-types.js";
import { ClassComponent } from "../components/class-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { BinaryExpressionComponent, UnaryExpressionComponent } from "../components/expression-components.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScalaScriptValidator;
  const checks: ValidationChecks<ScalaScriptAstType> = {
    Class: validator.checkClassDeclaration,
    Method: validator.checkMethodReturnType,
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
  checkClassDeclaration(declaration: Class, accept: ValidationAcceptor): void {
    ClassComponent.validationChecks(declaration, accept);
  }

  /**
   *
   * @param expr
   * @param accept
   */
  checkVariableDeclaration(expr: Variable, accept: ValidationAcceptor): void {
    VariableComponent.validationChecks(expr, accept);
  }

  /**
   *
   * @param expr
   * @param accept
   */
  checkAssignment(expr: Assignment, accept: ValidationAcceptor): void {
    AssignmentComponent.validationChecks(expr, accept);
  }

  /**
   *
   * @param unary
   * @param accept
   */
  checkUnaryOperationAllowed(unary: UnaryExpression, accept: ValidationAcceptor): void {
    UnaryExpressionComponent.validationChecks(unary, accept);
  }

  /**
   *
   * @param binary
   * @param accept
   */
  checkBinaryOperationAllowed(binary: BinaryExpression, accept: ValidationAcceptor): void {
    BinaryExpressionComponent.validationChecks(binary, accept);
  }

  /**
   *
   * @param method
   * @param accept
   * @returns
   */
  checkMethodReturnType(method: Method, accept: ValidationAcceptor): void {
    // console.log("checkMethodReturnType");
    if (method.body && method.returnType) {
      const map = getTypeCache();
      const returnStatements = AstUtils.streamAllContents(method.body).filter(isReturnExpression).toArray();
      const expectedType = TypeSystem.inferType(method.returnType, map);
      if (returnStatements.length === 0 && !TypeSystem.isVoidType(expectedType)) {
        accept("error", "A function whose declared type is not 'void' must return a value.", {
          node: method.returnType,
        });
        return;
      }
      for (const returnStatement of returnStatements) {
        const returnValueType = TypeSystem.inferType(returnStatement, map);
        if (!isAssignable(returnValueType, expectedType)) {
          accept(
            "error",
            `Type '${TypeSystem.typeToString(returnValueType)}' is not assignable to type '${TypeSystem.typeToString(
              expectedType
            )}'.`,
            {
              node: returnStatement,
            }
          );
        }
      }
    }
  }
}

/**
 *
 * @param operator
 * @param left
 * @param right
 * @returns
 */
export function isLegalOperation(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  if (operator === "+") {
    if (!right) return left.$type === "number";
    return left.$type === "number" && right.$type === "number";
  } else if (operator === "..") {
    if (!right) return left.$type === "string";
    return left.$type === "string" && right.$type === "string";
  } else if (["-", "+", "**", "*", "/", "%", "<", "<=", ">", ">="].includes(operator)) {
    if (!right) return left.$type === "number";
    return left.$type === "number" && right.$type === "number";
  } else if (["and", "or", "&&", "||"].includes(operator)) {
    return left.$type === "boolean" && right?.$type === "boolean";
  } else if (["not", "!"].includes(operator)) {
    return left.$type === "boolean" || left.$type === "string";
  }
  return true;
}

/**
 *
 * @param from
 * @param to
 * @returns
 */
export function isAssignable(from: TypeDescription, to: TypeDescription): boolean {
  if (TypeSystem.isClassType(from)) {
    if (!TypeSystem.isClassType(to)) {
      return false;
    }
    const fromLit = from.literal;
    const fromChain = TypeSystem.getClassChain(fromLit);
    const toClass = to.literal;
    for (const fromClass of fromChain) {
      if (fromClass === toClass) {
        return true;
      }
    }
    return false;
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

  // console.log("isAssignable:", from.$type, to.$type);
  return from.$type === to.$type;
}

/**
 *
 * @returns
 */
export function getTypeCache(): Map<AstNode, TypeDescription> {
  return new Map();
}
