import {
  AstNode,
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedCoreServices,
} from "langium";
import { WorkspaceFolder } from "vscode-languageserver";
import { URI } from "vscode-uri";

const ScalaScriptBuiltinLibrary = `
@NotTrans def string.charAt(index: number): string
@NotTrans def string.charCodeAt(index: number): number
@NotTrans def string.codePointAt(pos: number): number
@NotTrans def string.concat(str: string): string
@NotTrans def string.includes(searchString: string, position: number): boolean
@NotTrans def string.endsWith(searchString: string, length: number): boolean
@NotTrans def string.indexOf(searchValue: string, fromIndex: number): number
@NotTrans def string.lastIndexOf(searchValue: string, fromIndex: number): number
@NotTrans def string.localeCompare(compareString: string): number
//@NotTrans def string.match(regexp: string): string
@NotTrans def string.matchAll(regexp: string): string[]
@NotTrans def string.normalize(form: string): string
@NotTrans def string.padEnd(targetLength: number, padString: string): string
@NotTrans def string.padStart(targetLength: number, padString: string): string
@NotTrans def string.repeat(count: number): string
@NotTrans def string.replace(searchFor: string, replaceWith: string): string
@NotTrans def string.replaceAll(searchFor: string, replaceWith: string): string
@NotTrans def string.search(regexp: string): string
@NotTrans def string.slice(beginIndex: number, endIndex: number): string
@NotTrans def string.split(sep: string, limit: number): string[]
@NotTrans def string.startsWith(searchString: string, length: number): boolean
@NotTrans def string.substring(indexStart: number, indexEnd: number): string
@NotTrans def string.toLocaleLowerCase(locale: string): string
@NotTrans def string.toLocaleUpperCase(locale: string): string
@NotTrans def string.toLowerCase(): string
@NotTrans def string.toUpperCase(): string
@NotTrans def string.toString(): string
@NotTrans def string.trim(): string
@NotTrans def string.trimStart(): string
@NotTrans def string.trimEnd(): string
@NotTrans def string.valueOf(): string
`.trim();

export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory;

  constructor(services: LangiumSharedCoreServices) {
    super(services);
    this.documentFactory = services.workspace.LangiumDocumentFactory;
  }

  protected override async loadAdditionalDocuments(
    folders: WorkspaceFolder[],
    collector: (document: LangiumDocument<AstNode>) => void
  ): Promise<void> {
    console.log("before loadAdditionalDocuments", folders);
    await super.loadAdditionalDocuments(folders, collector);
    console.log("after loadAdditionalDocuments");
    // Load our library using the `builtin` URI schema
    collector(this.documentFactory.fromString(ScalaScriptBuiltinLibrary, URI.parse("builtin:///library.hello")));
  }
}
