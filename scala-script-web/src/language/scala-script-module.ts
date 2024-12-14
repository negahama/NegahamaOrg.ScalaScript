import { DeepPartial, type Module, inject, ValidationChecks } from 'langium'
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
} from 'langium/lsp'
import { ScalaScriptAstType } from '../../../language/generated/ast.js'
import { ScalaScriptGeneratedModule, ScalaScriptGeneratedSharedModule } from '../../../language/generated/module.js'
import { ScalaScriptScopeProvider } from '../../../language/scala-script-scope.js'
import { ScalaScriptValidator } from '../../../language/scala-script-validator.js'
import { ScalaScriptWorkspaceManager } from './scala-script-workspace.js'
import { ScalaScriptSemanticTokenProvider } from './scala-script-semantic.js'

/**
 * Declaration of custom services - add your own service classes here.
 */
export type ScalaScriptAddedServices = {
  validation: {
    ScalaScriptValidator: ScalaScriptValidator
  }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type ScalaScriptServices = LangiumServices & ScalaScriptAddedServices

/**
 *
 */
export type ScalaScriptSharedServices = LangiumSharedServices
export const ScalaScriptSharedModule: Module<ScalaScriptSharedServices, DeepPartial<ScalaScriptSharedServices>> = {
  workspace: {
    WorkspaceManager: services => new ScalaScriptWorkspaceManager(services),
  },
}

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const ScalaScriptModule: Module<ScalaScriptServices, PartialLangiumServices & ScalaScriptAddedServices> = {
  validation: {
    ScalaScriptValidator: () => new ScalaScriptValidator(),
  },
  references: {
    ScopeProvider: services => new ScalaScriptScopeProvider(services),
  },
  lsp: {
    SemanticTokenProvider: services => new ScalaScriptSemanticTokenProvider(services),
  },
}

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createScalaScriptServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices
  scalaScriptServices: ScalaScriptServices
} {
  const shared = inject(createDefaultSharedModule(context), ScalaScriptGeneratedSharedModule, ScalaScriptSharedModule)
  const services = inject(createDefaultModule({ shared }), ScalaScriptGeneratedModule, ScalaScriptModule)
  shared.ServiceRegistry.register(services)
  registerValidationChecks(services)
  if (!context.connection) {
    // We don't run inside a language server
    // Therefore, initialize the configuration provider instantly
    shared.workspace.ConfigurationProvider.initialized({})
  }
  return { shared, scalaScriptServices: services }
}

/**
 * Registers validation checks for ScalaScript services.
 *
 * @param services - The ScalaScript services that provide validation functionality.
 *
 * The function sets up a series of validation checks for different AST (Abstract Syntax Tree) types
 * such as VariableDef, FunctionDef, ObjectDef, Assignment, FunctionValue, UnaryExpression, and BinaryExpression.
 * These checks are then registered with the validation registry using the provided validator.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry
  const validator = services.validation.ScalaScriptValidator
  const checks: ValidationChecks<ScalaScriptAstType> = {
    VariableDef: validator.checkVariableDef,
    FunctionDef: validator.checkFunctionDef,
    ObjectDef: validator.checkObjectDef,
    CallChain: validator.checkCallChain,
    Assignment: validator.checkAssignment,
    IfExpression: validator.checkIfExpression,
    ObjectValue: validator.checkObjectDef,
    FunctionValue: validator.checkFunctionDef,
    UnaryExpression: validator.checkUnaryExpression,
    BinaryExpression: validator.checkBinaryExpression,
  }
  registry.register(checks, validator)
}
