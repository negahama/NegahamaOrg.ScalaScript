%%
import assert from 'assert'

import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
import { Table } from './Table'
import { Firm } from './회사'
import { 회사이력 } from './회사이력'
import { 부서표시 } from './부서표시'
%%

/**
 *
 */
export def 회사표시 => {
  /**
   *
   * @param firmList
   * @returns
   */
  static def 회사목록(firmList: Firm[]) => {
    val tb = new Table()

    var 제품합계 = 0
    var 부서합계 = 0
    var 인원합계 = 0
    var 매출합계 = 0
    var 매입합계 = 0
    var 비용합계 = 0
    var 이익합계 = 0

    firmList.forEach(firm => {
      val 제품개수 = firm.getProductList().length
      val 부서개수 = firm.getDeptList().length
      var 회사인원 = 0
      firm.getDeptList().forEach(dept => {
        회사인원 += dept.운영.인원
      })

      tb.cellText('회사명', firm.name)
      tb.cellText('종류', firm.type)
      tb.cellText('기업명', firm.corpName)
      tb.cellText('사장', firm.boss)
      tb.cellText('상태', firm.state)
      tb.cellDecimal('제품', 제품개수)
      tb.cellDecimal('부서', 부서개수)
      tb.cellDecimal('인원', 회사인원)
      tb.cellDecimal('매출', firm.매출())
      tb.cellDecimal('매입', firm.매입())
      tb.cellDecimal('비용', firm.비용())
      tb.cellDecimal('이익', firm.이익())

      제품합계 += 제품개수
      부서합계 += 부서개수
      인원합계 += 회사인원
      매출합계 += firm.매출()
      매입합계 += firm.매입()
      비용합계 += firm.비용()
      이익합계 += firm.이익()
    })

    tb.cellText('회사명', '합계')
    tb.cellDecimal('제품', 제품합계)
    tb.cellDecimal('부서', 부서합계)
    tb.cellDecimal('인원', 인원합계)
    tb.cellDecimal('매출', 매출합계)
    tb.cellDecimal('매입', 매입합계)
    tb.cellDecimal('비용', 비용합계)
    tb.cellDecimal('이익', 이익합계)

    return tb.toString()
  }

  /**
   *
   * @param firm
   * @param from
   * @param to
   * @returns
   */
  static def 상세정보(firm: Firm, from: SimDate, to: SimDate) => {
    var r: string[] = []
    r.push('회사: ' .. firm.name)
    r.push('  - 종류: ' .. firm.type)
    r.push('  - 기업: ' .. firm.corpName)
    r.push('  - 사장: ' .. firm.boss)
    r.push('  - 상태: ' .. firm.state)
    r.push('')

    r = r.concat(this.알림정보(firm))
    r.push('')

    r = r.concat(this.제품정보(firm))
    r.push('')

    r = r.concat(this.재무정보(firm, from, to))
    r.push('')

    r.push(LogUtil.setBackColor('green', '부서별 상세정보'))
    r.push('')
    firm.getDeptList().forEach(dept => {
      r = r.concat(부서표시.상세정보(dept))
      r.push('')
      r = r.concat(부서표시.재무정보(dept, from, to))
      r.push('')
    })

    %%// r = r.concat(this.부서정보(firm))
    return r
  }

  /**
   *
   * @param firm
   */
  static def 알림정보(firm: Firm)-> string[] => {
    val r: string[] = []
    r.push(LogUtil.setBackColor('cyan', '알림'))

    val tb = new Table()
    firm.알림.forEach(n => {
      tb.cellDate('년/월/일', n.언제)
      tb.cellText('회사', n.회사)
      tb.cellText('부서', n.부서)
      tb.cellText('무엇', n.무엇)
      tb.cellText('상세', n.상세)
    })
    return r.concat(tb.toString())
  }

  /**
   *
   * @param firm
   * @returns
   */
  static def 제품정보(firm: Firm)-> string[] => {
    var r: string[] = []
    firm.getProductList().forEach(p => {
      r.push(LogUtil.setBackColor('yellow', '제품: ' + p))
      r.push('')

      firm
        .getDeptList()
        .filter(dept => dept.제품종류() == p)
        .forEach(dept => {
          r.push(dept.name)

          %%// 메인 창고를 가장 마지막에 표시해 준다.
          val sheds = dept.제품관리자.getShedList()
          val shedNo: number[] = []
          for (n <- 2 to sheds.length) {
            shedNo.push(n)
          }
          shedNo.push(1)

          val tb = new Table()
          shedNo.forEach(no => {
            val shed = sheds[no]
            tb.cellText('제품종류', shed.제품종류())
            tb.cellValue('입고량', shed.입고량)
            tb.cellValue('수량', shed.제품수량())
            tb.cellValue('가격', shed.제품가격())
            tb.cellValue('품질', shed.제품품질())
            tb.cellValue('상표', shed.제품상표())
            tb.cellValue('출고량', shed.출고량)
            tb.cellValue('판매가', shed.판매가)
          })

          r = r.concat(tb.toString())
          r.push('')
        })
    })
    return r
  }

  /**
   *
   * @param firm
   * @param from
   * @param to
   * @returns
   */
  static def 재무정보(firm: Firm, from: SimDate, to: SimDate)-> string[] => {
    assert(from.no <= to.no, `${from.no}, ${to.no}`)

    val r: string[] = []
    val firmHistory = 회사이력.getFirmHistory(firm.name)
    assert.notEqual(firmHistory, nil)
    if (firmHistory == nil) return r

    r.push(LogUtil.setBackColor('red', '재무정보'))

    val tb = new Table()
    회사이력.getSnapshotMonth2(firm.name, 2000, 1, to.년, to.월)?.forEach(shot => {
      val 월 = shot.month.toString().padStart(2, '0')
      tb.cellText('년/월/일', `${shot.year}/${월}`)
      tb.cellDecimal('매출', shot.재무.매출)
      tb.cellDecimal('매입', shot.재무.매입)
      tb.cellDecimal('비용', shot.재무.비용)
      tb.cellDecimal('이익', shot.재무.이익)
    })
    
    new SimDate(from).forEach(to, (date) => {
      val shot = firmHistory.getSnapshot(date)
      if (shot == nil) return;

      tb.cellDate('년/월/일', date)
      tb.cellDecimal('매출', shot.재무.매출)
      tb.cellDecimal('매입', shot.재무.매입)
      tb.cellDecimal('비용', shot.재무.비용)
      tb.cellDecimal('이익', shot.재무.이익)
    })
    return r.concat(tb.toString())
  }

  /**
   *
   * @param firm
   * @returns
   */
  static def 부서정보(firm: Firm) => {
    val deptList = firm.getDeptList()
    val r: string[] = []
    r.push(LogUtil.setBackColor('green', '부서별 요약정보'))
    return r.concat(부서표시.부서목록(deptList))
  }

  /**
   *
   * @param firmNames
   * @param from
   * @param to
   * @returns
   */
  static def 회사간자금비교(firmNames: string[], from: SimDate, to: SimDate) => {
    val r: string[] = []
    r.push('회사간 자금비교')

    val tb = new Table()
    tb.addColumnL('년/월/일')

    for (n <- 1 to firmNames.length) {
      tb.addColumnL('회사명')
      tb.addColumnR('매출')
      tb.addColumnR('매입')
      tb.addColumnR('비용')
      tb.addColumnR('이익')
    }

    new SimDate(from).forEach(to, date => {
      tb.cellDate(0, date)
      var cnt = 0

      firmNames.forEach(firmName => {
        val shot = 회사이력.getSnapshot(firmName, date)
        if (shot == nil) return;

        tb.cellText(cnt * 5 + 1, firmName)
        tb.cellDecimal(cnt * 5 + 2, shot.재무.매출)
        tb.cellDecimal(cnt * 5 + 3, shot.재무.매입)
        tb.cellDecimal(cnt * 5 + 4, shot.재무.비용)
        tb.cellDecimal(cnt * 5 + 5, shot.재무.이익)
        cnt += 1
      })
    })
    return r.concat(tb.toString())
  }
}
