// This is transpiled by ScalaScript
"use strict";

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
/*
  Class
*/
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
const oncePerSecond = (callback: (p: string) => void): void => {
  //def oncePerSecond(callback: (p: string)-> void)-> void => {
  setTimeout(() => {
    callback('1초 지남!')
  }, 1000)
  while (true) {
    callback('1초 지남!')
    boy.registerClass("English")
  }
};
/*
  반복문 관련
*/
function sum(a: number, b: number): number {
  return a + b;
}
const array2: string[] = ['a', 'b', 'c'];
for (const a of array2) {
  for (const b of array2) {
    console.log(a, b)
  }
}
let arrLen = 1;
while (arrLen < array2.length() && sum(arrLen, 1) == 2) {
  arrLen += 1;
}
do {
  console.log(arrLen)
} while (arrLen < array2.length() && sum(arrLen, 1) == 2)
function generateBypassElement(bypass: string[]): string {
  let result: string = "";
  let t = result.trim();
  bypass.forEach((s: string) => {
    let ns: string = s;
    if (s.startsWith("\r\n")) {
      ns = ns.slice(2 - 1);
    }
    ns = ns.trim();
    result += ns;
  })
  return result;
}
