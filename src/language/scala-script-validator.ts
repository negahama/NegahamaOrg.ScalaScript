import { type ValidationAcceptor, type ValidationChecks } from "langium";
import { Variable, type Assignment, type ScalaScriptAstType } from "./generated/ast.js";
import type { ScalaScriptServices } from "./scala-script-module.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScalaScriptValidator;
  const checks: ValidationChecks<ScalaScriptAstType> = {
    Variable: validator.checkVariable,
    Assignment: validator.checkAssignment,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ScalaScriptValidator {
  checkVariable(expr: Variable, accept: ValidationAcceptor): void {
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
  }

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
}
