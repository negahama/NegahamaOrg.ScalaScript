import { AstNode } from "langium";
import {
  BooleanExpression,
  StringExpression,
  NumberExpression,
  Class,
  isMethodCall,
  isVariable,
  isClass,
  isField,
  isMethod,
  isParameter,
  isBinding,
  isTypeDeclaration,
  isLambdaType,
  isTupleType,
  isObjectType,
  isStringExpression,
  isNumberExpression,
  isBooleanExpression,
  isVoidExpression,
  isBinaryExpression,
  isUnaryExpression,
  isReturnExpr,
  isArrayType,
  isSimpleType,
  isPrimitiveType,
} from "./generated/ast.js";

export type TypeDescription =
  | VoidTypeDescription
  | BooleanTypeDescription
  | StringTypeDescription
  | NumberTypeDescription
  | FunctionTypeDescription
  | ClassTypeDescription
  | ErrorType;

export interface VoidTypeDescription {
  readonly $type: "void";
}

export function createVoidType(): VoidTypeDescription {
  return {
    $type: "void",
  };
}

export function isVoidType(item: TypeDescription): item is VoidTypeDescription {
  return item.$type === "void";
}

export interface BooleanTypeDescription {
  readonly $type: "boolean";
  readonly literal?: BooleanExpression;
}

export function createBooleanType(literal?: BooleanExpression): BooleanTypeDescription {
  return {
    $type: "boolean",
    literal,
  };
}

export function isBooleanType(item: TypeDescription): item is BooleanTypeDescription {
  return item.$type === "boolean";
}

export interface StringTypeDescription {
  readonly $type: "string";
  readonly literal?: StringExpression;
}

export function createStringType(literal?: StringExpression): StringTypeDescription {
  return {
    $type: "string",
    literal,
  };
}

export function isStringType(item: TypeDescription): item is StringTypeDescription {
  return item.$type === "string";
}

export interface NumberTypeDescription {
  readonly $type: "number";
  readonly literal?: NumberExpression;
}

export function createNumberType(literal?: NumberExpression): NumberTypeDescription {
  return {
    $type: "number",
    literal,
  };
}

export function isNumberType(item: TypeDescription): item is NumberTypeDescription {
  return item.$type === "number";
}

export interface FunctionTypeDescription {
  readonly $type: "function";
  readonly returnType: TypeDescription;
  readonly parameters: FunctionParameter[];
}

export interface FunctionParameter {
  name: string;
  type: TypeDescription;
}

export function createFunctionType(
  returnType: TypeDescription,
  parameters: FunctionParameter[]
): FunctionTypeDescription {
  return {
    $type: "function",
    parameters,
    returnType,
  };
}

export function isFunctionType(item: TypeDescription): item is FunctionTypeDescription {
  return item.$type === "function";
}

export interface ClassTypeDescription {
  readonly $type: "class";
  readonly literal: Class;
}

export function createClassType(literal: Class): ClassTypeDescription {
  return {
    $type: "class",
    literal,
  };
}

export function isClassType(item: TypeDescription): item is ClassTypeDescription {
  return item.$type === "class";
}

export interface ErrorType {
  readonly $type: "error";
  readonly source?: AstNode;
  readonly message: string;
}

export function createErrorType(message: string, source?: AstNode): ErrorType {
  return {
    $type: "error",
    message,
    source,
  };
}

export function isErrorType(item: TypeDescription): item is ErrorType {
  return item.$type === "error";
}

export function typeToString(item: TypeDescription): string {
  if (isClassType(item)) {
    return item.literal.name;
  } else if (isFunctionType(item)) {
    const params = item.parameters.map((e) => `${e.name}: ${typeToString(e.type)}`).join(", ");
    return `(${params}) => ${typeToString(item.returnType)}`;
  } else {
    return item.$type;
  }
}

export function enterLog(procKind: string, procId: string | undefined, indent: number): string {
  const space = "    ".repeat(indent);
  // console.log(space + `Enter ${procKind}, ${procId}`);
  return space + `Exit ${procKind}, ${procId}`;
}

export function traceLog(indent: number, msg: string, ...optionalParams: any[]) {
  // const space = "    ".repeat(indent);
  // console.log(space + msg, ...optionalParams);
}

export function exitLog(log: string) {
  // console.log(log);
}

export function inferType(
  node: AstNode | undefined,
  cache: Map<AstNode, TypeDescription>,
  indent: number = 0
): TypeDescription {
  const inferTypeId = `node is ${node?.$type}`;
  const rootLog = enterLog("inferType", inferTypeId, indent);

  let type: TypeDescription | undefined;
  if (!node) {
    exitLog(rootLog.replace("Exit", "Exit1"));
    return createErrorType("Could not infer type for undefined", node);
  }

  const existing = cache.get(node);
  if (existing) {
    exitLog(rootLog.replace("Exit", "Exit2"));
    return existing;
  }

  // Prevent recursive inference errors
  cache.set(node, createErrorType("Recursive definition", node));

  if (isMethodCall(node)) {
    const id = node.element?.$refText;
    const log = enterLog("isMethodCall", id, indent);
    traceLog(indent + 1, "ref 참조전:", id);
    const element = node.element?.ref;
    traceLog(indent + 1, "ref 참조후:", id);
    if (element) {
      type = inferType(element, cache, indent + 1);
    } else if (node.explicitCall && node.previous) {
      const previousType = inferType(node.previous, cache, indent + 1);
      if (isFunctionType(previousType)) type = previousType.returnType;
      else type = createErrorType("Cannot call operation on non-function type", node);
    } else type = createErrorType("Could not infer type for element " + node.element?.$refText, node);
    if (node.explicitCall) {
      if (isFunctionType(type)) type = type.returnType;
    }
    exitLog(log);
  } else if (isVariable(node)) {
    const log = enterLog("isVariable", node.names.toString(), indent);
    if (node.type) {
      type = inferType(node.type, cache, indent + 1);
    } else if (node.value) {
      type = inferType(node.value, cache, indent + 1);
    } else {
      type = createErrorType("No type hint for this element", node);
    }
    exitLog(log);
  } else if (isClass(node)) {
    const log = enterLog("isClass", node.name, indent);
    type = createClassType(node);
    exitLog(log);
  } else if (isField(node)) {
    const log = enterLog("isField", node.name, indent);
    if (node.type) {
      type = inferType(node.type, cache, indent + 1);
    }
    exitLog(log);
  } else if (isMethod(node)) {
    const log = enterLog("isMethod", node.name, indent);
    const returnType = inferType(node.returnType, cache, indent + 1);
    const parameters = node.parameters.map((e) => ({
      name: e.name,
      type: inferType(e.type, cache, indent + 2),
    }));
    type = createFunctionType(returnType, parameters);
    exitLog(log);
  } else if (isParameter(node)) {
    const log = enterLog("isParameter", node.name, indent);
    if (node.type) {
      type = inferType(node.type, cache, indent + 1);
    } else if (node.value) {
      type = inferType(node.value, cache, indent + 1);
    }
    exitLog(log);
  } else if (isBinding(node)) {
    const log = enterLog("isBinding", node.name, indent);
    if (node.type) {
      type = inferType(node.type, cache, indent + 1);
    }
    exitLog(log);
  } else if (isSimpleType(node)) {
    const log = enterLog("isSimpleType", undefined, indent);
    if (isTupleType(node)) {
      traceLog(indent + 1, "it's TupleType");
      // type = { $type: "tuple" };
    } else if (isObjectType(node)) {
      traceLog(indent + 1, "it's ObjectType");
      // type = { $type: "object" };
      // } else if (node.returnType) {
      //   const returnType = inferType(node.returnType, cache);
      //   const parameters = node.parameters.map((e, i) => ({
      //     name: e.name ?? `$${i}`,
      //     type: inferType(e.type, cache, indent + 1),
      //   }));
      //   type = createFunctionType(returnType, parameters);
    } else if (isPrimitiveType(node)) {
      traceLog(indent + 1, "Type is primitive");
      if (node.type === "number") {
        type = createNumberType();
      } else if (node.type === "string") {
        type = createStringType();
      } else if (node.type === "boolean") {
        type = createBooleanType();
      } else if (node.type === "void") {
        type = createVoidType();
      }
    } else if (node.reference) {
      traceLog(indent + 1, "Type is reference");
      if (node.reference.ref) {
        const ref = node.reference.ref;
        if (isClass(ref)) {
          type = createClassType(ref);
        } else if (isTypeDeclaration(ref)) {
          traceLog(indent + 1, "it's TypeDeclaration");
          // type = {
          //   $type: "type-dec",
          //   object: ref.value,
          // };
        } else {
          traceLog(indent + 1, "it's other-ref");
          // type = { $type: "other-ref" };
        }
      } else {
        traceLog(indent + 1, "it's not node.reference.ref");
      }
    } else type = createErrorType("Could not infer type for this reference", node);
    exitLog(log);
  } else if (isArrayType(node)) {
    // isArrayType은 isSimpleType보다 나중에 검사되어야 한다.
    const log = enterLog("isArrayType", undefined, indent);
    exitLog(log);
  } else if (isLambdaType(node)) {
    const log = enterLog("isLambdaType", undefined, indent);
    //type = { $type: "lambda" };
    exitLog(log);
  } else if (isStringExpression(node)) {
    const log = enterLog("isStringExpression", node.value, indent);
    type = createStringType(node);
    exitLog(log);
  } else if (isNumberExpression(node)) {
    const log = enterLog("isNumberExpression", node.value.toString(), indent);
    type = createNumberType(node);
    exitLog(log);
  } else if (isBooleanExpression(node)) {
    const log = enterLog("isBooleanExpression", node.value.toString(), indent);
    type = createBooleanType(node);
    exitLog(log);
  } else if (isVoidExpression(node)) {
    const log = enterLog("isVoidExpression", node.value, indent);
    type = createVoidType();
    exitLog(log);
  } else if (isBinaryExpression(node)) {
    const log = enterLog("isVoidExpression", node.operator, indent);
    type = createErrorType("Could not infer type from binary expression", node);
    if (["-", "*", "/", "%"].includes(node.operator)) {
      type = createNumberType();
    } else if (["and", "or", "<", "<=", ">", ">=", "==", "!="].includes(node.operator)) {
      type = createBooleanType();
    }
    const left = inferType(node.left, cache, indent + 1);
    const right = inferType(node.right, cache, indent + 1);
    if (node.operator === "+") {
      if (isStringType(left) || isStringType(right)) {
        type = createStringType();
      } else {
        type = createNumberType();
      }
      // } else if (node.operator === "=") {
      //   return right;
    }
    exitLog(log);
  } else if (isUnaryExpression(node)) {
    const log = enterLog("isUnaryExpression", node.operator, indent);
    if (node.operator === "!") {
      type = createBooleanType();
    } else {
      type = createNumberType();
    }
    exitLog(log);
  } else if (isReturnExpr(node)) {
    const log = enterLog("isReturnExpr", undefined, indent);
    if (!node.value) {
      type = createVoidType();
    } else {
      type = inferType(node.value, cache, indent + 1);
    }
    exitLog(log);
  }
  if (!type) {
    type = createErrorType("Could not infer type for " + node.$type, node);
  }

  cache.set(node, type);
  exitLog(rootLog.replace("Exit", "Exit3") + `, type: ${typeToString(type)}`);
  return type;
}

export function getClassChain(classItem: Class): Class[] {
  const set = new Set<Class>();
  let value: Class | undefined = classItem;
  while (value && !set.has(value)) {
    set.add(value);
    value = value.superClass?.ref;
  }
  // Sets preserve insertion order
  return Array.from(set);
}

export function isLegalOperation(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  if (operator === "+") {
    if (!right) {
      return left.$type === "number";
    }
    return (
      (left.$type === "number" || left.$type === "string") && (right.$type === "number" || right.$type === "string")
    );
  } else if (["-", "/", "*", "%", "<", "<=", ">", ">="].includes(operator)) {
    if (!right) {
      return left.$type === "number";
    }
    return left.$type === "number" && right.$type === "number";
  } else if (["and", "or"].includes(operator)) {
    return left.$type === "boolean" && right?.$type === "boolean";
  } else if (operator === "!") {
    return left.$type === "boolean";
  }
  return true;
}

export function isAssignable(from: TypeDescription, to: TypeDescription): boolean {
  if (isClassType(from)) {
    if (!isClassType(to)) {
      return false;
    }
    const fromLit = from.literal;
    const fromChain = getClassChain(fromLit);
    const toClass = to.literal;
    for (const fromClass of fromChain) {
      if (fromClass === toClass) {
        return true;
      }
    }
    return false;
  }
  if (isVoidType(from)) {
    return isClassType(to);
  }
  if (isFunctionType(from)) {
    if (!isFunctionType(to)) {
      return false;
    }
    if (!isAssignable(from.returnType, to.returnType)) {
      return false;
    }
    if (from.parameters.length !== to.parameters.length) {
      return false;
    }
    for (let i = 0; i < from.parameters.length; i++) {
      const fromParam = from.parameters[i];
      const toParam = to.parameters[i];
      if (!isAssignable(fromParam.type, toParam.type)) {
        return false;
      }
    }
    return true;
  }
  return from.$type === to.$type;
}
