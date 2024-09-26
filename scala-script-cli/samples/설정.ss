%%
import { FileLoader } from './FileLoader'
import { MathUtil } from './MathUtil'
%%

/**
 * 입출내역은 그냥 금액만 저장하는 것이 아니라 가격과 수량을 모두 저장한다.
 * 이는 해당 비용이 어떻게 산출되었는지를 모니터링하기 위한 것이다.
 */
export def 입출내역 => {
  var 내역: {
    var 회사: string
    var 가격: number
    var 수량: number
  }[] = []

  /**
   *
   * @returns
   */
  def 금액() => {
    var sum = 0
    this.내역.forEach(e => {
      sum += e.가격 * e.수량
    })
    return MathUtil.round(sum)
  }

  /**
   *
   * @param price
   * @param amount
   */
  def 증가(firm: string, price: number, amount: number) => {
    if (price == 0 || amount == 0) return;

    this.내역.push({
      회사: firm
      가격: price
      수량: amount
    })
  }
}

/**
 *
 */
export def 재무정보 => {
  var 매출: number
  var 매입: number
  var 비용: number
  var 이익: number
}

/**
 *
 */
def 설정정보 => {
  %%//
  var dataFolder: string
  var saveFolder: string

  /**
   * 근로자 1인의 하루 평균임금이며 만원 단위이다.
   */
  var 평균임금: number

  /**
   *
   */
  var 일인당_처리량: number

  /**
   *
   */
  var 숙련도_증가율: number

  /**
   * 부서별 기본인원
   */
  var 구매부서_기본인원: number
  var 판매부서_기본인원: number
  var 제조부서_기본인원: number
  var 채굴부서_기본인원: number
  var 육성부서_기본인원: number
  var 재배부서_기본인원: number
  var 가공부서_기본인원: number
  var 재고부서_기본인원: number

  /**
   * 부서별 업무강도
   * 업무강도는 한명의 인원이 처리할 수 있는 일의 단위로써
   * 업무강도가 높을수록 한명이 처리할 수 있는 일의 양이 줄어든다.
   * 이것은 구매 부서의 한명이 처리하는 일과 생산 부서의 한명이 처리하는 일을 다르게 하려는 의도이다.
   * 반대로 얘기하면 동일한 일(재화 한 단위를 처리하는)을 하는데 필요한 인원이 부서별로 다르다는 의미이다.
   */
  var 구매부서_업무강도: number
  var 판매부서_업무강도: number
  var 제조부서_업무강도: number
  var 채굴부서_업무강도: number
  var 육성부서_업무강도: number
  var 재배부서_업무강도: number
  var 가공부서_업무강도: number
  var 재고부서_업무강도: number

  /**
   * 부서별 재고용량
   * 재고용량은 인원 * 일인당 처리량을 기준으로 정해진다.
   * 이전에는 이 값을 바로 사용했지만 재고용량이라는 개념 자체가 인원과 처리량으로 계산할 성격이 아니어서
   * 부서별로 적정 재고 공간을 가지고 있는 것으로 수정한다. 하지만 이 값이 처리한계보다 작으면 여러가지로
   * 불편하기 때문에 인원 * 일인당 처리량을 고려해야만 한다.
   * 재고부서는 별도이다.
   */
  var 구매부서_재고용량: number
  var 판매부서_재고용량: number
  var 제조부서_재고용량: number
  var 채굴부서_재고용량: number
  var 육성부서_재고용량: number
  var 재배부서_재고용량: number
  var 가공부서_재고용량: number
  var 재고부서_재고용량: number

  /**
   * 부서별 최소 운영비용
   */
  var 구매부서_고정비용: number
  var 판매부서_고정비용: number
  var 제조부서_고정비용: number
  var 채굴부서_고정비용: number
  var 육성부서_고정비용: number
  var 재배부서_고정비용: number
  var 가공부서_고정비용: number
  var 재고부서_고정비용: number

  /**
   * 부서별 마진률 - 구입한 비용보다 조금 더 받고 판다
   */
  var 구매부서_마진률: number
  var 판매부서_마진률: number
  var 제조부서_마진률: number
  var 채굴부서_마진률: number
  var 육성부서_마진률: number
  var 재배부서_마진률: number
  var 가공부서_마진률: number
  var 재고부서_마진률: number
}

export var 설정: 설정정보 = {
  dataFolder: './work/'
  saveFolder: './save/'

  평균임금: 10
  일인당_처리량: 200
  숙련도_증가율: 0.01

  구매부서_기본인원: 2
  판매부서_기본인원: 4
  제조부서_기본인원: 10
  채굴부서_기본인원: 40
  육성부서_기본인원: 10
  재배부서_기본인원: 40
  가공부서_기본인원: 10
  재고부서_기본인원: 2

  구매부서_업무강도: 0.5
  판매부서_업무강도: 1
  제조부서_업무강도: 2
  채굴부서_업무강도: 5
  육성부서_업무강도: 2
  재배부서_업무강도: 5
  가공부서_업무강도: 2
  재고부서_업무강도: 0.4

  구매부서_재고용량: 1000
  판매부서_재고용량: 1000
  제조부서_재고용량: 2000
  채굴부서_재고용량: 4000
  육성부서_재고용량: 2000
  재배부서_재고용량: 4000
  가공부서_재고용량: 2000
  재고부서_재고용량: 10000

  구매부서_고정비용: 10
  판매부서_고정비용: 10
  제조부서_고정비용: 20
  채굴부서_고정비용: 40
  육성부서_고정비용: 40
  재배부서_고정비용: 40
  가공부서_고정비용: 10
  재고부서_고정비용: 10

  구매부서_마진률: 1.0
  판매부서_마진률: 1.2
  제조부서_마진률: 1.4
  채굴부서_마진률: 2.0
  육성부서_마진률: 2.0
  재배부서_마진률: 2.0
  가공부서_마진률: 1.2
  재고부서_마진률: 1.0
}

export def setupLoad(fileName: string) => {
  설정 = FileLoader.loadCommentJsonFile(fileName)
}
