%%
import assert from 'assert'
import * as readline from 'readline'

import { LogService } from './LogService'
import { LogUtil } from './LogUtil'
import { SimDate } from './SimDate'
import { 설정 } from './설정'
import { Goods } from './재화'
import { Corp, CorpLogic } from './기업'
import { Firm } from './회사'
import { Dept, 연결정보 } from './부서'
import { Market } from './시장'
import { Consumer } from './소비자'
import { 재화표시 } from './재화표시'
import { 기업표시 } from './기업표시'
import { 회사표시 } from './회사표시'
import { 부서표시 } from './부서표시'
import { 소비표시 } from './소비표시'

import { Engine } from './Engine'
import { question } from './Question'
import { FileLoader } from './FileLoader'
%%

/**
 * command의 긴 문자열을 shortkey의 짧은 문자열로 대치하는 개념이다.
 * 해당 정보는 shortkey.json 파일에서 읽어들인다.
 */
var shortkeyGlobal: {
  var shortkey: string
  var command: string
}[] = []

def loadShortkey(fileName: string = '') => {
  val path = 설정.dataFolder
  val fullpath = if fileName == '' then path .. 'shortkey.cjson' else path .. `${fileName}.cjson`

  val json = FileLoader.loadCommentJsonFile(fullpath)
  shortkeyGlobal = json.shortkeys

  %%// console.log(fullpath)
  %%// console.log(shortkeyGlobal)
}

/**
 * 숫자로 값을 선택하는 경우에 사용된다.
 */
export def Shortcut => {
  var num: number
  var value: string
  var msg?: string
}

/**
 * 여기서는 기업, 회사, 부서, 상품들의 목록이 표시되어질때
 * 목록에 표시된 넘버링을 이용해서 바로 해당 항목을 선택할 수 있다.
 * 번호를 입력하고 엔터를 치면 question -> parseCommand로 처리가 진행되는데
 * 입력한 번호가 전달된다. parseCommand()는 입력과 분리되어져 있어 입력되어진 값만 받을 뿐
 * 무엇을 입력하지는 알 수 없다.그러므로 parseCommand가 이전 턴에서 처리된 이 번호가 무엇인지를
 * 알기 위해서는 mode와 번호가 무엇을 의미하는 것인지를 저장하고 있어야 한다.
 * num : 항목의 번호
 * value : 항목의 실질적인 값
 */
var shortkeyTable: Shortcut[] = []

/**
 *
 */
def 기업로직 extends CorpLogic => {
  def 자산가치(corp: Corp) => {
    return corp.cash + corp.매출()
  }
}

@NotTrans def readline => {
  def createInterface()
}
@NotTrans def process => {
  def stdin()
  def stdout()
}

/**
 *
 */
export def midas_engine_cli_run() => {
  LogService.create()
  LogService.addFileLogger('save', 'watchdog.md')

  disp('Hello Midas-engine')

  Engine.processCommand('engine', 'load')

  Corp.injectLogic(new 기업로직())

  addProductToMarket()

  loadShortkey()

  disp('load complete')

  val r = readline.createInterface({
    input: process.stdin
    output: process.stdout
  })

  question(r, '')
}

/**
 *
 * @param s
 */
def disp(s: string | nil) => {
  if (s == nil) return;
  LogService.log(s)
}

def disp2(s: string[] | nil) => {
  if (s == nil) return;
  s.forEach(t => disp(t))
}

def getBeforeDay(before: number) => {
  return new SimDate(SimDate.getToday()).moveDay(-before)
}

/**
 *
 * @param mode
 * @param command
 * @returns
 */
export def parseCommand(
  mode: string,
  command: string
)-> {
  var mode: string
  var isQuit: boolean
} => {
  val recommendMsg = LogUtil.setTextColor(
    'green',
    'command list: goods, corp, firm, dept, consumer, sale, log, run, watch, save, reload and quit'
  )

  var tokens = command.toLocaleLowerCase().split(' ')
  if (tokens == nil) {
    console.log(recommendMsg)
    return { mode: '' isQuit: false }
  }

  %%// 공백 제거
  tokens = tokens.filter(token => token != '')
  if (tokens.length == 0) {
    console.log(recommendMsg)
    return { mode: '' isQuit: false }
  }

  if (mode != '') {
    val num = parseInt(tokens[1].trim())
    if (Number.isNaN(num)) {
      var options: string = ''
      tokens.forEach(token => {
        options += ' ' .. token
      })
      return parseCommand('', mode .. options)
    }

    val short = shortkeyTable.find(n => n.num == num)
    if (short != nil) {
      return parseCommand('', mode .. ' ' .. short.value)
    }
    return { mode: '' isQuit: false }
  }

  disp('## ' .. command)
  disp('')

  /**
   *
   * @param goodsFilter
   * @returns
   */
  val applyGoodsFilter = (goodsFilter: Goods[])-> Shortcut[] => {
    val shortcuts: Shortcut[] = []
    val goodsList = goodsFilter
    if (goodsList.length == 0) {
      disp('There is no goods...')
      return shortcuts
    }

    val sorted = goodsList.sort((a, b) => {
      if (a.종류 > b.종류) return 1
      if (a.종류 < b.종류) return -1
      return 0
    })

    var no = 0
    sorted.forEach((goods: Goods) => {
      shortcuts.push({ num: no += 1 value: goods.name })
    })

    no = 0
    val result = 재화표시.재화목록(sorted)
    for (n <- 1 to result.length) {
      if (n == 1) {
        result[n] = '|no ' .. result[n]
      } else if (n == 2) {
        result[n] = '|---' .. result[n]
      } else {
        result[n] = '|' .. (no += 1).toString().padStart(3) .. result[n]
      }
    }

    disp2(result)
    return shortcuts
  }

  /**
   *
   * @param corpFilter
   * @returns
   */
  val applyCorpFilter = (corpFilter: Corp[])-> Shortcut[] => {
    val shortcuts: Shortcut[] = []
    val corpList = corpFilter
    if (corpList.length == 0) {
      disp('There is no corp...')
      return shortcuts
    }

    var no = 0
    corpList.forEach((corp: Corp) => {
      shortcuts.push({ num: no += 1 value: corp.name })
    })

    no = 0
    val result = 기업표시.기업목록(corpList)
    for (n <- 1 to result.length) {
      if (n == 1) {
        result[n] = '|no ' .. result[n]
      } else if (n == 2) {
        result[n] = '|---' .. result[n]
      } else if (n == result.length) {
        result[n] = '|   ' .. result[n]
      } else {
        result[n] = '|' .. (no += 1).toString().padStart(3) .. result[n]
      }
    }

    disp2(result)
    return shortcuts
  }

  /**
   *
   * @param firmFilter
   * @returns
   */
  val applyFirmFilter = (firmFilter: Firm[])-> Shortcut[] => {
    val shortcuts: Shortcut[] = []
    val firmList = firmFilter
    if (firmList.length == 0) {
      disp('There is no firm...')
      return shortcuts
    }

    var no = 0
    firmList.forEach((firm: Firm) => {
      shortcuts.push({ num: no += 1 value: firm.name })
    })

    no = 0
    val result = 회사표시.회사목록(firmList)
    for (n <- 1 to result.length) {
      if (n == 1) {
        result[n] = '|no ' .. result[n]
      } else if (n == 2) {
        result[n] = '|---' .. result[n]
      } else if (n == result.length) {
        result[n] = '|   ' .. result[n]
      } else {
        result[n] = '|' .. (no += 1).toString().padStart(3) .. result[n]
      }
    }

    disp2(result)
    return shortcuts
  }

  /**
   *
   * @param deptFilter
   * @returns
   */
  val applyDeptFilter = (deptFilter: Dept[])-> Shortcut[] => {
    val shortcuts: Shortcut[] = []
    val deptList = deptFilter
    if (deptList.length == 0) {
      disp('There is no dept...')
      return shortcuts
    }

    var no = 0
    deptList.forEach((dept: Dept) => {
      shortcuts.push({ num: no += 1 value: dept.name })
    })

    no = 0
    val result = 부서표시.부서목록(deptList)
    for (n <- 1 to result.length) {
      if (n == 1) {
        result[n] = '|no ' .. result[n]
      } else if (n == 2) {
        result[n] = '|---' .. result[n]
      } else if (n == result.length) {
        result[n] = '|   ' .. result[n]
      } else {
        result[n] = '|' .. (no += 1).toString().padStart(3) .. result[n]
      }
    }

    disp2(result)
    return shortcuts
  }

  var isQuit = false
  tokens[1].trim() match {
    case '재화' =>
    case 'goods' => {
      var goodsName = tokens[2]
      if (goodsName == nil || goodsName == '') {
        console.log('[usage] goods')
        console.log('[usage] goods all')
        console.log('[usage] goods <재화명>')
        console.log('[usage] goods <분류항목>')
        console.log('------------------------')
        goodsName = 'list'
      }

      goodsName match {
        case 'list' => {
          val tbl = applyGoodsFilter(Goods.getGoodsList())
          if (tbl != nil) {
            shortkeyTable = tbl
            mode = 'goods'
          }
          break
        }
        case 'all' => {
          Goods.getGoodsList().forEach(goods => {
            disp2(재화표시.상세정보(goods))
          })
          break
        }
        case _ => {
          %%// 명시된 재화가 존재하면 해당 재화에 대한 자세한 정보를 표시하고
          %%// 명시된 재화가 존재하지 않으면 재화명을 종류 및 분류 항목으로 취급하고
          %%// 해당 분류 항목의 모든 재화 리스트를 출력해 준다.
          val goods = Goods.getGoods(goodsName, false)
          if (goods.name == goodsName)
          then { disp2(재화표시.상세정보(goods)) }
          else {
            val goodsKind = goodsName
            val goodsList = Goods.getGoodsList([goodsKind])
            if (goodsList.length == 0)
            then { disp(`I don't think '${goodsKind}' is goods category`) }
            else {
              val tbl = applyGoodsFilter(goodsList)
              if (tbl != nil) {
                shortkeyTable = tbl
                mode = 'goods'
              }
            }
          }
        }
      }
      break
    }

    case '기업' =>
    case 'corp' => {
      var corpName = tokens[2]
      if (corpName == nil || corpName == '') {
        console.log('[usage] corp')
        console.log('[usage] corp <기업명>')
        console.log('------------------------')
        corpName = 'list'
      }

      corpName match {
        case 'list' => {
          val tbl = applyCorpFilter(Corp.getCorpsList())
          if (tbl != nil) {
            shortkeyTable = tbl
            mode = 'corp'
          }
          break
        }
        case 'create' => {
          if (tokens.length == 2)
          then mode = 'corp create'
          else {
            Engine.processCommand('corp', 'create', tokens.splice(3))
          }
          break
        }
        case 'change' => {
          if (tokens.length == 2)
          then mode = 'corp change'
          else {
            Engine.processCommand('corp', 'change', tokens.splice(3))
          }
          break
        }
        case _ => {
          val corp = Corp.getCorp(corpName)
          if (corp == nil) {
            console.log("I can't find corp:", corpName)
            break
          }

          disp2(기업표시.상세정보(corp, getBeforeDay(30), SimDate.getToday()))

          val firms = corp.getFirmsList()
          disp(LogUtil.setBackColor('green', '사업체별 요약정보') .. ' : ' .. firms.length .. '개')

          val tbl = applyFirmFilter(firms)
          if (tbl != nil) {
            shortkeyTable = tbl
            mode = 'firm'
          }
          break
        }
      }
      break
    }

    case '회사' =>
    case 'firm' => {
      var firmName = tokens[2]
      if (firmName == nil || firmName == '') {
        console.log('[usage] firm')
        console.log('[usage] firm filter [<기업명> | <회사종류> | <재화명>]')
        console.log('[usage] firm <회사명>')
        console.log('------------------------')
        firmName = 'list'
      }

      firmName match {
        case 'list' => {
          val tbl = applyFirmFilter(Firm.getFirmsList())
          if (tbl != nil) {
            shortkeyTable = tbl
            mode = 'firm'
          }
          break
        }
        case 'create' => {
          if (tokens.length == 2)
          then mode = 'firm create'
          else {
            Engine.processCommand('firm', 'create', tokens.splice(3))
          }
          break
        }
        case 'change' => {
          if (tokens.length == 2)
          then mode = 'firm change'
          else {
            Engine.processCommand('firm', 'change', tokens.splice(3))
          }
          break
        }
        case 'filter' => {
          var option = tokens[3]
          if (option == nil || option == '') {
            console.log('I need filter option like <기업명> | <회사종류> | <재화명>')
            break
          }

          %%// filter가 기업명인지를 검사하고 기업명이면 해당 기업에 속한 모든 회사를 리턴한다.
          val corp = Corp.getCorp(option)
          if (corp != nil) {
            val firmList = corp.getFirmsList()
            if (firmList.length == 0) {
              console.log('There is no firm...')
              break
            }

            val tbl = applyFirmFilter(firmList)
            if (tbl != nil) {
              shortkeyTable = tbl
              mode = 'firm'
            }
            break
          }

          %%// filter가 회사종류인지를 검사하고 회사 종류이면 해당 종류의 회사명을 리턴한다.
          val kind = Engine.forwardProcessOrder.find(kind => kind == option)
          if (kind != nil) {
            val filtered = Firm.getFirmsList((firm) => { firm.type == kind })
            if (filtered.length == 0) {
              console.log('There is no firm...')
              break
            }

            val tbl = applyFirmFilter(filtered)
            if (tbl != nil) {
              shortkeyTable = tbl
              mode = 'firm'
            }
            break
          }

          %%// 기업명이나 회사종류가 아니면 재화명으로 간주하고 별도의 검사없이 필터링한다.
          val filtered = Firm.getFirmsList((firm) => {
            return firm.getProductList().includes(option)
          })
          if (filtered.length == 0) {
            console.log('There is no firm...')
            break
          }
          val tbl = applyFirmFilter(filtered)
          if (tbl != nil) {
            shortkeyTable = tbl
            mode = 'firm'
          }
          break
        }
        case _ => {
          val firm = Firm.getFirm(firmName)
          if (firm == nil) {
            console.log("I can't find firm:", firmName)
            break
          }

          disp2(회사표시.상세정보(firm, getBeforeDay(10), SimDate.getToday()))

          disp(LogUtil.setBackColor('green', '부서별 요약정보'))
          val tbl = applyDeptFilter(firm.getDeptList())
          if (tbl != nil) {
            shortkeyTable = tbl
            mode = 'dept'
          }
          break
        }
      }
      break
    }

    case '부서' =>
    case 'dept' => {
      var deptName = tokens[2]
      if (deptName == nil || deptName == '') {
        console.log('[usage] dept <부서명>')
        console.log('[usage] dept <부서명> 재무')
        console.log('------------------------')
        deptName = 'list'
      }

      deptName match {
        case 'list' => {
          break
        }
        case 'create' => {
          if (tokens.length == 2)
          then mode = 'dept create'
          else {
            Engine.processCommand('dept', 'create', tokens.splice(3))
          }
          break
        }
        case 'change' => {
          if (tokens.length == 2)
          then mode = 'dept change'
          else {
            Engine.processCommand('dept', 'change', tokens.splice(3))
          }
          break
        }
        case _ => {
          var option = tokens[3]
          if (option == nil || option == '') {
            option = '상세'
          }

          val dept = Firm.getDept(deptName)
          if (dept == nil) {
            console.log("I can't find dept:", deptName)
            break
          }

          option match {
            case '상세' => {
              disp(`회사: ${dept.회사().name}`)
              disp2(부서표시.상세정보(dept))
              break
            }
            case '재무' => {
              disp2(부서표시.재무정보(dept, getBeforeDay(10), SimDate.getToday()))
              break
            }
          }
          break
        }
      }
      break
    }

    case '소비자' =>
    case 'consumer' => {
      var option = tokens[2]
      if (option == nil || option == '') {
        console.log('[usage] consumer')
        console.log('[usage] consumer stat (며칠전부터)')
        console.log('------------------------')
        option = 'list'
      }

      option match {
        case 'list' => {
          disp2(소비표시.소비자기본정보())
          break
        }
        case 'stat' => {
          var before = 10
          if (tokens.length == 3) {
            before = parseInt(tokens[3])
          }
          disp2(소비표시.소비자상세정보(getBeforeDay(before), SimDate.getToday()))
          break
        }
      }
      break
    }

    case '판매' =>
    case 'sale' => {
      var option = tokens[2]
      if (option == nil || option == '') {
        console.log('[usage] sale')
        console.log('[usage] sale all')
        console.log('[usage] sale 재화명')
        console.log('[usage] sale 상품명')
        console.log('------------------------')
        option = 'list'
      }

      option match {
        case 'list' => {
          %%// 시장에 나와 있는 모든 재화에 대한 현재의 판매 정보를 표시한다.
          val shortcuts: Shortcut[] = []
          val goodsList: string[] = Market.getGoodsList().map(g => g.name)

          if (goodsList.length == 0) {
            disp('There is no prod...')
            break
          }

          var no = 1
          val list: string[] = []
          goodsList.forEach(goodsName => {
            shortcuts.push({ num: no value: goodsName })

            val result = 소비표시.개별재화판매현황(goodsName, getBeforeDay(1), SimDate.getToday())
            result.forEach((r, index) => {
              if (index == 0)
              then list.push((no += 1).toString() .. '. ' .. r)
              else list.push(r)
            })
          })
          disp2(list)

          val tbl = shortcuts
          if (tbl != nil) {
            shortkeyTable = tbl
            mode = 'sale'
          }
          break
        }
        case 'all' => {
          %%// 시장에 나와 있는 모든 재화의 열흘전부터 지금까지의 판매 정보를 보여준다.
          val goodsList = Market.getGoodsList().map(g => g.name)

          disp2(소비표시.다수재화판매현황(goodsList, getBeforeDay(10), SimDate.getToday()))
          break
        }
        case _ => {
          %%// 먼저 재화명인지 상품명인지를 검사한다.
          val goods = Goods.getGoods(option)
          if (goods.name == option)
          then {
            val goodsName = option
            disp2(소비표시.다수재화판매현황([goodsName], getBeforeDay(10), SimDate.getToday()))
          }
          else {
            val prodName = option

            %%// 별명을 지원한다.
            var name = prodName
            val product = Market.getProduct(prodName)
            if (product != nil)
            then name = product.이름
            else {
              console.log("I can't find product:", prodName)
              break
            }

            disp2(소비표시.개별상품판매현황(name, getBeforeDay(10), SimDate.getToday()))
          }
          break
        }
      }
      break
    }

    case '로그' =>
    case 'log' => {
      val deptName = tokens[2]
      if (deptName == nil || deptName == '') {
        console.log('[usage] log 시장')
        console.log('[usage] log 소비자')
        console.log('[usage] log <부서명1> <부서명2> ...')
        console.log('------------------------')
        break
      }
      deptName match {
        case '소비자' => {
          Consumer.로그출력 = !Consumer.로그출력
          break
        }
        case '시장' => {
          Market.로그출력 = !Market.로그출력
          break
        }
        case _ => {
          var deptNames: string[] = []
          for (n <- 2 to tokens.length) {
            deptNames.push(tokens[n])
          }

          deptNames.forEach(deptName => {
            val dept = Firm.getDept(deptName)
            if (dept != nil) {
              dept.로그출력 = !dept.로그출력
            }
          })
          break
        }
      }
      break
    }

    case '실행' =>
    case 'run' => {
      val step_token = tokens[2]
      if (step_token == 'step') {
        val runStep = Engine.processCommand('engine', 'run', [step_token])
        if (runStep != 0) {
          console.log('run 세부단계 진행을 완료하지 않았습니다. run step을 실행하세요')
          break
        }
      } else {
        var step1 = 1
        if (!(step_token == nil || step_token == '')) {
          step1 = parseInt(step_token)
        }
        Engine.processCommand('engine', 'run', [step1.toString()])
      }
      break
    }

    case 'watch' =>
    case 'watch2' => {
      val usage = '[usage] watch <며칠전부터> <부서명1> <부서명2> ...'
      if (tokens.length == 1) {
        console.log(usage)
        break
      }

      var before = parseInt(tokens[2])
      if (Number.isNaN(before)) {
        console.log(usage)
        break
      }

      val deptNames: string[] = []
      for (n <- 3 to tokens.length) {
        deptNames.push(tokens[n])
      }

      val watchDeptList: 연결정보[] = []
      deptNames.forEach(d => {
        val dept = Firm.getDept(d)
        if (dept != nil) {
          watchDeptList.push({
            회사: dept.회사().name
            부서: dept.name
          })
        }
      })

      if (tokens[1].trim() == 'watch') {
        val result1 = 부서표시.부서간비교_재화(watchDeptList, getBeforeDay(before), SimDate.getToday())
        val result2 = 부서표시.부서간비교_자금(watchDeptList, getBeforeDay(before), SimDate.getToday())
        disp2(result1.concat(''))
        disp2(result2)
      } else {
        disp2(부서표시.부서간비교_간략(watchDeptList, getBeforeDay(before), SimDate.getToday()))
      }
      disp('')

      val watchFirmList: string[] = []
      watchDeptList.forEach(e => {
        if (!watchFirmList.includes(e.회사)) {
          watchFirmList.push(e.회사)
        }
      })

      disp2(회사표시.회사간자금비교(watchFirmList, getBeforeDay(before), SimDate.getToday()))
      break
    }

    case 'save' => {
      var folderName = tokens[2]
      if (folderName == nil || folderName == '') {
        console.log('[usage] save')
        console.log('[usage] save <폴더명>')
        console.log('------------------------')
        folderName = 설정.saveFolder
      }
      Engine.processCommand('corp', 'save', [folderName])
      Engine.processCommand('firm', 'save', [folderName])
      break
    }

    case 'reload' => {
      var option = tokens[2]
      if (option == nil || option == '') {
        console.log('[usage] reload')
        console.log('[usage] reload short (<파일명>)')
        console.log('[usage] reload script (<파일명>)')
        console.log('[usage] reload consumer (<파일명>)')
        console.log('------------------------')
        option = 'default'
      }
      option match {
        case 'default' => {
          %%// 중간에 shortkey.json 파일을 변경해서 계속 진행할 수 있게 함
          loadShortkey()
          break
        }
        case 'short' => {
          val fileName = if tokens.length == 3 then tokens[3] else ''
          loadShortkey(fileName)
          break
        }
        case 'script' => {
          val fileName = if tokens.length == 3 then tokens[3] else ''
          Engine.processCommand('engine', 'script', [fileName])
          break
        }
        case 'consumer' => {
          val fileName = if tokens.length == 3 then tokens[3] else '소비자'
          val consumerFile = 설정.dataFolder .. fileName .. '.cjson'
          Consumer.load(consumerFile)
          break
        }
        case _ => {
          console.log('ERROR: please check the usage...')
        }
      }
      break
    }

    case 'today' => {
      disp(SimDate.getToday().toString())
      break
    }

    case 'quit' => {
      console.log('Bye Midas-engine')
      isQuit = true
      break
    }

    case 'test1' => {
      val firm = Firm.getFirm('sadang')
      if (firm == nil) { break }

      val dept = firm.addDept('판매')
      if (dept == nil) { break }

      dept.공급처변경(0, '', '벌목1')
      console.log(dept)
      break
    }

    case 'test2' => {
      %%// 가격 변경이 의미를 가질려면 그냥 가격만 변경해 주는 것으로는 안된다.
      %%// 해당 상품을 판매하는 판매부서의 판매가격을 변경해야 한다.
      val dept = Firm.getDept('병우유공장', '병우유제조')
      %%// dept?.가격설정(20)
      dept?.제품관리자.getShedList().forEach(shed => console.log(shed))

      %%// if (dept != nil) {
      %%//   dept.주문.push({
      %%//     발주회사: '-1',
      %%//     발주부서: '-1',
      %%//     재화명: '병우유',
      %%//     주문량: 20,
      %%//   })
      %%// }

      break
    }

    case _ => {
      val sk = shortkeyGlobal.find(k => k.shortkey == tokens[1].trim())
      if (sk == nil) {
        console.log(recommendMsg)
        mode = ''
      } else {
        return parseCommand('', sk.command)
      }
    }
  }

  disp('')
  return { mode: mode isQuit: isQuit }
}

def addProductToMarket() => {
  Market.출시({
    이름: '알토랑_비누'
    별명: '알토랑'
    재화명: '비누'
    이미지: 'string'
    상품설명: 'string'
    판매회사: '-1'
    판매부서: '-1'
    공급물량: 5000
    가격: 15
    품질: 30
    상표: 0
  })

  Market.출시({
    이름: '중국산_비누'
    별명: '중국산'
    재화명: '비누'
    이미지: 'string'
    상품설명: 'string'
    판매회사: '-1'
    판매부서: '-1'
    공급물량: 1000
    가격: 5
    품질: 20
    상표: 0
  })
}

