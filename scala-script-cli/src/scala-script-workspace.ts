import {
  AstNode,
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedCoreServices,
} from 'langium'
import { WorkspaceFolder } from 'vscode-languageserver'
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

  // override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken = CancellationToken.None): Promise<void> {
  //   const documents = await this.performStartup(folders)
  //   // Only after creating all documents do we check whether we need to cancel the initialization
  //   // The document builder will later pick up on all unprocessed documents
  //   await interruptAndCheck(cancelToken)
  //   await this.documentBuilder.build(documents, this.initialBuildOptions, cancelToken)
  // }

  /**
   * Performs the uninterruptable startup sequence of the workspace manager.
   * This methods loads all documents in the workspace and other documents and returns them.
   */
  // protected override async performStartup(folders: WorkspaceFolder[]): Promise<LangiumDocument[]> {
  //   const fileExtensions = this.serviceRegistry.all.flatMap(e => e.LanguageMetaData.fileExtensions)
  //   const documents: LangiumDocument[] = []
  //   const collector = (document: LangiumDocument) => {
  //     documents.push(document)
  //     if (!this.langiumDocuments.hasDocument(document.uri)) {
  //       this.langiumDocuments.addDocument(document)
  //     }
  //   }
  //   // Even though we don't await the initialization of the workspace manager,
  //   // we can still assume that all library documents and file documents are loaded by the time we start building documents.
  //   // The mutex prevents anything from performing a workspace build until we check the cancellation token
  //   await this.loadAdditionalDocuments(folders, collector)
  //   await Promise.all(
  //     folders
  //       .map(wf => [wf, this.getRootFolder(wf)] as [WorkspaceFolder, URI])
  //       .map(async entry => this.traverseFolder(...entry, fileExtensions, collector))
  //   )
  //   this._ready.resolve()
  //   return documents
  // }

  /**
   * Traverse the file system folder identified by the given URI and its subfolders. All
   * contained files that match the file extensions are added to the collector.
   */
  protected override async traverseFolder(
    workspaceFolder: WorkspaceFolder,
    folderPath: URI,
    fileExtensions: string[],
    collector: (document: LangiumDocument) => void
  ): Promise<void> {
    const content = await this.fileSystemProvider.readDirectory(folderPath)
    console.log('traverseFolder')
    console.time('traverseFolder')
    await Promise.all(
      content.map(async entry => {
        if (this.includeEntry(workspaceFolder, entry, fileExtensions)) {
          if (entry.isDirectory) {
            // await this.traverseFolder(workspaceFolder, entry.uri, fileExtensions, collector)
          } else if (entry.isFile) {
            const document = await this.langiumDocuments.getOrCreateDocument(entry.uri)
            collector(document)
          }
        }
      })
    )
    console.timeEnd('traverseFolder')
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
