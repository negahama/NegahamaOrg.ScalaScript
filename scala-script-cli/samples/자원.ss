%%
import assert from 'assert'

import { Goods } from './재화'
import { FileLoader } from './FileLoader'
%%

/**
 * 자원은 재화의 특별한 종류이다.
 * 이 클래스는 자원이라는 재화에 대한 것이 아니라
 * 세상에 있는 자원들과 자원들이 있는 장소 같은 것들을 처리하기 위한 것이다.
 */
export def Rsrc => {
  %%//
  var 이름: string = ''

  %%//
  var 종류: string = ''

  %%//
  var 재화: string = ''

  %%//
  var 가격: number = 0

  %%//
  var 품질: number = 0

  %%//
  var 매장량: number = 0

  /**
   *
   * @param 이름
   * @param 종류
   */
  def constructor(이름: string, 종류: string) => {
    this.이름 = 이름
    this.종류 = 종류
  }

  /**
   *
   */
  private static var rsrcTable = new Map<string, Rsrc>()

  /**
   *
   * @param fileList
   */
  static def loadRsrc(fileList: string[]) => {
    fileList.forEach(fileName => {
      val obj = FileLoader.loadJsonFile(fileName)

      assert.notEqual(obj.이름, nil)
      assert.notEqual(obj.종류, nil)
      assert.notEqual(obj.가격, nil)

      val rsrc = new Rsrc(obj.이름, obj.종류)
      rsrc.가격 = obj.가격

      rsrc.종류 match {
        case '농경지' => {
          assert.notEqual(obj.비옥도, nil)
          rsrc.품질 = obj.비옥도
          break
        }
        case '목축지' => {
          assert.notEqual(obj.비옥도, nil)
          rsrc.품질 = obj.비옥도
          break
        }
        case _ => {
          assert.notEqual(obj.재화, nil)
          assert.notEqual(obj.품질, nil)
          assert.notEqual(obj.매장량, nil)
          assert.notEqual(obj.매장량, 0)
          assert.notEqual(Goods.getGoods(obj.재화).name, 'atom')

          rsrc.재화 = obj.재화
          rsrc.품질 = obj.품질
          rsrc.매장량 = obj.매장량
          break
        }
      }

      this.rsrcTable.set(obj.이름, rsrc)
    })
  }

  /**
   *
   * @param rsrcName
   * @returns
   */
  static def getRsrc(rsrcName: string)-> Rsrc | nil => {
    val res = this.rsrcTable.get(rsrcName)
    if (res == nil) {
      console.log('undefined res:', rsrcName)
      return nil
    }
    return res
  }

  /**
   * kindList에서 명시한 자원들을 리턴한다.
   * kindList가 없으면 모든 자원을 리턴한다.
   *
   * @returns
   */
  static def getRsrcsList(kindList: string[] = []) => {
    val result: Rsrc[] = []
    this.rsrcTable.forEach(rsrc => {
      if (kindList.length == 0) result.push(rsrc)
      else {
        if (kindList.includes(rsrc.종류)) result.push(rsrc)
      }
    })
    return result
  }
}
