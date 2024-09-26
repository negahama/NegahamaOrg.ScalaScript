%%
import assert from 'assert'
import { FileLoader } from './FileLoader'
%%

/**
 * 제품의 품질을 결정하는 2가지 요인이 원료품질과 생산기술의 *비율*이다
 */
export def 품질요인비율 => {
  var 원료품질: number
  var 생산기술: number
}

/**
 * 소비자가 상품을 구매할 때 고려하는 구매 요인인 가격, 품질, 상표의 *비율*이다.
 */
export def 구매요인비율 => {
  var 가격: number
  var 품질: number
  var 상표: number
}

/**
 * 단위는 해당 원료를 얼마정도 투입해야 하는가를 말한다.
 * 예를 들어 단위가 2이면 해당 원료 2개로 현재 제품을 만든다는 의미이다.
 * 당연히 이 2개라는 의미는 해당 원료의 기본 단위가 2개 필요하다는 의미이다.
 * 그리고 그것으로 현재 제품도 기본 단위 1개가 생산된다.
 *
 * 그런데 몇몇 재화는 이 단위를 다른 의미로 사용한다.
 * 거의 모든 재화는 다른 재화를 소비하면서 자신이 생산되지만 우유, 계란, 양모 같은 일부 재화는
 * 원자재에 해당하는 소, 닭, 양을 도축하지 않고 생산될 수 있다. 따라서 이런 경우에는
 * 단위는 가축(성체만 의미함) 한 마리당 해당 재화를 얻을 수 있는 양을 의미한다.
 */
def 원료와단위 => {
  var 원료: string
  var 단위: number
}

/**
 *
 */
export def Goods => {
  /**
   * 재화의 고유한 이름(치약, 칫솔, 비누, 샴푸, 자동차, 바퀴, 엔진 등등..)을 입력한다.
   * 재화명은 개별 제품의 이름이 아니다. 이것은 그런 류의 제품에 대한 일반적인 이름으로써
   * 예를 들면 콜라라고 하는 것이지 펩시 콜라나 코카 콜라라고 하지 않는다는 것이다.
   * 재화명은 재화를 구분하는 ID이기 때문에 없을 수 없으며 중복될 수도 없다.
   * 재화명으로 설정 파일이 저장되기 때문에 파일명으로 사용할 수 없는 특수 문자도 사용할 수 없다.
   * 사실 재화명에 특수 문자를 쓰는 것 자체가 자연스럽지 못하다.
   * 특별히 글자 제한이 없으나 지나치게 긴 재화명은 표시될 때 문제가 되므로 적절히 제한하면 된다.
   */
  var name: string = ''

  /**
   * 해당 재화에 사용되어질 이미지 파일의 위치를 포함한 이름이다.
   * 특별히 지정되어져 있지 않다면 디폴트 이미지가 표시되어져야 하며,
   * 폴더가 명시되지 않으면 이미지를 모아 둔 디폴트 폴더에서 파일명만으로 검색한다.
   * 이미지 파일의 형식과 크기등의 문제는 실제 구현 과정에서 정하면 된다.
   */
  var 이미지: string = ''

  /**
   * 해당 재화에 대한 설명이다.
   * 이 설명은 유저에게 보여지는 것을 전제로 하고 있다.
   * 만약 내부적으로만 사용되어야 할 설명을 추가하고픈 경우에는
   * 설명 부분에 별도의 마킹을 하고 나중에 파싱을 해서 사용하는 것을 생각해 볼 수 있다.
   * 아울러 설명을 html 형식으로 입력해서 이쁘게 표시하고 싶을 수도 있다.
   * 이런 경우에는 이미지처럼 html 파일명이나 url 을 입력해서 별도의 파일로 처리해야 한다.
   * 재화의 정보가 json형태로 저장되기 때문에 설명 부분이 string으로 처리되므로 string안에 html 등을 담는 건 부담이 된다.
   */
  var 설명: string = ''

  /**
   * 재화의 종류는 소비를 시뮬레이션할 때 필요한 정보이다.
   * 먼저 해당 재화가 자원이면 어떤 종류의 자원인지를 명시하면 되고 중간재이면 그냥 중간재라고 하면 된다.
   * 소비재이면 생필품인지, 기호품인지등을 명시하면 된다.
   * 종류에 대한 자세한 설명은 [[재화#재화의 종류]] 항목을 참고한다.
   */
  var 종류: string = ''

  /**
   * 사용자가 정의한 분류 정보를 담고 있다.
   * 이것은 여러 개의 값을 가질 수 있으며 분류 정보는 유효화 검사를 하지 않는다.
   * 분류에 대한 자세한 설명은 [[재화#재화의 분류]] 항목을 참고한다.
   */
  var 분류: string[] = []

  /**
   * 제품을 만드는데 필요한 원료들과 그들의 단위를 입력한다.
   * 이것은 최대 3가지로써 4개 이상의 원료로 만들어지는 제품은 처리되지 않는다.
   * 해당 재화를 만드는데 1가지 원료만 필요하면 하나만 입력하면 된다.
   * 하나의 재화를 생산하기 위해서 여러 원자재가 필요한 경우 즉 한 단위의 제품 C를 생산하기 위해서
   * A, B의 원료가 필요하다고 했을 때 문제는 A가 얼마나 필요한가를 어떻게 결정하는가 하는 것이다.
   * 이를 처음에는 단순히 A, B의 비율만 있으면 될 것으로 생각했지만
   * 재화에는 기본 단위(생산 또는 판매시 최소단위)가 있기 때문에 비율만으로는 안된다.
   * A, B 한 단위씩을 투입해서 C 한 단위를 만드는 경우가 비율이 50 : 50이 된다는 것인데
   * A, B의 단위가 다르기 때문에 아무 의미가 없는 표현이다.
   * 원료의 비율이라는 개념 자체가 의미가 없다.
   * 그래서 원료의 단위를 명시한다.
   */
  var 원료: 원료와단위[] = []

  /**
   * 제품의 품질은 원자재의 품질과 생산기술이라는 두 가지의 요소가 좌우한다.
   * 이 항목은 품질에 원료와 기술이 차지하는 비율을 결정한다.
   * 두 부분이 합쳐서 100이 되어야 한다.
   * 디폴트 값은 50 : 50이다.
   */
  var 품질요인: 품질요인비율 = {
    원료품질: 0
    생산기술: 0
  }

  /**
   * 재화의 성격에 따라서 소비자가 해당 재화를 구매할때 고려하는 3가지 요인의 비율이
   * 다르기 때문에 재화마다 이 정보가 있어야 한다. [[소비]] 항목을 참고한다.
   * 구매요인의 항목은 가격, 품질, 상표 이며 이들의 합은 반드시 100이 되어야 한다.
   * 디폴트 값은 모든 항목을 동일하게 고려하는 34 : 33 : 33이다.
   */
  var 구매요인: 구매요인비율 = {
    가격: 0
    품질: 0
    상표: 0
  }

  /**
   * 해당 재화를 생산하는데 필요한 기술이다.
   * 관련 기술이 여러 개일 수도 있는데 이 경우에는 기술력들의 평균이 사용된다.
   */
  var 관련기술: string[] = []

  /**
   * 해당 재화의 최소 단위에 대한 적정 시장 가격이다.
   * 적정 가격은 부서가 해당 재화의 판매가를 결정할 때 필요하다.
   * 유저가 정하는 경우에는 유저 마음이지만 시스템으로 운영되는 경우에는 가격을 정하기가 어렵다.
   * NPC 기업들에게는 꼭 필요한 정보이다.
   * 여러 재화들을 이용해서 제조를 하는 경우 해당 원자재들의 가격으로 새로운 가격을 결정할 수 있지만
   * 이 원자재의 가격은 어떻게 결정할까? 거슬러 올라가면 자원의 가격으로 가게 되는데 자원들의 가격으로
   * 모든 제품의 가격을 조정하는 것은 어렵다. 그리고 자원의 가격도 중요하지만 많은 경우 새로운 재화는
   * 기존 원자재의 가격을 단순히 더한 것이 아니다. 부가가치가 붙는다.
   * 따라서 상품의 가격을 조정하고 부가 가치등을 구현하기 위해서라도 적정 가격이 필요하다.
   * 그리고 유저들에게도 적정 가격은 중요하다. NPC 회사들이 이 가격으로 동작하므로 유저들도 이 가격을 기준으로 삼을 수 밖에 없다.
   * 이 값은 실세계에서의 값을 참고로 하면 된다. 단 최소단위가 동일해야만 하다.
   * 즉 비누 낱개 하나의 가격이 1000원이라고 할 때 비누라는 재화의 최소단위가 10개 묶음이라고 하면
   * 이 적정 가격은 10000원이어야 한다는 것이다.
   */
  var 적정가격: number = 0

  /**
   * 재화가 생산 또는 판매되는 최소 단위를 설정한다.
   * 이것은 재화들의 양을 맞추기 위한 것으로써 아주 작은 양도 판매가 가능한 것들,
   * 예를 들면 연필 같은 것들은 타스 또는 묶음으로써 설정함으로써 재화들간의 양과 가격의 지나친 차이를 줄이는 역할을 한다.
   * 또한 유저들에게 단위를 제공한다. 즉 여기서 대, 개, 타스, 되, 말,…등의 실세계 단위를 제공한다.
   * 따라서 여기서 입력할 값은 1개, 10묶음, 1가마니 등등이 될 것이다.
   * 이것은 단지 모두에게 기준으로써 참고되는 표시용 정보이다.
   */
  var 최소단위: string = ''

  /**
   * 제품이 차지하는 부피. 재고량과 밀접한 관련이 있다.
   * 부피를 결정하는 기준이 있어야 한다.
   * 아직 최소 부피의 품목과 최대 부피의 품목이 정해지지 않았으나
   * CPU와 같은 제품을 최소의 부피 1로하고 자동차를 최대의 부피 1000으로 정할 수 있다.
   */
  var 단위부피: number = 0

  /**
   * 해당 재화를 생산하는데 필요한 노동의 정도를 의미한다.
   * 노동의 정도가 높은 재화일수록 동일한 조건일때 생산되는 양이 줄어들게 된다.
   * 즉 동일한 공장에서 만들 수 있는 자동차의 개수는 연필의 수보다 훨씬 작다.
   * 노동집약도 라고 할 수도 있다.
   *
   * 일인당 생산량이라고 할 수도 있다.
   * 한 사람이 해당 재화를 생산할 경우 얼마큼 생산할 수 있는지를 나타내는 것으로 동일한 개념이고
   * 어떤 면에서는 이 명칭이 더 정확하기도 하지만 일인당 생산량이라고 하면 오해의 소지가 크고 값을 정하기가 어렵다.
   *
   * 노동집약도도 결정하는데 기준이 필요하다.
   * 비교적 생산하기 쉬운 재화를 1로 하고 상대적인 비율로 결정해야 한다.
   */
  var 노동강도: number = 0

  /**
   * 재화가 자원인 경우 특히 축산물인 경우에만 사용되는 속성이다.
   * 발육기간은 일수이다.
   */
  var 발육기간: number = 0

  /**
   * 재화가 자원인 경우 특히 축산물인 경우에만 사용되는 속성이다.
   * 사료비용은 가축 한 마리당 하루 비용이므로 가축들의 일반적인 사료비용에 발육기간을 나눠서 사용한다.
   */
  var 사료비용: number = 0

  /**
   * 재화가 자원인 경우 특히 축산물인 경우에만 사용되는 속성이다.
   * 유체비용은 새끼 가축을 구입하는 비용이다.
   * 가축들이 새끼를 낳기 때문에 이 항목이 이상할 수 있는데
   * 이 항목이 없으면 빠른 시간내에 유체를 채우고 지속적으로 유체를 보충하는 것이 현실적이지 않게 된다.
   * 아울러 이 비용이 없으면 가축을 사육하는 것은 하늘에서 가축들이 떨어지는 격이라 이윤이 너무 많이 남게 된다.
   */
  var 유체비용: number = 0

  /**
   * 파종시기와 수확시기는 재화가 농산물인 경우에만 사용되는 속성이다.
   * 시작과 기간을 가지고 있는데 시작은 해당 월이고 기간은 일이다.
   * 즉 파종 시작의 값이 3이고 기간이 30이면 3월부터 30일까지 파종이 가능하다.
   */
  var 파종시기: {
    var 시작: number
    var 기간: number
  } = {
    시작: 0
    기간: 0
  }
  var 수확시기: {
    var 시작: number
    var 기간: number
  } = {
    시작: 0
    기간: 0
  }

  /**
   *
   * @param obj
   * @returns
   */
  def load(obj: any) => {
    this.name = obj.이름
    this.이미지 = obj.이미지
    this.설명 = obj.설명
    this.종류 = obj.종류
    this.분류 = obj.분류
    this.원료 = obj.원료
    this.품질요인 = obj.품질요인
    this.구매요인 = obj.구매요인
    this.관련기술 = obj.관련기술
    this.적정가격 = obj.적정가격
    this.최소단위 = obj.최소단위
    this.단위부피 = obj.단위부피
    this.노동강도 = obj.노동강도

    if (obj.발육기간 != nil) this.발육기간 = obj.발육기간
    if (obj.사료비용 != nil) this.사료비용 = obj.사료비용
    if (obj.유체비용 != nil) this.유체비용 = obj.유체비용
    if (obj.파종시기 != nil) this.파종시기 = obj.파종시기
    if (obj.수확시기 != nil) this.수확시기 = obj.수확시기

    assert.notEqual(this.name, nil)
    assert.notEqual(this.종류, nil)
    assert.notEqual(this.분류, nil)
    %%// assert.notEqual(this.원료, nil)
    assert.notEqual(this.품질요인, nil)
    assert.notEqual(this.구매요인, nil)
    assert.notEqual(this.적정가격, nil)
    assert.notEqual(this.최소단위, nil)
    assert.notEqual(this.단위부피, nil)
    assert.notEqual(this.노동강도, nil)

    if (obj.관련기술 == nil) this.관련기술 = []
  }

  /**
   *
   */
  def validate() => {
    console.log('validate goods : ', this.name)
    assert.equal(this.품질요인.원료품질 + this.품질요인.생산기술, 100)
    assert.equal(this.구매요인.가격 + this.구매요인.품질 + this.구매요인.상표, 100)

    if (this.원료 != nil) {
      this.원료.forEach(material => {
        assert.equal(Goods.getGoods(material.원료).name, material.원료, material.원료)
      })
    }
  }

  /**
   *
   */
  private static val goodsTable = new Map<string, Goods>()

  /**
   * 아톰은 등록되지 않은 재화명으로 재화를 구할 때 디폴트로 리턴되는 개체이다.
   * 아톰은 재화정보가 있는지 없는지 매번 검사하고 없으면 예외처리하는 것을 줄여주지만
   * 재화명을 검사해서 자신이 요청한 재화가 맞는지 확인하는 과정을 없앨 수는 없다.
   */
  private static var atom: Goods

  /**
   *
   * @param fileList
   */
  static def loadGoods(fileList: string[]) => {
    fileList.forEach(fileName => {
      val obj = FileLoader.loadJsonFile(fileName)
      if (obj == nil) {
        console.log("Can't load goods file : " .. fileName)
        return;
      }

      %%// load할때 이미 있는지 확인
      if (this.goodsTable.has(obj.이름)) {
        console.log('이미 동일한 이름의 재화가 존재 : ' .. obj.이름)
        return;
      }

      val goods = new Goods()
      goods.load(obj)

      this.goodsTable.set(obj.이름, goods)
    })

    this.atom = new Goods()
    this.atom.name = 'atom'
    this.atom.종류 = 'atom'
    this.atom.설명 =
      '어떤 재화도 선택되지 않은 상태의 재화이다. 어디에도 속하지 않으며 재화에 대한 가장 기본적인 값들로 구성되어져 있다.'
    this.atom.단위부피 = 1
    this.atom.노동강도 = 1
  }

  /**
   *
   * @param goodsName
   * @param isDispError
   * @returns
   */
  static def getGoods(goodsName: string, isDispError: boolean = true)-> Goods => {
    val goods = this.goodsTable.get(goodsName)
    if (goods == nil) {
      if (isDispError) console.log('undefined goods:', goodsName)
      return this.atom
    }
    return goods
  }

  /**
   * 명시된 종류의 모든 재화를 리턴한다.
   * 종류는 재화 종류일 수도 있고 재화의 분류일 수도 있다.
   * 종류가 명시되지 않으면 등록된 모든 종류의 재화를 리턴한다.
   *
   * @param kind
   * @returns
   */
  static def getGoodsList(kind?: string[])-> Goods[] => {
    val values = this.goodsTable.values()
    if (kind == nil) {
      return [...values]
    } else {
      val result: Goods[] = []
      for (goods <- values) {
        %%// kind는 재화의 종류일 수도 있고 분류 항목일 수도 있다.
        %%// kind의 모든 값을 확인해야 할 필요는 없다.
        if (kind.some(k => goods.종류 == k || goods.분류.includes(k))) result.push(goods)
      }
      return result
    }
  }

  /**
   * 명시된 재화들로 만들 수 있는 모든 재화를 리턴한다.
   * tech까지 명시되어져 있으면 관련 기술까지 확인한다.
   * 관련 기술이 없는 재화이면 관련 기술 확인시 포함된다는 점에 주의한다.
   *
   * @param source
   * @param tech
   * @returns
   */
  static def getGoodsListBySource(source: string[], tech?: string[]) => {
    val result: Goods[] = []
    this.goodsTable.forEach(goods => {
      if (goods.원료 == nil) return;
      if (goods.원료.every(m => source.includes(m.원료))) result.push(goods)
    })

    if (tech == nil) return result
    else {
      val result2: Goods[] = []
      result.forEach(goods => {
        %%// goods.관련기술이 빈 배열이면 [].every()는 true이다.
        if (goods.관련기술.every(t => tech.includes(t))) result2.push(goods)
      })
      return result2
    }
  }

  /**
   * 명시된 기술들로 만들 수 있는 모든 재화를 리턴한다.
   *
   * @param tech
   * @returns
   */
  static def getGoodsListByTech(tech: string[]) => {
    val result: Goods[] = []
    this.goodsTable.forEach(goods => {
      if (goods.관련기술.every(t => tech.includes(t))) result.push(goods)
    })
    return result
  }

  /**
   * 모든 기술의 이름을 리턴한다
   *
   * @param goodsName
   * @returns
   */
  static def getAllTech() => {
    var set = new Set<string>()
    this.goodsTable.forEach(goods => {
      goods.관련기술.forEach(set.add, set)
    })
    return [...set]
  }

  /**
   * 재화의 모든 분류항목들의 리스트를 리턴한다.
   *
   * @returns
   */
  static def getCategoryList() => {
    val set = new Set<string>()
    this.goodsTable.forEach(goods => {
      goods.분류.forEach(set.add, set)
    })
    return [...set]
  }

  /**
   * 해당 재화를 원료로 하는 모든 재화의 리스트를 리턴한다.
   *
   * @param goodsName
   * @returns
   */
  static def getDerivedList(goodsName: string)-> Goods[] => {
    val result: Goods[] = []
    this.goodsTable.forEach(goods => {
      if (goods.원료 == nil) return;
      if (goods.원료.some(s => s.원료 == goodsName)) result.push(goods)
    })
    return result
  }

  /**
   *
   */
  static def validate() => {
    this.goodsTable.forEach(goods => {
      goods.validate()
    })
  }
}
