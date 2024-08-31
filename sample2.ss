@NotTrans def Console => { log() }
@NotTrans var console: Console

%%/*
  Class
*/%%
def ClassA => {
  b: ClassB
  getB(param: string)-> ClassB => {
    return this.b
  }
}
def ClassB => {
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

def Person => {
  name: string = 'no name'
  gender: number
  age: number
  display() => {
    console.log(this.name, this.gender, this.age)
  }
}
def Student extends Person => {
  grade: number
  registerClass(what:string) => {
    console.log("register class", what)
  }
}

var boy: Student
%%//boy = new Student()
boy.display()

%%//// object type
def BasicInfo => { name: string parts: string[] }
val car: BasicInfo = {
	name = 'car'
	parts = [
		'engine',
		'wheel',
		'body'
	]
}
val obj: {
  name: string
  age: number
} = {
  name = "samuel"
  age = 50
}

