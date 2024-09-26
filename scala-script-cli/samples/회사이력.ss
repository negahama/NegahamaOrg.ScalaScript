%%
import assert from 'assert'

import { MathUtil } from './MathUtil'
import { SimDate } from './SimDate'
import { Firm } from './회사'
import { Dept } from './부서'
import { 입출내역, 재무정보 } from './설정'
%%

/**
 *
 */
def 비용항목 => {
  var 고정비: number = 0
  var 인건비: number = 0
  var 운영비: number = 0
  var 교육비: number = 0

  def 합계() => {
    return this.고정비 + this.인건비 + this.운영비 + this.교육비
  }
}

/**
 * 부서이력의 이력
 *
 * 처음에는 부서에서 history를 가지고 있었으나
 * history와 관련 메서드들이 합쳐 부서이력이라는 개체로 묶음
 * 하지만 이때에도 부서이력 개체 자체가 부서에 포함되어져 있었다. 그러다가
 * 부서와 이력을 분리하기 위해서 부서이력 개체를 회사이력 개체로 이동하였다.
 */
export def 부서이력 => {
  var dept: string
  var date: SimDate

  %%// 처리량 관련
  var 처리량: number
  var 처리한계: number
  var 재고수량: number
  var 재고한계: number

  %%// 주문량 관련
  var 총입고량: number
  var 총출고량: number
  var 발주총량: number
  var 수주총량: number

  %%// 비용 관련
  var 매입: 입출내역
  var 매출: 입출내역
  var 비용: 비용항목
}

/**
 *
 */
def 회사일별이력 => {
  var date: SimDate
  var 재무: 재무정보
  var 부서이력: 부서이력[]
}

/**
 *
 */
def 회사월별이력 => {
  var year: number
  var month: number
  var 재무: 재무정보
}

/**
 *
 */
def 회사연별이력 => {
  var year: number
  var 재무: 재무정보
}

/**
 *
 */
export def 회사이력 => {
  /**
   *
   */
  private var firm: Firm
  def constructor(firm: Firm) => {
    this.firm = firm
  }

  %%// 마지막으로 이력을 남긴 날짜를 저장한다.
  %%// 이 정보를 바탕으로 월별, 년별 이력을 갱신한다.
  var lastHistoryDate = new SimDate()

  /**
   * 일별이력은 30개까지만 유지한다.
   */
  private var 일별이력: 회사일별이력[] = []

  /**
   * 월별이력은 12개까지만 유지하며 부서이력은 포함하지 않는다.
   */
  private var 월별이력: 회사월별이력[] = []

  /**
   * 연별이력은 10개까지만 유지한다.
   */
  private var 연별이력: 회사연별이력[] = []

  /**
   *
   * @param date
   * @returns
   */
  def getSnapshot(date: SimDate) => {
    return this.일별이력.find(e => e.date.isEqual(date))
  }

  /**
   *
   * @param year
   * @param month
   * @returns
   */
  def getSnapshotMonth(year: number, month: number)-> 회사월별이력 | nil => {
    return this.월별이력.find(e => e.year == year && e.month == month)
  }

  /**
   *
   * @param year
   * @returns
   */
  def getSnapshotYear(year: number) => {
    return this.연별이력.find(e => e.year == year)
  }

  /**
   * 일별 이력을 추가할때 월별, 년별 이력도 같이 조정된다.
   * 월이 바뀔때 이전 달의 이력이 새로 추가되는 것이 아니라 이번 달의 새로운 빈 이력이 추가된다.
   * 즉 매번 일별 이력이 월별 이력의 내용을 업데이트하는 방식인데 이 방식은 이번 달의 누적 정보를 구할때 편리하다.
   *
   * @param date
   */
  def snapshot(date: SimDate) => {
    val deptHistory = 회사이력.getDeptSnapshot(date, this.firm.getDeptList())

    this.일별이력.push({
      date: new SimDate(date)
      재무: {
        매출: this.firm.매출()
        매입: this.firm.매입()
        비용: this.firm.비용()
        이익: this.firm.이익()
      }
      부서이력: deptHistory
    })

    val month = this.getSnapshotMonth(date.년, date.월)
    if (month == nil) {
      this.월별이력.push({
        year: date.년
        month: date.월
        재무: {
          매출: this.firm.매출()
          매입: this.firm.매입()
          비용: this.firm.비용()
          이익: this.firm.이익()
        }
      })
    } else {
      month.재무.매출 += this.firm.매출()
      month.재무.매입 += this.firm.매입()
      month.재무.비용 += this.firm.비용()
      month.재무.이익 += this.firm.이익()
      month.재무.매출 = MathUtil.round(month.재무.매출)
      month.재무.매입 = MathUtil.round(month.재무.매입)
      month.재무.비용 = MathUtil.round(month.재무.비용)
      month.재무.이익 = MathUtil.round(month.재무.이익)
    }

    %%// 일별이력은 35개만 유지한다.
    if (this.일별이력.length > 35) this.일별이력.shift()

    if (this.lastHistoryDate.년 != date.년) {
    }

    %%// 월이 바뀌면 이전 달의 내용을 종합하고 월별이력에 추가한다.
    if (this.lastHistoryDate.월 != date.월) {
      var lastYear = date.년
      var lastMonth = date.월 - 1
      if (lastMonth == 0) {
        lastYear = lastYear - 1
        lastMonth = 12
      }
      assert(lastMonth >= 1)
      assert(lastMonth <= 12)

      val list = this.일별이력.filter(h => h.date.월 == lastMonth)
      %%// 설립된지 30일이 안되는 회사가 있을 수 있다.
      %%// assert.equal(list.length, 30)

      var 매출 = 0
      var 매입 = 0
      var 비용 = 0
      var 이익 = 0

      list.forEach(h => {
        매출 += h.재무.매출
        매입 += h.재무.매입
        비용 += h.재무.비용
        이익 += h.재무.이익
      })

      매출 = MathUtil.round(매출)
      매입 = MathUtil.round(매입)
      비용 = MathUtil.round(비용)
      이익 = MathUtil.round(이익)

      val list2: 회사월별이력[] = this.월별이력.filter(h => h.year == lastYear && h.month == lastMonth)
      %%// assert.equal(list2.length, 0)

      %%// this.월별이력.push({
      %%//   year: lastYear,
      %%//   month: lastMonth,
      %%//   매출: 매출,
      %%//   매입: 매입,
      %%//   비용: 비용,
      %%//   이익: 이익,
      %%// })

      assert.equal(list2.length, 1)
      assert.equal(list2[1].재무.매출, 매출)
      assert.equal(list2[1].재무.매입, 매입)
      assert.equal(list2[1].재무.비용, 비용)
      assert.equal(list2[1].재무.이익, 이익)
    }

    this.lastHistoryDate.set(date)
  }

  /**
   *
   * @param until
   * @param deptName
   * @returns
   */
  def 누적비용(until: SimDate, deptName: string = '') => {
    val result: {
      var 누적매출: number
      var 누적매입: number
      var 누적비용: number
      var 누적이익: number
    } = {
      누적매출: 0
      누적매입: 0
      누적비용: 0
      누적이익: 0
    }

    val startIndex = this.일별이력.findIndex((e) => e.date.isEqual(until))
    if (startIndex == -1) {
      %%// assert(false)
      return result
    }

    for (n <- 1 to startIndex) {
      val firmShot = this.일별이력[n]
      assert.notEqual(firmShot, nil)
      if (firmShot == nil) return result

      if (deptName == '') {
        result.누적매출 += firmShot.재무.매출
        result.누적매입 += firmShot.재무.매입
        result.누적비용 += firmShot.재무.비용
        result.누적이익 += firmShot.재무.매출 - firmShot.재무.매입 - firmShot.재무.비용
      } else {
        val shot = firmShot.부서이력.find(n => n.dept == deptName)
        if (shot == nil) return result

        result.누적매출 += shot.매출.금액()
        result.누적매입 += shot.매입.금액()
        result.누적비용 += shot.비용.합계()
        result.누적이익 += shot.매출.금액() - shot.매입.금액() - shot.비용.합계()
      }
    }
    return result
  }

  /**
   *
   */
  private static var firmHistory = new Map<string, 회사이력>()

  /**
   *
   * @param firmList
   */
  static def setFirmHistory(firmList?: Firm[]) => {
    if (firmList == nil || firmList.length == 0) {
      firmList = Firm.getFirmsList()
    }
    firmList.forEach(firm => {
      this.firmHistory.set(firm.name, new 회사이력(firm))
    })
  }

  /**
   *
   * @param firmName
   * @returns
   */
  static def createFirmHistory(firm: Firm) => {
    val firmHist = this.getFirmHistory(firm.name, false)
    if (firmHist != nil) {
      console.log('already exist firm history:', firm.name)
      return false
    }
    this.firmHistory.set(firm.name, new 회사이력(firm))
    return true
  }

  /**
   *
   * @param firmName
   * @returns
   */
  static def getFirmHistory(firmName: string, isDispError: boolean = true)-> 회사이력 | nil => {
    val firmHist = this.firmHistory.get(firmName)
    if (firmHist == nil && isDispError) {
      console.log('undefined firm:', firmName)
    }
    return firmHist
  }

  /**
   *
   * @param firmName
   * @param date
   * @returns
   */
  static def getSnapshot(firmName: string, date: SimDate) => {
    val firmHist = this.getFirmHistory(firmName)
    if (firmHist != nil) {
      val shot = firmHist.getSnapshot(date)
      if (shot != nil) { return shot }
      else { console.log('invalid date:', firmName, date) }
    }
  }

  /**
   *
   * @param firmName
   * @param from_year
   * @param from_month
   * @param to_year
   * @param to_month
   * @returns
   */
  static def getSnapshotMonth2(firmName: string, from_year: number, from_month: number, to_year: number, to_month: number) => {
    if (from_year == to_year) {
      assert(from_month <= to_month)
    } else assert(from_year < to_year)

    val result: 회사월별이력[] = []
    val firmHist = this.getFirmHistory(firmName)
    if (firmHist == nil) return result

    var y = from_year
    var m = from_month
    while (true) {
      val shot = firmHist.getSnapshotMonth(y, m)
      if (shot != nil) result.push(shot)

      %%// to 까지 포함한다.
      if (y == to_year && m == to_month) { break }
      else {
        m += 1
        if (m > 12) {
          y += 1
          m = 1
        }
      }
    }
    return result
  }

  /**
   *
   * @param date
   * @param deptList
   * @returns
   */
  static def getDeptSnapshot(date: SimDate, deptList: Dept[])-> 부서이력[] => {
    val deptHistory: 부서이력[] = []
    deptList.forEach(d => {
      val cost = new 비용항목()
      cost.고정비 = d.비용.합계('고정비')
      cost.인건비 = d.비용.합계('인건비')
      cost.운영비 = d.비용.합계('운영비')
      cost.교육비 = d.비용.합계('교육비')

      deptHistory.push({
        dept: d.name
        date: new SimDate(date)

        // 처리량 관련
        처리량: d.처리량
        처리한계: d.처리한계()
        재고수량: d.제품수량()
        재고한계: d.재고한계()

        // 주문량 관련
        총입고량: d.총입고량()
        총출고량: d.총출고량()
        발주총량: d.발주총량
        수주총량: d.수주총량()

        // 비용 관련
        매입: d.매입()
        매출: d.매출()
        비용: cost
      })
    })
    return deptHistory
  }
}