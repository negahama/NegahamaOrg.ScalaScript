import type { ValidationChecks } from "langium";
import type { ScalaScriptAstType } from "./generated/ast.js";
import type { ScalaScriptServices } from "./scala-script-module.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ScalaScriptValidator;
  const checks: ValidationChecks<ScalaScriptAstType> = {
    // Person: validator.checkPersonStartsWithCapital,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ScalaScriptValidator {
  // checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
  //   if (person.name) {
  //     const firstChar = person.name.substring(0, 1);
  //     if (firstChar.toUpperCase() !== firstChar) {
  //       accept("warning", "Person name should start with a capital.", { node: person, property: "name" });
  //     }
  //   }
  // }
}
