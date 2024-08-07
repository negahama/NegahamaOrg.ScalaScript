grammar ScalaScript

entry Model: codes+=Code*;

Code: Statement | Expression;

// Statements
Statement:
  VariableDeclaration | FunctionDeclaration
  | VariableDefinition | FunctionDefinition
  | Bypass
  | DoStatement
  | ForStatement
  | WhileStatement
  // | TryStatement
  // | ThrowStatement
  ;

// Basic Declarations and Definitions
// A declaration introduces names and assigns them types.
// It can form part of a class definition or of a refinement in a compound type.

// Value and Variable Declarations and Definitions
VariableKind returns string: 'val' | 'var';
VariableDeclaration:
  kind=VariableKind Ids (':' type=Type)?;
VariableDefinition:
  kind=VariableKind Ids (':' type=Type)? '=' value=Expression;
fragment Variable: name=PlainId (':' type=Type)?;

// Function Declarations and Definitions
FunctionDeclaration: 'def' FunSigniture;
FunctionDefinition : 'def' FunSigniture '=' body=Block;
fragment FunSigniture:
  name=PlainId '(' Params? ')' (':' returnType=Type)?;
fragment Params:
  params+=Param (',' params+=Param)*;
Param:
  Variable ('=' value=Expression)?;
Block:
  ('{' codes+=Code* '}') | expression=Expression;

// Function call and Chaining of function calls
FunCall:
  def=Id '(' (args+=Expression (',' args+=Expression)*)? ')';

FunCallChain:
  calls+=FunCall ('.' calls+=FunCall)*;

// Anonymous Functions
AnonymousCall:
  ('(' Bindings? ')' | bindings+=Binding) (':' returnType=Type)? '=>' body=Block;

fragment Bindings: bindings+=Binding (',' bindings+=Binding)*;
Binding : Variable; // Binding : name=PlainId (':' type=Type)?;

// Do Loop
DoStatement:
  'do' loop=Block 'while' ConditionClause;

// While Loop
WhileStatement:
  'while' ConditionClause loop=Block;

// For Comprehensions and For Loops
ForStatement:
  'for' '(' iterators+=Iterator (';' iterators+=Iterator)* ')' loop=Block;

Iterator: ForOf | ForTo | ForUntil;

ForOf   : name=PlainId '<-' of=SimpleExpr;
ForTo   : name=PlainId '<-' e1=SimpleExpr 'to'    e2=SimpleExpr;
ForUntil: name=PlainId '<-' e1=SimpleExpr 'until' e2=SimpleExpr;

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
  | MatchExpression
  | AnonymousCall
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
  value=BooleanLiteral
  | value=NumberLiteral
  | value=StringLiteral
  // | value=CharLiteral
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
    'then'? then=Block
    (elif+=IfElseExpression)*
    ('else' else=Block)?;

fragment ConditionClause:
  // '(' condition=Logical ')';
  condition=Logical;

IfElseExpression:
  'elif' ConditionClause elif=Block?;

MatchExpression:
  name=PlainId 'match' '{' cases+=(CaseClause | Bypass)+ '}';

CaseClause:
  'case' pattern=(CaseDefalut | CasePattern) '=>' body=Block;

CaseDefalut returns string: '_';
CasePattern: Literal;

// Bypass & Comment
Bypass: (bypass=BYPASS | comment=ML_COMMENT | comment=SL_COMMENT);
terminal BYPASS     returns string: /%%[\s\S]*?%%/;
terminal ML_COMMENT returns string: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT returns string: /\/\/[^\n\r]*/;


// Entity:
//     'entity' name=ID ('extends' superType=[Entity:QualifiedName])? '{'
//         (features+=Feature)*
//     '}';

// Feature:
//     (many?='many')? name=ID ':' type=[Type:QualifiedName];


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
terminal StringLiteral: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
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

fragment Ids: names+=PlainId (',' names+=PlainId)*;

// Type
Type:
  FunSigType
  | ArrayType
  | type=Id;
FunSigType:
  '(' (args+=FunArgType (',' args+=FunArgType)*)? ')' '=>' returnType=Type;
FunArgType: Variable;
ArrayType: type=Id '[]';

// Whitespace and Comments
hidden terminal WS: /\s+/;
