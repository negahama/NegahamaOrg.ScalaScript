// This is transpiled by ScalaScript
"use strict";

import assert from "assert";
export default
class LogUtil {
  static
  formatNumber(value: number, point: number, width: number): string {
    const 계산결과 = Math.round(value * 10 ** point) / 10 ** point;
    return this.addComma(계산결과).padStart(width);
  }
  static
  getTextLength(str: string): number {
    if (! str) {
      return 0;
    }
    let len = 0;
    for (let i = 1; i <= str.length; i++) {
      if (escape(str.charAt(i - 1)).length == 6) {
        len += 1;
      }
      len += 1;
    }
    return len;
  }
  static
  formatNameL(str: string, width: number): string {
    const len = this.getTextLength(str);
    if (len > width) {
      let cnt = 0;
      for (let c = str.length; c >= 0; c -= 1) {
        if (escape(str.charAt(c - 1)).length == 6) {
          cnt += 1;
        }
        cnt += 1;
        if (cnt > width - 3) {
          const ellipsis = "..." + str.slice(c - 1);
          const ellipsisLen = this.getTextLength(ellipsis);
          let ns = "";
          for (let c = 0; c <= width - ellipsisLen; c++) {
            ns += " ";
          }
          return ns + ellipsis;
        }
      }
    }
    let ns = "";
    for (let c = 0; c <= width - len; c++) {
      ns += " ";
    }
    return str + ns;
  }
  static
  formatNameR(str: string, width: number): string {
    const len = this.getTextLength(str);
    if (len > width) {
      let cnt = 0;
      for (let c = str.length; c >= 0; c -= 1) {
        if (escape(str.charAt(c - 1)).length == 6) {
          cnt += 1;
        }
        cnt += 1;
        if (cnt > width - 3) {
          const ellipsis = "..." + str.slice(c - 1);
          const ellipsisLen = this.getTextLength(ellipsis);
          let ns = "";
          for (let c = 0; c <= width - ellipsisLen; c++) {
            ns += " ";
          }
          return ns + ellipsis;
        }
      }
    }
    let ns = "";
    for (let c = 0; c <= width - len; c++) {
      ns += " ";
    }
    return ns + str;
  }
  static
  formatMoney(money: number): string {
    return this.addComma(Math.round(money));
  }
  static
  formatMoney2(money: number): string {
    return "";
        let value = money.toFixed(2);
    return value.replace(/\B(?=(\d{4})+(?!\d))/g, ",");
  }
  static
  addComma(value: number): string {
    return "";
        return value?.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ",");
  }
  static
  setTextColor(color: string, str: string): string {
    let prefix = "";
    switch ((color.toLowerCase().trim())) {
      case "red": {
        prefix = "\u001b[1;31m";
        break;
      }
      case "green": {
        prefix = "\u001b[1;32m";
        break;
      }
      case "yellow": {
        prefix = "\u001b[1;33m";
        break;
      }
      case "blue": {
        prefix = "\u001b[1;34m";
        break;
      }
      case "purple": {
        prefix = "\u001b[1;35m";
        break;
      }
      case "cyan": {
        prefix = "\u001b[1;36m";
        break;
      }
      default: {
        assert(false, color.toLowerCase().trim());
      }
    }
    return prefix + str + "\u001b[0m";
  }
  static
  setBackColor(color: string, str: string): string {
    let prefix = "";
    switch ((color.toLowerCase().trim())) {
      case "red": {
        prefix = "\u001b[1;41m";
        break;
      }
      case "green": {
        prefix = "\u001b[1;42m";
        break;
      }
      case "yellow": {
        prefix = "\u001b[1;43m";
        break;
      }
      case "blue": {
        prefix = "\u001b[1;44m";
        break;
      }
      case "purple": {
        prefix = "\u001b[1;45m";
        break;
      }
      case "cyan": {
        prefix = "\u001b[1;46m";
        break;
      }
      default: {
        assert(false, color.toLowerCase().trim());
      }
    }
    return prefix + str + "\u001b[0m";
  }
  static
  bar(min: number, max: number, value: number, width: number): string {
    let range = max - min;
    if (range <= 0) {
      assert.equal(max, value)
      assert.equal(min, value)
      range = 1;
    }
    const rate = (value - min) / range;
    if (rate > 1) {
      let fill = "";
      for (let i = 0; i <= width; i++) {
        fill += "▩";
      }
      return fill;
    }
    let bar = "";
    const r = Math.round(rate * width);
    for (let i = 0; i <= r; i++) {
      bar += "▩";
    }
    return bar.padEnd(width);
  }
  static
  colorBar(min: number, max: number, value: number, width: number): string {
    if (min == max) {
      assert.equal(max, value)
      assert.equal(min, value)
      const rate = 1;
      let bar = "";
      const r = Math.round(rate * width);
      for (let i = 0; i <= r; i++) {
        bar += "▩";
      }
      return this.setTextColor("yellow", bar.padEnd(width));
    }
    else {
      const range = Math.abs(max - min);
      const rate = Math.abs(value - min) / range;
      if (rate > 1) {
        let fill = "";
        for (let i = 0; i <= width; i++) {
          fill += "▩";
        }
        return this.setTextColor("red", fill);
      }
      let bar = "";
      const r = Math.round(rate * width);
      for (let i = 0; i <= r; i++) {
        bar += "▩";
      }
      return this.setTextColor("blue", bar.padEnd(width));
    }
  }
}
