%%
import assert from 'assert'
import { Goods } from './재화'
import { Firm } from './회사'
import { Corp } from './기업'
%%

export def Config => {
  /**
   *
   * @param deptType
   * @param corpName
   * @param firmName
   * @param prevDepts
   * @returns
   */
  static def availableGoodsList(
    deptType: string,
    corpName: string = '',
    firmName: string = '',
    prevDepts: string[] = []
  ) => {
    var goodsList: Goods[] = []
    deptType match {
      case '가공' =>
      case '제조' => {
        %%// 제조 부서와 제조 부서에서 파생된 가공 부서의 경우
        %%// 공급처의 재화를 보고 자신의 취급 가능한 재화를 구해야 한다.
        %%// 공급처의 재화를 원료로 하는 재화들이 이들 부서가 취급하는 재화가 된다.
        %%// 공급처의 설정이 아직 안되어져 있을 수 있는데 이 경우는 빈 배열이 리턴된다.
        val set = new Set<string>()
        prevDepts.forEach(d => {
          val dept = Firm.getDept(firmName, d)
          assert.notEqual(dept, nil, d)
          if (dept == nil) return;

          val goods = dept.제품종류()
          if (goods == '') return;
          set.add(goods)
        })

        val suppliedGoods = [...set]

        val corp = Corp.getCorp(corpName)
        assert.notEqual(corp, nil, corpName)
        val techList = corp!.보유기술.map(t => t.이름)

        goodsList = Goods.getGoodsListBySource(suppliedGoods, techList)
        break
      }
      case '채굴' => {
        goodsList = Goods.getGoodsList(['석유', '목재', '광물'])
        break
      }
      case '육성' => {
        goodsList = Goods.getGoodsList(['가축'])
        break
      }
      case '재배' => {
        goodsList = Goods.getGoodsList(['작물'])
        break
      }
    }
    return goodsList
  }

  /**
   *
   * @param firmType
   * @returns
   */
  static def availableDeptType(firmType: string) => {
    val deptTypes: string[] = []
    firmType match {
      case '공장' => {
        deptTypes.push('구매')
        deptTypes.push('제조')
        break
      }
      case '유정' =>
      case '벌목' =>
      case '광산' => {
        deptTypes.push('채굴')
        break
      }
      case '농장' => {
        deptTypes.push('재배')
        deptTypes.push('가공')
        break
      }
      case '목장' => {
        deptTypes.push('육성')
        deptTypes.push('가공')
        break
      }
      case '소매' => {
        deptTypes.push('구매')
        deptTypes.push('광고')
        break
      }
    }

    deptTypes.push('재고')
    deptTypes.push('판매')
    return deptTypes
  }

  /**
   *
   */
  private static var knownTech: string[] = ['냉장냉동기술', '목재가공기술', '석유화학기술', '제지기술']

  /**
   *
   */
  static def getKnownTech()-> string[] => {
    return this.knownTech
  }

  /**
   *
   * @param tech
   */
  static def addKnownTech(tech: string) => {
    if (!this.knownTech.includes(tech)) this.knownTech.push(tech)
  }
}
