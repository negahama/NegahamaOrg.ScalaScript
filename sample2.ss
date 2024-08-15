class Console {
  log() = {
    // do nothing
  }
}
val console1: Console
val console2 = Console()

console1.log()
console2.log()

class A {
  b: B
}
class B {
  c: string
}
val a = A
val s = a.b.c

var a1, b1 = 0
a1 = 1

class Person {
  name: string = 'no name'
  gender: number
  age: number
  display() = {
    console1.log(name, gender, this.age)
  }
}
