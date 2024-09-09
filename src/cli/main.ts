import type { Program } from "../language/generated/ast.js";
import chalk from "chalk";
import { Command } from "commander";
import { ScalaScriptLanguageMetaData } from "../language/generated/module.js";
import { createScalaScriptServices } from "../language/scala-script-module.js";
import { generateTypeScript } from "./generator.js";
import { NodeFileSystem } from "langium/node";
import * as url from "node:url";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { URI } from "vscode-uri";
import { WorkspaceFolder } from "vscode-languageserver";
import { LangiumCoreServices } from "langium";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const packagePath = path.resolve(__dirname, "..", "..", "package.json");
const packageContent = await fs.readFile(packagePath, "utf-8");

/**
 *
 */
export default function (): void {
  const program = new Command();

  program.version(JSON.parse(packageContent).version);

  const fileExtensions = ScalaScriptLanguageMetaData.fileExtensions.join(", ");
  program
    .command("generate")
    .argument("<file>", `source file (possible file extensions: ${fileExtensions})`)
    .option("-d, --destination <dir>", "destination directory of generating")
    .description('generates TypeScript code that prints "Hello, {name}!" for each greeting in a source file')
    .action(generateAction);

  program.parse(process.argv);
}

/**
 *
 */
export type GenerateOptions = {
  destination?: string;
};

/**
 *
 * @param fileName
 * @param opts
 */
export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
  const services = createScalaScriptServices(NodeFileSystem).ScalaScript;

  let root = path.dirname(fileName);
  if (!path.isAbsolute(root)) {
    root = path.resolve(process.cwd(), root);
  }
  const folders: WorkspaceFolder[] = [
    {
      name: path.basename(root),
      uri: URI.file(root).toString(),
    },
  ];
  await services.shared.workspace.WorkspaceManager.initializeWorkspace(folders);
  services.shared.workspace.LangiumDocuments.all.forEach((d) => {
    console.log(d.uri.toString());
  });

  await extractAllDocuments(fileName, services, opts);
};

/**
 *
 * @param services
 * @param opts
 */
export async function extractAllDocuments(fileName: string, services: LangiumCoreServices, opts: GenerateOptions) {
  console.log(chalk.blueBright(`Transpile the ${fileName}`));
  for (const d of services.shared.workspace.LangiumDocuments.all) {
    console.log("Processing:", d.uri.path);

    // fileName이 * 이 아니면 동일한 파일명을, * 인 경우는 모든 ss 파일을 변환한다
    if (!(d.uri.path.endsWith(fileName) || (path.basename(fileName) == "*.ss" && d.uri.path.endsWith(".ss")))) continue;

    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(d.uri);
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    const validationErrors = (document.diagnostics ?? []).filter((e) => e.severity === 1);
    if (validationErrors.length > 0) {
      console.error(chalk.red("There are validation errors:"));
      for (const validationError of validationErrors) {
        console.error(
          chalk.red(
            `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(
              validationError.range
            )}]`
          )
        );
      }
      process.exit(1);
    }

    const generatedFilePath = generateTypeScript(document.parseResult?.value as Program, d.uri.path, opts.destination);
    console.log(chalk.green(`TypeScript code generated successfully: ${generatedFilePath}`));
  }
}
