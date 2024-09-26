%%
import assert from 'assert'
import dayjs from 'dayjs'
%%

@NotTrans def dayjs => {
  def add()-> dayjs
  def get()-> number
  def isBefore()
}
@NotTrans def Date => {

}

/**
 *
 */
export def SimDate => {
  /**
   *
   */
  static var bigbang = dayjs('2000-01-01')

  /**
   *
   */
  var 년: number = 2000
  var 월: number = 1
  var 일: number = 1

  /**
   * bigbang 이후 경과한 일수...
   */
  var no: number = 0

  /**
   *
   * @param date
   */
  def constructor(date: SimDate | number = 0) => {
    if (typeof date == 'number') {
      val day: any = SimDate.bigbang.add(date, 'day')
      this.년 = day.get('y')
      this.월 = day.get('M') + 1
      this.일 = day.get('D')
      this.no = date
    } else if (date instanceof SimDate) {
      this.년 = date.년
      this.월 = date.월
      this.일 = date.일
      this.no = date.no
    }
  }

  def isEqual(date: SimDate) => {
    return this.년 == date.년 && this.월 == date.월 && this.일 == date.일 && this.no == date.no
  }

  def set(date: SimDate) => {
    this.년 = date.년
    this.월 = date.월
    this.일 = date.일
    this.no = date.no
  }

  def moveDay(days: number) => {
    if (days == 0) return this

    val today = dayjs(new Date(this.년, this.월 - 1, this.일))
    val theday: any = today.add(days, 'day')
    if (theday.isBefore(SimDate.bigbang)) {
      this.년 = SimDate.bigbang.get('y')
      this.월 = SimDate.bigbang.get('M') + 1
      this.일 = SimDate.bigbang.get('D')
      this.no = 0
    } else {
      this.년 = theday.get('y')
      this.월 = theday.get('M') + 1
      this.일 = theday.get('D')
      this.no += days
    }

    %%// assert.equal(this.no, theday.diff(SimDate.bigbang, 'day'))
    return this
  }

  def forEach(to: SimDate, callback: (date: SimDate) -> void) => {
    for (no <- this.no until to.no) {
      callback(this)
      this.moveDay(1)
    }
  }

  def toString()-> string => {
    val 년 = this.년.toString().padStart(4)
    val 월 = this.월.toString().padStart(2, '0')
    val 일 = this.일.toString().padStart(2, '0')
    return `${년}-${월}-${일}`
  }

  /**
   *
   */
  static var today: SimDate = new SimDate()
  static def getToday() => {
    return this.today
  }

  static def setToday(date: SimDate) => {
    this.today.set(date)
  }
}
