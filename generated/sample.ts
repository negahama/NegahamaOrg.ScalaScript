// This is transpiled by ScalaScript
"use strict";

function sum(a: number, b: number): number {
  return a + b
}
const s: string = "";
s.startsWith("\r\n")
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
const array1 = ['a', 'b', 'c'];
for (const a of array1) {
  for (const b of array1) {
    console.log(a, b)
  }
}
while (a <= 10) {
  console.log(a)
  a += 1;
}
do {
  console.log(a)
  a += 1;
} while (a <= 10)
function generateBypassElement(bypass: string[]): string {
  let result = "";
  bypass.forEach((s) => {
    let ns = s;
    if (s.startsWith("\r\n")) { ns = ns.slice(2); }
    ns = ns.trimEnd();
    result += ns;
  })
  return result
}
function test() {
  return if (fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, true)
  }
}
