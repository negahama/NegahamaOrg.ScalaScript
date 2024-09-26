%%
import assert from 'assert'
%%

/**
 *
 */
export def LogUtil => {
  /**
   *
   * @param value
   * @param width
   * @returns
   */
  static def format(value: any, width: number)-> string => {
    if (typeof value == 'number') {
      val p = Math.round(value * 100) / 100
      return this.addComma(p).padStart(width)
    } else {
      return value.toString().padStart(width)
    }
  }

  /**
   *
   * @param value
   * @param point
   * @param width
   * @returns
   */
  static def formatNumber(value: number, point: number, width: number)-> string => {
    val p = Math.round(value * 10 ** point) / 10 ** point
    return this.addComma(p).padStart(width)
  }

  /**
   *
   * @param value
   * @param width
   * @returns
   */
  static def formatDecimal(value: any, width: number) => {
    if (typeof value == 'number') {
      val p = Math.round(value)
      return this.addComma(p).padStart(width)
    } else {
      return value.toString().padStart(width)
    }
  }

  /**
   *
   * @param str
   * @param width
   * @returns
   */
  static def formatNameL(str: string, width: number)-> string => {
    val len = this.getTextLength(str)
    if (len > width) {
      var cnt = 0
      for (c <- str.length until 0 step -1) {
        if (escape(str.charAt(c)).length == 6) {
          cnt += 1
        }
        cnt += 1
        if (cnt > width - 3) {
          val ellipsis = '...' .. str.slice(c)
          val ellipsisLen = this.getTextLength(ellipsis)
          var ns = ''
          for (c <- 0 until width - ellipsisLen) {
            ns += ' '
          }
          return ns .. ellipsis
        }
      }
    }

    var ns = ''
    for (c <- 0 until width - len) {
      ns += ' '
    }
    return str .. ns
  }

  /**
   *
   * @param str
   * @param width
   * @returns
   */
  static def formatNameR(str: string, width: number)-> string => {
    val len = this.getTextLength(str)
    if (len > width) {
      var cnt = 0
      for (c <- str.length until 0 step -1) {
        if (escape(str.charAt(c)).length == 6) {
          cnt += 1
        }
        cnt += 1
        if (cnt > width - 3) {
          val ellipsis = '...' .. str.slice(c)
          val ellipsisLen = this.getTextLength(ellipsis)
          var ns = ''
          for (c <- 0 until width - ellipsisLen) {
            ns += ' '
          }
          return ns .. ellipsis
        }
      }
    }

    var ns = ''
    for (c <- 0 until width - len) {
      ns += ' '
    }
    return ns .. str
  }

  /**
   *
   * @param money
   * @returns
   */
  static def formatMoney(money: number) => {
    return this.addComma(Math.round(money))
  }

  /**
   *
   * @param money
   * @returns
   */
  static def formatMoney2(money: number) => {
    val value = money.toFixed(2)
    return value.replace(/\B(?=(\d{4})+(?!\d))/g, ',')
  }

  /**
   *
   * @param value
   * @returns
   */
  static def addComma(value: number)-> string => {
    return value.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
  }

  /**
   *
   * @param color
   * @param str
   * @returns
   */
  static def setTextColor(color: string, str: string) => {
    var prefix = ''
    color.toLowerCase().trim() match {
      case 'red' => {
        prefix = '\u001b[1;31m'
        break
      }
      case 'green' => {
        prefix = '\u001b[1;32m'
        break
      }
      case 'yellow' => {
        prefix = '\u001b[1;33m'
        break
      }
      case 'blue' => {
        prefix = '\u001b[1;34m'
        break
      }
      case 'purple' => {
        prefix = '\u001b[1;35m'
        break
      }
      case 'cyan' => {
        prefix = '\u001b[1;36m'
        break
      }
      case _ => {
        assert(false, color.toLowerCase().trim())
      }
    }
    return prefix .. str .. '\u001b[0m'
  }

  /**
   *
   * @param color
   * @param str
   * @returns
   */
  static def setBackColor(color: string, str: string) => {
    var prefix = ''
    color.toLowerCase().trim() match {
      case 'red' => {
        prefix = '\u001b[1;41m'
        break
      }
      case 'green' => {
        prefix = '\u001b[1;42m'
        break
      }
      case 'yellow' => {
        prefix = '\u001b[1;43m'
        break
      }
      case 'blue' => {
        prefix = '\u001b[1;44m'
        break
      }
      case 'purple' => {
        prefix = '\u001b[1;45m'
        break
      }
      case 'cyan' => {
        prefix = '\u001b[1;46m'
        break
      }
      case _ => {
        assert(false, color.toLowerCase().trim())
      }
    }
    return prefix .. str .. '\u001b[0m'
  }

  /**
   *
   * @param min
   * @param max
   * @param value
   * @param width
   * @returns
   */
  static def bar(min: number, max: number, value: number, width: number = 5) => {
    var range = max - min
    if (range <= 0) {
      assert.equal(max, value)
      assert.equal(min, value)
      range = 1
    }
    val rate = (value - min) / range
    if (rate > 1) {
      var fill = ''
      for (i <- 0 until width) fill += '▩'
      return fill
    }

    var bar = ''
    val r = Math.round(rate * width)
    for (i <- 0 until r) bar += '▩'
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
  static def colorBar(min: number, max: number, value: number, width: number = 5) => {
    if (min == max) {
      assert.equal(max, value)
      assert.equal(min, value)
      val rate = 1
      var bar = ''
      val r = Math.round(rate * width)
      for (i <- 0 until r) bar += '▩'
      return this.setTextColor('yellow', bar.padEnd(width))
    } else {
      val range = Math.abs(max - min)
      val rate = Math.abs(value - min) / range

      if (rate > 1) {
        var fill = ''
        for (i <- 0 until width) fill += '▩'
        return this.setTextColor('red', fill)
      }

      var bar = ''
      val r = Math.round(rate * width)
      for (i <- 0 until r) bar += '▩'
      return this.setTextColor('blue', bar.padEnd(width))
    }
  }

  /**
   *
   * @param str
   * @returns
   */
  static def getTextLength(str: string)-> number => {
    if (str == nil) return 0
    var len = 0
    for (i <- 1 to str.length) {
      if (escape(str.charAt(i)).length == 6) {
        len += 1
      }
      len += 1
    }
    return len
  }
}
