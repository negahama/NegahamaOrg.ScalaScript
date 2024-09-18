# Welcome to ScalaScript

## What is ScalaScript

ScalaScript is new programming language that combined data type of TypeScript with some grammars of Scala.

To be honestly, for now, I think it's right that the proper name of ScalaScript is Scala-tic typescript. ^^

Anyway ScalaScript is transpiler which is transpiled to TypeScript. It means that you can get the TypeScript code when you code with ScalaScript.

If you know and like both of Scala and TypeScript, you might also like ScalaScript because ScalaScript is mixed of favorite things from both languages.

This project is based on the Langium and provided you the insigt of creating your DSL with using the Langium

Last but not least, ScalaScript is NOT complete, it's been developing right now...
I always welcome your advice and any kind of help.

Thank you

## Where you can get the resouces about ScalaScript

### ScalaScript Grammar

if you wonder the grammar of ScalaScript, you can get the resources from here(coming soon)

### ScalaScript Develop blog

[This site](https://blog.naver.com/hsk141/223549212519) is about how I develop the ScalaScript language in detail.
But It's written by Korean language. if you know Korean, this site is very useful to get insight and informations about ScalaScript and Langium

## What's in the folder

This folder contains all necessary files for your language extension.

- `package.json` - the manifest file in which you declare your language support.
- `language-configuration.json` - the language configuration used in the VS Code editor, defining the tokens that are used for comments and brackets.
- `src/extension/main.ts` - the main code of the extension, which is responsible for launching a language server and client.
- `src/language/main.ts` - the entry point of the language server process.
- `src/language/scala-script.langium` - the grammar definition of your language.
- `src/language/scala-script-module.ts` - the dependency injection module of your language implementation. Use this to register overridden and added services.
- `src/language/scala-script-validator.ts` - an example validator. You should change it to reflect the semantics of your language.
- `src/cli/main.ts` - the entry point of the command line interface (CLI) of your language.
- `src/cli/generator.ts` - the code generator used by the CLI to write output files from DSL documents.
- `src/cli/cli-util.ts` - utility code for the CLI.

## Get up and running straight away

- `npm run all` has 3 command. `npm run langium:generate`, `npm run build` and `npm run cli`.
- Run `npm run cli` to transpile the root/sample.ss by using the ScalaScript CLI. it's equivalent to "node bin/cli.js generate sample.ss"
- Run `npm run langium:generate` to generate TypeScript code from the grammar definition.
- Run `npm run build` to compile all TypeScript code.
- Press `F5` to open a new window with your extension loaded.
- Create a new file with a file name suffix matching your language.
- Verify that syntax highlighting, validation, completion etc. are working as expected.
- Run `node ./bin/cli` to see options for the CLI; `node ./bin/cli generate <file>` generates code for a given DSL file.

## Make changes

- Run `npm run watch` to have the TypeScript compiler run automatically after every change of the source files.
- Run `npm run langium:watch` to have the Langium generator run automatically after every change of the grammar declaration.
- You can relaunch the extension from the debug toolbar after making changes to the files listed above.
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Install your extension

- To start using your extension with VS Code, copy it into the `<user home>/.vscode/extensions` folder and restart Code.
- To share your extension with the world, read the [VS Code documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) about publishing an extension.

## To Go Further

Documentation about the Langium framework is available at https://langium.org
