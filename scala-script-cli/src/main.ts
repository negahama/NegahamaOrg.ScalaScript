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

// import.meta.url: file:///D:/Samuel/NegahamaOrg.ScalaScript/scala-script-cli/out/scala-script-cli/src/main.js
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const packagePath = path.resolve(__dirname, '..', '..', '..', 'package.json')
const packageContent = await fs.readFile(packagePath, 'utf-8')
const packageVersion = JSON.parse(packageContent).version

/**
 * Initializes and configures the command-line interface (CLI) for the ScalaScript project.
 *
 * This function sets up the CLI using the `commander` library, defining the version,
 * available commands, arguments, and options. Specifically, it defines a `generate` command
 * that takes a source file and an optional destination directory, and generates TypeScript
 * code from ScalaScript code.
 *
 * @remarks
 * - The `generate` command requires a source file with one of the supported file extensions.
 * - The supported file extensions are retrieved from `ScalaScriptLanguageMetaData.fileExtensions`.
 *
 * @example
 * ```sh
 * # To generate TypeScript code from a ScalaScript file
 * scala-script-cli generate example.scala --destination ./output
 * ```
 */
export default function (): void {
  const program = new Command()

  program.version(packageVersion)

  const fileExtensions = ScalaScriptLanguageMetaData.fileExtensions.join(', ')
  program
    .command('generate')
    .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
    .option('-d, --destination <dir>', 'destination directory of generating')
    .description('generates TypeScript codes from ScalaScript codes')
    .action(generateAction)

  program.parse(process.argv)
}

/**
 * Options for generating output.
 *
 * @property {string} [destination] - The destination path where the output should be generated.
 */
export type GenerateOptions = {
  destination?: string
}

/**
 * Generates TypeScript code from ScalaScript files.
 *
 * @param fileName - The name of the file to be processed. If the file name is '*', all files with the '.ss' extension in the directory will be processed.
 * @param opts - Options for the generation process.
 * @returns A promise that resolves when the generation process is complete.
 *
 * The function performs the following steps:
 * 1. Initializes ScalaScript services and the workspace.
 * 2. Resolves the root directory of the file.
 * 3. Logs the start of the transpilation process.
 * 4. Creates and builds a library document from the built-in ScalaScript library.
 * 5. If a single file is specified, it extracts the AST node, generates TypeScript code, and logs the success message.
 * 6. If multiple files are to be processed, it initializes the workspace, builds documents, and validates them.
 * 7. For each document, it logs the processing status, checks for validation errors, and generates TypeScript code.
 * 8. Logs any validation errors and exits the process if errors are found.
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

  let baseName = path.basename(fileName)
  if (baseName == '*') baseName = '*.ss'

  // 단일 파일만 트랜스파일하는 경우
  if (baseName != '*.ss') {
    const model = await extractAstNode<Program>(fileName, services)
    const generatedFilePath = generateTypeScript(model, fileName, opts.destination)
    console.log(chalk.green(`TypeScript code generated successfully: ${generatedFilePath}`))
    return
  }

  // initializeWorkspace()에서 아래 코드를 실행하기 때문에 이게 끝난 다음에 바로 사용하면 된다.
  // await workspace.LangiumDocuments.getOrCreateDocument(doc.uri)
  // await workspace.DocumentBuilder.build([document], { validation: true })
  workspace.WorkspaceManager.initialBuildOptions = { validation: true }
  const start = Date.now()
  console.log(chalk.yellowBright('initializeWorkspace'))
  await workspace.WorkspaceManager.initializeWorkspace([
    {
      name: path.basename(root),
      uri: URI.file(root).toString(),
    },
  ])
  console.log(chalk.yellowBright(`elapsed time: ${(Date.now() - start) / 1000} sec`))

  for (const doc of workspace.LangiumDocuments.all) {
    console.log('Processing:', doc.uri.path)

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
