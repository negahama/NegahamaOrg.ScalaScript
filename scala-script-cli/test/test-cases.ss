/**
  TestCase : interface 테스트
*/
def InterfaceTest = {
  fun get1 = () -> number => { return 1 }
  fun get2 = () -> number => { return 2 }
}

def InterfaceTest2 = {
  val get1 = () -> number => { return 1 }
  val get2 = () -> number => { return 2 }
}

/**
  TestCase : indent를 이용한 블럭 테스트
*/
var a = 0
if (a == 0) then
  console.log('a == 0')
  a = 1
else
  console.log('a != 0')
  a = 0

// 중괄호 내부에서는 들여쓰기로 블럭을 지정할 수 없다.
// var f = (a: number) => {
//   if (a == 0) then
//     console.log('a == 0')
//     a = 1
//   else
//     console.log('a != 0')
//     a = 0
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
var corp1 = new Corp1()
corp1.process1()
corp1.process2()

val f = (Corp1: Corp1) => {
  Corp1.process1()
  Corp1.process2()
}

// OjectType
val result: {
  var 누적매출: number
  var 누적매입: number
} = {
  누적매출: 0
  누적매입: 0
}

result.누적매출 += 1

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
var deptArray: Dept1[] = []
var deptList2 = deptArray.filter(dept => dept.name != 'myDeptName')
var deptList3 = deptList2.filter(dept => dept.name == '판매')
var deptList4 = deptArray.find(dept => dept.name != 'myDeptName')

var deptTable = new Map<string, Dept1>()
var deptList5 = if (deptTable.get('myDeptName').name.trim()) then deptTable.get('myDeptName') else []

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
TC02_ary.push('6')
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
  val process = () => {
    %%// for debugging...
    console.log('process')
  }
}
var corps: Corp3[]
corps.forEach(corp => corp.process())
assert(true, 'good')

val firmListByKind:{
  var firms: string[]
}[] = []

var r: string[] = []
firmListByKind.forEach(e => {
  r.push(e.firms.toString())
})

/**
  TestCase : object comparison
*/
def TC04_1 = {
  var name: string
  var extra: string
}

// TC04_1과 동일한 element를 가지고 있지만 이름이 다른 object
def TC04_2 = {
  var name: string
  var extra: string
}

// TC04_1보다 element가 작은 object
def TC04_3 = {
  var name: string
}

def TC04_4 = {
  var name: string
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
  if (t1 == t1_other) then 'equal' else 'not equal'

  // def로 정의된 object는 이름으로만 판단한다.
  // 즉 elements가 모두 같아도 이름이 다르면 다른 object로 인식하고
  // 반대로 이름이 같으면 elements가 다르더라도 같은 object로 인식한다.
  // t2 = t1
  // if (t2 == t1) then 'equal' else 'not equal'

  // def로 정의되지 않은 object는 이름과 타입이 모두 같아야 같다
  var t10: { var name: string, var extra: string }
  var t11: { var name: string, var extra: string }
  var t12: { var name: string, var extra: number }
  t10 == t11
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
  TestCase : object value's element name comparison
*/
var name = 'name'
var t1: { var name: string, var age: number } = { name: name, age: 20 }

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
    this.sales.push({
      date: 10
      cash: 100
      trade: {
        item1: 'item1'
        price: 100
      }
    })
  }
  var add2 = () => {
    this.sales.push({ date1: 20 })
  }
}

var t2 = new Array<Trade>()
var t3: Trade[] = t2

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
def Goods1 = {
  var 관련기술: string[]
}
var goodsTable: Goods1[] = []
static val getAllTech = () => {
  var set = new Set<string>()
  goodsTable.forEach(goods => {
    // 이건 지원하지 않음
    // goods.관련기술.forEach(set.add, set)
    goods.관련기술.forEach(skill => set.add(skill))
  })
  return [...set]
}

def 판매세부내역 = {
  var 상품명: string
  var 가격: number
}

val printSaleDetail = (date: string, callback: (salesDetail: 판매세부내역, total: number) -> string) => {}

printSaleDetail('01-01', (salesDetail, total) => {
  return salesDetail.상품명 .. total.toString()
})

def ChainPrompt = {
  var prompt: string
  var callback?: (list: 판매세부내역, options: string[]) -> void
  var nextChain?: ChainPrompt
}

val 기업변경_보유기술: ChainPrompt = {
  prompt: '추가할 기술?'
  callback: (list, options) => { console.log(list.가격, options) }
  nextChain: { prompt: '기술수준?' }
}
