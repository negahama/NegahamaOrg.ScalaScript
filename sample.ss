def sum(a: number, b: number): number = {
  return a + b
}

val s:string = ""
s.startsWith("\r\n")
var list1 = s.concat("2")
var list2 = s.concat("2").trim().split(",")
//var list = if s.startsWith("* ") then s.trim() else s

val x: number = 2
x match {
  case 0 => "zero"
  case 1 => "one"
  case 2 => "two"
  //case _ => "other"
}

var a = 0
var b = 0

if a == b
then console.log("a == b")
elif (a < b) console.log("a < b")
elif (a > b) console.log("a > b")
else {
  console.log("error")
}

for (a <- 1 to 10; b <- 1 to 10; c <- 1 to 10) {
  console.log(a)
}

val array1 = ['a', 'b', 'c']
for (a <- array1; b <- array1) { console.log(a, b) }

while a < array1.length and sum(a, b) == 2 b += 1
do console.log(a) while a < array1.length and sum(a, b) == 2
do {
  console.log(a)
  a += 1
} while (a <= 10)

/*
  주석은 그대로 변환되어야 한다.
*/
def generateBypassElement(bypass: string[]): string = {
  var result = ""
  bypass.forEach(s => {
    // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
    var ns = s
    if (s.startsWith("\r\n")) ns = ns.slice(2)
    ns = ns.trimEnd()
    result += ns
  })
  return result
}
