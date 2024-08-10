grammar ScalaScript

entry Program: codes+=Code*;

Code: Statement | Expression;

// Statements
Statement:
  Bypass
  | VariableDeclaration
  | FunctionDeclaration
  | Class
  | DoStatement
  | ForStatement
  | WhileStatement
  | ThrowStatement
  | CatchStatement;

// Value and Variable Declarations and Definitions
// 다중 대입문을 지원하기 위해서 아래와 같이 되어져 있다.
// 하지만 이 방식은 어떻게 해도 names 속으로 name이 숨기 때문에 cross-reference가 되지 않는다.
// 아래와 같이 VariableName을 별도로 두어도 이것의 AstNode상의 위치가 VariableDeclaration의 자식 노드가 되기 때문에
// 일반적인 Scope 규칙으로 보면 VariableDeclaration의 외부에서는 접근할 수 없는 것이다.
// VariableDeclaration: kind=VariableKind names+=VariableName (',' names+=VariableName)* (':' type=Type)? ...
// VariableName: name=PlainId;
VariableKind returns string: 'val' | 'var';
VariableDeclaration:
  kind=VariableKind Ids (':' type=Type)? ('=' value=Expression)?;
fragment Ids: names+=PlainId (',' names+=PlainId)*;

// Function Declarations and Definitions
FunctionDeclaration: 'def' FunSigniture;
fragment FunSigniture:
  name=PlainId '(' Parameters? ')' (':' returnType=Type)? ('=' body=Block)?;
fragment Parameters:
  parameters+=Parameter (',' parameters+=Parameter)*;
Parameter: Variable;
Block:
  ('{' codes+=Code* '}') | expression=Expression;

// Class Declarations
// 아래 규칙은 MethodMember의 파라메터로 초기값을 가질 수 있고 FieldMember로 타입이 없을 수도 있다.
// class ClassName extends SuperClass {
//   display(msg: string = "hello")
//   message
// }
Class: 'class' name=PlainId ('extends' superClass=[Class:PlainId])? '{' members+=ClassMember* '}';
ClassMember: MethodMember | FieldMember;
MethodMember: FunSigniture;
FieldMember: Variable;

// Do Loop
DoStatement:
  'do' loop=Block 'while' ConditionClause;

// For Comprehensions and For Loops
// ForStatement:
//   'for' '(' counter=VariableDeclaration? ';' condition=Expression? ';' execution=Expression? ')' loop=Block;
ForStatement:
  'for' '(' iterators+=Iterator (';' iterators+=Iterator)* ')' loop=Block;

Iterator: ForOf | ForTo | ForUntil;

ForOf   : name=PlainId '<-' of=SimpleExpr;
ForTo   : name=PlainId '<-' e1=SimpleExpr 'to'    e2=SimpleExpr;
ForUntil: name=PlainId '<-' e1=SimpleExpr 'until' e2=SimpleExpr;

// While Loop
WhileStatement:
  'while' ConditionClause loop=Block;

// Throw Statement
ThrowStatement:
  'throw' throw=Expression;

// Try Statement
CatchStatement:
  'try' body=Block
  ('catch' '{' cases+=(CaseClause | Bypass)+ '}')?
  ('finally' finally=Expression)?;

// Bypass & Comment
Bypass: (bypass=BYPASS | comment=ML_COMMENT | comment=SL_COMMENT);
terminal BYPASS     returns string: /%%[\s\S]*?%%/;
terminal ML_COMMENT returns string: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT returns string: /\/\/[^\n\r]*/;

// 모든 변수는 다음의 규칙을 가지고 있다.
// 이름 : 타입 = 값
// 이름은 유효한 식별자이어야 한다.
// 타입이나 값을 통해서 변수의 타입을 정할 수 있어야 한다.
// 즉 타입이나 값 둘다 있거나 적어도 하나는 있어야만 된다.
// 타입과 값은 모두 있으면 값은 명시된 타입으로 변환되며 이 변환이 실패하면 에러가 된다.
// var, val 은 변수를 선언하는 것이지만 엄밀하게 말하면 변수의 성격을 결정하는 것으로써
// var는 재할당이 가능한 변수를, val은 한번 할당되면 다시 재할당되지 않는 변수로 지정하는 것이다.
// 그래서 람다 함수 호출시 인수의 이름과 타입을 정하는 것은 변수의 생성이 아니라 Binding이라고 한다. 
fragment Variable: name=PlainId (':' type=Type)? ('=' value=Expression)?;

type NamedElement = VariableDeclaration
  | FunctionDeclaration
  | Class
  | MethodMember
  | FieldMember
  | Parameter;

// Type
Type:
  LambdaType
  | primitive=("string" | "number" | "boolean" | "void") (isArray?='[]')?
  | reference=[Class:PlainId] (isArray?='[]')?;
LambdaType:
  '(' (args+=Binding (',' args+=Binding)*)? ')' '=>' returnType=Type;

// Expressions
// Expressions:
//   exprs+=Expression (',' exprs+=Expression)*;

// Logical rule은 많은 rule을 내포하고 있다.
// 이것은 관계 연산 뿐만 아니라 비교 연산과 사칙 연산을 모두 포함하고 있으며 operator가 없을 경우도 포함된다.
// 이 경우는 SimpleExpression이 되고 이것은 Liter, Group, Ref를 포함한다.
Expression:
  LogicalNot
  | Logical
  | Assignment
  | IfExpression
  | MatchExpression
  | AnonymousCall
  | ArrayLiteral
  | InfixExpr;

SimpleExpr infers Expression:
  UnaryExpression
  | Literal
  | Group
  | FeatureCall;

// Literals
// There are literals for integer numbers, floating point numbers, characters, booleans, symbols, strings.
// The syntax of these literals is in each case as in Java.
Literal:
  // value?='true' | 'false'
  value=BooleanLiteral
  | value=NumberLiteral
  | value=StringLiteral
  // | value=CharLiteral
  | 'null';

// grouped expression with parentheses
Group:
  '(' value=Expression ')';

FeatureCall infers Expression: {infer MemberCall}
	// (element=[NamedElement:PlainId] | element=[NamedElement:'this'] | element=[NamedElement:'super'])
	(element=PlainId | element='this' | element='super')
  // Optional function call after referencing an element
  (explicitCall?='(' Arguments? ')')?;

// Unary operators
UnaryExpression:
  operator=('-' | '+') value=Expression;

LogicalNot infers UnaryExpression:
  operator=('not' | '!') value=Expression;

// Binary Operators
// Assignment infers Expression:
//     Logical      ({infer BinaryExpression.left=current} operator=('=') right=Addition)*;
Assignment:
  assign=Id operator=('=' | '+=' | '-=' | '*=' | '/=') value=Expression;
  // assign=[VariableName:PlainId] operator=('=' | '+=' | '-=' | '*=' | '/=') value=Expression;

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
// element=PlainId 대신 element=[NamedElement:PlainId]를 사용해야 하는데
// 이렇게 되면 각종 라이브러리들의 모든 메서드들이 등록되어져야 하므로 현재로는 무리다.
MemberCall infers Expression:
  SimpleExpr ({infer MemberCall.previous=current} 
    ( (explicitCall?='(' Arguments? ')') | "." element=PlainId (explicitCall?='(' Arguments? ')')? )
  )*;
fragment Arguments:
  args+=Expression (',' args+=Expression)*;


// Conditional Expressions
// ConditionClause는 if, while, do-while등에서 사용되는데 single expression 이면 괄호를 생략할 수 있다.
// Single expression으로 취급할 수 있는 것들이 FunCall, Literal, Group, Ref가 있으며 이들을 이용한 연산도
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
  name=PlainId 'match' '{' cases+=(CaseClause | Bypass)+ '}';

CaseClause:
  'case' pattern=(CaseDefalut | CasePattern) '=>' body=Block;

CaseDefalut returns string: '_';
CasePattern: Literal;

// Anonymous Functions
AnonymousCall:
  ('(' Bindings? ')' | bindings+=Binding) (':' returnType=Type)? '=>' body=Block;
fragment Bindings: bindings+=Binding (',' bindings+=Binding)*;
Binding: name=PlainId (':' type=Type)?;

// Array expression
ArrayLiteral:
  '[' items+=Literal (',' items+=Literal )* ']';

InfixExpr:
  e1=PlainId name=PlainId e2=Literal;

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
// terminal PlainId: Upper (Letter | Digit)* | VarId;

// Identifiers
terminal PlainId returns string: ID;
Id returns string:
  PlainId (('.'|'::') PlainId)* // QualifiedName returns string:
  | '`' StringLiteral '`';

// Whitespace and Comments
hidden terminal WS: /\s+/;
