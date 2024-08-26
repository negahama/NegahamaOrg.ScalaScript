@NotTrans class Console { log() }
@NotTrans var console: Console

@NotTrans def string.charAt(index: number)-> string
@NotTrans def string.charCodeAt(index: number)-> number
@NotTrans def string.codePointAt(pos: number)-> number
@NotTrans def string.concat(str: string)-> string
@NotTrans def string.includes(searchString: string, position: number)-> boolean
@NotTrans def string.endsWith(searchString: string, endPosition: number)-> boolean
@NotTrans def string.indexOf(searchValue: string, fromIndex: number)-> number
@NotTrans def string.lastIndexOf(searchValue: string, fromIndex: number)-> number
@NotTrans def string.localeCompare(compareString: string)-> number
//@NotTrans def string.match(regexp: string)-> string
@NotTrans def string.matchAll(regexp: string)-> string[]
@NotTrans def string.normalize(form: string)-> string
@NotTrans def string.padEnd(targetLength: number, padString: string)-> string
@NotTrans def string.padStart(targetLength: number, padString: string)-> string
@NotTrans def string.repeat(count: number)-> string
@NotTrans def string.replace(searchFor: string, replaceWith: string)-> string
@NotTrans def string.replaceAll(searchFor: string, replaceWith: string)-> string
@NotTrans def string.search(regexp: string)-> string
@NotTrans def string.slice(beginIndex: number, endIndex: number)-> string
@NotTrans def string.split(sep: string, limit: number)-> string[]
@NotTrans def string.startsWith(searchString: string, position: number)-> boolean
@NotTrans def string.substring(indexStart: number, indexEnd: number)-> string
@NotTrans def string.toLocaleLowerCase(locale: string)-> string
@NotTrans def string.toLocaleUpperCase(locale: string)-> string
@NotTrans def string.toLowerCase()-> string
@NotTrans def string.toUpperCase()-> string
@NotTrans def string.toString()-> string
@NotTrans def string.trim()-> string
@NotTrans def string.trimStart()-> string
@NotTrans def string.trimEnd()-> string
@NotTrans def string.valueOf()-> string

%%/*
  함수 호출
*/%%
var s: string = "this is sample"
var list2 = s.concat("2" + 'def').trim().split(",")

%%/*
  배열의 인덱스는 1 부터
*/%%
var s4 = s.includes("is", 1)

%%/*
  주석은 그대로 변환되어야 한다.
*/%%
@NotTrans class Console { log(arg: string)-> void => {} }
@NotTrans var console: Console

def main() => {
  hanoi(3, "a", "b", "c")
  var ary: string[] = ['a', 'b', 'c']
  concatenate(ary)
}

def hanoi(n: number, from: string, to1: string, mid: string)-> void => {
  def move(from: string, to1: string) => {
    console.log(`${from} ${to1}`)
  }

  if (n == 1)
  then move(from, to1)
  else {
    hanoi(n - 1, from, mid, to1)
    move(from, to1)
    hanoi(n - 1, mid, to1, from)
  }
}

def concatenate(ary: string[])-> string => {
  var result = ""
  for (e <- ary)
    result += e
  return result
}
