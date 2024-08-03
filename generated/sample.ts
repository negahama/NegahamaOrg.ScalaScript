// This is transpiled by ScalaScript
"use strict";

function sum(a: number, b: number): number {
  return a + b
}
const s: string = "";
s.startsWith("\r\n")
let list1 = s.concat("2");
let list2 = s.concat("2").trim().split(",");
//var list = if s.startsWith("* ") then s.trim() else s
const x: number = 2;
switch (x) {
  case 0: { "zero" }
  case 1: { "one" }
  case 2: { "two" }
  default: { "other" }
}
let a = 0;
let b = 0;
if (a == b) { console.log("a == b") }
else if (a < b) { console.log("a < b") }
else if (a > b) { console.log("a > b") }
else {
  console.log("error")
}
for (let a = 1; a <= 10; a++) {
  for (let b = 1; b <= 10; b++) {
    for (let c = 1; c <= 10; c++) {
      console.log(a)
    }
  }
}
const array1 = ['a','b','c'];
for (const a of array1) {
  for (const b of array1) {
    console.log(a, b)
  }
}
while (a < array1.length && sum(a, b) == 2) { b += 1; }
do { console.log(a) } while (a < array1.length && sum(a, b) == 2)
do {
  console.log(a)
  a += 1;
} while (a <= 10)
/*
  주석은 그대로 변환되어야 한다.
*/
function generateBypassElement(bypass: string[]): string {
  let result = "";
  bypass.forEach((s) => {
    // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
    let ns = s;
    if (s.startsWith("\r\n")) { ns = ns.slice(2); }
    ns = ns.trimEnd();
    result += ns;
  })
  return result
}
