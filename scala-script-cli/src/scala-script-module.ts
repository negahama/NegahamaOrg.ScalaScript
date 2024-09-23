import {
  DeepPartial,
  type Module,
  inject,
  ValidationChecks,
  DefaultLangiumDocumentFactory,
  LangiumDocument,
  AstNode,
  URI,
} from 'langium'
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
} from 'langium/lsp'
import { CancellationToken } from 'vscode-jsonrpc'
import { ScalaScriptAstType } from '../../language/generated/ast.js'
import { ScalaScriptGeneratedModule, ScalaScriptGeneratedSharedModule } from '../../language/generated/module.js'
import { ScalaScriptScopeProvider } from '../../language/scala-script-scope.js'
import { ScalaScriptValidator } from '../../language/scala-script-validator.js'

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
    LangiumDocumentFactory: services => new ScalaScriptDocumentFactory(services),
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
 * Register custom validation checks.
 *
 * @param services
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry
  const validator = services.validation.ScalaScriptValidator
  const checks: ValidationChecks<ScalaScriptAstType> = {
    VariableDef: validator.checkVariableDef,
    FunctionDef: validator.checkFunctionDef,
    ObjectDef: validator.checkClassDeclaration,
    Assignment: validator.checkAssignment,
    UnaryExpression: validator.checkUnaryOperationAllowed,
    BinaryExpression: validator.checkBinaryOperationAllowed,
  }
  registry.register(checks, validator)
}

/**
 *
 */
export class ScalaScriptDocumentFactory extends DefaultLangiumDocumentFactory {
  override async fromUri<T extends AstNode = AstNode>(
    uri: URI,
    cancellationToken = CancellationToken.None
  ): Promise<LangiumDocument<T>> {
    const content = await this.fileSystemProvider.readFile(uri)
    const convert = content.replaceAll(/\/\*\*[\s\S]*?\*\//g, '%%$&%%')
    // console.log("ScalaScriptDocumentFactory.fromUri:", uri);
    // console.log("원본:", content);
    // console.log("변환:", convert);
    return this.createAsync<T>(uri, convert, cancellationToken)
  }
}
