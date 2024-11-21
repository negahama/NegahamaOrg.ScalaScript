# Welcome to ScalaScript

## What is ScalaScript

_ScalaScript_ is new programming language that combined data type of TypeScript with some grammars of Scala.

To be honestly, for now, I think it's right that the proper name of ScalaScript is _Scala-tic typescript_. ^^

If you know and like both of Scala and TypeScript, you might also like ScalaScript because ScalaScript is mixed of favorite things from both languages.

Here's simple sample code of ScalaScript. With this code, you can quickly figure out what kind of language ScalaScript is.

```ts
val greeting = 'hello world'
// The two codes below are the same and are both available in ScalaScript.
if not greeting console log greeting
if (!greeting) console.log(greeitng)

val matchTest = (x: number) -> string => x match {
  case 1 => return "one"
  case 2 => return "two"
  case _ => return "other"
}
val result = matchTest(1)

// Repeat the process of adding all the values of the array 10 times
var sum = 0
val arr = [1, 2, 3]
for (i <- 1 to 10; j <- arr) {
  sum += j
}
```

> For more infomation about ScalaScript, you can visit [This site](https://blog.naver.com/hsk141/223549212519) (It's written by Korean)

Anyway **ScalaScript is transpiler which is transpiled to TypeScript**. It means that you can get the TypeScript code when you code with ScalaScript.

If you want to do that, you need to download ScalaScript CLI by follow command

> `npm i --save-dev scala-script`

and add script in `package.json`

> `"scripts": {`  
> `   "transpile": "ssc generate src/*.ss -d src"`  
> ` }`

and then run script

> `npm run transpile`

This project is based on the Langium and provided you the insigt of creating your DSL with using the Langium

Last but not least, ScalaScript is NOT complete, it's been developing right now...
I always welcome your advice and any kind of help.

Thank you

## Where you can get the resouces about ScalaScript

### ScalaScript Grammar

If you are curious about this language, I am very sorry that I did not prepare the appropriate documents in advance.

I have a development blog in Korean, but I don't have an official grammar manual in English yet.

I'll get it ready as soon as possible.

### ScalaScript Develop blog

[This site](https://blog.naver.com/hsk141/223549212519) is about how I am developing the ScalaScript language in detail.
But It's written by Korean language. if you know Korean, this site is very useful to get insight and informations about ScalaScript and Langium

### Langium offical site

Documentation about the Langium framework is available at https://langium.org
