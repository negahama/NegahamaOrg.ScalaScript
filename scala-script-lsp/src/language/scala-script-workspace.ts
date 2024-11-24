import {
  AstNode,
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedCoreServices,
} from 'langium'
import { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import { ScalaScriptBuiltinLibrary } from '../../../language/scala-script-library.js'

/**
 * Manages the workspace for ScalaScript language, extending the default workspace manager.
 *
 * This class is responsible for handling the workspace operations specific to ScalaScript,
 * including loading additional documents such as the built-in library.
 */
export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory

  /**
   * Constructs a new instance of the ScalaScriptWorkspace.
   *
   * @param services - The shared core services provided by Langium.
   */
  constructor(services: LangiumSharedCoreServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
  }

  /**
   * Loads additional documents into the workspace.
   *
   * This method overrides the base class implementation to load additional documents
   * specific to the ScalaScript language. It first calls the base class method to load
   * any documents it needs, and then it loads the ScalaScript built-in library using
   * the `builtin` URI schema.
   *
   * @param folders - An array of workspace folders to load documents from.
   * @param collector - A function that collects documents to be added to the workspace.
   * @returns A promise that resolves when the additional documents have been loaded.
   */
  protected override async loadAdditionalDocuments(
    folders: WorkspaceFolder[],
    collector: (document: LangiumDocument<AstNode>) => void
  ): Promise<void> {
    await super.loadAdditionalDocuments(folders, collector)
    // Load our library using the `builtin` URI schema
    collector(this.documentFactory.fromString(ScalaScriptBuiltinLibrary, URI.parse('builtin:///library.ss')))
    console.log('loadAdditionalDocuments: builtin:///library.ss')
  }
}
