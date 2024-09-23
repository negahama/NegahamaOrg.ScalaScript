import * as url from 'node:url'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { URI } from 'vscode-uri'
import { NodeFileSystem } from 'langium/node'
import { Command } from 'commander'
import chalk from 'chalk'

import type { Program } from '../../language/generated/ast.js'
import { ScalaScriptLanguageMetaData } from '../../language/generated/module.js'
import { ScalaScriptBuiltinLibrary } from '../../language/scala-script-library.js'
import { createScalaScriptServices } from './scala-script-module.js'
import { generateTypeScript } from './generator.js'
import { extractAstNode } from './cli-util.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const packagePath = path.resolve(__dirname, '..', '..', 'package.json')
const packageContent = await fs.readFile(packagePath, 'utf-8')

/**
 *
 */
export default function (): void {
  const program = new Command()

  program.version(JSON.parse(packageContent).version)

  const fileExtensions = ScalaScriptLanguageMetaData.fileExtensions.join(', ')
  program
    .command('generate')
    .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
    .option('-d, --destination <dir>', 'destination directory of generating')
    .description('generates TypeScript code')
    .action(generateAction)

  program.parse(process.argv)
}

/**
 *
 */
export type GenerateOptions = {
  destination?: string
}

/**
 *
 * @param fileName
 * @param opts
 */
export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
  const services = createScalaScriptServices(NodeFileSystem).scalaScriptServices
  const workspace = services.shared.workspace

  let root = path.dirname(fileName)
  if (!path.isAbsolute(root)) {
    root = path.resolve(process.cwd(), root)
  }

  console.log(chalk.blueBright(`Transpile the '${fileName}'`))

  // Library용 파일을 먼저 생성해서 빌드해 준다.
  const library = workspace.LangiumDocumentFactory.fromString(
    ScalaScriptBuiltinLibrary,
    URI.parse('builtin:///library.ss')
  )
  console.log('Processing:', library.uri.path)
  workspace.DocumentBuilder.build([library])

  // 단일 파일만 트랜스파일하는 경우
  if (path.basename(fileName) != '*.ss') {
    const model = await extractAstNode<Program>(fileName, services)
    const generatedFilePath = generateTypeScript(model, fileName, opts.destination)
    console.log(chalk.green(`TypeScript code generated successfully: ${generatedFilePath}`))
    return
  }

  // initializeWorkspace()에서 아래 코드를 실행하기 때문에 이게 끝난 다음에 바로 사용하면 된다.
  // await workspace.LangiumDocuments.getOrCreateDocument(doc.uri)
  // await workspace.DocumentBuilder.build([document], { validation: true })
  workspace.WorkspaceManager.initialBuildOptions = { validation: true }
  await workspace.WorkspaceManager.initializeWorkspace([
    {
      name: path.basename(root),
      uri: URI.file(root).toString(),
    },
  ])

  for (const doc of workspace.LangiumDocuments.all) {
    console.log('Processing:', doc.uri.path)

    // fileName이 * 이 아니면 동일한 파일명을, * 인 경우는 모든 ss 파일을 변환한다
    if (!(doc.uri.path.endsWith(fileName) || (path.basename(fileName) == '*.ss' && doc.uri.path.endsWith('.ss'))))
      continue

    const validationErrors = (doc.diagnostics ?? []).filter(e => e.severity === 1)
    if (validationErrors.length > 0) {
      console.error(chalk.red('There are validation errors:'))
      for (const validationError of validationErrors) {
        console.error(
          chalk.red(
            `line ${validationError.range.start.line + 1}: ${validationError.message} [${doc.textDocument.getText(
              validationError.range
            )}]`
          )
        )
      }
      process.exit(1)
    }

    const generatedFilePath = generateTypeScript(doc.parseResult?.value as Program, doc.uri.path, opts.destination)
    console.log(chalk.green(`TypeScript code generated successfully: ${generatedFilePath}`))
  }
}
