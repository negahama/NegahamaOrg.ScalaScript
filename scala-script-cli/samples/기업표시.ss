%%
import assert from 'assert'

import { MathUtil } from './MathUtil'
import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
import { Table } from './Table'
import { Engine } from './Engine'
import { Corp } from './기업'
import { Firm } from './회사'
import { 알림 } from './회사'
import { 기업이력 } from './기업이력'
import { 회사이력 } from './회사이력'
%%

// def Engine => {
//   var forwardProcessOrder: string[]
// }

/**
 *
 */
export def 기업표시 => {
  /**
   *
   * @param corpList
   * @returns
   */
  static def 기업목록(corpList: Corp[]) => {
    val tb = new Table()

    %%// 회사 종류별로 갯수와 합계를 저장
    %%// 갯수는 매 기업마다 리셋되지만 합계는 리셋되지 않는다.
    val firmCount: {
      var 종류: string
      var 갯수: number
      var 합계: number
    }[] = []

    Engine.forwardProcessOrder.forEach(firmType => {
      firmCount.push({
        종류: firmType
        갯수: 0
        합계: 0
      })
    })

    var 회사합계 = 0
    var 상품합계 = 0
    var 현금합계 = 0
    var 매출합계 = 0
    var 매입합계 = 0
    var 비용합계 = 0
    var 이익합계 = 0

    corpList.forEach((corp: Corp) => {
      val firmList = corp.getFirmsList()
      val prodList = corp.getProductList()

      firmCount.forEach(kind => {
        kind.갯수 = 0
      })

      firmList.forEach((firm: Firm) => {
        firmCount.forEach(kind => {
          if (kind.종류 == firm.type) {
            kind.갯수 += 1
            kind.합계 += 1
          }
        })
      })

      val 회사개수 = firmList.length
      val 상품개수 = prodList.length

      tb.cellText('기업명', corp.name)
      tb.cellText('회장', corp.ceo)
      tb.cellText('상태', corp.state)
      tb.cellDecimal('회사', 회사개수)
      firmCount.forEach(k => {
        tb.cellValue(k.종류, k.갯수)
      })
      tb.cellDecimal('상품', 상품개수)
      tb.cellDecimal('기술', corp.보유기술.length)
      tb.cellDecimal('현금', corp.cash)
      tb.cellDecimal('매출', corp.매출())
      tb.cellDecimal('매입', corp.매입())
      tb.cellDecimal('비용', corp.비용())
      tb.cellDecimal('이익', corp.이익())
      tb.cellDecimal('자산가치', corp.자산가치())

      회사합계 += 회사개수
      상품합계 += 상품개수
      현금합계 += MathUtil.round(corp.cash)
      매출합계 += MathUtil.round(corp.매출())
      매입합계 += MathUtil.round(corp.매입())
      비용합계 += MathUtil.round(corp.비용())
      이익합계 += MathUtil.round(corp.이익())
    })

    tb.cellText('기업명', '합계')
    tb.cellDecimal('회사', 회사합계)
    firmCount.forEach(k => {
      tb.cellValue(k.종류, k.합계)
    })
    tb.cellDecimal('상품', 상품합계)
    tb.cellDecimal('현금', 현금합계)
    tb.cellDecimal('매출', 매출합계)
    tb.cellDecimal('매입', 매입합계)
    tb.cellDecimal('비용', 비용합계)
    tb.cellDecimal('이익', 이익합계)
    return tb.toString()
  }

  /**
   * 기업의 재무 정보를 포함해서 기업에 소속된 모든 사업체의 정보를 표시한다.
   *
   * @param corp
   * @param from
   * @param to
   * @returns
   */
  static def 상세정보(corp: Corp, from: SimDate, to: SimDate) => {
    var r: string[] = []
    r.push('기업명: ' .. corp.name)

    r.push('  - 로고: ' .. corp.logo)
    r.push('  - 회장: ' .. corp.ceo)
    r.push('  - 상태: ' .. corp.state)
    r.push('  - 보유기술: ' .. corp.보유기술.length .. '개')
    corp.보유기술.forEach(tech => {
      r.push(`    * ${tech.이름}: ${tech.수준}`)
    })

    %%// 사업체 종류별로 개수와 이름들 표시
    val firmListByKind: {
      var kind: string
      var count: number
      var firms: string[]
    }[] = []

    var total = 0
    Engine.forwardProcessOrder.forEach(kind => {
      val firms = corp.getFirmsList(kind)
      val firmNames: string[] = []
      firms.forEach(f => {
        firmNames.push(f.name)
      })

      total += firms.length
      firmListByKind.push({
        kind: kind
        count: firms.length
        firms: firmNames
      })
    })

    r.push('  - 사업체: ' .. total .. '개')
    firmListByKind.forEach(e => {
      if (e.count == 0) return;
      r.push('    * ' .. e.kind .. ': ' .. e.count .. '개 (' .. e.firms .. ')')
    })

    %%// 상품 목록 표시
    val prodNames = corp.getProductList()
    var prodInfo = prodNames.length .. '개'
    if (prodNames.length != 0) prodInfo += ' (' .. prodNames.toString() .. ')'

    r.push('  - 상품들: ' .. prodInfo)

    r.push('  - 현금: ' .. LogUtil.formatMoney(corp.cash))
    r.push('  - 매출: ' .. LogUtil.formatMoney(corp.매출()))
    r.push('  - 매입: ' .. LogUtil.formatMoney(corp.매입()))
    r.push('  - 비용: ' .. LogUtil.formatMoney(corp.비용()))
    r.push('  - 이익: ' .. LogUtil.formatMoney(corp.이익()))
    r.push('')

    r = r.concat(this.알림정보(corp))
    r.push('')

    r = r.concat(this.제품정보(corp))
    r.push('')

    r = r.concat(this.재무정보(corp, from, to))
    r.push('')

    r = r.concat(this.사업체별이익변화(corp, from, to))
    r.push('')

    %%// val firms = corp.getFirmsList()
    %%// r.push(util.setBackColor('green', '사업체별 요약정보') + ' : ' + firms.length + '개')
    %%// r = r.concat(회사표시.회사목록(firms))
    return r
  }

  /**
   *
   * @param corp
   */
  static def 알림정보(corp: Corp) => {
    val r: string[] = []
    r.push(LogUtil.setBackColor('cyan', '알림'))

    val tb = new Table()
    val noti: 알림[] = []
    corp.getFirmsList().forEach(firm => {
      firm.알림.forEach(n => {
        noti.push(n)
      })
    })

    val sorted = noti.sort((a, b) => { return a.언제.no - b.언제.no })
    sorted.forEach((n: 알림) => {
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
   * @param corp
   */
  static def 제품정보(corp: Corp) => {
    val r: string[] = []
    r.push(LogUtil.setBackColor('yellow', '제품'))

    val tb = new Table()
    corp.getFirmsList().forEach(firm => {
      firm
        .getDeptList()
        .filter(dept => dept.type == '판매')
        .forEach(dept => {
          if (dept.제품종류() == '') return;
          tb.cellText('재화', dept.제품종류())
          tb.cellText('판매회사', dept.회사().name)
          tb.cellText('판매부서', dept.name)
          tb.cellValue('수량', dept.제품수량())
          tb.cellValue('가격', dept.제품가격())
          tb.cellValue('품질', dept.제품품질())
          tb.cellValue('상표', dept.제품상표())
        })
    })
    return r.concat(tb.toString())
  }

  /**
   * 기업의 재무 정보를 표시한다.
   * from 에서 to 까지(일반적으로 to는 현재로 설정된다) 월별, 일별 재무 정보를 표시하는데
   * 월별 이력은 처음 시작부터 to 까지, 일별 이력은 from 에서 to 까지 표시해 준다.
   * to.월에 해당하는 월별 이력이 없으면 해당 월의 합계까지 표시해 준다.
   *
   * @param corp
   * @param from
   * @param to
   * @returns
   */
  static def 재무정보(corp: Corp, from: SimDate, to: SimDate) => {
    assert(from.no <= to.no, `${from.no}, ${to.no}`)

    val r: string[] = []
    r.push(LogUtil.setBackColor('red', '재무정보'))

    val tb = new Table()
    기업이력.getSnapshotMonth2(corp.name, 2000, 1, to.년, to.월).forEach(shot => {
      val 월 = shot.month.toString().padStart(2, '0')
      tb.cellText('년/월/일', `${shot.year}/${월}`)
      tb.cellText('현금', '', false)
      tb.cellDecimal('매출', shot.재무.매출)
      tb.cellDecimal('매입', shot.재무.매입)
      tb.cellDecimal('비용', shot.재무.비용)
      tb.cellDecimal('이익', shot.재무.이익)
    })
    기업이력.getSnapshot(corp.name, from, to).forEach(shot => {
      tb.cellDate('년/월/일', shot.date)
      tb.cellDecimal('현금', shot.cash)
      tb.cellDecimal('매출', shot.재무.매출)
      tb.cellDecimal('매입', shot.재무.매입)
      tb.cellDecimal('비용', shot.재무.비용)
      tb.cellDecimal('이익', shot.재무.이익)
    })
    return r.concat(tb.toString())
  }

  /**
   *
   * @param corp
   * @param from
   * @param to
   * @returns
   */
  static def 사업체별이익변화(corp: Corp, from: SimDate, to: SimDate) => {
    assert(from.no <= to.no, `${from.no}, ${to.no}`)
    assert.notEqual(corp, nil)

    val r: string[] = []
    r.push(LogUtil.setBackColor('blue', '사업체별 이익변화'))

    val tb = new Table()
    val firms = corp.getFirmsList()
    기업이력.getSnapshot(corp.name, from, to).forEach(shot => {
      tb.cellDate('년/월/일', shot.date)
      tb.cellDecimal('현금', shot.cash)
      tb.cellDecimal('이익', shot.재무.이익)

      firms.forEach(firm => {
        val firmShot = 회사이력.getSnapshot(firm.name, shot.date)
        %%// from ~ to 사이에 생성된 기업은 이력이 없을 수도 있다.
        %%// assert.notEqual(firmShot, nil)
        // 아래 if 문에서 중괄호를 사용하지 않으면 삼항연산자로 처리되어져 앞의 함수와 연결되어
        // 회사이력.getSnapshot(firm.name, shot.date)(firmShot != undefined).. 와 같이 처리되므로 주의..  
        if (firmShot != nil)
        then { tb.cellDecimal(firm.name, firmShot.재무.이익) }
        else { tb.cellText(firm.name, '', false) }
      })
    })
    return r.concat(tb.toString())
  }
}
