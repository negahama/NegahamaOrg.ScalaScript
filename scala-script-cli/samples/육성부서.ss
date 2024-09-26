%%
import assert from 'assert'

import { SimDate } from './SimDate'
import { Dept, 송장, 주문 } from './부서'
import { Goods } from './재화'
import { Rsrc } from './자원'
%%

/**
 * 유체의 구입시기와 수량
 */
def 육성정보 => {
  var 일자: SimDate
  var 수량: number
}

/**
 * 육성 부서는 가축을 취급하는 부서이다.
 * 가축은 유체와 성체로 나눠지고 육성 부서는 유체를 구입해서 성체로 키우는 부서이다.
 * 유체가 성체로 자라는 기간은 재화 정보의 발육기간에 저장되어져 있으며
 * 유체, 성체 모두 유지하는데 사료비용이 든다.
 * 육성 부서에서 연결되어진 가공 부서는 가축을 이용해 고기, 우유, 계란등을 얻는다.
 * 고기는 가축을 도축해서 얻기 때문에 육성 부서의 성체수를 줄이지만 우유, 계란등은 그렇지 않다.
 *
 * 육성부서의 특징 중에 하나는 다른 부서는 단일 재화를 취급하는데 반해 육성 부서는 여러 재화를 취급한다는 것이다.
 * 제조부서가 여러 개의 원료를 가지고 제조를 하지만 이것은 입력이 여러 개이지 자신이 취급하는, 즉 생산하는 재화는
 * 한가지이다.
 * 하지만 육성 부서는 자신이 선택한 재화에서 여러가지 다른 재화를 생산한다.
 * 여기서는 이를 부산물이라고 하는데 모든 가축이 이런 부산물을 가지는 것은 아니다.
 * 부산물은 해당 재화에서 특별한 처리없이도 생산되는 재화를 말한다.
 * 예를 들면 소의 경우 우유, 닭의 경우 계란 같은 것들이 부산물이다.
 * 우유가 소를 원료(원자재)로 하기 때문에 소를 원료로 우유를 계산하는 방식을 사용하면
 * 여러 개의 가공 부서가 육성 부서에 연결되어져 있을 때 문제가 된다.
 * 모든 가공 부서가 육성 부서의 부산물을 중복해서 사용하게 되기 때문이다.
 * 그래서 육성부서에서 부산물을 관리해야 한다.
 *
 * 그리고 유체의 구입은 사실 발주 처리라고 할 수 있지만 일반 부서의 발주 처리는 단순히 주문만 하기 때문에
 * 유체 구입처럼 비용과 처리량이 변하는 처리를 하기에는 발주 처리 부분은 적합하지 않다.
 * 따라서 유체 구입은 자체 처리에서 처리하고 있다.
 *
 * 유체 구입시 널뛰기 현상을 막기 위해서 유체 구입시 주문을 예측해서 할 필요가 있는데
 * 주문에는 부산물에 대한 주문도 포함되어져 있기 때문에 이를 고려해야 한다.
 */
export def 육성부서 extends Dept => {
  /**
   * 육성 부서는 자원의 종류를 검사하고 자원의 품질 항목만 사용한다.
   * 품질은 비옥도 항목으로 자원을 로드할때 품질로 변환된다.
   */
  var 자원: Rsrc = new Rsrc('', '')

  /**
   * 유체는 원료와 비슷하고 성체는 부서의 취급 제품과 비슷하다.
   */
  var 유체: 육성정보[] = []

  /**
   * 부서가 취급하는 제품의 종류를 변경한다.
   * 공급처가 변경되면 자체처리에서 이 함수가 호출되면서
   * 자신이 취급하는 재화의 종류와 가격이 자동적으로 변경된다.
   * 품목의 변경이 제대로 이뤄지지 않으면 error code를 리턴한다.
   *
   * 해당 부서가 육성부서이면 바뀐 품목에 맞게 부산물 설정을 해주어야 한다.
   *
   * @param 품목
   */
  def 취급재화변경(품목: string)-> string | void => {
    val goods = Goods.getGoods(품목)
    assert.notEqual(goods, nil, this.name)
    assert.equal(goods.name, 품목, 품목)
    if (goods == nil) return 'invalid goods'

    assert.equal(goods.분류.includes('가축'), true, 품목)
    assert.equal(goods.분류.includes('축산물'), true, 품목)
    assert.notEqual(goods.발육기간, nil)
    assert.notEqual(goods.사료비용, nil)
    assert.notEqual(goods.유체비용, nil)
    assert.notEqual(goods.발육기간, 0)
    assert.notEqual(goods.사료비용, 0)
    assert.notEqual(goods.유체비용, 0)

    val result = super.취급재화변경(품목)
    if (result) {
      console.log('취급재화변경 실패:', `error code: ${result}, 재화: ${품목}`)
      assert(false)
      return result
    }

    %%// 부산물이 있는 경우이면 부산물용 창고를 하나 더 만든다.
    if (this.제품종류() == '소' || this.제품종류() == '닭' || this.제품종류() == '양') {
      val goodsName = this.부산물종류()
      val goods = Goods.getGoods(goodsName)
      this.제품관리자.addShed(goodsName, goods.적정가격)
    }
  }

  /**
   *
   * @param obj
   * @returns
   */
  def load(obj: any) => {
    super.load(obj)

    %%// 채굴, 육성, 재배 부서의 경우에는 공급처 대신 회사의 자원을 사용한다. 이를 실제 자원과 연결해 주어야 한다.
    assert(obj.공급처 == nil || obj.공급처.length == 0, this.name)
    assert.notEqual(this.회사().자원, nil)
    assert.notEqual(this.회사().자원, '')

    %%// 육성 부서에 연결되는 자원은 목축지이다.
    %%// 육성 부서는 자원이 목축지인지를 검사하고 자원에서 품질 항목만을 사용한다.
    %%// 이때 목축지, 농경지 등은 재화의 종류가 설정되어져 있지 않으며 재화의 종류는 육성 부서 자체의 설정을 따른다
    %%// 이때 육성 부서에서 취급하는 재화인지를 검사하고 해당 재화에 발육기간 항목이 있는지도 검사한다.
    val rsrc = Rsrc.getRsrc(this.회사().자원)
    assert.notEqual(rsrc, nil, this.회사().자원)
    if (rsrc == nil) return;

    assert.equal(rsrc.종류, '목축지')
    assert.notEqual(rsrc.품질, 0)

    this.자원 = rsrc
  }

  /**
   *
   * @returns
   */
  def toJSON() => {
    val json = super.getJSON()
    return {
      ...json
      자원: this.자원.이름
    }
  }

  /**
   *
   */
  def process_초기화() => {
    super.process_초기화()
    this.성체출고량 = 0
  }

  /**
   * 육성 부서는 부서의 입고, 출고를 그대로 사용한다.
   * 다만 출고시에 출고할 제품이 부산물이면 별도의 처리가 필요하다.
   * 부산물은 처리한계를 따지지 않는다. 처리량에 영향을 미치지도 않는다.
   * 나중에 유체를 구입할때 적절한 유체의 양을 산출하기 위해서 부산물이 아닌 성체에 대한
   * 출고량을 계산해 둘 필요가 있다.
   *
   * @param order
   * @param 남은주문처리량
   * @returns
   */
  var 성체출고량: number = 0
  def 출고처리(order: 주문, 남은주문처리량: number)-> number => {
    %%// 부산물을 처리하는 경우가 아니면 있는 것을 사용한다.
    val goodsName = this.부산물종류()
    if (order.재화명 != goodsName) {
      return super.출고처리(order, 남은주문처리량)
    }

    val shed = this.제품관리자.findShed(order.재화명)
    assert.notEqual(shed, nil, order.재화명)
    if (shed == nil) return 남은주문처리량

    this.smartlog(1, '부산물 요청:', order.재화명)
    this.smartlog(2, '보유수량:', shed.제품수량())

    assert.equal(order.재화명, shed.제품종류(), this.name)
    assert(order.주문량 > 0, this.name)

    %%// 부산물의 처리는 처리한계를 따지지 않는다.
    %%// 그냥 요청한 물량을 내가 가지고 있다면 다 전달한다.
    var 처리량 = order.주문량
    if (처리량 > shed.제품수량()) 처리량 = shed.제품수량()

    this.smartlog(2, '보낼수량:', 처리량)

    %%// 내가 가지고 있는 것이 없거나 해서 보낼 것이 0인 경우에도
    %%// 그런 사실을 로그로 남기기 위해서 여기까지는 처리되어야 한다.
    if (처리량 <= 0) {
      return 남은주문처리량
    }

    val 출고가 = this.판매가격(order.재화명)
    this.smartlog(2, '출고가격:', 출고가)
    assert.notEqual(처리량, 0, this.name)
    assert.notEqual(출고가, 0, this.name)

    %%// 창고에서 처리량만큼 제품을 꺼내고
    this.제품출고(order.재화명, 처리량)

    %%// 판매가격으로 수입을 계산한다.
    this.매출().증가(order.발주회사, 출고가, 처리량)

    %%// 주문을 요청한 곳에 물건을 보낸다.
    %%// 따라서 내가 from이 되고 요청한 곳이 to가 된다.
    val invoice: 송장 = {
      발주회사: this.회사().name
      발주부서: this.name
      제품: {
        재화: shed.제품종류()
        수량: 처리량
        가격: 출고가
        품질: shed.제품품질()
        상표: shed.제품상표()
      }
    }

    assert(invoice.제품.수량 > 0, this.name)
    val msg = `from(${this.name}) to(${order.발주부서}) amount(${invoice.제품.수량})`
    this.smartlog(2, '송장발송:', msg)

    this.sendInvoice(order.발주회사, order.발주부서, invoice)

    return 남은주문처리량
  }

  /**
   * 육성부서는 유체와 성체를 모두 합한 것이 재고한계가 될 때까지 유체를 구입한다.
   * 유체는 발육기간 동안 대기하며 성체가 되어야만 판매도 가능하고 부산물도 생산된다.
   * 성체가 판매되는 동안에도 성체가 판매된 양만큼 유체가 채워져야 한다.
   *
   * 이것도 판매가 많으면 즉 성체로 바뀌는 가축이 바로바로 다 소비되는 상황이라면
   * 유체가 재고 한계를 채워 더이상 유체를 구입할 필요가 없다고 생각하고 유체를 구입하지 않으면
   * 널뛰기 현상이 생기게 된다. 판매와 마찬가지로 수요를 고려해서 유체를 구입해야 한다.
   */
  def 자체처리() => {
    this.smartlog(0, '육성부서 자체처리')

    %%// 지출될 비용은 지출된다
    %%// 운영비는 하단에서 처리된다.
    this.비용.추가('고정비', Dept.getLogic().고정비산정(this))
    this.비용.추가('인건비', Dept.getLogic().인건비산정(this))
    this.비용.추가('교육비', Dept.getLogic().교육비산정(this))

    val today = SimDate.getToday()

    %%// 유체는 구입시에 구입 날짜가 기록되고 시간 순서대로 저장된다
    %%// 현재 날짜와 구입 날짜를 비교해서 발육 기간이 지났으면 성체로 입고한다.
    %%// 이때 성체의 가격은 해당 부서가 성체를 판매하는 가격으로 설정되고
    %%// 성체의 품질은 자원의 품질, 즉 비옥도로 정해진다.
    %%// 가축, 작물등은 기술이 없어 원료품질이 100%임
    if (this.유체.length != 0) {
      if (today.no - this.유체[1].일자.no >= this.취급재화.발육기간) {
        %%// 유체가 성체로 바뀌어 창고에 입고된 것은 어떤 비용도 들지 않는다.
        this.smartlog(1, '성체가 된 가축들이 입고됨')
        this.smartlog(2, JSON.stringify(this.유체[1]))

        this.제품입고({
          재화: this.제품종류()
          수량: this.유체[1].수량
          가격: this.판매가격()
          품질: this.자원.품질
          상표: 0
        })

        this.유체.shift()
      }
    }

    var 유체총수량 = 0
    this.유체.forEach(e => {
      유체총수량 += e.수량
    })

    val 성체총수량 = this.제품총수량()
    val 가축총수량 = 성체총수량 + 유체총수량

    %%// 창고에서 해당 가축이 나간 양을 구한다.
    val shed = this.제품관리자.findShed(this.제품종류())
    assert.notEqual(shed, nil, this.name)
    if (shed == nil) return;

    this.성체출고량 = shed.출고량

    %%// 유체의 구입량은 재고한계 - (현재 유체, 성체 모두 합한 값) - 수주총량 이다.
    val 수주총량 = Math.min(this.성체출고량, this.처리한계())
    val next = 가축총수량 - 수주총량
    var diff = this.재고한계() - next
    if (diff > this.처리한계()) diff = this.처리한계()

    this.smartlog(1, '유체구입')
    this.smartlog(2, '가축총수량:', 가축총수량, 성체총수량, 유체총수량)
    this.smartlog(2, '수주총량:', 수주총량, this.성체출고량, this.처리한계())
    this.smartlog(2, '재고한계:', this.재고한계())
    this.smartlog(2, 'next:', next)
    this.smartlog(2, 'diff:', diff)

    %%// diff가 0 이하라는 의미는 재고가 요청량을 웃돈다는 의미이다.
    %%// 즉 이전에는 이런 경우 요청하지 않았다.
    if (diff <= 0) {
      diff = 수주총량
      this.smartlog(2, '다음 턴에 나갈 분량만큼만 구입한다.', diff)
    }

    %%// 유체의 입고는 입고로 잡히지 않는다. 별도로 관리한다.
    this.유체.push({
      일자: new SimDate(today)
      수량: diff
    })

    %%// 육성부서의 지출은 유체 구입비이고 운영비는 가축의 사료비용이다.
    %%// 비용처리시 내부 거래이면 비용으로 잡지 않는데 이 경우는 아니다.
    this.매입().증가('-1', this.취급재화.유체비용, diff)

    var msg = `지출: ${this.취급재화.유체비용 * diff} <= ` .. `유체비용(${this.취급재화.유체비용}) * 구입유체(${diff})`
    this.smartlog(1, msg)

    val cost = 가축총수량 * this.취급재화.사료비용
    this.비용.추가('운영비', cost)
    msg = `운영비: ${cost} <= ` .. `사료비용(${this.취급재화.사료비용}) * 총가축수(${가축총수량})`
    this.smartlog(1, msg)

    %%// 일반적인 부서의 경우 처리량은 출고 처리될 때 설정되는데
    %%// 육성 부서는 유체를 구입하는 양도 처리량으로 더한다.
    this.처리량 += diff

    this.smartlog(1, '처리량:', this.처리량)

    this.숙련도증가(this.처리량)

    %%// 부산물이 있는 경우이면 이를 처리한다.
    if (this.제품종류() == '소' || this.제품종류() == '닭' || this.제품종류() == '양') {
      this.smartlog(1, '부산물 처리')
      val goodsName = this.부산물종류()
      val goods = Goods.getGoods(goodsName)
      assert.equal(goods.name, goodsName, goodsName)
      assert.notEqual(goods.원료, nil)
      assert.equal(goods.원료.length, 1)
      assert.equal(goods.원료[1].원료, this.제품종류())

      var 원료품질 = 0

      %%// 원자재의 품질과 가격의 합도 구해둔다.
      %%// 원자재의 품질은 material.단위를 곱하지 않는다.
      %%// 즉 제조 과정에서 더 많이 투입된 원자재라고 해도 그것이 품질에 더 많은 영향을 끼치는 것은 아니다.
      %%// 양이 많다고 해서 반드시 질에 영향을 더 미치는 것은 아니다.
      원료품질 += this.제품품질()

      %%// 생산기술 관련...
      %%// 재화 자체가 관련된 생산기술이 없는 재화이면 품질요인의 생산기술 비율이 0이어야 한다.
      %%// 그리고 해당 기업이 관련 생산기술을 가지고 있지 않으면 제품을 생산할 수 없어야 하는데
      %%// 이것은 이전 단계 즉 생산할 재화를 선택하는 단계에서 처리되었어야 하는 일이며
      %%// 이 단계에서는 생산기술이 없으면 안된다.
      %%// 생산기술의 수준은 최대값을 100으로 상정하고 있으며 생산기술이 여러 개이면 평균을 사용한다.
      val corp = this.기업()
      if (corp == nil) return;

      var 생산기술 = 0
      val teches = goods.관련기술
      if (teches == nil || teches.length == 0) {
        assert.equal(this.취급재화.품질요인.생산기술, 0, this.취급재화.name)
      } else {
        teches.forEach(tech => {
          val value = corp.보유기술.find(s => s.이름 == tech)
          if (value == nil) {
            this.smartlog(1, '생산에 필요한 기술을 가지고 있지 않습니다')
            this.보고하기('생산기술 부재')
            %%// assert(false)
            return;
          }
          생산기술 += value.수준
        })
      }

      %%// 원료들의 품질 평균과 기술들의 평균을 구하고 비율만큼 적용한다
      assert.notEqual(goods.원료, 0, this.name)
      원료품질 = 원료품질 / goods.원료.length
      if (teches.length != 0) 생산기술 = 생산기술 / teches.length

      val 원료비율 = goods.품질요인.원료품질 / 100
      val 기술비율 = goods.품질요인.생산기술 / 100
      val 생산품질 = 원료품질 * 원료비율 + 생산기술 * 기술비율

      msg = `생산품질: ${생산품질} <= ` .. `원료품질(${원료품질}) * ${원료비율} + 생산기술(${생산기술}) * ${기술비율}`
      this.smartlog(2, msg)

      %%// 생산가능 수량은 현재 보유중인 성체의 수 * source.단위
      %%// 부산물은 매입으로 잡을 비용이 없다. 이것이 팔리면 매출로는 잡힌다.
      %%// 반면 유체는 매입비용이 있다.
      val 부산물수량 = Math.floor(성체총수량 * goods.원료[1].단위)
      this.제품입고({
        재화: goodsName
        수량: 부산물수량
        가격: goods.적정가격
        품질: 생산품질
        상표: 0
      })

      msg = `부산물 수량: ${부산물수량} <= ` .. `성체수량(${성체총수량}) * 단위(${goods.원료[0].단위})`
      this.smartlog(2, msg)
    }
  }

  /**
   *
   * @returns
   */
  def 부산물종류() => {
    var goodsName: string = ''
    this.제품종류() match {
      case '소' => {
        goodsName = '우유'
        break
      }
      case '닭' => {
        goodsName = '계란'
        break
      }
      case '양' => {
        goodsName = '양모'
        break
      }
    }
    return goodsName
  }
}
