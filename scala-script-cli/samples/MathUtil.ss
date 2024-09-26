/**
 *
 */
export def MathUtil => {
  static def round(value: number)-> number => {
    return Math.round((value + Number.EPSILON) * 1000) / 1000
  }
}
