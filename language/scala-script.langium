grammar ScalaScript

entry Program: codes+=Code*;

Code: Statement | Expression;

//-----------------------------------------------------------------------------
// 스칼라스크립트의 자료형 관련
//-----------------------------------------------------------------------------
// 타입의 선언이란 클래스, 오브젝트, 함수 타입에 이름을 부여하는 것이다.
// 선언 또는 정의에서 중요한 것은 대상이다. 선언의 대상은 변수일 수도 있고 타입 자체일 수도 있다.
// 우리가 보통 val array: number[] 와 같이 선언하는 것은 숫자형 배열을 타입으로 가지는 array라는
// 변수를 선언하는 것이며 class Person { ... } 은 Person이라는 이름을 가지는 타입을 선언하는 것이다.
// Person은 타입이기 때문에 array처럼 값으로 사용될 수 없고 인스턴스화되어야만 사용할 수 있다.
// 그럼 function display(msg: string) { ... } 와 같은 함수의 선언은 무엇을 선언한 것일까?
// 함수의 선언은 타입에 대한 선언이 아니라 변수 선언처럼 값에 대한 선언에 가깝다.
// 선언에 대한 애매한 구분은 편할지는 모르겠지만 언어에 대한 이해도를 떨어뜨린다.
// 그래서 스칼라스크립트에서는 이를 명확히 구분하기로 했다.
// 우선 다른 언어에 존재하는 함수의 정의가 존재하지 않는다.
// 다른 언어에서의 함수 정의는 함수의 값에 이름을 부여한 것인데 다른 자료형은 모두 변수에 할당하는 방식을
// 사용하면서 함수만 특수하게 값에 이름을 부여한 것이라고 할 수 있다. 물론 함수를 값으로 취급하는 함수형 언어들은
// 기본적으로 함수를 변수에 할당할 수 있다. 함수 선언은 관행적으로 널리 사용되는 방법도 지원하기 위한 예외 사항일 뿐이다.
// 하지만 스칼라스크립트에서는 (함수선언처럼) 값에 이름을 부여할 수 없다. 이유는 거의 필요하지 않기 때문이다.
// 3.14159 라는 값에 PI 라는 이름을 부여하기 위해서 별도의 언어적인 장치가 필요하진 않다.
// 왜냐하면 일반적인 상수 선언으로 충분하기 때문이다. 상수 선언은 변경되지 않는 변수의 선언이지
// 값에 이름을 부여하는 것은 아니다. 즉 값은 변수에 할당되므로써 고유한 이름을 가질 수 있다.
// 반면 타입에는 이름을 부여할 수 있다. 이를 타입 별칭이라고도 할 수 있다.
// 스칼라스크립트에서 def 로 시작하는 것은 모두 타입에 대해 이름을 부여하는 것이다.
// 스칼라스크립트에서는 클래스, 오브젝트등의 사용자 정의 자료구조의 구분이 없기 때문에(모두 오브젝트라고 칭함)
// def는 일반적으로 오브젝트의 선언인데 이것은 오브젝트 개체를 선언하는 것이 아니라 타입 자체를 선언하는 것이다.
// 예를들어 name과 age를 가지는 타입이 있으면 이것의 타입은 { name: string, age: number } 이다.
// 이 타입을 매번 이렇게 쓰기가 불편하기 때문에 이를 Person 이라는 이름으로 사용하는 것이다.
// 즉 타입을 정의한 것이고 타입에 이름을 부여한 것일 뿐 오브젝트를 선언한 것이 아니다.
// 이는 함수도 마찬가지이다. 예를 들어 def display = (msg: string)-> void 는 (msg: string)을 파라메터로 가지고
// void를 리턴하는 함수들의 이름으로 display를 사용하는 것이며 display가 함수 타입의 이름이지 함수가 아니라는 점이 중요하다.
// 하지만 (msg: string)-> void 의 형식을 가지는 함수가 하나가 아니고 이들을 모두 display라는 이름으로 사용하는 것은 맞지 않기 때문에
// 스칼라스크립트에서는 함수 타입을 정의할 일은 거의 없다. 함수는 다른 타입처럼 상수에 저장해서 사용해야 한다.
//
// 또한 스칼라스크립트는 오브젝트와 클래스가 하나로 합쳐져 있다.
// 메서드를 가지지 않는 클래스는 오브젝트(인터페이스)로 변환되며 타입으로 사용할 수 있고 값을 할당할 수도 있다.

// Union type
// Union type은 모든 타입의 가장 최상위 타입이며 간단히 Types라고 표현한다.
Types: 
  types+=SimpleType ('|' types+=SimpleType)*;

// 타입으로 사용될 수 있는 모든 타입들
// ElementType은 하나의 항목만을 가지는 타입들이며 
// CompoundType과 ArrayType은 두개 이상의 항목을 가지는 타입들이다.
// ArrayType은 동일한 타입이 연속된 구조를 취하는 특수한 Compound 타입이다.
// 이것을 CompoundType과 구분해서 처리하는 것은 표기 방법과 처리가 매우 다르기 때문이다.
// 현재 CompoundType은 ObjectType 밖에 없기 때문에 이를 별도로 구분하지 않고 ObjectType으로 사용한다.
SimpleType:
  ArrayType | ObjectType | ElementType;

// 하나의 항목만을 가지는 타입들
ElementType:
  FunctionType
  | PrimitiveType
  | TypeChain;

TypeChain:
  // reference=[ObjectDef:Id] (generic=Generic)?;
  reference=[ObjectDef:Id] (generic=Generic)? ({infer TypeChain.previous=current} "." reference=[ObjectDef:Id] (generic=Generic)?)*;

PrimitiveType:
  type=('any' | 'nil' | 'void' | 'string' | 'number' | 'boolean');

// 해당 개체의 타입이 배열형임을 나타내기 위해 사용된다.
// ex) var ary: number[]
ArrayType:
  // SimpleType ({infer ArrayType.elementType=current} '[' ']')? ;
  elementType=(ObjectType | ElementType) '[' ']';

// ex) ary = [ 1, 2, 3 ], [], [ 1, ...ary ]
ArrayValue:
  '[' items+=ArrayItem? (',' items+=ArrayItem )* ']';

ArrayItem:
  item=Expression;

// Array의 실제 사용... function의 function call 동일
// ex) ary[ 1 ]
ArrayExpression:
  element=[NamedElement:Id] isArray?='[' index=Expression ']';

//todo
// TupleType:
//   '[' types+=SimpleType (',' types+=SimpleType)* ']';

Generic:
  '<' types+=SimpleType (',' types+=SimpleType)* '>';


type NamedElement =
  VariableDef
  | FunctionDef
  | ObjectDef
  | Iterator
  | Parameter
  | TypeBinding
  | AssignBinding;

fragment Annotation:
  '@' annotate=Id;

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

// Value and Variable Declarations and Definitions
//-----------------------------------------------------------------------------
// 모든 변수는 다음의 규칙을 가지고 있다.
// 이름 : 타입 = 값
// 타입이나 값을 통해서 변수의 타입을 정할 수 있어야 한다.
// Rule 자체는 타입과 값이 모두 없을 수 있지만 둘 다 있거나 적어도 하나는 있어야 한다.
// 타입과 값은 모두 있으면 값은 명시된 타입으로 변환되며 이 변환이 실패하면 에러가 된다.
//
// 이전에 다중 선언문을 지원했지만 삭제하기로 했다.
// 다중 선언문의 유용성에 비해 처리가 복잡해지기 시작했기 때문이다.
// 다중 선언문을 처리하기 위해서는 DefaultScopeComputation의 processNode()를 override해서
// 여러 개의 이름을 각각의 AstNodeDescription으로 만들어 precomputedScope에 추가해 주어야 한다.
// 그런데 이것은 GlobalScope에서는 정상동작하지만 LocalScope에서는 동작하지 않았다.
// 원인을 분석하고 계속 지원하기에는 다중 선언문 자체가 너무 유용성이 적어 포기했다.
//
// var, val 은 변수를 선언하는 것이지만 엄밀하게 말하면 변수의 성격을 결정하는 것으로써
// var는 재할당이 가능한 변수를, val은 한번 할당되면 다시 재할당되지 않는 변수로 지정하는 것이다.
VariableDef:
  (Annotation)? (export?='export')? (private?='private')? (static?='static')?
  kind=('val' | 'var') name=Id (nullable?='?')? (':' type=Types)? ('=' value=Expression)?;

// Function Defintion
//-----------------------------------------------------------------------------
// 스칼라스크립트에서는 함수의 정의가 없다. 함수는 다른 자료형과 동일하게 그냥 변수에 할당되어져 사용되어진다.
// 함수는 파라메터와 리턴타입, 함수의 바디로 구성되고 함수를 표시할때 (msg: string) -> void => { ... } 와 같이
// 리턴 타입은 -> 으로 표시하고 함수의 바디는 => 으로 표시한다. 함수의 리턴 타입을 -> 으로 표기하는 것은
// ScalaScript가 다른 언어와 구분되는 대표적인 차이점 중에 하나이다.
// parameter는 초기값을 가질 수 있으나 argument는 그렇지 않다.

// 함수 타입이란 함수의 파라메터와 리턴 타입을 명시한 것을 말한다.
// 파라메터(또는 인수)의 이름과 타입을 매칭하는 것을 Binding이라고 표현한다.
// 인수는 괄호를 사용해서 묶어야 하지만 인수가 하나인 경우에는 괄호없이 사용할 수도 있다.
FunctionType:
  '(' Bindings? ')' '->' returnType=Types;

// 함수의 값이란 함수 타입과 함수 바디를 포함하는 것으로 람다 함수라고도 하며 expression이다.
// 함수를 가지는 변수의 완전한 표현은 var f:(msg: string)-> void = (msg: string)-> void => { ... } 이다.
// f 변수의 타입을 별도로 기술할 필요가 없기 때문에 var f = 함수값 형태로 표시할 수 있다. 
// 함수의 값에 함수 타입이 포함되는 점은 혼란의 여지가 있지만 이것이 없는 함수 바디는 그냥 block일 뿐이다.
FunctionValue:
  ('(' Bindings? ')' ('->' returnType=Types)? | bindings+=TypeBinding) '=>' body=Block;

Block:
  (isBracket?='{' codes+=Code* '}') | codes+=Expression;

fragment Bindings:
  bindings+=TypeBinding (',' bindings+=TypeBinding)*;

TypeBinding: name=Id (':' type=Types)? | Spread;

fragment Spread:
  '...' spread=[NamedElement:Id];

// 함수의 정의 자체는 값에 대한 이름 부여이고 ScalaScript의 Type system에 부합되지 않지만
// 편이를 위해 제공하고 있다. 실제로도 타입스크립트의 function으로 transpile되어지기는 하지만
// 이것 대신 val function_name = FuncionValue를 사용해야 한다.
FunctionDef:
  (Annotation)? (export?='export')? (private?='private')? (static?='static')? 
  'def' (extension=[ObjectDef:Id] '.')? name=Id
  '(' (params+=Parameter (',' params+=Parameter)*)? ')' ('->' returnType=Types)? ('=>' body=Block)?;

Parameter:
  (spread?='...')? name=Id (nullable?='?')? (':' type=Types)? ('=' value=Expression)?;

// Object Definition
//-----------------------------------------------------------------------------
// Object는 유저가 정의하는 타입을 모두 포괄하는 단어이며 여기에는 일반적인 Class, Interface를 모두 포함한다.
// Object의 정의란 Object의 타입에 이름을 부여하는 것이다.
// Object는 복합타입 컨테이너로 자신을 제외한 모든 타입을 가질 수 있다.
// 예를들면 단일타입, 다른 복합타입, 배열타입등을 모두 element로 가질 수 있다. 
ObjectDef:
  (Annotation)? (export?='export')?
  'def' name=Id ('extends' superClass=[ObjectDef:Id])?
  '=>' body=ObjectType;

// ex) var obj: { name: string age: number }
ObjectType:
  '{' elements+=(Bypass | VariableDef | FunctionDef | ObjectDef)* '}';

// ex) var obj = { name = "samuel" age = 20 ...ary }
ObjectValue:
  '{' elements+=(AssignBinding)* '}';

// AssignBinding은 원래 : 대신 = 을 사용했는데 이것은 Assignment와 모호성 문제가 발생했다.
AssignBinding: name=Id ':' value=Expression | Spread;

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
  ('catch' '{' cases+=CaseClause+ '}')?
  ('finally' finally=Expression)?;

Continue: dummy='continue';
Break: dummy='break';

// Bypass
Bypass: bypass=BYPASS;
terminal BYPASS returns string: /(%%\/\/[^\n\r]*|%%[\s\S]*?%%)/;

//-----------------------------------------------------------------------------
// Expressions
//-----------------------------------------------------------------------------
// Logical rule은 많은 rule을 내포하고 있다.
// 이것은 관계 연산 뿐만 아니라 비교 연산과 사칙 연산을 모두 포함하고 있으며
// CallChain을 거쳐 SimpleExpression까지 포함한다. SimpleExpression은 Literal,
// GroupExpression, FunctionCall(괄호가 없은 경우도 포함)등이 포함된다.
Expression:
  Logical
  | LogicalNot
  | Assignment
  | IfExpression
  | MatchExpression
  | InfixExpression
  | ReturnExpression
  | SpreadExpression
  | NewExpression
  | ArrayValue
  | ObjectValue
  | FunctionValue
  ;

// Binary Operators
Logical infers Expression:
  InstanceOf     ({infer BinaryExpression.left=current} operator=('and' | 'or' | '&&' | '||') right=InstanceOf)*;

// instanceof 연산자의 우선 순위는 비교연산자와 동일하다.
InstanceOf infers Expression:
  Comparison     ({infer BinaryExpression.left=current} operator=('instanceof') right=Comparison)*;

Comparison infers Expression:
  Addition       ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Addition)*;

Addition infers Expression:
  Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-' | '..') right=Multiplication)*;

Multiplication infers Expression:
  Exponentiation ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=Exponentiation)*;

Exponentiation infers Expression:
  UnaryOperator  ({infer BinaryExpression.left=current} operator=('**') right=UnaryOperator)*;

// Unary operators
// 이것은 거듭제곱보다 우선순위가 높은 연산이다.
UnaryOperator infers Expression:
  {infer UnaryExpression} (operator=('-' | '+' | 'typeof'))? value=CallChain;

// Member call and Chaining of Member calls
// 아래 규칙은 개체의 fields, methods, functions를 모두 호출할 수 있으며 체인닝될 수 있다.
//
// CallableElement는 '.' 다음에 올 수 있는 것들로써 필드(프로퍼티), 메서드, 배열이 있다.
// 여기서 isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')'는
// FunctionCallSignature와 동일하지만 FunctionCallSignature를 사용할 수 없다.
// 심지어 FunctionCallSignature의 내용인 isFunction?='(' Arguments? ')'을 사용하는 것도 안된다.
// 정확한 이유는 모르지만 fragment는 외부적으로 들어나는 타입은 존재하진 않아도 내부적으로는 규칙을 호출하는데
// 이것은 fragment를 사용하지 않는 경우와는 다르게 처리된다는 의미이다. 이로 인해 fragment로 사용하는 경우에는
// AST node has no document 에러가 발생된다. 개발 노트를 참고
//
// CallChain은 전역변수급에 해당하는 this, super를 가지고 있는데 사실 이것의 처리가 애매모호하다.
// 먼저 이것의 위치는 CallChain에 있는 것이 좋아 보인다. 이전에는 FeatureCall에 있었지만 this() 와 같은 것이
// 가능하다는 문제가 있어 별도로 처리된다.
//
// this, super를 element=[NamedElement:'this']으로 설정하면 ScopeProvider에서 적절한 멤버들을 리턴하게 할 순 있지만
// this, super자체가 AstNode 상에서 없기 때문에 Could not resolve reference to NamedElement named 'this' 에러가 생긴다.
// 설령 node가 있다고 해도 this, super로 reference하는 개체를 정의할 수가 없다. 즉 this, super를 reference로 처리할 수가 없다.
// 따라서 현재 this, super는 그냥 keyword로 처리되고하고 있으며 이들을 담는 프로퍼티 이름도 element가 아닌 this로 설정되어져 있는데
// 이는 Langium이 Reference와 다른 타입을 union type으로 만드는 것을 지원하지 않기 때문이다.
CallChain infers Expression:
  // SimpleExpression ({infer CallChain.previous=current} "." CallableElements )*;
  SimpleExpression ({infer CallChain.previous=current} "." element=[NamedElement:Id]
  (isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')' | isArray?='[' index=Expression ']')?
  (assertion=('!'|'?'))? )*;

// fragment CallableElements:
//   element=[NamedElement:Id] (
//     // FunctionCallSignature | ArrayCallSignature
//     isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')' | isArray?='[' index=Expression ']'
//   )?;

SimpleExpression infers Expression:
  FunctionCall
  | ThisOrSuper
  | ArrayExpression
  | GroupExpression
  | Literal;

// 이것은 전역적인 개체들(전역변수, 전역함수)을 의미한다.
// ScalaScript에서 정의되는 것은 당연히 정상적으로 동작을 하지만 타입스크립트에서 정의되어져 있는 것들은
// 예를들면 console.log의 console은 정의되지 않았기 때문에 에러가 된다. 그래서 타입스크립트의 라이브러리를
// 사용할때는 cross-reference를 처리하기 위해 다음과 같은 추가적인 코드가 필요하다.
// 1) Console.log 의 경우
// @NotTrans class Console { log(arg: string): void = {} }
// @NotTrans var console: Console
// 2) 문자열 관련 함수들의 경우
// @NotTrans def string.repeat(count: number): string
// @NotTrans def string.replace(searchFor: string, replaceWith: string): string
// @NotTrans def string.replaceAll(searchFor: string, replaceWith: string): string
FunctionCall: {infer CallChain}
  // (export?='export')? element=[NamedElement:Id] (FunctionCallSignature)?;
  (export?='export')? element=[NamedElement:Id]
  (isFunction?='(' (args+=Expression (',' args+=Expression)*)? ')')?
  (assertion=('!'|'?'))?;

ThisOrSuper: {infer CallChain} this=('this' | 'super');

// grouped expression with parentheses
GroupExpression:
  '(' value=Expression ')';

// Literals
// There are literals for booleans, integer numbers, floating point numbers, strings, and so on.
// The syntax of these literals is in each case as in TypeScript.
// FloatingPointLiteral, IntegerLiteral은 minus을 포함하지 않는다.
// minus는 unary operation으로 따로 정의되어져 있음 
Literal:
  value=( 'any' | 'nil' | 'void' | 'true' | 'false' | FloatingPointLiteral | IntegerLiteral | StringLiteral | RegExStringLiteral );

// 이 규칙이 UnaryExpression과 독립적인 것은 연산 우선 순위가 다르기 때문이다.
LogicalNot:
  operator=('not' | '!') value=Expression;

// Assignment를 아래와 같이 하면 다중 대입문에서 몇가지 문제가 생긴다.
// Assignment infers Expression:
//   Logical ({infer BinaryExpression.left=current} operator=('=') right=Logical)*;
// 우선 대입 연산의 순서가 왼쪽에서 오른쪽으로 가기 때문에 a = b = 0 은 a = b가 먼저 처리된다.
// 또 다른 문제는 이 좌결합성 때문에 다중 대입문에서 세미콜론을 제대로 표시할 수 없다.
// 따라서 assignment는 따로 정의되며 좌변에 CallChain을 사용해 a.b = 0를 처리한다.
Assignment:
  assign=CallChain operator=('=' | '+=' | '-=' | '*=' | '/=') value=Expression;

// 기타
//-----------------------------------------------------------------------------

// Conditional Expressions
// ConditionClause는 if, while, do-while등에서 사용되는데 single expression 이면 괄호를 생략할 수 있다.
// Single expression으로 취급할 수 있는 것들이 Liter, Group, FeatureCall가 있으며 이들을 이용한 연산도
// 마찬가지이다. 이 모든 것이 Logical Rule 하나에 들어가 있다.
IfExpression:
  'if' ConditionClause
  'then'? then=Block
  (elif+=IfElseExpression)*
  ('else' else=Block)?;

fragment ConditionClause:
  // '(' condition=(Logical | LogicalNot) ')';
  condition=(Logical | LogicalNot);

IfElseExpression:
  ('elif' | 'else if') ConditionClause elif=Block?;

// Match expression
MatchExpression:
  expr=CallChain 'match' '{' cases+=CaseClause+ '}';

CaseClause:
  'case' pattern=(CaseDefalut | CasePattern) '=>' (body=Block)?;

CaseDefalut returns string: '_';
CasePattern: Literal;

InfixExpression:
  e1=Id name=Id e2=Literal;

// return 할 것이 없으면 세미콜론으로 없음을 표시해야 한다.
ReturnExpression:
  'return' (value=Expression | ";");

SpreadExpression:
  '...' spread=[NamedElement:Id];

NewExpression:
  'new' class=[ObjectDef:Id] (generic=Generic)?'(' (args+=Expression (',' args+=Expression)*)? ')';

//-----------------------------------------------------------------------------
// terminal & literal
//-----------------------------------------------------------------------------

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
// terminal StringLiteral: /`[^`]*`|"[^"]*"|'[^']*'/;
terminal StringLiteral: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|`(\\.|[^`\\])*`/;
// terminal StringLiteral: '"' (StringElement)+ '"';
// terminal StringElement: PrintableChar |  CharEscapeSeq;
terminal RegExStringLiteral: /\/[^\/]*\/g/;

// Identifiers
// 이것은 BooleanLiteral 다음에 와야 한다.
// 그렇지 않으면 true, false가 ID로 취급되어진다.
terminal ID: /[_$a-zA-Zㄱ-ㅎ가-힣][\w$ㄱ-ㅎ가-힣]*/;

// opchar ::= // printableChar not matched by (whiteSpace | upper | lower |
//            // letter | digit | paren | delim | opchar | Unicode_Sm | Unicode_So)
// op     ::= opchar {opchar}

// terminal Upper  : /[A-Z$_]/;     // and Unicode category Lu
// terminal Lower  : /[a-z]/;       // and Unicode category Ll
// terminal Letter : Upper | Lower; // and Unicode categories Lo, Lt, Nl
// terminal VarId  : Lower (Letter | Digit)*;
// terminal Id     : Upper (Letter | Digit)* | VarId;

// Identifiers
terminal Id returns string: ID;
// TypedId: name=Id ':' type=Types;

// Whitespace and Comments
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
