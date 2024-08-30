@NotTrans class Console { log() }
@NotTrans var console: Console
@NotTrans class string {
  length: number
}
@NotTrans class array {
  length: number
}

//val tuple: [string, number, boolean] = ['Hello', 42, true]
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
