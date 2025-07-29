grammar ScalaScript

entry Program: codes+=Code*;

Code: Statement | Expression;

/*
  ScalaScript를 이해하기 위해서는 형(type)과 값(value), 문(statement)과 식(expression)을 구분하는 것이 매우 중요하다.

  변수
  변수는 타입과 값을 가지는 상자이다.
  변수 자체는 값을 변경할 수 없는 val과 값을 변경할 수 있는 var 두가지 종류가 있다.
  변수의 타입으로 primitive, function, array, object, class 타입만 사용할 수 있으나
  primitive를 제외한 각각의 타입들은 자신의 세부 타입을 정의할 수 있다.
  이 기본 타입을 구분하는 것은 타입에 따라서 사용법이 달라지기 때문이다.
  VariableDef   | Definition | val(또는 var) 변수명 : 타입 = 값 예) var n: number = 3
  VariableType  | X          | 변수의 타입 자체는 새로 정의할 수 없다.
  VariableValue | X          | 변수의 값도 새로 정의할 수 없다. 해당 타입들의 값이 사용된다.
  VariableCall  | Name       | 타입이 primitive인 경우 변수 이름만으로 변수 사용
                | Name(...)  | 타입이 함수인 경우 예) f(msg)
                | Name[...]  | 타입이 배열인 경우 예) ary[1]
                | Name.name  | 타입이 오브젝트나 클래스인 경우 예) obj.name

  함수
  함수는 파라미터, 리턴타입과 바디를 가진다.
  함수는 예외적으로 함수 자체를 정의하는 문법이 있지만 매우 예외적인 것이다.
  FunctionDef   | Definition | fun f = (msg: string) -> void => { ... } 이것은 함수의 정의이다.
                |            | val f = (msg: string) -> void => { ... } 이것은 함수형 변수의 정의이다.
                |            | def f = (msg: string) -> void            이것은 함수 타입에 대한 별칭 선언이다.(미구현)
  FunctionType  | Type       | (msg: string) -> void
  FunctionValue | Expression | (msg: string) -> void => { ... }

  배열
  배열 자체를 정의할 순 없다. 배열은 단지 특정 타입을 가지는 타입으로만 존재한다.
  배열의 타입으로 primitive, function, object, class 모두를 사용할 수 있다.
  (아직 함수 타입의 배열은 지원하지 않음)
  ArrayDef      | X          | 배열 자체를 정의하지는 않는다.
  ArrayType     | Type       | number[]
  ArrayValue    | Expression | [ 1, 2, 3 ]

  오브젝트
  오브젝트 자체를 정의할 순 없다. 오브젝트도 다수의 특정 property를 가지는 타입으로만 존재한다.
  이 타입에 대한 별칭을 지정할 순 있지만 이것이 오브젝트에 대한 정의는 아니다.
  ObjectDef     | X          | 오브젝트 자체를 정의하지는 않는다.
                |            | val object: { name: string, age: number}   이것은 오브젝트형 변수 정의이다.
                |            | def objType = { name: string, age: number} 이것은 오브젝트 타입에 대한 별칭 선언이다.(미구현)
  ObjectType    | Type       | { name: string, age: number }
  ObjectValue   | Expression | { name: "samuel", age: 20 }

  Class
  오브젝트와 동일한 개념이다. 단지 클래스는 좀 더 복잡하다. 
  ClassDef      | Definition | def Person = { var name: string, var age: number }
*/

//-----------------------------------------------------------------------------
// 스칼라스크립트의 자료형 관련
//-----------------------------------------------------------------------------
Types:
  UnionType;

/*
  Union type은 모든 타입의 가장 최상위 타입이다.
  Union type은 최상위 타입이기 때문에 union의 배열은 불가능하다. 즉 (string | number)[] 은 불가하지만
  배열의 union은 가능하기 때문에 string[] | number[] 와 같은 형태로 사용할 수 있다.
*/
UnionType: 
  types+=SimpleType ('|' types+=SimpleType)*;

/*
  타입으로 사용될 수 있는 모든 타입들
  이름이 있는 클래스 타입은 RefType으로 표현된다.
*/
SimpleType:
  ArrayType | ObjectType | PrimitiveType | FunctionType | RefType;

/*
  해당 개체의 타입이 배열형임을 나타내기 위해 사용된다.
  ex) var ary: number[]

  array의 타입으로는 union과 array를 제외한 거의 모든 타입이 사용될 수 있으나
  ArrayType을 elementType=(ObjectType | PrimitiveType | FunctionType | RefType) '[' ']'; 으로 정의하면
  var t: () -> number[] 의 경우 () -> number 의 배열로 인식된다.
  이를 방지하기 위해서 FunctionType을 빼고 정의하였다.
  즉 (() -> number)[] 와 같은 함수 타입의 배열은 현재 지원하지 않는다. 
*/
ArrayType:
  elementType=(ObjectType | PrimitiveType | RefType) '[' ']';

/*
  Object Definition
  -----------------------------------------------------------------------------
  Object는 유저가 정의하는 타입중에 하나로 타입스크립트의 Object 타입과 동일하다.
  이전에는 사용자 정의 자료구조를 class, interface, object 등으로 구분하지 않고
  모두 오브젝트라는 단일 개념으로 통합하려고 했었는데 Class의 복잡한 문법 구조의 영향을 받아
  단순하게 사용할 수 있는 Object가 복잡해졌고 그래서 오브젝트는 별도로 분리하였다.

  Object는 복합타입 컨테이너로 모든 타입(단일타입, 다른 복합타입, 배열타입등)을 가질 수 있다.
  하지만 Object 자체는 이런 값들을 가질 수 있는 타입이지 객체가 아니라는 점이 중요하다.

  다른 것들과 마찬가지로 스칼라스크립트는 타입에 이름을 부여할 때 def를 사용한다.
  예를들어 name과 age를 property로 가지는 타입이 있으면 이것의 타입은 { name: string, age: number } 이다.
  이 타입을 매번 이렇게 쓰기가 불편하기 때문에 이를 def Person = { name: string, age: number } 와 같이
  Person이라는 이름을 부여해서 사용하는 것이다.

  //todo 아래 방식이 정석인데 이 방식을 사용하면 모호성 문제가 생긴다. 어떤 차이가 있는걸까?
  '{' elements+=ObjectTypeElement? (','? elements+=ObjectTypeElement)* '}';
*/
ObjectType:
  '{' elements+=ObjectTypeElement* '}';

ObjectTypeElement:
  (Bypass | Property) (',')?;

Property:
  name=Id ':' type=Types;

// 기본 자료형들
PrimitiveType:
  type=('any' | 'nil' | 'void' | 'string' | 'number' | 'boolean');

/*
  함수 타입이란 함수의 파라메터와 리턴 타입을 명시한 것을 말한다.
  일반적으로 FunctionValue와 FunctionCall(CallChain에 포함됨)이 주로 쓰이지만 변수의 타입으로 사용되는 경우에 단독으로 사용된다.
  ex) (msg: string) -> void
*/
FunctionType:
  '(' Parameters? ')' FunctionReturn;

// generic은 var table: Map<string, number> 와 같은 구문에서 필요하다.
RefType:
  reference=[ClassDef:Id] (generic=GenericValue)?;

/*
  Generic 처리
  generic은 두가지 종류가 있다.
  하나는 generic의 선언(GenericDef)이고 다른 하나는 generic의 사용(GenericValue)이다.
  generic의 선언은 `def Box<T> = { var value: T }`와 같이 선언되어지는 것을 말하며 ClassDef에서 처리되고
  generic의 사용은 `val box = new Box<number>()`와 같이 사용되어지는 것을 말하며 NewExpression에서 처리된다.
  그래서 ClassDef와 NewExpression을 추론하면 동일한 ClassTypeDescriptor가 생성되지만 내부의 generic은 다르다.

  GenericDef의 Id는 [ClassDef:Id]가 아닌 일반 Id를 사용한다.
  Generic은 `val get: (key: K) -> V`와 같이 타입을 대신하는 `K`, `V`와 같은 이니셜을 사용하는데 이것은 ClassDef가 아니다.
  따라서 `K`, `V`의 reference는 ScopeProvider에서 직접 생성해 주어야 한다.

  `getScope()`의 타입 처리 부분은 `T`가 유효한 Id라는 것을 알려줄 뿐 `T`의 실제 타입이 무엇인지를 결정하는 것은 아니며
  `T`의 실제 타입은 `getFunctionInfo()`에서 함수를 호출한 주체가 무엇인지를 보고 계산한다.
  ```
  var table: Map<string, number>
  var result = table.get(name)
  ```
  의 경우 `name`은 string, `result`는 number이어야 함을 `table`의 타입인 `Map<string, number>`을 보고 판단한다.
*/
// def Map<K, V> = { ... } 
GenericDef:
  '<' types+=Id (',' types+=Id)* '>';

// new Map<string, number>()
GenericValue:
  '<' types+=SimpleType (',' types+=SimpleType)* '>';


type NamedElement =
  VariableDef
  | FunctionDef
  | ClassDef
  | Parameter
  | Property    // Property는 NamedElement이긴 하지만 꼭 필요하진 않다. 
  | Iterator
  | CatchClause
  | ImportStatement;

//-----------------------------------------------------------------------------
// Statements
//-----------------------------------------------------------------------------

Statement:
  Bypass
  | VariableDef
  | FunctionDef
  | ClassDef
  | DoStatement
  | ForStatement
  | WhileStatement
  | ThrowStatement
  | TryCatchStatement
  | ImportStatement
  | Continue
  | Break;

/*
  Variable Declarations and Definitions
  -----------------------------------------------------------------------------
  모든 변수는 다음의 규칙을 가지고 있다.
  이름 : 타입 = 값
  타입이나 값을 통해서 변수의 타입을 알 수 있어야 한다.
  VariableDef Rule 자체는 타입과 값이 모두 없을 수 있지만 없으면 에러 타입이 된다.
  일반적으로 둘 다 있거나 적어도 하나는 있어야 하며 타입과 값은 모두 있으면 값을 우선한다.
  값을 우선하는 이유는 타입은 union 일 수도 있기 때문이다. 값만 있으면 당연히 값으로 타입을 추론한다.

  그리고 모든 변수는 사용 전에 값이 할당되어져 있어야 한다.
  특히 val로 선언되어진 변수는 (타입스크립트 변환을 위해서) 선언과 동시에 초기값으로 설정되어야 한다.
  하지만 아직 변수의 사용 시점을 정확히 알지 못한다. 변수의 사용은 CallChain에서 처리되므로 이를 이용하면 되는데
  n + 1 처럼 n을 사용하는 시점과 n = 1 처럼 n에 값을 할당하는 것이 모두 n을 사용하는 것이므로 이를 구분하기가 쉽지 않다.
  아울러 var로 선언되어진 변수가 union type이고 나중에 값이 할당되어지면 이 변수의 값과 타입을 정확히 추론하는 것도 어렵다. 
    
  이전에는 다중 선언문을 지원했지만 삭제하기로 했다.
  다중 선언문의 유용성에 비해 처리가 복잡해지기 시작했기 때문이다.
  다중 선언문을 처리하기 위해서는 DefaultScopeComputation의 processNode()를 override해서
  여러 개의 이름을 각각의 AstNodeDescription으로 만들어 precomputedScope에 추가해 주어야 한다.
  그런데 이것은 GlobalScope에서는 정상동작하지만 LocalScope에서는 동작하지 않았다.
  원인을 분석하고 계속 지원하기에는 다중 선언문 자체가 너무 유용성이 적어 포기했다.

  var, val 은 스칼라의 문법을 차용한 것으로 엄밀하게 말하면 변수의 성격을 결정하는 것이다.
  var는 재할당이 가능한 변수를, val은 한번 할당되면 다시 재할당되지 않는 변수로 지정하는 것이다.
  하지만 스칼라스크립트는 타입스크립트의 let, const와 동일하기 때문에 엄밀히는 스칼라의 var, val와는 다르다.
*/
VariableDef:
  Annotation? Modifier kind=('val' | 'var') TypedId ('=' value=Expression)?;

fragment Annotation:
  '@' annotate=Id;

fragment Modifier:
  (export?='export')? (private?='private')? (static?='static')? (readonly?='readonly')?;

fragment TypedId:
  name=Id (nullable?='?')? (':' type=Types)?;

/*
  Function Defintion
  -----------------------------------------------------------------------------
  선언(또는 정의)에서 중요한 것은 대상이다. 선언의 대상은 변수일 수도 있고 타입 자체일 수도 있다.
  우리가 보통 const array: number[] 와 같이 선언하는 것은 숫자형 배열을 타입으로 가지는 array라는
  변수를 선언하는 것이며 class Person { ... } 은 Person이라는 이름을 가지는 타입을 선언하는 것이다.
  그럼 function display(msg: string) { ... } 와 같은 함수의 선언은 무엇을 선언한 것일까?
  변수의 선언은 아니고 display라는 함수 타입을 선언한 것일까? 아니다.

  함수의 선언(정확히는 정의)은 해당 함수가 어떤 식으로 동작하는지를 나타내는 함수의 바디를 포함하고 있다.
  그래서 함수의 정의는 타입에 대한 것이 아니라 값에 대한 것이며 오히려 변수의 정의에 가깝다.
  다른 타입들은 특정 값을 명시하는 방법으로 상수를 사용(예를들어 3.14159라는 값에 PI라는
  이름을 부여하기 위해서 상수를 사용)하는데 반해 함수는 별도의 문법이 있는 것이다.
  함수의 정의는 함수형 언어에서는 전역 함수형 상수의 정의와 동일한 개념이다.

  하지만 기존의 함수 정의가 필요한 경우가 딱 하나 있다.
  파생 클래스에서 부모 클래스의 함수를 오버라이드하면서 super로 부모 함수를 사용하는 경우이다.
  이 경우 부모 클래스의 함수는 개념적으로 변수(또는 상수)일 수가 없다. 자식 클래스에서 PI를 변경하면서
  super.PI로 PI가 부모 클래스에서 가졌던 값을 사용한다는 것이 억지스럽기 때문이다.
  물론 이것을 우회해서 동일한 기능을 구현할 순 있지만 불편하기 때문에 스칼라스크립트에서도
  함수의 정의를 지원하기로 했다. 하지만 여전히 함수의 정의를 일반적인 것으로 보지는 않는다.

  스칼라스크립트는 함수형 변수 형태로 함수를 사용하는 것을 원칙으로 하고 많은 경우 타입스크립트에서도
  함수형 변수로 변환되지만 모두는 아니다. 특히 생성자와 디폴트 파라메터를 가지는 함수는 타입스크립트에서
  함수형 변수로 처리되지 않기 때문에 스칼라스크립트는 이런 경우 타입스크립트의 일반 함수로 변환해 준다.
  하지만 이것은 스칼라스크립트가 그렇게 변환한다는 것이므로 스칼라스크립트 코드 자체에서는 다음과 같이 호출하면 된다.
  val constructor = (msg: string)           -> void => { ... } // 생성자 함수
  val paramMethod = (msg: string = "hello") -> void => { ... } // 디폴트 파라메터가 있는 함수

  FunctionValue란 함수 자체를 말하는 것으로 변수에 함수를 할당할 때 우변에 있어야 하는 것이 FunctionValue이다.
  함수는 파라메터와 리턴타입, 함수의 바디로 구성되고 함수를 표시할때 `(msg: string) -> void => { ... }` 와 같이
  리턴 타입은 -> 으로 표시하고 함수의 바디는 => 으로 표시한다. 함수의 리턴 타입을 -> 으로 표기하는 것은
  ScalaScript가 다른 언어와 구분되는 차이점 중에 하나이다.
  함수형 변수의 완전한 표현은 var f:() -> void = () -> void => { ... } 이지만
  f 변수의 타입을 중복으로 기술할 필요가 없기 때문에 var f = FunctionValue 형태로 표시할 수 있다. 
  함수의 값에 함수 타입이 포함되는 점은 혼란의 여지가 있지만 이것이 없는 함수 바디는 그냥 block일 뿐이다.
  인수는 괄호를 사용해서 묶어야 하지만 인수가 하나인 경우에는 괄호없이 사용할 수도 있다.
*/
FunctionValue:
  ('(' Parameters? ')' | params+=Parameter) FunctionReturn? FunctionBody;

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
  확장 함수를 위해 extension이 추가되어져 있지만 아직 사용되지 않는다.
  타입스크립트와의 호환성을 위해서 함수의 Generic도 지원하고 있다.
*/
FunctionDef:
  Annotation? Modifier 'fun' (extension=[ClassDef:Id] '.')? name=Id (generic=GenericDef)? 
  '=' '(' Parameters? ')' FunctionReturn? FunctionBody?;

/*
  중괄호를 이용한 블럭 지정과 들여쓰기를 이용한 블럭 지정을 모두 지원한다.
  하지만 들여쓰기를 이용한 블럭 지정은 모든 종류의 괄호(대괄호, 중괄호, 소괄호) 내부에서는 사용할 수 없다.
  자세한 설명은 개발 노트를 참고한다.
*/ 
Block:
  (isBracket?=('{' | INDENT) codes+=Code+ ('}' | DEDENT)) | codes+=Expression;

/*
  def를 이용해서 함수 타입에 이름을 부여하는 기능도 구현해야 한다
  예를 들어 def EventHandler = (event: Event, param: EventParam) => EventResult 는
  (event: Event, param: EventParam)을 파라메터로 가지고 EventResult를 리턴하는 함수 타입을 EventHandler라는 이름으로
  지정한 것이며 var f: EventHandler 와 같이 선언하거나 f = EventHandler => { ... } 와 같이 쓰일 수 있다.
  EventHandler는 함수 타입의 이름이지 함수가 아니라는 점이 중요하다.
*/
//todo 기본 문법만 선언되어져 있을 뿐 아직 전혀 구현되지 않았다.
FunctionTypeDef:
  Annotation? Modifier 'def' name=Id (generic=GenericDef)?
  '=' '(' Parameters? ')' FunctionReturn;

/*
  Class Definition
  -----------------------------------------------------------------------------
  Class는 유저가 정의하는 타입중에 하나로 타입스크립트의 Interface와 class를 포함하는 개념이다.

  스칼라스크립트에서는 interface와 class를 구분하지 않지만 실제로 타입스크립트로 변환할때는 구분해야 하는데
  함수나 대입문이 있거나 변수의 값을 초기화하는 경우 클래스로 변환된다.
  자세한 내용은 transpileClassDef()를 참고
*/
ClassDef:
  Annotation? (export?='export')?
  'def' name=Id (generic=GenericDef)? ('extends' superClass=[ClassDef:Id])?
  '=' body=ClassBody;

ClassBody:
  '{' elements+=ClassBodyElement* '}';

ClassBodyElement:
  (Bypass | VariableDef | FunctionDef) (',')?;

// 기타
//-----------------------------------------------------------------------------

// Do Loop
DoStatement:
  'do' loop=Block 'while' ConditionClause;

// For Comprehensions and For Loops
ForStatement:
  'for' '(' iterators+=Iterator (';' iterators+=Iterator)* ')' loop=Block;

Iterator: ForOf | ForTo;

ForOf: name=Id '<-' of=Expression;
// 이것을 parser단계에서 처리되게 다음과 같이 할 수 있지만
// 그렇게 하면 to, until, step이 키워드로 설정되기 때문에 이 이름을 변수로 사용할 수 없다.
// ForTo: name=Id '<-' e1=Expression to=('to' | 'until') e2=Expression ('step' stepValue=IntegerLiteral2)?;
ForTo: name=Id '<-' e1=Expression to=Id e2=Expression (step=Id stepValue=IntegerLiteral2)?;

// While Loop
WhileStatement:
  'while' ConditionClause loop=Block;

// Throw Statement
ThrowStatement:
  'throw' throw=Expression;

// Try Statement
TryCatchStatement:
  'try' body=Block
  (catch=CatchClause)?
  (finally=FinallyClause)?;

CatchClause:
  'catch' '(' name=Id ')' body=Block;

FinallyClause:
  'finally' body=Block;

// Import Statement
// from이 키워드로 사용되지 않도록 from=Id로 처리하였다.
ImportStatement:
  'import' '{' import+=Id (',' import+=Id)* '}' from=Id path=StringLiteral;

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
  | Assignment
  | IfExpression
  | InfixExpression
  | ReturnExpression
  | SpreadExpression
  | FunctionValue
  | ObjectValue
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

/*
  Unary operators
  이것은 거듭제곱보다 우선순위가 높은 연산이다.
  BinaryExpression, MatchExpression 및 CallChain등은 모두
  A (operator B)* 형태로 되어져 있어 A 자체를 포함하는 구조로 되어져 있다.
  UnaryExpression도 동일한 메커니즘을 위해 operator가 없을 수도 있는 구조로 되어있다.
  만약 그렇지 않다면 모든 Expression은 여기서 명시한 operator를 가지고 있어야만 한다.
*/
UnaryOperator infers Expression:
  {infer UnaryExpression} (operator=('-' | '+' | 'typeof' | 'not' | '!'))? value=CallChain;

/*
  Member call and Chaining of Member calls
  CallChain은 RefCall의 연장선이라고 할 수 있다.
  CallChain의 시작은 RefCall만 있는 것이 아니기 때문에 둘은 분명 다르지만 . 이후의 체이닝에서는 RefCall과 거의 동일하다.
  또한 CallChain은 모든 산술, 비교, 관계 연산의 기본 element이며 value를 가지는 expression 이라고 할 수 있다.
  RefCall과 함께 CallChain은 체이닝된 모든 variables, functions, arrays, fields, methods를 모두 포함한다.

  CallChain(또는 RefCall)은 Array expression을 포함한다.
  즉 Array를 실제로 사용하는 ary[1]와 같은 구문을 function의 function call과 동일하게 취급하고 있다.
  이는 개념적으로도 더 나아보이며 ary[1]과 같은 구문이 ary이라는 element와 [1]이라는 ArrayValue로
  인식되지 않도록 해 준다.

  CallChain은 현재 복잡하게 정의되어져 있다.
  CallChain을 아래와 같이 보다 간략하게 정의할 수도 있는데 현재와 같이 정의하게 된 이유는...
  ```
  CallChain infers Expression:
    SimpleExpression ({infer CallChain.previous=current} "." CallableElements (assertion=('!'|'?'))? )*;
  fragment CallableElements:
    element=[NamedElement:Id] ( FunctionCallSignature | ArrayCallSignature )?;
  fragment FunctionCallSignature:
    isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')';
  fragment ArrayCallSignature:
    isArray?='[' index=Expression ']';
  ```
  여기서 isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')'는
  FunctionCallSignature와 동일하지만 FunctionCallSignature를 사용할 수가 없었다.
  심지어 FunctionCallSignature의 내용인 isFunction?='(' Arguments? ')'을 사용하는 것도 안된다.

  이 부분은 [Fragment와 Ref 동시 사용시 문제점](/.prism/docs/1d29c20692a691a8fb6ba4b666d9ccef.md) 참고

  이 문제는 Langium 3.3.1에서 수정되었다.
  그래서 원래 코드를 보관하고 위의 방법으로 대체한다.
  위의 방법은 token이 간단하게 구성되어져 있기 때문에 성능면에서 훨씬 유리하다고 한다.
  ```
  CallChain infers Expression:
    SimpleExpression ({infer CallChain.previous=current} "." element=[NamedElement:Id]
    (isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')' | isArray?='[' index=Expression ']')?
    (assertion=('!'|'?'))? )*;
  ```
*/
CallChain infers Expression:
  SimpleExpression ({infer CallChain.previous=current} "." CallableElements (assertion=('!'|'?'))? )*;

fragment CallableElements:
  element=[NamedElement:Id] ( FunctionCallSignature | ArrayCallSignature )?;

fragment FunctionCallSignature:
  isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')';

fragment ArrayCallSignature:
  isArray?='[' index=Expression ']';

/*
  CallChain의 시작점으로 사용되는 atomic expressions
  이것은 RefCall(변수, 함수, 배열)과 this, super, (expr), new, [1,2], literal를 포함한다.
  ArrayValue는 RefCall의 배열과 다르다. RefCall의 배열은 ary[1] 과 같이 배열형 변수의 사용을 의미하며
  ArrayValue는 배열의 literal 표현으로 [1, 2, 3].forEach(...)와 같은 구문을 위해 필요하다.
  Literal은 'abc'.split() 또는 1 + 2와 같은 구문을 위해 필수적이다.
*/
SimpleExpression infers Expression:
  RefCall
  | ThisOrSuper
  | GroupExpression
  | NewExpression
  | ArrayValue
  | Literal;

/*
  RefCall은 reference개체의 호출 즉 사용을 의미하는데 이것은 일반적인 변수, 함수, 배열을 포함하고 있다.
  이것은 주로 CallChain의 시작점으로 사용되며 CallChain이 이것을 포함하는 보다 일반적인 개념이기 때문에
  주로 CallChain이 사용되며 이것이 개별적으로 사용되는 경우는 semantic token으로 색상 구별을 하기 위한
  경우가 거의 유일하다.

  개체의 호출에서 중요한 점은 해당 개체가 ScalaScript에서 정의된 것이면 당연히 정상적으로 동작을 하지만
  타입스크립트에서 정의되어져 있는 것들은 예를들면 console.log의 console은 정의되지 않았기 때문에 에러가 된다.
  그래서 타입스크립트의 라이브러리에 대한 cross-reference를 처리하기 위해 스칼라스크립트에서의 추가적인 코드가 필요하다.
  많이 사용되는 타입스크립트의 함수들이 scala-script-library.ts에 정의되어져 있다.
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
  이는 element가 CallChain에서 Reference로 사용되고 있고 Langium은 Reference와 다른 타입을 union type으로 만드는 것을 지원하지 않기 때문이다.

  this의 경우 ScopeProvider에서 처리하지 않고 inferTypeCallChain()에서 처리하고 있다.
  사실 this가 무엇인지를 찾을 때 ScopeProvider의 getScope()가 호출되는데 getScope()에서 inferTypeCallChain()을 호출해 처리한다.
  예를들어 this.method를 찾을 때 getScope()에서 method의 previous인 this에 대한 inferType() 호출하고 이때 inferTypeCallChain()에서
  this에 해당하는 바로 상위의 ClassDef를 리턴해 주고 이를 ScopeProvider가 Scope로 변환한다.
*/
ThisOrSuper: {infer CallChain} this=('this' | 'super');

// grouped expression with parentheses
GroupExpression:
  '(' value=Expression ')';

// new expression
NewExpression:
  'new' class=[ClassDef:Id] (generic=GenericValue)? '(' (args+=Expression (',' args+=Expression)*)? ')';

/*
  Literals
  There are literals for booleans, integer numbers, floating point numbers, strings, and so on.
  The syntax of these literals is in each case as in TypeScript.
  FloatingPointLiteral, IntegerLiteral은 minus을 포함하지 않는다.
  minus는 unary operation으로 따로 정의되어져 있음
*/
Literal:
  value=( 'any' | 'nil' | 'void' | BooleanLiteral | NumberLiteral | StringLiteral | RegExStringLiteral );

// ex) ary = [ 1, 2, 3 ], [], [ 1, ...ary ]
ArrayValue:
  '[' items+=Expression? (',' items+=Expression )* ','? ']';

// ex) var obj = { name : "samuel", age : 20, ...ary }
ObjectValue:
  '{' elements+=(Binding)* '}';

/*
  Binding은 Id : Expression 이거나 또는 ... NamedElement 일 수 있으며 , 는 생략할 수 있다.
  Binding은 원래 : 대신 = 을 사용했는데 이것은 Assignment와 모호성 문제가 발생했다.
  Binding이 사용되는 ObjectValue는 오브젝트 타입에만 사용되는 것은 아니다.
  ClassDef 타입의 객체들에게도 사용되므로 Binding의 element는 [Property:Id]를 사용할 수 없다.
  [NamedElement:Id]도 적합하지 않는데 이는 그렇게 하면 반드시 Property가 먼저 정의되어야만 하기 때문에
  ObjectValue만 사용하고 타입은 추론하는 것이 불가능해지기 때문이다.

  ObjectType 없이 ObjectValue 만으로 변수를 선언할 경우에도 타입 추론이 가능하게 하기 위해서는
  Binding의 element가 CallChain의 ref가 될 수 있어야 하는데 그렇게 하기 위해서 getScope()에서 object value인 경우에도
  candidates를 리턴할 수 있게 하고 Binding rule의 element 대신 name property로 변경하였다.
*/
Binding: (name=Id ':' value=Expression | spread=SpreadExpression) (',')?;

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
  Single expression으로 취급할 수 있는 것들은 여러가지가 있으나 이 모든 것이 Logical Rule 하나에 들어가 있다.
*/
IfExpression:
  'if' ConditionClause
  'then'? then=Block
  (elif+=IfElseExpression)*
  ('else' else=Block)?;

/*
  Logical은 거의 모든 expression을 취급하기 때문에 조건절의 validation이 별도로 필요하다.
  조건절은 괄호가 없지만 괄호를 사용할 수도 있는데 이때는 GroupExpression이 사용된 것이다.
  반드시 괄호를 사용해야 할 경우에는 다음을 사용한다.
  '(' condition=Logical ')';
*/
fragment ConditionClause:
  condition=Logical;

IfElseExpression:
  ('elif' | 'else if') ConditionClause elif=Block?;

// Scala의 중위 연산자를 흉내낸 문법이다.
// a.plus(b) 는 a plus b로 표시할 수 있다. 
InfixExpression:
  e1=Id name=Id e2=Literal;

// return 할 것이 없으면 세미콜론으로 없음을 표시해야 한다.
ReturnExpression:
  'return' (value=Expression | ";");

// spread의 대상은 object, variable, parameter, iterator가 가능하다.
SpreadExpression:
  '...' spread=[NamedElement:Id];

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
terminal BooleanLiteral returns boolean: 'true' | 'false';

NumberLiteral returns number:
  FloatingPointLiteral | IntegerLiteral;

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

// step은 마이너스를 포함한 정수값만을 가질 수 있다.
IntegerLiteral2 returns number:
  ('-' | '+')? IntegerLiteral;

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

// Regular Expression Literals
// /\/[^\/]*\/[gimsuy]+/ 와 같이 정의하면 //g 가 주석이 아니라 정규식으로 인식된다.
terminal RegExStringLiteral: /\/[^\/]+\/[gimsuy]+/;

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
