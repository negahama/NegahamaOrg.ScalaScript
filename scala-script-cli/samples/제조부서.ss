%%
import assert from 'assert'

import { Dept, 연결정보 } from './부서'
import { Firm } from './회사'
import { Goods } from './재화'
import { Shed } from './제품'
import { Config } from './Config'
%%

/**
 * 제조 부서의 원자재에 대한 정보이다.
 * 일반 부서의 공급처가 결국 제조 부서의 원자재 공급처이긴 하지만
 * 공급처는 단순히 어떤 회사의 어느 부서인지만을 나타내기 때문에
 * 처리에 필요한 정보를 여기저기서 가져와야만 한다.
 *
 * 원자재 정보는 공급처가 설정되거나 변경될 때마다 갱신되는데 바로 되는 것은 아니고
 * 이미 입고되어진 원료들이 소진될 때까지는 기다려야 한다. 따라서 판매가 부진해서
 * 원료가 소진이 되지 않는 상황이라면 이를 강제로 처리하는 방법도 있어야 한다.
 */
def 원자재정보 => {
  var 원료: string
  var 단위: number
  var 공급부서: 연결정보
  var 관련창고: Shed
}

/**
 * 제조 부서는 구입처에서 받은 재화로 새로운 재화를 만드는 부서이다.
 */
export def 제조부서 extends Dept => {
  /**
   * 제조를 위한 원자재 관련 정보이다.
   * 이 정보는 구입처가 변경되거나 할때 변경될 수 있다.
   */
  var 원자재: 원자재정보[] = []

  /**
   * 부서가 취급하는 제품의 종류를 변경한다.
   * 공급처가 변경되면 자체처리에서 이 함수가 호출되면서
   * 자신이 취급하는 재화의 종류와 가격이 자동적으로 변경된다.
   * 품목의 변경이 제대로 이뤄지지 않으면 error code를 리턴한다.
   *
   * 해당 부서가 제조부서이면 해당 재화를 생산할 기술을 기업이 가지고 있는지를 먼저 확인할 필요가 있다.
   *
   * @param 품목
   */
  def 취급재화변경(품목: string)-> string | void => {
    val goods = Goods.getGoods(품목)
    assert.notEqual(goods, nil, this.name)
    assert.equal(goods.name, 품목, 품목)
    if (goods == nil) return 'invalid goods'

    if (!this.기업()?.DoYouHaveTech(품목)) {
      this.smartlog(1, "취급재화변경: You don't have tech")
      this.smartlog(2, 'need:', goods.관련기술.toString())
      this.smartlog(2, 'have:', this.기업()?.보유기술.toString())
      return "don't have tech"
    }

    return super.취급재화변경(품목)
  }

  /**
   * 제조 부서의 공급처를 보고 원자재 정보를 구성한다.
   * 이 과정을 여기서 처리하지 않아도 자체 처리에서 처리되지만 자체 처리는 제품이 자동으로 선택된다.
   * 이미 생산하고자 하는 제품과 공급처가 설정되어져 있는 상태이면 여기서 처리되는 것이 좋다.
   * 공급처가 맞게 설정되어져 있는지를 검사하기 위해서는 모든 부서가 로드되어진 이후에
   * 처리되어야만 하기 때문에 postload()에서 처리해야 한다.
   */
  def postload() => {
    %%// this.재화정보는 품목설정이 호출될때 설정된다.
    %%// load()에서 이미 제조부서가 생산할 제품의 종류가 정해져 있는 상태라고 할 수 있다.
    %%// 재화정보가 없다는 것은 obj.제품 정보가 없어서 생산할 재화를 정하지 않은 상태란 의미이다.
    if (this.취급재화 == nil || this.취급재화.name == '' || this.취급재화.name == 'atom') return;

    val suppliers = this.getValidSupplier()
    assert.notEqual(suppliers.length, 0, this.name)
    assert.notEqual(this.원자재, nil, this.name)
    assert.equal(this.원자재.length, 0, this.name)

    %%// 공급처의 연결이 제대로 되어져 있는지 확인한다.
    suppliers.forEach((supplier: 연결정보) => {
      %%// 제조 부서의 공급처는 같은 회사의 구매, 재고이어야 한다.
      assert.equal(supplier.회사, this.회사().name)
      val dept = this.회사().getDept(supplier.부서)
      assert.notEqual(dept, nil, supplier.부서)

      val goods = dept!.제품종류()
      assert.notEqual(goods, '')

      %%// 공급처가 취급하는 제품이 자신이 만들고자 하는 재화의 원료인지를 검사한다.
      val found = this.취급재화.원료.find(f => f.원료 == goods)
      val info = `부서: ${this.name}, 제품: ${this.취급재화.name}, 입력: ${goods}`
      assert.notEqual(found, nil, info)

      %%// 올바른 연결이면 해당 원자재를 위한 창고와 정보를 구성한다.
      val shed = this.제품관리자.addShed(found!.원료, 0)
      this.원자재.push({
        원료: found!.원료
        단위: found!.단위
        공급부서: supplier
        관련창고: shed
      })
    })

    %%// 위 코드는 잘못된 연결이거나 원료가 아닌 경우는 스킵되고 맞는 경우만 구성된다.
    %%// 따라서 일부만 구성되고 일부는 구성되지 않을 수 있다.
    assert.equal(this.원자재.length, suppliers.length, this.name)
  }

  /**
   *
   * @returns
   */
  def toJSON() => {
    val json = super.getJSON()
    %%// 원자재 정보는 확인용으로 저장은 하지만 로드하지는 않는다.
    return {
      ...json
      원자재: this.원자재
    }
  }

  /**
   * 공급처에서 제공하는 재화로 만들 수 있는 것을 리턴한다
   */
  def getAvailableGoodsList() => {
    val corpName = if this.기업() == nil then '' else this.기업()?.name
    val supplierList = this.getValidSupplier().map(s => s.부서)
    return Config.availableGoodsList(this.type, corpName, this.회사().name, supplierList).map(p => p.name)
  }

  /**
   *
   * @returns
   */
  def processNormal() => {
    this.smartlog(1, `원자재 충분 - ${this.취급재화}의 제조를 시작합니다`)

    assert.notEqual(this.취급재화.원료, 0, this.name)
    assert.equal(this.취급재화.원료.length, this.원자재.length, this.name)

    var 원료품질 = 0
    var 원료가격 = 0
    var 생산가능수량 = Number.MAX_VALUE

    this.원자재.forEach(source => {
      %%// 생산가능 수량은 현재 보유중인 원자재의 양 / 제품 한 단위를 생산하기 위해서 필요한 원자재의 양
      val temp = source.관련창고.제품수량() / source.단위
      if (temp < 생산가능수량) 생산가능수량 = temp

      this.smartlog(
        2,
        '원료, 단위, 수량, 가격, 품질:',
        source.원료,
        source.단위,
        source.관련창고.제품수량(),
        source.관련창고.제품가격(),
        source.관련창고.제품품질()
      )

      %%// 원자재의 품질과 가격의 합도 구해둔다.
      %%// 원자재의 품질은 source.단위를 곱하지 않는다.
      %%// 즉 제조 과정에서 더 많이 투입된 원자재라고 해도 그것이 품질에 더 많은 영향을 끼치는 것은 아니다.
      %%// 양이 많다고 해서 반드시 질에 영향을 더 미치는 것은 아니다.
      원료품질 += source.관련창고.제품품질()
      원료가격 += source.관련창고.제품가격() * source.단위
    })

    %%// this.smartlog(2, '생산가능:', 생산가능수량)
    %%// this.smartlog(2, '제품수량:', this.제품수량)
    %%// this.smartlog(2, '재고한계:', this.재고한계())
    %%// this.smartlog(2, '처리한계:', this.처리한계())

    %%// 실제 생산가능수량은 다음과 같이 결정된다.
    %%// 1) 내가 가지고 있는 재고 한계보다 더 많이 생산할 수 없다.
    %%// 2) 내 처리한계보다 더 처리할 수도 없다.
    if (생산가능수량 + this.제품수량() > this.재고한계()) {
      생산가능수량 = this.재고한계() - this.제품수량()
    }
    if (생산가능수량 > this.처리한계()) 생산가능수량 = this.처리한계()

    %%// 생산 가능한 수량이 없으면 종료한다.
    if (생산가능수량 <= 0) {
      this.smartlog(1, '생산가능수량 <= 0')
      this.처리량 = 0
      return;
    }

    this.처리량 = 생산가능수량
    this.smartlog(1, '처리량: ' .. this.처리량)

    %%// 생산기술 관련...
    %%// 재화 자체가 관련된 생산기술이 없는 재화이면 품질요인의 생산기술 비율이 0이어야 한다.
    %%// 그리고 해당 기업이 관련 생산기술을 가지고 있지 않으면 제품을 생산할 수 없어야 하는데
    %%// 이것은 이전 단계 즉 생산할 재화를 선택하는 단계에서 처리되었어야 하는 일이며
    %%// 이 단계에서는 생산기술이 없으면 안된다.
    %%// 생산기술의 수준은 최대값을 100으로 상정하고 있으며 생산기술이 여러 개이면 평균을 사용한다.
    val corp = this.기업()
    if (corp == nil) return;

    var 생산기술 = 0
    val teches = this.취급재화.관련기술
    if (teches == nil || teches.length == 0) {
      assert.equal(this.취급재화.품질요인.생산기술, 0, this.취급재화.name)
    } else {
      teches.forEach(tech => {
        val value = corp.보유기술.find(s => s.이름 == tech)
        if (value == nil) {
          this.smartlog(1, '생산에 필요한 기술을 가지고 있지 않습니다')
          this.보고하기('생산기술 부재')
          %%// assert(false)
          return;
        }
        생산기술 += value.수준
      })
    }

    %%// 원료들의 품질 평균과 기술들의 평균도 구하고 원료와 기술의 비율을 적용한다
    원료품질 = 원료품질 / this.취급재화.원료.length
    if (teches.length != 0) 생산기술 = 생산기술 / teches.length

    val 원료비율 = this.취급재화.품질요인.원료품질 / 100
    val 기술비율 = this.취급재화.품질요인.생산기술 / 100
    val 생산품질 = 원료품질 * 원료비율 + 생산기술 * 기술비율

    val msg = `생산품질: ${생산품질} <= 원료품질(${원료품질}) * ${원료비율} + 생산기술(${생산기술}) * ${기술비율}`
    this.smartlog(1, msg)
    this.smartlog(1, '원료가격:', 원료가격)

    %%// 실제로 생산한다.
    %%// 생산가능 수량만큼 원자재의 수량을 줄이고 내 제품의 수량과 품질등을 업데이트한다.
    this.원자재.forEach(source => {
      %%// 소수점 3자리 이하는 반올림한다.
      val 원자재출고량 = Math.round(this.처리량 * source.단위 * 1000) / 1000
      %%// 원료는 구입 당시에 매입으로 잡히고 지금처럼 생산중에 소비되는 것은 비용으로 잡히지 않는다.
      this.제품관리자.제품출고(source.원료, 원자재출고량)
    })

    %%// 제조 부서는 원료의 가격에 자체 마진률을 적용해서 새로운 가격을 정한다.
    %%// 제조 부서의 가격은 판매 부서의 가격과 마찬가지로 회사의 실질적인 이익이 된다.
    %%// 가격은 소수점 이하 한자리 까지만(즉 1000원 단위까지만) 유지한다.
    val price = Math.round(원료가격 * this.마진률 * 10) / 10
    if (this.판매가격() < price) {
      this.smartlog(2, '판매가격 변동:', this.판매가격(), price)
      this.smartlog(3, '원료가격:', 원료가격)
      this.smartlog(3, '마진률:', this.마진률)
      this.가격변경(price)
    }

    %%// 만들어진 것은 창고로 입고된다.
    %%// 이것은 내부적인 입고처리이므로 아무런 비용처리도 필요하지 않다.
    this.제품입고({
      재화: this.제품종류()
      수량: this.처리량
      가격: this.판매가격()
      품질: 생산품질
      상표: 0
    })

    this.숙련도증가(this.처리량)

    this.비용.추가('운영비', Dept.getLogic().운영비산정(this))

    this.smartlog(1, '판매가격: ' .. this.판매가격())
    this.smartlog(1, '제품수량: ' .. this.제품수량())
    this.smartlog(1, '제품품질: ' .. this.제품품질())
  }

  /**
   * 공급자의 정보가 변한 것을 자체 처리에서 알 수 있다면 처리 속도면에서 도움이 될 것이다.
   *
   * 일단 공급자 정보가 언제든지 변할 수 있기 때문에 자체 처리에서는 매번 공급자 정보를 확인한다.
   * 현재 내가 만들고 있는 것이 없으면
   *   만들 수 있는 것 중에서 첫번째 것을 만든다.
   *   물론 만들 수 있는 것이 없으면 아무 것도 만들지 않는다.
   * 현재 내가 만들고 있는 것이 있으면
   *   지금 만들고 있는 것이 자신이 만들 수 있는 재화인지를 검사해서 만들 수 있는거면 계속 만들면 된다.
   *   현재 만들고 있는 것이 만들 수 있는 것들의 목록에 없으면
   *     만들고 있는 것들의 재고가 소진될 때까지는 기다려야 한다.
   *
   *
   * 내가 취급하는 재화가 정해져 있지 않는 경우에는
   * 공급처를 설정하면 공급처가 취급하는 재화로 내 취급 제품의 종류가 변경된다.
   * 내가 취급하는 재화가 정해져 있고 공급처의 취급 제품이 이것과 맞지 않다면
   * 강제로 바꿀 것인지 아니면 연결을 취소할 것인지를 선택할 수 있다.
   *
   * 문제는 공급부서도 아직 재화가 정해지지 않았을 경우와
   * 바로 재고를 탕감하고 즉시 연결하고자 하는 경우에 대한 처리가 안되어 있다.
   * 또 제조, 가공 부서의 경우 공급처의 재화와 내 취급 재화가 동일하지 않아야 한다.
   *
   * 공급처를 설정하거나 또는 변경하려고 할 경우 어떤 것을 변경하려고 하는지를 명시해야 한다.
   * 한 곳에서만 제품을 받는게 아닐 수도 있기 때문이다. shedNo가 이를 위한 것인데 일반적인 부서,
   * 그러니까 한 곳에서만 입력을 받는 부서들은 이 값을 사용하지 않는다.
   * 이것은 제조부서 같이 여러 개의 입력을 필요로 하는 부서들을 위한 것이다.
   * 이 함수는 제조부서에서 재정의할 수 있도록 하기 위해서 shedNo를 가지고는 있지만 사용하지는 않는다.
   * 참고로 제조부서에서는 원자재 입력을 변경하기 위해서 이 함수가 재정의되어져 있고
   * 이때 shedNo는 1, 2, 3의 값을 가진다.
   *
   *
   *
   * 실제 제조를 한다.
   * 처리량(즉 생산량)은 처리한계와 원료들의 보유량에 영향을 받는다.
   * 처리한계는 인원, 업무강도, 레벨, 제품의 노동집약도에 영향을 받지만 이미 계산되어져 있는 상태이다.
   * 이 과정에서 숙련도가 아주 조금씩 증가해야 하고 운영비용이 발생한다.
   *
   * 여기서 생산되는 제품의 한 단위를 생산하기 위해서 필요한 원료의 단위는 재화의 원료 부분에 정의되어져 있다.
   * 여기서는 이들 단위를 이용해서 최대 생산할 수 있는 제품의 수를 결정한다.
   * 원료 품질은 여러 개이면 평균을 구해서 사용한다.
   * 원료 가격은 생산 재화의 가격을 계산할때 사용한다.
   * 실제 원료의 구입 가격은 이미 송장 처리에서 처리되어짐
   */
  def 자체처리() => {
    this.smartlog(0, '제조부서 자체처리')

    this.비용.추가('고정비', Dept.getLogic().고정비산정(this))
    this.비용.추가('인건비', Dept.getLogic().인건비산정(this))
    this.비용.추가('교육비', Dept.getLogic().교육비산정(this))

    assert(this.처리한계() > 0)
    assert(this.운영.인원 > 0)
    assert(this.운영.레벨 > 0)

    %%// 원자재가 공급되고 있는지를 먼저 검사한다.
    %%// 공급자가 어떻게 바뀌었던 현재 원자재가 정의되어져 있고 재고가 있어 생산이 가능하다면
    %%// 있는 재고를 모두 소진할 때까지는 정상적으로 처리한다.
    var isSupplied = true
    if (this.원자재 == nil || this.원자재.length == 0) isSupplied = false

    this.원자재.forEach((source: 원자재정보) => {
      assert.notEqual(source.원료, '')
      assert.notEqual(source.단위, 0)
      assert.equal(source.원료, source.관련창고.제품종류())
      if (source.관련창고.제품수량() < source.단위) {
        isSupplied = false
        return;
      }
    })

    if (isSupplied) {
      this.processNormal()
      return;
    }

    this.smartlog(1, '원자재가 공급이 안되어서 제조를 할 수 없다')

    %%// 여기는 생산할 것이 정해지지 않았거나 원료의 재고(한곳이라도)가 부족해서 제품을 생산할 수 없거나
    %%// 어쨌거나 생산을 할 수 없는 경우에 들어온다. 여기서 현재 상태를 바탕으로 어떻게 할 것인지를 결정한다.

    %%// 현재 공급처에서 제공하는 재화로 무엇을 만들 수 있는지를 확인한다.
    val availableGoodsList = this.getAvailableGoodsList()
    if (availableGoodsList.length == 0) {
      %%// 만들 수 있는 것이 없으면... 현재 상태를 변경하지 않는다.
      this.smartlog(1, '현재 공급되는 것으로는 아무것도 만들 수 없다')
    } else {
      val isIncluded = availableGoodsList.includes(this.제품종류())
      if (isIncluded) {
        %%// 공급이 안되는 상황이기 하지만 정상적인 상태이다.
      } else {
        %%// 사실 상태가 변경되는 유일한 경우이다.
        %%// 현재 제품은 만들 수 없지만 다른 제품을 만들 수는 있는 경우이다.
        this.smartlog(1, '현재 제품과 다른 제품을 생산하려고 합니다.')
        this.smartlog(2, '현재 취급 재화:', this.제품종류())
        this.smartlog(2, '현재 가능 재화:', availableGoodsList.toString())

        %%// 현재 생산하는 것은 더이상 유효하지 않다. 새로운 제품으로 대체되어야 한다.
        val selected = availableGoodsList[1]
        this.smartlog(2, 'selected:', selected)

        %%// 모든 데이터를 갱신한다.
        val result = this.취급재화변경(selected)
        if (result) {
          console.log('취급재화변경 실패:', `error code: ${result}, 재화: ${selected}`)
          assert(false)
        }

        %%// 계속 쓸 수 있는 창고는 그대로 쓰고 없으면 새로 만드는 것은 문제가 되지 않는다.
        %%// 문제는 남은 창고의 처리이다.

        val 원자재갱신: 원자재정보[] = []
        this.취급재화 = Goods.getGoods(selected)
        this.취급재화.원료.forEach(m => {
          %%// 원료가 원자재 정보에 이미 있으면 있는 것을 사용한다.
          %%// 대신 연결정보 같은 세부사항들은 업데이트되어야 한다.
          %%// 원자재 정보의 갱신은 일단 새로운 원자재 정보를 따로 구성한 후 덮어쓰는 방식으로 한다.

          %%// 먼저 해당 원료의 공급처를 먼저 구해둔다.
          val supplied = this.getValidSupplier().filter(s => {
            assert.equal(s.회사, this.회사().name)
            val dept = this.회사().getDept(s.부서)
            assert.notEqual(dept, nil, s.부서)

            val goods = dept!.제품종류()
            assert.notEqual(goods, '')
            return goods == m.원료
          })
          assert.notEqual(supplied, nil)
          assert.notEqual(supplied.length, 0)

          %%// 원자재 정보에서 해당 원료의 정보가 있는지 검사한다.
          val info = this.원자재.find(source => m.원료 == source.원료)
          if (info != nil) {
            %%// 이미 있으면 단위와 공급처를 제외한 정보는 사용한다.
            원자재갱신.push({
              원료: m.원료
              단위: m.단위
              공급부서: supplied[1]
              관련창고: info.관련창고
            })
          } else {
            val shed = this.제품관리자.addShed(m.원료, 0)
            원자재갱신.push({
              원료: m.원료
              단위: m.단위
              공급부서: supplied[1]
              관련창고: shed
            })
          }
        })

        %%//todo 창고의 남은 재고 처리 문제는?
        val materials = this.취급재화.원료.map(m => m.원료)
        this.원자재.forEach(source => {
          if (!materials.includes(source.관련창고.제품종류())) {
            this.제품관리자.deleteShed(source.관련창고.no)
          }
        })
        this.원자재 = 원자재갱신
      }
    }
  }

  /**
   * 제조 부서의 주문은 원자재를 확보하기 위한 것이다.
   * 원자재의 재고는 제조 부서의 처리한계의 2배로 정해져 있다.
   * 원자재의 공급은 제조 부서의 입력인 구매 부서의 몫이지만 구매부서가 없어져도 2번 정도의 처리가 가능하다.
   * 이때 단순히 처리한계 * 2 하면 안되고 생산 제품과 원자재 사이의 단위를 고려해야 한다.
   * 즉 생산 제품이 원자재 10개를 써서 하나를 만드는 제품이라면 처리한계 * 2 * 10을 해야한다.
   */
  def 발주처리() => {
    this.원자재.forEach((source: 원자재정보) => {
      this.smartlog(1, '원자재:', source.원료)

      this.smartlog(2, '공급처:', source.공급부서.회사, source.공급부서.부서)
      val supplier = Firm.getDept(source.공급부서.회사, source.공급부서.부서)
      if (supplier == nil) {
        this.smartlog(3, 'invalid supplier')
        return;
      } else {
        this.smartlog(3, '공급처의 재화:', supplier.제품종류())
        this.smartlog(3, '공급처의 가격:', supplier.제품가격())
      }

      %%// 제조부서의 입력이 다른 회사일 수는 없다.
      assert.equal(source.공급부서.회사, this.회사().name)
      if (source.원료 != supplier.제품종류()) {
        this.smartlog(3, '발주하려는 원료를 공급처가 제공하지 않습니다', source.원료, supplier.제품종류())
        return;
      }

      %%// diff는 원료의 수량이 가득 차면 0이 될 수 있다.
      assert(source.단위 > 0)
      val 재고한계 = this.처리한계() * source.단위 * 2
      val 제품종류 = this.제품관리자.findShed(source.원료).제품종류()
      val 제품수량 = this.제품관리자.findShed(source.원료).제품수량()
      val diff = 재고한계 - 제품수량

      val msg = `원료의 재고한계: ${재고한계} <= ` .. `처리한계(${this.처리한계()}) * 원료단위(${source.단위}) * 2`
      this.smartlog(2, msg)
      this.smartlog(2, '원료의 재고:', 제품수량)
      this.smartlog(2, 'diff:', diff)

      %%// 원료의 구입은 최소단위로 구입한다. 즉 소수점 단위까지 구입할 수는 없다.
      %%// 이전에는 주문 수량을 반올림해서 사용했는데 source.단위가 매우 작으면
      %%// 주문량이 0.5이하가 되어 아무 것도 주문하지 못하는 현상이 생긴다.
      %%// 그래서 아주 소량이라도 주문을 해야 하는 경우 올림을 사용해서 한 단위라도 주문하게 한다.
      %%// 이 방법은 원자재의 재고가 처리한계의 2배를 넘어가는 문제가 있기는 하지만 그건 그리 큰 문제는 아니다.
      %%// val diff2 = Math.round(diff)
      val diff2 = Math.ceil(diff)
      if (diff2 > 0) {
        val msg =
          `원료(${제품종류})의 재고(${제품수량})를 ` ..
          `재고한계(${재고한계})에 맞추기 위해 (${source.공급부서.부서})에게 (${diff2})을 더 주문함`
        this.smartlog(2, 'diff2:', diff2)
        this.smartlog(2, 'sendOrder:', msg)

        %%// for debugging
        %%// 보낸주문총량은 processForward 시작시에 초기화된다.
        this.발주총량 += diff2

        %%// senderOrder()에서 link 정보의 유효성을 검사한다.
        this.sendOrder(source.공급부서.회사, source.공급부서.부서, source.원료, diff2)
      }
    })
  }
}
