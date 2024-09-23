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
 *
 */
export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory

  constructor(services: LangiumSharedCoreServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
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
