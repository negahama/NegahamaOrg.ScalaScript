def sum(a: number, b: number): number = {
  a + b
}

val s:string = ""
s.startsWith("\r\n")

def generateBypassElement(bypass: string[]): string = {
  var result = ""
//  bypass.forEach((s) => {
    // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
    var ns = s
    if (s.startsWith("\r\n")) ns = ns.slice(2)
    ns = ns.trimEnd()
//    result += ns
    result = result + ns
//  })
  result
}

def test(a:number, b:number) = {
  if (a < b) {
    var c = b - a
    console.log("b - a:", c)
  } else console.log("a > b")
  if (fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, true)
  }
}

