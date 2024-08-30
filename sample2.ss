@NotTrans class Console { log() }
@NotTrans var console: Console

%%/*
  Class
*/%%
class ClassA {
  b: ClassB
  getB(param: string)-> ClassB => {
    return this.b
  }
}
class ClassB {
  c: string
}
var classA: ClassA
%%//classA = new ClassA
val st1 = classA.b.c
val st2 = classA.getB("dummy").c

def fun(a: number) => {
  var b = 0
  b = 1
}

class Person {
  name: string = 'no name'
  gender: number
  age: number
  display() => {
    console.log(this.name, this.gender, this.age)
  }
}
class Student extends Person {
  grade: number
  registerClass(what:string) => {
    console.log("register class", what)
  }
}

var boy: Student
%%//boy = new Student()
boy.display()

%%//// object type
type BasicInfo = { name: string, parts: string[] }
val car: BasicInfo = {
	name: 'car',
	parts: [
		'engine',
		'wheel',
		'body'
	]
}
val obj: {
  name: string,
  age: number
} = {
  name: "samuel",
  age: 50
}

