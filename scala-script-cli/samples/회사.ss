%%
import assert from 'assert'

import { MathUtil } from './MathUtil'
import { SimDate } from './SimDate'
import { Rsrc } from './자원'
import { Corp } from './기업'
import { Dept } from './부서'
import { DeptFactory } from './DeptFactory'
import { Config } from './Config'
import { FileLoader } from './FileLoader'
%%

/**
 * 부서가 회사에 알려야 할 사항들에 대한 정보
 */
export def 알림 => {
  var 회사: string
  var 부서: string
  var 언제: SimDate
  var 무엇: string
  var 상세: string
}

/**
 *
 */
def Building => {
  var 종류: string
  var 부대시설: string[]
}

/**
 * 이 클래스는 회사의 여러 로직들을 재정의해서 사용할 수 있게 하기 위한 것이다.
 * 이 클래스의 파생 클래스를 정의하고 필요한 부분을 재정의한 다음
 * Firm.injectLogic()를 사용해서 logic을 교체하면 된다.
 */
export def FirmLogic => {
  /**
   *
   * @param firm
   * @returns
   */
  def 자산가치(firm: Firm) => {
    return 0
  }

  /**
   *
   * @param firm
   * @returns
   */
  def availableDeptType(firm: Firm)-> string[] => {
    return Config.availableDeptType(firm.type)
  }
}

/**
 *
 */
export def Firm => {
  %%//
  var name: string = ''

  %%//
  var type: string = '없음'

  %%//
  var corpName: string = ''

  /**
   *
   */
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
  var boss: string = ''

  %%//
  var building: Building = {
    종류: ''
    부대시설: []
  }

  %%//
  private var deptList: Dept[] = []

  %%// 부서가 회사에 알려야 할 사항이 있으면 이것을 사용한다.
  var 알림: 알림[] = []

  def 보고하기(who: string, when: SimDate, what: string, info: string = '') => {
    this.알림.push({
      회사: this.name
      부서: who
      언제: when
      무엇: what
      상세: info
    })
  }

  %%//
  var 자원: string = ''

  /**
   *
   * @param rsrcName
   * @returns
   */
  def setRsrc(rsrcName: string) => {
    if (this.type == '공장' || this.type == '소매') return;

    assert.notEqual(rsrcName, nil)
    if (rsrcName == nil) return;

    val rsrc = Rsrc.getRsrc(rsrcName)
    assert.notEqual(rsrc, nil, rsrcName)
    if (rsrc == nil) return;

    this.type match {
      case '유정' => {
        assert.equal(rsrc.종류, '유전')
        break
      }
      case '벌목' => {
        assert.equal(rsrc.종류, '벌목지')
        break
      }
      case '광산' => {
        assert.equal(rsrc.종류, '채광지')
        break
      }
      case '목장' => {
        assert.equal(rsrc.종류, '목축지')
        break
      }
      case '농장' => {
        assert.equal(rsrc.종류, '농경지')
        break
      }
    }
    this.자원 = rsrc.이름
  }

  /**
   *
   * @param name
   * @param type
   * @param corp
   */
  def constructor(name: string, type: string, corp: string) => {
    this.name = name
    this.type = type
    this.corpName = corp
  }

  /**
   *
   * @param obj
   * @returns
   */
  def load(obj: any) => {
    if (obj.상태 != nil) this.state = obj.상태
    if (obj.사장 != nil) this.boss = obj.사장

    this.building = obj.건물

    %%// 공장과 소매점을 제외한 다른 종류의 회사는 회사가 생성될 때 천연자원과 연결되어 있어야 한다.
    if (!(obj.종류 == '공장' || obj.종류 == '소매')) {
      assert.notEqual(obj.자원, nil, obj.종류)
      this.setRsrc(obj.자원)
    }

    %%// DeptFactory에서 dept 개체를 받아서 load 하고 부서에 추가한다
    obj.부서.forEach((d: any) => {
      val dept = DeptFactory.createDept(this, d.종류)
      if (dept == nil) {
        console.log('undefined dept:', d.이름, d.종류)
        return;
      }

      dept.load(d)
      this.deptList.push(dept)
    })

    %%// 부서에 대한 로드가 다 끝난 다음에야 할 수 있는 것들이 있으면 처리할 기회를 제공한다.
    this.deptList.forEach(dept => {
      dept.postload()
    })

    this.알림 = []
    if (obj.알림 != nil) this.알림 = obj.알림
  }

  /**
   *
   * @returns
   */
  def toJSON() => {
    return {
      이름: this.name
      종류: this.type
      기업: this.corpName
      상태: this.state
      사장: this.boss
      건물: {
        종류: this.building.종류
        부대시설: this.building.부대시설
      }
      자원: this.자원
      알림: this.알림
      부서: this.deptList
    }
  }

  /**
   *
   */
  def validate() => {
    console.log('validate firm : ', this.name)
    val corp = Corp.getCorp(this.corpName)
    assert.notEqual(corp, nil)
    this.deptList.forEach(dept => {
      dept.validate()
    })
  }

  /**
   *
   */
  def process_초기화() => {
    Firm.forwardProcessOrder.forEach(type => {
      this.deptList.filter(d => d.type == type).forEach(d => d.process_초기화())
    })
  }
  def process_출고() => {
    Firm.forwardProcessOrder.forEach(type => {
      this.deptList.filter(d => d.type == type).forEach(d => d.process_출고())
    })
  }
  def process_입고() => {
    Firm.forwardProcessOrder.forEach(type => {
      this.deptList.filter(d => d.type == type).forEach(d => d.process_입고())
    })
  }
  def process_자체() => {
    Firm.forwardProcessOrder.forEach(type => {
      this.deptList.filter(d => d.type == type).forEach(d => d.process_자체())
    })
  }
  def process_발주() => {
    Firm.backwardProcessOrder.forEach(type => {
      this.deptList.filter(d => d.type == type).forEach(d => d.process_발주())
    })
  }

  /**
   *
   * @param deptName
   * @param isDispError
   * @returns
   */
  def getDept(deptName: string, isDispError: boolean = true)-> Dept | nil => {
    val dept = this.deptList.find(d => d.name == deptName)
    if (dept == nil) {
      if (isDispError) console.log('undefined dept:', deptName)
      return nil
    }
    return dept
  }

  /**
   *
   * @returns
   */
  def getDeptList() => {
    return this.deptList
  }

  /**
   * 회사 단위의 수입, 지출은 모든 부서의 수입, 지출을 더한 값이긴 하지만
   * 각 부서들이 주고 받는 금액이 상쇄되지 않아 올바른 값이라고 할 수 없다.
   * 내부 부서간 거래는 비용으로 잡지 않아야 한다.
   *
   * 이때 각 부서마다 얼마간의 마진을 챙길 수 있는데 이 경우는 내부 판매에서도 수입이 발생하므로
   * 이를 고려해야 하는 줄 알았다. 하지만 마진이란 수입과 지출에 포함된 개념이어서 고려할 필요가 없다.
   * 즉 각 부서가 제품을 얼마에 들여오고 얼마에 팔았는지만 중요하다.
   */
  def 매출()-> number => {
    %%// 모든 부서의 매출 내역에서 내부 거래가 아닌 것의 총합을 구하면 해당 회사의 매출액이 된다.
    var sum = 0
    this.deptList.forEach(d => {
      d.매출().내역.forEach(e => {
        if (e.회사 != this.name) sum += e.가격 * e.수량
      })
    })
    return MathUtil.round(sum)
  }

  def 매입()-> number => {
    var sum = 0
    this.deptList.forEach(d => {
      d.매입().내역.forEach(e => {
        if (e.회사 != this.name) sum += e.가격 * e.수량
      })
    })
    return MathUtil.round(sum)
  }

  def 비용()-> number => {
    var sum = 0
    this.deptList.forEach(d => {
      sum += d.비용.합계()
    })
    return MathUtil.round(sum)
  }

  def 이익()-> number => {
    return MathUtil.round(this.매출() - this.매입() - this.비용())
  }

  /**
   * 해당 회사가 취급하는 재화의 리스트를 리턴한다.
   * 이것은 판매 부서들이 취급하는 재화를 리턴하면 된다.
   */
  def getProductList() => {
    val saleDepts: Dept[] = this.deptList.filter((dept:Dept) => dept.type == '판매')

    %%// 중복된 재화는 제거한다.
    val set = new Set<string>()

    saleDepts.forEach(dept => {
      if (dept.제품종류() == '') return;
      set.add(dept.제품종류())
    })
    return [...set]
  }

  /**
   * 새로운 부서를 추가한다.
   * 이전에는 디폴트 설정되어진 파일에서 정보를 읽어서 생성했는데 지금은 그냥 생성한다.
   * 하지만 확장을 위해서 이전 코드를 남겨둔다.
   *
   * 또 생성하기 전에 해당 부서를 해당 회사에서 만들 수 있는 것인지를 확인하기 위해서
   * firm.availableDeptType()을 호출하는데 이 함수는 FirmLogic의 함수이다.
   * 즉 어느 회사에 어떤 부서가 생성가능한지는 어느정도 재정의할 수 있다.
   *
   * @param deptKind
   * @param deptName
   * @returns
   */
  def addDept(deptKind: string, deptName?: string) => {
    val deptTypes = Firm.getLogic().availableDeptType(this)
    if (!deptTypes.includes(deptKind)) {
      console.log('invalid deptKind in this firm', deptKind, this.type)
      return;
    }

    val dept = DeptFactory.createDept(this, deptKind)
    if (dept == nil) {
      console.log('undefined firm:', deptKind)
      return;
    }

    %%// val fileName = DeptFactory.deptFileNameMap.get(deptKind)
    %%// if (fileName == undefined) return
    %%// val file = fs.readFileSync(fileName, 'utf8')
    %%// val obj = JSON.parse(file)
    %%// console.log(obj)

    var obj: any = {
      종류: deptKind
    }

    if (deptName != nil) {
      obj = { 이름: deptName ...obj }
    }

    dept.load(obj)

    this.deptList.push(dept)
    return dept
  }

  /**
   * 부서의 이름을 명시하지 않으면 디폴트로 기업명-회사명-취급재화명-부서종류-내부인덱스로 정해진다.
   * 이때 사용되는 내부 인덱스의 값이다. 부서의 이름은 부서가 로드될때 처리하는데
   * 이 값은 부서가 가질 수 없어서 회사가 가지고 있다.
   */
  private var deptIndex: number = 0
  def newDeptID()-> number => {
    this.deptIndex += 1
    return this.deptIndex
  }

  /**
   *
   * @param goodsName
   * @returns
   */
  def newDeptName(goodsName: string | nil) => {
    var deptName = this.name .. '-'
    if (goodsName != nil) deptName += goodsName .. '-'
    deptName += this.type .. '-'
    deptName += this.newDeptID().toString().padStart(2, '0')
    return deptName
  }

  /**
   * 상품의 이름은 회사명-재화명-내부인덱스를 사용한다.
   * 같은 회사에서 같은 재화의 상품을 판매할 수 있기 때문에 이 내부인덱스는 상품을 구분하는데 중요한 역할을 한다.
   * 이 내부 인덱스는 판매 부서에서 결정할 수 없기 때문에 회사가 가지고 있다.
   */
  private var prodIndex: number = 0
  def newProdID()-> number => {
    this.prodIndex += 1
    return this.prodIndex
  }

  /**
   * 기업명과 재화명으로만 구성된 상품명으로 시작하는 다른 상품이 있는지를 검사한 다음 있으면 인덱스를 증가시키고 추가한다.
   *
   * @param goodsName
   * @returns
   */
  def newProdName(goodsName: string, prevProdName: string) => {
    return this.name .. '-' .. goodsName %%// 아직 다 구현하지 않음
  }

  /**
   * 전방향, 역방향시 부서들의 처리 순서
   */
  static var forwardProcessOrder: string[] = [
    '구매',
    '채굴',
    '육성',
    '재배',
    '가공',
    '제조',
    '재고',
    '판매'
  ]

  static var backwardProcessOrder: string[] = [
    '판매',
    '재고',
    '제조',
    '가공',
    '재배',
    '육성',
    '채굴',
    '구매'
  ]

  /**
   *
   */
  private static var firmTable = new Map<string, Firm>()

  /**
   *
   */
  static def loadFirms(fileList: string[]) => {
    fileList.forEach(fileName => {
      val obj = FileLoader.loadJsonFile(fileName)

      %%// load할때 이미 있는지 확인
      if (this.firmTable.has(obj.이름)) {
        console.log('이미 동일한 이름의 회사가 존재 : ' + obj.이름)
        return;
      }

      val 종류 = obj.종류
      val firm = new Firm(obj.이름, 종류, obj.기업)
      firm.load(obj)

      this.firmTable.set(firm.name, firm)
    })
  }

  /**
   *
   * @param corpName
   * @param firmType
   * @param firmName
   * @param rsrcName
   * @returns
   */
  static def createFirm(corpName: string, firmType: string, firmName: string, rsrcName?: string) => {
    val corp = Corp.getCorp(corpName)
    if (corp == nil) {
      console.log(corpName .. '(이)란 기업이 존재하지 않습니다')
      return;
    }

    if (this.firmTable.has(firmName)) {
      console.log('이미 동일한 이름의 회사가 존재 : ' .. firmName)
      return;
    }

    val 종류 = firmType
    val firm = new Firm(firmName, 종류, corpName)

    %%// load 할때 type과 자원을 넘겨주면 load()에서 처리된다.
    %%// if (!(firm.type == '공장' || firm.type == '소매')) {
    %%//   assert.notEqual(rsrcName, nil)
    %%//   if (rsrcName == nil) return firm
    %%//   firm.setRsrc(rsrcName)
    %%// }

    firm.load({
      종류: firmType
      자원: if rsrcName == nil then '' else rsrcName
      상태: '정상영업'
      사장: ''
      건물: {
        종류: ''
        부대시설: []
      }
      부서: []
    })

    this.firmTable.set(firm.name, firm)
    corp.affiliate.push(firm.name)
    return firm
  }

  /**
   *
   */
  static def createDept(firmName: string, deptType: string, deptName?: string) => {
    val firm = this.getFirm(firmName)
    if (firm == nil) {
      console.log(firmName .. '(이)란 회사가 존재하지 않습니다')
      return;
    }

    return firm.addDept(deptType, deptName)
  }

  /**
   *
   */
  static def validate() => {
    this.firmTable.forEach(firm => {
      firm.validate()
    })
  }

  /**
   *
   * @param firmName
   * @param isDispError
   * @returns
   */
  static def getFirm(firmName: string, isDispError: boolean = true)-> Firm | nil => {
    val firm = this.firmTable.get(firmName)
    if (firm == nil && isDispError) {
      console.log('undefined firm:', firmName)
    }
    return firm
  }

  /**
   * 특정 회사의 특정 부서를 리턴한다.
   * 회사를 명시하지 않으면 부서명으로 찾는다.
   * 두가지 다 명시할 경우에는 첫번째 파라메터가 회사명이 되고
   * 부서명만 명시할 경우에는 첫번째 파라메터가 부서명이 된다.
   * 편이를 위한 함수이다.
   *
   * @param name1
   * @param name2
   * @returns
   */
  static def getDept(name1: string, name2?: string)-> Dept | nil => {
    if (name2 == nil) {
      val deptName = name1
      var result: Dept | nil
      this.firmTable.forEach(firm => {
        val dept = firm.getDept(deptName, false)
        if (dept != nil) {
          result = dept
          return;
        }
      })
      if (result == nil) console.log('undefined dept:', deptName)
      return result
    }

    val firmName = name1
    val deptName = name2
    val firm = this.firmTable.get(firmName)
    assert.notEqual(firm, nil, `${firmName}, ${deptName}`)
    if (firm == nil) {
      console.log('undefined firm:', firmName)
      return nil
    }

    val dept = firm.getDept(deptName)
    assert.notEqual(dept, nil, deptName)
    return dept
  }

  /**
   * 등록된 모든 회사를 리턴한다.
   *
   * @returns
   */
  static def getFirmsList(predicate?: (firm: Firm) -> boolean)-> Firm[] => {
    val firms: Firm[] = []
    this.firmTable.forEach(firm => {
      if (predicate != nil) {
        if (predicate(firm)) firms.push(firm)
      } else firms.push(firm)
    })
    return firms
  }

  /**
   * 회사의 처리 로직을 변경한다.
   */
  %%private static%%var firmLogic = new FirmLogic()

  /**
   *
   * @returns
   */
  static def getLogic()-> FirmLogic => {
    return this.firmLogic
  }

  /**
   *
   * @param logic
   */
  static def injectLogic(logic: FirmLogic) => {
    this.firmLogic = logic
  }
}
