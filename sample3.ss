@NotTrans def Console => { log() }
@NotTrans var console: Console
@NotTrans def $string$ => {
  length: number
}
@NotTrans def $array$ => {
  length: number
}

// val tuple: [string, number, boolean] = ['Hello', 42, true]
def formatMoney2(money: number)-> string => {
  return ""
%%
  let value = money.toFixed(2);
  return value.replace(/\B(?=(\d{4})+(?!\d))/g, ",");
%%
}

// %%static%% formatDecimal(value: any, width: number) => {
//   if (typeof value == "number") {
//     val p = Math.round(value)
//     return this.addComma(p).padStart(width)
//   } else {
//     return value.toString().padStart(width)
//   }
// }

%%//// object type
def BasicInfo => { name: string parts: string[] }
val car: BasicInfo = {
	name = 'car'
	parts = [
		'engine',
		'wheel',
		'body'
	]
}
val obj: {
  name: string
  age: number
} = {
  name = "samuel"
  age = 50
}

def ClassA => {
  b: ClassB
  getB(param: string)-> ClassB => {
    return this.b
  }
}
def ClassB => {
  c: string
}
var classA: ClassA
%%//classA = new ClassA
val st1 = classA.b.c
val st2 = classA.getB("dummy").c
