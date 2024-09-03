import type { Program } from "../language/generated/ast.js";
import chalk from "chalk";
import { Command } from "commander";
import { ScalaScriptLanguageMetaData } from "../language/generated/module.js";
import { createScalaScriptServices } from "../language/scala-script-module.js";
import { extractAstNode } from "./cli-util.js";
import { generateTypeScript } from "./generator.js";
import { NodeFileSystem } from "langium/node";
import * as url from "node:url";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { URI } from "vscode-uri";
import { WorkspaceFolder } from "vscode-languageserver";

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

  const model = await extractAstNode<Program>(fileName, services);
  const generatedFilePath = generateTypeScript(model, fileName, opts.destination);
  console.log(chalk.green(`TypeScript code generated successfully: ${generatedFilePath}`));
};
