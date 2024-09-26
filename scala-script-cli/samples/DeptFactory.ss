%%
import assert from 'assert'

import { Firm } from './회사'
import { Dept } from './부서'
import { 육성부서 } from './육성부서'
import { 재배부서 } from './재배부서'
import { 제조부서 } from './제조부서'
import { 채굴부서 } from './채굴부서'
import { 가공부서 } from './가공부서'
import { 판매부서 } from './판매부서'
%%

/**
 *
 */
export def DeptFactory => {
  /**
   *
   */
  static var deptFileNameMap = new Map<string, string>([
    ['구매', 'data\\template\\구매부서.json'],
    ['제조', 'data\\template\\제조부서.json'],
    ['판매', 'data\\template\\판매부서.json'],
    ['채굴', 'data\\template\\채굴부서.json'],
    ['육성', 'data\\template\\육성부서.json'],
    ['재배', 'data\\template\\재배부서.json'],
    ['가공', 'data\\template\\가공부서.json'],
    ['재고', 'data\\template\\재고부서.json']
  ])

  /**
   * deptKind 타입의 부서를 생성하고 firm에 추가한다.
   *
   * @param firm
   * @param deptKind
   * @returns
   */
  static def createDept(firm: Firm, deptKind: string) => {
    var dept: Dept
    deptKind match {
      case '구매' => {
        dept = new Dept(firm, '구매')
        break
      }
      case '제조' => {
        dept = new 제조부서(firm, '제조')
        break
      }
      case '판매' => {
        dept = new 판매부서(firm, '판매')
        break
      }
      case '채굴' => {
        dept = new 채굴부서(firm, '채굴')
        break
      }
      case '육성' => {
        dept = new 육성부서(firm, '육성')
        break
      }
      case '재배' => {
        dept = new 재배부서(firm, '재배')
        break
      }
      case '가공' => {
        dept = new 가공부서(firm, '가공')
        break
      }
      case '재고' => {
        dept = new Dept(firm, '재고')
        break
      }
      case _ => {
        console.log('undefined dept.종류:', deptKind)
        assert(false)
        return;
      }
    }
    return dept
  }
}
