// This is transpiled by ScalaScript
"use strict";

/*
  자료형 및 선언과 정의, 다중 대입
*/
// primitive types
let a: number = 255, b: number = 255, c: number = 255;
class Console {
  log() {
    // do nothing..
  }
}
let console: Console;
const s: string = "abc" + 'def' + 's';
a = b = c = 3 + 9 + 17 + 11.1 + 11;
c = (1 + 2) * 3 % 2 ** 3;
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
// function types and anonymous function call
// 스칼라는 인수의 이름을 명시할 필요없이 인수의 타입만 열거해서 표현한다.
// 인수가 하나이면 괄호를 생략할 수 있고 인수가 없으면 빈 괄호로 표현한다.
// 반면 타입스크립트는 형식적인 인수명이 있어야 한다.
// 그리고 인수가 하나만 있는 경우라도 괄호가 반드시 필요하다.
// 스칼라스크립트는 타입스크립트와 동일하다.
let t1: () => number;
let t2: (arg: number) => number;
// 스칼라는 익명 함수를 표현할때 그냥 인수(또는 `_`) 하나만 달랑 쓰거나 아니면
// 인수의 타입을 명시해야 하거나 인수가 여러 개이면 괄호로 묶어야 하고
// 익명 함수의 리턴 타입은 명시할 수 없는 것 같다.
// 타입스크립트는 스칼라와 동일한데 익명 함수의 리턴 타입을 지정할 수 있다.
// 스칼라스크립트는 여기에 더해 인수가 하나이고 타입을 명시할 경우에도 괄호가 필요하지 않다.
const lambda1 = () => {
  return 1;
};
const lambda2 = (arg) => {
  return arg;
};
const lambda3 = (arg: number) => {
  return arg;
};
const lambda4 = (arg: number) => {
  return arg;
};
const lambda5 = (arg: number): number => {
  return arg;
};
// array and tuple type
const array: string[] = ['a', 'b', 'c'];
const tuple: [string, number, boolean] = ['Hello', 42, true];
const s1 = array[a + b] + array[1];
/*
  Class
*/
class Person {
  name: string = 'no name';
  gender: number;
  age: number;
  display() {
    //todo console.log(this.name, this.gender, this.age)
  }
  sum(a: number, b: number): number {
    return a + b;
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
/*
  함수 정의
*/
function sum(a: number, b: number): number {
  return a + b;
}
const oncePerSecond = (callback: (p: string) => void): void => {
  //def oncePerSecond(callback: (p: string) => void): void = {
  while (true) {
    callback('1초 지남!')
    /*Thread sleep 1000*/
  }
  // setTimeout(() => {
  //   callback('1초 지남!')
  // }, 1000)
};
const timeFlies = (msg: string) => {
  //def timeFlies(msg: string): void = {
  console.log("time flies like an arrow... ", msg)
};
//def main(args: Array[String]): Unit = {
//  oncePerSecond(timeFlies)
//}
/*
  함수 호출
*/
//todo s.startsWith("\r\n")
//todo var list2 = s.concat("2" + 'def').trim().split(",")
//var list = if s.startsWith("* ") then s.trim() else s
/*
  조건문, 반복문 관련
*/
function matchTest(x: number): string {
  switch (x) {
    case 1: {
      return "one";;
    }
    case 2: {
      return "two";;
    }
    default: {
      return "other";;
    }
  }
}
for (let a = 1; a <= 10; a++) {
  for (let b = 1; b <= 10; b++) {
    for (let c = 1; c <= 10; c++) {
      console.log(a)
      if (a == b) {
        console.log('a == b')
      }
      else if (a < b) {
        console.log("a < b")
      }
      else if (a > b) {
        console.log("a > b")
      }
      else {
        console.log("error")
        const x: number = 2;
        switch (x) {
          case 0: {
            "zero"
            break;
          }
          case 1: {
            "one"
            continue;
          }
          case 2: {
            "two";
          }
          default: {
            "other";
          }
        }
      }
    }
  }
}
if (! a) {
  console.log('a is not true')
}
for (const a of array) {
  for (const b of array) {
    console.log(a, b)
  }
}
//todo while a < array.length and sum(a, b) == 2 b += 1
//todo do console.log(a) while a < array.length and sum(a, b) == 2
do {
  console.log(a)
  a += 1;
} while (a <= 10)
/*
  주석은 그대로 변환되어야 한다.
*/
function generateBypassElement(bypass: string[]): string {
  let result = "";
  //todo
    // bypass.forEach(s:string => {
  //   // 의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
  //   var ns = s
  //   if (s.startsWith("\r\n")) ns = ns.slice(2)
  //   ns = ns.trimEnd()
  //   result += ns
  // })
  //return result
  
}
