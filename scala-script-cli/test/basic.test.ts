import { beforeAll, describe, expect, test } from 'vitest'
import type { Diagnostic } from 'vscode-languageserver-types'
import { EmptyFileSystem, type LangiumDocument } from 'langium'
import { expandToString as s } from 'langium/generate'
import { parseHelper } from 'langium/test'
import { Program } from '../../language/generated/ast.js'
import { createScalaScriptServices } from '../src/scala-script-module.js'
import { generateCode } from '../src/generator.js'
import { FunctionTypeDescriptor, TypeSystem, UnionTypeDescriptor } from '../../language/scala-script-types.js'

let services: ReturnType<typeof createScalaScriptServices>
let parse: ReturnType<typeof parseHelper<Program>>

beforeAll(async () => {
  services = createScalaScriptServices(EmptyFileSystem)
  const doParse = parseHelper<Program>(services.scalaScriptServices)
  parse = (input: string) => doParse(input, { validation: true })

  // activate the following if your linking test requires elements from a built-in library, for example
  await services.shared.workspace.WorkspaceManager.initializeWorkspace([])
})

// 중복되어진 부분을 아래 함수들을 사용해서 처리하면 좋은데 그렇게 하면 에러가 발생한 정확한 위치를 알 수가 없게 된다.
// async function expectSuccess(code: string) {
//   const document = await parse(code)

//   // check for absensce of parser errors the classic way: deacivated, find a much more human readable way below!
//   // expect(document.parseResult.parserErrors).toHaveLength(0);
//   expect(
//     document.parseResult.parserErrors.length &&
//       s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
//   ).toBe(0)
//   expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
//   expect(document?.diagnostics?.length).toBe(0)
// }

// async function expectFailure(code: string, expectedErrors: number) {
// const document = await parse(code)

// expect(
//   document.parseResult.parserErrors.length &&
//     s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
// ).toBe(0)
// expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()

// // expect(
// //   document?.diagnostics?.length && document?.diagnostics?.map(diagnosticToString)?.join("\n")
// // ).toBe(expectedErrors)
// expect(document?.diagnostics?.length).toBe(expectedErrors)
// }

// async function expectTranspile(code: string, expected: string) {
//   const document = await parse(code)

//   // await services.shared.workspace.DocumentBuilder.build([document], { validation: true })
//   const program = document.parseResult?.value
//   const transpiled = program.codes
//     .map(code => generateCode(code), {
//       appendNewLineIfNotEmpty: true,
//     })
//     .join('\n')

//   expect(
//     // here we use a (tagged) template expression to create a human readable representation
//     //  of the AST part we are interested in and that is to be compared to our expectation;
//     // prior to the tagged template expression we check for validity of the parsed document object
//     //  by means of the reusable function 'checkDocumentValid()' to sort out (critical) typos first;
//     // checkDocumentValid(document) ||
//     //   s`
//     //     ${document.parseResult.value?.codes.map(code => code.$type)?.join('\n')}
//     //   `
//     transpiled
//   ).toBe(expected)

//   expect(
//     document.parseResult.parserErrors.length &&
//       s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
//   ).toBe(0)
//   expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
//   expect(document?.diagnostics?.length).toBe(0)
// }

function diagnosticToString(d: Diagnostic) {
  return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`
}

describe('basic tests', () => {
  /**
   * TestCase : indent를 이용한 블럭 테스트
   */
  test('test of block with indent', async () => {
    const code = `
var toggle = 0
if (toggle == 0) then
  console.log('toggle == 0')
  toggle = 1
else
  console.log('toggle != 0')
  toggle = 0

// 중괄호 내부에서는 들여쓰기로 블럭을 지정할 수 없다.
var f = (a: number) => {
  if (toggle == 0) then
    console.log('toggle == 0')
    toggle = 1
}
`
    const transpiled = `let toggle = 0
if (toggle == 0) {
  console.log('toggle == 0')
  toggle = 1
}
else {
  console.log('toggle != 0')
  toggle = 0
}
let f = (a: number) => {
  if (toggle == 0) {
    console.log('toggle == 0')
  }
  toggle = 1
}`

    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)

    expect(
      document.parseResult?.value.codes
        .map(code => generateCode(code), {
          appendNewLineIfNotEmpty: true,
        })
        .join('\n')
    ).toBe(transpiled)
  })

  /**
   * TestCase : if expression 테스트
   */
  test('test of if expression', async () => {
    const code = `
var a = 1
var b = true
var c = b == (if a > 0 then true else false)
var d: boolean = if a > 0 then true else false
var n = if a > 0 then {
    console.log('a > 0')
    return true
} else {
    console.log('a <= 0')
    return false
}
`
    const transpiled = `let a = 1
let b = true
let c = b == ((a > 0) ? true : false)
let d: boolean = (a > 0) ? true : false
let n = function() {
  if (a > 0) {
    console.log('a > 0')
    return true
  }
  else {
    console.log('a <= 0')
    return false
  }
}()`

    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)

    expect(
      document.parseResult?.value.codes
        .map(code => generateCode(code), {
          appendNewLineIfNotEmpty: true,
        })
        .join('\n')
    ).toBe(transpiled)
  })

  /**
   * TestCase : 함수형 변수에 값을 대입할 경우
   * 파라메터와 리턴 타입이 정확한 경우에만 대입되어야 하고 이외에는 에러가 발생해야 한다.
   */
  test('test of functional variable assignment', async () => {
    const code = `
val run = (x: string) => { console.log(x) }

var f1: () -> number[]
f1 = () => return [1, 2, 3]
f1 = () => {
  val ary = [1, 2, 3]
  return ary
}
var f2: () -> number[] = () => [1, 2, 3]

// 아직 지원하지 않음
// var f3 : (() -> number)[]
// f3 = [() => 1, () => 2, () => 3]
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)

    const code0 = document.parseResult.value.codes[0]
    const type0 = TypeSystem.inferType(code0) as FunctionTypeDescriptor
    expect(type0.$type).toBe('function')
    expect(type0.returnType.$type).toBe('void')
    expect(type0.parameters.length).toBe(1)
    expect(type0.parameters[0].name).toBe('x')
    expect(type0.parameters[0].type.toString()).toBe('string')

    const code1 = document.parseResult.value.codes[1]
    const type1 = TypeSystem.inferType(code1) as FunctionTypeDescriptor
    expect(type1.$type).toBe('function')
    expect(type1.returnType.toString()).toBe('array<number>')
    expect(type1.parameters.length).toBe(0)
  })

  test('test of functional variable assignment - error cases', async () => {
    const code = `
var f1: () -> number
var f2: (a: string) -> number[]
f1 = (a: string) => return 1    // f1은 파라미터를 가지지 않음
f2 = (a: string) => return 1    // f2는 리턴 타입이 number[]이어야 함
f2 = (a: number) => return [1]  // f2는 파라미터 타입이 string이어야 함
f2 = () => return [1]           // f2는 파라미터 타입이 string이어야 함
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(4)
  })
})

describe('data types tests', () => {
  /**
   * TestCase : union 관련 테스트
   */
  test('test of union', async () => {
    const code = `
val n1: string[] | number[] = ['1', '2', '3']
val n2: string[] | number[] = [1, 2, 3]
n1.push('1')
n1.push(1)    // error
n2.push('1')  // error
n2.push(1)
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()

    const code1 = document.parseResult.value.codes[1]
    const type1 = TypeSystem.inferType(code1) as UnionTypeDescriptor
    expect(type1.$type).toBe('array')
    // expect(type1.$type).toBe('union')
    // expect(type1.elementTypes[0].toString()).toBe('array<string>')
    // expect(type1.elementTypes[1].toString()).toBe('array<number>')

    expect(document?.diagnostics?.length).toBe(2)
  })

  /**
   * TestCase : array, map, set 관련 테스트
   */
  test('test of array, map, set', async () => {
    const code = `
val ary: number[] = [1, 2, 3]
ary.push(4, 5, 6)
[1, 2, 3].forEach(e => console.log(e))

def Trade = {
  var item = 'item'
  var price = 100
}
var t2 = new Array<Trade>()
var t3: Trade[] = t2

def Dept = {
  var index: number
  var name: string
}
val deptArray: Dept[] = []
val deptList1 = deptArray.filter(dept => dept.name != 'myDeptName')
val deptList2 = deptArray.find(dept => dept.name != 'myDeptName')
val deptList3 = deptList1.filter(dept => dept.name == '판매')

val deptTable = new Map<string, Dept>()
val getDept = (deptName: string) -> Dept | nil => {
  val dept = deptTable.get(deptName)
  if (dept == nil) {
    console.log('undefined res:', deptName)
    return nil
  }
  return dept
}
val getAllTech = () => {
  var set = new Set<string>()
  var ary = ['a', 'b', 'c']
  ary.forEach(e => set.add(e))
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  test('test of array, map, set - error cases', async () => {
    const code = `
val ary: number[] = [1, 2, '3']
def Dept = {
  var index: number
  var name: string
}
val deptTable = new Map<string, Dept>()
// Map.get()은 undefined를 반환할 수 있으므로 아래 코드는 타입스크립트에서는 에러가 된다.
//todo 하지만 아직 스칼라스크립트에서는 지원하지 않음
var deptList5 = if (deptTable.get('myDeptName').name.trim()) then deptTable.get('myDeptName') else []

val getAllTech = () => {
  var set = new Set<string>()
  var ary = ['a', 'b', 'c']
  // 이건 스칼라스크립트에서 지원하지 않음
  ary.forEach(set.add, set)
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(2)
  })

  /**
   * TestCase : object type definition 테스트
   */
  test('test of object type definition', async () => {
    const code = `
// object type variable definition
val vehicle: {
  name: string
  parts: string[]
  run: () -> void
} = {
  name: 'car'
  parts: [
    'engine',
    'wheel',
    'body'
  ]
  run: () => { console.log('fast run') }
}

// property assignment and usage
vehicle.name = 'train'
vehicle.run = () => { console.log('fast run on the rail') }

// object value's element name comparison
val name = 'name'
val person: { name: string, age: number } = { name: name, age: 20 }

def Trade = {
  var item = 'item'
  var price = 100
}
def Sales = {
  var date: number
  var cash: number
  var trade: Trade
}
def SalesHistory = {
  private var sales: Sales[] = []
  var add = () => {
    this.sales.push({
      date: 10
      cash: 100
      trade: {
        item: 'item1'
        price: 100
      }
    })
  }
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length && document?.diagnostics?.map(diagnosticToString)?.join('\n')).toBe(0)
  })

  test('test of object type definition - transpile', async () => {
    const code = `
// object type variable definition
val vehicle: {
  name: string
  parts: string[]
  run: () -> void
} = {
  name: 'car'
  parts: [
    'engine',
    'wheel',
    'body'
  ]
  run: () => { console.log('fast run') }
}

// property assignment and usage
vehicle.name = 'train'
vehicle.run = () => { console.log('fast run on the rail') }
`
    const transpiled = `const vehicle: {
  name: string
  parts: string[]
  run: () => void
} = {
  name: 'car',
  parts: ['engine', 'wheel', 'body'],
  run: () => console.log('fast run'),
}
vehicle.name = 'train'
vehicle.run = () => console.log('fast run on the rail')`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)

    expect(
      document.parseResult?.value.codes
        .map(code => generateCode(code), {
          appendNewLineIfNotEmpty: true,
        })
        .join('\n')
    ).toBe(transpiled)
  })

  test('test of object type definition - error cases', async () => {
    const code = `
val person1: { name: string age: number } = {
  name: 1   // type이 다르면 에러
  age: 1
}
val person2: { name: string age: number } = {
  name: '1'
  // age: 1 // 항목이 초기화되지 않으면 에러
}

def Trade = {
  var item = 'item'
  var price = 100
}
def Sales = {
  var date: number
  var cash: number
  var trade: Trade
}
def SalesHistory = {
  private var sales: Sales[] = []
  var add = () => {
    this.sales.push({
      date: 10
      cash: 100
      trade: {
        item1: 'item1' // error
        price: 100
      }
    })
  }
  %%// 타입스크립트에서 아래 코드는 필수 프로퍼티가 모두 존재하지 않기 때문에 에러가 된다.
  var add2 = () => {
    this.sales.push({ date1: 20 })
    this.sales.push({ date: 20 })
  }
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(4)
  })
})

describe('infer types tests', () => {
  /**
   * TestCase : infer parameter test... Binding에 Binding이 포함된 경우
   */
  test('test of binding in binding', async () => {
    const code = `
def Corp = {
  var name: string
}
def ChainPrompt = {
  var prompt: string
  var callback?: (corp: Corp, options: string[]) -> void
  var nextChain?: ChainPrompt
}
val 보유기술: ChainPrompt = {
  prompt: '추가할 기술?'
  callback: (corp, options) => { console.log(corp.name, options) }
  nextChain: { prompt: '기술수준?' }
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  /**
   * TestCase : 함수의 파라메터 타입이 올바른 경우와 그렇지 않은 경우
   */
  test('test of function parameter type check', async () => {
    const code = `
val f1 = (a: number, b?: string) => { return a }
f1(1)
f1(1, '2')

val sum = (a: number, b: number) -> number => a + b
val f2 = (a: number, b: number, callback: (a: number, b: number) -> number) => callback(a, b)
f2(1, 2, sum)

val ary = [1, 2, 3]
ary.push(4, 5, 6)
ary.forEach(num => {
  var n: number = num
})

def Person = {
  var name: string
  var age: number
}
val people: Person[] = []
val f3 = () => {
  people.find(p => p.age == 20)
  people.filter(p => p.age == 1)
  // p은 타입이나 값이 없는 파라미터이므로 forEach를 통해 people의 element type인 Person이 되어야 한다.
  people.forEach(p => {
    people.filter(d => d == p)
    people.filter(d => d.age == p.age)
  })
}

val getPerson = (info: number | string, createCallback: (name: string) -> void) -> Person | nil => {
  if (typeof info == 'number') {
    val person = people.find(c => c.age == info)
    if (person != nil) return person
    assert(false, info.toString())
  } else {
    val person = people.find((c) => c.name == info)
    if (person != nil) return person

    createCallback(info)
    val person2 = people.find((c) => c.name == info)
    assert.notEqual(person2, nil, info)
    return person2
  }
}

def Corp = {
  var name: string
  var firms: string[]
  val process = () => {
    %%// for debugging...
    console.log('process')
  }
}

val corps: Corp[] = []
corps.forEach(corp => corp.process())
assert(true, 'good')

val r: string[] = []
corps.forEach(e => {
  r.push(e.firms.toString())
})

val printSaleDetail = (date: string, callback: (corp: Corp, sale: number) -> string) => {}
printSaleDetail('01-01', (corp, sale) => {
  return corp.name .. sale.toString()
})
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  test('test of function parameter type check - error cases', async () => {
    const code = `
val f = (a: number, b?: string) => { return a }
f()
f(1, 2)
f('1')

val ary = [1, 2, 3]
ary.push('6')
ary.forEach(num => {
  var n: string = num
})

def Person = {
  var name: string
  var age: number
}
val people: Person[] = []
val f3 = () => {
  people.find(p => p.name == 20)
  people.forEach(p => {
    people.filter(d => d.name == p.age)
  })
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(7)
  })
})

describe('class tests', () => {
  /**
   * TestCase : interface & class transpile 테스트
   */
  test('test of interface & class transpile', async () => {
    const code = `
def ToInterface = {
  var n: number
  var s: string
}
// 값이 있거나 static 이면 class로 변환된다.
def ToClass = {
  var n: number = 0
  static var s: string = ''
}
`
    const transpiled = `
interface ToInterface {
  n: number
  s: string
}

class ToClass {
  n: number = 0
  static s: string = ''
}`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)

    expect(
      document.parseResult?.value.codes
        .map(code => generateCode(code), {
          appendNewLineIfNotEmpty: true,
        })
        .join('\n')
    ).toBe(transpiled)
  })

  /**
   * TestCase : static method 테스트
   */
  test('test of static method', async () => {
    const code = `
def Corp = {
  val normalMethod = () => {
    console.log('process')
  }
  static val staticMethod = () => {
    console.log('static process')
  }
}
// Corp.normalMethod()는 에러로 아래에서 테스트된다.
Corp.staticMethod()

var corp = new Corp()
corp.normalMethod()
//todo 타입스크립트에서 static 함수는 클래스명으로만 호출 가능하다. 따라서 이것은 에러로 처리되어야 하는데 아직 지원하지 않음
corp.staticMethod()
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  test('test of static method - error cases', async () => {
    const code = `
def Corp = {
  val normalMethod = () => {
    console.log('process')
  }
  static val staticMethod = () => {
    console.log('static process')
  }
}
// 이건 에러이어야 함
normalMethod()
staticMethod()
Corp.normalMethod()

//todo 타입스크립트에서 static 함수는 클래스명으로만 호출 가능하다. 따라서 이것은 에러로 처리되어야 하는데 아직 지원하지 않음
var corp = new Corp()
corp.staticMethod()
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(3)
  })

  /**
   * TestCase : class name과 동일한 이름의 변수가 존재하는 경우
   * 변수와 class name이 충돌하지 않고 static인 경우등이 정상적으로 동작해야 한다.
   */
  test('test class name and variable name are the same', async () => {
    const code = `
def Corp = {
  val normalMethod = () => {
    console.log('process')
  }
  static val staticMethod = () => {
    console.log('static process')
  }
}

// 클래스명과 동일한 변수명 사용시
val f = (Corp: Corp) => {
  Corp.normalMethod()
  Corp.staticMethod()
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  /**
   * TestCase : def에 자신을 타입으로 가지는 element가 존재하는 경우
   * inferType()에서 object type을 재귀적으로 호출하지 않고 정상적으로 추론해야 한다.
   */
  test('test class has property as itself', async () => {
    const code = `
// def에 자신을 타입으로 가지는 element가 존재하는 경우
def Corp = {
  var corp: Corp = new Corp()
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  /**
   * TestCase : super 테스트
   */
  test('test of super', async () => {
    const code = `
def grandparents = {
  fun process = () => {
    console.log("grandparents process")
  }
}
def parents extends grandparents = {
  fun process = () => {
    console.log("parents process")
  }
}
var value = 0
def child extends parents = {
  fun process = () => {
    if (value > 100) return super.process()
    console.log("child process")
  }
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  /**
   * TestCase : class comparison
   */
  test('test of class comparison', async () => {
    const code = `
// interface가 아니라 class로 생성되게끔 name에 값을 추가해 준다.
def TC04_1 = {
  var name: string = ''
  var extra: string
}

// TC04_1과 동일한 element를 가지고 있지만 이름이 다른 object
def TC04_2 = {
  var name: string = ''
  var extra: string
}

// TC04_1보다 element가 작은 object
def TC04_3 = {
  var name: string = ''
}

def TC04_4 = {
  var name: string = ''
  var kind?: string
  var extra1?: number
  var extra2?: string
}

val TC04 = () => {
  var t1 = new TC04_1()
  var t2 = new TC04_2()
  var t3 = new TC04_3()
  var t4 = new TC04_4()
  var t1_other = new TC04_1()

  // 같은 object는 문제될 것이 없다.
  t1 = t1_other
  var result = if (t1 == t1_other) then 'equal' else 'not equal'

  // def로 정의되지 않은 object는 이름과 타입이 모두 같아야 같다
  var t10: { name: string, extra: string }
  var t11: { name: string, extra: string }
  var t12: { name: string, extra: number }

  // element가 더 적은 경우에 할당할 때는 추가 항목이 있을 수 없으며 타입이 맞아야 한다.
  t3 = { name: 'TC00_1' }
  t4 = { name: 'TC00_1', extra1: 1 }
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  test('test of class comparison - error cases', async () => {
    const code = `
// interface가 아니라 class로 생성되게끔 name에 값을 추가해 준다.
def TC04_1 = {
  var name: string = ''
  var extra: string
}

// TC04_1과 동일한 element를 가지고 있지만 이름이 다른 object
def TC04_2 = {
  var name: string = ''
  var extra: string
}

// TC04_1보다 element가 작은 object
def TC04_3 = {
  var name: string = ''
}

def TC04_4 = {
  var name: string = ''
  var kind?: string
  var extra1?: number
  var extra2?: string
}

val TC04 = () => {
  var t1 = new TC04_1()
  var t2 = new TC04_2()
  var t3 = new TC04_3()
  var t4 = new TC04_4()
  var t1_other = new TC04_1()

  // def로 정의된 object는 이름으로만 판단한다.
  // 즉 elements가 모두 같아도 이름이 다르면 다른 object로 인식하고
  // 반대로 이름이 같으면 elements가 다르더라도 같은 object로 인식한다.
  t2 = t1
  result = if (t2 == t1) then 'equal' else 'not equal'

  // 스칼라스크립트에서는 타입만 검사하기 때문에 아래 코드가 문제가 안되지만
  // 타입스크립트에서는 동등 연산자는 타입과 값을 모두 검사하는데
  // 아래 코드는 값이 할당되어지지 않은 상태라 에러가 된다.
  t10 == t11
  t10 == t12

  // element가 더 적은 경우에 할당할 때는 추가 항목이 있을 수 없으며 타입이 맞아야 한다.
  t3 = t1
  t3 = { name: 'TC00_1', extra1: 'extra' }
  t4 = t1
  t4 = { name: 'TC00_1', extra1: 'extra' }
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(12)
  })

  /**
   * TestCase : class override
   */
  test('test of class override', async () => {
    const code = `
def InterfaceTest1 = {
  // val get0 = () -> number // 함수형 변수가 정의되지 않는 이유는?
  fun get1 = () -> number => { return 1 }
  fun get2 = () -> number => { return 2 }
}
def InterfaceTest2 = {
  val get1 = () -> number => { return 1 }
  val get2 = () -> number => { return 2 }
}
def OverrideTest = {
  fun get11 = () -> number => { return 1 }
  fun get12 = () -> number => { return 1 }
  val get21 = () -> number => { return 2 }
  val get22 = () -> number => { return 2 }
  var get31 = () -> number => { return 3 }
  var get32 = () -> number => { return 3 }
}
def OverrideTest2 extends OverrideTest = {
  fun get11 = () -> number => { return super.get11() + 10 }
  fun get12 = () -> number => { return 10 }
  // 스칼라스크립트는 부모 클래스에서 val로 선언된 메소드는 자식 클래스에서 재정의 할 수 없다.
  val get21 = () -> number => { return super.get21() + 20 }
  val get22 = () -> number => { return 20 }
  // 부모 클래스에서 프로퍼티(함수형 변수)인 것은 자식 클래스에서 재정의할 수 있다.
  // 하지만 이것은 함수가 아니므로 super 사용이 안된다. super가 사용가능하려면 함수이어야 하는데 자식 클래스에서
  // get31을 함수로 바꿔도 안된다. 이때는 get31이란 이름이 프로퍼티에서 함수로 바뀌는건데 타입스크립트에서 허락되지 않음
  // 즉 super를 사용하려면 부모 클래스에서 fun으로 정의해야 한다.
  // 사실 부모 클래스의 get31을 내부적으로 함수로 바꿔주면 궂이 fun을 사용하지 않고 구현할 수 있다.
  // 하지만 이 경우 변수인 get31을 super.get31이라고 쓸 수 있는 것 자체가 모순이 된다.
  var get31 = () -> number => { return super.get31() + 30 }
  var get32 = () -> number => { return 30 }
}
val overrideTest = new OverrideTest2()
console.log(overrideTest.get11())
console.log(overrideTest.get12())
console.log(overrideTest.get32())
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })

  /**
   * TestCase : 파생 클래스의 구분
   */
  test('test of instanceof', async () => {
    const code = `
def Logger = {
  fun log = (msg: string) => {
  }
}
def FileLogger extends Logger = {
  var logFileName: string = ''
  fun log = (msg: string) => {
    console.log(msg)
  }
  val log2 = (msg: string) => {
    console.log(msg)
  }
}
static var loggers: Logger[] = []
static val smartlog = (msg: string = '') => {
  loggers.forEach(logger => {
    // if (logger instanceof FileLogger) logger.log2(msg)
    logger.log(msg)
  })
}
`
    const document = await parse(code)
    expect(
      document.parseResult.parserErrors.length &&
        s`Parser errors: ${document.parseResult.parserErrors.map(e => e.message).join('\n')}`
    ).toBe(0)
    expect(document.parseResult.value === undefined && `ParseResult is 'undefined'.`).not.toBeUndefined()
    expect(document?.diagnostics?.length).toBe(0)
  })
})
