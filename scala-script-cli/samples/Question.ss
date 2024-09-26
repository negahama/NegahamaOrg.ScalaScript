%%
import assert from 'assert'
import { Interface } from 'readline'

import { Goods } from './재화'
import { Rsrc } from './자원'
import { Corp } from './기업'
import { Firm } from './회사'
import { Dept, 연결정보 } from './부서'

import { Config } from './Config'
import { Shortcut, parseCommand } from './CLI'
%%

@NotTrans def Interface => {
  def question()
}

/**
 *
 * @param r
 * @param mode
 */
export def question(r: Interface, mode: string) => {
  if (
    mode == 'corp create' ||
    mode == 'corp change' ||
    mode == 'firm create' ||
    //mode == 'firm change' ||
    mode == 'dept create' ||
    mode == 'dept change'
  ) {
    questionInteractive(r, mode)
    return;
  }

  r.question(mode .. '> ', (answer: string) => {
    val pcr = parseCommand(mode, answer)
    if (pcr.isQuit) return;
    question(r, pcr.mode)
  })
}

/**
 * 유저와 상호작용해야 하는 경우 각 입력 단계를 정의하는데 사용하는 구조이다.
 * 크게 텍스트(또는 숫자)를 입력받는 것과 리스트를 표시하고 그 중에 하나를 선택하는 것 두가지로 나뉜다.
 * 리스트를 표시하는 것에는 리스트의 내용을 직접 지정하는 방법과 여러가지 상황에 맞게 정보를 추출해서
 * 표시하는 방법이 있다.
 */
def ChainPrompt => {
  %%// 유저에게 표시할 메시지
  var prompt: string

  %%// 유저에게 표시되는 리스트 항목
  %%// 이것은 처음부터 설정된 값을 사용할 수도 있고 아래의 콜백함수를 이용해서 실행중에 생성할 수도 있다.
  %%// 이것의 값이 있으면 리스트 형태로 표시하고 표시된 항목을 선택하며
  %%// 이것이 빈 배열이면 prompt만 표시하고 문자열을 입력받는다.
  var shortcutList?: Shortcut[]

  %%// 콜백함수를 등록해 두면 실행중에 shortcutList를 구성할 수 있다.
  %%// 이때 리스트를 구성하는데 필요한 정보가 있을 수 있는데 예를들면 기업명 같은 정보는 options에서 추출해서 사용한다.
  var createListCallback?: (list: Shortcut[], options: string[]) -> boolean

  %%// nextChain이 없거나 createNextChainCallback()으로도 얻을 수 없으면 이 과정이 모두 끝난 것이다.
  var nextChain?: ChainPrompt

  %%// 입력에 따라 다음 처리가 달라지는 등 실시간으로 nextChain을 결정해야 하는 경우에 사용한다.
  var createNextChainCallback?: (options: string[]) -> ChainPrompt | nil
}

/**
 * 입력을 받고 명령을 해석해서 수행하는 단순한 구조가 아니라
 * 유저로부터 여러가지 정보를 얻어서 하나의 명령으로 처리해야 하는 그런 작업을 위한 인터페이스이다.
 * 즉 유저와의 상호작용이 필요한 것들을 처리하는 용도인데 mode가 create, change와 같은 경우에 동작한다.
 *
 * 처음 진입하면 해당 mode에 따라서 가장 먼저 처리되어야 할 ChainPrompt로 내부의 questionChain()을 호출한다.
 * questionChain()은 입력을 취소하거나 nextChain이 없을 때까지 자신을 계속 호출해 다음 단계을 처리하며
 * nextChain이 없으면 지금까지 입력했던 것들(options에 순서대로 저장되어져 있음)을 일련의 명령으로 묶어
 * parseCommand()로 명령을 처리하고 원래대로 돌아간다.
 *
 * 따라서 이것을 처음 시작할 때는 options가 빈 배열이어야 한다.
 *
 * @param r
 * @param mode
 * @param options
 * @returns
 */
def questionInteractive(r: Interface, mode: string, options: string[] = []) => {
  val dispPrompt = (mode: string, prompt: string, shortcutList: Shortcut[]) => {
    %%// val guideMsg = '다음 중에서 하나를 선택할 수 있습니다.'
    val guideMsg = 'You can select one below'
    var promptText = mode .. '> ' .. prompt .. ' '
    if (shortcutList.length != 0) {
      if (prompt == nil) { console.log(mode .. '> ' .. guideMsg) }
      else { console.log(mode .. '> ' .. prompt) }

      shortcutList.forEach((l: Shortcut) => {
        %%// msg가 있으면 msg를 표시하고 없으면 val를 표시한다.
        if (l.msg != nil && l.msg != '') { console.log(l.num .. '. ' .. l.msg) }
        else { console.log(l.num .. '. ' .. l.value) }
      })
      promptText = 'select> '
    }
    return promptText
  }

  /**
   *
   * @param r
   * @param mode
   * @param options
   * @param callback
   */
  val questionChain = (r: Interface, mode: string, options: string[], chain: ChainPrompt) => {
    if (chain.shortcutList == nil) chain.shortcutList = []
    if (chain.createListCallback != nil) {
      val result = chain.createListCallback(chain.shortcutList, options)
      if (!result) {
        %%// error가 있다면 모든 과정을 취소한다.
        console.log('Invalid input value... cancel this processing')
        question(r, '')
        return;
      }
    }

    val promptText = dispPrompt(mode, chain.prompt, chain.shortcutList)

    r.question(promptText, (answer: string) => {
      var quit = false
      if (answer == '') {
        // 입력값이 없으면 모든 과정을 취소한다.
        quit = true
      } else {
        // prompt 가 list 항목이면 숫자로 입력한 값을 적절한 값으로 변경해 준다.
        if (chain.shortcutList != nil && chain.shortcutList.length != 0) {
          val no = parseInt(answer)
          val index = chain.shortcutList.findIndex((l) => l.num == no)
          if (index != -1) {
            options.push(chain.shortcutList[index].value)
          } else {
            // 잘못된 입력이면 모든 과정을 취소한다.
            quit = true
          }
        } else options.push(answer)
      }

      if (quit) {
        console.log('Invalid input value... cancel this processing')
        question(r, '')
      } else {
        if (chain.nextChain == nil && chain.createNextChainCallback != nil) {
          chain.nextChain = chain.createNextChainCallback(options)
        }
        if (chain.nextChain != nil) {
          questionChain(r, mode, options, chain.nextChain)
        } else {
          var answer = mode .. ' '
          options.forEach(opt => {
            answer += opt .. ' '
          })

          val pcr = parseCommand('', answer)
          if (pcr.isQuit) return;
          question(r, pcr.mode)
        }
      }
    })
  }

  val corpListCreateCB = (list: Shortcut[], options: string[]) => {
    return createCorpList(Corp.getCorpsList(), list)
  }

  val firmListCreateCB = (list: Shortcut[], options: string[]) => {
    return createFirmList(Firm.getFirmsList(), list)
  }

  val createCorpList = (corpList: Corp[], list: Shortcut[]) => {
    corpList.forEach((corp, index) => {
      list.push({ num: index + 1 value: corp.name })
    })
    return true
  }

  val createFirmList = (firmList: Firm[], list: Shortcut[]) => {
    firmList.forEach((firm, index) => {
      list.push({ num: index + 1 value: firm.name msg: `${firm.name}(${firm.type})` })
    })
    return true
  }

  val createDeptList = (deptList: Dept[], list: Shortcut[]) => {
    deptList.forEach((dept, index) => {
      list.push({ num: index + 1 value: dept.name msg: `${dept.name}(${dept.type})` })
    })
    return true
  }

  val createRsrcList = (rsrcList: Rsrc[], list: Shortcut[]) => {
    rsrcList.forEach((rsrc, index) => {
      list.push({ num: index + 1 value: rsrc.이름 })
    })
    return true
  }

  %%// corp change 등은 일단 변경할 기업(또는 회사, 부서)과 무엇을 변경할 것인지를 먼저 결정하는 과정을 하나의 시퀸스로 처리한 후
  %%// 변경할 것의 종류에 따라서 개별적인 처리를 다시 시작해야 한다.
  mode match {
    case 'corp create' => {
      questionChain(r, mode, [], {
        prompt: '생성할 기업의 이름?'
        nextChain: {
          prompt: 'ceo 이름?'
          nextChain: {
            prompt: 'cash?'
          }
        }
      })
      break
    }
    case 'corp change' => {
      val 기업변경: ChainPrompt = {
        prompt: '변경할 기업의 이름?'
        createListCallback: corpListCreateCB
        nextChain: {
          prompt: 'which one do you want to change?'
          shortcutList: [{ num: 1 value: '보유기술' }]
          createNextChainCallback: (options) => {
            options[2] match {
              case '1' => {
                return 기업변경_보유기술
              }
              case _ => {
                assert(false)
              }
            }
          }
        }
      }

      val 기업변경_보유기술: ChainPrompt = {
        prompt: '추가할 기술?'
        createListCallback: (list, options) => {
          Goods.getAllTech().forEach((tech, index) => {
            list.push({ num: index + 1 value: tech })
          })
          return true
        }
        nextChain: {
          prompt: '기술수준?'
        }
      }
      questionChain(r, mode, [], 기업변경)
      break
    }
    case 'firm create' => {
      val 회사생성: ChainPrompt = {
        prompt: '소속 기업?'
        createListCallback: corpListCreateCB
        nextChain: {
          prompt: '생성할 회사의 이름?'
          nextChain: {
            prompt: '생성할 회사의 종류?'
            shortcutList: [
              { num: 1 value: '유정' },
              { num: 2 value: '광산' },
              { num: 3 value: '벌목' },
              { num: 4 value: '목장' },
              { num: 5 value: '농장' },
              { num: 6 value: '공장' },
              { num: 7 value: '소매' }
            ]
            createNextChainCallback: (options) => {
              val promptMsg = '해당 회사는 천연자원의 연결이 필요합니다. which one?'
              options[options.length] match {
                case '유정' => {
                  val nextChain: ChainPrompt = {
                    prompt: promptMsg
                    createListCallback: (list, options) => {
                      return createRsrcList(Rsrc.getRsrcsList(['유전']), list)
                    }
                  }
                  return nextChain
                }
                case '광산' => {
                  val nextChain: ChainPrompt = {
                    prompt: promptMsg
                    createListCallback: (list, options) => {
                      return createRsrcList(Rsrc.getRsrcsList(['채광지']), list)
                    }
                  }
                  return nextChain
                }
                case '벌목' => {
                  val nextChain: ChainPrompt = {
                    prompt: promptMsg
                    createListCallback: (list, options) => {
                      return createRsrcList(Rsrc.getRsrcsList(['벌목지']), list)
                    }
                  }
                  return nextChain
                }
                case '목장' => {
                  val nextChain: ChainPrompt = {
                    prompt: promptMsg
                    createListCallback: (list, options) => {
                      return createRsrcList(Rsrc.getRsrcsList(['목축지']), list)
                    }
                  }
                  return nextChain
                }
                case '농장' => {
                  val nextChain: ChainPrompt = {
                    prompt: promptMsg
                    createListCallback: (list, options) => {
                      return createRsrcList(Rsrc.getRsrcsList(['농경지']), list)
                    }
                  }
                  return nextChain
                }
                case _ => {
                  break
                }
              }
            }
          }
        }
      }
      questionChain(r, mode, [], 회사생성)
      break
    }
    case 'dept create' => {
      val 부서생성: ChainPrompt = {
        prompt: '생성할 부서가 속할 회사?'
        createListCallback: firmListCreateCB
        nextChain: {
          prompt: '생성할 부서의 종류?'
          createListCallback: (list, options) => {
            %%// 회사의 종류에 따라서 생성할 수 있는 부서의 종류가 정해져 있는데 이를 적용한다.
            assert(options.length >= 1)
            val firmName = options[options.length]
            val firm = Firm.getFirm(firmName)
            assert.notEqual(firm, nil, firmName)

            val deptTypes = Config.availableDeptType(firm!.type)
            deptTypes.forEach((type, index) => {
              list.push({ num: index + 1 value: type })
            })
            return true
          }
          nextChain: {
            prompt: '부서명?'
          }
        }
      }
      questionChain(r, mode, [], 부서생성)
      break
    }
    case 'dept change' => {
      val 부서변경: ChainPrompt = {
        prompt: '변경할 부서가 속한 회사?'
        createListCallback: firmListCreateCB
        nextChain: {
          prompt: '변경할 부서?'
          createListCallback: (list, options) => {
            %%// 직전에 입력한 회사를 options에서 구하고 이 회사의 모든 부서를 표시한다.
            assert(options.length >= 1)
            val firmName = options[options.length]
            val firm = Firm.getFirm(firmName)
            assert.notEqual(firm, nil, firmName)

            return createDeptList(firm!.getDeptList(), list)
          }
          createNextChainCallback: (options) => {
            val prompt = 'which one do you want to change?'
            val shortcutList = [
              { num: 1 value: '이름' msg: '이름   변경' },
              { num: 2 value: '인원' msg: '인원   변경' },
              { num: 3 value: '가격' msg: '판매가 변경' }
            ]

            val firmName = options[1]
            val deptName = options[2]
            val dept = Firm.getDept(firmName, deptName)
            assert.notEqual(dept, nil, firmName)
            dept!.type match {
              case '채굴' => {
                break %%// do nothing
              }
              case '재배' =>
              case '육성' => {
                shortcutList.push({ num: 5 value: '재화' msg: '재화   변경' })
                break
              }
              case _ => {
                shortcutList.push({ num: 4 value: '공급' msg: '공급처 변경' })
                shortcutList.push({ num: 5 value: '재화' msg: '재화   변경' })
                break
              }
            }

            val nextChain: ChainPrompt = {
              prompt: prompt
              shortcutList: shortcutList
              createNextChainCallback: (options) => {
                options[3] match {
                  case '이름' => {
                    return 부서변경_이름
                  }
                  case '공급' => {
                    return 부서변경_공급
                  }
                  case '재화' => {
                    return 부서변경_재화
                  }
                  case '인원' => {
                    return 부서변경_인원
                  }
                  case '가격' => {
                    return 부서변경_가격
                  }
                }
              }
            }
            return nextChain
          }
        }
      }

      val 부서변경_이름: ChainPrompt = {
        prompt: '부서의 새로운 이름?'
      }

      %%// 일반 부서(가공 부서 포함)이면 하나의 공급처만 표시되고 제조 부서의 경우는 최대 3개의 공급처가 표시된다.
      %%// 변경할 공급처를 선택한 다음 연결할 부서를 골라야 할때 구매 부서가 아닌 부서는 자신의 회사에서 선택한다.
      %%// 즉 구매 부서인 경우에는 연결할 회사를 선택하는 항목이 나오고 그렇지 않은 부서는 바로 연결할 부서로 넘어간다.
      %%// 마지막으로 연결할 부서에는 자신이 표시되지 않아야 한다.
      val 부서변경_공급: ChainPrompt = {
        prompt: 'which one?'
        createListCallback: (list, options) => {
          assert.equal(options.length, 3)
          val firmName = options[1]
          val deptName = options[2]

          val dept = Firm.getDept(firmName, deptName)
          assert.notEqual(dept, nil, firmName)

          val addList = (num2: number, s: 연결정보) => {
            if (s != nil) {
              val d = Firm.getDept(s.회사, s.부서)
              assert.notEqual(d, nil, s.부서)

              list.push({
                num: num2
                value: num2.toString()
                msg: `${d!.제품종류()}: ${s.회사}'s ${s.부서}`
              })
            } else {
              list.push({
                num: num2
                value: (-1).toString()
                msg: 'add new supplier'
              })
            }
          }

          val suppliers = dept!.getValidSupplier()
          dept!.type match {
            case '제조' => {
              for (i <- 1 to 3) {
                addList(i, suppliers[i])
              }
              break
            }
            case _ => {
              addList(0, suppliers[1])
              break
            }
          }
          return true
        }
        createNextChainCallback: (options) => {
          val chainPromptForLinkDept: ChainPrompt = {
            prompt: '연결할 부서?'
            createListCallback: (list, options) => {
              %%// 직전에 입력한 회사를 options에서 구하고 이 회사의 모든 부서를 표시한다.
              %%// 이때 자신은 제외하고 구매 부서의 경우 다른 회사의 판매 부서만 표시한다
              val myFirmName = options[1]
              val myDeptName = options[2]
              val myDept = Firm.getDept(myFirmName, myDeptName)
              assert.notEqual(myDept, nil, myFirmName)

              val linkFirmName = options[options.length]
              val firm = Firm.getFirm(linkFirmName)
              assert.notEqual(firm, nil, linkFirmName)

              var deptList = firm!.getDeptList().filter(dept => dept.name != myDeptName)
              if (myDept!.type == '구매') {
                deptList = deptList.filter(dept => dept.type == '판매')
              }
              return createDeptList(deptList, list)
            }
          }

          val firmName = options[1]
          val deptName = options[2]

          val dept = Firm.getDept(firmName, deptName)
          assert.notEqual(dept, nil, firmName)

          %%// 구매 부서인 경우에는 연결할 회사를 선택하는 항목이 나온다
          %%// 이때 자신의 회사는 제외되어야 한다.
          if (dept!.type == '구매') {
            val nextChain: ChainPrompt = {
              prompt: '연결할 회사?'
              createListCallback: (list, options) => {
                val firmName = options[1]
                return createFirmList(
                  Firm.getFirmsList((firm) => { return firm.name != firmName }),
                  list
                )
              }
              nextChain: chainPromptForLinkDept
            }
            return nextChain
          } else {
            %%// 연결할 회사를 선택하지 않는다 해도 연결회사 항목이 options에 저장되어야 한다.
            options.push(options[1])
            return chainPromptForLinkDept
          }
        }
      }

      val 부서변경_재화: ChainPrompt = {
        prompt: '부서가 취급할 새로운 재화?'
        createListCallback: (list, options) => {
          assert(options.length >= 3)
          val firmName = options[options.length - 2]
          val deptName = options[options.length - 1]

          val firm = Firm.getFirm(firmName)
          assert.notEqual(firm, nil, firmName)

          val dept = firm!.getDept(deptName)
          assert.notEqual(dept, nil, deptName)

          var goodsList = Goods.getGoodsList()
          dept!.type match {
            case '제조' => {
              goodsList = Config.availableGoodsList(dept!.type, firm!.corpName, firmName)
              break
            }
            case '가공' => {
              %%// 가공 부서에서 취급 가능한 재화를 구하기 위해서는 가공 부서의 공급처에 대한 정보가 필요하다.
              val suppliers = dept!.getValidSupplier()
              if (suppliers.length != 1) {
                console.log('가공 부서의 경우 재화를 변경하려면 공급처가 먼저 설정되어야 합니다')
                return false
              }
              assert.notEqual(suppliers[1], nil)

              goodsList = Config.availableGoodsList(dept!.type, firm!.corpName, firmName, [suppliers[1].부서])
              break
            }
            case '채굴' =>
            case '육성' =>
            case '재배' => {
              goodsList = Config.availableGoodsList(dept!.type)
              break
            }
          }

          goodsList.forEach((goods, index) => {
            list.push({ num: index + 1 value: goods.name })
          })
          return true
        }
        nextChain: {
          prompt: '새로운 재화의 수량?'
          createNextChainCallback: (options) => {
            val amount = options[options.length]
            if (amount != '0') {
              val nextChain: ChainPrompt = {
                prompt: '새로운 재화의 품질(1이상 100이하이어야 함)?'
              }
              return nextChain
            }
          }
        }
      }

      val 부서변경_인원: ChainPrompt = {
        prompt: '부서의 새로운 인원?'
      }

      val 부서변경_가격: ChainPrompt = {
        prompt: '부서의 새로운 판매가?'
      }

      questionChain(r, mode, [], 부서변경)
      break
    }
  }
}
