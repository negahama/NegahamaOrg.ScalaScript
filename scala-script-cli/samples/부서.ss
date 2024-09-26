%%
import assert from 'assert'

import { MathUtil } from './MathUtil'
import { LogService } from './LogService'
import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
import { 제품, 제품관리자 } from './제품'
import { Corp } from './기업'
import { Firm } from './회사'
import { Goods } from './재화'
import { 설정 } from './설정'
%%

%%/*
#### 재화의 처리 과정

재화의 처리 과정은 크게 다음과 같다.

```mermaid
flowchart LR
step1(전방향 처리) --> step2([수요 결정]) --> step3(역방향 처리)
```

여기서 전방향 처리는 출고 처리, 입고 처리, 자체 처리로 구성되고 역방향 처리는 발주 처리로 구성된다.
즉 다음과 같다.

```mermaid
graph LR
step1(출고 처리) --> step2(입고 처리) --> step3(자체 처리) -->
step4([수요결정]) --> step5(발주 처리)
```
위 과정을 간단히 설명하면

출고 처리: 해당 부서에서 제품이 나가는 것... 다음 부서가 이전 턴에서 요청한 주문을 이번 턴에 처리하는 것이다.
입고 처리: 해당 부서에 제품이 들어오는 것... 이번 턴의 이전 부서가 출고한 제품이 해당 부서에게 전달되는 것이다.
자체 처리: 해당 부서가 자체적으로 처리해야 할 것들... 이를테면 생산, 제조, 가공등등
수요 결정: 수요 결정은 부서가 처리하는 일이 아니라 모든 부서들의 자체 처리까지 끝나면 시스템에 의해 처리되는 단계이다.
발주 처리: 이렇게 수요가 결정되어지고 나면 다시 모든 부서는 역방향 처리인 발주 처리를 하게 된다.

이 과정을 시퀸스 다이어그램으로 표시하면 다음과 같다.

```mermaid
sequenceDiagram
participant 이전부서
opt 출고처리
해당부서 -->> 다음부서 : 다음부서가<br>이전 턴에서<br>요청한 것을 납품
end
opt 입고처리
이전부서 -->> 해당부서 : 이전부서가<br>보낸 물품을 수령
end
opt
activate 해당부서
해당부서 -->> 해당부서 : 자체처리
deactivate 해당부서
end
opt 발주처리
해당부서 -->> 이전부서 : 이전부서에게<br>필요한 것을 주문
end
```

##### 출고처리

출고는 다른 부서가 나에게 요청한 주문을 처리하는 것이다.
다르게 표현하면 거래처에서 나한테 주문한 물품을 납품하는 것이다.
해당 부서가 가지고 있는 재고에서 요청 주문량만큼을 요청한 부서에게 송장으로 전달한다.

이 주문은 이전 턴의 발주 처리 단계에서 생성되어진 것이며 `주문` 항목에 저장되어져 있다.
역전파 단계에서 거래처는 나에게 필요한 물건을 요청하고 나는 이것을 순방향의 출고 처리에서 한다.

주문을 받은 것을 모두 처리하면 좋겠지만 몇 가지 제한이 존재한다.

* 내가 가지고 있는 물품 이상으로 처리할 수 없다.
* 내가 처리할 수 있는 처리 한계 이상으로 처리할 수 없다.

출고 처리 과정에서 사용되는 항목들과 그 의미와 용도는 다음과 같다.

* 주문 : 이전 턴에서 다른 부서들이 나한테 요청한 모든 주문이 저장되어져 있다.
* 수주량 : 내가 받은 주문의 총량
* 출고량 : 수주량중 내가 처리한 물량
	위에서 얘기한 제한 사항으로 출고량은 수주량을 초과할 수 없다.

제품을 다른 부서에게 납품한다는 것은 송장을 전달하는 것이다.
송장은 제품을 전달했다는 증표이며 사실 그냥 받을 부서에 직접 물건을 전달할 수도 있겠지만
이렇게 송장을 사용함으로써 각각의 부서가 다른 부서에 대해서 직접적인 access를 하지 않게 하고
다른 개체가 자신의 입력과 출력을 효과적으로 제어하고 좀 더 객체 지향적으로 처리할 수 있게 해 준다.

현재의 주문 처리는 모든 부서 공용이며 먼저 들어온 주문을 먼저 처리하는 방식이다.

여러 부서가 나에게 제품을 요청할 수 있다. 디폴트는 나에게 먼저 요청한 판매처를 먼저 처리하는 것이다.
하지만 내가 가지고 있는 물품이 요청량보다 적다던지 여러 가지 이유로 여러 판매처 중에서 선택해야 할 경우가
있을 수도 있기 때문에 출고 순서를 변경할 수 있는 기능이 있다. 

출고 처리는 반드시 입고 처리 이전에 처리되어야 한다.
왜냐하면 새로운 제품이 입고되는 단계에는 제품의 가격이나 품질 등이 변경될 수 있는데
내가 받은 주문은 이전의 상태에 대한 주문이기 때문이다.

그런데 출고를 먼저 하면 입고 처리를 하면서 받을 물건을 사용할 수 없으므로
한 템포 더 늦어지게 되고 결과적으로 널뛰기 현상이 생긴다.
이것은 판매부서가 주문을 요청할 때 출고할 물량을 미리 먼저 요청함으로써 해결한다.
즉 내가 주문할 때 출고되어질 것(나한테 주문되어진 것들)을 같이 주문함으로써
출고처리를 먼저함으로써 발생되는 공백을 없앤다.

그런데 이때도 처리순서에 따른 주문 문제가 있어 이를 처리함
자세한 내용은 널뛰기 부분을 참고한다.

##### 입고처리

입고 처리는 곧 송장 처리이다.
위의 출고 처리가 되면 물건을 받을 부서들의 `송장`항목에 invoice가 쌓이게 된다.
invoice는 받을 물건 그 자체라고 할 수 있다.

물건의 입고는 제한 사항이 없다. 즉 처리한계로 입고가 제한되지 않는다.
하지만 이것은 이전 발주 단계에서 이미 처리한계를 적용해서 발주한 상태이기 때문에 아무 제한없이
처리되는 것은 아니며 입고는 여러가지 이유로 처리한계 및 재고한계등의 제한에 비교적 자유롭다.

모든 부서의 출고 과정이 끝나고 입고 처리를 하는 것은 아니다.

입고 처리 과정에서 사용되는 항목들과 그 의미와 용도는 다음과 같다.

* 송장 : 나에게 물건을 납품하는 부서가 보낸 증표, 내가 받을 물건과 동일한 의미이다.
* 입고량 : 총 입고된 물량. 입고 과정에서 물품을 거부하는 경우는 없다.
  따라서 입고량은 송장에 있는 물건의 총량과 동일하다.

제조 부서는 원료, 원자재의 입력을 처리한다.
제조 부서가 아니라도 여러 곳에서 여러 송장을 받을 수는 있지만 대신 모든 송장의 재화가 동일해야 한다.
이것은 개별 송장 처리 함수에서 송장의 제품이 자신이 취급하는 제품인지 검사함으로써 처리될 수 있다.

##### 자체처리

요청 받은 것도 처리했고 요청한 것도 받았으므로 내가 처리해야 할 본연의 일을 처리할 차례이다. 

구매, 판매, 재고부서의 경우는 일 자체가 제품의 출고, 입고 처리이기 때문에 별도의 자체 처리가 없지만
제조, 생산, 가공, 광고 부서의 경우에는 자체 처리에서 해야 할 일이 많다.

하지만 기본적으로 이 자체처리에서 해야 하는 일들이 있다.

가장 큰 일은 가격 및 비용을 처리하는 일이다.

이 다음 단계인 발주 처리에서는 비용이 전혀 발생하지 않으며 자체 처리는 비용을 처리하기 적합한 곳이다.

아울러 처리량을 정의하는 곳이기도 하다.
처리량은 각 부서마다 조금씩 다른 의미로 사용되기 때문에 정확한 처리량은 자체 처리가 끝난 시점에야 정확한 값을 얻을 수 있다.

##### 발주처리

발주 처리란 타부서의 필요한 물품을 주문하는 것이며 타 부서의 `주문` 항목에 자신이 필요한 것을 직접 기록한다. 

발주 즉 주문을 하는 것은 매우 중요한 문제이다.
적절한 양을 주문하지 못하면 다음 턴의 처리에서 물건이 부족해 제대로 생산하거나 판매하지 못하게 되고
무턱대고 많이 주문하는 것도 안된다. 주문 자체가 비용이며 재고의 한계도 존재하기 때문이다.

일단 재고를 풀로 채우는 정책으로 구현한다.
즉 제품 수량이 재고한계보다 작으면 재고 한계까지 채울 수 있도록 요청한다.
이때 자신의 처리한계 이상으로 요청할 수는 없다.

요청량을 정할때 단순히 재고 한계 - 현재 수량으로 정할 수가 없다.
왜냐하면 부서간 처리 순서 문제 때문에 요청량이 널뛰기를 하는 문제가 생기기 때문이다.
이에 대한 설명은 아래의 널뛰기 문제 부분을 참고한다.

여러 개의 공급처를 가지는 경우는 요청량을 분산해서 요청한다.
이렇게 하지 않으면 일단 자신의 재고한계를 넘어서는 입력이 들어오는 것도 문제지만
이것을 허용한다고 해도 한번에 입고되는 물량이 많아서 널뛰기 문제가 두드려져 보이게 된다.
현재 방식은 요청량을 계속 주문하는 방식이라서 이렇게 하면 재고가 계속 쌓이는 문제가 생김

수주총량을 그대로 사용해서는 안된다. 요청되는 주문은 해당 부서의 처리한계를 훨씬
초과할 수 있으므로 이를 가지고 자신의 주문을 결정하려고 하면 오차가 커질 수 있다.
자신이 아무리 많은 요청을 받는다 해도 자신이 처리할 수 있는 한계를 고려해서
주문을 하는 것이 맞을 것 같다.

현재 재고가 재고 한계를 초과해도, 현재 재고만으로 요청을 처리할 수 있다고 해도
요청이 들어온 양만큼은 발주하는 것으로 한다. 이렇게 하면 요청으로 인해 재고량이
줄어들지 않는다. 오히려 다음에 요청량이 줄면 재고가 늘어나는 문제가 있을 수 있다.
하지만 이렇게 하므로써 재고 한계 근처에서 주문을 했다가 안했다가 하는 널뛰기 문제를
근원적으로 없앨 수 있다. 재고량이 계속 늘어나는 문제는 있을 것 같지만 재고 한계를 맞추기
위해서 더 주문하는 것이 아니기 때문에 다시 요청량이 늘면 재고가 자연스럽게 준다.
이때에 물론 재고한계 이하로 떨어지지 않았기 때문에 요청량만 처리할 뿐 추가로 더 주문하지
않는다는 점이 중요하다. 재고한계로 떨어지면 그때 비로서 이를 맞추기 위해서 추가량을 더
주문한다. 따라서 더 이상 재고한계가 아니라 최소 재고량이라는 개념이 더 잘 어울린다.

##### 처리량

대부분의 부서에서 처리량이란 제품의 출고량을 의미한다.
하지만 몇몇 부서의 경우 처리량이 다르게 정의되어져 있다.
대표적으로 제조부서의 처리량은 출고량이 아니라 생산량이다.
각 부서별 처리량의 정의는 다음과 같다.

판매 부서: 판매 부서의 경우는 처리량이 판매량이므로 매우 적절하다.
구매 부서: 구매 부서의 처리량은 구매량이 아니다. 구매 부서도 판매량이 처리량이다.
제조 부서: 제조 부서도 주문을 처리하면서 처리량을 갱신하지만 제조 부서의 처리량은
제조 부서 자체 처리에서 생산량으로 다시 갱신된다.
육성 부서: 육성 부서의 처리량은 성체 출고량과 유체 입고량을 모두 합한 값이다.
*/%%

/**
 * 매출이나 처리량 같은 것들은 자주 변하지만 재고한계나 비용 같은 항목은 자주 바뀌는 항목이 아니다.
 * 이런 항목들은 저장해 두고 사용해야 하는데.. 일단은 최대한 계산으로 알 수 있는 항목들은
 * 그냥 계산하고 저장하지 않기로 했다.
 */

/**
 * 널뛰기 문제
 * ----------------------------------------------------------------------------
 * 우선 널뛰기 문제란 판매량이나 주문량이 한번은 많고 한번은 작은 싸이클이 계속 반복되는 현상을 말한다.
 *
 * 이 현상은 여러가지 이유로 여러 곳에서 발생한다.
 *
 * 1) 입고, 출고 처리
 * 처음에는 입고를 먼저하고 출고하였지만 출고가 먼저 되어야 한다.
 * 그 이유는 processForward()에서 참고하고 문제는 출고를 먼저 하면 입고 처리를 하면서 받을 물건을
 * 사용할 수 없다. 그래서 처음에는 판매를 못하고 재고가 많으므로(입고된 이후이므로) 요청도 적게하게 되어
 * 다음 턴의 출고에서 재고가 다 소진되어도 받는 양은 적게 된다. 그래서 이 턴에서는 많이 요청하게 되고
 * 다음 턴에서는 입고량이 많아도 출고가 먼저이기 때문에 제대로 판매도 못하고 요청은 적게하는
 * 처음과 같은 상황이 반복된다.
 *
 * 이 문제를 해결하려면 다음에 출고될 것을 예측하고 주문해야 한다.
 * 내가 주문하려는 시점에 다음 턴에 출고되어질 것(나한테 와 있는 거래처의 주문)을 보고 이를 감안해서
 * 요청을 해야한다.
 *
 * 2) 부서의 처리 순서
 * 백화점 판매 부서의 경우에는 현재 받은 주문이 유효하다.
 * 역전파 전에 수요가 발생하고 이것이 백화점의 수요로 들어오기 때문에 백화점 판매 부서가 처리될 때는
 * 이미 주문이 완료되어진 상태이므로 문제가 없지만 다른 부서는 거래처에서 주문이 오기 전에
 * 자신이 처리될 수 있기 때문에 주문량을 고려해서 자신의 주문을 처리할 수 없다.
 * 따라서 내 주문량을 결정할때 아직 오지 않은 주문을 어떻게 예측할 수 있을까?
 *
 * 내가 역전파때 받은 주문이 0개인 줄 알았는데 순전파때 보니까 0이 아니라면 그건 내가 역전파때 주문을 잘못한 것이 된다.
 * 이것은 처리 순서 때문에 발생하는 것이다. 저번 턴에 잘못 발주했지만 이번에 주문할 때는 이를 고려해서 주문하면
 * 적어도 판매량이 널뛰기를 하지는 않는다.
 *
 * 3) 재고한계와 처리한계의 차이
 * 재고한계는 재화의 부피를 고려한 실제적인 재고 용량이다. 이 이상으로 재고를 가질 수 없다.
 * 문제는 재고한계가 처리한계보다 낮으면...
 * 예를 들어 재고한계는 50개, 처리한계는 100개라고 하고 항상 100개 이상의 수요가 있다고 하면
 * 1) 처음 이 부서가 주문을 할때 수요를 예상해서(정확히는 이전 수요에 근거해서) 100개를 요청하게 된다.
 * 2) 그 다음 턴에 출고가 먼저 되기 때문에 0개가 출고되고 요청한 100개가 입고되었다.
 * 3) 이때 이 부서는 이미 자신의 재고한계인 50을 넘는 100개를 재고로 가지고 있는 상태이지만
 * 이 100개는 이번에 팔리지 못한 것일 뿐 다음 턴에는 바로 나갈 물량이므로 이 부서는 자신의 재고를 확보하기 위해서
 * 자신의 재고한계인 50개를 주문하게 된다.
 * 4) 다음 턴에서 예상대로 100개의 소비로 100개가 나가고 요청한 50개가 남게 된다.
 * 5) 이때에도 100개를 주문하지만 그 다음 턴에서 출고가 먼저 될때는 50개 밖에 없으므로 50개만 팔리고 다시 100개가 들어오는 것이다.
 *
 * 이런 식으로 판매가 50과 100을 반복하는 널뛰기 문제가 자주 발생한다.
 * 이 문제는 3)에서 재고한계인 50개를 요청하는 부분 때문에 발생하는데 이것을 다음에도 100개가 요청될 거라고
 * 생각하고 이를 고려해서 더 많이 요청하는 방식으로 해결할 수 없다. 왜냐하면 다음에 요청될 것을 예상하는 것도 문제지만
 * 무엇보다도 그런 식이면 재고한계 같은 개념이 의미가 없기 때문이다. 그래서 없을까도 생각해 봤는데...
 * 재고부서의 경우에는 재고용량과 재고한계가 의미가 있고 재화의 부피도 아주 사소한 문제는 아니어서
 * 재고용량을 재고부서에만 크게 설정할 수 있게 하고 다른 부서는 처리한계와 연동되게 하였다.
 *
 * 근본적인 해결책
 * ----------------------------------------------------------------------------
 * 현재 재고가 재고 한계를 넘어가면 계속적으로 재고가 쌓이는 것을 방지하기 위해서라도
 * 더이상 주문을 하지 않아야 하고 재고가 소진되면 다시 재고를 확보하기 위해서 재고한계까지
 * 주문을 해야 한다. 이런 과정은 필연적으로 널뛰기 문제가 생길 수 밖에 없다.
 *
 * 재고가 재고 한계를 넘어가도 현재 요청되어진 수주물량에 대해서는 계속 주문을 하는 방식으로 변경한다.
 * 재고 한계라른 개념 대신 적정 재고라는 개념으로 대체한다. 사실 재고 한계나 적정 재고나 그 값을 넘어가면
 * 더 이상 요청하지 않는다는 면에서 거의 비슷한 작용을 하지만 한계라는 말은 새로운 방식에서는 적절하지 않다.
 * 여튼 재고에 한계 대신 적정 라인을 두고 재고가 이 라인을 넘어가도 현재 요청에 대한 주문을 계속 한다.
 * 이 주문은 다음 턴에 실제로 그만큼 소진되어질 것이지만 앞으로의 턴에서 수주량이 주문을 한 양보다
 * 많아질수도 있고 적어질 수도 있다. 하지만 계속 재고가 쌓이거나 하지는 않으며 수주량이 줄면
 * 재고가 조금 더 쌓이고 수주량이 늘면 재고가 조금 주는 정도로 변동될 것이다.
 *
 * 적정 재고량 이하로 떨어지기 전까지는 이렇게 그냥 요청되어진 것만 주문하고 이 이하로 떨어지면
 * 원래 주문하려던 것에서 적정 재고량을 맞추기 위해서 좀 더 주문해 준다.
 */

/**
 * 여기서 재화명 항목이 불필요해 보이지만 필요하다.
 * 모든 부서가 하나의 재화만을 취급한다고 가정하기 때문에 불필요한 것인데
 * 사실 거의 모든 부서가 한 재화만을 취급하지만 육성부서는 그렇지 않다.
 */
export def 주문 => {
  var 발주회사: string
  var 발주부서: string
  var 재화명: string
  var 주문량: number
}

/**
 *
 */
export def 송장 => {
  var 발주회사: string
  var 발주부서: string
  var 제품: 제품
}

/**
 * 각 부서간 연결 정보
 */
export def 연결정보 => {
  var 회사: string
  var 부서: string
}

/**
 *
 */
def 운영정보 => {
  var 인원: number
  var 레벨: number
  var 숙련도: number
  var 교육비: number
}

/**
 *
 */
def 비용정보 => {
  var 내역: {
    var 종류: string
    var 비용: number
  }[] = []

  /**
   *
   * @param kind
   * @returns
   */
  def 합계(kind: string = '') => {
    var sum = 0
    if (kind == '') {
      this.내역.forEach(c => {
        sum += c.비용
      })
    } else {
      this.내역.forEach(c => {
        if (c.종류 == kind) sum += c.비용
      })
    }
    return MathUtil.round(sum)
  }

  /**
   *
   * @param kind
   * @param cost
   */
  def 추가(kind: string, cost: number) => {
    this.내역.push({
      종류: kind
      비용: cost
    })
  }
}

/**
 * 이 클래스는 부서의 여러 로직들을 재정의해서 사용할 수 있게 하기 위한 것이다.
 * 이 클래스의 파생 클래스를 정의하고 필요한 부분을 재정의한 다음
 * 부서의 injectLogic()를 사용해서 logic을 교체하면 된다.
 */
export def DeptLogic => {
  /**
   *
   * @param dept
   * @returns
   */
  def 가동률(dept: Dept) => {
    return MathUtil.round(dept.처리량 / dept.처리한계())
  }

  /**
   * 한번에 처리(생산)할 수 있는 최대량
   * 처리한계 이상으로 생산, 판매, 제조할 수 없으며 주문도 이것 이상으로 주문할 수 없다.
   * 처리한계는 일단은 (인원 수 * 일인당 처리량 * 레벨 / 업무강도 / 제품의 노동강도)로 계산되어진다.
   * 일인당 처리량은 전체 밸런스를 조정을 위한 설정값이며, 업무강도는 부서별 특징이고 노동강도는 재화의 특징이다.
   * 따라서 순수하게 처리한계를 조절하는 방법은 인원을 늘이거나 훈련을 통해서 레벨을 높이는 방법이 있다.
   *
   * @returns
   */
  def 처리한계(dept: Dept) => {
    return Math.round(
      (dept.운영.인원 * 설정.일인당_처리량 * dept.운영.레벨) / (dept.업무강도 * dept.취급재화.노동강도)
    )
  }

  /**
   * 실제 재고 용량이다.
   * 재고한계는 처리한계보다 높아야 한다.
   * 그렇지 않으면 처리시 매번 재고 한계 때문에 제약이 생길 것이다.
   * 이 부분에 대한 자세한 설명은 상단의 널뛰기 문제 부분을 참고한다.
   */
  def 재고한계(dept: Dept) => {
    val limit = Math.round(dept.재고용량 / dept.취급재화.단위부피)
    return Math.max(limit, this.처리한계(dept))
  }

  def 숙련도증가(dept: Dept, 처리량: number) => {
    dept.운영.숙련도 += dept.가동률() * 100 * 설정.숙련도_증가율 * (dept.운영.교육비 / 10 + 1)
    dept.운영.숙련도 = MathUtil.round(dept.운영.숙련도)

    if (dept.운영.숙련도 > 100) {
      val level = Math.floor(dept.운영.숙련도 / 100)
      val rest = dept.운영.숙련도 - level * 100
      val adj = Math.round(rest * 10000) / 10000
      dept.운영.레벨 += level
      dept.운영.숙련도 = adj
      dept.smartlog(0, '숙련도 level up:', dept.운영.레벨, dept.운영.숙련도)
      dept.보고하기('숙련도 level up', `${dept.운영.레벨}`)
    }
  }

  def 고정비산정(dept: Dept) => {
    return dept.고정비용
  }

  def 인건비산정(dept: Dept) => {
    return dept.운영.인원 * 설정.평균임금
  }

  def 교육비산정(dept: Dept) => {
    return dept.운영.인원 * dept.운영.교육비
  }

  def 운영비산정(dept: Dept) => {
    return dept.가동률() * dept.고정비용 * 2
  }

  /**
   *
   * @param dept
   * @returns
   */
  def 자산가치(dept: Dept) => {
    return 0
  }
}

/**
 *
 */
export def Dept => {
  /**
   *
   * @param indent
   * @param log
   */
  var 로그출력: boolean = false
  def smartlog(indent: number, msg: string = '', ...optionalParams: any[]) => {
    if (this.로그출력) {
      LogService.smartlog(this.name, indent, msg, ...optionalParams)
    }
  }

  /**
   * 부서 이름은 부서를 구분하는 ID의 역할을 한다.
   * 자동으로 부여되며 유저에게 표시되어지지 않고 변경할 수 없다.
   * 그런데 이 아이디를 정하는 규칙을 효과적으로 정하면 매우 도움이 된다.
   *
   * > `기업명-회사명-취급재화명-부서종류-내부인덱스`
   *
   * 예를 들어 삼성 제 2공장의 2번째 반도체 판매 부서이면 `삼성_제2공장-반도체-판매-2`라는 식으로 정한다는 의미이다.
   * 일반적으로 부서는 이름이나 ID를 표시할 필요가 없지만 나중에 디버깅등의 이유로 부서를 검색해야 할 경우 크게 도움이 될 것이다.
   */
  var name: string = ''

  %%// 부서 종류는 부서가 생성될 때 정해진다.
  %%// 부서의 종류와 파생 클래스가 1:1 대응되는 것은 아니다.
  var type: string = '없음'

  /**
   * 부서가 속해 있는 회사
   * 효율성이나 편이성을 위해서 회사 개체가 먼저 만들어지고
   * 이 회사에 속한 부서가 만들어지면서 회사의 레퍼런스가 전달되어진다.
   */
  private var firm: Firm
  def 회사()-> Firm => {
    return this.firm
  }
  def 기업()-> Corp | nil => {
    val corp = Corp.getCorp(this.firm.corpName)
    assert.notEqual(corp, nil, this.firm.corpName)
    return corp
  }

  /**
   * 제품관리자 클래스 설명 참고
   */
  var 제품관리자 = new 제품관리자(this)

  def 제품종류(shedNo = 0)-> string => {
    return this.제품관리자.제품종류(shedNo)
  }
  def 제품수량(shedNo = 0)-> number => {
    return this.제품관리자.제품수량(shedNo)
  }
  def 제품가격(shedNo = 0)-> number => {
    return this.제품관리자.제품가격(shedNo)
  }
  def 제품품질(shedNo = 0)-> number => {
    return this.제품관리자.제품품질(shedNo)
  }
  def 제품상표(shedNo = 0)-> number => {
    return this.제품관리자.제품상표(shedNo)
  }
  def 제품설정(goodsName: string, shedNo = 0) => {
    return this.제품관리자.제품설정(goodsName, shedNo)
  }
  def 제품총수량(shedNo = 0)-> number => {
    return this.제품관리자.제품총수량(shedNo)
  }
  def 제품입고(data: 제품) => {
    return this.제품관리자.제품입고(data)
  }
  def 제품출고(goodsName: string, 수량: number) => {
    return this.제품관리자.제품출고(goodsName, 수량)
  }
  %%// 송장의 형태로 나한테 전달된 재화의 총량
  %%// 입고 처리는 예외가 없다. 즉 내가 요청한 것이 송장의 형태로 오는 것이므로 모든 것을 받는다.
  %%// 따라서 매입 내역에서 이를 알 수 있다.
  %%// 이것은 디버깅용이다.
  def 총입고량(shedNo = 0) => {
    return this.제품관리자.입고량(shedNo)
  }
  %%// 내가 받은 주문에서 내가 처리한 것의 총량
  def 총출고량(shedNo = 0) => {
    return this.제품관리자.출고량(shedNo)
  }
  def 매입() => {
    return this.제품관리자.매입
  }
  def 매출() => {
    return this.제품관리자.매출
  }

  %%// 부서 운영과 관련된 정보
  var 운영: 운영정보 = {
    인원: 0
    레벨: 0
    숙련도: 0
    교육비: 0
  }

  /**
   *
   * @param member
   */
  def 인원변경(member: number)-> void => {
    this.운영.인원 = member
  }

  /**
   * 해당 부서가 재화의 공급을 받는 다른 부서들의 정보
   * 해당 부서에서 나가는 방향으로의 연결된 부서의 정보는 없다.
   * 이것은 모든 부서는 다른 모든 부서에게 재화를 줄 수 있기 때문이다.
   *
   * 공급처 정보에는 공급받는 회사와 부서 정보만 있다.
   * 그 부서에서 어떤 것을 공급받는지에 대한 정보가 없는데
   * 그 이유는 공급 부서에서 받는 재화를 그대로 쓰기 때문이다.
   * 즉 중간에 자신의 취급 재화가 공급처에 의해서 변경될 수 있다.
   */
  private var 공급처: 연결정보[] = []

  /**
   *
   * @returns
   */
  def getValidSupplier()-> 연결정보[] => {
    val suppliers: 연결정보[] = []
    if (this.공급처.length == 0) {
      return suppliers
    }

    %%// Firm.getDept()는 등록되어진 회사들을 대상으로 부서를 검색하기 때문에
    %%// 처음 회사들이 로드되어질 때는 회사명을 명시하면 회사를 찾을 수 없는 경우가 생긴다.
    %%// 왜냐하면 회사가 생성되면서 부서도 생성하는데 회사는 부서 생성이 끝났을때 등록되는데
    %%// 부서가 생성되면서 다른 부서를 요구하는 상황이기 때문이다.
    %%// 그래서 자체 부서를 요청하는 경우와 그렇지 않은 경우를 분리해서 처리한다.
    this.공급처.forEach((supplier: 연결정보) => {
      var dept: Dept | nil
      if (supplier.회사 == this.회사().name) {
        dept = this.회사().getDept(supplier.부서)
      } else dept = Firm.getDept(supplier.회사, supplier.부서)
      if (dept == nil) {
        console.log('found invalid supplier:', supplier.회사, supplier.부서)
      } else suppliers.push(supplier)
    })
    return suppliers
  }

  /**
   * 공급처를 추가, 삭제, 변경하는 것은 내가 취급하는 재화에 영향을 미친다.
   * 하지만 공급처를 변경할 때 내 취급 재화를 바로 변경하거나 하지는 않는다.
   *
   * 공급처 변경으로 인해 내 취급 재화가 변경되는 것은 자체처리에서 한다.
   * 이것이 자체처리에서 수행되는 가장 큰 이유는 현재 처리되고 있는 것들이
   * 처리되어진 이후에 공급의 변화를 적용해야 하기 때문이다.
   * 예를들어 판매 부서가 설탕을 팔고 있다가 소금으로 공급처가 바뀌었다고 해도
   * 현재 가지고 있는 설탕이 다 팔릴 때까지는 소금을 팔지 못하는 것이다.
   *
   * 공급처의 변경으로 내 취급 재화가 어떻게 변경되는가?
   * 기본적인 정책은 변경할 필요가 없으면 변경하지 않는다는 것이다.
   * 단순히 동일한 재화를 제공하는 다른 부서로 변경한 경우처럼
   * 내 취급 재화가 변경되지 않아도 되는 경우는 변경하지 않는다.
   * 변경되는 경우에는 디폴트 값을 사용한다. 예를들어 A, B의 입력으로 가, 나, 다의 제품을
   * 만들 수 있다면 첫번째인 가 제품이 디폴트가 된다.
   * 이 디폴트는 취급재화변경()을 통해서 변경할 수 있다.
   *
   * 공급처를 설정하거나 또는 변경하려고 할 경우 어떤 것을 변경하려고 하는지를 명시해야 한다.
   * 한 곳에서만 제품을 받는게 아닐 수도 있기 때문이다.
   * which는 몇번째 공급처에 대한 변경인지를 나타낸다.
   *  0, 1, 2, ...의 값을 가질 수 있으며 해당 n번째 항목이 없으면 변경되지 않는다.
   * 일반적인 부서, 그러니까 한 공급처만 가지는 부서들에게는 불필요한 파라메터이지만
   * 제조 부서 같이 여러 개의 입력을 필요로 하는 부서들과 확장성을 위한 것이다.
   * 일반 부서는 그냥 0을 사용하면 된다.
   * 새로운 항목을 추가하는 경우는 -1 을 사용해야 한다.
   *
   * 아직 바로 재고를 탕감하고 즉시 변경하고자 하는 경우에 대한 처리가 안되어 있다.
   * 이 경우 재고 처리 비용등의 문제가 있다.
   *
   * 결론은 부서의 자체처리에서 재고가 소진되면 알아서 취급 재화를 변경하기 때문에 여기서는 공급자 정보만 바꾸면 된다.
   *
   * @param which
   * @param firmName
   * @param deptName
   */
  def 공급처변경(which: number, firmName: string, deptName: string)-> string | void => {
    assert(which >= -1, which.toString())
    assert.notEqual(deptName, nil)
    assert.notEqual(deptName, '')

    val changeSupplier = (which: number, firmName: string, deptName: string)-> string | void => {
      val dept = Firm.getDept(firmName, deptName)
      assert.notEqual(dept, nil, `${firmName}, ${deptName}`)

      if (which == -1) {
        this.공급처.push({
          회사: firmName
          부서: deptName
        })
      } else {
        val supplier = this.공급처[which]
        if (supplier == nil) {
          console.log('invalid param', which, this.공급처.length)
          return 'invalid param'
        } else {
          supplier.회사 = firmName
          supplier.부서 = deptName
        }
      }
    }

    return changeSupplier(which, if firmName != '' then firmName else this.firm.name, deptName)
  }

  /**
   * 부서가 취급하는 제품의 종류를 변경한다.
   * 공급처가 변경되면 자체처리에서 이 함수가 호출되면서
   * 자신이 취급하는 재화의 종류와 가격이 자동적으로 변경된다.
   * 품목의 변경이 제대로 이뤄지지 않으면 error code를 리턴한다.
   *
   * @param 품목
   */
  def 취급재화변경(품목: string)-> string | void => {
    val goods = Goods.getGoods(품목)
    assert.notEqual(goods, nil, this.name)
    assert.equal(goods.name, 품목, 품목)

    this.취급재화 = goods
    this.제품설정(품목)
    this.가격변경(goods.적정가격)
    return ''
  }

  %%//
  var 주문: 주문[] = []

  %%//
  var 송장: 송장[] = []

  /**
   * 현재 처리되는 양이다.
   * 부서마다 다른 의미로 쓰인다.
   * 제조부서는 생산량을 말하며 일반적인 부서는 주문 받은 것을 처리한 양을 말한다.
   * 그래서 판매부서의 경우는 판매량과 동일한 개념이지만 구매부서는 구매량과 동일한 의미가 아니다.
   * 여러가지 이유로 현재 처리하는 양은 처리한계보다 작을 수 있다.
   * 대표적으로 수요가 없어서 처리할 것이 없는 경우가 있다.
   */
  var 처리량: number = 0

  def 처리한계() => {
    return Dept.getLogic().처리한계(this)
  }

  %%// 처리량 / 처리한계 * 100
  def 가동률() => {
    return Dept.getLogic().가동률(this)
  }

  /**
   * 재고용량
   * 이것은 제품의 부피가 1 인 경우 제품을 보관할 수 있는 최대량이다.
   * 따라서 실제 제품의 재고 한계는 재고 용량을 제품 부피로 나눠서 사용한다.
   * 현재 제품의 재고량은 상품의 수량이며 상품의 수량은 재고한계를 초과할 수 없다.
   * 디폴트 재고 용량은 부서별로 다르며 부서별 적정 인원 * 일인당 처리량에 근거한다.
   * 이 값이 처리한계보다 작으면 여러가지로 불편하기 때문에 처리한계를 고려해야만 한다.
   * 또한 유저가 전혀 다른 값으로 재설정할 수 있다. 특히 재고부서는 별도로 설정된다.
   */
  var 재고용량: number = 0

  def 재고한계() => {
    return Dept.getLogic().재고한계(this)
  }

  /**
   * 판매가는 처음 부서가 만들어질 때는 재화의 적정 가격으로 설정되지만
   * 각 부서마다 자신이 구입한 가격에 마진을 붙여 새로운 가격으로 변경된다.
   * 판매가는 구입 가격이 증가되면 같이 증가된다. 하지만 구입 가격이 떨어져도 같이 떨어지지 않는다.
   */
  def 판매가격(재화명: string = '') => {
    return this.제품관리자.판매가격(재화명)
  }
  def 가격고정(재화명: string = '') => {
    return this.제품관리자.가격고정(재화명)
  }
  def 가격변경(가격: number, 재화명: string = '', 가격고정: boolean = false)-> void => {
    this.제품관리자.가격설정(가격, 재화명, 가격고정)
  }

  /**
   * 비용은 고정비 + 인건비 + 운영비 + 교육비 이다.
   * 고정비는 부서에 따라 다르지만 매월 나가는 고정적인 비용이다.
   * 이것은 현재 각 부서별 최소고정비용 항목으로 존재한다.
   * 인건비는 인원수 * 평균임금이다.
   */
  var 비용 = new 비용정보()

  /**
   *
   */
  var 고정비용: number = 0

  def 이익() => {
    return MathUtil.round(this.매출().금액() - this.매입().금액() - this.비용.합계())
  }

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
    this.smartlog(0, 'onChangeState:', prevState, currState)
    this.보고하기('onChangeState', `${prevState} => ${currState}`)
  }

  /**
   * 회사에 보고한다.
   *
   * @param what
   */
  def 보고하기(what: string, info = '') => {
    this.firm.보고하기(this.name, new SimDate(SimDate.getToday()), what, info)
  }

  %%// 제품에 대한 재화 정보이다.
  %%// 이 정보를 매번 재화 테이블에서 얻어오는 것은 심각한 성능 저하 요인이 된다.
  %%// 이 정보는 취급 재화가 설정될 때 같이 설정되기 때문에 undefined 상태일 수 있다.
  var 취급재화: Goods = new Goods()

  /**
   * 받은 주문 총량을 저장해 두는 이유는 다음 순방향시 주문량이랑 비교해서 변동이 없는지 확인하기 위해서이다.
   * 변동되었다면 내가 이전에 한 요청이 잘못된 것이므로(처리의 순서 문제로) 이를 보정하기 위해서이다.
   * 이에 대한 자세한 설명은 [[재화의 흐름에 따른 처리 순서의 제어]] 부분을 참고한다.
   */
  var 저장된주문량: number = 0
  var 보정할주문량: number = 0

  %%// 내가 다른 거래처에 요청한 주문의 총량
  var 발주총량: number = 0

  /**
   * 내가 받은 주문의 총량
   * 주문은 내가 발주한 주문과 수주한 주문으로 나눌 수 있는데 이것의 구분은 쉽다.
   * 내가 받은 주문, 즉 수주한 주문은 다른 부서가 나에게 요청한 것이지만 한 프로세스를 거치는 동안
   * 두번 발생한다. 즉 순방향 처리시에도 있고 역방향 처리시에도 있다.
   * 순방향 처리시의 주문은 이전 턴의 역방향에서 발생한 주문이고
   * 역전파 처리시에도 새로운 주문이 나에게 온다.
   * 물론 부서가 처리되는 순서에 따라서 내 역방향 처리 이후에 주문이 올 수도 있다.
   * 여튼 이런 사항을 명시하는 이유는 주문 배열은 전방향 처리 이후에 다음을 위하여
   * clear되어지므로 수주총량을 언제 확인하는가에 따라서 그 의미가 다르기 때문이다.
   */
  def 수주총량() => {
    var sum = 0
    this.주문.forEach(e => {
      sum += e.주문량
    })
    return sum
  }

  /**
   * 업무강도
   * 업무강도는 한명의 인원이 처리할 수 있는 일의 단위로써
   * 업무강도가 높을수록 한명이 처리할 수 있는 일의 양이 줄어든다.
   * 이것은 구매 부서의 한명이 처리하는 일과 생산 부서의 한명이 처리하는 일을 다르게 하려는 의도이다.
   * 반대로 얘기하면 동일한 일(재화 한 단위를 처리하는)을 하는데 필요한 인원이 부서별로 다르다는 의미이다.
   */
  var 업무강도: number = 0

  /**
   *
   */
  var 마진률: number = 0

  /**
   *
   * @param 처리량
   */
  def 숙련도증가(처리량: number) => {
    Dept.getLogic().숙련도증가(this, 처리량)
  }

  /**
   *
   * @param firm
   * @param kind
   */
  def constructor(firm: Firm, kind: string) => {
    this.firm = firm
    this.type = kind
  }

  /**
   *
   * @param obj
   * @returns
   */
  def load(obj: any) => {
    %%// 부서의 이름을 명시하지 않으면 디폴트로 기업명-회사명-취급재화명-부서종류-내부인덱스로 정해진다.
    if (obj.이름 == nil) {
      val goodsName =
        if (obj.제품 != nil && obj.제품.재화 != nil && obj.제품.재화 != '') then obj.제품.재화 else nil
      this.name = this.firm.newDeptName(goodsName)
    } else {
      this.name = obj.이름
    }

    val applyProduct = (제품: any) => {
      assert.equal(Goods.getGoods(제품.재화).name, 제품.재화, 제품.재화)

      val result = this.취급재화변경(제품.재화)
      if (result) {
        console.log('취급재화변경 실패:', `error code: ${result}, 재화: ${제품.재화}`)
        assert(false)
      }

      %%// 추가 정보가 있으면 반영한다.
      val 수량 = if 제품.수량 != nil then 제품.수량 else 0
      val 가격 = if 제품.가격 != nil then 제품.가격 else 0
      val 품질 = if 제품.품질 != nil then 제품.품질 else 0
      val 상표 = if 제품.상표 != nil then 제품.상표 else 0

      this.제품입고({
        재화: 제품.재화
        수량: 수량
        가격: 가격
        품질: 품질
        상표: 상표
      })
    }

    %%// 제품에 대한 정보가 없다면 초기값으로 설정해 주고(이미 디폴트로 설정되어져 있음)
    %%// 나중에 입력 거래처로부터 재화가 오면 그때 설정해 주는 것으로 한다.
    %%// 설정되기 전까지 취급 제품이 설정되지 않은 상태를 지원할 수 있어야 한다.
    if (obj.제품 == nil || obj.제품.재화 == nil || obj.제품.재화 == '') {
      %%// 취급 재화가 선택되기 전까지 재화정보는 아톰으로 설정된다.
      %%// 아톰은 재화정보가 있는지 없는지 매번 검사하고 없으면 예외처리하는 것을 없애준다.
      this.취급재화 = Goods.getGoods('atom', false)
    } else {
      applyProduct(obj.제품)
    }

    if (obj.판매가 != nil) this.가격변경(obj.판매가)

    %%// d.공급처가 생략되어져 있으면 this.입력의 디폴트값인 빈 배열을 사용한다.
    %%// d.공급처에는 회사와 부서에 대한 정보만 있으며 회사에 대한 정보가 없으면 같은 회사로 간주한다.
    %%// 부서는 생략될 수 없다.
    if (obj.공급처 != nil) {
      obj.공급처.forEach((e: any) => {
        assert.notEqual(e.부서, nil, this.name)
        if (e.회사 == nil) e.회사 = this.firm.name
        else {
          if (e.회사 != this.firm.name) assert.equal(this.type, '구매', this.name)
        }
        this.공급처.push({
          회사: e.회사
          부서: e.부서
        })
      })
    }

    this.type match {
      case '구매' => {
        this.운영.인원 = 설정.구매부서_기본인원
        this.업무강도 = 설정.구매부서_업무강도
        this.재고용량 = 설정.구매부서_재고용량
        this.고정비용 = 설정.구매부서_고정비용
        this.마진률 = 설정.구매부서_마진률
        break
      }
      case '판매' => {
        this.운영.인원 = 설정.판매부서_기본인원
        this.업무강도 = 설정.판매부서_업무강도
        this.재고용량 = 설정.판매부서_재고용량
        this.고정비용 = 설정.판매부서_고정비용
        this.마진률 = 설정.판매부서_마진률
        break
      }
      case '제조' => {
        this.운영.인원 = 설정.제조부서_기본인원
        this.업무강도 = 설정.제조부서_업무강도
        this.재고용량 = 설정.제조부서_재고용량
        this.고정비용 = 설정.제조부서_고정비용
        this.마진률 = 설정.제조부서_마진률
        break
      }
      case '채굴' => {
        this.운영.인원 = 설정.채굴부서_기본인원
        this.업무강도 = 설정.채굴부서_업무강도
        this.재고용량 = 설정.채굴부서_재고용량
        this.고정비용 = 설정.채굴부서_고정비용
        this.마진률 = 설정.채굴부서_마진률
        break
      }
      case '육성' => {
        this.운영.인원 = 설정.육성부서_기본인원
        this.업무강도 = 설정.육성부서_업무강도
        this.재고용량 = 설정.육성부서_재고용량
        this.고정비용 = 설정.육성부서_고정비용
        this.마진률 = 설정.육성부서_마진률
        break
      }
      case '재배' => {
        this.운영.인원 = 설정.재배부서_기본인원
        this.업무강도 = 설정.재배부서_업무강도
        this.재고용량 = 설정.재배부서_재고용량
        this.고정비용 = 설정.재배부서_고정비용
        this.마진률 = 설정.재배부서_마진률
        break
      }
      case '가공' => {
        this.운영.인원 = 설정.가공부서_기본인원
        this.업무강도 = 설정.가공부서_업무강도
        this.재고용량 = 설정.가공부서_재고용량
        this.고정비용 = 설정.가공부서_고정비용
        this.마진률 = 설정.가공부서_마진률
        break
      }
      case '재고'  => {
        this.운영.인원 = 설정.재고부서_기본인원
        this.업무강도 = 설정.재고부서_업무강도
        this.재고용량 = 설정.재고부서_재고용량
        this.고정비용 = 설정.재고부서_고정비용
        this.마진률 = 설정.재고부서_마진률
        break
      }
    }

    this.운영.레벨 = 1
    this.운영.숙련도 = 0
    this.운영.교육비 = 0

    if (obj.운영 != nil) {
      if (obj.운영.인원 != nil) this.운영.인원 = obj.운영.인원
      if (obj.운영.레벨 != nil) this.운영.레벨 = obj.운영.레벨
      if (obj.운영.숙련도 != nil) this.운영.숙련도 = obj.운영.숙련도
      if (obj.운영.교육비 != nil) this.운영.교육비 = obj.운영.교육비
    }

    if (obj.업무강도 != nil) this.업무강도 = obj.업무강도
    if (obj.재고용량 != nil) this.재고용량 = obj.재고용량
    if (obj.고정비용 != nil) this.고정비용 = obj.고정비용
    if (obj.마진률 != nil) this.마진률 = obj.마진률

    this.주문 = []
    this.송장 = []
    if (obj.주문 != nil) this.주문 = obj.주문
    if (obj.송장 != nil) this.송장 = obj.송장

    if (obj.매출 != nil) this.매출().내역 = obj.매출
    if (obj.매입 != nil) this.매입().내역 = obj.매입
    if (obj.비용 != nil) this.비용.내역 = obj.비용

    this.처리량 = 0
    if (obj.처리량 != nil) this.처리량 = obj.처리량
  }

  /**
   *
   */
  def postload() => {
    %%// do nothing
  }

  /**
   *
   * @returns
   */
  def getJSON() => {
    return {
      이름: this.name
      종류: this.type
      제품: {
        재화: this.제품종류()
        수량: this.제품수량()
        가격: this.제품가격()
        품질: this.제품품질()
        상표: this.제품상표()
      }
      운영: this.운영
      공급처: this.공급처
      주문: this.주문
      송장: this.송장
      매출: this.매출().내역
      매입: this.매입().내역
      비용: this.비용.내역
      판매가: this.판매가격()
      처리량: this.처리량
      재고용량: this.재고용량
      업무강도: this.업무강도
      고정비용: this.고정비용
      마진률: this.마진률
      // 처리한계 재고한계는 확인을 위해서 저장은 하지만 로드하지는 않는다.
      처리한계: this.처리한계()
      재고한계: this.재고한계()
    }
  }
  def toJSON() => {
    return this.getJSON()
  }

  /**
   *
   */
  def validate() => {
    console.log('validate dept : ', this.name)
    assert.equal(Goods.getGoods(this.제품종류()).name, this.제품종류(), this.제품종류())

    %%//todo 부서간의 연결이 올바른지 재화 설정이 맞는지등을 검사해야 함
    this.공급처.forEach(supplier => {
      val firm = Firm.getFirm(supplier.회사)
      assert.notEqual(firm, nil, `undefined : ${supplier.회사}`)
      val dept = firm?.getDept(supplier.부서)
      assert.notEqual(dept, nil, `undefined : ${supplier.부서}`)
    })
  }

  /**
   *
   */
  def process_초기화() => {
    this.제품관리자.초기화처리()

    %%// 처리량, 매출, 매입등을 clear한다.
    %%// 여기서 아무것도 처리되지 않는 경우에도 이들 값들은 clear되어야 하기 때문이다.
    this.처리량 = 0
    this.비용 = new 비용정보()

    %%// for debugging
    this.발주총량 = 0
  }

  /**
   * 순방향 처리를 한다.
   * 순방향 처리는 크게 다음과 같은 순서로 처리된다.
   *
   * 0) 초기화
   * 1) 출고 처리
   * 2) 입고 처리
   * 3) 자체 처리
   */
  def process_출고() => {
    %%// 역전파 순서가 제대로 처리되었다면 저장된주문량과 수주총량(받은주문총량)이 같았을 것이다.
    %%// 이전 processBackward()에서 고려되었어야할 것을 이번 processBackward()에서 처리될 수 있게 한다.
    %%// 받은 주문을 clear하기 전에 먼저 검사한다.
    val 수주총량 = this.수주총량()
    if (this.저장된주문량 != 수주총량) {
      this.smartlog(0, '이전에 주문을 잘못했음:', this.저장된주문량, 수주총량)

      %%// 보통의 경우 저장된주문량은 0일 가능성이 높다.
      assert.equal(this.저장된주문량, 0, this.name)
      this.보정할주문량 = Math.min(수주총량, this.처리한계())
    }

    this.smartlog(0, LogUtil.setTextColor('blue', '출고처리'))
    %%//-------------------------------------------------------------------------
    %%// 받은 주문을 처리한다.
    %%//-------------------------------------------------------------------------
    this.출고순서변경()

    assert(this.처리한계() > 0, this.name)
    var 남은주문처리량 = this.처리한계()

    this.주문.forEach(order => {
      this.smartlog(1, `YOU -->> ${order.발주회사}'s ${order.발주부서}`)
      this.smartlog(1, '[요청재화, 요청수량]:', order.재화명, order.주문량)

      assert(order.주문량 > 0, `${order.주문량}, ${order.발주회사}`)

      if (남은주문처리량 <= 0) {
        return;
      }

      남은주문처리량 = this.출고처리(order, 남은주문처리량)
    })

    assert(this.매출().금액() >= 0, this.name)

    %%// for debugging
    %%// val 총출고량 = 처리한계 - 남은주문처리량
    %%// assert.equal(총출고량, this.출고량(-1))

    this.주문 = [] %%//todo
  }

  /**
   * 이 함수는 출고처리 전에 호출된다.
   * 나에게 여러 개의 주문이 와 있는 상태일때 특정 주문이 먼저 처리되어야 한다면
   * 이를 주문의 순서를 바꿈으로써 처리되게 하려는 목적이다.
   * 이 함수를 통해 순서를 변경하지 않으면 먼저 온 것이 먼저 처리된다.
   * 이 함수의 또 다른 용도는 내부 부서가 아닌 다른 회사의 요구를 필터링하는 것이다.
   * 판매 부서를 제외한 다른 부서는 내부적으로만 거래하기 때문에 외부의 주문을 걸러야 한다.
   */
  def 출고순서변경() => {
    if (this.type != '판매') {
      val filtered = this.주문.filter(order => order.발주회사 == this.firm.name)

      if (this.주문.length != filtered.length) {
        this.smartlog(1, '부적절한 주문이 있었습니다')
        this.보고하기('부적절한 주문')
      }

      this.주문 = filtered
    }
  }

  /**
   * 해당 부서가 받은 주문을 처리한다.
   * 주문량이 내가 가지고 있는 양보다 많으면 가지고 있는 것까지만 처리한다.
   * 주문량이 내 처리 한계를 넘어가면 처리한계까지만 처리한다.
   *
   * 남은주문처리량은 여러 개의 주문이 왔을 때 처리한계를 넘지 않게 하기 위한 것이다.
   * 처음에 처리한계의 값으로 설정되고 주문을 처리하면서 자신이 주문한 만큼을 빼고 리턴한다.
   * 이렇게 안하고 this.처리량을 누적시키면서 this.처리량이 처리한계를 넘지 않게 하는 방법도 있다.
   *
   * @param order
   * @param 남은주문처리량
   * @returns
   */
  def 출고처리(order: 주문, 남은주문처리량: number)-> number => {
    return this.제품관리자.출고처리(order, 남은주문처리량)
  }

  /**
   *
   */
  def process_입고() => {
    this.smartlog(0, LogUtil.setTextColor('purple', '입고처리'))
    %%//-------------------------------------------------------------------------
    %%// 물건을 받는다.
    %%//-------------------------------------------------------------------------
    this.송장.forEach(invoice => {
      this.smartlog(1, `${invoice.발주회사}'s ${invoice.발주부서} -->> YOU`)
      this.smartlog(2, '재화, 수량:', invoice.제품.재화, invoice.제품.수량)
      this.smartlog(3, '가격, 품질, 상표:', invoice.제품.가격, invoice.제품.품질, invoice.제품.상표)

      assert(invoice.제품.가격 > 0, this.name)
      assert(invoice.제품.수량 > 0, this.name)
      assert(invoice.제품.품질 > 0, this.name)

      this.입고처리(invoice)
    })

    assert(this.매입().금액() >= 0, this.name)

    %%// for debugging
    %%// var 총입고량 = 0
    %%// this.송장.forEach(invoice => {
    %%//   총입고량 += invoice.제품.수량
    %%// })
    %%// assert.equal(총입고량, this.총입고량)

    this.송장 = [] %%//todo
  }

  /**
   * 제품이 입고될때 현재 처리하고 있는 제품과 입고 제품이 다르면...
   *
   * 자동변경이 가능하면 일단 창고에 입고한다.
   * 기존 제품이 다 사용되어진 이후에 입고된 것이 사용되어질 것이다.
   *
   * 자동 변경이 아닌 경우라면 메시지를 출력하고 입고하지 않는다.
   *
   * @param invoice
   */
  def 입고처리(invoice: 송장) => {
    this.제품관리자.입고처리(invoice)
  }

  /**
   *
   */
  def process_자체() => {
    this.smartlog(0, LogUtil.setTextColor('cyan', '자체처리'))
    %%//-------------------------------------------------------------------------
    %%// 각 부서의 자체 처리
    %%//-------------------------------------------------------------------------
    this.자체처리()

    assert(this.처리량 >= 0, this.name)
    assert(this.비용.합계() > 0, this.name)
  }

  /**
   *
   */
  def 자체처리() => {
    this.자체처리_가격()
    this.자체처리_숙련()
    this.자체처리_비용()

    %%// 공급처의 재화가 변경되어진 경우의 처리
    %%// 아직 재고가 있다면 취급 재화를 변경하지 않는다.
    if (this.제품수량() > 0) {
      return;
    }

    %%// 공급처에 대한 정보 자체가 없는 경우에는 취급 재화를 변경할 수 없다.
    val suppliers = this.getValidSupplier()
    if (suppliers.length <= 0) {
      return;
    }

    this.smartlog(1, '새로운 공급으로 재설정한다')

    var success = false
    suppliers.forEach(supplier => {
      %%// 이미 재설정을 성공적으로 처리했으면 더이상 처리하지 않아야 한다.
      if (success) return;

      val dept = Firm.getDept(supplier.회사, supplier.부서)
      if (dept == nil) assert(false)
      else {
        if (dept.제품종류() == '') {
          %%// do nothing...
        } else {
          val result = this.취급재화변경(dept.제품종류())
          if (result) {
            console.log('취급재화변경 실패:', `error code: ${result}, 재화: ${dept.제품종류()}`)
          } else {
            this.smartlog(2, '재설정 성공:', dept.제품종류())
            success = true
          }
        }
      }
    })
  }

  def 자체처리_가격() => {
    if (!this.가격고정()) {
      %%// 자체 처리에서 새로운 가격을 설정한다.
      %%// 판매가격이 변경되는 시점이 고정되어져 있는 것이 좋다.
      %%// 자체 처리에서 가격을 설정하면 입,출고가 모두 끝난 시점이어서 입,출고시 동일한 가격을 유지할 수 있고
      %%// 발주 처리전이라서 다른 부서들도 발주시 동일한 가격을 액세스할 수 있기 때문에 가격 설정은 자체처리에서 해야한다.
      %%// 가격은 소수점 이하 한자리 까지만(즉 1000원 단위까지만) 유지한다.
      %%// 100원 단위에서 반올림한다.
      val price = Math.round(this.제품가격() * this.마진률 * 10) / 10
      if (this.판매가격() < price) {
        this.smartlog(2, '판매가격 변동:', this.판매가격(), price)
        this.보고하기('판매가격 변동', `${this.판매가격()} => ${price}`)
        this.가격변경(price)
      }
    }
  }

  def 자체처리_숙련() => {
    this.숙련도증가(this.처리량)
  }

  def 자체처리_비용() => {
    this.비용.추가('고정비', Dept.getLogic().고정비산정(this))
    this.비용.추가('인건비', Dept.getLogic().인건비산정(this))
    this.비용.추가('교육비', Dept.getLogic().교육비산정(this))
    this.비용.추가('운영비', Dept.getLogic().운영비산정(this))
  }

  /**
   * Backward 단계에서는 모든 부서가 자신에게 필요한 주문을 요청한다.
   * 있는 주문을 처리하는 것이 아니라 공급을 요청하는 주문을 생성해서 이전 부서에게 보내는 것을 말한다.
   */
  def process_발주() => {
    this.smartlog(0, LogUtil.setTextColor('yellow', '발주처리'))
    %%//-------------------------------------------------------------------------
    %%// 물건을 주문한다.
    %%//-------------------------------------------------------------------------
    this.발주처리()

    %%// 받은주문총량을 저장해 둔다.
    %%// 이것은 순방향 처리시에 다시 받은주문총량과 비교해서 주문의 적합성을 검사하는데 사용된다.
    this.저장된주문량 = this.수주총량()
    this.보정할주문량 = 0
  }

  /**
   * 내가 주문을 하는 것이다
   * 모든 부서는 자신에게 필요한 재화를 입력에 명시된 부서에게 요청을 하는데
   * 부서의 종류에 따라서 여러 부서에 신청할 수도 있다.
   * 구매 부서의 경우 타 사업체에 연결될 수 있다.
   *
   * 이 함수는 하나의 재화만을 공급받고 또 처리하는 구매, 판매, 재고 같은 부서들용이다.
   * 내가 취급하는 제품의 원료가 하나가 아니라 그냥 내가 가져오고 파는 재화가 하나라는 의미이다.
   * 이런 부서들의 경우 공급처는 여러 곳일 수는 있지만 취급하는 재화가 모두 동일해야 한다.
   */
  def 발주처리() => {
    %%// 여기서는 단일 재화를 처리하지만 공급처는 하나가 아닐 수 있다.
    %%// 하지만 공급처는 모두 this.취급재화와 동일한 재화이어야 하며 다른 재화는 스킵된다.
    val suppliers: 연결정보[] = []
    this.getValidSupplier().forEach(supplier => {
      val dept = Firm.getDept(supplier.회사, supplier.부서)
      if (dept == nil) assert(false)
      else {
        this.smartlog(2, '공급처:', supplier.회사, supplier.부서)
        this.smartlog(3, '공급처의 재화:', dept.제품종류())
        this.smartlog(3, '공급처의 가격:', dept.제품가격())

        %%// 공급처의 제품이 현재 취급 재화와 다르면 발주하지 않는다.
        %%// 이것은 중간에 공급자가 변경되었을 경우에 발생할 수 있으며
        %%// 현재 취급 재화의 재고가 보충되지 않기 때문에 결국은 재고가 모두 소진되게 된다.
        if (this.취급재화.name != dept.제품종류()) {
          this.smartlog(3, '발주하려는 원료를 공급처가 제공하지 않습니다', this.취급재화.name, dept.제품종류())
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

  def 발주처리_코어(suppliers: 연결정보[]) => {
    %%// 현재 받은 주문이 다음 순전파때 처리될 터이므로 빠져 나갈 것을 고려해서 주문한다.
    val 수주총량 = Math.min(this.수주총량(), this.처리한계())
    val 제품수량 = this.제품총수량()
    val next = 제품수량 - 수주총량 - this.보정할주문량
    var diff = this.재고한계() - next
    if (diff > this.처리한계()) diff = this.처리한계()

    this.smartlog(1, '수주총량:', 수주총량, this.수주총량(), this.보정할주문량)
    this.smartlog(1, 'next:', next)
    this.smartlog(1, 'diff:', diff)

    %%// diff가 0 이하라는 의미는 재고가 요청량을 웃돈다는 의미이다.
    %%// 즉 이전에는 이런 경우 요청하지 않았다.
    if (diff <= 0) {
      diff = 수주총량
      this.smartlog(1, '다음 턴에 나갈 분량만큼만 요청한다.', diff)
    }

    %%// 여러 곳의 입력을 가지고 있는 경우에는 요청을 분산한다.
    diff = diff / suppliers.length

    %%// 재화는 최소단위로 주문한다. 즉 소수점 단위까지 주문하지 않는다.
    val diff2 = Math.round(diff)
    if (diff2 > 0) {
      suppliers.forEach(supplier => {
        val msg =
          `자체재고(${this.제품수량()})에서 다음 턴에 나갈 현재 주문량(${this.수주총량()})를 뺀 값을 ` ..
          `재고한계(${this.재고한계()})에 맞추기 위해(하지만 처리한계 ${this.처리한계()}를 넘을 순 없음) ` ..
          `(${supplier.부서})에게 (${diff2})을 더 주문함`
        this.smartlog(1, 'sendOrder:', msg)
        this.smartlog(2, '자체재고:', this.제품수량(), 제품수량)
        this.smartlog(2, '수주총량:', this.수주총량(), 수주총량)
        this.smartlog(2, '재고한계:', this.재고한계())
        this.smartlog(2, '제품종류:', this.제품종류())

        %%// for debugging
        %%// 보낸주문총량은 processForward 시작시에 초기화된다.
        this.발주총량 += diff2

        %%// senderOrder()에서 link 정보의 유효성을 검사한다.
        this.sendOrder(supplier.회사, supplier.부서, this.제품종류(), diff2)
      })
    }
  }

  /**
   * 내가 다른 부서 또는 다른 회사에 주문을 요청하는 것이다
   *
   * @param toFirm
   * @param toDept
   * @param goodsName
   * @param amount
   * @returns
   */
  def sendOrder(toFirm: string, toDept: string, goodsName: string, amount: number) => {
    %%// 테스트를 위해서 연결 정보가 없이 단독으로 판매하는 경우가 있을 수 있다.
    if (toFirm == '' || toDept == '') {
      console.log('testing...')
      return;
    }

    var firm: Firm | nil = this.firm
    if (toFirm != this.firm.name) {
      firm = Firm.getFirm(toFirm)
      assert.notEqual(firm, nil, toFirm)
    }

    val dept = firm!.getDept(toDept)
    assert.notEqual(dept, nil, toDept)

    dept!.주문.push({
      발주회사: this.firm.name
      발주부서: this.name
      재화명: goodsName
      주문량: amount
    })
  }

  /**
   * 주문받은 제품을 보낸다.
   * 실제로 보내는 것은 아니고 받는 부서의 송장 목록에 추가한다.
   * 실제 처리는 받는 부서의 입고 처리에서 한다
   *
   * @param toFirm
   * @param toDept
   * @param product
   * @returns
   */
  def sendInvoice(toFirm: string, toDept: string, invoice: 송장) => {
    var firm: Firm | nil = this.firm
    if (toFirm != this.firm.name) {
      firm = Firm.getFirm(toFirm)
      assert.notEqual(firm, nil, toFirm)
    }

    val dept = firm!.getDept(toDept)
    assert.notEqual(dept, nil, toDept)

    dept!.송장.push(invoice)
  }

  /**
   * 부서의 처리 로직을 변경한다.
   */
  private static var deptLogic = new DeptLogic()

  /**
   *
   * @returns
   */
  static def getLogic()-> DeptLogic => {
    return this.deptLogic
  }

  /**
   *
   * @param logic
   */
  static def injectLogic(logic: DeptLogic) => {
    this.deptLogic = logic
  }
}
