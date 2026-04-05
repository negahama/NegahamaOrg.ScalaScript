import { startLanguageServer } from 'langium/lsp'
import { NodeFileSystem } from 'langium/node'
import { OperationCancelled } from 'langium'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js'
import { createScalaScriptServices } from './scala-script-module.js'

// Handle unhandled promise rejections
// This is necessary to prevent the server from crashing when operations are cancelled
// (e.g., when a document is being parsed and a new change comes in)
process.on('unhandledRejection', (reason: unknown) => {
  if (reason === OperationCancelled) {
    // Langium uses this symbol to signal operation cancellation, which is expected behavior
    // and should not crash the server
    return
  }
  // For other unhandled rejections, log the error but don't crash
  console.error('Unhandled promise rejection:', reason)
})

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
