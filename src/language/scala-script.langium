grammar ScalaScript

entry Model: (codes+=Code)*;

Code: Statement | Expression;

// Statements
Statement:
  Declaration
  | Definition
  | Bypass
  | DoStatement
  | WhileStatement
  | ForStatement
  // | ReturnStatement
  // | TryStatement
  // | ThrowStatement
  ;

Declaration: ValDeclaration | VarDeclaration | FunDeclaration;
Definition : ValDefinition  | VarDefinition  | FunDefinition;

// Identifiers
// opchar ::= // printableChar not matched by (whiteSpace | upper | lower |
//              // letter | digit | paren | delim | opchar | Unicode_Sm | Unicode_So)
// op     ::=  opchar {opchar}

// terminal VarId returns string:
//   Lower (Letter | Digit)*;
// terminal PlainId returns string:
//   Upper (Letter | Digit)* | VarId;

terminal PlainId returns string: ID;
Id returns string:
  PlainId (('.'|'::') PlainId)* // QualifiedName returns string:
  | '`' StringLiteral '`';

// Type
Type returns string:
  Id '[]'
  | Id;

Bindings: '(' bindings+=Binding (',' bindings+=Binding)* ')';
Binding : name=PlainId (':' type=Type)?;

// Basic Declarations and Definitions
// A declaration introduces names and assigns them types.
// It can form part of a class definition or of a refinement in a compound type.

// Value Declarations and Definitions
ValDeclaration:
  'val' ids+=PlainId ((',' ids+=PlainId)*)? (':' type=Type)?;
ValDefinition:
  'val' bind=Binding '=' value=Expression;

// Variable Declarations and Definitions
VarDeclaration:
  'var' ids+=PlainId ((',' ids+=PlainId)*)? (':' type=Type)?;
VarDefinition:
  'var' bind=Binding '=' value=Expression;

// Function Declarations and Definitions
// 여기서 fragment를 사용하는 이유는 이 함수 정의와 선언의 루트 노드의 타입을 FunDcl, FunDef로 해주기 위해서이다.
// fragment를 사용하지 않으면 루트 노드의 타입이 Params이 된다.

FunDeclaration:
  'def' FunSig;
FunDefinition:
  'def' FunSig '=' Block;
fragment FunSig:
  name=PlainId '(' Params? ')' (':' returnType=Type)?;
fragment Params:
  params+=Param (',' params+=Param)*;
Param:
  bind=Binding ('=' value=Expression)?;
fragment Block:
  '{' (body+=(Expression | Statement))* '}';
  // '{' body+=Expression ((Semi*) body+=Expression)* result=Expression? '}';
ExprOrBlock:
  Block | body=Expression;

FunCall:
  // def=[FunDefinition:Id] '(' (args+=Expression (',' args+=Expression)*)? ')';
  def=Id '(' (args+=Expression (',' args+=Expression)*)? ')';

// Anonymous Functions
AnonyFunCall:
  (params=Bindings | param=PlainId) (':' returnType=Type)? '=>' body=ExprOrBlock;

FunCallChain:
  calls+=FunCall ('.' calls+=FunCall)*;

// Bypass
Bypass: bypass=BYPASS;
terminal BYPASS returns string: /%%[\s\S]*?%%/;

// Do Loop
DoStatement:
  'do' loop=ExprOrBlock 'while' ConditionClause;

// While Loop
WhileStatement:
  'while' ConditionClause loop=ExprOrBlock;

// For Comprehensions and For Loops
ForStatement:
  'for' '(' iterators+=Iterator (';' iterators+=Iterator)* ')' Block;

Iterator: ForOf | ForTo | ForUntil;

ForOf   : name=PlainId '<-' of=SimpleExpr;
ForTo   : name=PlainId '<-' e1=SimpleExpr 'to'    e2=SimpleExpr;
ForUntil: name=PlainId '<-' e1=SimpleExpr 'until' e2=SimpleExpr;

// Return Statement
// ReturnStatement: 'return' (Expression)?;

// Try Statement
// TryStatement: 'try' ('{' Block '}' | Expr) ['catch' '{' CaseClauses '}']
//   ['finally' Expr] ;

// Throw Statement
// ThrowStatement: 'throw' Expression;


// Expressions
// Expressions are composed of operators and operands.
// Expression forms are discussed subsequently in decreasing order of precedence.

// Expressions:
//   exprs+=Expression (',' exprs+=Expression)*;

// Logical rule은 많은 rule을 내포하고 있다.
// 이것은 관계 연산 뿐만 아니라 비교 연산과 사칙 연산을 모두 포함하고 있으며 operator가 없을 경우도 포함된다.
// 이 경우는 SimpleExpression이 되고 이것은 Liter, Group, Ref를 포함한다.

Expression:
  Logical
  | Assignment
  | IfExpression
  | AnonyFunCall
  | ArrayLiteral
  ;

SimpleExpr:
  FunCallChain | Literal | Group | Ref;

ArrayLiteral:
  '[' items+=Literal (',' items+=Literal )* ']';

// Literals
// There are literals for integer numbers, floating point numbers, characters, booleans, symbols, strings.
// The syntax of these literals is in each case as in Java.
Literal:
  ('-')? value=IntegerLiteral
  | ('-')? value=FloatingPointLiteral
  | value=BooleanLiteral
  | value=StringLiteral
  | value=CharLiteral
  | 'null';

// grouped expression with parentheses
Group:
  '(' value=Expression ')';

// cross-reference to a parameter
Ref:
  // value=[Def:Id];
  // value=[Param:Id];
  value=Id;

// Assignments
// Assignment infers Expression:
//     Logical      ({infer BinaryExpression.left=current} operator=('=') right=Addition)*;
Assignment:
  name=Id operator=('=' | '+=' | '-=' | '*=' | '/=') value=Expression;

Logical infers Expression:
  Comparison     ({infer BinaryExpression.left=current} operator=('and' | 'or') right=Comparison)*;

Comparison infers Expression:
  Addition       ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=' | '==' | '!=') right=Addition)*;

Addition infers Expression:
  Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-') right=Multiplication)*;

Multiplication infers Expression:
  SimpleExpr     ({infer BinaryExpression.left=current} operator=('*' | '/') right=SimpleExpr)*;

// Conditional Expressions
// ConditionClause는 if, while, do-while등에서 사용되는데 single expression 이면 괄호를 생략할 수 있다.
// Single expression으로 취급할 수 있는 것들이 FunCall, Literal, Group, Ref가 있으며 이들을 이용한 연산도
// 마찬가지이다. 이 모든 것이 Logical Rule 하나에 들어가 있다.

IfExpression:
  'if' ConditionClause
    'then'? then=ExprOrBlock
    (elif+=IfElseExpression)*
    ('else' else=ExprOrBlock)?;

fragment ConditionClause:
  // '(' condition=Logical ')';
  condition=Logical;

IfElseExpression:
  'elif' ConditionClause elif=ExprOrBlock?;


// Entity:
//     'entity' name=ID ('extends' superType=[Entity:QualifiedName])? '{'
//         (features+=Feature)*
//     '}';

// Feature:
//     (many?='many')? name=ID ':' type=[Type:QualifiedName];


// Parentheses
// terminal Paren    : '(' | ')' | '[' | ']' | '{' | '}';

// Delimiter characters
// terminal Delim : '`' | ''' | '"' | '.' | ';' | ',';
// terminal Delim    : /[`'".;,]/;

// New line and semicolon
// Whitespace를 hidden terminal로 설정한 WS로 인해 NL은 인식되지 않고 있음
// terminal NL       : /[\n\r]/;
// terminal Semi     : ';' | (NL)+;

// Boolean Literals
// It has to place before ID or Identifier
// Otherwise `true` and `false` is identified for Indentifier

terminal BooleanLiteral returns boolean: 'true' | 'false';

// Floating Point Literals
// example : 0.0    1e30f    3.14159f    1.0e-100    .1
// It has to also place before defining the Integer literal

terminal FloatingPointLiteral returns number:
  (Digit)+ '.' (Digit)+ (ExponentPart)? (FloatType)?
  |  '.' (Digit)+ (ExponentPart)? (FloatType)?
  |  (Digit)+ ExponentPart (FloatType)?
  |  (Digit)+ (ExponentPart)? FloatType;
terminal ExponentPart : ('E' | 'e') ('+' | '-')? (Digit)+;
terminal FloatType    : /[FfDd]/;

// Integer Literals
// terminal INT              returns number: /[0-9]+/;
terminal IntegerLiteral   returns number: (DecimalNumeral | HexNumeral);
terminal DecimalNumeral   returns number: '0' | NonZeroDigit Digit*;
terminal HexNumeral       returns number: '0' ('x' | 'X') HexDigit+;
//terminal Digit          returns number: /[0-9]/;
terminal Digit            returns number: '0' | NonZeroDigit;
terminal HexDigit         returns string: /[0-9a-fA-F]/;
terminal NonZeroDigit     returns number: /[1-9]/;

// Character Literals
terminal CharLiteral  : ''' (PrintableChar | CharEscapeSeq) ''';
// terminal PrintableChar: /[\u0020-\u007F]/;
// terminal CharEscapeSeq: '\b' | '\t' | '\n' | '\f' | '\r' | '\"' | '\'' | '\\';

// terminal Upper        :  /[A-Z$_]/;     // and Unicode category Lu
// terminal Lower        :  /[a-z]/;       // and Unicode category Ll
// terminal Letter       :  Upper | Lower; // and Unicode categories Lo, Lt, Nl

// String Literals
terminal StringLiteral: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
// terminal StringLiteral: '"' (StringElement)+ '"';
// terminal StringElement: PrintableChar |  CharEscapeSeq;

// Identifiers
// 이것은 BooleanLiteral 다음에 와야 한다.
// 그렇지 않으면 true, false가 ID로 취급되어진다.
terminal ID: /[_a-zA-Z][\w_]*/;

// Whitespace and Comments
hidden terminal WS        : /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
