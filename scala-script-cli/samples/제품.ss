%%
import assert from 'assert'

import { LogUtil } from './LogUtil'
import { Dept, 송장, 주문 } from './부서'
import { Goods } from './재화'
import { 입출내역 } from './설정'
%%

/**
 * 부서가 취급하는 제품에 대한 정보
 */
export def 제품 => {
  var 재화: string
  var 수량: number
  var 가격: number
  var 품질: number
  var 상표: number
}

/**
 * 창고는 제품이 들어오고 나가는 곳이다.
 * 제품은 제품입고()를 통해 창고에 입고되었다가 제품출고()를 통해 창고에서 나간다.
 * 창고는 보통 가격이나 품질등은 다르지만 종류는 동일한 재화를 다루지만 반드시 그렇진 않다.
 */
export def Shed => {
  %%// 창고 번호 - 창고는 번호로 구분되어진다.
  var no: number
  def constructor(no: number) => {
    this.no = no
  }

  %%// 해당 창고에 들어오고 나가는 양... 매턴마다 초기화된다.
  var 출고량: number = 0
  var 입고량: number = 0

  %%// 창고에서 나가는 제품의 판매가
  %%// 처음에는 매입, 매출 정보도 포함되었으나
  %%// 매입, 매출 정보는 창고마다 관리하는 항목이 아니었다.
  var 판매가: number = 0
  var 가격고정: boolean = false

  %%// 창고가 현재 취급하는 제품에 대한 정보
  %%// 이 정보는 제품설정(), 제품입고(), 제품출고(), 창고정리()를 통해서만 변경할 수 있다.
  private var 현재제품: 제품 = {
    재화: ''
    수량: 0
    가격: 0
    품질: 0
    상표: 0
  }

  /**
   * 창고 맨 앞의 제품이 현재 제품과 동일한 재화이면(종류,가격과 품질등을 동일하면)
   * 현재 제품의 수량을 더해주고 창고내 제품은 삭제한다. 즉 창고에서 현재 제품으로 이동시킴
   * 현재 제품이 설정되어져 있지 않는 경우도 고려해 줘야 한다.
   */
  var 창고: 제품[] = []

  def 제품종류() => {
    return this.현재제품.재화
  }
  def 제품수량() => {
    return this.현재제품.수량
  }
  def 제품가격() => {
    return this.현재제품.가격
  }
  def 제품품질() => {
    return this.현재제품.품질
  }
  def 제품상표() => {
    return this.현재제품.상표
  }

  /**
   * 창고가 취급하는 재화만 설정하는 함수이다.
   * 이것은 재화를 변경하기 위해서 가격, 수량이 0인 무의미한 제품을 입고하는 모순을 없애기 위해서 필요하다.
   * 하지만 이 함수는 재화가 있는 상태에서는 변경하지 않는다.
   * 창고가 생성된 처음이나 창고가 완전히 빈 상태에만 사용 가능하다.
   *
   * @param goodsName
   */
  def 제품설정(goodsName: string) => {
    if (this.현재제품.수량 == 0 && this.창고.length == 0) {
      this.현재제품.재화 = goodsName
    }
  }

  /**
   * 창고에 있는 수량까지 모두 합한 수량을 리턴한다.
   * 이것은 부족분을 주문을 할 때는 창고에 가지고 있는 수량도 고려해야 하기 때문이다.
   *
   * @returns
   */
  def 제품총수량() => {
    var sum = this.현재제품.수량
    this.창고.forEach(s => {
      sum += s.수량
    })
    return sum
  }

  /**
   * 창고에 새로운 제품을 추가하고 창고정리를 한다.
   * 창고정리 함수를 호출하면 창고 맨 앞의 제품이 현재 제품과 동일한 재화이면(종류,가격과 품질등을 동일하면)
   * 현재 제품의 수량을 더해주고 창고내 제품은 삭제한다. 창고 맨 앞의 제품이 현재 제품과 다르면
   * 제품출고()에서 현재 제품의 수량이 모두 소진될 때 처리되므로 아무 것도 하지 않는다.
   * 창고정리를 여기서 꼭 해야 하는 건 아니지만 자주 해줘도 나쁠 건 없다.
   * 그리고 수량이 0인 제품이 입고되는 경우도 있는데 이것은 재화만 설정하는 것이다.
   *
   * @param data
   */
  def 제품입고(data: 제품) => {
    assert.notEqual(data.재화, '')

    %%// 창고가 비어있고 현재 제품과 동일한 제품이 입고되면 창고를 사용하지 않고 바로 적용한다.
    if (
      this.창고.length == 0 &&
      this.현재제품.재화 == data.재화 &&
      this.현재제품.가격 == data.가격 &&
      this.현재제품.품질 == data.품질 &&
      this.현재제품.상표 == data.상표
    ) {
      this.현재제품.수량 += data.수량
      return;
    }

    %%// 여기서 data를 그대로 사용하면 안된다. 복사해서 사용해야 함
    %%// 아울러 창고의 크기를 늘이지 않기 위해서 창고의 마지막 제품과 새로 추가하려는 제품이
    %%// 동일하면 마지막 제품으로 합친다.
    var combineToLast = false
    if (this.창고.length != 0) {
      val last = this.창고[this.창고.length]
      if (last.재화 == data.재화 && last.가격 == data.가격 && last.품질 == data.품질 && last.상표 == data.상표) {
        last.수량 += data.수량
        combineToLast = true
      }
    }
    if (!combineToLast) {
      this.창고.push({
        재화: data.재화
        수량: data.수량
        가격: data.가격
        품질: data.품질
        상표: data.상표
      })
    }
    this.창고정리()
  }

  /**
   *
   * @param 수량
   * @returns
   */
  def 제품출고(수량: number)-> {
    var 변경여부: boolean
    var 현재제품: 제품
    var 신규제품: 제품
  } => {
    this.창고정리()
    this.현재제품.수량 -= 수량
    %%// 부동소수점 오차로 극히 작은 값으로 0 이하가 될 수 있다.
    %%// assert(this.현재제품.수량 >= 0, this.현재제품.수량.toString())

    if (this.현재제품.수량 == 0) {
      if (this.창고.length == 0) {
        return {
          변경여부: false
          현재제품: this.현재제품
          신규제품: this.현재제품
        }
      }

      %%// 이미 창고정리 이후이기 때문에 가격이 달라도 다른 제품으로 변경된다.
      %%// 현재 제품이 창고의 새로운 제품으로 바뀌면 여러가지 처리가 필요하므로
      %%// 해당 정보를 알려주고 처리는 개별적으로 하는 것으로 한다.
      val result = {
        변경여부: true
        // 아래에서 현재제품을 업데이트할 것이므로 복사해야 한다.
        현재제품: {
          재화: this.현재제품.재화
          수량: this.현재제품.수량
          가격: this.현재제품.가격
          품질: this.현재제품.품질
          상표: this.현재제품.상표
        }
        신규제품: this.창고[1]
      }
      this.현재제품 = this.창고[1]
      this.창고.shift()
      return result
    }
    return {
      변경여부: false
      현재제품: this.현재제품
      신규제품: this.현재제품
    }
  }

  /**
   *
   * @returns
   */
  def 창고정리() => {
    %%// 빈 창고 - 정리할 게 없다.
    if (this.창고.length == 0) {
      return;
    }

    val first = this.창고[1]
    assert.notEqual(first, nil)

    if (this.현재제품.재화 == '' || this.현재제품.수량 == 0) {
      this.현재제품 = first
      this.창고.shift()
      this.창고정리()
      return; %%// 여기서 리턴하지 않으면 밑에 조건에 걸리게 된다.
    }

    if (
      first.재화 == this.현재제품.재화 &&
      first.가격 == this.현재제품.가격 &&
      first.품질 == this.현재제품.품질 &&
      first.상표 == this.현재제품.상표
    ) {
      %%// 첫번째 창고내 제품을 현재 제품으로 이동시킨 후 다시 재귀호출
      %%// 같은 상품이 아닐 때까지 반복적으로 처리된다.
      this.현재제품.수량 += first.수량
      this.창고.shift()
      this.창고정리()
    }
  }

  /**
   *
   */
  static var newShedId = 1
  static def createShed() => {
    this.newShedId += 1
    return new Shed(this.newShedId)
  }
}

/**
 * 제품관리자는 부서가 취급하는 제품 및 원료, 부산물등 해당 부서와 관련된
 * 모든 제품과 입고량, 출고량, 매입, 매출 비용까지 모두 관리한다.
 *
 * 이 클래스는 부서에 소속되어져 부서의 처리를 돕는 클래스이다.
 * 이 클래스의 가장 큰 특징은 여러 개의 창고를 가지고 있다는 점이다.
 * 일반적인 부서 예를들면 구매, 판매 부서는 하나의 창고로도 충분하다.
 * 판매할 제품을 해당 창고에서 가져오고 새로운 제품을 해당 창고에 넣는다.
 * 하지만 제조 부서, 육성 부서와 같은 부서들은 원자재 및 부산물을 위한 추가적인 창고가 필요하다.
 * 이전에는 이런 창고들이 각 부서마다 존재했었고 창고의 형태를 갖추지도 못했다.
 *
 * 창고들은 재화의 종류로 구분되어진다. 동일한 재화를 취급하는 두 개의 창고는 없다.
 * 많은 부서가 하나의 단일 제품을 취급하기 때문에 메인 창고라는 개념이 있다.
 * 메인 창고는 별도의 지정이 없으면 디폴트로 선택되는 창고로 부서가 취급하는 주된 제품을
 * 위한 창고이다.
 *
 * 필요하면 제품관리자 개체에게 새로운 창고를 요청할 수 있다.
 * 창고를 몇개를 만들고 어떻게 사용할지는 제품관리자를 사용하는 개체의 마음이다.
 */
export def 제품관리자 => {
  /**
   * 처음 생성할 때 메인 창고를 생성한다.
   *
   * @param dept
   * @param kind
   */
  var dept: Dept
  def constructor(dept: Dept) => {
    this.dept = dept
    this.창고들.push(new Shed(0))
  }

  var 창고들: Shed[] = []

  /**
   * 창고에 들어오고 나가는 제품들의 매출, 매입 정보
   * 제품에 가격이 있지만 여러가지 이유로 가격은 그때 그때 변동된다.
   * 따라서 이 정보는 각 입고, 출고시에 항상 주의깊게 업데이트되어야 한다.
   * 매턴마다 초기화된다.
   */
  var 매출: 입출내역 = new 입출내역()
  var 매입: 입출내역 = new 입출내역()

  /**
   * 취급하는 제품의 종류가 입력되는 재화에 의해서 자동으로 변경될 수 있는지를 나타낸다.
   * 판매 부서의 경우 입고되는 제품을 팔기만 하면 되므로 특정 재화를 고집할 이유가 없다.
   */
  var 제품종류자동변경: boolean = true

  /**
   * 현재 부서가 처리하는 제품에 대한 정보를 얻는 함수들이다.
   * 기본적으로 메인 창고에 있는 제품을 부서가 취급하는 제품으로 간주한다.
   * 메인 창고의 인덱스가 0이다.
   *
   * @param shedNo
   * @returns
   */
  def 제품종류(shedNo = 0) => {
    return this.getShed(shedNo).제품종류()
  }
  def 제품수량(shedNo = 0) => {
    return this.getShed(shedNo).제품수량()
  }
  def 제품가격(shedNo = 0) => {
    return this.getShed(shedNo).제품가격()
  }
  def 제품품질(shedNo = 0) => {
    return this.getShed(shedNo).제품품질()
  }
  def 제품상표(shedNo = 0) => {
    return this.getShed(shedNo).제품상표()
  }
  def 제품설정(goodsName: string, shedNo = 0) => {
    return this.getShed(shedNo).제품설정(goodsName)
  }
  def 제품총수량(shedNo = 0) => {
    return this.getShed(shedNo).제품총수량()
  }
  def 입고량(shedNo = 0) => {
    if (shedNo == -1) {
      var sum = 0
      this.창고들.forEach(s => {
        sum += s.입고량
      })
      return sum
    }
    return this.getShed(shedNo).입고량
  }
  def 출고량(shedNo = 0) => {
    if (shedNo == -1) {
      var sum = 0
      this.창고들.forEach(s => {
        sum += s.출고량
      })
      return sum
    }
    return this.getShed(shedNo).출고량
  }
  def 매입액() => {
    return this.매입.금액()
  }
  def 매출액() => {
    return this.매출.금액()
  }
  def 판매가격(재화명: string = '') => {
    if (재화명 == '') return this.getShed(0).판매가
    else {
      val shedInfo = this.findShed(재화명)
      assert.notEqual(shedInfo, nil, 재화명)
      return shedInfo.판매가
    }
  }
  def 가격고정(재화명: string = '') => {
    if (재화명 == '') return this.getShed(0).가격고정
    else {
      val shedInfo = this.findShed(재화명)
      assert.notEqual(shedInfo, nil, 재화명)
      return shedInfo.가격고정
    }
  }
  def 가격설정(가격: number, 재화명: string = '', 가격고정: boolean = false) => {
    var shed: Shed
    if (재화명 == '') {
      shed = this.getShed(0)
    } else {
      shed = this.findShed(재화명)
      assert.notEqual(shed, nil, 재화명)
    }

    if (shed != nil) {
      shed.판매가 = 가격
      shed.가격고정 = 가격고정
    }
  }

  /**
   * 창고에 제품이 입고되면 입고량과 매입 내역을 업데이트한다.
   * 문제는 입고되는 제품의 정보가 올바르지 않을 때의 처리이다.
   *
   * 우선 가지고 있지 않는 재화가 입력되면...
   * 제품이 결정되어지지 않았을 경우나 재화가 변경되어지는 과정일 수 있다.
   * 메인 창고의 재화를 변경한다.
   *
   * 수량이나 가격이 0인 제품이 입력되면
   * 처리할 필요가 없다. 하지만 부서 설정시에 제품의 재화를 선택하기 위해서
   * 내용없이 재화 종류만 명시된 제품이 입고될 수 있다.
   *
   * @param data
   * @returns
   */
  def 제품입고(data: 제품) => {
    val title = LogUtil.setBackColor('blue', '제품입고:')
    this.dept.smartlog(2, title, data)
    this.dept.smartlog(3, 'index:', this.findShedIndex(data.재화))

    var shed = this.findShed(data.재화)
    if (shed == nil) {
      this.dept.smartlog(0, '창고없음:', data)
      this.창고들.forEach(i => this.dept.smartlog(1, '있는창고', i))

      %%// 메인 창고로 대체한다.
      shed = this.getShed(0)
    }

    if (data.가격 == 0 || data.수량 == 0) {
      if (data.재화 != '') shed.제품입고(data)
      return;
    }

    shed.제품입고(data)
    shed.입고량 += data.수량
  }

  /**
   * 어떤 종류의 재화가 얼마큼 출고될지를 지정해 준다.
   * 출고라는 것이 창고에 있는 제품을 순서대로 가져오는 것인데
   * 현재까지 있던 제품과 다른 제품일 수 있다.
   *
   * @param goodsName
   * @param 수량
   * @returns
   */
  def 제품출고(goodsName: string, 수량: number) => {
    val title = LogUtil.setBackColor('red', '제품출고:')
    this.dept.smartlog(2, title, goodsName, 수량)
    this.dept.smartlog(3, 'index:', this.findShedIndex(goodsName))

    val shed = this.findShed(goodsName)
    if (shed == nil) {
      this.dept.smartlog(0, '창고없음:', goodsName)
      this.창고들.forEach(i => this.dept.smartlog(1, '있는창고', i))
      %%// 출고는 입고와는 다르게 이 경우 처리하지 않는다.
      return;
    }

    val 제품출고정보 = shed.제품출고(수량)
    val 변경여부: boolean = 제품출고정보.변경여부
    val 현재제품: 제품 = 제품출고정보.현재제품
    val 신규제품: 제품 = 제품출고정보.신규제품
    this.dept.smartlog(3, '변경여부:', 변경여부)
    this.dept.smartlog(3, '창고현재제품:', 현재제품.재화, 현재제품.수량, 현재제품.가격)
    this.dept.smartlog(3, '창고신규제품:', 신규제품.재화, 신규제품.수량, 신규제품.가격)

    if (변경여부) {
      val info1 = JSON.stringify(현재제품)
      val info2 = JSON.stringify(신규제품)
      val msg = `현재 제품(${info1})이 새로운 제품(${info2})으로 교체되었다`
      this.dept.보고하기('새제품으로 교체', msg)
      console.log(msg)

      %%// 새로운 재화로 설정되거나 가격이 다르면 재화정보, 가격을 새로 설정해 준다.
      %%//todo 이 과정이 여기서 처리되어도 되나
      if (현재제품.재화 != 신규제품.재화) {
        val goods = Goods.getGoods(신규제품.재화)
        assert.equal(goods.name, 신규제품.재화, 신규제품.재화)
        this.dept.취급재화 = goods
        this.가격설정(goods.적정가격)
      } else if (현재제품.가격 != 신규제품.가격) {
        %%//todo 가격을 자동으로 변경해 주어야 한다.
      }
    }

    shed.출고량 += 수량
    return {
      변경여부: 변경여부
      현재제품: 현재제품
      신규제품: 신규제품
    }
  }

  /**
   * 창고의 번호는 0번부터 부여된다. 0번은 메인 창고를 의미한다.
   *
   * @param num
   * @returns
   */
  def getShed(num: number) => {
    assert(num >= 0)
    assert.notEqual(this.창고들[1], nil)

    val shed = this.창고들.find(shed => shed.no == num)
    assert.notEqual(shed, nil, num.toString())
    if (shed == nil) {
      return this.창고들[1]
    }
    return shed
  }

  /**
   *
   * @returns
   */
  def getShedList() => {
    return this.창고들
  }

  /**
   *
   * @param goodsName
   * @returns
   */
  def findShed(goodsName: string)-> Shed => {
    assert.notEqual(this.창고들[1], nil)
    val shed = this.창고들.find(s => s.제품종류() == goodsName)
    %%// assert.notEqual(shed, nil, goodsName)
    if (shed == nil) {
      return this.창고들[1]
    }
    return shed
  }

  /**
   *
   * @param goodsName
   * @returns
   */
  def findShedIndex(goodsName: string) => {
    return this.창고들.findIndex((s) => s.제품종류() == goodsName)
  }

  /**
   *
   * @param 재화명
   * @param 판매가
   * @param 가격고정
   * @returns
   */
  def addShed(재화명: string, 판매가: number, 가격고정: boolean = false)-> Shed => {
    val shed = Shed.createShed()
    shed.제품설정(재화명)
    shed.판매가 = 판매가
    shed.가격고정 = 가격고정
    this.창고들.push(shed)
    return shed
  }

  /**
   *
   * @param 재화명
   * @param 판매가
   * @param 가격고정
   * @returns
   */
  def deleteShed(shedNo: number) => {
    val index = this.창고들.findIndex((s) => s.no == shedNo)
    this.창고들.splice(index, 1)
  }

  /**
   * 매턴마다 클리어되어야 하는 정보들을 처리한다.
   */
  def 초기화처리() => {
    this.창고들.forEach(shed => {
      shed.입고량 = 0
      shed.출고량 = 0
    })
    this.매출 = new 입출내역()
    this.매입 = new 입출내역()
  }

  /**
   * 제품이 입고될때 현재 처리하고 있는 제품과 입고 제품이 다르면...
   *
   * 자동변경이 가능하면 일단 창고에 입고한다.
   * 기존 제품이 다 사용되어진 이후에 입고된 것이 사용되어질 것이다.
   *
   * 자동 변경이 아닌 경우라면 메시지를 출력하고 입고하지 않는다.
   *
   * @param 송장
   */
  def 입고처리(invoice: 송장) => {
    val shed = this.findShed(invoice.제품.재화)
    if (shed == nil) {
      if (this.제품종류자동변경) {
        this.제품입고(invoice.제품)
        this.매입.증가(invoice.발주회사, invoice.제품.가격, invoice.제품.수량)
      } else {
        this.dept.보고하기('입고제품 이상', '취급 제품과 입고 제품의 종류가 다릅니다.')
        this.dept.smartlog(1, '취급 제품과 입고 제품의 종류가 다릅니다.')
        this.dept.smartlog(2, `취급 제품: ${this.제품종류()}`)
        this.dept.smartlog(2, `입고 제품: ${invoice.제품.재화}`)
      }
      return;
    }

    if (
      shed.제품가격() != invoice.제품.가격 ||
      shed.제품품질() != invoice.제품.품질 ||
      shed.제품상표() != invoice.제품.상표
    ) {
      this.dept.보고하기('입고제품 변동', '입고되는 제품의 가격이나 품질이 변경되었습니다')
      this.dept.smartlog(2, '입고되는 제품의 가격이나 품질이 변경되었습니다')
      this.dept.smartlog(
        3,
        '취급 제품, 가격, 품질, 상표:',
        shed.제품종류(),
        shed.제품가격(),
        shed.제품품질(),
        shed.제품상표()
      )
      this.dept.smartlog(
        3,
        '입고 제품, 가격, 품질, 상표:',
        invoice.제품.재화,
        invoice.제품.가격,
        invoice.제품.품질,
        invoice.제품.상표
      )
    }

    this.제품입고(invoice.제품)
    this.매입.증가(invoice.발주회사, invoice.제품.가격, invoice.제품.수량)

    this.dept.smartlog(1, 'after invoice')
    this.dept.smartlog(2, `제품가격: ${this.제품가격()}`)
    this.dept.smartlog(2, '제품수량:', this.제품수량())

    assert(shed.제품가격() > 0, this.dept.name)
    assert(shed.제품수량() > 0, this.dept.name)
    assert(shed.제품품질() > 0, this.dept.name)
    assert(shed.제품상표() >= 0, this.dept.name)
  }

  /**
   * 해당 부서가 받은 주문을 처리한다.
   * 주문량이 내가 가지고 있는 양보다 많으면 가지고 있는 것까지만 처리한다.
   * 주문량이 내 처리 한계를 넘어가면 처리한계까지만 처리한다.
   *
   * 남은주문처리량은 여러 개의 주문이 왔을 때 처리한계를 넘지 않게 하기 위한 것이다.
   * 처음에 처리한계의 값으로 설정되고 주문을 처리하면서 자신이 주문한 만큼을 빼고 리턴한다.
   * 이렇게 안하고 this.처리량을 누적시키면서 this.처리량이 처리한계를 넘지 않게 하는 방법도 있다.
   *
   * @param order
   * @param 남은주문처리량
   * @returns
   */
  def 출고처리(order: 주문, 남은주문처리량: number)-> number => {
    val shed = this.findShed(order.재화명)
    assert.notEqual(shed, nil, order.재화명)
    if (shed == nil) return 남은주문처리량

    if (order.재화명 != shed.제품종류()) {
      this.dept.smartlog(2, '주문받은 제품을 위한 창고가 없습니다', shed.제품종류())
      return 남은주문처리량
    }

    assert(order.주문량 > 0, this.dept.name)
    this.dept.smartlog(2, '보유수량:', shed.제품수량())

    %%// 내가 주문을 처리할 수 있는 양은 다음과 같이 결정된다.
    %%// 1) 내가 가지고 있는 것 이상으로 보낼 순 없다.
    %%// 2) 내 처리한계보다 더 처리할 수도 없다.

    var 처리량 = order.주문량
    if (처리량 > shed.제품수량()) 처리량 = shed.제품수량()
    if (처리량 > 남은주문처리량) 처리량 = 남은주문처리량
    assert(처리량 >= 0, this.dept.name)

    this.dept.smartlog(2, '보낼수량:', 처리량)
    this.dept.smartlog(3, '창고의 제품수량', shed.제품수량())
    this.dept.smartlog(3, '남은 주문처리량', 남은주문처리량)

    %%// 내가 가지고 있는 것이 없거나 해서 보낼 것이 0인 경우에도
    %%// 그런 사실을 로그로 남기기 위해서 여기까지는 처리되어야 한다.
    if (처리량 <= 0) {
      return 남은주문처리량
    }

    %%// 해당 제품이 얼마로 들어왔던 나갈때는 현재 판매가격으로 나간다.
    val 출고가 = this.판매가격(order.재화명)
    this.dept.smartlog(2, '출고가격:', 출고가)
    assert.notEqual(처리량, 0, this.dept.name)
    assert.notEqual(출고가, 0, this.dept.name)

    %%// 창고에서 처리량만큼 제품을 꺼내고
    this.제품출고(order.재화명, 처리량)

    %%// 판매가격으로 수입을 계산한다.
    this.매출.증가(order.발주회사, 출고가, 처리량)

    %%// 적절한 처리를 해 준 다음 송장 발행
    this.dept.처리량 += 처리량 %%//todo 이것도 여기가 적절하지 않다.
    남은주문처리량 -= 처리량

    %%/*
    // 백화점 판매 부서의 출고처리는 소비자에게 판매하는 것인데 이것은 시장에 출시하는 것을 말한다.
    // 백화점 판매 부서는 출고 처리의 모든 부분을 다른 부서와 동일하게 처리하지만
    // 마지막 송장보내기 대신 출시를 하는 것이다.
    // 그런데 출시 처리를 어디서 하는가 하는 문제는 주의해야 할 점이 있다.
    // 이 함수를 오버라이딩하는 것(즉 판매부서에서 출고처리()를 오버라이딩하는 것)은
    // 시장 자체에 출고가 되지 않은 상태이기 때문에 판매 부서에 주문이 오지 않는 문제가 있다.
    // 그래서 판매 부서의 자체처리에서 출시 처리를 한다.
    */%%
    if (this.dept.회사().type == '소매' && this.dept.type == '판매') {
      return 남은주문처리량
    }

    %%// 주문을 요청한 곳에 물건을 보낸다.
    %%// 따라서 내가 from이 되고 요청한 곳이 to가 된다.
    %%// 물건을 받는 쪽 입장에서는 제품의 원가는 판매가격이다.
    val invoice: 송장 = {
      발주회사: this.dept.회사().name
      발주부서: this.dept.name
      제품: {
        재화: shed.제품종류()
        수량: 처리량
        가격: 출고가
        품질: shed.제품품질()
        상표: shed.제품상표()
      }
    }

    assert(invoice.제품.수량 > 0, this.dept.name)
    val msg = `from(${this.dept.name}) to(${order.발주부서}) amount(${invoice.제품.수량})`
    this.dept.smartlog(2, '송장발송:', msg)

    this.dept.sendInvoice(order.발주회사, order.발주부서, invoice)

    return 남은주문처리량
  }
}
