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
// 삼항 연산자
let gender = (a == 1) ? 'male' : 'female';
/*
  문자열 관련
*/
let s1: string = "this is sample";
let list2 = s1.concat("2" + 'def').trim().split(",");
// 문자열 접합 연산자
let ts: string = "abc" + 'def' + 's';
// 문자열 length
if (ts.length > 0) {
  ts = "1";
}
// 문자열 인덱스는 1 부터
const included = ts.includes("is", 1 - 1);
/*
  배열 관련
*/
// array type
const array1: string[] = ['a', 'b', 'c'];
// array length
if (array1.length > 0) {
  s1 = "2";
}
// 배열의 인덱스는 1 부터
s1 = array1[(a + b) - 1] + array1[(1) - 1];
/*
  조건문
*/
if (! ts) {
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
const array2: string[] = ['a', 'b', 'c'];
// for parameter type check
let sum = 0;
for (let d = 1; d <= 10; d++) {
  sum += d;
}
let result = "";
for (const e of array2) {
  result = result + e;
}
// 중첩 for 문
for (const a of array2) {
  for (const b of array2) {
    console.log(a, b)
  }
}
// do/while 문
let arrLen = 1;
while (arrLen < array2.length && arrLen >= 2) {
  arrLen += 1;
}
do {
  console.log(arrLen)
} while (arrLen < array2.length && arrLen >= 2)
do {
  console.log(a)
  a += 1;
} while (a <= 10)
// 조건문, 반복문 혼합 응용
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
  함수 정의 및 호출
*/
function add(a: number, b: number): number {
  return a + b;
}
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
const oncePerSecond = (callback: (p: string) => void): void => {
  //def oncePerSecond(callback: (p: string)-> void)-> void => {
  setTimeout(() => {
    callback('1초 지남!')
  }, 1000)
};
function main() {
  hanoi(3, "a", "b", "c")
  let ary: string[] = ['a', 'b', 'c'];
  concatenate(ary)
}
function hanoi(n: number, from: string, to1: string, mid: string): void {
  function move(from: string, to1: string) {
    console.log(`${from} ${to1}`)
  }
  if (n == 1) {
    move(from, to1)
  }
  else {
    hanoi(n - 1, from, mid, to1)
    move(from, to1)
    hanoi(n - 1, mid, to1, from)
  }
}
function concatenate(ary: string[]): string {
  let result = "";
  for (const e of ary) {
    result = result + e;
  }
  return result;
}
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
