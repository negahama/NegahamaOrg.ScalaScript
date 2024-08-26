// This is transpiled by ScalaScript
"use strict";

/*
  Class
*/
class Person {
  name: string = 'no name';
  gender: number;
  age: number;
  display() {
  }
}
class Student extends Person {
  grade: number;
  registerClass(what: Class) {
    console.log("register class", what)
  }
}
class Class {
  name: string;
}
let person: Person;
person = new Person()
person.display()
const oncePerSecond = (callback: (p: string) => void): void => {
  //def oncePerSecond(callback: (p: string)-> void)-> void => {
  while (true) {
    callback('1초 지남!')
    Thread.sleep(1000)
  }
  setTimeout(() => {
    callback('1초 지남!')
  }, 1000)
};
//def main(args: Array[String])-> Unit => {
//  oncePerSecond(timeFlies)
//}
/*
  반복문 관련
*/
function sum(a: number, b: number) {
  return a + b;
}
const array2: string[] = ['a', 'b', 'c'];
for (const a of array2) {
  for (const b of array2) {
    console.log(a, b)
  }
}
let arrLen = 1;
while (arrLen < array2.length && sum(arrLen, 1) == 2) {
  arrLen += 1;
}
do {
  console.log(arrLen)
} while (arrLen < array2.length && sum(arrLen, 1) == 2)
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
