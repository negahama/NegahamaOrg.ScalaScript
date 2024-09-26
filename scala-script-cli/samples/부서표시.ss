%%
import assert from 'assert'

import { MathUtil } from './MathUtil'
import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
import { Table } from './Table'
import { Firm } from './회사'
import { Dept, 연결정보 } from './부서'
import { 부서이력, 회사이력 } from './회사이력'
import { util } from './util'
%%

/**
 *
 */
export def 부서표시 => {
  /**
   *
   * @param deptList
   * @returns
   */
  static def 부서목록(deptList: Dept[]) => {
    val tb = new Table()

    var 인원합계 = 0
    var 매출합계 = 0
    var 매입합계 = 0
    var 수입합계 = 0
    var 비용합계 = 0
    var 이익합계 = 0

    deptList.forEach(dept => {
      var idx = 0
      tb.cellText('부서명', dept.name)
      tb.cellText('종류', dept.type)
      tb.cellText('제품', dept.제품종류())
      tb.cellDecimal('인원', dept.운영.인원)
      tb.cellDecimal('lv', dept.운영.레벨)
      tb.cellDecimal('숙련', dept.운영.숙련도)
      tb.cellValue('판매가', dept.판매가격())
      tb.cellText('단위', dept.취급재화.최소단위)
      tb.cellText('(재고/한계)', util.재고정보표시(dept.제품수량(), dept.재고한계()))
      tb.cellText('{처리/한계}', util.처리정보표시(dept.처리량, dept.처리한계()))
      tb.cellDecimal('출고', dept.총출고량())
      tb.cellDecimal('입고', dept.총입고량())

      val 매출 = MathUtil.round(dept.매출().금액())
      val 매입 = MathUtil.round(dept.매입().금액())
      val 수입 = MathUtil.round(매출 - 매입)

      tb.cellDecimal('매출', 매출)
      tb.cellDecimal('매입', 매입)
      tb.cellDecimal('수입', 수입)
      tb.cellDecimal('비용', dept.비용.합계())
      var line = '('
      line += LogUtil.formatDecimal(dept.비용.합계('고정비'), 3) .. '+'
      line += LogUtil.formatDecimal(dept.비용.합계('인건비'), 3) .. '+'
      line += LogUtil.formatDecimal(dept.비용.합계('운영비'), 3) .. '+'
      line += LogUtil.formatDecimal(dept.비용.합계('교육비'), 3) .. ')'
      tb.cellText('( 고+ 인+ 운+ 교)', line)
      tb.cellDecimal('이익', dept.이익())

      인원합계 += dept.운영.인원
      매출합계 += 매출
      매입합계 += 매입
      수입합계 += 수입
      비용합계 += dept.비용.합계()
      이익합계 += dept.이익()
    })
    tb.cellText('부서명', '합계')
    tb.cellDecimal('인원', 인원합계)
    tb.cellDecimal('매출', 매출합계)
    tb.cellDecimal('매입', 매입합계)
    tb.cellDecimal('수입', 수입합계)
    tb.cellDecimal('비용', 비용합계)
    tb.cellDecimal('이익', 이익합계)
    return tb.toString()
  }

  /**
   *
   * @param dept
   * @returns
   */
  static def 상세정보(dept: Dept) => {
    val r: string[] = []
    r.push(`부서: ${dept.name}(${dept.type})`)
    r.push(
      '  - 제품: ' ..
        util.제품정보표시({
          재화: dept.제품종류()
          수량: dept.제품수량()
          가격: dept.제품가격()
          품질: dept.제품품질()
          상표: dept.제품상표()
        })
    )
    r.push('  - 운영: ' .. JSON.stringify(dept.운영))
    r.push('  - 공급처: ')

    val suppliers = dept.getValidSupplier()
    suppliers.forEach((supplier: 연결정보) => {
      val other = Firm.getDept(supplier.회사, supplier.부서)
      assert.notEqual(other, nil)

      r.push(
        `    * ${supplier.회사}'s ${supplier.부서} => ` ..
          util.제품정보표시({
            재화: other!.제품종류()
            수량: other!.제품수량()
            가격: other!.제품가격()
            품질: other!.제품품질()
            상표: other!.제품상표()
          })
      )
    })
    r.push('  - 주문: ' .. JSON.stringify(dept.주문))
    r.push('  - 송장: ' .. JSON.stringify(dept.송장))
    r.push('  - 매출: ' .. JSON.stringify(dept.매출()))
    r.push('  - 매입: ' .. JSON.stringify(dept.매입()))
    r.push('  - 비용: ' .. dept.비용.합계())
    r.push('    * 고정비용: ' .. dept.비용.합계('고정비'))
    r.push('    * 임금비용: ' .. dept.비용.합계('인건비'))
    r.push('    * 운영비용: ' .. dept.비용.합계('운영비'))
    r.push('    * 교육비용: ' .. dept.비용.합계('교육비'))
    r.push('  - 이익: ' .. dept.이익())
    r.push('  - 판매가: ' .. dept.판매가격() .. ' / ' .. dept.취급재화.최소단위)
    r.push('  - 가동률: ' .. dept.가동률() * 100)
    r.push('  - 처리량: ' .. dept.처리량)
    r.push('  - 처리한계: ' .. dept.처리한계())
    r.push('  - 재고용량: ' .. dept.재고용량)
    r.push('  - 재고한계: ' .. dept.재고한계())
    return r
  }

  /**
   *
   * @param firmName
   * @param deptName
   * @param from
   * @param to
   * @returns
   */
  static def 재무정보(dept: Dept, from: SimDate, to: SimDate) => {
    assert(from.no <= to.no, `${from.no}, ${to.no}`)

    val firmName = dept.회사().name
    val deptName = dept.name

    val r: string[] = []
    val firmHistory = 회사이력.getFirmHistory(firmName)
    assert.notEqual(firmHistory, nil)

    r.push('부서<' .. LogUtil.setBackColor('green', deptName) .. '>의 재무정보')

    var 누적비용정보 = firmHistory!.누적비용(from, deptName)
    var 누적매출 = 누적비용정보.누적매출
    var 누적매입 = 누적비용정보.누적매입
    var 누적비용 = 누적비용정보.누적비용
    var 누적이익 = 누적비용정보.누적이익

    val watchList: 연결정보[] = []
    watchList.push({
      회사: firmName
      부서: deptName
    })

    %%// 좀더 깔끔하게 표시하기 위해서 cell title 대신 index를 사용한다.
    val tb = new Table()
    tb.addColumnL('년/월/일')
    tb.addColumnR('매입')
    tb.addColumnL('[L)가격*수량]')
    tb.addColumnR('누적')
    tb.addColumnR('비용')
    tb.addColumnL('( 고+ 인+ 운+ 교)')
    tb.addColumnR('누적비용')
    tb.addColumnR('매출')
    tb.addColumnL('[L)가격*수량,(처리/한계)]')
    tb.addColumnR('누적매출')
    tb.addColumnR('이익')
    tb.addColumnR('누적이익')

    this.processHistory(watchList, from, to, tb, (dept, shot, tb) => {
      if (shot == nil) {
        for (col <- 1 until 12) tb.cellText(col, '')
        return;
      }

      val 매입 = shot.매입.금액()
      val 매출 = shot.매출.금액()
      val 비용 = shot.비용.합계()
      val 이익 = 매출 - 매입 - 비용

      누적매입 += 매입
      누적매출 += 매출
      누적비용 += 비용
      누적이익 = 누적매출 - 누적매입 - 누적비용

      %%// 지출이 어떻게 발생한 것인지를 알기 위해서 지출 내역이 있다.
      %%// 내역이 여러 개가 있으면 몇 개의 지출이 있었다는 것을 알려주고 평균을 구해서 사용한다.
      var cnt = 0
      var sum = 0
      shot.매입.내역.forEach(e => {
        sum += e.수량 * e.가격
        cnt += e.수량
      })
      val 입고개수 = shot.매입.내역.length
      val 입고가격 = sum / cnt
      val 입고수량 = cnt

      cnt = 0
      sum = 0
      shot.매출.내역.forEach(e => {
        sum += e.수량 * e.가격
        cnt += e.수량
      })
      val 출고개수 = shot.매출.내역.length
      val 출고가격 = sum / cnt
      val 출고수량 = cnt

      val 처리량_ = LogUtil.format(shot.처리량, 4)
      val 처리한계_ = LogUtil.format(shot.처리한계, 4)

      val 입고개수_ = LogUtil.format(입고개수, 1)
      val 입고가격_ = LogUtil.format(입고가격, 4)
      val 입고수량_ = LogUtil.format(입고수량, 4)

      val 출고개수_ = LogUtil.format(출고개수, 1)
      val 출고가격_ = LogUtil.format(출고가격, 4)
      val 출고수량_ = LogUtil.format(출고수량, 4)

      var col = 0
      tb.cellDecimal(col + 1, 매입)
      tb.cellText(col + 2, `[${입고개수_})${입고가격_}*${입고수량_}]`)
      tb.cellDecimal(col + 3, 누적매입)
      tb.cellDecimal(col + 4, 비용)
      var line = '('
      line += LogUtil.formatDecimal(shot.비용.고정비, 3) .. '+'
      line += LogUtil.formatDecimal(shot.비용.인건비, 3) .. '+'
      line += LogUtil.formatDecimal(shot.비용.운영비, 3) .. '+'
      line += LogUtil.formatDecimal(shot.비용.교육비, 3) .. ')'
      tb.cellText(col + 5, line)
      tb.cellDecimal(col + 6, 누적비용)
      tb.cellDecimal(col + 7, 매출)
      tb.cellText(col + 8, `[${출고개수_})${출고가격_}*${출고수량_},(${처리량_}/${처리한계_})]`)
      tb.cellDecimal(col + 9, 누적매출)
      tb.cellDecimal(col +10, 이익)
      tb.cellDecimal(col +11, 누적이익)
    })

    return r.concat(tb.toString())
  }

  /**
   *
   * @param watchList
   * @param from
   * @param to
   * @param callback
   * @returns
   */
  static def processHistory(
    watchList: 연결정보[],
    from: SimDate,
    to: SimDate,
    tb: Table,
    callback: (dept: Dept | nil, shot: 부서이력 | nil, tb: Table, idx: number)-> void
  ) => {
    new SimDate(from).forEach(to, (date: SimDate) => {
      tb.cellDate('년/월/일', date)

      var idx = 0
      watchList.forEach((e: 연결정보) => {
        %%// 회사나 부서가 from 이후에 생성되어진 경우에는 이력이 없을 수도 있다.
        %%// 여기서 dept, shot등이 undefined라고 해도 callback이 호출되어 빈 값이라도 cell에 기록을 남겨야 한다.
        %%// 그렇지 않으면 날짜와 내용이 맞지 않게 되기 때문이다.
        val firm = Firm.getFirm(e.회사)
        val dept = firm?.getDept(e.부서)

        var shot: 부서이력 | nil
        val firmShot = 회사이력.getSnapshot(e.회사, date)
        if (firmShot != nil) {
          shot = firmShot.부서이력.find(n => n.dept == e.부서)
        }

        callback(dept, shot, tb, idx)
        idx += 1
      })
    })
  }

  /**
   *
   * @param watchList
   * @param from
   * @param to
   */
  static def 부서간비교_재화(watchList: 연결정보[], from: SimDate, to: SimDate) => {
    val r: string[] = []
    r.push('부서별 재화의 흐름')

    val tb = new Table()
    tb.addColumnL('년/월/일')
    for (n <- 0 until watchList.length) {
      tb.addColumnR('부서:-출고+입고>(재고/재고한){처리/처리한}>발주<수주')
    }

    %%// 날짜별로 watchList의 모든 부서의 정보를 모은다.
    %%// 부서별 정보는 재화의 흐름과 자금의 흐름 두가지 정보이다.
    %%// 각각의 정보는 r1, r2에 저장된다.
    this.processHistory(watchList, from, to, tb, (dept, shot, tb, idx) => {
      if (dept == nil || shot == nil) {
        tb.cellText(idx + 1, '')
        return;
      }

      %%// 재화의 수량을 모니터링하는 경우
      val 총출고량 = LogUtil.format(shot.총출고량, 4)
      val 총입고량 = LogUtil.format(shot.총입고량, 4)
      val 발주총량 = LogUtil.format(shot.발주총량, 4)
      val 수주총량 = LogUtil.format(shot.수주총량, 4)

      val 재고정보 = util.재고정보표시(shot.재고수량, shot.재고한계)
      val 처리정보 = util.처리정보표시(shot.처리량, shot.처리한계)

      var text = `${dept.name}:-${총출고량}+${총입고량}>${재고정보}${처리정보}>${발주총량}<${수주총량}`
      tb.cellText(idx + 1, text)
    })
    return r.concat(tb.toString())
  }

  /**
   *
   * @param watchList
   * @param from
   * @param to
   */
  static def 부서간비교_자금(watchList: 연결정보[], from: SimDate, to: SimDate) => {
    val r: string[] = []
    r.push('부서별 자금의 흐름')

    val tb = new Table()
    tb.addColumnL('년/월/일')
    for (n <- 0 until watchList.length) {
      tb.addColumnR('부서:(재고)[-매입>-비용>+매출>이익]')
    }

    this.processHistory(watchList, from, to, tb, (dept, shot, tb, idx) => {
      if (dept == nil || shot == nil) {
        tb.cellText(idx + 1, '')
        return;
      }

      val 재고정보 = util.재고정보표시(shot.재고수량, shot.재고한계)

      %%// 비용을 모니터링하는 경우
      val 매출 = LogUtil.formatDecimal(shot.매출.금액(), 6)
      val 매입 = LogUtil.formatDecimal(shot.매입.금액(), 6)
      val 비용 = LogUtil.formatDecimal(shot.비용.합계(), 6)
      val 이익 = LogUtil.formatDecimal(shot.매출.금액() - shot.매입.금액() - shot.비용.합계(), 7)

      tb.cellText(idx + 1, `${dept.name}:${재고정보}[-${매입}>-${비용}>+${매출}>${이익}]`)
    })
    return r.concat(tb.toString())
  }

  /**
   *
   * @param watchList
   * @param from
   * @param to
   */
  static def 부서간비교_간략(watchList: 연결정보[], from: SimDate, to: SimDate) => {
    val r: string[] = []
    r.push('부서별 재화의 흐름')

    val tb = new Table()
    tb.addColumnL('년/월/일')
    watchList.forEach(e => {
      tb.addColumnL('부서명')
      tb.addColumnL('재고', 5, true)
      tb.addColumnL('처리', 5, true)
      tb.addColumnR('이익')
    })

    this.processHistory(watchList, from, to, tb, (dept, shot, tb, idx) => {
      if (dept == nil || shot == nil) {
        tb.cellText(idx * 4 + 1, '')
        tb.cellText(idx * 4 + 2, '', false)
        tb.cellText(idx * 4 + 3, '', false)
        tb.cellText(idx * 4 + 4, '', false)
        return;
      }

      val 재고비율 = LogUtil.colorBar(0, shot.재고한계, shot.재고수량)
      val 처리비율 = LogUtil.colorBar(0, shot.처리한계, shot.처리량)
      val profit = shot.매출.금액() - shot.매입.금액() - shot.비용.합계()
      var 이익 = LogUtil.formatMoney(profit).padStart(5)
      %%// if (profit < 0) {
      %%//   이익 = LogUtil.setTextColor('red', 이익)
      %%// } else 이익 = LogUtil.setTextColor('green', 이익)

      tb.cellText(idx * 4 + 1, dept.name)
      tb.cellText(idx * 4 + 2, 재고비율)
      tb.cellText(idx * 4 + 3, 처리비율)
      tb.cellText(idx * 4 + 4, 이익)
    })
    return r.concat(tb.toString())
  }
}
