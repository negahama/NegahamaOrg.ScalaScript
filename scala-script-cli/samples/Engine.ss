%%
import assert from 'assert'

import { SimDate } from './SimDate'
import { Corp } from './기업'
import { Firm } from './회사'
import { setupLoad, 설정 } from './설정'
import { Consumer } from './소비자'
import { Market } from './시장'
import { 기업이력 } from './기업이력'
import { 회사이력 } from './회사이력'
import { 소비이력 } from './소비이력'
import { FileLoader } from './FileLoader'
%%

%%/*
마이더스 엔진을 제어하는 각종 명령들의 처리 함수이다

이 함수는 아래에서 설명하는 구조로 명령을 내려면 세부적인 처리를 알아서 해 준다.
명령은 대부분 마이더스 엔진을 구성하는 각종 객체들의 생성, 변경과 관련되어진 것이다. 이들 객체들의 정보 표시는 관여하지 않는다.
이것은 마이더스 엔진과의 인터페이스 역할을 한다.

processCommand의 명령 체계는 다음과 같은 형태를 가진다.

    domain command options
    
#### domain

domain은 처리의 영역, 대상을 의미하며 다음과 같은 것들이 있다.

- engine
- corp
- firm
- dept

#### command

command는 해당 영역에서 수행할 작업을 의미하는데 도메인에 따라서 다르며 다음과 같은 것들이 있다.

- engine
  - load
  - run
- corp, firm, dept
  - create
  - change
  - save
*/%%
/**
 * 마이더스 엔진을 제어하는 각종 명령들의 처리 함수이다
 *
 * @param domain
 * @param command
 * @param options
 * @returns
 */
export def Engine => {
  /**
   *
   */
  static var runStep = 0

  /**
   * 전방향, 역방향시 회사들의 처리 순서
   */
  static var forwardProcessOrder: string[] = [
    '유정',
    '광산',
    '벌목',
    '목장',
    '농장',
    '공장',
    '소매'
  ]

  static var backwardProcessOrder: string[] = [
    '소매',
    '공장',
    '농장',
    '목장',
    '벌목',
    '광산',
    '유정'
  ]

  /**
   *
   */
  static def load() => {
    val setupFile = 'work/설정.cjson'
    setupLoad(setupFile)

    val consumerFile = 설정.dataFolder .. '소비자.cjson'
    Consumer.load(consumerFile)

    FileLoader.loadGoodsFromFolder(설정.dataFolder .. '재화')
    FileLoader.loadRsrcsFromFolder(설정.dataFolder .. '자원')
    FileLoader.loadCorpsFromFolder(설정.dataFolder .. '기업')

    %%// val 기업파일리스트: string[] = [설정.dataFolder .. '기업/내가하마.json']
    %%// Corp.loadCorps(기업파일리스트)

    기업이력.setCorpHistory()
    Corp.getCorpsList().forEach(corp => {
      회사이력.setFirmHistory(corp.getFirmsList())
    })

    %%// Consumer.validate()
    %%// Goods.validate()
    %%// Corp.validate()
  }

  /**
   *
   * @param days
   */
  static def run(days: number) => {
    val today = SimDate.getToday()
    for (n <- 1 to days) {
      console.log(today.toString() .. ' >>>>>-------------->>>>>\\')
      this.processForward()

      Consumer.process()
      소비이력.snapshot(today)

      console.log(today.toString() .. ' <<<<<--------------<<<<<\\')
      this.processBackward()
      기업이력.snapshot(today)
      Market.process()

      today.moveDay(1)
    }
  }

  /**
   *
   * @param scriptFileName
   */
  static def runScript(scriptFileName: string) => {
    val data = FileLoader.loadScriptFile('work/' .. scriptFileName)
    val lines: string[] = data.split(/\r\n|\n/g)
    lines.forEach(line => {
      if (line == '') return;
      console.log('executing...', line)
      val regex = /\s+/g
      val tokens = line.split(regex)
      if (tokens == nil || tokens.length < 2) {
        console.log('ERROR in script:', tokens)
        return;
      }
      val d = tokens[1]
      val c = tokens[2]
      val o = tokens.splice(3)
      this.processCommand(d, c, o)
    })
  }

  /**
   * 순방향, 역방향 처리시 회사와 부서의 처리 순서를 자연스럽게 하기 위해서
   * 모든 기업들의 사업체를 종류별로 순서대로 처리되게 해야 한다.
   */
  static def processForward() => {
    val firmList: Firm[] = Firm.getFirmsList()
    this.forwardProcessOrder.forEach(type => {
      firmList
        .filter(f => f.type == type)
        .forEach(f => {
          f.process_초기화()
          f.process_출고()
        })
    })

    this.forwardProcessOrder.forEach(type => {
      firmList.filter(f => f.type == type).forEach(f => f.process_입고())
    })

    this.forwardProcessOrder.forEach(type => {
      firmList.filter(f => f.type == type).forEach(f => f.process_자체())
    })
  }

  /**
   * 순방향, 역방향 처리시 회사와 부서의 처리 순서를 자연스럽게 하기 위해서
   * 모든 기업들의 사업체를 종류별로 순서대로 처리되게 해야 한다.
   */
  static def processBackward() => {
    val firmList: Firm[] = Firm.getFirmsList()
    this.backwardProcessOrder.forEach(type => {
      firmList.filter(f => f.type == type).forEach(f => f.process_발주())
    })

    Corp.getCorpsList().forEach(corp => {
      corp.processCash()
    })
  }

  /**
   *
   * @param domain
   * @param command
   * @param options
   * @returns
   */
  static def processCommand(domain: string, command: string, options: string[] = []) => {
    domain.trim() match {
      case 'engine' => {
        command.trim() match {
          case 'load' => {
            this.load()
            break
          }
          case 'run' => {
            if (options[1] == 'step') {
              val today = SimDate.getToday()
              this.runStep match {
                case 0 => {
                  console.log(today.toString() .. ' >>>>>-------------->>>>>\\')
                  this.processForward()
                  this.runStep += 1
                  break
                }
                case 1 => {
                  Consumer.process()
                  소비이력.snapshot(today)
                  this.runStep += 1
                  break
                }
                case 2 => {
                  console.log(today.toString() .. ' <<<<<--------------<<<<<\\')
                  this.processBackward()
                  기업이력.snapshot(today)
                  Market.process()

                  this.runStep = 0
                  today.moveDay(1)
                  break
                }
              }
              return this.runStep
            } else {
              val step1 = parseInt(options[1])
              this.run(step1)
            }
            break
          }
          case 'script' => {
            val scriptFileName = options[1]
            this.runScript(scriptFileName)
            break
          }
        }
        break
      }
      case 'corp' => {
        command.trim() match {
          case 'create' => {
            assert.notEqual(options, nil)
            assert.equal(options.length, 3)
            assert.notEqual(options[1], '')

            val corpName = options[1]
            val ceoName = options[2]
            val cash = parseInt(options[3])
            val corp = Corp.createCorp(corpName, ceoName, cash)
            if (corp != nil) 기업이력.createCorpHistory(corp)
            break
          }
          case 'change' => {
            assert.notEqual(options, nil)
            assert.equal(options.length, 4)
            assert.notEqual(options[1], '')

            val corpName = options[1]
            val component = options[2]
            val newValue1 = options[3]
            val newValue2 = options[4]

            val corp = Corp.getCorp(corpName)
            assert.notEqual(corp, nil, corpName)

            if (component == '보유기술') {
              if (corp!.보유기술 == nil) corp!.보유기술 = []
            }

            corp!.보유기술.push({
              이름: newValue1
              수준: parseInt(newValue2)
            })
            break
          }
          case 'save' => {
            val folderName = options[1]
            Corp.getCorpsList().forEach(corp => {
              console.log('save corp:', folderName .. '/기업/' .. corp.name .. '.json')
              FileLoader.saveFile(folderName .. '/기업', corp.name, JSON.stringify(corp))
            })

            break
          }
        }
        break
      }
      case 'firm' => {
        command.trim() match {
          case 'create' => {
            assert.notEqual(options, nil)
            assert(options.length >= 3)
            assert.notEqual(options[1], '')
            assert.notEqual(options[2], '')
            assert.notEqual(options[3], '')

            val corpName = options[1]
            val firmName = options[2]
            val firmType = options[3]
            val rsrcName = options[4]
            val firm = Firm.createFirm(corpName, firmType, firmName, rsrcName)
            if (firm != nil) 회사이력.createFirmHistory(firm)
            break
          }
          case 'save' => {
            val folderName = options[1]
            Firm.getFirmsList().forEach(firm => {
              console.log('save firm:', folderName .. '/회사/' .. firm.name .. '.json')
              FileLoader.saveFile(folderName .. '/회사', firm.name, JSON.stringify(firm))
            })
            break
          }
        }
        break
      }
      case 'dept' => {
        command.trim() match {
          case 'create' => {
            assert.notEqual(options, nil)
            assert(options.length >= 3)
            assert(options.length <= 4)
            assert.notEqual(options[1], '')
            assert.notEqual(options[2], '')

            val firmName = options[1]
            val deptType = options[2]
            val deptName = options[3]

            val dept = Firm.createDept(firmName, deptType, deptName)
            assert.notEqual(dept, nil, deptType)
            if (dept == nil) {
              console.log(`${deptName}(을)를 생성하지 못했습니다`)
            }
            break
          }
          case 'change' => {
            assert.notEqual(options, nil)
            assert(options.length >= 4)
            assert(options.length <= 6)
            assert.notEqual(options[1], '')
            assert.notEqual(options[2], '')
            assert.notEqual(options[3], '')

            val firmName = options[1]
            val deptName = options[2]
            val component = options[3]
            val newValue1 = options[4]
            val newValue2 = options[5]
            val newValue3 = options[6]

            val dept = Firm.getDept(firmName, deptName)
            if (dept == nil) {
              console.log('Invalid firm name or dept name:', firmName, deptName)
            } else {
              component match {
                case '이름' => {
                  dept.name = newValue1
                  break
                }
                case '공급' => {
                  val linkNo = parseInt(newValue1)
                  val linkFirm = newValue2
                  val linkDept = newValue3

                  val result = dept.공급처변경(linkNo, linkFirm, linkDept)
                  if (result != nil) {
                    console.log('입력을 변경하지 못했습니다. error code:', result)
                  }
                  break
                }
                case '재화' => {
                  val result = dept.취급재화변경(newValue1)
                  if (result) {
                    console.log('품목을 변경하지 못했습니다. error code:', result)
                    break
                  }
                  val 수량 = if newValue2 != nil then parseInt(newValue2) else 0
                  val 품질 = if newValue3 != nil then parseInt(newValue3) else 0

                  dept.제품입고({
                    재화: newValue1
                    수량: 수량
                    가격: 0
                    품질: 품질
                    상표: 0
                  })
                  break
                }
                case '인원' => {
                  val result = dept.인원변경(parseInt(newValue1))
                  if (result != nil) {
                    console.log('인원을 변경하지 못했습니다. error code:', result)
                  }
                  break
                }
                case '가격' => {
                  val result = dept.가격변경(parseInt(newValue1))
                  if (result != nil) {
                    console.log('판매가를 변경하지 못했습니다. error code:', result)
                  }
                  break
                }
              }
            }
            break
          }
        }
        break
      }
    }
  }
}
