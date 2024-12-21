import { AstNode } from 'langium'
import { AbstractSemanticTokenProvider, SemanticTokenAcceptor } from 'langium/lsp'
import * as ast from '../../../language/generated/ast.js'
import { SemanticTokenTypes } from 'vscode-languageserver'

/**
 * Provides semantic tokens for ScalaScript by analyzing the Abstract Syntax Tree (AST) nodes.
 * This class extends the AbstractSemanticTokenProvider to offer specific token types for ScalaScript elements.
 *
 * @remarks
 * The `highlightElement` method determines the type of the AST node and assigns the appropriate semantic token type.
 * It supports various node types such as call chains, reference calls, variable definitions, function definitions,
 * object definitions, and named elements.
 *
 * @example
 * ```typescript
 * const provider = new ScalaScriptSemanticTokenProvider();
 * provider.highlightElement(node, acceptor);
 * ```
 *
 * @public
 */
export class ScalaScriptSemanticTokenProvider extends AbstractSemanticTokenProvider {
  /**
   * Highlights the given AST node by determining its semantic token type and passing it to the acceptor.
   *
   * @param node - The AST node to be highlighted.
   * @param acceptor - The function that accepts the semantic token information.
   *
   * The method checks the type of the AST node and assigns the appropriate semantic token type:
   * - If the node is a call chain, it assigns `variable` or `function` based on whether the node is a function.
   * - If the node is a reference call, it assigns `function`.
   * - If the node is a variable definition, it assigns `variable`.
   * - If the node is a function definition, it assigns `method`.
   * - If the node is an object definition, it assigns `class`.
   * - If the node is a named element, it assigns `property`.
   */
  protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
    if (ast.isCallChain(node)) {
      let type = SemanticTokenTypes.variable
      if (node.isFunction) type = SemanticTokenTypes.function
      acceptor({ node, property: 'element', type })
    } else if (ast.isRefCall(node)) {
      acceptor({ node, property: 'element', type: SemanticTokenTypes.function })
    } else if (ast.isVariableDef(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.variable })
    } else if (ast.isFunctionDef(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.method })
    } else if (ast.isClassDef(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.class })
    } else if (ast.isNamedElement(node)) {
      acceptor({ node, property: 'name', type: SemanticTokenTypes.property })
    }
    // else {
    //   if (node.$cstNode) acceptor({ cst: node.$cstNode, type: SemanticTokenTypes.property })
    // }
  }
}
