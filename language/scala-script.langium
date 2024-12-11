grammar ScalaScript

entry Program: codes+=Code*;

Code: Statement | Expression;

/*
  변수
  변수는 타입이나 값이 아니다. 값을 가질 수 있는 상자이다. 값의 종류(타입)에 따라서 사용법이 달라진다.
  VariableDef   | Definition | var n: number = 3
  VariableType  | X          | 변수의 타입은 primitive, function, object, array 등이 type이 될 수 있다.
  VariableValue | X          | 변수의 값도 타입들의 값이다.
  VariableCall  | Name       | 변수 이름만으로 변수 사용
                | Name(...)  | 타입이 함수인 경우 예) f(msg)
                | Name[...]  | 타입이 배열인 경우 예) ary[1]
                | Name.name  | 타입이 오브젝트인 경우 예) obj.name

  함수
  FunctionDef   | Definition | fun f = (msg: string) -> void => { ... }
  FunctionType  | Type       | (msg: string) -> void
  FunctionValue | Expression | (msg: string) -> void => { ... }

  배열
  ArrayDef      | X          | 배열 자체를 정의하지는 않는다.
  ArrayType     | Type       | number[]
  ArrayValue    | Expression | [ 1, 2, 3 ]

  오브젝트
  ObjectDef     | Definition | def Person = { var name: string, var age: number }
  ObjectType    | Type       | { var name: string, var age: number }
  ObjectValue   | Expression | { name: "samuel", age: 20 }
*/

//-----------------------------------------------------------------------------
// 스칼라스크립트의 자료형 관련
//-----------------------------------------------------------------------------
// Union type
// Union type은 모든 타입의 가장 최상위 타입이며 간단히 Types라고 표현한다.
Types: 
  types+=SimpleType ('|' types+=SimpleType)*;

/*
  타입으로 사용될 수 있는 모든 타입들
  ElementType은 하나의 항목만을 가지는 타입들이며 
  CompoundType과 ArrayType은 두개 이상의 항목을 가지는 타입들이다.
  ArrayType은 동일한 타입이 연속된 구조를 취하는 특수한 Compound 타입이다.
  ArrayType을 CompoundType과 구분해서 처리하는 것은 표기 방법과 처리가 매우 다르기 때문이다.
  현재 CompoundType은 ObjectType 밖에 없기 때문에 이를 별도로 구분하지 않고 ObjectType으로 사용한다.
*/
SimpleType:
  ArrayType | ObjectType | ElementType;

// 해당 개체의 타입이 배열형임을 나타내기 위해 사용된다.
// ex) var ary: number[]
ArrayType:
  // SimpleType ({infer ArrayType.elementType=current} '[' ']')? ;
  elementType=(ObjectType | PrimitiveType | TypeChain) '[' ']';

// ex) var obj: { name: string, age: number }
ObjectType:
  '{' elements+=ObjectTypeElement* '}';
  // '{' elements+=ObjectTypeElement? (','? elements+=ObjectTypeElement)* '}';

ObjectTypeElement:
  (Bypass | VariableDef | FunctionDef | ObjectDef) (',')?;

// 하나의 항목만을 가지는 타입들
ElementType:
  PrimitiveType
  | FunctionType
  | TypeChain;

PrimitiveType:
  type=('any' | 'nil' | 'void' | 'string' | 'number' | 'boolean');

/*
  함수 타입이란 함수의 파라메터와 리턴 타입을 명시한 것을 말한다.
  일반적으로 FunctionValue와 FunctionCall(CallChain에 포함됨)이 주로 쓰이지만 변수의 타입으로 사용되는 경우에 단독으로 사용된다.
  ex) (msg: string) -> void
*/
FunctionType:
  '(' Parameters? ')' FunctionReturn;

TypeChain:
  reference=[ObjectDef:Id] (generic=GenericValue)? ({infer TypeChain.previous=current} "." reference=[ObjectDef:Id] (generic=GenericValue)?)*;

GenericDef:
  '<' types+=Id (',' types+=Id)* '>';

GenericValue:
  '<' types+=SimpleType (',' types+=SimpleType)* '>';

//todo
// TupleType:
//   '[' types+=SimpleType (',' types+=SimpleType)* ']';

type NamedElement =
  VariableDef
  | FunctionDef
  | ObjectDef
  | Iterator
  | Parameter;

//-----------------------------------------------------------------------------
// Statements
//-----------------------------------------------------------------------------

Statement:
  Bypass
  | VariableDef
  | FunctionDef
  | ObjectDef
  | DoStatement
  | ForStatement
  | WhileStatement
  | ThrowStatement
  | TryCatchStatement
  | Continue
  | Break;

/*
  Value and Variable Declarations and Definitions
  -----------------------------------------------------------------------------
  모든 변수는 다음의 규칙을 가지고 있다.
  이름 : 타입 = 값
  타입이나 값을 통해서 변수의 타입을 알수 있어야 한다.
  VariableDef Rule 자체는 타입과 값이 모두 없을 수 있지만 둘 다 있거나 적어도 하나는 있어야 한다.
  타입과 값은 모두 있으면 값은 명시된 타입으로 변환되며 이 변환이 실패하면 에러가 된다.

  이전에 다중 선언문을 지원했지만 삭제하기로 했다.
  다중 선언문의 유용성에 비해 처리가 복잡해지기 시작했기 때문이다.
  다중 선언문을 처리하기 위해서는 DefaultScopeComputation의 processNode()를 override해서
  여러 개의 이름을 각각의 AstNodeDescription으로 만들어 precomputedScope에 추가해 주어야 한다.
  그런데 이것은 GlobalScope에서는 정상동작하지만 LocalScope에서는 동작하지 않았다.
  원인을 분석하고 계속 지원하기에는 다중 선언문 자체가 너무 유용성이 적어 포기했다.

  var, val 은 스칼라의 문법을 차용한 것으로 엄밀하게 말하면 변수의 성격을 결정하는 것이다.
  var는 재할당이 가능한 변수를, val은 한번 할당되면 다시 재할당되지 않는 변수로 지정하는 것이다.
  하지만 스칼라스크립트는 타입스크립트의 let, const와 동일하기 때문에 스칼라의 var, val와 엄밀히는 다르다.
*/
VariableDef:
  (Annotation)? Modifier kind=('val' | 'var') TypedId ('=' value=Expression)?;

fragment Annotation:
  '@' annotate=Id;

fragment Modifier:
  (export?='export')? (private?='private')? (static?='static')?;

fragment TypedId:
  name=Id (nullable?='?')? (':' type=Types)?;

/*
  Function Defintion
  -----------------------------------------------------------------------------
  선언 또는 정의에서 중요한 것은 대상이다. 선언의 대상은 변수일 수도 있고 타입 자체일 수도 있다.
  우리가 보통 val array: number[] 와 같이 선언하는 것은 숫자형 배열을 타입으로 가지는 array라는
  변수를 선언하는 것이며 class Person { ... } 은 Person이라는 이름을 가지는 타입을 선언하는 것이다.
  그럼 function display(msg: string) { ... } 와 같은 함수의 선언은 무엇을 선언한 것일까?
  함수의 선언은 타입에 대한 선언이 아니라 변수 선언처럼 값에 대한 선언에 가깝다.
  다른 타입들은 특정 값을 명시하는 방법으로 상수를 사용(예를들어 3.14159라는 값에 PI라는
  이름을 부여하기 위해서 상수를 사용)하는데 반해 함수는 별도의 문법이 있는 것이다.
  함수의 정의는 함수형 언어에서는 전역 함수형 상수의 정의와 동일한 개념이다.

  하지만 기존의 함수 정의가 필요한 경우가 딱 하나 있다.
  파생 클래스에서 부모 클래스의 함수를 오버라이드하면서 super로 부모 함수를 사용하는 경우이다.
  이 경우의 부모 함수는 개념적으로 변수(또는 상수)일 수가 없다. 자식 클래스에서 PI를 변경하면서
  super.PI로 PI가 부모 클래스에서 가졌던 값을 사용한다는 것이 억지스럽기 때문이다.
  물론 이것을 우회해서 동일한 기능을 구현할 순 있지만 불편하기 때문에 스칼라스크립트에서도
  함수의 정의를 지원하기로 했다. 하지만 여전히 함수의 정의를 일반적인 것으로 보지는 않는다.

  스칼라스크립트는 함수형 변수 형태로 함수를 사용하는 것을 원칙으로 하고 많은 경우 타입스크립트에서도
  함수형 변수로 변환되지만 모두는 아니다. 특히 생성자와 디폴트 파라메터를 가지는 함수는 타입스크립트에서
  람다 함수로 변환이 안되기 때문에 일반 함수로 변환된다. 하지만 이것은 스칼라스크립트가 그렇게 변환한다는
  것이므로 스칼라스크립트 코드 자체에서는 다음과 같이 호출하면 된다.
  val constructor = (msg: string)           -> void => { ... } // 생성자 함수
  val paramMethod = (msg: string = "hello") -> void => { ... } // 디폴트 파라메터가 있는 함수

  FunctionValue란 함수 자체를 말하는 것으로 변수에 함수를 할당할 때 우변에 있어야 하는 것이 FunctionValue이다.
  함수는 파라메터와 리턴타입, 함수의 바디로 구성되고 함수를 표시할때 `(msg: string) -> void => { ... }` 와 같이
  리턴 타입은 -> 으로 표시하고 함수의 바디는 => 으로 표시한다. 함수의 리턴 타입을 -> 으로 표기하는 것은
  ScalaScript가 다른 언어와 구분되는 차이점 중에 하나이다.
  함수형 변수의 완전한 표현은 var f:(msg: string) -> void = (msg: string) -> void => { ... } 이지만
  f 변수의 타입을 중복으로 기술할 필요가 없기 때문에 var f = FunctionValue 형태로 표시할 수 있다. 
  함수의 값에 함수 타입이 포함되는 점은 혼란의 여지가 있지만 이것이 없는 함수 바디는 그냥 block일 뿐이다.
  인수는 괄호를 사용해서 묶어야 하지만 인수가 하나인 경우에는 괄호없이 사용할 수도 있다.
*/
FunctionValue:
  ('(' Parameters? ')' | params+=Parameter) (FunctionReturn)? FunctionBody;

/*
  parameter와 argument는 다르다.
  parameter는 함수의 매개변수를 의미하는 용어이며 초기값을 가질 수 있지만
  argument는 함수의 호출에서 함수에 전달되는 값으로 초기값 같은 선언적 의미가 없다.
*/
Parameter:
  (spread?='...')? TypedId ('=' value=Expression)?;

fragment Parameters:
  params+=Parameter (',' params+=Parameter)*;

fragment FunctionReturn:
  '->' returnType=Types;

fragment FunctionBody:
  '=>' body=Block;

/*
  함수의 정의 자체는 값에 대한 이름 부여이고 위에서 설명하였듯이 ScalaScript에서는 이를 예외적인 경우로 본다.
  var, val, def 와 동일하게 이름 다음에 = 이 오고 그 다음에 함수값(FunctionValue)이 위치한다.
*/
FunctionDef:
  (Annotation)? Modifier 'fun' (extension=[ObjectDef:Id] '.')? name=Id (generic=GenericDef)? 
  '=' '(' Parameters? ')' (FunctionReturn)? (FunctionBody)?;

Block:
  (isBracket?=('{' | INDENT) codes+=Code+ ('}' | DEDENT)) | codes+=Expression;

/*
  Object Definition
  -----------------------------------------------------------------------------
  Object는 유저가 정의하는 타입을 모두 포괄하는 단어이며 여기에는 일반적인 Class, Interface를 모두 포함한다.
  Object는 복합타입 컨테이너로 자신을 제외한 모든 타입을 가질 수 있다.
  예를들면 단일타입, 다른 복합타입, 배열타입등을 모두 element로 가질 수 있다. 

  Object의 정의란 특정 타입에 이름을 부여하는 것이다.
  스칼라스크립트에서 def 로 시작하는 것은 모두 타입에 대해 이름을 부여하는 것이다.
  스칼라스크립트에서는 클래스, 오브젝트등의 사용자 정의 자료구조의 구분이 없기 때문에(모두 오브젝트라고 칭함)
  def는 일반적으로 오브젝트의 선언인데 이것은 오브젝트 개체를 선언하는 것이 아니라 타입 자체를 선언하는 것이다.
  예를들어 name과 age를 가지는 타입이 있으면 이것의 타입은 { name: string, age: number } 이다.
  이 타입을 매번 이렇게 쓰기가 불편하기 때문에 이를 Person 이라는 이름으로 사용하는 것이다.

  이는 함수도 마찬가지이다. 예를 들어 def EventHandler = (event: Event, param: EventParam) => EventResult 는
  (event: Event, param: EventParam)을 파라메터로 가지고 EventResult를 리턴하는 함수 타입을 EventHandler라는 이름으로
  지정한 것이며 var f: EventHandler 와 같이 선언하거나 f = EventHandler => { ... } 와 같이 쓰일 수 있다.
  EventHandler는 함수 타입의 이름이지 함수가 아니라는 점이 중요하다.

  스칼라스크립트에서는 오브젝트와 클래스를 구분하지 않지만 실제로 타입스크립트로 변환할때는 구분해야 하는데
  함수나 대입문이 있거나 변수의 값을 초기화하는 경우 클래스로 변환된다.
  자세한 내용은 transpileObjectDef()를 참고
*/
ObjectDef:
  (Annotation)? (export?='export')?
  'def' name=Id (generic=GenericDef)? ('extends' superClass=[ObjectDef:Id])?
  '=' body=ObjectType;

// ex) var obj = { name : "samuel", age : 20, ...ary }
ObjectValue:
  '{' elements+=(AssignBinding)* '}';

// AssignBinding은 원래 : 대신 = 을 사용했는데 이것은 Assignment와 모호성 문제가 발생했다.
AssignBinding: (element=Id ':' value=Expression | spread=SpreadExpression) (',')?;

// 기타
//-----------------------------------------------------------------------------

// Do Loop
DoStatement:
  'do' loop=Block 'while' ConditionClause;

// For Comprehensions and For Loops
ForStatement:
  'for' '(' iterators+=Iterator (';' iterators+=Iterator)* ')' loop=Block;

Iterator: ForOf | ForTo;

// to=Id 대신 to=('to' | 'until')을 사용해야 하지만 to, until이 keyword로 사용되는 것을 막기 위해서 이렇게 한다.
ForOf: name=Id '<-' of=Expression;
ForTo: name=Id '<-' e1=Expression to=Id e2=Expression ('step' step=IntegerLiteral2)?;

// step은 마이너스를 포함한 정수값만을 가질 수 있다.
IntegerLiteral2 returns number:
  ('-' | '+')? IntegerLiteral;

// While Loop
WhileStatement:
  'while' ConditionClause loop=Block;

// Throw Statement
ThrowStatement:
  'throw' throw=Expression;

// Try Statement
TryCatchStatement:
  'try' body=Block
  ('catch' ('{' | INDENT) cases+=CaseClause+ ('}' | DEDENT))?
  ('finally' finally=Expression)?;

Continue: dummy='continue';
Break: dummy='break';

// Bypass
Bypass: bypass=BYPASS;
terminal BYPASS returns string: /(%%\/\/[^\n\r]*|%%[\s\S]*?%%)/;

//-----------------------------------------------------------------------------
// Expressions
//-----------------------------------------------------------------------------
/*
  Logical rule은 많은 rule을 내포하고 있다.
  이것은 관계 연산 뿐만 아니라 비교 연산과 사칙 연산을 모두 포함하고 있으며
  CallChain을 거쳐 SimpleExpression까지 포함한다.
*/
Expression:
  Logical
  | LogicalNot
  | Assignment
  | IfExpression
  | InfixExpression
  | ReturnExpression
  | SpreadExpression
  | FunctionValue
  | ObjectValue
  | ArrayValue
  ;

// Binary Operators
// 논리 연산자 처리
Logical infers Expression:
  InstanceOf     ({infer BinaryExpression.left=current} operator=('and' | 'or' | '&&' | '||') right=InstanceOf)*;

// instanceof 연산자의 우선 순위는 비교연산자와 동일하다.
InstanceOf infers Expression:
  Comparison     ({infer BinaryExpression.left=current} operator=('instanceof') right=Comparison)*;

// 비교 연산자
Comparison infers Expression:
  Addition       ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Addition)*;

// 산술 연산자 중 덧셈, 뺄셈, 문자열 접합 연산
Addition infers Expression:
  Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-' | '..') right=Multiplication)*;

// 산술 연산자 중 곱셈, 나눗셈, 나머지
Multiplication infers Expression:
  Exponentiation ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=Exponentiation)*;

// 거듭제곱의 처리 - 산술 연산 중에서는 가장 우선 순위가 높다.  
Exponentiation infers Expression:
  MatchOperator  ({infer BinaryExpression.left=current} operator=('**') right=MatchOperator)*;

/*
  Match expression
  이것을 별도의 expression(예를들어 assignment와 같이)으로 취급하는 것이 자연스러워 보인다.
  실제로도 그렇게 처리하고 있었는데 문제는 이것의 원래 구문인 
  MatchExpression:
    expr=CallChain 'match' '{' cases+=CaseClause+ '}';
  은 문법적으로는 에러가 없지만 parser가 구문분석을 할때 lookahead 처리에 너무나 많은 시간이 소요되는 단점이 있었다.
  이것을 아래와 같이 switch 문으로 변경하면 구문이 분명해져서 lookahead 처리에 드는 시간을 모두 없앨 수 있지만
  'switch' '(' expr=Expression ')' '{' cases+=CaseClause+ '}';
  스칼라스크립트의 특징 중에 하나인 match문을 포기할 수 없어서 이렇게 변경하였다.
*/
MatchOperator infers Expression:
  UnaryOperator ({infer MatchExpression.expr=current} 'match' '{' cases+=CaseClause+ '}')*;

CaseClause:
  'case' pattern=(CaseDefalut | CasePattern) '=>' (body=Block)?;

CaseDefalut returns string: '_';
CasePattern: Literal;

// Unary operators
// 이것은 거듭제곱보다 우선순위가 높은 연산이다.
UnaryOperator infers Expression:
  {infer UnaryExpression} (operator=('-' | '+' | 'typeof'))? value=CallChain;

/*
  Member call and Chaining of Member calls
  CallChain은 RefCall의 연장선이라고 할 수 있다.
  CallChain의 시작은 RefCall만 있는 것이 아니기 때문에 둘은 분명 다르지만 . 이후의 체이닝에서는 RefCall과 거의 동일하다.
  또한 CallChain은 모든 산술, 비교, 관계 연산의 기본 element이며 value를 가지는 expression 이라고 할 수 있다.
  RefCall과 함께 CallChain은 체이닝된 모든 variables, functions, arrays, fields, methods를 모두 포함한다.

  CallChain(또는 RefCall)은 Array expression을 포함한다.
  즉 Array를 실제로 사용하는 ary[1]와 같은 구문을 function의 function call과 동일하게 취급하고 있다.
  ArrayExpression:
    element=[NamedElement:Id] isArray?='[' index=Expression ']';
  ArrayExpression은 RefCall과 CallChain에 포함되어져 있으며 ary[1]과 같은 구문이
  ary이라는 element와 [1]이라는 ArrayValue로 인식되지 않도록 위와 같이 정의되어야 한다.

  CallChain을 아래와 같이 정의한 이유...
  CallChain을 정의하는 다양한 방법들이 있을 수 있는데 아래와 같이 정의하게 된 과정을 살펴보면...

  CallChain infers Expression:
    SimpleExpression ({infer CallChain.previous=current} "." CallableElements )*;
  fragment CallableElements:
    element=[NamedElement:Id] ( FunctionCallSignature | ArrayCallSignature )?;
  FunctionCallSignature:
    isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')';
  ArrayCallSignature:
    isArray?='[' index=Expression ']';

  여기서 isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')'는
  FunctionCallSignature와 동일하지만 FunctionCallSignature를 사용할 수 없다.
  심지어 FunctionCallSignature의 내용인 isFunction?='(' Arguments? ')'을 사용하는 것도 안된다.

  [Fragment와 Ref 동시 사용시 문제점](/.prism/docs/1d29c20692a691a8fb6ba4b666d9ccef.md) 참고
*/
CallChain infers Expression:
  SimpleExpression ({infer CallChain.previous=current} "." element=[NamedElement:Id]
  (isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')' | isArray?='[' index=Expression ']')?
  (assertion=('!'|'?'))? )*;

// CallChain infers Expression:
//   SimpleExpression ({infer CallChain.previous=current} "." element=[NamedElement:Id]
//   (isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')' | ArrayCallSignature )?
//   // ( FunctionCallSignature | ArrayCallSignature )?
//   (assertion=('!'|'?'))? )*;

// fragment FunctionCallSignature:
//   isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')';
// fragment ArrayCallSignature:
//   isArray?='[' index=Expression ']';

/*
  CallChain의 시작점으로 사용되는 atomic expressions
  이것은 RefCall(변수, 함수, 배열)과 this, super, (expr), new를 포함하며
  Literal도 포함된다. Literal은 'abc'.split() 또는 1 + 2 와 같은 구문을 위해 필수적이다. 
*/
SimpleExpression infers Expression:
  RefCall
  | ThisOrSuper
  | GroupExpression
  | NewExpression
  | Literal;

/*
  RefCall은 reference개체의 호출, 사용을 의미하는데 이것은 일반적인 변수, 함수, 배열을 포함하고 있다.
  이것은 주로 CallChain의 시작점으로 사용되며 CallChain이 이것을 포함하는 보다 일반적인 개념이기 때문에
  주로 CallChain이 사용되며 이것이 개별적으로 사용되는 경우는 semantic token으로 색상 구별을 하기 위한
  경우가 거의 유일하다.

  ScalaScript에서 정의되는 것은 당연히 정상적으로 동작을 하지만 타입스크립트에서 정의되어져 있는 것들은
  예를들면 console.log의 console은 정의되지 않았기 때문에 에러가 된다. 그래서 타입스크립트의 라이브러리를
  사용할때는 cross-reference를 처리하기 위해 다음과 같은 추가적인 코드가 필요하다.
  1) Console.log 의 경우
  @NotTrans class Console { log(arg: string): void = {} }
  @NotTrans var console: Console
  2) 문자열 관련 함수들의 경우
  @NotTrans def string.repeat(count: number): string
  @NotTrans def string.replace(searchFor: string, replaceWith: string): string
  @NotTrans def string.replaceAll(searchFor: string, replaceWith: string): string
*/
RefCall: {infer CallChain}
  element=[NamedElement:Id]
  (isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')' | isArray?='[' index=Expression ']')?
  (assertion=('!'|'?'))?;

/*
  CallChain의 시작점으로 this, super를 가지고 있다.
  this, super를 element=[NamedElement:'this']으로 설정하면 ScopeProvider에서 적절한 멤버들을 리턴하게 할 순 있지만
  this, super자체가 AstNode 상에서 없기 때문에 Could not resolve reference to NamedElement named 'this' 에러가 생긴다.
  설령 node가 있다고 해도 this, super로 reference하는 개체를 정의할 수가 없다. 즉 this, super를 reference로 처리할 수가 없다.
  따라서 현재 this, super는 그냥 keyword로 처리하고 있으며 이들을 담는 프로퍼티 이름도 element가 아닌 this로 설정되어져 있는데
  이는 Langium이 Reference와 다른 타입을 union type으로 만드는 것을 지원하지 않기 때문이다.
*/
ThisOrSuper: {infer CallChain} this=('this' | 'super');

// grouped expression with parentheses
GroupExpression:
  '(' value=Expression ')';

// new expression
NewExpression:
  'new' class=[ObjectDef:Id] (generic=GenericValue)? '(' (args+=Expression (',' args+=Expression)*)? ')';

/*
  Literals
  There are literals for booleans, integer numbers, floating point numbers, strings, and so on.
  The syntax of these literals is in each case as in TypeScript.
  FloatingPointLiteral, IntegerLiteral은 minus을 포함하지 않는다.
  minus는 unary operation으로 따로 정의되어져 있음 
*/
Literal:
  value=( 'any' | 'nil' | 'void' | 'true' | 'false' | FloatingPointLiteral | IntegerLiteral | StringLiteral | RegExStringLiteral );

// 이 규칙이 UnaryExpression과 독립적인 것은 연산 우선 순위가 다르기 때문이다.
LogicalNot:
  operator=('not' | '!') value=Expression;

/*
  Assignment를 아래와 같이 하면 다중 대입문에서 몇가지 문제가 생긴다.
  Assignment infers Expression:
    Logical ({infer BinaryExpression.left=current} operator=('=') right=Logical)*;
  우선 대입 연산의 순서가 왼쪽에서 오른쪽으로 가기 때문에 a = b = 0 은 a = b가 먼저 처리된다.
  또 다른 문제는 이 좌결합성 때문에 다중 대입문에서 세미콜론을 제대로 표시할 수 없다.
  따라서 assignment는 따로 정의되며 좌변에 CallChain을 사용해 a.b = 0를 처리한다.
*/
Assignment:
  assign=CallChain operator=('=' | '+=' | '-=' | '*=' | '/=') value=Expression;

// 기타
//-----------------------------------------------------------------------------
/*
  Conditional Expressions
  ConditionClause는 if, while, do-while등에서 사용되는데 single expression 이면 괄호를 생략할 수 있다.
  Single expression으로 취급할 수 있는 것들이 Liter, Group, FeatureCall가 있으며 이들을 이용한 연산도
  마찬가지이다. 이 모든 것이 Logical Rule 하나에 들어가 있다.
*/
IfExpression:
  'if' ConditionClause
  'then'? then=Block
  (elif+=IfElseExpression)*
  ('else' else=Block)?;

/*
  Logical, LogicalNot은 거의 모든 expression을 취급하기 때문에 조건절의 validation이 별도로 필요하다.
  조건절은 괄호가 없지만 괄호를 사용할 수도 있는데 이때는 GroupExpression이 사용된 것이다.
  반드시 괄호를 사용해야 할 경우에는 다음을 사용한다.
  '(' condition=(Logical | LogicalNot) ')';
*/
fragment ConditionClause:
  condition=(Logical | LogicalNot);

IfElseExpression:
  ('elif' | 'else if') ConditionClause elif=Block?;

InfixExpression:
  e1=Id name=Id e2=Literal;

// return 할 것이 없으면 세미콜론으로 없음을 표시해야 한다.
ReturnExpression:
  'return' (value=Expression | ";");

//todo NamedElement를 사용하는 것은 적합하지 않다.
SpreadExpression:
  '...' spread=[NamedElement:Id];

// ex) ary = [ 1, 2, 3 ], [], [ 1, ...ary ]
ArrayValue:
  '[' items+=Expression? (',' items+=Expression )* ']';

//-----------------------------------------------------------------------------
// terminal & literal
//-----------------------------------------------------------------------------

// INDENT, DEDENT는 적어도 Id 이전에 위치해야 하는 것으로 보인다.
terminal INDENT: 'synthetic:indent';
terminal DEDENT: 'synthetic:dedent';
hidden terminal WS: /[\t ]+/;
hidden terminal NL: /[\r\n]+/;

// Parentheses
// terminal Paren: '(' | ')' | '[' | ']' | '{' | '}';

// Delimiter characters
// terminal Delim: '`' | ''' | '"' | '.' | ';' | ',';
// terminal Delim: /[`'".;,]/;

// New line and semicolon
// Whitespace를 hidden terminal로 설정한 WS로 인해 NL은 인식되지 않고 있음
// terminal NL   : /[\n\r]/;
// terminal Semi : ';' | (NL)+;

// Boolean Literals
// It has to place before ID or Identifier
// Otherwise `true` and `false` is identified for Indentifier
// terminal BooleanLiteral returns boolean: 'true' | 'false';

// NumberLiteral returns number:
//   FloatingPointLiteral | IntegerLiteral;

// Floating Point Literals
// example : 0.0    3.14159    1e30    1.0e-100
// It has to also place before defining the Integer literal
terminal FloatingPointLiteral returns number:
  (Digit)+ '.' (Digit)+ (ExponentPart)?
  | (Digit)+ ExponentPart;
terminal ExponentPart: ('E' | 'e') ('+' | '-')? (Digit)+;

// Integer Literals
// DecNumeral는 BinNumeral, OctNumeral, HexNumeral보다 뒤에 있어야 한다.
// terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;
terminal IntegerLiteral returns number: (BinNumeral | OctNumeral | HexNumeral | DecNumeral );
terminal BinNumeral     returns number: '0' ('b' | 'B') BinDigit+;
terminal OctNumeral     returns number: '0' ('o' | 'O') OctDigit+;
terminal HexNumeral     returns number: '0' ('x' | 'X') HexDigit+;
terminal DecNumeral     returns number: /[0-9]+/;
terminal BinDigit       returns number: /[0-1]/;
terminal OctDigit       returns number: /[0-7]/;
terminal HexDigit       returns number: /[0-9a-fA-F]/;
terminal Digit          returns number: /[0-9]/;

// Character Literals
// terminal CharLiteral  : "'" (PrintableChar | CharEscapeSeq) "'";
// terminal PrintableChar: /[\u0020-\u007F]/;
// terminal CharEscapeSeq: '\b' | '\t' | '\n' | '\f' | '\r' | '\"' | '\'' | '\\';

// String Literals
// terminal STRING: /"[^"]*"/;
// terminal StringElement: PrintableChar |  CharEscapeSeq;
// terminal StringLiteral: '"' (StringElement)+ '"';
// terminal StringLiteral: /`[^`]*`|"[^"]*"|'[^']*'/;
terminal StringLiteral: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|`(\\.|[^`\\])*`/;
terminal RegExStringLiteral: /\/[^\/]*\/g/;

// Identifiers
// 이것은 BooleanLiteral 다음에 와야 한다.
// 그렇지 않으면 true, false가 ID로 취급되어진다.
terminal ID: /[_$a-zA-Zㄱ-ㅎ가-힣][\w$ㄱ-ㅎ가-힣]*/;

// terminal Upper  : /[A-Z$_]/;     // and Unicode category Lu
// terminal Lower  : /[a-z]/;       // and Unicode category Ll
// terminal Letter : Upper | Lower; // and Unicode categories Lo, Lt, Nl
// terminal VarId  : Lower (Letter | Digit)*;
// terminal Id     : Upper (Letter | Digit)* | VarId;

// Identifiers
terminal Id returns string: ID;

// Whitespace and Comments
// hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
