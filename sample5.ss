var a, b, c : number = 0xff
a = b = c = 0b11 + 0o11 + 0x11 + 11.1 + 1.1e+1
val ary: string[] = ['a', 'b', 'c']
val s1 = ary[2] .. ary[1]
var sum = 0
for (d <- 1 to 10) {
  sum += d
}
var result = ""
for (e <- ary)
  result = result .. e
val tuple: [string, number, boolean] = ['Hello', 42, true]
if not a console log 'a is not true'
def formatMoney2(money: number)-> string => {
%%
  let value = money.toFixed(2);
  return value.replace(/\B(?=(\d{4})+(?!\d))/g, ",");
%%
}
