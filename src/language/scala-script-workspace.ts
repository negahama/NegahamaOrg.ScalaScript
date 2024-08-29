import {
  AstNode,
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedCoreServices,
} from "langium";
import { WorkspaceFolder } from "vscode-languageserver";
import { URI } from "vscode-uri";

/**
 *
 */
const ScalaScriptBuiltinLibrary = `
@NotTrans def string.charAt(index: number)-> string
@NotTrans def string.charCodeAt(index: number)-> number
@NotTrans def string.codePointAt(pos: number)-> number
@NotTrans def string.concat(str: string)-> string
@NotTrans def string.includes(searchString: string, position: number)-> boolean
@NotTrans def string.endsWith(searchString: string, endPosition: number)-> boolean
@NotTrans def string.indexOf(searchValue: string, fromIndex: number)-> number
@NotTrans def string.lastIndexOf(searchValue: string, fromIndex: number)-> number
@NotTrans def string.localeCompare(compareString: string)-> number
//@NotTrans def string.match(regexp: string)-> string
@NotTrans def string.matchAll(regexp: string)-> string[]
@NotTrans def string.normalize(form: string)-> string
@NotTrans def string.padEnd(targetLength: number, padString: string)-> string
@NotTrans def string.padStart(targetLength: number, padString: string)-> string
@NotTrans def string.repeat(count: number)-> string
@NotTrans def string.replace(searchFor: string, replaceWith: string)-> string
@NotTrans def string.replaceAll(searchFor: string, replaceWith: string)-> string
@NotTrans def string.search(regexp: string)-> string
@NotTrans def string.slice(beginIndex: number, endIndex: number)-> string
@NotTrans def string.split(sep: string, limit: number)-> string[]
@NotTrans def string.startsWith(searchString: string, position: number)-> boolean
@NotTrans def string.substring(indexStart: number, indexEnd: number)-> string
@NotTrans def string.toLocaleLowerCase(locale: string)-> string
@NotTrans def string.toLocaleUpperCase(locale: string)-> string
@NotTrans def string.toLowerCase()-> string
@NotTrans def string.toUpperCase()-> string
@NotTrans def string.toString()-> string
@NotTrans def string.trim()-> string
@NotTrans def string.trimStart()-> string
@NotTrans def string.trimEnd()-> string
@NotTrans def string.valueOf()-> string
@NotTrans def string.at(index)-> string
@NotTrans def string.concat()-> string
@NotTrans def string.copyWithin()-> string
@NotTrans def string.every(callbackFn)-> string
@NotTrans def string.fill(value, start, end)-> string
@NotTrans def string.filter(callbackFn)-> string
@NotTrans def string.find(callbackFn)-> string
@NotTrans def string.findIndex(callbackFn)-> string
@NotTrans def string.findLast(callbackFn)-> string
@NotTrans def string.findLastIndex(callbackFn)-> string
@NotTrans def string.flat(depth)-> string
@NotTrans def string.flatMap(callbackFn)-> string
@NotTrans def string.forEach(callbackFn)-> string
@NotTrans def string.includes(searchElement, fromIndex)-> string
@NotTrans def string.indexOf(searchElement, fromIndex)-> string
@NotTrans def string.join(separate)-> string
@NotTrans def string.keys()-> string
@NotTrans def string.lastIndexOf(searchElement, fromIndex)-> string
@NotTrans def string.map(callbackFn)-> string
@NotTrans def string.pop()-> string
@NotTrans def string.push(element)-> string
@NotTrans def string.reduce(callbackFn)-> string
@NotTrans def string.reduceRight(callbackFn)-> string
@NotTrans def string.reverse()-> string
@NotTrans def string.shift()-> string
@NotTrans def string.slice()-> string
@NotTrans def string.some(callbackFn)-> string
@NotTrans def string.sort(callbackFn)-> string
@NotTrans def string.splice()-> string
@NotTrans def string.toString()-> string
@NotTrans def string.unshift()-> string
@NotTrans def string.values()-> string
`.trim();

/**
 *
 */
export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory;

  constructor(services: LangiumSharedCoreServices) {
    super(services);
    this.documentFactory = services.workspace.LangiumDocumentFactory;
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
    // console.log("before loadAdditionalDocuments", folders);
    await super.loadAdditionalDocuments(folders, collector);
    // console.log("after loadAdditionalDocuments");
    // Load our library using the `builtin` URI schema
    collector(this.documentFactory.fromString(ScalaScriptBuiltinLibrary, URI.parse("builtin:///library.hello")));
  }
}
