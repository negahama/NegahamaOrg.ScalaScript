%%
import assert from 'assert'

import { Dept } from './부서'
import { Rsrc } from './자원'
%%

/**
 *
 */
export def 채굴부서 extends Dept => {
  /**
   *
   */
  var 자원: Rsrc = new Rsrc('', '')

  /**
   * 부서가 취급하는 제품의 종류를 변경한다.
   * 공급처가 변경되면 자체처리에서 이 함수가 호출되면서
   * 자신이 취급하는 재화의 종류와 가격이 자동적으로 변경된다.
   * 품목의 변경이 제대로 이뤄지지 않으면 error code를 리턴한다.
   *
   * 채굴 부서는 취급재화가 자원에서 제공하는 재화로 고정되어져 있다.
   *
   * @param 품목
   */
  def 취급재화변경(품목: string)-> string | void => {
    if (this.자원 == nil || this.자원.재화 != 품목) {
      this.smartlog(0, '채굴부서는 자원과 연결되면 자동으로 취급재화가 결정됩니다')
      %%// 자원을 연결하기 전에 취급재화를 설정하려고 할 수 있기 때문에 에러없이 리턴해야 한다.
      return; %%// 'invalid function call'
    }

    val result = super.취급재화변경(품목)
    if (result) {
      console.log('취급재화변경 실패:', `error code: ${result}, 재화: ${품목}`)
      assert(false)
      return result
    }
  }

  /**
   * super.load()때 obj.제품.재화가 정의되어져 있으면 취급재화를 설정하려고 하지만
   * 설정되지 않으며 결국 여기서 설정된다.
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

    val rsrc = Rsrc.getRsrc(this.회사().자원)
    assert.notEqual(rsrc, nil, this.회사().자원)
    if (rsrc == nil) return;

    assert.notEqual(rsrc.매장량, nil, rsrc.이름)
    assert.notEqual(rsrc.품질, nil, rsrc.이름)
    assert.notEqual(rsrc.재화, nil, rsrc.이름)
    assert.notEqual(rsrc.재화, '', rsrc.이름)

    this.자원 = rsrc

    %%// 채굴부서는 자원과 연결되면 자동으로 취급재화가 결정된다
    this.취급재화변경(rsrc.재화)
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
   * @param prevState
   * @param currState
   */
  def onChangeState(prevState: string, currState: string)-> void => {
    currState match {
      case '자원고갈' => {
        this.보고하기('자원고갈')
        break
      }
    }
  }

  /**
   * 채굴부서는 입고 및 발주 처리가 필요하지 않다.
   * 채굴부서는 자체처리에서 자신의 처리한계만큼 생산하고 재고한계까지 생산한다.
   * 재고한계를 넘어가면 더이상 생산하지 않고 재고한계이하로 재고가 떨어질 때까지 대기한다.
   * 채굴부서의 처리량과 입고량은 자원을 채취하는 양으로 재정의되어야 한다.
   * 채굴시에는 자원의 매장량이 조금씩 줄어든다.
   */
  def 자체처리() => {
    this.smartlog(0, '채굴부서 자체처리')

    %%// 매장량이 0 이어도 지출될 비용은 지출된다
    this.비용.추가('고정비', Dept.getLogic().고정비산정(this))
    this.비용.추가('인건비', Dept.getLogic().인건비산정(this))
    this.비용.추가('교육비', Dept.getLogic().교육비산정(this))

    if (this.자원 == nil) {
      this.smartlog(1, '자원과 연결되어야 한다')
      this.changeState('자원연결필요')
      return;
    }

    if (this.자원.매장량 <= 0) {
      this.smartlog(1, '자원고갈')
      this.changeState('자원고갈')
      return;
    }

    var diff = this.재고한계() - this.제품총수량()
    if (diff > this.처리한계()) diff = this.처리한계()

    this.smartlog(1, 'diff:', diff)

    %%// 채굴부서는 제품을 들여올 때의 지출이 없다.
    %%// 이 금액은 이미 자원을 샀을때 지불되었기 때문이다.
    this.제품입고({
      재화: this.제품종류()
      수량: diff
      가격: this.판매가격()
      품질: this.자원.품질
      상표: 0
    })

    %%// 일반적인 부서의 경우 처리량은 출고 처리될 때 설정되는데
    %%// 채굴부서는 자원에서 채유, 채광하는 양(즉 입고량)으로 재설정되어야 한다.
    this.처리량 = diff

    this.자원.매장량 -= diff

    this.smartlog(1, `매장량: ${this.자원.매장량}`)
    this.smartlog(1, `제품가격: ${this.제품가격()}`)
    this.smartlog(1, '제품수량:', this.제품수량())

    assert(this.제품가격() > 0)
    assert(this.제품수량() > 0)
    assert(this.제품품질() > 0)

    this.숙련도증가(this.처리량)

    this.비용.추가('운영비', Dept.getLogic().운영비산정(this))
  }
}
