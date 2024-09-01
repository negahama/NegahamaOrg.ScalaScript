grammar ScalaScript

entry Program: codes+=Code*;

Code: Statement | Expression;

//-----------------------------------------------------------------------------
// 스칼라스크립트의 자료형 관련
//-----------------------------------------------------------------------------
// 타입의 선언이란 클래스, 오브젝트, 함수 타입에 이름을 부여하는 것이다.
// 클래스를 예로 들어서 설명하면 일반적으로 클래스의 선언이라고 하는 것은 클래스 타입에 이름을 부여하는 것을 말한다.
// 우리가 보통 문자열의 선언 또는 숫자형 배열의 선언이라고 하면 이것은 var array: number[] 와 같이 해당 자료형을 가진
// 변수를 선언하는 것을 말하지만 클래스, 오브젝트, 함수는 변수를 선언하는 것이 아니라 타입 자체를 선언하는 것이다.
// 따라서 스칼라스크립트에서는 이것을 타입의 선언으로 보지 않고 별칭을 정의하는 것으로 본다.
// 모든 클래스, 오브젝트, 함수는 def 와 => 으로 정의한다.
//
// 또한 스칼라스크립트는 오브젝트와 클래스가 하나로 합쳐져 있다.
// 메서드를 가지지 않는 클래스는 오브젝트(인터페이스)로 변환되며 타입으로 사용할 수 있고 값을 할당할 수도 있다.


// 타입으로 사용될 수 있는 모든 타입들
AllTypes: LambdaType | ArrayType | SimpleType;

LambdaType: '(' Bindings? ')' '->' returnType=AllTypes;

SimpleType:
  TupleType
  | ClassType
  | PrimitiveType
  | reference=[Class:Id];

TupleType: '[' types+=SimpleType (',' types+=SimpleType)* ']';

PrimitiveType:
  type=("string" | "number" | "boolean" | "void");

// Array Type
// ex) number[]
ArrayType:
  // SimpleType ({infer ArrayType.elementType=current} '[' ']')? ;
  elementType=SimpleType '[' ']';

// Array Literal
// ex) [ 1, 2, 3 ]
ArrayLiteral:
  '[' items+=Literal (',' items+=Literal )* ']';

// Array Expression
// ex) array[ 1 ]
ArrayExpression:
  element=[NamedElement:Id] '[' index=Expression ']';


type NamedElement =
  Variable
  | TFunction
  | Class
  | Field
  | Method
  | Iterator
  | Parameter
  | Binding;

//-----------------------------------------------------------------------------
// Statements
//-----------------------------------------------------------------------------

Statement:
  Bypass
  | VariableDeclaration
  | FunctionDeclaration
  | ClassDeclaration
  | DoStatement
  | ForStatement
  | WhileStatement
  | ThrowStatement
  | TryCatchStatement
  | Continue
  | Break;

// 모든 변수는 다음의 규칙을 가지고 있다.
// 이름 : 타입 = 값
// 이름은 유효한 식별자이어야 한다.
// 타입이나 값을 통해서 변수의 타입을 정할 수 있어야 한다.
// Rule 자체는 타입과 값이 모두 없을 수 있지만 둘 다 있거나 적어도 하나는 있어야 한다.
// 타입과 값은 모두 있으면 값은 명시된 타입으로 변환되며 이 변환이 실패하면 에러가 된다.
fragment VarSignature: name=Id (':' type=AllTypes)? ('=' value=Expression)?;

// Value and Variable Declarations and Definitions
//-----------------------------------------------------------------------------
// 다중 대입문을 지원하기 위해서 아래와 같이 되어져 있다.
// 하지만 이 방식은 어떻게 해도 Langium의 default 처리로는 cross-reference가 처리되지 않는다.
// 이를 처리하기 위해서 DefaultScopeComputation의 processNode()를 override해서
// 새로운 AstNodeDescription을 precomputedScope에 추가해 준다.
// FunctionDeclaration과 Class의 Method가 동일한 것처럼
// VariableDeclaration과 Class의 Field는 동일하지만 다중 대입문 때문에 따로 취급한다.
// var, val 은 변수를 선언하는 것이지만 엄밀하게 말하면 변수의 성격을 결정하는 것으로써
// var는 재할당이 가능한 변수를, val은 한번 할당되면 다시 재할당되지 않는 변수로 지정하는 것이다.
VariableDeclaration infers Variable:
  (Annotation)? kind=('val' | 'var') names+=Id (',' names+=Id)* (':' type=AllTypes)? ('=' value=Expression)?;
fragment Annotation:
  '@' annotate=Id;

// Function Declarations
//-----------------------------------------------------------------------------
// 함수의 리턴 타입은 -> 으로 표시하고 함수의 바디는 => 으로 표시한다.
// 이건 ScalaScript가 다른 언어와 구분되는 대표적인 차이점 중에 하나이다.
// parameter는 초기값을 가질 수 있으나 argument는 그렇지 않다.
FunctionDeclaration infers TFunction:
  (Annotation)? 'def' (extension=[Class:Id] '.')? name=Id FunSignature;

fragment FunSignature:
  '(' Parameters? ')' ('->' returnType=AllTypes)? ('=>' FunctionBody)?;

fragment FunctionBody:
  body=Block;

fragment Parameters:
  parameters+=Parameter (',' parameters+=Parameter)*;

Parameter: VarSignature;

Block:
  ('{' codes+=Code* '}') | codes+=Expression;

// LambdaCall은 expression이다.
// 람다 함수 호출시 인수의 이름과 타입을 정하는 것은 변수의 생성이 아니라 Binding이라고 한다.
// 인수는 괄호를 사용해서 묶어야 하지만 인수가 하나인 경우에는 괄호없이 사용할 수도 있다.
LambdaCall: ('(' Bindings? ')' ('->' returnType=AllTypes)? | bindings+=Binding) '=>' body=Block;

fragment Bindings: bindings+=Binding (',' bindings+=Binding)*;

Binding: name=Id (':' type=AllTypes)?;

// Class Declarations
//-----------------------------------------------------------------------------
// Class의 선언은 Class 타입에 이름을 부여하는 것이다.
// 아래 규칙은 MethodMember의 파라메터로 초기값을 가질 수 있고 FieldMember로 타입이 없을 수도 있다.
// def ClassName extends SuperClass => {
//   display(msg: string = "hello")
//   message
// }
ClassDeclaration infers Class:
  (Annotation)? 'def' name=Id ClassSignature;

fragment ClassSignature:
  ('extends' superClass=[Class:Id])? '=>' ClassBody;

fragment ClassBody:
  '{' elements+=(Bypass | Field | Method)* '}';

Field: VarSignature;

Method: name=Id FunSignature;

// Class Type
// ex) var obj: { name: string age: number }
ClassType: ClassBody;

// Class literal
// ex) var obj = { name = "samuel" age = 20 }
// ClassLiteral은 expression이다.
ClassLiteral:
  '{' elements+=(MemberBinding)* '}';

MemberBinding: name=Id ('=' value=Expression)?;

// 기타
//-----------------------------------------------------------------------------

// Do Loop
DoStatement:
  'do' loop=Block 'while' ConditionClause;

// For Comprehensions and For Loops
ForStatement:
  'for' '(' iterators+=Iterator (';' iterators+=Iterator)* ')' loop=Block;

Iterator: ForOf | ForTo | ForUntil;

ForOf   : name=Id '<-' of=Expression;
ForTo   : name=Id '<-' e1=Expression 'to'    e2=Expression ('step' step=NumberLiteral)?;
ForUntil: name=Id '<-' e1=Expression 'until' e2=Expression ('step' step=NumberLiteral)?;

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

Continue: dummy?='continue';
Break: dummy?='break';

// Bypass
Bypass: bypass=BYPASS;
terminal BYPASS returns string: /(%%\/\/[^\n\r]*|%%[\s\S]*?%%)/;

//-----------------------------------------------------------------------------
// Expressions
//-----------------------------------------------------------------------------

// Logical rule은 많은 rule을 내포하고 있다.
// 이것은 관계 연산 뿐만 아니라 비교 연산과 사칙 연산을 모두 포함하고 있으며 operator가 없을 경우도 포함된다.
// 이 경우는 SimpleExpression이 되고 이것은 Liter, Group, FeatureCall를 포함한다.
Expression:
  LogicalNot
  | Logical
  | Assignment
  | LambdaCall
  | IfExpression
  | MatchExpression
  | ArrayLiteral
  | ClassLiteral
  | InfixExpression
  | ReturnExpression;

SimpleExpression infers Expression:
  UnaryExpression
  | ArrayExpression
  | GroupExpression
  | Literal
  | FeatureCall;

// Unary operators
UnaryExpression:
  operator=('-' | '+') value=Expression;

// grouped expression with parentheses
GroupExpression:
  '(' value=Expression ')';

// Literals
// There are literals for integer numbers, floating point numbers, characters, booleans, symbols, strings.
// The syntax of these literals is in each case as in Java.
Literal:
  BooleanExpression
  | NumberExpression
  | StringExpression
  | VoidExpression;

BooleanExpression: value?='true' | 'false';
NumberExpression: value=NumberLiteral;
StringExpression: value=StringLiteral;
VoidExpression: value='void';

// ValueLiteral:
//   StringLiteral | NumberLiteral | BooleanLiteral | ArrayLiteral;

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
//
// this, super를 element=[NamedElement:'this']으로 설정하면 ScopeProvider에서 적절한 멤버들을 리턴하게 할 순 있지만
// this, super자체가 AstNode 상에서 없기 때문에 Could not resolve reference to NamedElement named 'this' 에러가 생긴다.
// 설령 node가 있다고 해도 this, super로 reference하는 개체를 정의할 수가 없다. 즉 this, super를 reference로 처리할 수가 없다.
// 따라서 현재 this, super는 그냥 keyword로 처리되고하고 있으며 이들을 담는 프로퍼티 이름도 element가 아닌 this로 설정되어져 있는데
// 이는 Langium이 Reference와 다른 타입을 union type으로 만드는 것을 지원하지 않기 때문이다.
//
// (explicitCall?='(' Arguments? ')')? 와 같이 Arguments라는 fragment를 사용하면 args+=Expression ... 과 동일할 것 같은데
// 실제로는 Arguments는 타입은 존재하진 않아도 args를 바로 사용하는 것과는 다른 규칙으로 존재하는 것으로 보이며 이로 인해
// 함수의 인수가 있는 경우 AST node has no document 에러를 유발하게 된다. 개발 노트를 참고
FeatureCall infers Expression: {infer MethodCall}
	(element=[NamedElement:Id] | this='this' | this='super')
  (explicitCall?='(' (args+=Expression (',' args+=Expression)*)? ')')?;
// fragment Arguments:
//   args+=Expression (',' args+=Expression)*;

LogicalNot infers UnaryExpression:
  operator=('not' | '!') value=Expression;

// Assignment를 아래와 같이 하면 다중 대입문에서 몇가지 문제가 생긴다.
// Assignment infers Expression:
//   Logical ({infer BinaryExpression.left=current} operator=('=') right=Logical)*;
// 우선 대입 연산의 순서가 왼쪽에서 오른쪽으로 가기 때문에 a = b = 0 은 a = b가 먼저 처리된다.
// 또 다른 문제는 이 좌결합성 때문에 다중 대입문에서 세미콜론을 제대로 표시할 수 없다.
// 따라서 assignment는 따로 정의되며 좌변에 MethodCall을 사용해 a.b = 0를 처리한다.
Assignment:
  assign=MethodCall operator=('=' | '+=' | '-=' | '*=' | '/=') value=Expression;

// Binary Operators
Logical infers Expression:
  Comparison     ({infer BinaryExpression.left=current} operator=('and' | 'or' | '&&' | '||') right=Comparison)*;

Comparison infers Expression:
  Addition       ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Addition)*;

Addition infers Expression:
  Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-' | '..') right=Multiplication)*;

Multiplication infers Expression:
  Exponentiation ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=Exponentiation)*;

Exponentiation infers Expression:
  MethodCall     ({infer BinaryExpression.left=current} operator=('**') right=MethodCall)*;

// Member call and Chaining of Member calls
// 아래 규칙은 개체의 fields, methods, functions를 모두 호출할 수 있으며 체인닝될 수도 있다.
// 즉 다음과 같은 것들을 파싱할 수 있다. ()안에는 인수들이 있을 수도 있다.
// a, a(), a.b, a().b, a.b(), a().b(), ...
MethodCall infers Expression:
  SimpleExpression ({infer MethodCall.previous=current}
  "." element=[NamedElement:Id] (explicitCall?='(' (args+=Expression (',' args+=Expression)*)? ')')?
  )*;

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
  expr=SimpleExpression 'match' '{' cases+=CaseClause+ '}';

CaseClause:
  'case' pattern=(CaseDefalut | CasePattern) '=>' body=Block;

CaseDefalut returns string: '_';
CasePattern: Literal;

InfixExpression:
  e1=Id name=Id e2=Literal;

ReturnExpression:
  'return' (value=Expression)?;

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

NumberLiteral returns number:
  ('-')? FloatingPointLiteral
  | ('-')? IntegerLiteral;

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
terminal StringLiteral: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|`(\\.|[^'\\])*`/;
// terminal StringLiteral: '"' (StringElement)+ '"';
// terminal StringElement: PrintableChar |  CharEscapeSeq;

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
TypedId: name=Id ':' type=AllTypes;

// Whitespace and Comments
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
