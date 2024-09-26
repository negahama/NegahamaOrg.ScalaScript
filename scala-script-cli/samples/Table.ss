%%
import assert from 'assert'
import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
%%

/**
 * align - 0: left, 1: right
 */
def columnInfo => {
  var index: number
  var name: string
  var data: string[]
  var width: number
  var align: number
  var textColor: string
  var backColor: string
  var includeColor: boolean
}

/**
 * 텍스트로 테이블을 표시하는데 사용되는 클래스이다.
 * 컬럼을 생성한 다음 해당 컬럼에 데이터를 넣으면 순차적으로 데이터가 저장된다.
 * 컬럼은 폭과 좌우정렬을 지원한다. 특별히 폭을 지정하지 않으면 컬럼의 타이틀과 내용물을
 * 모두 표시할 수 있는 폭으로 조정된다.
 * 컬럼에 접근하는 방식이 컬럼의 타이틀과 인덱스 두 가지 방법이 있는데
 * 타이틀로 접근하는 방식은 해당 이름을 가진 컬럼이 없으면 컬럼을 새로 만들 수 있다.
 * 이 방식은 컬럼을 일부러 만들 필요없어서 유용하지만 타이틀 이름이 고유해야 하기 때문에
 * 경우에 따라서는 불편할 수도 있다. 아울러 자동으로 컬럼을 생성하는 경우에는 편이를 위해서
 * 텍스트는 좌측정렬로 숫자는 우측정렬되게 되어져 있다.
 */
export def Table => {
  var columnIndex = 0
  var columns: columnInfo[] = []

  /**
   * 새로운 컬럼을 추가한다.
   * 컬럼 인덱스는 추가되는 순서대로 0부터 지정되며 동일한 이름도 허용한다.
   * 이는 동일한 이름을 가지는 다수의 컬럼을 지원하기 위한 것이다.
   * 이런 경우 인덱스를 이용해서 컬럼에 액세스해야 한다.
   *
   * @param name
   * @param width
   * @param includeColor
   * @param textColor
   * @param backColor
   */
  def addColumnL(
    name: string,
    width: number = 0,
    includeColor: boolean = false,
    textColor: string = '',
    backColor: string = ''
  ) => {
    this.columns.push({
      index: this.columnIndex
      name: name
      data: []
      width: width
      align: 0
      textColor: textColor
      backColor: backColor
      includeColor: includeColor
    })
    this.columnIndex += 1
  }

  /**
   *
   * @param name
   * @param width
   * @param includeColor
   * @param textColor
   * @param backColor
   */
  def addColumnR(
    name: string,
    width: number = 0,
    includeColor: boolean = false,
    textColor: string = '',
    backColor: string = ''
  ) => {
    this.columns.push({
      index: this.columnIndex
      name: name
      data: []
      width: width
      align: 1
      textColor: textColor
      backColor: backColor
      includeColor: includeColor
    })
    this.columnIndex += 1
  }

  /**
   * column이 number이면 컬럼 인덱스로 찾고 string이면 이름으로 찾는다.
   * 없으면 새로 만드는데 인덱스로 참조하는 컬럼은 새로 만들지 않으며
   * 이름으로 참조하는 경우에만 새로 만든다. 이때 콜백 함수를 호출해서
   * 세부적인 설정을 할 수 있다.
   *
   * @param column
   * @param createCallback
   * @returns
   */
  def getColumn(column: number | string, createCallback: (column: string)-> void)-> columnInfo | nil => {
    if (typeof column == 'number') {
      val col = this.columns.find((c) => c.index == column)
      if (col != nil) return col
      assert(false, column.toString())
    } else {
      val col = this.columns.find((c) => c.name == column)
      if (col != nil) return col

      createCallback(column)
      val col2 = this.columns.find((c) => c.name == column)
      assert.notEqual(col2, nil, column)
      return col2
    }
  }

  /**
   *
   * @param column
   * @param value
   */
  def cellText(column: number | string, value: string, leftAligned: boolean = true) => {
    val col = this.getColumn(column, (column) => {
      if (leftAligned) { this.addColumnL(column) }
      else { this.addColumnR(column) }
    })
    val text = if leftAligned
      then LogUtil.formatNameL(value, LogUtil.getTextLength(value))
      else LogUtil.formatNameR(value, LogUtil.getTextLength(value))
    col?.data.push(text)
  }

  /**
   *
   * @param column
   * @param value
   * @param width
   */
  def cellValue(column: number | string, value: number, width: number = 0) => {
    val col = this.getColumn(column, (column) => {
      this.addColumnR(column)
    })
    col?.data.push(LogUtil.format(value, width))
  }

  /**
   *
   * @param column
   * @param value
   * @param width
   * @returns
   */
  def cellDecimal(column: number | string, value: number, width: number = 0) => {
    val col = this.getColumn(column, (column) => {
      this.addColumnR(column)
    })
    col?.data.push(LogUtil.formatDecimal(value, width))
  }

  /**
   *
   * @param column
   * @param date
   */
  def cellDate(column: number | string, date: SimDate) => {
    val col = this.getColumn(column, (column) => {
      this.addColumnL(column)
    })
    val 년 = date.년.toString().padStart(4, '0')
    val 월 = date.월.toString().padStart(2, '0')
    val 일 = date.일.toString().padStart(2, '0')
    col?.data.push(`${년}/${월}/${일}`)
  }

  /**
   *
   * @param text
   * @param width
   * @returns
   */
  private def cellTextL(text: string, width: number = 0)-> string => {
    val length = if width != 0 then width else LogUtil.getTextLength(text)
    return LogUtil.formatNameL(text, length) .. '|'
  }

  /**
   *
   * @param text
   * @param width
   * @returns
   */
  private def cellTextR(text: string, width: number = 0)-> string => {
    val length = if width != 0 then width else LogUtil.getTextLength(text)
    return LogUtil.formatNameR(text, length) .. '|'
  }

  /**
   *
   * @param width
   * @returns
   */
  private def cellLineL(width: number)-> string => {
    return ':' .. '-'.repeat(width-1) .. '|'
  }

  /**
   *
   * @param width
   * @returns
   */
  private def cellLineR(width: number)-> string => {
    return '-'.repeat(width-1) .. ':|'
  }

  /**
   *
   * @param width
   * @returns
   */
  private def cellEmpty(width: number)-> string => {
    return ' '.repeat(width) .. '|'
  }

  /**
   *
   */
  def toString()-> string[] => {
    val r: string[] = []
    if (this.columns.length == 0) return r

    var line1 = '|'
    var line2 = '|'

    this.columns.forEach(col => {
      if (col.width == 0) {
        %%// 컬럼의 타이틀도 폭에 포함시킨다.
        col.width = LogUtil.getTextLength(col.name)
        col.data.forEach(data => {
          var len = LogUtil.getTextLength(data)
          if (col.includeColor) {
            %%// color mark만 포함하고 있으면 color mark length = 11 만큼만 줄이면 되는데
            %%// bar처럼 특수문자를 포함하고 있으면 복잡해진다.
            %%// 일단은 color는 bar하고만 사용하는 걸로..
            %%//
            %%// console.log('color text:', data, data.length, LogUtil.getTextLength(data))
            %%// color text:   50[          ] 16 16
            %%// color text:    1[          ] 27 27
            %%// color text:   30[▩▩▩▩▩▩▩▩▩▩] 16 26
            %%// color text:   10[▩▩▩▩▩▩▩▩▩▩] 27 37
            %%//
            %%// 1번째는 특수문자도 컬러도 없는 경우이고 2번째는 컬러만 있는 경우이다. 즉 컬러로 11글자가 추가되었다.
            %%// 3번째는 특수문자가 추가된 컬러가 없는 경우이다. 4번째는 모두 있는 경우이다.

            len = data.length
            len -= 11
          }
          if (len > col.width) col.width = len
        })
      }
      col.align match {
        case 0 => {
          line1 += this.cellTextL(col.name, col.width)
          line2 += this.cellLineL(col.width)
          break
        }
        case 1 => {
          line1 += this.cellTextR(col.name, col.width)
          line2 += this.cellLineR(col.width)
          break
        }
        case _ =>
          assert(false)
      }
    })
    r.push(line1)
    r.push(line2)

    var row = 0
    this.columns.forEach(col => {
      if (col.data.length > row) row = col.data.length
    })

    for (n <- 1 to row) {
      var line = '|'
      this.columns.forEach(col => {
        if (col.data[n] == nil || col.data[n] == '') {
          line += this.cellEmpty(col.width)
        } else {
          if (col.includeColor || col.textColor != '' || col.backColor != '') {
            // 컬러를 포함하고 있거나 포함할 예정이라면 col.width를 신경쓰지 않는다
            var data = col.data[n]
            if (col.textColor != '') data = LogUtil.setTextColor(col.textColor, data)
            if (col.backColor != '') data = LogUtil.setBackColor(col.backColor, data)
            if (col.align == 1) { line += this.cellTextR(data) }
            else { line += this.cellTextL(data) }
          } else {
            if (col.align == 1) { line += this.cellTextR(col.data[n], col.width) }
            else { line += this.cellTextL(col.data[n], col.width) }
          }
        }
      })
      r.push(line)
    }
    return r
  }
}
