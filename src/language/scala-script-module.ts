import { type Module, inject } from "langium";
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
} from "langium/lsp";
import { ScalaScriptGeneratedModule, ScalaScriptGeneratedSharedModule } from "./generated/module.js";
import { ScalaScriptValidator, registerValidationChecks } from "./scala-script-validator.js";
import { ScalaScriptScopeProvider, ScalaScriptScopeComputation } from "./scala-script-scope.js";

/**
 * Declaration of custom services - add your own service classes here.
 */
export type ScalaScriptAddedServices = {
  validation: {
    ScalaScriptValidator: ScalaScriptValidator;
  };
};

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type ScalaScriptServices = LangiumServices & ScalaScriptAddedServices;

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
    ScopeProvider: (services) => new ScalaScriptScopeProvider(services),
    ScopeComputation: (services) => new ScalaScriptScopeComputation(services),
  },
};

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
  shared: LangiumSharedServices;
  ScalaScript: ScalaScriptServices;
} {
  const shared = inject(createDefaultSharedModule(context), ScalaScriptGeneratedSharedModule);
  const ScalaScript = inject(createDefaultModule({ shared }), ScalaScriptGeneratedModule, ScalaScriptModule);
  shared.ServiceRegistry.register(ScalaScript);
  registerValidationChecks(ScalaScript);
  if (!context.connection) {
    // We don't run inside a language server
    // Therefore, initialize the configuration provider instantly
    shared.workspace.ConfigurationProvider.initialized({});
  }
  return { shared, ScalaScript };
}
