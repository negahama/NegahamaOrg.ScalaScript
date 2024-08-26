// This is transpiled by ScalaScript
"use strict";

/*
  함수 호출
*/
let s: string = "this is sample";
let list2 = s.concat("2" + 'def').trim().split(",");
/*
  배열의 인덱스는 1 부터
*/
let s4 = s.includes("is", 1 - 1);
/*
  주석은 그대로 변환되어야 한다.
*/
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
    result += e;
  }
  return result;
}
