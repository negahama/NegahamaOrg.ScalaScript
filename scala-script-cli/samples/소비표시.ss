%%
import assert from 'assert'
import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
import { Table } from './Table'
import { Goods } from './재화'
import { Consumer } from './소비자'
import { Market, 상품정보, 판매현황 } from './시장'
import { 소비이력, 재화종류별지출규모, 판매세부내역 } from './소비이력'
%%

/**
 *
 */
def columnInfo => {
  var name: string
  var index: number
}

/**
 *
 */
def SalesTable => {
  var index: number = 0
  var columns: columnInfo[] = []
  var table: Table = new Table()

  /**
   *
   */
  def toString() => {
    return this.table.toString()
  }

  /**
   *
   * @param column
   * @param createCallback
   * @returns
   */
  private def getCell(column: string, createCallback: (column: string)-> void) => {
    var index = 0
    val col = this.columns.find(c => c.name == column)
    if (col == nil) {
      createCallback(column)
      this.columns.push({
        name: column
        index: this.index
      })
      index = this.index
      this.index += 1
    } else index = col.index
    return index
  }

  /**
   *
   * @param columnName
   * @param date
   * @param prodName
   * @param formatCallback
   */
  private def cellSaleDetail(
    columnName: string,
    date: SimDate,
    prodName: string,
    formatCallback: (salesDetail: 판매세부내역)-> string
  ) => {
    val index = this.getCell(columnName, (column) => {
      %%// bar 형태로 표시하는 경우인데...
      %%// bar의 글자수는 컬러와 특수문자를 사용하기 때문에 정확한 폭을 설정하기 어렵다
      %%// 그냥 나두면 컬러와 특수문자 때문에 폭이 지나치게 커지게 되므로 여기서 별도의 컬럼을 만든다.
      if (column == '가격통계2' || column == '품질통계2') {
        this.table.addColumnR(column, 16, true)
      } else this.table.addColumnR(column)
    })

    val salesDetail = 소비이력.getSaleDetailByProduct(date, prodName)
    if (salesDetail != nil) {
      this.table.cellText(index, formatCallback(salesDetail))
    } else this.table.cellText(index, '')
  }

  /**
   *
   * @param columnName
   * @param formatCallback
   */
  private def cellSimpleValueL(columnName: string, formatCallback: ()-> string) => {
    val index = this.getCell(columnName, (column) => {
      this.table.addColumnL(column)
    })

    this.table.cellText(index, formatCallback())
  }

  /**
   *
   * @param columnName
   * @param formatCallback
   */
  private def cellSimpleValueR(columnName: string, formatCallback: ()-> string) => {
    val index = this.getCell(columnName, (column) => {
      this.table.addColumnR(column)
    })

    this.table.cellText(index, formatCallback())
  }

  /**
   *
   * @param sort
   * @param goodsName
   * @param prodName
   * @param from
   * @param to
   * @param 표시항목
   */
  def 판매현황정보구성(
    sort: string,
    goodsName: string,
    prodName: string,
    from: SimDate,
    to: SimDate,
    표시항목: string[]
  ) => {
    val saleList: 판매현황[] = Market.재화별판매현황(goodsName)

    sort match {
      case '상품별' => {
        saleList.forEach((판매현황: 판매현황) => {
          val 상품정보 = Market.getProduct(판매현황.상품명)
          assert.notEqual(상품정보, nil)
          new SimDate(from).forEach(to, (date) => {
            this.판매현황개별정보구성(표시항목, 판매현황.상품명, date, 상품정보, 판매현황)
          })
        })
        break
      }
      case '날짜별' => {
        new SimDate(from).forEach(to, (date) => {
          saleList.forEach(판매현황 => {
            val 상품정보 = Market.getProduct(판매현황.상품명)
            assert.notEqual(상품정보, nil)
            this.판매현황개별정보구성(표시항목, 판매현황.상품명, date, 상품정보, 판매현황)
          })
        })
        break
      }
      case '시장점유률만' => {
        new SimDate(from).forEach(to, (date) => {
          val index = this.getCell('년/월/일', (column) => {
            this.table.addColumnL(column)
          })
          this.table.cellDate(index, date)

          saleList.forEach(s => {
            val n = Market.getProduct(s.상품명)
            assert.notEqual(n, nil)

            val salesDetail = 소비이력.getSaleDetailByProduct(date, s.상품명)
            if (salesDetail != nil) {
              assert.equal(salesDetail.재화명, goodsName)
              val index = this.getCell(s.상품명, (column) => {
                this.table.addColumnR(column)
              })

              this.table.cellText(index, LogUtil.format(salesDetail.시장점유률, 6))
            }
          })
        })
        break
      }
      case '개별상품' => {
        new SimDate(from).forEach(to, (date) => {
          this.판매현황개별정보구성(표시항목, prodName, date)
        })
        break
      }
    }
  }

  /**
   *
   * @param 표시항목
   * @param 상품명
   * @param date
   * @param 상품정보
   * @param 판매현황
   */
  def 판매현황개별정보구성(
    표시항목: string[],
    상품명: string,
    date: SimDate,
    상품정보?: 상품정보,
    판매현황?: 판매현황
  ) => {
    표시항목.forEach(disp => {
      disp match {
        case 'day' => {
          val index = this.getCell('년/월/일', (column) => {
            this.table.addColumnL(column)
          })
          this.table.cellDate(index, date)
          break
        }
        case '상품명' => {
          this.cellSimpleValueL('상품명', () => {
            return 상품명
          })
          break
        }
        case '재화명' => {
          val columnName = '재화명'
          val index = this.getCell(columnName, (column) => {
            this.table.addColumnL(column)
          })

          val salesDetail = 소비이력.getSaleDetailByProduct(date, 상품명)
          if (salesDetail != nil) {
            this.table.cellText(index, salesDetail.재화명)
          } else this.table.cellText(index, '')
          break
        }
        case '회사명' => {
          this.cellSimpleValueL('회사명', () => {
            return if (상품정보 != nil) then 상품정보.판매회사 else ''
          })
          break
        }
        case '부서명' => {
          this.cellSimpleValueL('부서명', () => {
            return if (상품정보 != nil) then 상품정보.판매부서 else ''
          })
          break
        }
        case '잔량_공급' => {
          this.cellSimpleValueR('잔량/공급', () => {
            if (판매현황 != nil && 상품정보 != nil) {
              val 잔량 = LogUtil.format(판매현황.수량, 4)
              val 공급 = LogUtil.format(상품정보.공급물량, 4)
              return `${잔량}/${공급}`
            }
            return ''
          })
          break
        }
        case '가격_품질_상표' => {
          this.cellSimpleValueR('가격$,품질,상표', () => {
            if (상품정보 != nil) {
              var data = ''
              data += LogUtil.formatNumber(상품정보.가격, 1, 4) .. '$,'
              data += LogUtil.formatNumber(상품정보.품질, 1, 4) .. ','
              data += LogUtil.formatNumber(상품정보.상표, 1, 4)
              return data
            }
            return ''
          })
          break
        }
        case '정규화값' => {
          this.cellSimpleValueR('정규화값', () => {
            if (판매현황 != nil) {
              val 정규화가격 = LogUtil.format(판매현황.정규화된가격, 4)
              val 정규화품질 = LogUtil.format(판매현황.정규화된품질, 4)
              val 정규화상표 = LogUtil.format(판매현황.정규화된상표, 4)
              return `${정규화가격},${정규화품질},${정규화상표}`
            }
            return ''
          })
          break
        }
        case '판매가격' => {
          this.cellSaleDetail('판매가', date, 상품명, (salesDetail) => {
            return LogUtil.format(salesDetail.가격, 6)
          })
          break
        }
        case '판매품질' => {
          this.cellSaleDetail('판매품', date, 상품명, (salesDetail) => {
            return LogUtil.format(salesDetail.품질, 5)
          })
          break
        }
        case '가격통계' => {
          this.cellSaleDetail('가격통계', date, 상품명, (salesDetail) => {
            val stat = salesDetail.통계
            assert.notEqual(stat, nil)
            var data = ''
            data += LogUtil.format(salesDetail.가격, 5) .. '$('
            data += LogUtil.format(stat.가격.최저, 4) .. '/'
            data += LogUtil.format(stat.가격.평균, 6) .. '/'
            data += LogUtil.format(stat.가격.최고, 4) .. ')'
            return data
          })
          break
        }
        case '가격통계2' => {
          this.cellSaleDetail('가격통계2', date, 상품명, (salesDetail) => {
            val stat = salesDetail.통계
            assert.notEqual(stat, nil)
            var data = ''
            data += LogUtil.formatNumber(salesDetail.가격, 1, 4) .. '['
            data += LogUtil.colorBar(stat.가격.최고, stat.가격.최저, salesDetail.가격, 10) .. ']'
            return data
          })
          break
        }
        case '품질통계' => {
          this.cellSaleDetail('품질통계', date, 상품명, (salesDetail) => {
            val stat = salesDetail.통계
            assert.notEqual(stat, nil)
            var data = ''
            data += LogUtil.format(salesDetail.품질, 4) .. '('
            data += LogUtil.format(stat.품질.최저, 3) .. '/'
            data += LogUtil.format(stat.품질.평균, 6) .. '/'
            data += LogUtil.format(stat.품질.최고, 3) .. ')'
            return data
          })
          break
        }
        case '품질통계2' => {
          this.cellSaleDetail('품질통계2', date, 상품명, (salesDetail) => {
            val stat = salesDetail.통계
            assert.notEqual(stat, nil)
            var data = ''
            data += LogUtil.formatNumber(salesDetail.품질, 1, 4) .. '['
            data += LogUtil.colorBar(stat.품질.최저, stat.품질.최고, salesDetail.품질, 10) .. ']'
            return data
          })
          break
        }
        case '시장점유률' => {
          this.cellSaleDetail('시점률', date, 상품명, (salesDetail) => {
            return LogUtil.format(salesDetail.시장점유률, 6)
          })
          break
        }
        case '판매금' => {
          this.cellSaleDetail('판매금', date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              sum += i.주문금액
            })
            return LogUtil.format(sum, 8)
          })
          break
        }
        case '판매금_고소득층' =>
        case '판매금_중소득층' =>
        case '판매금_저소득층' => {
          var column = ''
          var target = ''
          disp match {
            case '판매금_고소득층' => {
              column = '판금(고)'
              target = '고소득층'
              break
            }
            case '판매금_중소득층' => {
              column = '판금(중)'
              target = '중소득층'
              break
            }
            case '판매금_저소득층' => {
              column = '판금(저)'
              target = '저소득층'
              break
            }
          }
          this.cellSaleDetail(column, date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              if (i.누구에게 == target) sum += i.주문금액
            })
            return LogUtil.format(sum, 8)
          })
          break
        }
        case '판매량' => {
          this.cellSaleDetail('판매량', date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              sum += i.주문수량
            })
            return LogUtil.format(sum, 8)
          })
          break
        }
        case '판매량_고소득층' =>
        case '판매량_중소득층' =>
        case '판매량_저소득층' => {
          var column = ''
          var target = ''
          disp match {
            case '판매량_고소득층' => {
              column = '판량(고)'
              target = '고소득층'
              break
            }
            case '판매량_중소득층' => {
              column = '판량(중)'
              target = '중소득층'
              break
            }
            case '판매량_저소득층' => {
              column = '판량(저)'
              target = '저소득층'
              break
            }
          }
          this.cellSaleDetail(column, date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              if (i.누구에게 == target) sum += i.주문수량
            })
            return LogUtil.format(sum, 8)
          })
          break
        }
        case '투입가능금액' => {
          var salesScale: 재화종류별지출규모 | nil
          val 상품정보 = Market.getProduct(상품명)
          assert.notEqual(상품정보, nil, 상품명)
          if (상품정보 != nil) {
            val goods = Goods.getGoods(상품정보.재화명)
            assert.notEqual(goods, nil, 상품정보.재화명)
            if (goods != nil) {
              val shot = 소비이력.getSnapshot(date)
              if (shot != nil) {
                salesScale = shot.지출규모.find(scale => scale.이름 == goods.종류)
                assert.notEqual(salesScale, nil, goods.종류)
              }
            }
          }

          val columnName = '투입가능'
          val index = this.getCell(columnName, (column) => {
            this.table.addColumnR(column)
          })
          if (salesScale != nil) {
            val text = LogUtil.format(salesScale.재화당소비총액, 8)
            this.table.cellText(index, text)
          } else this.table.cellText(index, '')
          break
        }
        case '투입금액_합계' => {
          this.cellSaleDetail('투입(합)', date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              sum += i.투입금액
            })
            return LogUtil.format(sum, 8)
          })
          break
        }
        case '투입금액_고소득층' =>
        case '투입금액_중소득층' =>
        case '투입금액_저소득층' => {
          var column = ''
          var target = ''
          disp match {
            case '투입금액_고소득층' => {
              column = '투입(고)'
              target = '고소득층'
              break
            }
            case '투입금액_중소득층' => {
              column = '투입(중)'
              target = '중소득층'
              break
            }
            case '투입금액_저소득층' => {
              column = '투입(저)'
              target = '저소득층'
              break
            }
          }
          this.cellSaleDetail(column, date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              if (i.누구에게 == target) sum += i.투입금액
            })
            return LogUtil.format(sum, 8)
          })
          break
        }
        case '남은수량_합계' => {
          this.cellSaleDetail('남은수합', date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              sum += i.남은수량
            })
            return LogUtil.format(sum, 4)
          })
          break
        }
        case '남은수량_고소득층' =>
        case '남은수량_중소득층' =>
        case '남은수량_저소득층' => {
          var column = ''
          var target = ''
          disp match {
            case '남은수량_고소득층' => {
              column = '잔량(고)'
              target = '고소득층'
              break
            }
            case '남은수량_중소득층' => {
              column = '잔량(중)'
              target = '중소득층'
              break
            }
            case '남은수량_저소득층' => {
              column = '잔량(저)'
              target = '저소득층'
              break
            }
          }
          this.cellSaleDetail(column, date, 상품명, (salesDetail) => {
            var sum = 0
            salesDetail.거래.forEach(i => {
              if (i.누구에게 == target) sum += i.남은수량
            })
            return LogUtil.format(sum, 8)
          })
          break
        }
      }
    })
  }

}

/**
 *
 */
export def 소비표시 => {
  /**
   *
   * @returns
   */
  static def 소비자기본정보() => {
    val r: string[] = []
    r.push('인구수: ' .. LogUtil.addComma(Consumer.인구수))
    r.push('분류항목: ' .. Consumer.분류항목.toString())
    r.push('')

    r.push('|  계층  | 인구총수|  소비총액 |   생필품  |   기호품  |   고가품  |가/품/상|')
    r.push('|--------|---------|-----------|-----------|-----------|-----------|--------|')

    var 합계_인구총수 = 0
    var 합계_소비총액 = 0
    var 합계_생필품총액 = 0
    var 합계_기호품총액 = 0
    var 합계_고가품총액 = 0

    Consumer.소비계층.forEach(layer => {
      var line = '|'
      line += layer.이름 .. '|'
      line += LogUtil.format(layer.인구총수, 4) .. '('
      line += LogUtil.format(layer.인구비율, 2) .. '%)|'
      line += LogUtil.format(layer.소비총액, 6) .. '('
      line += LogUtil.format(layer.일평균지출액, 2) .. '$)|'
      if (layer.재화종류별소비총액 != nil) {
        line += LogUtil.format(layer.재화종류별소비총액.생필품, 6) .. '('
        line += LogUtil.format(layer.재화종류별구매패턴.생필품, 2) .. '%)|'
        line += LogUtil.format(layer.재화종류별소비총액.기호품, 6) .. '('
        line += LogUtil.format(layer.재화종류별구매패턴.기호품, 2) .. '%)|'
        line += LogUtil.format(layer.재화종류별소비총액.고가품, 6) .. '('
        line += LogUtil.format(layer.재화종류별구매패턴.고가품, 2) .. '%)|'
      }

      line += LogUtil.format(layer.구매요인별구매패턴.가격, 2) .. '/'
      line += LogUtil.format(layer.구매요인별구매패턴.품질, 2) .. '/'
      line += LogUtil.format(layer.구매요인별구매패턴.상표, 2) .. '|'

      r.push(line)

      합계_인구총수 += layer.인구총수
      합계_소비총액 += layer.소비총액
      합계_생필품총액 += layer.재화종류별소비총액.생필품
      합계_기호품총액 += layer.재화종류별소비총액.기호품
      합계_고가품총액 += layer.재화종류별소비총액.고가품
    })

    var sum = '|  합계  |'
    sum += LogUtil.format(합계_인구총수, 9) .. '|'
    sum += LogUtil.format(합계_소비총액, 11) .. '|'
    sum += LogUtil.format(합계_생필품총액, 11) .. '|'
    sum += LogUtil.format(합계_기호품총액, 11) .. '|'
    sum += LogUtil.format(합계_고가품총액, 11) .. '|'
    sum += '        |'

    r.push(sum)
    return r
  }

  /**
   *
   * @param from
   * @param to
   * @returns
   */
  static def 소비자상세정보(from: SimDate, to: SimDate) => {
    val tb = new Table()
    tb.addColumnL('년/월/일')
    tb.addColumnR('인구수')
    %%// tb.addColumnR('계층별 인구수 및 인구비율')
    %%// tb.addColumnR('인당지출')
    tb.addColumnR('지출총액')
    tb.addColumnR('생필')
    tb.addColumnR('G')
    tb.addColumnR('P')
    tb.addColumnR('지출규모')
    tb.addColumnR('기호')
    tb.addColumnR('G')
    tb.addColumnR('P')
    tb.addColumnR('지출규모')
    tb.addColumnR('고가')
    tb.addColumnR('G')
    tb.addColumnR('P')
    tb.addColumnR('지출규모')

    new SimDate(from).forEach(to, (date) => {
      val shot = 소비이력.getSnapshot(date)
      if (shot == nil) return;

      tb.cellDate('년/월/일', date)

      var index = 1
      var result1 = ''
      var result2 = ''
      var result3 = ''

      var col = 1
      val colMax = shot.소비계층.length
      shot.소비계층.forEach(layer => {
        %%// 인구수, 인구비율
        val 계층인구 = shot.인구수 * (layer.인구비율 / 100)
        result1 += LogUtil.format(계층인구, 4) .. '명('
        result1 += LogUtil.format(layer.인구비율, 2) .. '%)'

        %%// 지출 금액 관련
        %%// 일평균지출액|소비총액
        val 소비총액 = 계층인구 * layer.일평균지출액
        result2 += LogUtil.format(layer.일평균지출액, 2)
        result3 += LogUtil.format(소비총액, 6)

        if (col != colMax) {
          result1 += '/'
          result2 += '/'
          result3 += '/'
          col += 1
        }
      })

      val result0 = LogUtil.format(shot.인구수, 6)

      tb.cellText(index += 1, result0)
      %%// tb.cellText(index += 1, result1)
      %%// tb.cellText(index += 1, result2)
      tb.cellText(index += 1, result3)

      %%// '생필품|재화수/상품수/재화당소비액{계층별}|' +
      val info = shot.지출규모
      info.forEach(i => {
        tb.cellText(index += 1, i.이름.slice(0, 2))
        tb.cellDecimal(index += 1, i.재화개수)
        tb.cellDecimal(index += 1, i.상품개수)

        var result = ''
        result += LogUtil.format(i.재화당소비총액, 6) .. '=('
        result += LogUtil.format(i.재화당소비총액_고소득층, 6) .. '/'
        result += LogUtil.format(i.재화당소비총액_중소득층, 6) .. '/'
        result += LogUtil.format(i.재화당소비총액_저소득층, 6) .. ')'

        tb.cellText(index += 1, result)
      })
    })
    return tb.toString()
  }

  /**
   * 명시된 기간 동안 명시된 재화에 속하는 모든 상품의 판매 현황을 출력한다.
   *
   * @param goodsList
   * @param from
   * @param to
   * @returns
   */
  static def 다수재화판매현황(goodsList: string[], from: SimDate, to: SimDate) => {
    var r: string[] = []
    r.push('')
    r.push('재화 판매 현황 : ' .. goodsList.toString())
    r.push('  from :' .. from.toString())
    r.push('  to   :' .. to.toString())
    r.push('')

    goodsList.forEach(goodsName => {
      r = r.concat(this.개별재화판매현황(goodsName, from, to))
    })
    return r
  }

  /**
   * 명시된 기간 동안 명시된 재화에 속하는 모든 상품의 판매 현황을 출력한다.
   *
   * @param goodsName
   * @param from
   * @param to
   * @returns
   */
  static def 개별재화판매현황(goodsName: string, from: SimDate, to: SimDate) => {
    val r: string[] = []

    val saleList = Market.재화별판매현황(goodsName)
    if (saleList.length == 0) {
      r.push(`'${goodsName}'은(는) 시장에서 판매된 적이 없습니다.`)
      return r
    }

    val stat = Market.getStatData(goodsName)

    r.push(goodsName)
    r.push('  - 가격: ' .. JSON.stringify(stat.가격))
    r.push('  - 품질: ' .. JSON.stringify(stat.품질))
    r.push('')

    val tb = new SalesTable()
    tb.판매현황정보구성('날짜별', goodsName, '', from, to, [
      'day',
      '상품명',
      '회사명',
      '부서명',
      '잔량_공급',
      '가격_품질_상표',
      '정규화값',
      '가격통계2',
      '품질통계2',
      '투입가능금액',
      '판매금',
      '판매량',
      '시장점유률'
    ])
    return r.concat(tb.toString()).concat('')
  }

  /**
   * 명시된 기간 동안 명시된 상품의 판매 현황을 출력한다.
   *
   * @param prodName
   * @param from
   * @param to
   * @returns
   */
  static def 개별상품판매현황(prodName: string, from: SimDate, to: SimDate) => {
    val r: string[] = []
    r.push(`${prodName} 판매 현황`)
    r.push('  from :' .. from.toString())
    r.push('  to   :' .. to.toString())
    r.push('')

    val tb = new SalesTable()
    tb.판매현황정보구성('개별상품', '', prodName, from, to, [
      'day',
      '상품명',
      '재화명',
      '판매가격',
      '판매품질',
      '투입가능금액',
      '판매량',
      '판매량_고소득층',
      '판매량_중소득층',
      '판매량_저소득층',
      '시장점유률',
      '투입금액_합계',
      '남은수량_합계'
    ])
    return r.concat(tb.toString())
  }
}
