// def fn(param: number): number
// fn().c

// class Console {
//   log() = {
//     // do nothing
//   }
// }
// val console1: Console
// val console2 = Console()

// console1.log()
// console2.log()


// class A {
//   b: B
//   getB(param: string): B = {
//     %%//return this.b
//   }
// }
// class B {
//   c: string
// }
// var a: A
// %%//a = new A
// val s1 = a.b.c
// val s2 = a.getB("dummy").c

// def fun(a: number) = {
//   var b = 0
//   b = 1
// }

def string.concat(arg: string): string = { return "" }
def string.startsWith(arg: string): string = { return "" }
def string.split(arg: string): string = { return "" }
def string.slice(arg: number): string = { return "" }
def string.trim(): string = { return "" }

%%/*
  함수 호출
*/%%
var s: string = "this is sample"
var list2 = s.concat("2" + 'def').trim().split(",")

%%/*
  주석은 그대로 변환되어야 한다.
*/%%

// def generateBypassElement(bypass: string[]): string = {
//   var result = ""
//   // bypass.forEach(s:String => {
//     // 의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
//     var ns: string1 = s
//     // if (s.startsWith("\r\n")) ns = ns.slice(2)
//     ns = ns.trim()
//     result += ns
//   // })
//   return result
// }
