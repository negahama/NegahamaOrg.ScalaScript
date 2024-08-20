grammar ScalaScript

entry Program: codes+=Code*;

Code: Statement | Expression;

// Statements
Statement:
  Bypass
  | TypeDeclaration
  | VariableDeclaration
  | FunctionDeclaration
  | ClassDeclaration
  | DoStatement
  | ForStatement
  | WhileStatement
  | ThrowStatement
  | CatchStatement
  | Continue
  | Break;

// Type Declarations
TypeDeclaration:
  'type' name=Id '=' value=ObjectType;

// Value and Variable Declarations and Definitions
// 다중 대입문을 지원하기 위해서 아래와 같이 되어져 있다.
// 하지만 이 방식은 어떻게 해도 names에 name들이 위치하기 때문에 cross-reference가 되지 않는다.
// 다중 대입문의 변수들은 이것의 AstNode상의 위치가 VariableDeclaration의 자식 노드가 되기 때문에
// 일반적인 Scope 규칙으로 보면 VariableDeclaration의 외부에서는 접근할 수 없는 것이다.
VariableDeclaration:
  (Annotation)? kind=('val' | 'var') names+=Id (',' names+=Id)* (':' type=Type)? ('=' value=Expression)?;
fragment Annotation:
  '@' annotate=Id;

// Function Declarations and Definitions
FunctionDeclaration infers Method:
  (Annotation)? 'def' FunSigniture;
fragment FunSigniture:
  (extension=Type '.')? name=Id '(' Parameters? ')' (':' returnType=Type)? ('=' body=Block)?;
fragment Parameters:
  parameters+=Parameter (',' parameters+=Parameter)*;
Parameter: Variable;
Block:
  ('{' codes+=Code* '}') | codes+=Expression;

// Class Declarations
// 아래 규칙은 MethodMember의 파라메터로 초기값을 가질 수 있고 FieldMember로 타입이 없을 수도 있다.
// class ClassName extends SuperClass {
//   display(msg: string = "hello")
//   message
// }
ClassDeclaration infers Class:
  (Annotation)? 'class' name=Id
  ('extends' superClass=[Class:Id])?
  '{' members+=(Field | Method)* '}';
Field: Variable;
Method: FunSigniture;

// Do Loop
DoStatement:
  'do' loop=Block 'while' ConditionClause;

// For Comprehensions and For Loops
// ForStatement:
//   'for' '(' counter=VariableDeclaration? ';' condition=Expression? ';' execution=Expression? ')' loop=Block;
ForStatement:
  'for' '(' iterators+=Iterator (';' iterators+=Iterator)* ')' loop=Block;

Iterator: ForOf | ForTo | ForUntil;

ForOf   : name=Id '<-' of=Expression;
ForTo   : name=Id '<-' e1=Expression 'to'    e2=Expression;
ForUntil: name=Id '<-' e1=Expression 'until' e2=Expression;

// While Loop
WhileStatement:
  'while' ConditionClause loop=Block;

// Throw Statement
ThrowStatement:
  'throw' throw=Expression;

// Try Statement
CatchStatement:
  'try' body=Block
  ('catch' '{' cases+=CaseClause+ '}')?
  ('finally' finally=Expression)?;

Continue: dummy?='continue';
Break: dummy?='break';

// Bypass
Bypass: bypass=BYPASS;
terminal BYPASS returns string: /(%%\/\/[^\n\r]*|%%[\s\S]*?%%)/;

// 모든 변수는 다음의 규칙을 가지고 있다.
// 이름 : 타입 = 값
// 이름은 유효한 식별자이어야 한다.
// 타입이나 값을 통해서 변수의 타입을 정할 수 있어야 한다.
// 즉 타입이나 값 둘다 있거나 적어도 하나는 있어야만 된다.
// 타입과 값은 모두 있으면 값은 명시된 타입으로 변환되며 이 변환이 실패하면 에러가 된다.
// var, val 은 변수를 선언하는 것이지만 엄밀하게 말하면 변수의 성격을 결정하는 것으로써
// var는 재할당이 가능한 변수를, val은 한번 할당되면 다시 재할당되지 않는 변수로 지정하는 것이다.
// 그래서 람다 함수 호출시 인수의 이름과 타입을 정하는 것은 변수의 생성이 아니라 Binding이라고 한다. 
fragment Variable: name=Id (':' type=Type)? ('=' value=Expression)?;

type NamedElement = TypeDeclaration
  | VariableDeclaration
  | Class
  | Field
  | Method
  | Iterator
  | Parameter
  | Binding;

// Type
Type:
  LambdaType
  | ArrayType
  | TupleType
  | ObjectType
  | primitive=("string" | "number" | "boolean" | "void") (isArray?='[]')?
  | reference=[UserDefType:Id] (isArray?='[]')?;

LambdaType : '(' (args+=Binding (',' args+=Binding)*)? ')' '=>' returnType=Type;
ArrayType  : type=Id '[' ']';
TupleType  : '[' types+=Type (',' types+=Type)* ']';
ObjectType : '{' elements+=TypedId (',' elements+=TypedId)* '}';
UserDefType: ClassDeclaration | TypeDeclaration;

// Expressions
// Expressions:
//   exprs+=Expression (',' exprs+=Expression)*;

// Logical rule은 많은 rule을 내포하고 있다.
// 이것은 관계 연산 뿐만 아니라 비교 연산과 사칙 연산을 모두 포함하고 있으며 operator가 없을 경우도 포함된다.
// 이 경우는 SimpleExpression이 되고 이것은 Liter, Group, FeatureCall를 포함한다.
Expression:
  LogicalNot
  | Logical
  | Assignment
  | IfExpression
  | MatchExpression
  | AnonymousCall
  | ArrayLiteral
  | ObjectLiteral
  | InfixExpr
  | ReturnExpr;

SimpleExpression infers Expression:
  UnaryExpression
  | ArrayExpr
  | Group
  | Literal
  | FeatureCall;

// Unary operators
UnaryExpression:
  operator=('-' | '+') value=Expression;

// Array Expression
ArrayExpr:
  name=Id '[' index=Expression ']';

// grouped expression with parentheses
Group:
  '(' value=Expression ')';

// Literals
// There are literals for integer numbers, floating point numbers, characters, booleans, symbols, strings.
// The syntax of these literals is in each case as in Java.
Literal:
  value=BooleanLiteral
  | value=NumberLiteral
  | value=StringLiteral
  | 'null';

// 이것을 cross-reference로 처리하면 MemberCall과 마찬가지로 전역적으로 사용하는 각종 함수들
// 예를들면 console.log의 console이 정의되지 않아 중간에 에러가 된다. 그래도 억지로 할 순 있는데 그 경우에도...
// this, super를 element=[NamedElement:'this']으로 설정하면 ScopeProvider에서 적절한 멤버들을 리턴하게 할 순 있지만
// this, super자체가 AstNode 상에서 없기 때문에 Could not resolve reference to NamedElement named 'this' 에러가 생긴다.
// 프로퍼티 이름이 this로 설정되어져 있는데 이는 Langium이 Reference와 다른 타입을 union type으로 만드는 것을 지원하지 않기 때문이다.
FeatureCall infers Expression: {infer MemberCall}
	(element=[NamedElement:Id] | this='this' | this='super')
  // (explicitCall?='(' Arguments? ')')?;
  (explicitCall?='(' (args+=Expression (',' args+=Expression)*)? ')')?;

LogicalNot infers UnaryExpression:
  operator=('not' | '!') value=Expression;

// Binary Operators
// Assignment infers Expression:
//   Logical ({infer BinaryExpression.left=current} operator=('=') right=Logical)*;
// Assignment를 위와 같이 하면 다중 대입문에서 몇가지 문제가 생긴다.
// 우선 대입 연산의 순서가 왼쪽에서 오른쪽으로 가기 때문에 a = b = 0 은 a = b가 먼저 처리된다.
// 또 다른 문제는 이 좌결합성 때문에 다중 대입에서 세미콜론을 제대로 표시할 수 없다.
// 아래와 같이 하는데 a.b = 0와 같은 것이 처리되기 위해서는 assign으로 QualifiedName가 와야한다.
// 현재는 cross-reference가 처리되지 않기 때문에 [NamedElement:QualifiedName]를 사용할 수 없다.
// 하지만 원래 같은 의미인 MemberCall이 현재 상호참조를 하고 있지 않기 때문에 이걸 사용한다.
Assignment:
  assign=MemberCall operator=('=' | '+=' | '-=' | '*=' | '/=') value=Expression;

Logical infers Expression:
  Comparison     ({infer BinaryExpression.left=current} operator=('and' | 'or' | '&&' | '||') right=Comparison)*;

Comparison infers Expression:
  Addition       ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Addition)*;

Addition infers Expression:
  Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-' | '..') right=Multiplication)*;

Multiplication infers Expression:
  Exponentiation ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=Exponentiation)*;

Exponentiation infers Expression:
  MemberCall     ({infer BinaryExpression.left=current} operator=('**') right=MemberCall)*;

// Member call and Chaining of Member calls
// 아래 규칙은 개체의 fields, methods, functions를 모두 호출할 수 있으며 체인닝될 수도 있다.
// 즉 다음과 같은 것들을 파싱할 수 있다. ()안에는 인수들이 있을 수도 있다.
// a, a(), a.b, a().b, a.b(), a().b(), ... 
//
// element=Id 대신 element=[NamedElement:Id]를 사용해야 하는데
// 이렇게 되면 각종 라이브러리들의 모든 메서드들이 등록되어져야 하므로 현재로는 무리다.
// Arguments를 사용하는 버전은 함수 체이닝시 함수의 인수가 있으면 AST node has no document 에러를 유발한다.
MemberCall infers Expression:
  SimpleExpression ({infer MemberCall.previous=current} 
    // ( (explicitCall?='(' Arguments? ')') | "." element=[NamedElement:Id] (explicitCall?='(' Arguments? ')')? )
    // "." element=[NamedElement:Id] (explicitCall?='(' Arguments? ')')?
    "." element=[NamedElement:Id] (explicitCall?='(' (args+=Expression (',' args+=Expression)*)? ')')?
  )*;
fragment Arguments:
  args+=Expression (',' args+=Expression)*;

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
  name=Id 'match' '{' cases+=CaseClause+ '}';

CaseClause:
  'case' pattern=(CaseDefalut | CasePattern) '=>' body=Block;

CaseDefalut returns string: '_';
CasePattern: Literal;

// Anonymous Functions
AnonymousCall:
  ('(' Bindings? ')' | bindings+=Binding) (':' returnType=Type)? '=>' body=Block;
fragment Bindings: bindings+=Binding (',' bindings+=Binding)*;
Binding: name=Id (':' type=Type)?;

// Array literal
ArrayLiteral:
  '[' items+=Literal (',' items+=Literal )* ']';

// Object literal
ObjectLiteral:
  '{' items+=ObjectBinding (',' items+=ObjectBinding )* '}';
ObjectBinding: name=Id (':' value=Expression)?;

InfixExpr:
  e1=Id name=Id e2=Literal;

ReturnExpr:
  'return' (value=Expression)?;

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
terminal ID: /[_a-zA-Z][\w_]*/;

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
// QualifiedName returns string:
//   Id (('.'|'::') Id)*
//   | '`' StringLiteral '`';
TypedId: name=Id ':' type=Type;

// Whitespace and Comments
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
