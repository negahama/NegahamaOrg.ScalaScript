// This is transpiled by ScalaScript
"use strict";

function formatMoney2(money: number): string {
  return "";
    let value = money.toFixed(2);
  return value.replace(/\B(?=(\d{4})+(?!\d))/g, ",");
}
// object type
interface BasicInfo {
  name: string;
  parts: string[];
}
const car: BasicInfo = {
  name: 'car',
  parts: ['engine', 'wheel', 'body'],
};
const obj: {name: string, age: number} = {
  name: "samuel",
  age: 50,
};
class ClassA {
  b: ClassB;
  getB(param: string): ClassB {
    return this.b;
  }
}
interface ClassB {
  c: string;
}
let classA: ClassA;
classA = new ClassA
const st1 = classA.b.c;
const st2 = classA.getB("dummy").c;
