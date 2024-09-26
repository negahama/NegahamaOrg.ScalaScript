%%
import assert from 'assert'

import { LogService } from './LogService'
import { Goods } from './재화'
%%

/**
 * 시장은 상품의 판매와 관련되어진 곳이다.
 * 상품의 실제적인 소비주체는 소비자이지만 판매와 관련되어진 모든 정보가 있는 곳이 시장이다.
 * 시장은 크게 다음과 같은 정보를 가지고 있다.
 *
 * 1. 기본통계
 * 2. 상품정보
 * 3. 거래정보
 * 4. 판매현황
 *
 * 먼저 기본통계는 상품의 선택과 소비와 관련되어진 기본적인 통계정보이다.
 * 품질이나 가격의 최고, 최저는 어떻게 되며 평균은 얼마인지등에 대한 정보이다.
 * 이 정보는 소비자에 의해서 상품이 선택되어질 때 사용되는데 특성상 상품별로 존재하는 정보가 아니라 재화별로 존재하는 정보이다.
 * 따라서 다른 정보들과는 별도로 `Market.재화별기본통계테이블`에서 재화명을 키로 저장하고 있다.
 *
 * 상품정보는 상품 자체에 대한 정보이다.
 * 누가, 무엇을, 얼마나 판매하는지에 대한 정보이다.
 *
 * 거래정보는 해당 상품의 개별적인 거래를 다룬다.
 *
 * 판매현황은 상품정보와 거래정보를 포함하며 추가로 상품의 판매 및 처리와 관련되어진 다양한 정보를 가지고 있다.
 * 딱히 어떤 정보라고 말하기 어려울 정도로 다양한 항목들이 있다. 판매현황은 상품의 처리를 위한 작업장 같은 곳이다.
 * 그나마 상품정보와 거래정보는 개념적으로 쉽게 분류되는 항목이어서 분류되어져 있을 뿐이다.
 *
 * 기본통계를 제외한 나머지 정보는 모두 `Market.상품별판매현황테이블`에서 상품명을 키로 저장하고 있다.
 */
/**
 * 상품 정보는 백화점의 판매 부서와 시장의 매개체 역할을 한다.
 * 실제로 상품이 전달되는 것이 아니라 판매 부서의 출력과 연결만 되어져 있는 것이다.
 * 따라서 여기서 상품 수량을 줄이는 일은 판매 부서에 주문을 넣는 것이며
 * 판매 부서는 새롭게 생산(?)되는 상품을 계속 추가해 주어야 한다.
 */
export def 상품정보 => {
  var 이름: string
  var 별명: string
  var 재화명: string
  var 이미지: string
  var 상품설명: string
  var 판매회사: string
  var 판매부서: string
  var 공급물량: number
  var 가격: number
  var 품질: number
  var 상표: number
}

/**
 * 가격, 품질, 상표의 최저, 평균, 최고값을 가지고 있다.
 * 한 재화에 속한 상품들의 통계 정보로 쓰인다.
 * 즉 이 통계정보는 재화당 하나씩 필요하다.
 */
export def 기본통계 => {
  var 가격: {
    var 최저: number
    var 평균: number
    var 최고: number
  } = {
    최저: 0
    평균: 0
    최고: 0
  }
  var 품질: {
    var 최저: number
    var 평균: number
    var 최고: number
  } = {
    최저: 0
    평균: 0
    최고: 0
  }
  var 상표: {
    var 최저: number
    var 평균: number
    var 최고: number
  } = {
    최저: 0
    평균: 0
    최고: 0
  }
}

/**
 *
 */
export def 구매지수 => {
  var 가격지수: string
  var 품질지수: string
  var 상표지수: string
  var 지수합계: number
}

/**
 * 판매에 대한 보다 자세한 정보이다.
 * 판매 정보 자체는 해당 상품에 대한 전체 거래를 담고 있기 때문에
 * 누구에게(정확히는 어떤 계층에) 얼마큼, 어떤 이유로 판매되었는지를
 * 디버깅하기 위해서 필요하다.
 */
export def 거래정보 => {
  var 누구에게: string = ''
  var 주문수량: number = 0
  var 주문금액: number = 0
  var 남은수량: number = 0
  var 구매지수: 구매지수 = {
    가격지수: ''
    품질지수: ''
    상표지수: ''
    지수합계: 0
  }
  var 투입금액: number = 0
  var 그룹: number = 0
}

/**
 * 판매현황은 상품당 하나 존재하며 상품을 처리할 때 필요한 정보를 가지고 있다.
 * 이들 정보들은 해당 상품의 상태를 저장하고 있기도 하지만 필요에 따라 수시로 변경된다.
 * 거래 항목은 거래가 완료된 것을 따로 저장하는 용도인데 계층별 판매를 모니터링 하기 위한 것이다.
 */
export def 판매현황 => {
  /**
   * 상품 자체에 대한 기본적인 정보
   */
  var 상품명: string = ''
  var 재화명: string = ''
  var 이미지: string = ''
  var 상품별명: string = ''
  var 상품설명: string = ''
  var 판매회사: string = ''
  var 판매부서: string = ''
  var 공급물량: number = 0

  /**
   * 판매가 이뤄지면서 상품 수량이 변하기 때문에 상품 수량을 별도로 가지고 있다.
   */
  var 수량: number = 0
  var 가격: number = 0
  var 품질: number = 0
  var 상표: number = 0

  %%// 정규화된 가격과 품질등의 정보는 실제로 상품이 어느정도 소비될 것인지를 결정하는데
  %%// 중요한 값이고 매우 자주 사용되는 정보이기 때문에 저장해 두고 사용한다.
  %%// updateAll()로 갱신할 수도 있지만 새로운 상품이 추가될때마다 자동으로 갱신된다.
  var 정규화된가격: number = 0
  var 정규화된품질: number = 0
  var 정규화된상표: number = 0

  %%// 구매지수부터 그룹까지는 매번 계산되는 값이지만
  %%// 나중에 디버깅을 위해서 저장되어야 하는 값이기도 하고 소비자 객체에서 소비의 처리를
  %%// 여러 세부 함수들로 분산시키는데 이때 함수들간에 공용으로 쓰기 위해서이다.
  %%// 판매정보 자체가 이들 함수들의 작업장 같은 곳이다.
  var 구매지수: 구매지수 = {
    가격지수: ''
    품질지수: ''
    상표지수: ''
    지수합계: 0
  }
  var 주문수량: number = 0
  var 주문금액: number = 0
  var 투입금액: number = 0
  var 그룹: number = -1

  /**
   * 해당 상품이 시장에서 퇴출되는 조건을 만족하는 경우 카운트된다.
   * 퇴출 조건은 상품의 수량이 0인 경우이며 이 조건이 만족되면 카운트가 하나 증가하고
   * 3이 되면 자동으로 퇴출된다. 그 사이 수량이 변경되면 카운트도 리셋된다.
   * 이 자동 퇴출 기능은 부서가 자신이 시장에 등록한 상품에 대해서 신경을 쓸 필요가 없게 하기 위한 것으로
   * 대신 시장에서 매번 확인을 위한 프로세스를 실행해야 한다.
   */
  var 퇴출경고: number = 0

  %%// for debugging
  %%// 이 정보는 계층별로 해당 상품을 얼마나 구매하는지를 저장하기 위한 것이다.
  var 거래: 거래정보[] = []
}

/**
 *
 */
export def Market => {
  private static var 재화별기본통계테이블 = new Map<string, 기본통계>()
  private static var 상품별판매현황테이블 = new Map<string, 판매현황>()

  /**
   *
   * @param indent
   * @param log
   */
  %%// debugging
  static var 로그출력: boolean = false
  static def smartlog(indent: number, msg: string = '', ...optionalParams: any[]) => {
    if (this.로그출력) {
      LogService.smartlog('Market', indent, msg, ...optionalParams)
    }
  }

  /**
   *
   */
  static def validate() => {
    console.log('validate product in market')
  }

  /**
   * 퇴출될 상품을 검사하고 처리한다.
   * 퇴출 상품인지를 검사할 때 수량으로 검사하게 되면 완판되어진 상품을 퇴출 상품으로 오해할 수 있다.
   */
  static def process() => {
    val 퇴출상품들: string[] = []
    this.상품별판매현황테이블.forEach(s => {
      if (s.수량 <= 0) {
        s.퇴출경고 += 1
        this.smartlog(0, '퇴출경고', s.상품명, s.퇴출경고)
        if (s.퇴출경고 > 3) {
          this.smartlog(0, '퇴출확정', s.상품명)
          퇴출상품들.push(s.상품명)
        }
      } else {
        s.퇴출경고 = 0
      }
    })

    퇴출상품들.forEach(p => {
      this.smartlog(0, '퇴출실행', p)
      this.상품별판매현황테이블.delete(p)
    })

    if (퇴출상품들.length != 0) {
      this.updateAll()
    }
  }

  /**
   *
   */
  static def updateAll() => {
    this.getGoodsList().forEach(goods => {
      %%// 시장에서 해당 재화의 최고, 최저, 평균 품질을 구한다.
      val stat = this.재화별기본통계테이블.get(goods.name)
      assert.notEqual(stat, nil)

      this.재화별판매현황(goods.name).forEach(s => {
        s.정규화된가격 = this.가격정규화(s.가격, stat!)
        s.정규화된품질 = this.품질정규화(s.품질, stat!)
        s.정규화된상표 = this.상표정규화(s.상표, stat!)
      })
    })
  }

  /**
   * 추가하려는 상품을 분류에 맞게 넣는다.
   * 이 함수는 매 턴마다 판매부서에 의해 호출되며 백화점의 판매부서만 이 함수를 호출할 수 있다.
   * 가격, 품질등이 변하지 않은 상태에서 수량만 변경되어진 경우에는 수량만 갱신하면 된다.
   * 수량을 갱신할때 퇴출 경고를 clear 시켜야 한다.
   * 새로 추가되는 경우나 가격, 품질등이 변한 상태이면 통계 정보를 갱신한다.
   *
   * @param prod
   * @returns
   */
  static def 출시(prod: 상품정보) => {
    val goods = Goods.getGoods(prod.재화명)
    assert.equal(goods.name, prod.재화명, prod.재화명)

    if (prod.공급물량 <= 0) return;

    %%// 아직 한번도 시장에 나온 적이 없는 재화가 추가되는 경우
    if (!this.재화별기본통계테이블.has(prod.재화명)) {
      this.재화별기본통계테이블.set(prod.재화명, new 기본통계())
    }
    val stat: 기본통계 | nil = this.재화별기본통계테이블.get(prod.재화명)
    assert.notEqual(stat, nil)

    %%// 추가하려는 상품이 이미 등록되어져 있는지를 검사한다.
    %%// 이미 존재하고 기존 상품과 동일한 가격, 품질이면 수량만 새로 설정한다.
    %%// 이미 있어도 가격과 품질이 변동되었다면 update가 필요하다.
    %%// 없다면 새로 등록하면서 update를 수행한다.
    %%//todo 수량이 변경되면 평균이 달라지는데 이게 가격이 변경되었을 때만 반영되고 있음
    var needUpdate = true
    val t: 판매현황 | nil = this.상품별판매현황테이블.get(prod.이름)
    if (t == nil) {
      %%// 등록되어진 상품이 없는 경우 즉 시장에 새로운 상품이 추가되는 경우
      val newInfo = new 판매현황()
      newInfo.상품명 = prod.이름
      newInfo.재화명 = prod.재화명
      newInfo.이미지 = prod.이미지
      newInfo.상품별명 = prod.별명
      newInfo.상품설명 = prod.상품설명
      newInfo.판매회사 = prod.판매회사
      newInfo.판매부서 = prod.판매부서
      newInfo.공급물량 = prod.공급물량
      newInfo.수량 = prod.공급물량
      newInfo.가격 = prod.가격
      newInfo.품질 = prod.품질
      newInfo.상표 = prod.상표

      this.상품별판매현황테이블.set(newInfo.상품명, newInfo)
    } else {
      if (t.가격 == prod.가격 && t.품질 == prod.품질 && t.상표 == prod.상표) needUpdate = false

      assert.equal(t.상품명, prod.이름)
      assert.equal(t.재화명, prod.재화명)
      assert.equal(t.판매회사, prod.판매회사)
      assert.equal(t.판매부서, prod.판매부서)

      t.공급물량 = prod.공급물량
      t.수량 = prod.공급물량
      t.가격 = prod.가격
      t.품질 = prod.품질
      t.상표 = prod.상표

      %%// 완판된 상품의 경우 이것이 없으면 퇴출됨
      t.퇴출경고 = 0
    }

    %%// 상품 등록이 제대로 되었는지 다시 확인
    val s: 판매현황 | nil = this.상품별판매현황테이블.get(prod.이름)
    assert.notEqual(s, nil)
    if (s == nil) return;

    %%// 현재 가지고 있는 해당 재화의 상품들을 모두 검색해서 min, max, ave를 미리 계산해 둔다.
    %%// 가격의 평균이란 상품의 수량까지도 고려한 값이다.
    if (needUpdate) {
      var sum = 0
      var cnt = 0
      var max = 0
      var min = Number.MAX_VALUE

      // 이미 출시된 제품도 포함되어져 있기 때문에 일괄처리하면 된다.
      val prodList = this.재화별판매현황(prod.재화명)
      prodList.forEach(p => {
        sum += p.가격 * p.수량
        cnt += p.수량
        if (p.가격 < min) min = p.가격
        if (p.가격 > max) max = p.가격
      })

      stat!.가격.최고 = max
      stat!.가격.최저 = min
      stat!.가격.평균 = sum / cnt

      sum = 0
      cnt = 0
      max = 0
      min = Number.MAX_VALUE

      prodList.forEach(p => {
        sum += p.품질 * p.수량
        cnt += p.수량
        if (p.품질 < min) min = p.품질
        if (p.품질 > max) max = p.품질
      })

      stat!.품질.최고 = max
      stat!.품질.최저 = min
      stat!.품질.평균 = sum / cnt

      %%// 새로운 상품이 추가되고 평균등이 변경되었으므로 정규화값들을 갱신한다.
      %%// 새로 추가된 상품과 같은 종류의 재화들만 영향을 받으므로 updateAll까지는 필요없다.
      s.정규화된가격 = this.가격정규화(s.가격, stat!)
      s.정규화된품질 = this.품질정규화(s.품질, stat!)
      s.정규화된상표 = this.상표정규화(s.상표, stat!)
    }
  }

  /**
   * type이 명시되지 않으면 그냥 시장에 나와 있는 모든 상품들의 재화 리스트를 구한다.
   * type이 명시되어져 있으면 해당 타입에 해당하는 재화의 리스트만 구한다.
   * 해당 분류항목에 속하는 재화들 중에 시장에 나와있지 않은 것은 제거된다.
   * 상품 개수가 0인 것은 제거되면 안된다. 상품 개수가 0인 것은 완판되어진 것이다.
   * 이 함수는 여러가지 용도로 사용되어지는데 특히 소비 이력을 저장할때도 사용되는데
   * 완판되었다고 이력을 저장하지 않으면 안되기 때문이다.
   *
   * @param types
   */
  static def getGoodsList(types?: string[])-> Goods[] => {
    val result: Goods[] = []
    val set = new Set<string>()
    this.상품별판매현황테이블.forEach(s => {
      set.add(s.재화명)
    })

    if (types == nil) {
      set.forEach(s => {
        result.push(Goods.getGoods(s))
      })
    } else {
      %%// goodslist에 있는 재화가 실제로 판매되는 재화인지만 검사하면 된다.
      val goodsList = Goods.getGoodsList(types)
      goodsList.forEach(goods => {
        if (set.has(goods.name)) result.push(goods)
      })
    }

    return result
  }

  /**
   *
   * @param type
   * @returns
   */
  static def 종류별판매현황(type: string) => {
    val result: 판매현황[] = []
    val goodsList = Goods.getGoodsList([type])
    goodsList.forEach(goods => {
      this.상품별판매현황테이블.forEach(s => {
        if (s.재화명 == goods.name) result.push(s)
      })
    })
    return result
  }

  /**
   *
   */
  static def 재화별판매현황(goodsName: string) => {
    val result: 판매현황[] = []
    this.상품별판매현황테이블.forEach(s => {
      if (s.재화명 == goodsName) result.push(s)
    })
    return result
  }

  /**
   *
   */
  static def 상품별판매현황(prodName: string) => {
    return this.상품별판매현황테이블.get(prodName)
  }

  /**
   *
   */
  static def 재화별상품목록(goodsName: string) => {
    return this.재화별판매현황(goodsName).map(s => s.상품명)
  }

  /**
   * 상품명으로 상품을 찾는다.
   * 이 함수는 사실 상품 별명을 위한 것이다.
   * 상품명이 없으면 상품 별명으로 다시 찾아본다.
   *
   * @param prodName
   * @returns
   */
  static def getProduct(prodName: string) => {
    var result: 상품정보 | nil
    var saleInfo: 판매현황 | nil = this.상품별판매현황테이블.get(prodName)
    if (saleInfo == nil) {
      this.상품별판매현황테이블.forEach(s => {
        if (s.상품명 == prodName || s.상품별명 == prodName) saleInfo = s
      })
    }

    if (saleInfo != nil) {
      result = {
        이름: saleInfo.상품명
        별명: saleInfo.상품별명
        재화명: saleInfo.재화명
        이미지: saleInfo.이미지
        상품설명: saleInfo.상품설명
        판매회사: saleInfo.판매회사
        판매부서: saleInfo.판매부서
        공급물량: saleInfo.공급물량
        가격: saleInfo.가격
        품질: saleInfo.품질
        상표: saleInfo.상표
      }
    }
    return result
  }

  /**
   *
   */
  static def getStatData(goodsName: string)-> 기본통계 => {
    val stat = this.재화별기본통계테이블.get(goodsName)
    assert.notEqual(stat, nil)
    if (stat == nil) return new 기본통계()
    return stat
  }

  /**
   *
   * @param 가격
   * @param stat
   * @returns
   */
  static def 가격정규화(가격: number, stat: 기본통계) => {
    val 평균 = stat.가격.평균
    var 최고 = stat.가격.최고
    var 최저 = stat.가격.최저

    /*
    // assert(최고 >= 평균, `${최고}, ${평균}, ${최저}`)
    // assert(평균 >= 최저, `${최고}, ${평균}, ${최저}`)

    // 0 ~ 1사이로 선형 변환
    // 이렇게 하면 얼마 안되는 차이라도 최소 가격이 되는 상품은 0 되는 문제가 있음
    // var value = 0
    // if (최고 - 최저 == 0) value = 0.5
    // else value = (가격 - 최저) / (최고 - 최저)
    // return value

    // 로지스틱 함수 적용
    // 평균값 근처에서의 증감에는 좋으나 극한에서 차이가 극히 적어지므로 문제의 소지가 있음
    // 가격은 작을수록 좋기 때문에 마지막에 1 - value를 해 준다.

    // 로지스틱 함수의 x 값을 적절히 조정할 필요가 있다.
    // 가격이 평균에서 +- 5를 넘으면 거의 극한값이 되어버리기 때문이다.
    // 그런데 이 범위를 조정하는 것이 간단하지 않다. 많은 방법을 시도해 봤는데...
    // 예를들어서 세상에 나와있는 물건이 두 가지 밖에 없고 하나의 품질이 30이고 다른 하나가 35라고 하면
    // 하나는 최저값이고 하나는 최고값이다. 최고, 최저값을 범위의 한계로 정하면 둘은 어떻게 해도
    // 로지스틱 함수를 거치면서 0과 1의 극한값을 가지게 된다.
    // 그렇다고 범위가 얼마가 될지도 모르는데 일반적인 범위를 상정할 수도 없다.
    // 그리고 최고나 최저가 평균에 편중되어져 있을 수 있는데 위의 예에서 품질의 평균이 30.5라고 하면
    // 최저가 평균에 편중되어져 있는 것이다. 이렇게 되면 최고값이 이미 극한값에 가깝고 새로운 최고값이
    // 나와도 시장에 그렇게 크게 반영되지 못한다.
    // 이 문제를 해결하기 위해서 Math.max((최고 - 평균), (평균 - 최저))을 이용해서 큰 쪽 범위를 기준으로 잡고
    // 이보다 두배 정도 더 크게 범위를 잡아서 이것을 로지스틱의 x 의 -5 ~ +5사이가 되도록 조정하는 것이다.
    // 최고값이 최저값보다 평균에서 더 멀면 최고값은 항상 2.5가 되고 최저값도 마찬가지..

    // var value = 0
    // if (최고 - 최저 == 0) value = 0.5
    // else {
    //   value = ((가격 - 평균) * 5) / (Math.max(최고 - 평균, 평균 - 최저) * 2)
    //   value = 1 / (1 + Math.exp(-value))
    //   value = 1 - value
    // }
    // return value

    // 가격 정규화 방식은 결과적으로 평균 가격의 1/10 ~ 10배 사이를 범위로 정하고
    // 그것의 log10을 취하면 -1 ~ 1 사이의 값을 얻게 되는데 이것을 로지스틱 함수에
    // 적용하기 위해 범위를 -5 ~ 5 로 변환하고 로지스틱 함수를 적용하는 방식으로 정했다.
    // 로그값만 사용해도 될 것 같은데 일단은 이렇게 함
    */
    var value = Math.log10(가격 / 평균) * 5
    value = 1 / (1 + Math.exp(-value))
    return 1 - value
  }

  /**
   *
   * @param 품질
   * @param stat
   * @returns
   */
  static def 품질정규화(품질: number, stat: 기본통계) => {
    val 평균 = stat.품질.평균
    var 최고 = stat.품질.최고
    var 최저 = stat.품질.최저

    /*
    // assert(최고 >= 평균, `${최고}, ${평균}, ${최저}`)
    // assert(평균 >= 최저, `${최고}, ${평균}, ${최저}`)

    // 0 ~ 1사이로 선형 변환
    // 이렇게 하면 얼마 안되는 차이라도 최소 가격이 되는 상품은 0 되는 문제가 있음
    // var value = 0
    // if (최고 - 최저 == 0) value = 0.5
    // else value = (품질 - 최저) / (최고 - 최저)

    // 로지스틱 함수 적용
    // 평균값 근처에서의 증감에는 좋으나 극한에서 차이가 극히 적어지므로 문제의 소지가 있음

    // var value = 0
    // if (최고 - 최저 == 0) value = 0.5
    // else {
    //   value = ((품질 - 평균) * 5) / (Math.max(최고 - 평균, 평균 - 최저) * 2)
    //   value = 1 / (1 + Math.exp(-value))
    // }

    // 품질이 가격이랑 다른 점은 1/2 ~ 2를 범위로 하기 때문에 밑이 2인 로그 함수를 사용하고
    // 아울러 마지막에 1 - value를 해 줄 필요가 없다는 것이다.
    */
    val value = Math.log2(품질 / 평균) * 5
    return 1 / (1 + Math.exp(-value))
  }

  /**
   *
   * @param 상표
   * @param stat
   * @returns
   */
  static def 상표정규화(상표: number, stat: 기본통계) => {
    val 평균 = stat.품질.평균
    var 최고 = stat.품질.최고
    var 최저 = stat.품질.최저

    val value = Math.log2(상표 / 평균) * 5
    return 1 / (1 + Math.exp(-value))
  }
}
