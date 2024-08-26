import { AstNode, AstUtils, type ValidationAcceptor, type ValidationChecks } from "langium";
import {
  BinaryExpression,
  Block,
  // Class,
  isReturnExpr,
  Method,
  Type,
  UnaryExpression,
  Variable,
  type Assignment,
  type ScalaScriptAstType,
} from "./generated/ast.js";
import type { ScalaScriptServices } from "./scala-script-module.js";
import {
  inferType,
  // isLegalOperation,
  typeToString,
  isAssignable,
  isVoidType,
  TypeDescription,
} from "./scala-script-types.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScalaScriptValidator;
  const checks: ValidationChecks<ScalaScriptAstType> = {
    Assignment: validator.checkAssignment,
    // Class: validator.checkClassDeclaration,
    BinaryExpression: validator.checkBinaryOperationAllowed,
    UnaryExpression: validator.checkUnaryOperationAllowed,
    Variable: validator.checkVariableDeclaration,
    Method: validator.checkMethodReturnType,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ScalaScriptValidator {
  checkAssignment(expr: Assignment, accept: ValidationAcceptor): void {
    // console.log("checkAssignment");
    // const left = expr.assign;
    // if (isMethodCall(left)) {
    //   //const element = left.element?.ref
    //   console.log("left:", left.element?.$refText, left.$type, left.$container);
    // }
    // const right = expr.value;
    // if (isLiteral(right)) {
    //   console.log(right.$container.$type);
    //   console.log("    right.value:", right.value, right.$type, typeof right.value);
    //   accept("warning", "Person name should start with a capital.", { node: expr, property: "value" });
    // }
  }

  // // TODO: implement classes
  // checkClassDeclaration(declaration: Class, accept: ValidationAcceptor): void {
  //   accept("error", "Classes are currently unsupported.", {
  //     node: declaration,
  //     property: "name",
  //   });
  // }

  checkBinaryOperationAllowed(binary: BinaryExpression, accept: ValidationAcceptor): void {
    // const map = this.getTypeCache();
    // const left = inferType(binary.left, map);
    // const right = inferType(binary.right, map);
    // if (!isLegalOperation(binary.operator, left, right)) {
    //   accept(
    //     "error",
    //     `Cannot perform operation '${binary.operator}' on values of type '${typeToString(left)}' and '${typeToString(
    //       right
    //     )}'.`,
    //     {
    //       node: binary,
    //     }
    //   );
    // } else if (binary.operator === "=") {
    //   if (!isAssignable(right, left)) {
    //     accept("error", `Type '${typeToString(right)}' is not assignable to type '${typeToString(left)}'.`, {
    //       node: binary,
    //       property: "right",
    //     });
    //   }
    // } else if (["==", "!="].includes(binary.operator)) {
    //   if (!isAssignable(right, left)) {
    //     accept(
    //       "warning",
    //       `This comparison will always return '${binary.operator === "==" ? "false" : "true"}' as types '${typeToString(
    //         left
    //       )}' and '${typeToString(right)}' are not compatible.`,
    //       {
    //         node: binary,
    //         property: "operator",
    //       }
    //     );
    //   }
    // }
  }

  checkUnaryOperationAllowed(unary: UnaryExpression, accept: ValidationAcceptor): void {
    // const item = inferType(unary.value, this.getTypeCache());
    // if (!isLegalOperation(unary.operator, item)) {
    //   accept("error", `Cannot perform operation '${unary.operator}' on value of type '${typeToString(item)}'.`, {
    //     node: unary,
    //   });
    // }
  }

  checkVariableDeclaration(decl: Variable, accept: ValidationAcceptor): void {
    // console.log("checkVariable");
    // const text = AstUtils.getDocument(expr).parseResult.value.$cstNode?.text;
    // // const text = (AstUtils.getDocument(expr).parseResult.value.$cstNode as RootCstNode).fullText;
    // console.log(text);
    // const thenKeyword = GrammarUtils.findNodeForKeyword(expr.$cstNode, "=");
    // if (thenKeyword) {
    //   console.log("find =");
    //   // const index = thenKeyword.offset;
    //   // const previousChar = text.charAt(index - 1);
    //   // if (previousChar !== ' ') {
    //   //   acceptor('error', ...);
    //   // }
    // }
    // console.log("expr.names:", expr.names);
    // console.log("expr.type:", expr.type);
    // if (expr.type == undefined) {
    //   if (isLiteral(expr.value)) {
    //     console.log("expr.value:", expr.value.$type, expr.value.value, typeof expr.value.value);
    //     //accept("error", "Person name should start with a capital.", { node: expr, property: "value" });
    //   }
    // }
    // if (decl.type && decl.value) {
    //   const map = this.getTypeCache();
    //   const left = inferType(decl.type, map);
    //   const right = inferType(decl.value, map);
    //   if (!isAssignable(right, left)) {
    //     accept("error", `Type '${typeToString(right)}' is not assignable to type '${typeToString(left)}'.`, {
    //       node: decl,
    //       property: "value",
    //     });
    //   }
    // } else if (!decl.type && !decl.value) {
    //   accept("error", "Variables require a type hint or an assignment at creation", {
    //     node: decl,
    //     property: "names",
    //   });
    // }
  }

  checkMethodReturnType(method: Method, accept: ValidationAcceptor): void {
    this.checkFunctionReturnTypeInternal(method.body, method.returnType, accept);
  }

  private checkFunctionReturnTypeInternal(
    body: Block | undefined,
    returnType: Type | undefined,
    accept: ValidationAcceptor
  ): void {
    if (body && returnType) {
      const map = this.getTypeCache();
      const returnStatements = AstUtils.streamAllContents(body).filter(isReturnExpr).toArray();
      const expectedType = inferType(returnType, map);
      if (returnStatements.length === 0 && !isVoidType(expectedType)) {
        accept("error", "A function whose declared type is not 'void' must return a value.", {
          node: returnType,
        });
        return;
      }
      for (const returnStatement of returnStatements) {
        const returnValueType = inferType(returnStatement, map);
        if (!isAssignable(returnValueType, expectedType)) {
          accept(
            "error",
            `Type '${typeToString(returnValueType)}' is not assignable to type '${typeToString(expectedType)}'.`,
            {
              node: returnStatement,
            }
          );
        }
      }
    }
  }

  private getTypeCache(): Map<AstNode, TypeDescription> {
    return new Map();
  }
}
