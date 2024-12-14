import { AstNode, AstUtils } from 'langium'
import * as ast from './generated/ast.js'
import { TypeDescription, TypeSystem } from './scala-script-types.js'

/**
 *
 */
export namespace ScalaScriptCache {
  const cache = new Map<AstNode, TypeDescription>()

  // const astVariableDefs = new Map<ast.VariableDef, TypeDescription>()
  // const astFunctionDefs = new Map<ast.FunctionDef, TypeDescription>()
  // const astFunctionValues = new Map<ast.FunctionValue, TypeDescription>()
  // const astObjectDefs = new Map<ast.ObjectDef, TypeDescription>()
  // const astObjectValues = new Map<ast.ObjectValue, TypeDescription>()

  export function get(node: AstNode) {
    // if (ast.isVariableDef(node)) {
    //   return astVariableDefs.get(node)
    // } else if (ast.isFunctionDef(node)) {
    //   return astFunctionDefs.get(node)
    // } else if (ast.isFunctionValue(node)) {
    //   return astFunctionValues.get(node)
    // } else if (ast.isObjectDef(node)) {
    //   return astObjectDefs.get(node)
    // } else if (ast.isObjectValue(node)) {
    //   return astObjectValues.get(node)
    // }
    return cache.get(node)
  }

  export function set(node: AstNode, type: TypeDescription) {
    // if (ast.isVariableDef(node)) {
    //   astVariableDefs.set(node, type)
    // } else if (ast.isFunctionDef(node)) {
    //   astFunctionDefs.set(node, type)
    // } else if (ast.isFunctionValue(node)) {
    //   astFunctionValues.set(node, type)
    // } else if (ast.isObjectDef(node)) {
    //   astObjectDefs.set(node, type)
    // } else if (ast.isObjectValue(node)) {
    //   astObjectValues.set(node, type)
    // }
    cache.set(node, type)
  }

  /**
   * Finds a variable definition or parameter with the specified name within the given AST node and its ancestors.
   *
   * ObjectDef의 name으로 property를 호출하면 static property만을 대상으로 해야 한다.
   * 그런데 이때 이 name이 object name인지 variable name인지를 구분해야 한다. 즉 다음과 같은 경우를 구분해야 한다.
   * def T = {
   *   val name: String = "name"
   * }
   * val f = (T: T) => {
   *   return T.name
   * }
   *
   * 이를 구분하기 위해서는 해당 이름이 있는지 먼저 확인해야 한다.
   *
   * @param node - The starting AST node to search within. If undefined, the function returns undefined.
   * @param name - The name of the variable or parameter to find. If undefined, the function returns undefined.
   * @returns The found variable definition or parameter node, or undefined if not found.
   */
  export function findVariableDefWithName(node: AstNode | undefined, name: string | undefined) {
    // const text = AstUtils.getDocument(stmt).parseResult.value.$cstNode?.text
    // const text = (AstUtils.getDocument(stmt).parseResult.value.$cstNode as RootCstNode).fullText
    // console.log(text)
    // const thenKeyword = GrammarUtils.findNodeForKeyword(stmt.$cstNode, "=")
    // if (thenKeyword) {
    //   const index = thenKeyword.offset
    //   const previousChar = text.charAt(index - 1)
    //   if (previousChar !== ' ') {
    //     acceptor('error', ...)
    //   }
    // }

    if (!node || !name) return undefined
    let item: AstNode | undefined = node
    while (item) {
      const found = AstUtils.streamContents(item).find(
        i => (ast.isVariableDef(i) || ast.isParameter(i)) && i.name === name
      )
      if (found) return found
      item = item.$container
    }
    return undefined
  }

  /**
   * Finds a function definition with the specified name within the given AST node.
   *
   * @param node - The starting AST node to search within. If undefined, the function returns undefined.
   * @param name - The name of the function to search for. If undefined, the function returns undefined.
   * @returns The found function definition node if a match is found, otherwise undefined.
   */
  export function findFunctionDefWithName(node: AstNode | undefined, name: string | undefined) {
    if (!node || !name) return undefined
    let item: AstNode | undefined = node
    while (item) {
      const found = AstUtils.streamContents(item).find(i => {
        if (ast.isFunctionDef(i) && i.name === name) return true
        if (ast.isVariableDef(i) && i.name === name && TypeSystem.isFunctionType(TypeSystem.inferType(i.value)))
          return true
        return false
      })
      if (found) {
        if (ast.isFunctionDef(found)) {
          return found
        } else if (ast.isVariableDef(found)) {
          return found.value
        }
      }
      item = item.$container
    }
    return undefined
  }

  /**
   * Finds an object definition with the specified name within the given AST node.
   *
   * @param node - The starting AST node to search within. If undefined, the function returns undefined.
   * @param name - The name of the object definition to find. If undefined, the function returns undefined.
   * @returns The found object definition node if it exists, otherwise undefined.
   */
  export function findObjectDefWithName(node: AstNode | undefined, name: string | undefined) {
    if (!node || !name) return undefined
    let item: AstNode | undefined = node
    while (item) {
      const found = AstUtils.streamContents(item).find(i => ast.isObjectDef(i) && i.name === name)
      if (found) return found
      item = item.$container
    }
    return undefined
  }
}
