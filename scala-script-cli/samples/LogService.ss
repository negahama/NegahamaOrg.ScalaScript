%%
import * as fs from 'fs'
import assert from 'assert'
%%

/**
 *
 */
def Logger => {
  def log(msg: string, ...optionalParams: any[]) => {
  }
}

/**
 *
 */
def ConsoleLogger extends Logger => {
  /**
   *
   */
  def create() => {}

  /**
   *
   * @param msg
   */
  def log(msg: string, ...optionalParams: any[]) => {
    console.log(msg, ...optionalParams)
  }
}

/**
 *
 */
def FileLogger extends Logger => {
  var logFileName: string = ''

  /**
   *
   * @param folderName
   * @param logFileName
   */
  def create(folderName: string, fileName: string) => {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }
    this.logFileName = folderName .. '\\' .. fileName
    fs.writeFileSync(this.logFileName, 'Log by Samuel\n\n', 'utf8')
  }

  /**
   * 로그들이 파일에 정상적으로 써질지라도 vscode에서 .md 파일을 로드할때 줄바꿈이 안되는 문제가 있다.
   * 그래서 라인마다 '\\'을 추가할 필요가 있는데 이것도 모든 라인에 적용할 수 없다.
   * 줄바꿈이 필요한 라인만 해줘야 하는데 여기서는 그걸 알 수 없다.
   *
   * @param msg
   */
  def log(msg: string, ...optionalParams: any[]) => {
    if (this.logFileName == '' || msg == nil) return;
    if (optionalParams == nil || optionalParams.length == 0) {
      fs.appendFileSync(this.logFileName, msg .. '\n', 'utf8')
    } else {
      var fullmsg = msg
      optionalParams.forEach((param: any) => {
        fullmsg += ' ' .. param.toString()
      })
      fullmsg += '\n'
      fs.appendFileSync(this.logFileName, fullmsg, 'utf8')
    }
  }

  %%// for md file
  def log2(msg: string, ...optionalParams: any[]) => {
    if (this.logFileName == '' || msg == nil) return;
    if (optionalParams == nil || optionalParams.length == 0) {
      fs.appendFileSync(this.logFileName, msg .. '\\\n', 'utf8')
    } else {
      var fullmsg = msg
      optionalParams.forEach((param: any) => {
        fullmsg += ' ' .. param.toString()
      })
      fullmsg += '\\\n'
      fs.appendFileSync(this.logFileName, fullmsg, 'utf8')
    }
  }
}

/**
 *
 */
export def LogService => {
  /**
   *
   */
  static var loggers: Logger[] = []

  /**
   *
   */
  static def create() => {
    val defaultLogger = new ConsoleLogger()
    this.addLogger(defaultLogger)
  }

  /**
   *
   * @param logger
   */
  static def addLogger(logger: Logger) => {
    this.loggers.push(logger)
  }

  /**
   *
   * @param folderName
   * @param logFileName
   */
  static def addFileLogger(folderName: string, logFileName: string) => {
    val fileLogger = new FileLogger()
    fileLogger.create(folderName, logFileName)
    this.addLogger(fileLogger)
  }

  /**
   *
   * @param msg
   */
  static def log(msg: string, ...optionalParams: any[]) => {
    this.loggers.forEach(logger => {
      logger.log(msg, ...optionalParams)
    })
  }

  /**
   * 좀 더 편리하게 log를 표시하기 위한 함수이다.
   *
   * @param prefix
   * @param indent
   * @param msg
   * @param optionalParams
   */
  static def smartlog(prefix: string, indent: number, msg: string = '', ...optionalParams: any[]) => {
    var space = ''
    for (n <- 0 until indent) {
      space += '  '
    }
    val fullmsg = prefix .. '> ' .. space .. msg
    this.loggers.forEach(logger => {
      if (optionalParams == nil || optionalParams.length == 0) {
        if (logger instanceof FileLogger) { logger.log2(fullmsg) }
        else { logger.log(fullmsg) }
      } else {
        %%// 여기서 일부러 ...optionalParams 이 아닌 optionalParams을 사용하였다.
        %%// 왜냐하면 배열로 처리되면 값들을 구분하는 comma와 대괄호로 인해 훨씬 보기 좋기 때문이다.
        %%// 이걸 일괄적으로 적용하면 this.log()에서 빈 배열을 처리해야 하기 때문에 여기서 분리해서 처리한다.
        if (logger instanceof FileLogger) { logger.log2(fullmsg, optionalParams) }
        else { logger.log(fullmsg, optionalParams) }
      }
    })
  }
}
