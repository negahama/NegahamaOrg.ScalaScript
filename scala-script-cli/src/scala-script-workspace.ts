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
 *
 */
export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory

  constructor(services: LangiumSharedCoreServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
  }

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
   *
   * @param folders
   * @param collector
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
