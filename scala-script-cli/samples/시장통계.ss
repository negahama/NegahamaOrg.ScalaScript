%%
import assert from 'assert'

import { Market } from './시장'
%%

/**
 *
 */
export def 시장통계 => {
  /**
   * 해당 상품의 시장 점유률을 계산한다.
   * 시장 점유률은 한 재화에 속한 모든 상품의 판매 금액 총액이 필요하다.
   * 시장 점유률은 이 금액에서 자신이 판매한 금액의 비율이다.
   *
   * @param goodsName
   * @param prodName
   * @returns
   */
  static def 시장점유률계산(goodsName: string, prodName: string) => {
    var sum = 0
    var target = 0
    Market.재화별판매현황(goodsName).forEach(s => {
      assert.equal(s.거래.length, 3)

      var tradeSum = 0
      s.거래.forEach(t => {
        tradeSum += t.주문금액
      })

      %%// 구하고자 하는 상품의 거래량을 저장해 둔다.
      %%// 모든 합계를 구한 후 비율을 계산할때 사용하기 위해서이다.
      if (s.상품명 == prodName) {
        target = tradeSum
      }

      sum += tradeSum
    })

    return Math.round((target / sum) * 10000) / 100
  }
}
