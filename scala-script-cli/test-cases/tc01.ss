/*
TestCase
- 상황: interface 테스트
*/
def InterfaceTest = {
  fun get1 = () -> number => { return 1 }
  fun get2 = () -> number => { return 2 }
}

def InterfaceTest2 = {
  val get1 = () -> number => { return 1 }
  val get2 = () -> number => { return 2 }
}

/*
TestCase
- 상황: indent를 이용한 블럭 테스트
*/
var a = 0
if (a == 0) then
  console.log('a == 0')
  a = 1
else
  console.log('a != 0')
  a = 0

/*
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
var corp = new Corp1()
corp.process1()
corp.process2()

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

/*
TestCase
- 상황: def에 자신을 타입으로 가지는 element가 존재하는 경우
- 기대: inferType()에서 object type을 재귀적으로 호출하지 않고 정상적으로 추론해야 한다.
*/
def Corp2 = {
  var corp: Corp2 = new Corp2()
}

/*
TestCase
- 상황: array, map의 functional method을 사용할 때
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

/*
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

/*
TestCase
- 상황: 함수의 파라메터 타입이 올바른 경우와 그렇지 않은 경우
    function이 cache되어지고 cache되어진 것을 사용하는지 테스트
*/
val TC02 = (a: number) => {
  return a
}
TC02(1)
TC02()
TC02('1')

var TC02_ary = [1, 2, 3]
TC02_ary.push(4, 5)
TC02_ary.push('6')

/*
TestCase
- 상황: infer parameter test
*/
def TC03 = {
  var index: number
  var name: string
  var age: number
}

val TC03_sum = (a: number, b: number) -> number => a + b
val TC03_f1 = (a: number, b: number, callback: (a: number, b: number) -> number) => callback(a, b)
TC03_f1(1, 2, TC03_sum)

var columns: TC03[] = []
columns.find(e => e == 2)

// type은 타입이나 값이 없는 파라미터이므로 forEach를 통해 ary의 element type이 되어야 한다.
val TC03_f2 = () => {
  columns.filter(d => d == 1)
  columns.forEach(type => {
    columns.filter(d => d == type)
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
