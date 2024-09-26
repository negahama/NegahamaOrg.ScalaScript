%%
import assert from 'assert'

import { SimDate } from './SimDate'
import { Dept } from './부서'
import { Rsrc } from './자원'
%%

/**
 *
 */
export def 재배부서 extends Dept => {
  /**
   * 재배 부서는 자원의 종류를 검사하고 자원의 품질 항목만 사용한다.
   * 품질은 비옥도 항목으로 자원을 로드할때 품질로 변환된다.
   */
  var 자원: Rsrc = new Rsrc('', '')

  var 파종시작일 = new SimDate()
  var 파종종료일 = new SimDate()
  var 수확시작일 = new SimDate()
  var 수확종료일 = new SimDate()

  /**
   * 부서가 취급하는 제품의 종류를 변경한다.
   * 공급처가 변경되면 자체처리에서 이 함수가 호출되면서
   * 자신이 취급하는 재화의 종류와 가격이 자동적으로 변경된다.
   * 품목의 변경이 제대로 이뤄지지 않으면 error code를 리턴한다.
   *
   * 해당 부서가 재배부서이면 바뀐 품목에 맞게 파종시기와 수확시기를 새로 설정해 줘야 한다.
   *
   * @param 품목
   */
  def 취급재화변경(품목: string)-> string | void => {
    val result = super.취급재화변경(품목)
    if (result) {
      console.log('취급재화변경 실패:', `error code: ${result}, 재화: ${품목}`)
      assert(false)
      return result
    }

    assert.equal(this.취급재화.분류.includes('작물'), true, 품목)
    assert.equal(this.취급재화.분류.includes('농산물'), true, 품목)
    assert.notEqual(this.취급재화.파종시기, nil)
    assert.notEqual(this.취급재화.수확시기, nil)

    this.state = '휴경기간'

    val today = SimDate.getToday()

    this.파종시작일.월 = this.취급재화.파종시기.시작
    this.파종시작일.일 = 1

    this.파종종료일.set((new SimDate(this.파종시작일)).moveDay(this.취급재화.파종시기.기간))

    this.수확시작일.월 = this.취급재화.수확시기.시작
    this.수확시작일.일 = 1

    this.수확종료일.set((new SimDate(this.수확시작일)).moveDay(this.취급재화.수확시기.기간))

    %%// console.log('파종기간:', this.파종시작일, this.파종종료일)
    %%// console.log('수확기간:', this.수확시작일, this.수확종료일)
  }

  /**
   *
   * @param obj
   * @returns
   */
  def load(obj: any) => {
    super.load(obj)

    %%// 채굴, 육성, 재배 부서의 경우에는 공급처 대신 회사의 자원을 사용한다. 이를 실제 자원과 연결해 주어야 한다.
    %%// 자원의 연결은 취급 제품과 관련이 없다. 즉 농경지에 연결되어졌다고 해도 무엇을 재배할 것인지는 따로 정해야 한다.
    assert(obj.공급처 == nil || obj.공급처.length == 0, this.name)
    assert.notEqual(this.회사().자원, nil)
    assert.notEqual(this.회사().자원, '')

    %%// 재배 부서에 연결되는 자원은 농경지이다.
    %%// 재배 부서는 자원이 농경지인지를 검사하고 자원에서 품질 항목만을 사용한다.
    %%// 이때 목축지, 농경지 등은 재화의 종류가 설정되어져 있지 않으며 재화의 종류는 재배 부서 자체의 설정을 따른다
    %%// 이때 재배 부서에서 취급하는 재화인지를 검사하고 해당 재화에 파종시기, 수확시기 항목이 있는지도 검사한다.
    val rsrc = Rsrc.getRsrc(this.회사().자원)
    assert.notEqual(rsrc, nil, this.회사().자원)
    if (rsrc == nil) return;

    assert.equal(rsrc.종류, '농경지')
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
   * @param prevState
   * @param currState
   */
  def onChangeState(prevState: string, currState: string)-> void => {
    currState match {
      case '휴경기간' => {
        this.보고하기('휴경기간')
        this.smartlog(1, '휴경기간입니다')
        break
      }
      case '파종기간' => {
        this.보고하기('파종시작')
        this.smartlog(1, '파종을 시작하였습니다')
        break
      }
      case '재배기간' => {
        this.보고하기('파종완료')
        this.smartlog(1, '파종이 끝났습니다')
        break
      }
      case '수확기간' => {
        this.보고하기('수확중')
        this.smartlog(1, '수확중')
        break
      }
    }
  }

  /**
   * 재배 부서의 입고, 출고는 부서와 동일하다. 그리고 발주 처리는 필요하지 않다.
   * 재배 부서는 자체처리에서 자신의 처리한계만큼 생산하고 재고한계까지 생산한다.
   * 재고한계를 넘어가면 더이상 생산하지 않고 재고한계이하로 재고가 떨어질 때까지 대기한다.
   * 재배 부서의 처리량과 입고량은 자원을 채취하는 양으로 재정의되어야 한다.
   */
  def 자체처리() => {
    this.smartlog(0, '재배부서 자체처리')

    %%// 매장량이 0 이어도 지출될 비용은 지출된다
    this.비용.추가('고정비', Dept.getLogic().고정비산정(this))
    this.비용.추가('인건비', Dept.getLogic().인건비산정(this))
    this.비용.추가('교육비', Dept.getLogic().교육비산정(this))

    val today = SimDate.getToday()

    val compareDate = (date1: SimDate, date2: SimDate)-> boolean => {
      return date1.월 == date2.월 && date1.일 == date2.일
    }

    if (this.state == '휴경기간' && compareDate(this.파종시작일, today)) {
      this.changeState('파종기간')
    }
    if (this.state == '파종기간' && compareDate(this.파종종료일, today)) {
      this.changeState('재배기간')
    }
    if (this.state == '재배기간' && compareDate(this.수확시작일, today)) {
      this.changeState('수확기간')
    }
    if (this.state == '수확기간' && compareDate(this.수확종료일, today)) {
      this.changeState('휴경기간')
    }

    if (this.state == '수확기간') {
      var diff = this.재고한계() - this.제품총수량()
      if (diff > this.처리한계()) diff = this.처리한계()

      this.smartlog(1, 'diff:', diff)

      %%// 수확한 작물은 매입 비용으로 잡을 만한 것이 없다.
      this.제품입고({
        재화: this.제품종류()
        수량: diff
        가격: this.판매가격()
        품질: this.자원.품질
        상표: 0
      })

      %%// 일반적인 부서의 경우 처리량은 출고 처리될 때 설정되는데
      %%// 재배 부서는?
      this.처리량 = diff

      this.smartlog(1, `제품가격: ${this.제품가격()}`)
      this.smartlog(1, '제품수량:', this.제품수량())

      assert(this.제품가격() > 0)
      assert(this.제품수량() > 0)
      assert(this.제품품질() > 0)

      this.숙련도증가(this.처리량)

      this.비용.추가('운영비', Dept.getLogic().운영비산정(this))
    }
  }
}
