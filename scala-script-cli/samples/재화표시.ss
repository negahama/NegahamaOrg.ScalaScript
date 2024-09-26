%%
import { LogUtil } from './LogUtil'
import { Table } from './Table'
import { Goods } from './재화'
import { Firm } from './회사'
%%

/**
 *
 */
export def 재화표시 => {
  /**
   *
   * @param goodsList
   * @returns
   */   
  static def 재화목록(goodsList: Goods[]) => {
    %%const tb = new Table()%%
    @NotTrans val tb: any

    goodsList.forEach(goods => {
      tb.cellText('재화명', goods.name)
      tb.cellText('종류', goods.종류)
      for (n <- 1 until 4) {
        var g = goods.분류[n - 1]
        if (g == nil) g = ''
        tb.cellText('분류' .. n, g)
      }
      tb.cellText('단위', goods.최소단위)
      tb.cellDecimal('가격', goods.적정가격)
      tb.cellDecimal('부피', goods.단위부피)
      tb.cellDecimal('노동', goods.노동강도)

      var line = '원료:'
      line += LogUtil.format(goods.품질요인.원료품질, 3) .. ', 기술:'
      line += LogUtil.format(goods.품질요인.생산기술, 3)
      tb.cellText('품질요인', line)

      line = '가격:'
      line += LogUtil.format(goods.구매요인.가격, 3) .. ', 품질:'
      line += LogUtil.format(goods.구매요인.품질, 3) .. ', 상표:'
      line += LogUtil.format(goods.구매요인.상표, 3)
      tb.cellText('구매요인', line)

      tb.cellText('관련기술', goods.관련기술.toString())

      val 원료: string[] = []
      for (n <- 1 until 4) {
        if (goods.원료 != nil) {
          val g = goods.원료[n]
          if (g != nil) 원료.push(g.원료)
        }
      }
      tb.cellText('원료', 원료.toString())
    })
    return tb.toString()
  }

  /**
   *
   * @param goods
   * @returns
   */
  static def 상세정보(goods: Goods) => {
    val r: string[] = []
    r.push('재화: ' .. goods.name)
    r.push('  - 이미지: ' .. goods.이미지)
    r.push('  - 설명: ' .. goods.설명)
    r.push('  - 종류: ' .. goods.종류)
    r.push('  - 분류: ' .. goods.분류.toString())
    r.push('  - 품질요인: ' .. JSON.stringify(goods.품질요인))
    r.push('  - 구매요인: ' .. JSON.stringify(goods.구매요인))
    r.push('  - 관련기술: ' .. goods.관련기술.toString())
    r.push('  - 적정가격: ' .. goods.적정가격)
    r.push('  - 최소단위: ' .. goods.최소단위)
    r.push('  - 단위부피: ' .. goods.단위부피)
    r.push('  - 노동강도: ' .. goods.노동강도)

    if (goods.발육기간 != 0) r.push('  - 발육기간: ' .. goods.발육기간)
    if (goods.사료비용 != 0) r.push('  - 사료비용: ' .. goods.사료비용)
    if (goods.유체비용 != 0) r.push('  - 유체비용: ' .. goods.유체비용)

    if (goods.파종시기.기간 != 0) r.push('  - 파종시기: ' .. JSON.stringify(goods.파종시기))
    if (goods.수확시기.기간 != 0) r.push('  - 수확시기: ' .. JSON.stringify(goods.수확시기))

    if (goods.원료 != nil) {
      r.push('  - 해당 재화의 원료가 되는 다른 재화들')
      goods.원료.forEach(g => {
        r.push(`    * ${g.원료} - '단위': ${g.단위}`)
      })
    }

    val derived: Goods[] = Goods.getDerivedList(goods.name)
    if (derived.length != 0) {
      r.push('  - 해당 재화를 원료로 하는 다른 재화들')
      derived.forEach(g => {
        r.push('    * ' .. g.name)
      })
    }

    r.push('  - 해당 재화 판매 회사 리스트')
    return r.concat(
      this.특정재화판매회사리스트(goods.name).map(firmName => '    * ' .. firmName)
    )
  }

  /**
   *
   * @param goods
   * @returns
   */
  static def 특정재화판매회사리스트(goodsName: string)->string[] => {
    val r: string[] = []
    Firm.getFirmsList().forEach(firm => {
      if (firm.getProductList().includes(goodsName)) r.push(firm.name)
    })
    return r
  }

}
