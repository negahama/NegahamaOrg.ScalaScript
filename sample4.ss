@NotTrans class Console { log() }
@NotTrans var console: Console
@NotTrans def string.length()
@NotTrans def string.charAt(index: number)-> string
@NotTrans def string.charCodeAt(index: number)-> number
@NotTrans def string.codePointAt(pos: number)-> number
// @NotTrans def string.concat(str: string)-> string
// @NotTrans def string.includes(searchString: string, position: number)-> boolean
// @NotTrans def string.endsWith(searchString: string, endPosition: number)-> boolean
// @NotTrans def string.indexOf(searchValue: string, fromIndex: number)-> number
// @NotTrans def string.lastIndexOf(searchValue: string, fromIndex: number)-> number
@NotTrans def string.padEnd(targetLength: number, padString: string)-> string
@NotTrans def string.padStart(targetLength: number, padString: string)-> string
// @NotTrans def string.repeat(count: number)-> string
// @NotTrans def string.replace(searchFor: string, replaceWith: string)-> string
// @NotTrans def string.replaceAll(searchFor: string, replaceWith: string)-> string
// @NotTrans def string.search(regexp: string)-> string
@NotTrans def string.slice(beginIndex: number, endIndex: number)-> string
// @NotTrans def string.split(sep: string, limit: number)-> string[]
@NotTrans def string.startsWith(searchString: string, position: number)-> boolean
// @NotTrans def string.substring(indexStart: number, indexEnd: number)-> string
@NotTrans def string.toLowerCase()-> string
@NotTrans def string.toUpperCase()-> string
@NotTrans def string.toString()-> string
@NotTrans def string.trim()-> string
// @NotTrans def string.trimStart()-> string
// @NotTrans def string.trimEnd()-> string
// @NotTrans def string.valueOf()-> string
@NotTrans def string.forEach()-> string
@NotTrans def setTimeout()
@NotTrans def escape()
@NotTrans class Math { round() abs() }
@NotTrans class assert { equal() }

%%
import assert from "assert";
%%

/**
 *
 */
%%export default%% class LogUtil {
  /**
   *
   * @param value
   * @param width
   * @returns
   */
  // %%static%% format(value: any, width: number) => {
  //   if (typeof value == "number") {
  //     val p = Math.round(value * 100) / 100
  //     return this.addComma(p).padStart(width)
  //   } else {
  //     return value.toString().padStart(width)
  //   }
  // }

  /**
   *
   * @param value
   * @param point
   * @param width
   * @returns
   */
  %%static%% formatNumber(value: number, point: number, width: number) => {
    val 계산결과 = Math.round(value * 10 ** point) / 10 ** point
    return this.addComma(계산결과).padStart(width)
  }

  /**
   *
   * @param value
   * @param width
   * @returns
   */
  // %%static%% formatDecimal(value: any, width: number) => {
  //   if (typeof value == "number") {
  //     val p = Math.round(value)
  //     return this.addComma(p).padStart(width)
  //   } else {
  //     return value.toString().padStart(width)
  //   }
  // }

  /**
   *
   * @param str
   * @returns
   */
  %%static%% getTextLength(str: string) => {
    if (!str) return 0
    var len = 0
    for (i <- 1 to str.length) {
      if (escape(str.charAt(i)).length == 6) {
        len += 1
      }
      len += 1
    }
    return len
  }

  /**
   *
   * @param str
   * @param width
   * @returns
   */
  %%static%% formatNameL(str: string, width: number) => {
    val len = this.getTextLength(str)
    if (len > width) {
      var cnt = 0
      for (c <- str.length to 0 step -1) {
        if (escape(str.charAt(c)).length == 6) {
          cnt += 1
        }
        cnt += 1
        if (cnt > width - 3) {
          val ellipsis = "..." + str.slice(c)
          val ellipsisLen = this.getTextLength(ellipsis)
          var ns = ""
          for (c <- 0 to width - ellipsisLen) {
            ns += " "
          }
          return ns + ellipsis
        }
      }
    }

    var ns = ""
    for (c <- 0 to width - len) {
      ns += " "
    }
    return str + ns
  }

  /**
   *
   * @param str
   * @param width
   * @returns
   */
  %%static%% formatNameR(str: string, width: number) => {
    val len = this.getTextLength(str)
    if (len > width) {
      var cnt = 0
      for (c <- str.length to 0 step -1) {
        if (escape(str.charAt(c)).length == 6) {
          cnt += 1
        }
        cnt += 1
        if (cnt > width - 3) {
          val ellipsis = "..." + str.slice(c)
          val ellipsisLen = this.getTextLength(ellipsis)
          var ns = ""
          for (c <- 0 to width - ellipsisLen) {
            ns += " "
          }
          return ns + ellipsis
        }
      }
    }

    var ns = ""
    for (c <- 0 to width - len) {
      ns += " "
    }
    return ns + str
  }

  /**
   *
   * @param money
   * @returns
   */
  %%static%% formatMoney(money: number) => {
    return this.addComma(Math.round(money))
  }

  /**
   *
   * @param money
   * @returns
   */
  %%static%% formatMoney2(money: number) => {
%%
    let value = money.toFixed(2);
    return value.replace(/\B(?=(\d{4})+(?!\d))/g, ",");
%%
  }

  /**
   *
   * @param value
   * @returns
   */
  %%static%% addComma(value: number) => {
%%
    return value?.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ",");
%%
  }

  /**
   *
   * @param color
   * @param str
   * @returns
   */
  %%static%% setTextColor(color: string, str: string) => {
    var prefix = ""
    (color.toLowerCase().trim()) match {
      case "red" => {
        prefix = "\u001b[1;31m"
        break
      }
      case "green" => {
        prefix = "\u001b[1;32m"
        break
      }
      case "yellow" => {
        prefix = "\u001b[1;33m"
        break
      }
      case "blue" => {
        prefix = "\u001b[1;34m"
        break
      }
      case "purple" => {
        prefix = "\u001b[1;35m"
        break
      }
      case "cyan" => {
        prefix = "\u001b[1;36m"
        break
      }
      case _ => assert(false, color.toLowerCase().trim())
    }
    return prefix + str + "\u001b[0m"
  }

  /**
   *
   * @param color
   * @param str
   * @returns
   */
  %%static%% setBackColor(color: string, str: string) => {
    var prefix = ""
    (color.toLowerCase().trim()) match {
      case "red" => {
        prefix = "\u001b[1;41m"
        break
      }
      case "green" => {
        prefix = "\u001b[1;42m"
        break
      }
      case "yellow" => {
        prefix = "\u001b[1;43m"
        break
      }
      case "blue" => {
        prefix = "\u001b[1;44m"
        break
      }
      case "purple" => {
        prefix = "\u001b[1;45m"
        break
      }
      case "cyan" => {
        prefix = "\u001b[1;46m"
        break
      }
      case _ => assert(false, color.toLowerCase().trim())
    }
    return prefix + str + "\u001b[0m"
  }

  /**
   *
   * @param min
   * @param max
   * @param value
   * @param width
   * @returns
   */
  %%static%% bar(min: number, max: number, value: number, width: number = 5) => {
    var range = max - min
    if (range <= 0) {
      assert.equal(max, value)
      assert.equal(min, value)
      range = 1
    }
    val rate = (value - min) / range
    if (rate > 1) {
      var fill = ""
      for (i <- 0 to width) fill += "▩"
      return fill
    }

    var bar = ""
    val r = Math.round(rate * width)
    for (i <- 0 to r) bar += "▩"
    return bar.padEnd(width)
  }

  /**
   *
   * @param min
   * @param max
   * @param value
   * @param width
   * @returns
   */
  %%static%% colorBar(min: number, max: number, value: number, width: number = 5) => {
    if (min == max) {
      assert.equal(max, value)
      assert.equal(min, value)
      val rate = 1
      var bar = ""
      val r = Math.round(rate * width)
      for (i <- 0 to r) bar += "▩"
      return this.setTextColor("yellow", bar.padEnd(width))
    } else {
      val range = Math.abs(max - min)
      val rate = Math.abs(value - min) / range

      if (rate > 1) {
        var fill = ""
        for (i <- 0 to width) fill += "▩"
        return this.setTextColor("red", fill)
      }

      var bar = ""
      val r = Math.round(rate * width)
      for (i <- 0 to r) bar += "▩"
      return this.setTextColor("blue", bar.padEnd(width))
    }
  }

}
