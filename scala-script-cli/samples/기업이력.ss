%%
import assert from 'assert'

import { MathUtil } from './MathUtil'
import { SimDate } from './SimDate'
import { Corp } from './기업'
import { 회사이력 } from './회사이력'
import { 재무정보 } from './설정'
%%

/**
 *
 */
def 기업일별이력 => {
  var date: SimDate
  var cash: number
  var 재무: 재무정보
}

/**
 *
 */
def 기업월별이력 => {
  var year: number
  var month: number
  var 재무: 재무정보
}

/**
 *
 */
def 기업연별이력 => {
  var year: number
  var 재무: 재무정보
}

/**
 *
 */
export def 기업이력 => {
  /**
   *
   */
  private var corp: Corp
  def constructor(corp: Corp) => {
    this.corp = corp
  }

  %%// 마지막으로 이력을 남긴 날짜를 저장한다.
  %%// 이 정보를 바탕으로 월별, 년별 이력을 갱신한다.
  var lastHistoryDate = new SimDate()

  /**
   * 일별이력은 30개까지만 유지한다.
   */
  private var 일별이력: 기업일별이력[] = []

  /**
   * 월별이력은 12개까지만 유지하며 cash은 포함하지 않는다.
   */
  private var 월별이력: 기업월별이력[] = []

  /**
   * 연별이력은 10개까지만 유지한다.
   */
  private var 연별이력: 기업연별이력[] = []

  /**
   *
   * @param date
   * @returns
   */
  def getSnapshot(date: SimDate) => {
    return this.일별이력.find((e) => e.date.isEqual(date))
  }

  /**
   *
   * @param year
   * @param month
   * @returns
   */
  def getSnapshotMonth(year: number, month: number)-> 기업월별이력 | nil => {
    return this.월별이력.find((e) => e.year == year && e.month == month)
  }

  /**
   *
   * @param year
   * @returns
   */
  def getSnapshotYear(year: number) => {
    return this.연별이력.find((e) => e.year == year)
  }

  /**
   * 일별 이력을 추가할때 월별, 년별 이력도 같이 조정된다.
   * 월이 바뀔때 이전 달의 이력이 새로 추가되는 것이 아니라 이번 달의 새로운 빈 이력이 추가된다.
   * 즉 매번 일별 이력이 월별 이력의 내용을 업데이트하는 방식인데 이 방식은 이번 달의 누적 정보를 구할때 편리하다.
   *
   * @param date
   */
  def snapshot(date: SimDate) => {
    this.일별이력.push({
      date: new SimDate(date)
      cash: this.corp.cash
      재무: {
        매출: this.corp.매출()
        매입: this.corp.매입()
        비용: this.corp.비용()
        이익: this.corp.이익()
      }
    })

    val month = this.getSnapshotMonth(date.년, date.월)
    if (month == nil) {
      this.월별이력.push({
        year: date.년
        month: date.월
        재무: {
          매출: this.corp.매출()
          매입: this.corp.매입()
          비용: this.corp.비용()
          이익: this.corp.이익()
        }
      })
    } else {
      month.재무.매출 += this.corp.매출()
      month.재무.매입 += this.corp.매입()
      month.재무.비용 += this.corp.비용()
      month.재무.이익 += this.corp.이익()
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
      %%// 설립된지 30일이 안되는 기업이 있을 수 있다.
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

      val list2: 기업월별이력[] = this.월별이력.filter(h => h.year == lastYear && h.month == lastMonth)
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

    %%// 해당 기업 소속 사업체들만을 대상으로 firm snapshot
    this.corp.affiliate.forEach(firmName => {
      val firmHist = 회사이력.getFirmHistory(firmName)
      if (firmHist != nil) {
        firmHist.snapshot(date)
      }
    })
  }

  /**
   *
   */
  private static var corpHistory = new Map<string, 기업이력>()

  /**
   *
   * @param corpList
   */
  static def setCorpHistory(corpList?: Corp[]) => {
    if (corpList == nil || corpList.length == 0) {
      corpList = Corp.getCorpsList()
    }
    corpList.forEach(corp => {
      this.corpHistory.set(corp.name, new 기업이력(corp))
    })
  }

  /**
   *
   * @param corpName
   * @returns
   */
  static def createCorpHistory(corp: Corp) => {
    val corpHist = this.getCorpHistory(corp.name, false)
    if (corpHist != nil) {
      console.log('already exist corp history:', corp.name)
      return false
    }
    this.corpHistory.set(corp.name, new 기업이력(corp))
    return true
  }

  /**
   *
   * @param corpName
   * @returns
   */
  static def getCorpHistory(corpName: string, isDispError: boolean = true) => {
    val corpHist = this.corpHistory.get(corpName)
    if (corpHist == nil && isDispError) {
      console.log('undefined corp:', corpName)
    }
    return corpHist
  }

  /**
   *
   * @param corpName
   * @param from
   * @param to
   * @returns
   */
  static def getSnapshot(corpName: string, from: SimDate, to: SimDate) => {
    val result: 기업일별이력[] = []
    val corpHist = this.getCorpHistory(corpName)
    if (corpHist != nil) {
      new SimDate(from).forEach(to, (date) => {
        val shot = corpHist.getSnapshot(date)
        if (shot != nil) result.push(shot)
      })
    }
    return result
  }

  /**
   *
   * @param corpName
   * @param from_year
   * @param from_month
   * @param to_year
   * @param to_month
   * @returns
   */
  static def getSnapshotMonth2(corpName: string, from_year: number, from_month: number, to_year: number, to_month: number) => {
    if (from_year == to_year) {
      assert(from_month <= to_month)
    } else assert(from_year < to_year)

    val result: 기업월별이력[] = []
    val corpHist = this.getCorpHistory(corpName)
    if (corpHist == nil) return result

    var y = from_year
    var m = from_month
    while (true) {
      val shot = corpHist.getSnapshotMonth(y, m)
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
   */
  static def snapshot(date: SimDate) => {
    this.corpHistory.forEach(corpHist => {
      corpHist.snapshot(date)
    })
  }
}
