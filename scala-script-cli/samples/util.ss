%%
import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
import { 제품 } from './제품'
%%

/**
 *
 */
export def util => {
  /**
   *
   * @param width
   * @returns
   */
  static def cellLineL(width: number) => {
    var result = ':'
    for (c <- 0 until width - 1) {
      result += '-'
    }
    return result .. '|'
  }

  /**
   *
   * @param width
   * @returns
   */
  static def cellLineR(width: number) => {
    var result = ''
    for (c <- 0 until width - 1) {
      result += '-'
    }
    return result .. ':|'
  }

  /**
   *
   * @param date
   * @returns
   */
  static def cellDate(date: SimDate) => {
    return LogUtil.formatNameR(date?.no.toString().padStart(3), 3) .. '|'
  }

  /**
   *
   * @param 가격
   * @param 품질
   * @param 상표
   * @returns
   */
  static def 가격품질상표표시(가격: number = 0, 품질: number = 0, 상표: number = 0) => {
    var data = ''
    data += LogUtil.formatNumber(가격, 1, 4) .. '$,'
    data += LogUtil.formatNumber(품질, 1, 4) .. ','
    data += LogUtil.formatNumber(상표, 1, 4) .. '|'
    return data
  }

  /**
   *
   * @param p
   * @returns
   */
  static def 제품정보표시(p: 제품) => {
    return `${p.재화} - 수량: ${p.수량}, 가격: ${p.가격}, 품질: ${p.품질}, 상표: ${p.상표}`
  }

  /**
   *
   * @param 재고수량
   * @param 재고한계
   * @returns
   */
  static def 재고정보표시(재고수량: number, 재고한계: number) => {
    val 재고수량_ = LogUtil.format(재고수량, 4)
    val 재고한계_ = LogUtil.format(재고한계, 4)

    return `(${재고수량_}/${재고한계_})`
  }

  /**
   *
   * @param 처리수량
   * @param 처리한계
   * @returns
   */
  static def 처리정보표시(처리수량: number, 처리한계: number) => {
    val 처리수량_ = LogUtil.format(처리수량, 4)
    val 처리한계_ = LogUtil.format(처리한계, 4)

    return `{${처리수량_}/${처리한계_}}`
  }
}
