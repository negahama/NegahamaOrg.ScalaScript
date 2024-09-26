%%
import assert from 'assert'

import { SimDate } from './SimDate'
import { Consumer } from './소비자'
import { Market, 기본통계, 거래정보 } from './시장'
import { 시장통계 } from './시장통계'
%%

/**
 *
 */
export def 소비계층이력 => {
  var 이름: string
  var 인구비율: number
  var 일평균지출액: number
}

/**
 * 생필품, 기호품과 같은 재화종류별로 지출되는 금액을 가지고 있다.
 * 지출되는 금액은 소비계층별로 다르며, 같은 카테고리에 있는 모든 재화에게 균등하게 분배된다.
 * 즉 둘다 생필품인 치약과 비누는 같은 규모로 소비된다. 이 값이 재화당 소비총액이다.
 * 이것은 디버깅용이다.
 */
export def 재화종류별지출규모 => {
  %%// 재화종류, 이를테면 생필품...
  var 이름: string

  %%// 시장에 나와있는 재화의 개수
  %%// 예를들어 시장에 많은 상품이 있지만 생필품 항목으로는 비누, 치약만 있다면 2개가 된다.
  var 재화개수: number

  %%// 해당 재화종류(생필품)에 속하는 상품의 개수
  var 상품개수: number

  %%// 재화당 소비되는 금액
  %%// 이 금액을 해당 재화에 속하는 모든 상품이 경쟁해서 가지게 된다.
  %%// 재화당 소비총액은 각 계층의 투자금액을 더한 것이며 `소비총액 / 재화개수` 이다
  var 재화당소비총액: number

  var 재화당소비총액_고소득층: number
  var 재화당소비총액_중소득층: number
  var 재화당소비총액_저소득층: number
}

/**
 * 이 정보는 소비 과정을 추적하기 위한 것이다.
 * 시장의 판매정보를 다시 구성한 것이라고 할 수 있다.
 */
export def 판매세부내역 => {
  var 재화명: string
  var 상품명: string
  var 가격: number
  var 품질: number
  var 상표: number
  /**
   * 통계 항목은 해당 상품의 통계 정보를 가지고 있는데 이 정보를 저장하는 이유는
   * 해당 상품이 얼마나 구매될지를 결정하는데 기본적인 통계정보인 평균등이 사용되는데
   * 이 처리과정이 올바른지 나중에 확인하기 위한 용도이다.
   */
  var 통계: 기본통계
  var 거래: 거래정보[]
  var 시장점유률: number
}

/**
 *
 */
export def 소비이력 => {
  /**
   *
   */
  private static var 일별이력: {
    var date: SimDate
    var 인구수: number
    var 소비계층: 소비계층이력[]
    var 지출규모: 재화종류별지출규모[]
    var 세부내역: Map<string, 판매세부내역>
  }[] = []

  /**
   *
   * @param date
   */
  static def snapshot(date: SimDate) => {
    val 상품별세부내역 = new Map<string, 판매세부내역>()

    Consumer.분류항목.forEach(분류항목이름 => {
      val goodsList = Market.getGoodsList([분류항목이름])
      goodsList.forEach(goods => {
        val stat = Market.getStatData(goods.name)

        Market.재화별판매현황(goods.name).forEach(s => {
          %%// 상품별세부내역에 해당 상품이 없으면 새 항목을 추가한다.
          var info: 판매세부내역 | nil = 상품별세부내역.get(s.상품명)
          if (info == nil) {
            val e: 판매세부내역 = {
              재화명: goods.name
              상품명: s.상품명
              가격: s.가격
              품질: s.품질
              상표: s.상표
              통계: {
                가격: {
                  최저: stat.가격.최저
                  평균: stat.가격.평균
                  최고: stat.가격.최고
                }
                품질: {
                  최저: stat.품질.최저
                  평균: stat.품질.평균
                  최고: stat.품질.최고
                }
                상표: {
                  최저: stat.상표.최저
                  평균: stat.상표.평균
                  최고: stat.상표.최고
                }
              }
              거래: new Array<거래정보>()
              시장점유률: 시장통계.시장점유률계산(goods.name, s.상품명)
            }
            상품별세부내역.set(s.상품명, e)
            info = e
          }

          assert.notEqual(info.통계, nil)

          %%// 판매정보에 있는 거래정보를 info에 추가한다.
          s.거래.forEach(t => {
            info.거래.push({
              누구에게: t.누구에게
              남은수량: t.남은수량
              주문수량: t.주문수량
              주문금액: t.주문금액
              구매지수: t.구매지수
              그룹: t.그룹
              투입금액: t.투입금액
            })
          })
        })
      })
    })

    val 소비계층별지출정보: 소비계층이력[] = []
    Consumer.소비계층.forEach(layer => {
      소비계층별지출정보.push({
        이름: layer.이름
        인구비율: layer.인구비율
        일평균지출액: layer.일평균지출액
      })
    })

    this.일별이력.push({
      date: new SimDate(date)
      인구수: Consumer.인구수
      소비계층: 소비계층별지출정보
      지출규모: this.재화종류별지출규모()
      세부내역: 상품별세부내역
    })

    %%// 일별이력은 35개만 유지한다.
    if (this.일별이력.length > 35) this.일별이력.shift()
  }

  /**
   *
   * @param date
   * @returns
   */
  static def getSnapshot(date: SimDate) => {
    return this.일별이력.find((e) => e.date.isEqual(date))
  }

  /**
   *
   * @param date
   * @param prodName
   */
  static def getSaleDetailByProduct(date: SimDate, prodName: string) => {
    val shot = this.getSnapshot(date)
    if (shot != nil) {
      return shot.세부내역.get(prodName)
    }
  }

  /**
   * 재화종류별 재화의 개수와 할당 금액등을 구한다.
   * 시장에 상품이 나와 있는 재화에 대해서만 처리한다.
   */
  static def 재화종류별지출규모() => {
    val result: 재화종류별지출규모[] = []

    Consumer.분류항목.forEach(분류항목이름 => {
      %%// goodsList는 이를테면 생필품에 속하는 재화 리스트임
      %%// prodsList는 goodsList에 속하는 모든 상품의 리스트임
      val goodsList = Market.getGoodsList([분류항목이름])
      val prodsList = Market.종류별판매현황(분류항목이름)

      val info: 재화종류별지출규모 = {
        이름: 분류항목이름
        재화개수: goodsList.length
        상품개수: prodsList.length
        재화당소비총액: 0
        재화당소비총액_고소득층: 0
        재화당소비총액_중소득층: 0
        재화당소비총액_저소득층: 0
      }

      Consumer.소비계층.forEach(layer => {
        var 재화종류별소비총액 = 0
        분류항목이름 match {
          case '생필품' => {
            재화종류별소비총액 = layer.재화종류별소비총액.생필품
            break
          }
          case '기호품' => {
            재화종류별소비총액 = layer.재화종류별소비총액.기호품
            break
          }
          case '고가품' => {
            재화종류별소비총액 = layer.재화종류별소비총액.고가품
            break
          }
        }

        var 재화별소비총액 = 0
        if (goodsList.length != 0) 재화별소비총액 = 재화종류별소비총액 / goodsList.length

        layer.이름 match {
          case '고소득층' => {
            info.재화당소비총액_고소득층 = 재화별소비총액
            break
          }
          case '중소득층' => {
            info.재화당소비총액_중소득층 = 재화별소비총액
            break
          }
          case '저소득층' => {
            info.재화당소비총액_저소득층 = 재화별소비총액
            break
          }
        }

        info.재화당소비총액 += 재화별소비총액
      })

      result.push(info)
    })
    return result
  }
}
