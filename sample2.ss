// val tuple: [string, number, boolean] = ['Hello', 42, true]
// def formatMoney2(money: number)-> string => {
//   return ""
// %%
//   let value = money.toFixed(2);
//   return value.replace(/\B(?=(\d{4})+(?!\d))/g, ",");
// %%
// }

// %%static%% formatDecimal(value: any, width: number) => {
//   if (typeof value == "number") {
//     val p = Math.round(value)
//     return this.addComma(p).padStart(width)
//   } else {
//     return value.toString().padStart(width)
//   }
// }


// @NotTrans def Console => { log() }
// @NotTrans var console: Console
@NotTrans def $string$ => {
//   length: number
  charAt(index: number)-> string
//   charCodeAt(index: number)-> number
//   codePointAt(pos: number)-> number
//   concat(str: string)-> string
//   includes(searchString: string, position: number)-> boolean
//   endsWith(searchString: string, endPosition: number)-> boolean
//   indexOf(searchValue: string, fromIndex: number)-> number
//   lastIndexOf(searchValue: string, fromIndex: number)-> number
//   localeCompare(compareString: string)-> number
//   //match(regexp: string)-> string
//   matchAll(regexp: string)-> string[]
//   normalize(form: string)-> string
//   padEnd(targetLength: number, padString: string)-> string
//   padStart(targetLength: number, padString: string)-> string
//   repeat(count: number)-> string
//   replace(searchFor: string, replaceWith: string)-> string
//   replaceAll(searchFor: string, replaceWith: string)-> string
//   search(regexp: string)-> string
//   slice(beginIndex: number, endIndex: number)-> string
//   split(sep: string, limit: number)-> string[]
//   startsWith(searchString: string, position: number)-> boolean
//   substring(indexStart: number, indexEnd: number)-> string
//   toLocaleLowerCase(locale: string)-> string
//   toLocaleUpperCase(locale: string)-> string
//   toLowerCase()-> string
//   toUpperCase()-> string
//   toString()-> string
//   trim()-> string
//   trimStart()-> string
//   trimEnd()-> string
//   valueOf()-> string
}
@NotTrans def $array$ => {
//   length: number
//   at(index)-> string
//   concat()-> string
//   copyWithin()-> string
//   every(callbackFn)-> string
//   fill(value, start, end)-> string
//   filter(callbackFn)-> string
//   find(callbackFn)-> string
//   findIndex(callbackFn)-> string
//   findLast(callbackFn)-> string
//   findLastIndex(callbackFn)-> string
//   flat(depth)-> string
//   flatMap(callbackFn)-> string
  forEach(callbackFn)-> string
//   includes(searchElement, fromIndex)-> boolean
//   indexOf(searchElement, fromIndex)-> number
//   join(separate)-> string
//   keys()-> string
//   lastIndexOf(searchElement, fromIndex)-> string
//   map(callbackFn)-> string
//   pop()-> string
//   push(element)-> string
//   reduce(callbackFn)-> string
//   reduceRight(callbackFn)-> string
//   reverse()-> string
//   shift()-> string
//   slice()-> string
//   some(callbackFn)-> string
//   sort(callbackFn)-> string
//   splice()-> string
//   toString()-> string
//   unshift()-> string
//   values()-> string
}
// @NotTrans def FileLoader => { loadJsonFile(fileName: string)-> any }
// @NotTrans def Map => { has() get() set() forEach() values() }
// @NotTrans def Set => { has() get() set() forEach() add() }

def Goods => { 분류: string[] }

var array: string[] = ['1', '2', '3']
array[1].charAt(1)

def 재화표시 => {
  재화목록(goodsList: Goods[]) => {
    goodsList.forEach((goods: Goods) => {
      val a = goods.분류[1]
    })
  }
}
