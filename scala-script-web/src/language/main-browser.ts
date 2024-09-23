import { EmptyFileSystem } from 'langium'
import { startLanguageServer } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js'
import { createScalaScriptServices } from './scala-script-module.js'

declare const self: DedicatedWorkerGlobalScope

const messageReader = new BrowserMessageReader(self)
const messageWriter = new BrowserMessageWriter(self)

const connection = createConnection(messageReader, messageWriter)

const { shared } = createScalaScriptServices({ connection, ...EmptyFileSystem })

startLanguageServer(shared)
