import { Expr, isBypass, isFunDef, type Dcl, type Def, type Model } from "../language/generated/ast.js";
import { expandToNode, joinToNode, toString } from "langium/generate";
import * as fs from "node:fs";
import * as path from "node:path";
import { extractDestinationAndName } from "./cli-util.js";

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination);
  const generatedFilePath = `${path.join(data.destination, data.name)}.ts`;

  const fileNode = expandToNode`
    // This is transpiled by ScalaScript
    "use strict";

    ${joinToNode(model.bypasses, (block) => generateBypassElement(block.bypass), {
      appendNewLineIfNotEmpty: true,
    })}

    ${joinToNode(model.declarations, (declaration) => generateDeclarationElement(declaration), {
      appendNewLineIfNotEmpty: true,
    })}

    ${joinToNode(model.definitions, (definition) => generateDefinitionElement(definition), {
      appendNewLineIfNotEmpty: true,
    })}
  `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode));
  return generatedFilePath;
}

function generateBypassElement(block: string): string {
  let result = "";
  block
    .split("%%")
    .filter((s) => s != "")
    .forEach((s) => {
      result += s;
    });
  return result;
}

function generateDeclarationElement(declaration: Dcl): string {
  let result = "";
  return result;
}

function generateDefinitionElement(definition: Def): string {
  let result = "";
  if (isFunDef(definition)) {
    result += `function ${definition.name}(`;
    definition.params.forEach((param, index) => {
      if (index != 0) result += ", ";
      result += param.name;
      if (param.type) result += ": " + param.type;
    });
    result += ")";
    if (definition.returnType) result += ": " + definition.returnType;
    result += " " + generateFunctionBlockElement(definition.body);
  }
  return result;
}

function generateFunctionBlockElement(body: Expr[]): string {
  const result = body.map((expr) => {
    return generateExpressionElement(expr) + "\n";
  });
  return "{\n" + result.toString() + "\n}";
}

function generateExpressionElement(expr: Expr): string {
  let result = "";
  if (isBypass(expr)) {
    result += generateBypassElement(expr.bypass);
  }
  return result;
}
