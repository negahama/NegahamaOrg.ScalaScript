import * as fs from 'node:fs'
import * as path from 'node:path'
import type { AstNode, LangiumCoreServices, LangiumDocument } from 'langium'
import { URI } from 'langium'
import chalk from 'chalk'

/**
 * Extracts a Langium document from the given file name and performs validation.
 *
 * @param fileName - The name of the file to extract the document from.
 * @param services - The Langium core services used for document extraction and validation.
 * @returns A promise that resolves to the extracted Langium document.
 *
 * @throws Will exit the process with code 1 if the file extension is not supported,
 *         if the file does not exist, or if there are validation errors.
 */
export async function extractDocument(fileName: string, services: LangiumCoreServices): Promise<LangiumDocument> {
  const extensions = services.LanguageMetaData.fileExtensions
  if (!extensions.includes(path.extname(fileName))) {
    console.error(chalk.yellow(`Please choose a file with one of these extensions: ${extensions}.`))
    process.exit(1)
  }

  if (!fs.existsSync(fileName)) {
    console.error(chalk.red(`File ${fileName} does not exist.`))
    process.exit(1)
  }

  const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(
    URI.file(path.resolve(fileName))
  )
  await services.shared.workspace.DocumentBuilder.build([document], { validation: true })

  const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1)
  if (validationErrors.length > 0) {
    console.error(chalk.red('There are validation errors:'))
    for (const validationError of validationErrors) {
      console.error(
        chalk.red(
          `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(
            validationError.range
          )}]`
        )
      )
    }
    process.exit(1)
  }

  return document
}

/**
 * Extracts an AST (Abstract Syntax Tree) node from a given file.
 *
 * @template T - The type of the AST node to be extracted, extending from `AstNode`.
 * @param fileName - The name of the file from which to extract the AST node.
 * @param services - The core services of Langium required for extraction.
 * @returns A promise that resolves to the extracted AST node of type `T`.
 */
export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumCoreServices): Promise<T> {
  return (await extractDocument(fileName, services)).parseResult?.value as T
}

/**
 * Represents data related to a file path.
 */
interface FilePathData {
  destination: string
  name: string
}

/**
 * Extracts the destination directory and the base name from a given file path.
 * If the destination is not provided, it defaults to a 'generated' directory
 * within the same directory as the file.
 *
 * @param filePath - The path of the file to process.
 * @param destination - An optional destination directory. If not provided,
 *                      defaults to a 'generated' directory within the same directory as the file.
 * @returns An object containing the destination directory and the base name of the file.
 */
export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
  filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '')
  return {
    destination: destination ?? path.join(path.dirname(filePath), 'generated'),
    name: path.basename(filePath),
  }
}
