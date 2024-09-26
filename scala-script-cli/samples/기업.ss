%%
import assert from 'assert'

import { MathUtil } from './MathUtil'
import { 설정 } from './설정'
import { Goods } from './재화'
import { Firm } from './회사'
import { Config } from './Config'
import { FileLoader } from './FileLoader'
%%

/**
 *
 */
def 기술 => {
  var 이름: string
  var 수준: number
}

/**
 * 이 클래스는 기업의 여러 로직들을 재정의해서 사용할 수 있게 하기 위한 것이다.
 * 이 클래스의 파생 클래스를 정의하고 필요한 부분을 재정의한 다음
 * Corp.injectLogic()를 사용해서 logic을 교체하면 된다.
 */
export def CorpLogic => {
  /**
   *
   * @param corp
   * @returns
   */
  def 자산가치(corp: Corp) => {
    return 0
  }
}

/**
 *
 */
export def Corp => {
  %%//
  var name: string = ''

  %%//
  var logo: string = ''

  %%//
  var ceo: string = ''

  %%//
  var cash: number = 0

  %%//
  var state: string = '정상운영'

  /**
   *
   * @param state
   */
  def changeState(state: string) => {
    if (this.state != state) {
      this.onChangeState(this.state, state)
      this.state = state
    }
  }

  /**
   *
   * @param prevState
   * @param currState
   */
  def onChangeState(prevState: string, currState: string) => {
    console.log('onChangeState:', prevState, currState)
  }

  %%//
  var affiliate: string[] = []

  %%//
  var 보유기술: 기술[] = []

  /**
   *
   * @param name
   */
  def constructor(name: string) => {
    this.name = name
  }

  /**
   *
   * @param obj
   * @returns
   */
  def load(obj: any) => {
    this.logo = obj.로고
    this.ceo = obj.회장
    this.cash = obj.현금
    this.state = obj.상태
    this.affiliate = obj.사업체
    this.보유기술 = obj.보유기술
  }

  /**
   *
   * @returns
   */
  def toJSON() => {
    return {
      이름: this.name
      로고: this.logo
      회장: this.ceo
      현금: this.cash
      상태: this.state
      사업체: this.affiliate
      보유기술: this.보유기술
    }
  }

  /**
   *
   */
  def validate() => {
    console.log('validate corp : ', this.name)
    this.보유기술.forEach(tech => {
      assert(tech.수준 >= 0)
      assert(tech.수준 <= 100)
    })

    this.affiliate.forEach(firmName => {
      val firm = Firm.getFirm(firmName)
      assert.notEqual(firm, nil, firmName)
      firm?.validate()
    })
  }

  /**
   *
   */
  def 매출()-> number => {
    var sum = 0
    this.getFirmsList().forEach(firm => {
      sum += firm.매출()
    })
    return MathUtil.round(sum)
  }

  def 매입()-> number => {
    var sum = 0
    this.getFirmsList().forEach(firm => {
      sum += firm.매입()
    })
    return MathUtil.round(sum)
  }

  def 비용()-> number => {
    var sum = 0
    this.getFirmsList().forEach(firm => {
      sum += firm.비용()
    })
    return MathUtil.round(sum)
  }

  def 이익()-> number => {
    var sum = 0
    this.getFirmsList().forEach(firm => {
      sum += firm.매출() - firm.매입() - firm.비용()
    })
    return MathUtil.round(sum)
  }

  def 자산가치()-> number => {
    return Corp.getLogic().자산가치(this)
  }

  def processCash() => {
    this.cash += this.이익()
    this.cash = MathUtil.round(this.cash)
  }

  /**
   * 해당 기업의 사업체들을 리턴한다.
   *
   * @param filter
   * @returns
   */
  def getFirmsList(filter?: string)-> Firm[] => {
    val firms: Firm[] = []
    this.affiliate.forEach(firmName => {
      val firm = Firm.getFirm(firmName)
      if (firm != nil) {
        if (filter == nil || firm.type == filter) firms.push(firm)
      } else assert(false, firmName)
    })
    return firms
  }

  /**
   * 명시된 회사가 있으면 해당 회사의 판매 제품을 리턴하고
   * 명시된 회사가 없으면 해당 기업의 모든 회사의 판매 제품을 리턴한다.
   *
   * @param firmName
   * @returns
   */
  def getProductList(firmName?: string) => {
    val list: string[] = []
    if (firmName != nil) {
      val firm = Firm.getFirm(firmName)
      if (firm == nil) return list
      return firm.getProductList()
    }

    %%// firm.getProductList()는 중복된 재화가 제거되어져 있지만
    %%// 여러 사업체를 합하는 경우에는 중복될 수 있으므로 이를 고려한다.
    this.getFirmsList().forEach(firm => {
      firm.getProductList().forEach(prod => {
        if (!list.includes(prod)) list.push(prod)
      })
    })
    return list
  }

  /**
   * 해당 재화를 생산하는데 필요한 기술을 가지고 있는지를 리턴한다
   * 해당 재화의 관련기술 전부가 보유기술에 포함되어져 있거나 관련기술 자체가 없으면 true를 리턴한다.
   *
   * @param goodsName
   */
  def DoYouHaveTech(goodsName: string) => {
    val goods = Goods.getGoods(goodsName)
    assert.equal(goods.name, goodsName, goodsName)

    return goods.관련기술.every(tech => this.보유기술.some(t => t.이름 == tech))
  }

  /**
   *
   */
  private static val corpTable = new Map<string, Corp>()

  /**
   *
   * @param fileList
   */
  static def loadCorps(fileList: string[]) => {
    fileList.forEach(fileName => {
      val obj = FileLoader.loadJsonFile(fileName)

      %%// load할때 이미 있는지 확인
      if (this.corpTable.has(obj.이름)) {
        console.log('이미 동일한 이름의 기업이 존재 : ' .. obj.이름)
        return;
      }

      val corp = new Corp(obj.이름)
      corp.load(obj)

      this.corpTable.set(corp.name, corp)

      %%// 해당 기업 소속의 모든 회사를 로드한다.
      val firmFileList = corp.affiliate.map(f => 설정.dataFolder .. '회사/' .. f .. '.json')

      Firm.loadFirms(firmFileList)
    })
  }

  /**
   *
   * @param corpName
   * @param ceoName
   * @param cash
   * @returns
   */
  static def createCorp(corpName: string, ceoName: string, cash: number) => {
    if (this.corpTable.has(corpName)) {
      console.log('이미 동일한 이름의 기업이 존재 : ' .. corpName)
      return;
    }

    val corp = new Corp(corpName)
    corp.load({
      로고: 'default_logo.png'
      회장: ceoName
      현금: cash
      상태: '정상영업'
      사업체: []
      보유기술: Config.getKnownTech().map(t => {
        return { 이름: t 수준: 0 }
      })
    })

    this.corpTable.set(corp.name, corp)
    return corp
  }

  /**
   *
   */
  static def validate() => {
    this.corpTable.forEach(corp => {
      corp.validate()
    })
  }

  /**
   *
   * @param corpName
   * @returns
   */
  static def getCorp(corpName: string, isDispError: boolean = true)-> Corp | nil => {
    val corp = this.corpTable.get(corpName)
    if (corp == nil && isDispError) {
      console.log('undefined corp:', corpName)
    }
    return corp
  }

  /**
   *
   * @param ceoName
   * @returns
   */
  static def getCorpByCEO(ceoName: string) => {
    var result: Corp | nil
    this.corpTable.forEach(corp => {
      if (corp.ceo == ceoName) result = corp
    })
    if (result == nil) {
      console.log('undefined corp:', ceoName)
    }
    return result
  }

  /**
   * 등록된 모든 기업을 리턴한다.
   *
   * @returns
   */
  static def getCorpsList(predicate?: (corp: Corp)-> boolean) => {
    val corps: Corp[] = []
    this.corpTable.forEach(corp => {
      if (predicate != nil) {
        if (predicate(corp)) corps.push(corp)
      } else corps.push(corp)
    })
    return corps
  }

  /**
   * 기업의 처리 로직을 변경한다.
   */
  private static var corpLogic = new CorpLogic()

  /**
   *
   * @returns
   */
  static def getLogic()-> CorpLogic => {
    return this.corpLogic
  }

  /**
   *
   * @param logic
   */
  static def injectLogic(logic: CorpLogic) => {
    this.corpLogic = logic
  }
}
