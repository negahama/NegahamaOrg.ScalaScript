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
import { CancellationToken } from 'vscode-languageserver'
import { ScalaScriptAstType } from '../../language/generated/ast.js'
import { ScalaScriptGeneratedModule, ScalaScriptGeneratedSharedModule } from '../../language/generated/module.js'
import { ScalaScriptScopeProvider } from '../../language/scala-script-scope.js'
import { ScalaScriptValidator } from '../../language/scala-script-validator.js'
import { ScalaScriptWorkspaceManager } from './scala-script-workspace.js'

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
    ObjectDef: validator.checkClassDeclaration,
    Assignment: validator.checkAssignment,
    FunctionValue: validator.checkFunctionValue,
    UnaryExpression: validator.checkUnaryOperationAllowed,
    BinaryExpression: validator.checkBinaryOperationAllowed,
  }
  registry.register(checks, validator)
}

/**
 * A factory class for creating Langium documents specifically for ScalaScript.
 * Extends the DefaultLangiumDocumentFactory to provide custom document creation logic.
 *
 * JSDoc style comment는 특별히 그대로 bypass한다.
 * 원래 주석을 bypass하기 위해서는 %% ... %% 으로 처리해야 하지만 이렇게 하면 JSDoc의 편이 기능을 사용할 수 없고
 * 그렇다고 주석을 bypass 안 할수도 없기 때문에 편집시에는 주석 형태로 사용하고 변환을 하기 전에만 %%을 붙여서 빌드한다.
 */
export class ScalaScriptDocumentFactory extends DefaultLangiumDocumentFactory {
  /**
   * Asynchronously creates a Langium document from a given URI.
   *
   * @template T - The type of the AST node, defaults to AstNode.
   * @param uri - The URI of the file to read.
   * @param cancellationToken - An optional cancellation token to cancel the operation, defaults to CancellationToken.None.
   * @returns A promise that resolves to a LangiumDocument of type T.
   */
  override async fromUri<T extends AstNode = AstNode>(
    uri: URI,
    cancellationToken = CancellationToken.None
  ): Promise<LangiumDocument<T>> {
    const content = await this.fileSystemProvider.readFile(uri)
    const convert = content.replaceAll(/\/\*\*[\s\S]*?\*\//g, '%%$&%%')
    // console.log("ScalaScriptDocumentFactory.fromUri:", uri)
    // console.log("원본:", content)
    // console.log("변환:", convert)
    return this.createAsync<T>(uri, convert, cancellationToken)
  }
}
