%%
import assert from 'assert'
%%

/**
  TestCase : indent를 이용한 블럭 테스트
*/
var toggle = 0
if (toggle == 0) then
  console.log('toggle == 0')
  toggle = 1
else
  console.log('toggle != 0')
  toggle = 0

// 중괄호 내부에서는 들여쓰기로 블럭을 지정할 수 없다.
// var f = (a: number) => {
//   if (toggle == 0) then
//     console.log('toggle == 0')
//     toggle = 1
//   else
//     console.log('toggle != 0')
//     toggle = 0
// }

/**
  TestCase
  - 상황: def name과 동일한 이름의 변수가 존재하는 경우
  - 기대: 변수와 def name이 충돌하지 않고 static인 경우등이 정상적으로 동작해야 한다.
*/
def Corp1 = {
  val process1 = () => {
    console.log('process')
  }
  static val process2 = () => {
    console.log('static process')
  }
}
// 이건 에러이어야 함
// process1()
// process2()
// Corp1.process1()
Corp1.process2()

// static 함수 호출이 가능?
// 타입스크립트에서 static 함수는 클래스명으로만 호출 가능하다.
// 따라서 corp1.process2()는 타입스크립트에서 에러이다.
var corp1 = new Corp1()
corp1.process1()
// corp1.process2()

// 클래스명과 동일한 변수명 사용시
val f = (Corp1: Corp1) => {
  Corp1.process1()
  // Corp1.process2() // 이것도 타입스크립트에서는 에러이다.
}

/**
  TestCase
  - 상황: def에 자신을 타입으로 가지는 element가 존재하는 경우
  - 기대: inferType()에서 object type을 재귀적으로 호출하지 않고 정상적으로 추론해야 한다.
*/
def Corp2 = {
  var corp2: Corp2 = new Corp2()
}

/**
  TestCase : array, map의 functional method을 사용할 때
*/
def Dept1 = {
  var index: number
  var name: string
}

%%// array test
var deptArray: Dept1[] = []
var deptList2 = deptArray.filter(dept => dept.name != 'myDeptName')
var deptList3 = deptList2.filter(dept => dept.name == '판매')
var deptList4 = deptArray.find(dept => dept.name != 'myDeptName')

%%// map test
var deptTable = new Map<string, Dept1>()
// Map.get()은 undefined를 반환할 수 있으므로 아래 코드는 타입스크립트에서는 에러가 된다.
// var deptList5 = if (deptTable.get('myDeptName').name.trim()) then deptTable.get('myDeptName') else []

val getDept = (deptName: string) -> Dept1 | nil => {
  val dept = deptTable.get(deptName)
  if (dept == nil) {
    console.log('undefined res:', deptName)
    return nil
  }
  return dept
}

/**
  TestCase
  - 상황: 함수형 변수에 값을 대입할 경우
  - 기대: 파라메터와 리턴 타입의 정확한 경우에만 대입되어야 하고 이외에는 에러가 발생해야 한다.
*/
var TC01_f1: () -> number[]
TC01_f1 = () => return [1, 2, 3]

// 이건 에러이어야 함
// TC01_f1 = () => {
//   return 1
// }

var TC01_f2 : () -> number[] = () => {
  return [1, 2, 3]
}
var TC01_f3 : () -> number[] = () => [1, 2, 3]

// 아직 지원하지 않음
// var TC01_f4 : (() -> number)[]
// TC01_f4 = [() => 1, () => 2, () => 3]

/**
  TestCase
  - 상황: 함수의 파라메터 타입이 올바른 경우와 그렇지 않은 경우
      function이 cache되어지고 cache되어진 것을 사용하는지 테스트
*/
val TC02 = (a: number, b?: string) => {
  return a
}

TC02(1)
TC02(1, '2')

// 이건 에러이어야 함
// TC02()
// TC02(1, 2)
// TC02('1')

var TC02_ary = [1, 2, 3]
TC02_ary.push(4, 5)
// TC02_ary.push('6')
TC02_ary.forEach(num => {
  console.log(num)
})

/**
  TestCase : infer parameter test
*/
val TC03_sum = (a: number, b: number) -> number => a + b
val TC03_f1 = (a: number, b: number, callback: (a: number, b: number) -> number) => callback(a, b)
TC03_f1(1, 2, TC03_sum)

def TC03 = {
  var index: number
  var name: string
  var age: number
}

var columns: TC03[] = []
val TC03_f2 = () => {
  columns.find(e => e.age == 20)
  // columns.find(e => e.name == 20)
  columns.filter(d => d.age == 1)
  // type은 타입이나 값이 없는 파라미터이므로 forEach를 통해 columns의 element type인 TC03이 되어야 한다.
  columns.forEach(type => {
    columns.filter(d => d == type)
    columns.filter(d => d.age == type.age)
    // columns.filter(d => d.name == type.age)
  })
}

val getColumn = (column: number | string, createCallback: (column: string) -> void) -> TC03 | nil => {
  if (typeof column == 'number') {
    val col = columns.find(c => c.index == column)
    if (col != nil) return col
    assert(false, column.toString())
  } else {
    val col = columns.find((c) => c.name == column)
    if (col != nil) return col

    createCallback(column)
    val col2 = columns.find((c) => c.name == column)
    assert.notEqual(col2, nil, column)
    return col2
  }
}

def Corp3 = {
  var name: string
  var firms: string[]
  val process = () => {
    %%// for debugging...
    console.log('process')
  }
}

var corps: Corp3[] = []
corps.forEach(corp => corp.process())
assert(true, 'good')

var r: string[] = []
corps.forEach(e => {
  r.push(e.firms.toString())
})

val printSaleDetail = (date: string, callback: (corp: Corp3, sale: number) -> string) => {}

printSaleDetail('01-01', (corp, sale) => {
  return corp.name .. sale.toString()
})

/**
  TestCase : infer parameter test... Binding에 Binding이 포함된 경우
*/
def ChainPrompt = {
  var prompt: string
  var callback?: (corp: Corp3, options: string[]) -> void
  var nextChain?: ChainPrompt
}

val 보유기술: ChainPrompt = {
  prompt: '추가할 기술?'
  callback: (corp, options) => { console.log(corp.name, options) }
  nextChain: { prompt: '기술수준?' }
}

/**
  TestCase : 
*/
// def Logger = {
//   fun log = (msg: string) => {
//   }
// }

// def FileLogger extends Logger = {
//   var logFileName: string = ''
//   fun log = (msg: string) => {
//     console.log(msg)
//   }
//   val log2 = (msg: string) => {
//     console.log(msg)
//   }
// }

// static var loggers: Logger[] = []
// static val smartlog = (msg: string = '') => {
//   loggers.forEach(logger => {
//     // if (logger instanceof FileLogger) logger.log2(msg)
//     logger.log(msg)
//   })
// }

/**
  TestCase : 
*/
val getAllTech = () => {
  var set = new Set<string>()
  var ary = ['a', 'b', 'c']
  // 이건 지원하지 않음
  // ary.forEach(set.add, set)
  ary.forEach(e => set.add(e))
}

/**
  TestCase : 
*/
[1, 2, 3].forEach(e => console.log(e))

/**
  TestCase : super 테스트
*/
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

/**
  TestCase : const는 초기화 필요
*/
// val n: number

/**
  TestCase : Object 관련 테스트
*/

/**
  TestCase : ObjectType 변수 선언
*/
// 초기값도 있고 초기값 있으면 따로 설정할지 않을 수도 있으면 좋을 듯
// var 가 있거나 초기값이 있는 것은 클래스 선언과 동일하게 보기 때문이긴 하지만 여기서는 불편한다.
// val main 이면 변환시 초기화가 모두 되어져 있어야 한다.
// 상수는 반드시 초기화되어져 있어야 한다.
var person1: {
  // name: string = "name" // 초기값 있으면 변환시 에러
  age: number
} = {
  // name: 1  // type이 다르면 에러
  age: 1      // age 빠지면 변환시 에러
}

/**
  TestCase : object value's element name comparison
*/
var name = 'name'
var person2: { name: string, age: number } = { name: name, age: 20 }

// 반드시 초기화 필요하다.
val object: {
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

object.name = 'train'
object.run = () => { console.log('fast run on the rail') }

/**
  TestCase : interface 테스트
*/
def ToInterface = {
  // var a
  var b: number
  var c: string
}

/**
  TestCase : class 테스트
*/
// 값이 있거나 static 이면 class로 변환된다.
def ToClass = {
  // var b: number = 0
  static var c: string = ''
}

/**
  TestCase : object comparison
*/
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

  // def로 정의된 object는 이름으로만 판단한다.
  // 즉 elements가 모두 같아도 이름이 다르면 다른 object로 인식하고
  // 반대로 이름이 같으면 elements가 다르더라도 같은 object로 인식한다.
  // t2 = t1
  // result = if (t2 == t1) then 'equal' else 'not equal'

  // def로 정의되지 않은 object는 이름과 타입이 모두 같아야 같다
  var t10: { name: string, extra: string }
  var t11: { name: string, extra: string }
  var t12: { name: string, extra: number }

  %%
  // 스칼라스크립트에서는 타입만 검사하기 때문에 아래 코드가 문제가 안되지만
  // 타입스크립트에서는 동등 연산자는 타입과 값을 모두 검사하는데
  // 아래 코드는 값이 할당되어지지 않은 상태라 에러가 된다.
  %%
  // t10 == t11
  // t10 == t12

  // element가 더 적은 경우에 할당할 때는 추가 항목이 있을 수 없으며 타입이 맞아야 한다.
  // t3 = t1
  t3 = { name: 'TC00_1' }
  // t3 = { name: 'TC00_1', extra1: 'extra' }
  // t4 = t1
  t4 = { name: 'TC00_1', extra1: 1 }
  // t4 = { name: 'TC00_1', extra1: 'extra' }
}

/**
  TestCase : array[] vs Array object comparison
*/
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
    // this.sales.push({
    //   date: 10
    //   cash: 100
    //   trade: {
    //     item1: 'item1' // error
    //     price: 100
    //   }
    // })
    this.sales.push({
      date: 10
      cash: 100
      trade: {
        item: 'item1'
        price: 100
      }
    })
  }

  %%// 타입스크립트에서 아래 코드는 필수 프로퍼티가 모두 존재하지 않기 때문에 에러가 된다.
  var add2 = () => {
    // this.sales.push({ date1: 20 })
    // this.sales.push({ date: 20 })
  }
}

var t2 = new Array<Trade>()
var t3: Trade[] = t2

/**
  TestCase : fun 함수 정의문 테스트
*/
def InterfaceTest1 = {
  // val get0 = () -> number // 함수형 변수가 정의되지 않는 이유는?
  fun get1 = () -> number => { return 1 }
  fun get2 = () -> number => { return 2 }
}

def InterfaceTest2 = {
  val get1 = () -> number => { return 1 }
  val get2 = () -> number => { return 2 }
}

/**
  TestCase : override 테스트
*/
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

