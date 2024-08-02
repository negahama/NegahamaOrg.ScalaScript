def sum(a: number, b: number): number = {
  a + b
}

val s:string = ""
s.startsWith("\r\n")

var a = 0
var b = 0

if (a == b)
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
for (a <- array1; a <- array1) { console.log(a, b) }

def generateBypassElement(bypass: string[]): string = {
  var result = ""
//  bypass.forEach((s) => {
    // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
    var ns = s
    if (s.startsWith("\r\n")) ns = ns.slice(2)
    ns = ns.trimEnd()
    result += ns
//  })
  result
}

def test() = {
//  if (fs.existsSync(data.destination)) {
//    fs.mkdirSync(data.destination, true)
//  }
}

