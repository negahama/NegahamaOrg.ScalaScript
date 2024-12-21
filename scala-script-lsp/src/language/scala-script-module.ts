import {
  DeepPartial,
  type Module,
  inject,
  ValidationChecks,
  DefaultReferences,
  CstNode,
  AstNode,
  GenericAstNode,
  CstUtils,
  AstUtils,
  UriUtils,
  isReference,
  FindReferencesOptions,
  ReferenceDescription,
  Stream,
  stream,
  GrammarAST,
  IndentationAwareTokenBuilder,
  IndentationAwareLexer,
} from 'langium'
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
  parser: {
    TokenBuilder: () =>
      new IndentationAwareTokenBuilder({
        indentTokenName: 'INDENT',
        dedentTokenName: 'DEDENT',
        whitespaceTokenName: 'WS',
        ignoreIndentationDelimiters: [
          ['[', ']'],
          ['{', '}'],
          ['(', ')'],
        ],
      }),
    Lexer: services => new IndentationAwareLexer(services),
  },
  validation: {
    ScalaScriptValidator: () => new ScalaScriptValidator(),
  },
  references: {
    ScopeProvider: services => new ScalaScriptScopeProvider(services),
    // References: services => new ScalaScriptReferences(services),
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
 * such as VariableDef, FunctionDef, ClassDef, Assignment, FunctionValue, UnaryExpression, and BinaryExpression.
 * These checks are then registered with the validation registry using the provided validator.
 */
export function registerValidationChecks(services: ScalaScriptServices) {
  const registry = services.validation.ValidationRegistry
  const validator = services.validation.ScalaScriptValidator
  const checks: ValidationChecks<ScalaScriptAstType> = {
    VariableDef: validator.checkVariableDef,
    FunctionDef: validator.checkFunctionDef,
    ClassDef: validator.checkClassDef,
    FunctionValue: validator.checkFunctionDef,
    ObjectValue: validator.checkClassDef,
    ForStatement: validator.checkForStatement,
    CallChain: validator.checkCallChain,
    Assignment: validator.checkAssignment,
    IfExpression: validator.checkIfExpression,
    UnaryExpression: validator.checkUnaryExpression,
    BinaryExpression: validator.checkBinaryExpression,
  }
  registry.register(checks, validator)
}

export class ScalaScriptReferences extends DefaultReferences {
  override findDeclaration(sourceCstNode: CstNode): AstNode | undefined {
    console.log('ScalaScriptReferences findDeclaration:', sourceCstNode.text)

    const findAssignment = (cstNode: CstNode): GrammarAST.Assignment | undefined => {
      const astNode = cstNode.astNode
      console.log('🚀 ~ ScalaScriptReferences ~ findAssignment ~ astNode:', astNode.$cstNode?.text)

      // Only search until the ast node of the parent cst node is no longer the original ast node
      // This would make us jump to a preceding rule call, which contains only unrelated assignments
      while (astNode === cstNode.container?.astNode) {
        const assignment = AstUtils.getContainerOfType(cstNode.grammarSource, GrammarAST.isAssignment)
        if (assignment) {
          console.log('🚀 ~ ScalaScriptReferences ~ findAssignment ~ assignment:', assignment)
          console.log('🚀 ~ ScalaScriptReferences ~ findAssignment ~ assignment:', assignment.terminal)
          return assignment
        }
        cstNode = cstNode.container
        console.log('🚀 ~ ScalaScriptReferences ~ findAssignment ~ cstNode:', cstNode)
      }
      return undefined
    }

    if (sourceCstNode) {
      const assignment = findAssignment(sourceCstNode)
      console.log('🚀 ~ assignment.feature:', assignment?.feature)

      const nodeElem = sourceCstNode.astNode
      if (assignment && nodeElem) {
        const reference = (nodeElem as GenericAstNode)[assignment.feature]

        if (isReference(reference)) {
          console.log('🚀 ~ reference 1:', reference)
          return reference.ref
        } else if (Array.isArray(reference)) {
          console.log('🚀 ~ reference 2:', reference)
          for (const ref of reference) {
            if (
              isReference(ref) &&
              ref.$refNode &&
              ref.$refNode.offset <= sourceCstNode.offset &&
              ref.$refNode.end >= sourceCstNode.end
            ) {
              return ref.ref
            }
          }
        } else {
          console.log('🚀 ~ reference 3:', reference)
        }
      }
      if (nodeElem) {
        const nameNode = this.nameProvider.getNameNode(nodeElem)
        console.log('🚀 ~ nameNode:', nameNode?.text)
        // Only return the targeted node in case the targeted cst node is the name node or part of it
        if (nameNode && (nameNode === sourceCstNode || CstUtils.isChildNode(sourceCstNode, nameNode))) {
          return nodeElem
        }
      }
    }
    return undefined
    // return super.findDeclaration(sourceCstNode)
  }

  override findDeclarationNode(sourceCstNode: CstNode): CstNode | undefined {
    const astNode = this.findDeclaration(sourceCstNode)
    if (astNode?.$cstNode) {
      const targetNode = this.nameProvider.getNameNode(astNode)
      return targetNode ?? astNode.$cstNode
    }
    return undefined
  }

  override findReferences(targetNode: AstNode, options: FindReferencesOptions): Stream<ReferenceDescription> {
    const refs: ReferenceDescription[] = []
    if (options.includeDeclaration) {
      const ref = this.getReferenceToSelf(targetNode)
      if (ref) {
        refs.push(ref)
      }
    }
    let indexReferences = this.index.findAllReferences(targetNode, this.nodeLocator.getAstNodePath(targetNode))
    if (options.documentUri) {
      indexReferences = indexReferences.filter(ref => UriUtils.equals(ref.sourceUri, options.documentUri))
    }
    refs.push(...indexReferences)
    return stream(refs)
  }

  protected override getReferenceToSelf(targetNode: AstNode): ReferenceDescription | undefined {
    const nameNode = this.nameProvider.getNameNode(targetNode)
    if (nameNode) {
      const doc = AstUtils.getDocument(targetNode)
      const path = this.nodeLocator.getAstNodePath(targetNode)
      return {
        sourceUri: doc.uri,
        sourcePath: path,
        targetUri: doc.uri,
        targetPath: path,
        segment: CstUtils.toDocumentSegment(nameNode),
        local: true,
      }
    }
    return undefined
  }
}
