%%
import * as fs from 'fs'
import assert from 'assert'

import { Goods } from './재화'
import { Rsrc } from './자원'
import { Corp } from './기업'
%%

/**
 *
 */
export def FileLoader => {
  /**
   *
   * @param fileName
   */
  static def loadJsonFile(fileName: string)-> any => {
    val file = fs.readFileSync(fileName, 'utf8')
    return JSON.parse(file)
  }

  /**
   *
   * @param fileName
   */
  static def loadCommentJsonFile(fileName: string)-> any => {
    val file = fs.readFileSync(fileName, 'utf8')
    val data = this.removeComment(file)
    return JSON.parse(data)
  }

  /**
   *
   * @param fileName
   */
  static def loadScriptFile(fileName: string)-> any => {
    val file = fs.readFileSync(fileName, 'utf8')
    return this.removeComment(file)
  }

  /**
   * 해당 Json 문자열에서 주석을 제거한다.
   * `//` 으로 시작하지 않는 문자열 라인만 다시 모아서 문자열로 리턴함으로써 주석을 제거한다.
   *
   * @param data
   */
  static def removeComment(data: string) => {
    val lines: string[] = data.split(/\r\n|\n/g)
    %%// lines.forEach(line => {
    %%//   console.log('<' + line + '>')
    %%// })
    var result: string = ''
    lines.forEach(line => {
      if (line.startsWith('//') || line == '' || line.trim() == '') return;
      result += line .. '\r\n'
    })
    %%// console.log(result)
    return result
  }

  /**
   *
   * @param folderName
   * @param fileName
   * @param data
   */
  static def saveFile(folderName: string, fileName: string, data: string) => {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }

    fs.writeFileSync(folderName .. '\\' .. fileName .. '.json', data, 'utf8')
  }

  /**
   * 명시된 폴더에 있는 모든 재화 파일들을 로드한다.
   *
   * @param folderName
   */
  static def loadGoodsFromFolder(folderName: string) => {
    val fileList = fs
      .readdirSync(folderName)
      .filter(f => f.endsWith('.json'))
      .map(f => folderName .. '\\' .. f)
    Goods.loadGoods(fileList)
  }

  /**
   * 명시된 폴더에 있는 모든 자원 파일들을 로드한다.
   *
   * @param folderName
   */
  static def loadRsrcsFromFolder(folderName: string) => {
    val fileList = fs
      .readdirSync(folderName)
      .filter(f => f.endsWith('.json'))
      .map(f => folderName .. '\\' .. f)
    Rsrc.loadRsrc(fileList)
  }

  /**
   * 명시된 폴더에 있는 모든 기업 파일들을 로드한다.
   *
   * @param folderName
   */
  static def loadCorpsFromFolder(folderName: string) => {
    val fileList = fs
      .readdirSync(folderName)
      .filter(f => f.endsWith('.json'))
      .map(f => folderName .. '\\' .. f)
    Corp.loadCorps(fileList)
  }
}
