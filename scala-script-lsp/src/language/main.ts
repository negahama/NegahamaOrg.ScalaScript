import { startLanguageServer } from 'langium/lsp'
import { NodeFileSystem } from 'langium/node'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js'
import { createScalaScriptServices } from './scala-script-module.js'

/**
 * Create a connection to the client
 * Establishes a connection using all proposed features.
 * This connection is created using the `createConnection` function and includes all proposed features.
 */
const connection = createConnection(ProposedFeatures.all)

// Inject the shared services and language-specific services
const { shared } = createScalaScriptServices({ connection, ...NodeFileSystem })

// Start the language server with the shared services
startLanguageServer(shared)
console.log('Language server started')
