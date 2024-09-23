import { AstNode } from 'langium'
import { AbstractSemanticTokenProvider, SemanticTokenAcceptor } from 'langium/lsp'
import * as ast from '../../../language/generated/ast.js'
import { SemanticTokenTypes } from 'vscode-languageserver'

/**
 *
 */
export class ScalaScriptSemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
    if (ast.isCallChain(node)) {
      let type = SemanticTokenTypes.variable
      if (node.isFunction) type = SemanticTokenTypes.function
      acceptor({ node, property: 'element', type })
    } else if (ast.isFunctionCall(node)) {
      acceptor({ node, property: 'element', type: SemanticTokenTypes.function })
    } else if (ast.isVariableDef(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.variable })
    } else if (ast.isFunctionDef(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.method })
    } else if (ast.isObjectDef(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.class })
    } else if (ast.isNamedElement(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.property })
    }
    // else {
    //   if (node.$cstNode) acceptor({ cst: node.$cstNode, type: SemanticTokenTypes.property });
    // }
  }
}
