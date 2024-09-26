%%
import assert from 'assert'

import { LogService } from './LogService'
import { Market, 판매현황, 거래정보 } from './시장'
import { Goods, 구매요인비율 } from './재화'
import { Firm } from './회사'
import { FileLoader } from './FileLoader'
%%

/**
 *
 */
def 소비계층 => {
  %%// 소비계층에 대한 설정값들이다.
  %%//---------------------------------------------
  %%// 고소득층, 중소득층, 저소득층
  var 이름: string

  %%// 해당 계층의 전체 인구에 대한 비율
  %%// 해당 계층의 인구수를 직접 변경하는 것보다 편리하게 변경할 수 있다.
  var 인구비율: number

  %%// 일인 일평균 지출액
  %%// 마이더스에서 시간단위는 1 day이며 금액단위는 1 만원이다.
  var 일평균지출액: number

  %%// 계층별로 생필품, 기호품등에 대한 구매 패턴이 다르다.
  var 재화종류별구매패턴: {
    var 생필품: number
    var 기호품: number
    var 고가품: number
  }

  %%// 계층별로 구매할 때 중요하게 생각하는 구매 요인이 다르다.
  %%// 저소득층은 가격을 중시하는 반면 고소득층은 상표를 중시한다.
  var 구매요인별구매패턴: 구매요인비율

  %%// 여기부터는 실제 처리 데이터들이다.
  %%//---------------------------------------------
  %%// 해당 계층의 총 인구수
  %%// 총 인구수에 해당 계층의 인구 비율을 곱해서 구한다.
  %%// 소비자.인구수 * (this.인구비율 / 100)
  var 인구총수: number

  %%// 해당 계층이 소비할 수 있는 총 금액
  %%// 해당 계층의 인구수와 해당 계층의 일인 일평균지출액을 곱해서 구한다.
  %%// this.인구총수 * this.일평균지출액
  var 소비총액: number

  %%// 이 값은 이를테면 고소득층이 자신의 지출 중 생필품에 지출하는 금액을 말한다.
  %%// 이 값은 process()의 처음 부분에서 다른 값들과 같이 update된다.
  %%// this.소비총액 * (this.재화종류별구매패턴 / 100)
  var 재화종류별소비총액: {
    var 생필품: number
    var 기호품: number
    var 고가품: number
  }
}

/**
 *
 */
export def Consumer => {
  %%//
  static var 인구수: number = 0

  %%//
  static var 분류항목: string[] = []

  %%//
  static var 소비계층: 소비계층[] = []

  /**
   * 소비자 정보를 파일에서 읽어온다.
   * 소비자 정보를 구성할 때 고소득층이 먼저 정의되어야 한다.
   * 계층이 정의되어진 순서대로 처리되기 때문에 고소득층이 먼저 정의되지 않으면
   * 상품이 부족할 경우 고소득층은 상품을 소비할 수 없게 된다.
   *
   * @param fileName
   */
  static def load(fileName: string) => {
    val obj = FileLoader.loadCommentJsonFile(fileName)
    this.인구수 = obj.인구수
    this.분류항목 = obj.분류항목

    %%// 소비자 정보는 다시 로드되어질 수 있다.
    this.소비계층 = []
    obj.소비계층.forEach((layer: any) => {
      this.소비계층.push(layer)
    })

    this.updateConsumerLayer()
  }

  /**
   *
   */
  static def validate() => {
    console.log('validate consumer')
    var rate = 0
    this.소비계층.forEach(layer => {
      rate += layer.인구비율

      assert.equal(
        layer.구매요인별구매패턴.가격 + layer.구매요인별구매패턴.품질 + layer.구매요인별구매패턴.상표,
        100,
        layer.이름
      )
      assert.equal(
        layer.재화종류별구매패턴.생필품 + layer.재화종류별구매패턴.기호품 + layer.재화종류별구매패턴.고가품,
        100,
        layer.이름
      )
    })

    assert.equal(rate, 100, rate.toString())
  }

  /**
   *
   * @param indent
   * @param log
   */
  %%// debugging
  static var 로그출력: boolean = false
  static def smartlog(indent: number, msg: string = '', ...optionalParams: any[]) => {
    if (this.로그출력) {
      LogService.smartlog('Consumer', indent, msg, ...optionalParams)
    }
  }

  /**
   *
   * @param layerName
   * @returns
   */
  static def getLayer(layerName: string) => {
    val layer = this.소비계층.find(l => l.이름 == layerName)
    if (layer == nil) console.log('undefined layer:', layerName)
    return layer
  }

  /**
   * 소비계층 update
   */
  static def updateConsumerLayer() => {
    this.소비계층.forEach((layer: 소비계층) => {
      layer.인구총수 = (this.인구수 * layer.인구비율) / 100
      layer.소비총액 = layer.인구총수 * layer.일평균지출액
      layer.재화종류별소비총액 = {
        생필품: (layer.소비총액 * layer.재화종류별구매패턴.생필품) / 100
        기호품: (layer.소비총액 * layer.재화종류별구매패턴.기호품) / 100
        고가품: (layer.소비총액 * layer.재화종류별구매패턴.고가품) / 100
      }
    })
  }

  /**
   * 분류 > 재화 > 계층 > 상품 순으로 처리되어진다.
   * 이전에는 계층 > 분류 > 재화 > 상품 순으로 처리하였는데 계층이 최상위가 되면
   * 필요 이상으로 계층을 의식해야만 하게 된다. 그냥 소비자는 소비자일 뿐인데
   * 항상 고소득자인지 아닌지를 신경써야 하고 계층간 합계를 구하기 불편하다.
   */
  static def process() => {
    this.updateConsumerLayer()
    this.분류항목.forEach(분류항목이름 => {
      this.분류별처리(분류항목이름)
    })
  }

  /**
   * 시장에 나와 있는 해당 분류 항목에 속하는 모든 재화와 모든 상품을 구한다.
   * 이를테면 생필품에 속하는 재화의 종류가 10개이면 10가지 종류에 대해서 균등하게 비용을 지불한다.
   * 중요한 점은 상품에 대해서가 아니라 재화에 대해서 균등 지출한다는 점이다.
   * 그리고 시장에 상품이 나와 있는 재화에 대해서만 처리한다.
   * 만약 생필품에 해당하는 재화가 시장에 하나도 없으면
   * 생필품에 할당되어진 금액은 쓰이지 않고 버려진다(?)
   *
   * @param 분류항목이름
   */
  static def 분류별처리(분류항목이름: string) => {
    %%// goodsList는 이를테면 생필품에 속하는 재화 리스트임
    val goodsList = Market.getGoodsList([분류항목이름])
    goodsList.forEach((goods: Goods) => {
      val saleList = Market.재화별판매현황(goods.name)
      saleList.forEach(s => {
        s.거래 = new Array<거래정보>()
      })

      this.소비계층.forEach(layer => {
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

        %%// 구매 지수를 구할 때 재화별 구매요인과 소비계층별 구매요인을 모두 적용한다.
        val 구매요인평균 = {
          가격: (goods.구매요인.가격 + layer.구매요인별구매패턴.가격) / 200
          품질: (goods.구매요인.품질 + layer.구매요인별구매패턴.품질) / 200
          상표: (goods.구매요인.상표 + layer.구매요인별구매패턴.상표) / 200
        }

        this.재화별처리(saleList, 재화별소비총액, 구매요인평균)

        %%// 여기는 이를테면 고소득층에서의 비누에 대한 처리가 끝난 것이다.
        %%// list는 상품의 상품판매정보를 가지고 있는데 판매에 대한 정보는 여기에 다시 기록된다.
        %%// 이 정보는 한 상품에 대해서 지속적으로 업데이트되기 때문에 다음 계층에서 처리될 때
        %%// 정보가 갱신되어 버린다. 따라서 여기서 계층별로 판매되어진 정보를 남겨두어야 한다.

        saleList.forEach(s => {
          val trade: 거래정보 = {
            누구에게: layer.이름
            남은수량: s.수량
            구매지수: s.구매지수
            주문수량: s.주문수량
            주문금액: s.주문금액
            투입금액: s.투입금액
            그룹: s.그룹
          }
          s.거래.push(trade)
        })
      })
    })
  }

  /**
   *
   * @param list
   * @param 재화별소비총액
   * @param 구매요인평균
   */
  static def 재화별처리(list: 판매현황[], 재화별소비총액: number, 구매요인평균: 구매요인비율) => {
    var sum = 0
    var min = Number.MAX_VALUE
    var max = 0
    list.forEach(s => {
      %%// 상품별로 구매지수를 구한다. 아울러 해당 재화의 min, max 구매지수도 같이 구함
      %%// 동일한 재화에 대한 다양한 상품들은 구매요인별 구매패턴에 따라서 소비 비율이 정해지는데
      %%// 재화별 구매요인과 계층별 구매요인이 있으며 둘의 평균을 구해서 상품별로 구매 지수를 계산한다.
      val 가격비율 = s.정규화된가격 * 구매요인평균.가격
      val 품질비율 = s.정규화된품질 * 구매요인평균.품질
      val 상표비율 = s.정규화된상표 * 구매요인평균.상표
      val 구매지수 = 가격비율 + 품질비율 + 상표비율

      %%// 모든 상품의 구매 요인 지수를 나중 사용을 위해 저장해 두고 min, max, ave을 구한다.
      s.구매지수 = {
        가격지수: `${s.정규화된가격} * ${구매요인평균.가격}`
        품질지수: `${s.정규화된품질} * ${구매요인평균.품질}`
        상표지수: `${s.정규화된상표} * ${구매요인평균.상표}`
        지수합계: 구매지수
      }
      sum += 구매지수
      if (구매지수 < min) min = 구매지수
      if (구매지수 > max) max = 구매지수
    })
    val ave = sum / list.length

    %%// 그룹핑을 처리한다.
    %%// 그룹으로 묶는 방법은 [[실소비 결정 알고리즘]]을 참고한다.
    %%// 그룹으로 묶을 단위는 (max - ave) / 15 또는 (ave - min) / 15 이다.
    %%// 구매 지수의 min, max, ave는 위에서 이미 계산해 둠
    %%// 높은 순부터 그룹을 쭉 열거해 준다.
    %%// range1 < range2
    val n1 = (max - ave) / 15
    val n2 = (min - ave) / 15
    val groups = [
      {
        rank: 9
        range1: ave + 10 * n1
        range2: ave + 15 * n1 // max
      },
      {
        rank: 8
        range1: ave + 6 * n1
        range2: ave + 10 * n1
      },
      {
        rank: 7
        range1: ave + 3 * n1
        range2: ave + 6 * n1
      },
      {
        rank: 6
        range1: ave + 1 * n1
        range2: ave + 3 * n1
      },
      {
        rank: 5
        range1: ave
        range2: ave + 1 * n1
      },
      {
        rank: 4
        range1: ave + 1 * n2
        range2: ave
      },
      {
        rank: 3
        range1: ave + 3 * n2
        range2: ave + 1 * n2
      },
      {
        rank: 2
        range1: ave + 6 * n2
        range2: ave + 3 * n2
      },
      {
        rank: 1
        range1: ave + 10 * n2
        range2: ave + 6 * n2
      },
      {
        // 마지막의 range1의 값은 min인 ave + 15 * n2 이어야 하는데 등호문제로 -1으로 설정함
        rank: 0
        range1: -1 // ave + 15 * n2 // min
        range2: ave + 10 * n2
      }
    ]

    %%// 이제 상품별로 소비를 시작한다.
    %%// 그전에 몇몇 값들을 초기화한다.
    list.forEach(s => {
      s.투입금액 = 0
      s.주문수량 = 0
      s.주문금액 = 0
    })

    %%/*
    //-------------------------------------------------------------------------
    // 이 방식은 폭포 방식이다.
    //-------------------------------------------------------------------------
    // 그룹의 높은 순서대로 수요를 다 처리하는 식으로 한다.
    // 같은 그룹내에서 소비의 분배는 [[실소비 결정 알고리즘]]을 참고한다.
    // 재화별 소비총액은 그룹을 따라 소모되면서 없어진다. 따라서 상위 그룹에서 모두 소진될 수도 있다.
    var money = 재화별소비총액
    groups.forEach(group => {
      // console.log('그룹', group.rank, '처리')

      // 해당 그룹에 속하는 상품들을 모두 구한다.
      // 이때 처리대상이 되지 않는 수량이 없는 상품은 제외한다.
      val 그룹내상품들 = list.filter(
        p =>
          group.range1 < s.구매지수.지수합계 &&
          group.range2 >= s.구매지수.지수합계 &&
          s.수량 > 0
      )

      // for debugging
      그룹내상품들.forEach(p => (s.그룹 = group.rank))

      money = this.그룹별처리(그룹내상품들, money)
      if (money <= 0) return
    })
    */%%

    %%/*
    //-------------------------------------------------------------------------
    // 이 방식은 확률 방식이다.
    //-------------------------------------------------------------------------
    // 구매 지수를 확률값으로 이용한다.
    // 즉 구매 지수가 높은 상품이 더 많이 팔리는데 이는 당연한 것이지만 얼마나 많이 팔리는지를
    // 어떻게 결정할 것인가 하는 문제가 있다. 확률 방식은 전체 구매지수의 합의 비율로 배분한다.
    // 즉 전체 상품의 구매지수들 중 해당 상품의 구매지수의 비율이 판매량이 되는 것이다.
    // 해당 비율만큼 판매되어진 이후에 금액이 남으면, 즉 공급이 충분하지 못하면
    // 남아있는 것들에 대해서 다시 같은 방법으로 소비를 처리한다.
    // 남아있는 상품이 없거나 어떤 상품도 살 수 없을 정도로 금액이 줄어들 때까지 반복된다.
    */%%
    var money = 재화별소비총액
    this.smartlog(0, '재화별소비총액:', 재화별소비총액)
    this.smartlog(0, '-----------------------------')

    var spend = 0
    var isEnough = false
    while (!isEnough) {
      var sum = 0
      var rest = 0

      %%// 판매할 것이 남아있는 상품들 리스트를 구한다.
      val 판매상품들: 판매현황[] = []
      list.forEach(s => {
        if (s.수량 > 0 && s.가격 <= money) {
          sum += s.구매지수.지수합계
          판매상품들.push(s)
        }
      })

      if (판매상품들.length == 0 || money <= 0) isEnough = true
      else {
        %%// 구매지수의 비율만큼 재화를 소비하고 남은 금액을 모아서 다시 시도한다.
        %%// 그런데 이때 남은 금액을 비율로 다시 배분하기 때문에 결국은 아무 것도 소비할 수 없는 경우가 생긴다.
        %%// 이런 경우 무한 루프가 되므로 모든 상품의 상품별 지출 가능한 금액이 가격을 넘지 못하면 그만둬야 한다.
        var checkRate = 0
        var checkQuit = true
        this.smartlog(0, '판매 대상 목록:', 판매상품들.length, sum)
        판매상품들.forEach(s => {
          val 지수비율 = s.구매지수.지수합계 / sum
          val 상품별지출가능액 = money * 지수비율
          if (상품별지출가능액 < s.가격) return;

          s.그룹 = 지수비율

          this.smartlog(1, '상품명:', s.상품명)
          this.smartlog(2, '가격:', s.가격)
          this.smartlog(2, '수량:', s.수량)
          this.smartlog(2, '지수합계:', s.구매지수.지수합계)
          this.smartlog(2, '지수비율:', 지수비율)
          this.smartlog(2, '상품별지출가능액:', 상품별지출가능액)
          checkRate += 지수비율

          val result = this.상품별처리(s, 상품별지출가능액)

          this.smartlog(2, '남은 수량:', s.수량)
          this.smartlog(2, '남은 금액:', result)

          rest += result
          spend += 상품별지출가능액 - result
          checkQuit = false
        })

        if (checkQuit) isEnough = true
        else {
          this.smartlog(0, 'check:', checkRate)
          this.smartlog(0, 'spend:', spend)
          this.smartlog(0, 'rest:', rest)

          money = rest
        }
      }
    }

    this.smartlog(0, '-----------------------------')
    this.smartlog(0, `결과: ${재화별소비총액}중에서 ${spend}을 사용하고 ` .. `${재화별소비총액 - spend}이 남음`)
  }

  /**
   * money는 그룹에 투입되는 돈이다.
   * 이 값은 상품이 구매할때마다 줄어들고 더이상 소비가 없으면 다음 그룹으로 넘겨진다.
   *
   * @param 그룹내상품들
   * @param money
   * @returns
   */
  static def 그룹별처리(그룹내상품들: 판매현황[], money: number)-> number => {
    var 그룹내상품개수 = 그룹내상품들.length
    if (그룹내상품개수 <= 0) return money

    var isEnough = false
    while (!isEnough) {
      %%// 그룹내 모든 상품이 균등하게 소비되게 하기 위해서 각 상품마다 동일한 금액으로 소비를 한다.
      var 그룹내상품별지출가능액 = money / 그룹내상품개수

      %%// 각 상품별로 할당된 금액을 주문하는데 사용하고 남은 금액을 모아서 다시 소비한다.
      %%// 이때 수량이 다 소진된 상품들은 대상에서 제외하고 한 개도 구입할 수 없을때까지 반복한다.
      var 주문수량합계 = 0
      그룹내상품들.forEach(s => {
        val 상품수량 = s.수량
        if (상품수량 <= 0) return;

        assert(s.가격 > 0, s.상품명)
        var 주문수량 = Math.floor(그룹내상품별지출가능액 / s.가격)
        if (상품수량 < 주문수량) {
          주문수량 = 상품수량
        }
        if (주문수량 <= 0) return;

        val 주문금액 = 주문수량 * s.가격

        assert(주문수량 <= 상품수량, s.상품명)
        assert(주문금액 <= 그룹내상품별지출가능액, s.상품명)

        s.투입금액 += 그룹내상품별지출가능액
        s.주문수량 += 주문수량
        s.주문금액 += 주문금액

        val n = Market.getProduct(s.상품명)
        assert.notEqual(n, nil, s.상품명)
        %%// 시장에 나와있는 상품의 수량을 뺀다는 것은 해당 회사에 주문을 넣는다는 것이다.
        this.sendOrder(n!.판매회사, n!.판매부서, n!.재화명, 주문수량)

        주문수량합계 += 주문수량
        s.수량 -= 주문수량
        money -= 주문금액
      })

      %%// 한번 소비가 끝난 다음 남아있는 상품들의 개수와 최저가격을 구한다.
      그룹내상품개수 = 0
      var 최저가격 = Number.MAX_VALUE
      그룹내상품들.forEach(s => {
        if (s.수량 > 0) {
          그룹내상품개수 += 1
          if (s.가격 < 최저가격) 최저가격 = s.가격
        }
      })

      %%// 반복할지의 여부를 검사한다.
      if (주문수량합계 == 0) {
        %%// 주문수량이 0이 되는 이유는 상품에 할당된 금액이 최저 가격보다 높기 때문이다.
        %%// this.smartlog(0, '더이상 주문할 수 없어서 넘어감')
        isEnough = true
      }
      if (그룹내상품개수 <= 0) {
        %%// this.smartlog(0, '더이상 상품이 없어서 넘어감')
        isEnough = true
      }
      if (money < 최저가격) {
        %%// this.smartlog(0, '남은 잔액이 충분하지 않아서 넘어감')
        isEnough = true
      }
    }

    %%// restMoney는 모든 그룹에서 계속 사용되는 값이므로 리턴한다.
    return money
  }

  /**
   *
   * @param s
   * @param 상품별지출가능액
   * @returns
   */
  static def 상품별처리(s: 판매현황, 상품별지출가능액: number)-> number => {
    var money = 상품별지출가능액
    val 상품수량 = s.수량
    if (상품수량 <= 0) return money

    assert(s.가격 > 0, s.상품명)
    var 주문수량 = Math.floor(상품별지출가능액 / s.가격)
    if (상품수량 < 주문수량) {
      주문수량 = 상품수량
    }
    if (주문수량 <= 0) return money

    val 주문금액 = 주문수량 * s.가격

    assert(주문수량 <= 상품수량, s.상품명)
    assert(주문금액 <= 상품별지출가능액, s.상품명)

    s.투입금액 += 상품별지출가능액
    s.주문수량 += 주문수량
    s.주문금액 += 주문금액

    val n = Market.getProduct(s.상품명)
    assert.notEqual(n, nil, s.상품명)
    %%// 시장에 나와있는 상품의 수량을 뺀다는 것은 해당 회사에 주문을 넣는다는 것이다.
    this.sendOrder(n!.판매회사, n!.판매부서, n!.재화명, 주문수량)

    %%// 주문수량합계 += 주문수량
    s.수량 -= 주문수량
    money -= 주문금액
    return money
  }

  /**
   * 소비자의 소비는 최종적으로는 상품을 판매하는 회사에 대한 주문으로 끝난다.
   *
   * @param toFirm
   * @param toDept
   * @param goodsName
   * @param amount
   * @returns
   */
  static def sendOrder(toFirm: string, toDept: string, goodsName: string, amount: number) => {
    assert(amount > 0)
    %%// for testing
    if (toFirm == '-1' && toDept == '-1') return;

    val dept = Firm.getDept(toFirm, toDept)
    dept?.주문.push({
      발주회사: '-1'
      발주부서: '-1'
      재화명: goodsName
      주문량: amount
    })
  }
}
