import * as vscode from 'vscode'
import * as path from 'node:path'
import type tsd from 'typescript/lib/typescript.js'
let ts: typeof import('typescript/lib/typescript.js')

import { TsAstViewerProvider } from './TsAstViewerProvider.js'

export { tsd }

/**
 *
 * @param context
 * @returns
 */
export function createTsAstViewer(context: vscode.ExtensionContext) {
  const tslib = getWorkspaceTsLib()
  vscode.commands.executeCommand('setContext', 'no-tslib', !tslib)
  console.log('tslib:', tslib)
  if (!tslib) return

  const provider = new TsAstViewerProvider(tslib)
  const treeView = vscode.window.createTreeView('ss-ast-viewer', {
    treeDataProvider: provider,
  })

  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand('ss-ast-viewer-focus', TsAstViewerProvider.focusAstNodeRange),
    vscode.window.onDidChangeActiveTextEditor(provider.changeEditor),
    vscode.workspace.onDidChangeTextDocument(provider.update)
  )
}

/**
 *
 * @returns
 */
export function getWorkspaceTsLib() {
  const workspaceRootPath = vscode.workspace?.workspaceFolders?.[0]?.uri?.fsPath
  if (workspaceRootPath == undefined) return null
  const tslibPath = path.join(workspaceRootPath, 'node_modules/typescript/lib/typescript.js')
  try {
    return require(tslibPath)
  } catch (error) {
    console.log(error)
    return null
  }
}

/**
 *
 * @param _ts
 */
export function setTs(_ts: typeof ts) {
  ts = _ts
}

/**
 *
 * @param fileName
 * @param sourceText
 * @returns
 */
export function parseAst(fileName: string, sourceText: string): tsd.Node {
  return ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.ESNext, true)
}

/**
 *
 * @param node
 * @returns
 */
export function getChildren(node: tsd.Node) {
  return node.getChildren()
}

/**
 *
 * @param kind
 * @returns
 */
export function getSyntaxKindName(kind: tsd.SyntaxKind) {
  if (_kindNames) {
    return _kindNames[kind]
  }
  _kindNames = getKindNamesForApi()
  return _kindNames[kind]
}

/**
 *
 */
type KindNames = { [kind: number]: string }
let _kindNames: KindNames

/**
 *
 * @returns
 */
function getKindNamesForApi() {
  // some SyntaxKinds are repeated, so only use the first one
  const kindNames: KindNames = {}
  for (const name of Object.keys(ts.SyntaxKind).filter(k => isNaN(parseInt(k, 10)))) {
    const value = ts.SyntaxKind[name as keyof typeof ts.SyntaxKind]
    if (kindNames[value] == null) {
      kindNames[value] = name
    }
  }
  return kindNames
}
