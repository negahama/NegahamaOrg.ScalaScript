import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node.js'
import type * as vscode from 'vscode'
import * as path from 'node:path'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js'
import { DslLibraryFileSystemProvider } from './scala-script-file-provider.js'

let client: LanguageClient

/**
 * Activates the extension.
 * This function is called when the extension is activated.
 *
 * This function is called when the extension is activated. It registers the
 * `DslLibraryFileSystemProvider` and starts the language client.
 *
 * @param context - The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext): void {
  DslLibraryFileSystemProvider.register(context)
  console.log('DslLibraryFileSystemProvider.register')

  client = startLanguageClient(context)
  console.log('startLanguageClient')
}

/**
 * Deactivates the extension by stopping the client if it is running.
 * This function is called when the extension is deactivated.
 *
 * @returns {Thenable<void> | undefined} A promise that resolves when the client is stopped, or undefined if the client is not running.
 */
export function deactivate(): Thenable<void> | undefined {
  if (client) {
    return client.stop()
  }
  return undefined
}

/**
 * Starts the language client for the ScalaScript language server.
 *
 * @param context - The extension context provided by VS Code.
 * @returns The initialized and started LanguageClient instance.
 *
 * This function sets up the language server module path, configures debug options,
 * and defines server and client options. It then creates and starts the language client,
 * which in turn launches the language server.
 */
function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
  const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'))
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`],
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'scala-script' }],
  }

  // Create the language client and start the client.
  const client = new LanguageClient('scala-script', 'ScalaScript', serverOptions, clientOptions)

  // Start the client. This will also launch the server
  client.start()
  return client
}
