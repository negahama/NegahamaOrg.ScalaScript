import { EmptyFileSystem, OperationCancelled } from 'langium'
import { startLanguageServer } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js'
import { createScalaScriptServices } from './scala-script-module.js'

declare const self: DedicatedWorkerGlobalScope

// Handle unhandled promise rejections in the worker context
// This prevents the worker from terminating when operations are cancelled
self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (event.reason === OperationCancelled) {
    // Langium uses this symbol to signal operation cancellation
    event.preventDefault()
    return
  }
  // For other rejections, log but don't crash
  console.error('Unhandled promise rejection:', event.reason)
})

const messageReader = new BrowserMessageReader(self)
const messageWriter = new BrowserMessageWriter(self)

const connection = createConnection(messageReader, messageWriter)

const { shared } = createScalaScriptServices({ connection, ...EmptyFileSystem })

startLanguageServer(shared)
