// This is transpiled by ScalaScript
"use strict";

/*
  자료형 및 선언과 정의, 다중 대입
*/
// 다중 선언
let a: number = 255, b: number = 255, c: number = 255;
// 다중 대입
a = b = c = 3 + 9 + 17 + 11.1 + 11;
// 각종 산술 연산자
c = (1 + 2) * 3 % 2 ** 3;
// 문자열 접합 연산자
const ts: string = "abc" + 'def' + 's';
// 삼항 연산자
let gender = (a == 1) ? 'male' : 'female';
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
// array and tuple type
const array: string[] = ['a', 'b', 'c'];
const tuple: [string, number, boolean] = ['Hello', 42, true];
const s1 = array[(a + b) - 1] + array[(1) - 1];
/*
  함수 정의
*/
function factorial(N: number): number {
  let sum: number = 0;
    for (let d = 1; d <= N; d++) {
    sum += d;
  }
  return sum;
}
const timeFlies1 = (msg: string): void => {
  console.log("time flies like an arrow... ", msg)
};
function timeFlies2(msg: string): void {
  console.log("time flies like an arrow... ", msg)
}
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
/*
  조건문
*/
if (! a) {
  console.log('a is not true')
}
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
/*
  반복문 관련
*/
for (const a of array) {
  for (const b of array) {
    console.log(a, b)
  }
}
do {
  console.log(a)
  a += 1;
} while (a <= 10)
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
