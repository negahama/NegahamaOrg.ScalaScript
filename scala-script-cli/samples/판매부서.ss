%%
import { Dept } from './부서'
import { Market } from './시장'
%%

/**
 * 판매 부서는 상품에 대해 별도의 가격을 지정할 수 있고 상품 별명을 부여할 수 있다.
 */
export def 판매부서 extends Dept => {
  /**
   *
   * @param alias
   */
  var 상품별명: string = ''
  def 상품별명설정하기(alias: string) => {
    this.상품별명 = alias
  }

  /**
   * 상품명 설정은 판매부서에서만 가능함
   *
   * @param obj
   * @returns
   */
  def load(obj: any) => {
    super.load(obj)
    if (obj.상품명 != nil) {
      this.상품별명설정하기(obj.상품명)
    }
  }

  /**
   *
   * @returns
   */
  def toJSON() => {
    val json = super.getJSON()
    return {
      ...json
      상품명: this.상품별명
    }
  }

  /**
   * 소매점의 판매 부서는 상품을 시장에 출시해야 한다.
   * 이때 상품명으로 회사명-재화명-내부인덱스를 사용한다. 이 상품명은 회사에 요청해서 얻는다.
   * 매번 회사에 상품명을 요청할 수도 있지만 그럴 경우 상품명을 바꿀 상황인지 아닌지를
   * 회사가 알기 위해서는 회사가 많은 정보를 필요로 하기 때문에 판매 부서에서 이전 상품명을 가지고 있다가
   * 이름을 요청하면서 이전 상품명도 같이 회사에게 알려주는 방식을 사용한다.
   * 별도의 별명을 가지고 있으면 이것이 표시되지만 내부적으로는 상품명으로 구분한다.
   */
  var prevProdName: string = ''
  def 자체처리() => {
    %%// 제품 수량이 0 인 경우 시장에 출시하지 않는다.
    if (this.회사().type == '소매' && this.제품수량() > 0) {
      %%// 가지고 있는 물건 전부가 출고되어서는 안된다.
      %%// 공급물량은 처리한계를 넘을 수 없다.
      val prodName = this.회사().newProdName(this.제품종류(), this.prevProdName)
      this.prevProdName = prodName
      Market.출시({
        이름: prodName
        별명: this.상품별명
        재화명: this.제품종류()
        이미지: 'string'
        상품설명: 'string'
        판매회사: this.회사().name
        판매부서: this.name
        공급물량: Math.min(this.제품수량(), this.처리한계())
        가격: this.판매가격()
        품질: this.제품품질()
        상표: this.제품상표()
      })
    }

    %%// 가격등의 문제로 출고 이후에 처리해야 한다.
    super.자체처리()
  }

}
