import {
  AstNode,
  DefaultWorkspaceManager,
  interruptAndCheck,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedCoreServices,
} from 'langium'
import { CancellationToken, WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import { ScalaScriptBuiltinLibrary } from '../../language/scala-script-library.js'

/**
 * Manages the ScalaScript workspace, extending the default workspace manager to include
 * additional document loading and initialization logic specific to ScalaScript.
 */
export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory

  /**
   * Constructs a new instance of the class.
   *
   * @param services - The shared core services provided by Langium.
   */
  constructor(services: LangiumSharedCoreServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
  }

  /**
   * Initializes the workspace by performing startup tasks, building documents, and handling cancellation tokens.
   *
   * @param folders - An array of workspace folders to initialize.
   * @param cancelToken - A token to signal cancellation of the initialization process. Defaults to `CancellationToken.None`.
   * @returns A promise that resolves when the workspace initialization is complete.
   */
  override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken = CancellationToken.None): Promise<void> {
    console.time('total')
    console.time('performStartup')
    const documents = await this.performStartup(folders)
    console.timeEnd('performStartup')
    // Only after creating all documents do we check whether we need to cancel the initialization
    // The document builder will later pick up on all unprocessed documents
    await interruptAndCheck(cancelToken)
    console.time('builder.build')
    await this.documentBuilder.build(documents, this.initialBuildOptions, cancelToken)
    console.timeEnd('builder.build')
    console.timeEnd('total')
  }

  /**
   * Loads additional documents into the workspace.
   *
   * This method overrides the base class implementation to load additional documents
   * from the specified folders and also includes a built-in library document.
   *
   * @param folders - An array of workspace folders to load documents from.
   * @param collector - A callback function to collect the loaded documents.
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
