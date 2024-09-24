import * as vscode from 'vscode'
import { tsd, getChildren, getSyntaxKindName, parseAst, setTs } from './TsAstViewerMain.js'

/**
 *
 */
class AstNodeItem extends vscode.TreeItem {
  constructor(
    public readonly ast: tsd.Node,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState
      .Collapsed
  ) {
    super(getSyntaxKindName(ast.kind), collapsibleState)
  }
}

/**
 *
 */
export class TsAstViewerProvider implements vscode.TreeDataProvider<AstNodeItem> {
  private textEditor?: vscode.TextEditor
  /**
   *
   * @param tslib
   */
  constructor(tslib: any) {
    this.textEditor = vscode.window.activeTextEditor
    setTs(tslib)
  }

  /**
   *
   * @param pos
   * @param end
   */
  static focusAstNodeRange = (pos: number, end: number) => {
    const textEditor = vscode.window.activeTextEditor
    if (textEditor) {
      const document = textEditor.document
      const startPos = document.positionAt(pos)
      const endPos = document.positionAt(end)
      textEditor.selection = new vscode.Selection(startPos, endPos)
      textEditor.revealRange(new vscode.Range(startPos, endPos))
    }
  }

  /**
   *
   * @returns
   */
  createRootNode() {
    if (this.textEditor) {
      const document = this.textEditor.document
      const node = parseAst(document.fileName, document.getText())
      return new AstNodeItem(node, vscode.TreeItemCollapsibleState.Expanded)
    } else {
      return undefined
    }
  }

  /**
   *
   * @param node
   * @returns
   */
  async getChildren(node?: AstNodeItem): Promise<AstNodeItem[] | undefined> {
    if (node) {
      const ast = node.ast
      if (ast.getChildCount() > 0) {
        const children = getChildren(ast)
        return children.map(node => {
          let collapsibleState = vscode.TreeItemCollapsibleState.None
          if (node.getChildCount() > 0) {
            collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
          }
          return new AstNodeItem(node, collapsibleState)
        })
      } else {
        return undefined
      }
    } else {
      const root = this.createRootNode()
      if (root == undefined) return undefined
      return [root]
    }
  }

  /**
   *
   * @param node
   * @returns
   */
  async getTreeItem(node: AstNodeItem): Promise<vscode.TreeItem> {
    const ast = node.ast
    node.command = {
      title: 'focus ast node',
      command: 'ss-ast-viewer-focus',
      arguments: [ast.pos, ast.end],
    }
    return node
  }

  /**
   *
   */
  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event

  /**
   *
   * @param textEditor
   */
  changeEditor = (textEditor?: vscode.TextEditor) => {
    this.textEditor = textEditor
    this.update()
  }

  /**
   *
   */
  update = () => {
    this._onDidChangeTreeData.fire()
  }
}
