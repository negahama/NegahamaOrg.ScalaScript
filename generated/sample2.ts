// This is transpiled by ScalaScript
"use strict";

/*
  Class
*/
class ClassA {
  b: ClassB;
  getB(param: string): ClassB {
    return this.b;
  }
}
class ClassB {
  c: string;
}
let classA: ClassA;
classA = new ClassA
const st1 = classA.b.c;
const st2 = classA.getB("dummy").c;
function fun(a: number) {
  let b = 0;
  b = 1;
}
class Person {
  name: string = 'no name';
  gender: number;
  age: number;
  display() {
    console.log(this.name, this.gender, this.age)
  }
}
class Student extends Person {
  grade: number;
  registerClass(what: string) {
    console.log("register class", what)
  }
}
let boy: Student;
boy = new Student()
boy.display()
// object type
interface BasicInfo {name: string, parts: string[]}
const car: BasicInfo = {
  name: 'car',
  parts: ['engine', 'wheel', 'body'],
};
const obj: {name: string, age: number} = {
  name: "samuel",
  age: 50,
};
