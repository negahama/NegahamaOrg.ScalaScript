%%
import assert from 'assert'

import { 제조부서 } from './제조부서'
import { 연결정보 } from './부서'
import { Goods } from './재화'
import { Firm } from './회사'
%%

/**
 * 일반적인 가공부서는 육성부서에서 받은 재화를 가공하는 제조부서와 거의 동일하다.
 *
 * 가공 부서에서 취급하는 재화 중에 우유, 계란, 양모와 같은 재화들은 다른 재화들과 다르게
 * 원료인 가축을 소모하지 않는다. 즉 닭고기는 닭을 도축해서 만들지만 계란은 닭을 소비하지 않는다.
 * 비도축 가공부서란 이렇게 원료에 해당하는 가축을 소비하지 않는 재화들을 취급하는 부서이다.
 * 비도축 가공부서는 제조 부서처럼 원료를 소모해서 새로운 제품을 만드는 것이 아니라
 * 육성 부서의 부산물을 그대로 파는 것이라 판매 부서에 가깝다.
 * 하지만 완전히 판매 부서는 아니다. 판매 부서는 공급처의 재화를 그대로 팔지만
 * 비도축 가공 부서는 특별히 명시되어진 재화를 받고 이것만을 처리하기 때문에 좀 다르다.
 */
/**
 * 가공 부서는 가축이나 작물의 가공품을 생산하는 부서이다.
 * 가공 부서는 일반적인 경우에는 제조 부서처럼 동작하고 비도축 가공 부서인 경우에는 판매 부서처럼 동작한다.
 * 제조 부서에서 파생되어졌으며 비도축인 경우에만 판매 부서처럼 처리된다.
 */
export def 가공부서 extends 제조부서 => {
  %%// 비도축 가공부서인지의 여부
  var 비도축: boolean = false

  /**
   * 부서가 취급하는 제품의 종류를 변경한다.
   * 공급처가 변경되면 자체처리에서 이 함수가 호출되면서
   * 자신이 취급하는 재화의 종류와 가격이 자동적으로 변경된다.
   * 품목의 변경이 제대로 이뤄지지 않으면 error code를 리턴한다.
   *
   * 해당 부서가 가공부서이면 품목에 맞게 도축, 비도축 여부를 해주어야 한다.
   *
   * @param 품목
   */
  def 취급재화변경(품목: string)-> string | void => {
    val goods = Goods.getGoods(품목)
    assert.notEqual(goods, nil, this.name)
    assert.equal(goods.name, 품목, 품목)

    val result = super.취급재화변경(품목)
    if (result) {
      console.log('취급재화변경 실패:', `error code: ${result}, 재화: ${품목}`)
      assert(false)
      return result
    }

    %%// 가공 부서는 처리되는 재화의 종류에 따라 비도축 가공부서가 될 수도 있다.
    this.비도축 = false
    if (품목 == '우유' || 품목 == '계란' || 품목 == '양모') {
      this.비도축 = true
    }
  }

  /**
   *
   * @returns
   */
  def 자체처리() => {
    this.smartlog(0, '가공부서 자체처리')

    %%// 비도축 가공 부서가 아니면 제조 부서처럼 처리한다.
    if (!this.비도축) return super.자체처리()

    %%// 비도축 가공 부서이면
    %%// 일반 부서처럼 공급처의 재화를 그대로 받아들이는 것이 아니라 설정된 취급 재화를 유지한다.

    this.자체처리_가격()
    this.자체처리_숙련()
    this.자체처리_비용()
  }

  /**
   *
   * @returns
   */
  def 발주처리() => {
    %%// 비도축 가공 부서가 아니면 제조 부서처럼 처리한다.
    if (!this.비도축) return super.발주처리()

    %%// 비도축 가공 부서는 자신의 취급 재화와 공급처의 재화가 다르다.
    %%// 즉 자신은 계란을 취급하지만 공급처인 육성 부서는 닭을 취급한다.
    %%// 따라서 취급 재화의 원료를 공급처가 취급하는지를 검사해서 그렇다면 발주한다.

    val suppliers: 연결정보[] = []
    this.getValidSupplier().forEach((supplier: 연결정보) => {
      val dept = Firm.getDept(supplier.회사, supplier.부서)
      if (dept == nil) assert(false)
      else {
        this.smartlog(2, '공급처:', supplier.회사, supplier.부서)
        this.smartlog(3, '공급처의 재화:', dept.제품종류())
        this.smartlog(3, '공급처의 가격:', dept.제품가격())

        assert.notEqual(this.취급재화, nil)
        assert.equal(this.취급재화.원료.length, 1)

        val material = this.취급재화.원료[1].원료

        %%// 공급처의 제품이 현재 취급 재화의 원료가 아니면 발주하지 않는다.
        if (material != dept.제품종류()) {
          this.smartlog(3, '발주하려는 원료를 공급처가 제공하지 않습니다', material, dept.제품종류())
          return;
        }
        suppliers.push(supplier)
      }
    })

    if (suppliers.length <= 0) {
      this.smartlog(2, '발주할 곳이 없습니다')
      return;
    }

    this.발주처리_코어(suppliers)
  }
}
