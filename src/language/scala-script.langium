grammar ScalaScript

entry Model:
  (expressions+=Expr | statements+=Stmt)*;

Bypass: bypass=BYPASS;
terminal BYPASS returns string: /%%[\s\S]*?%%/;

// Basic Declarations and Definitions
// A declaration introduces names and assigns them types.
// It can form part of a class definition or of a refinement in a compound type.

Dcl:
  ValDcl | VarDcl | FunDcl;
Def:
  ValDef | VarDef | FunDef;

// Value Declarations and Definitions
ValDcl:
  'val' ids+=ID ((',' ids+=ID)*)? (':' type=ID)?;
ValDef:
  'val' name=ID (':' type=ID)? '=' value=Expr;

// Variable Declarations and Definitions
VarDcl:
  'var' ids+=ID ((',' ids+=ID)*)? (':' type=ID)?;
VarDef:
  'var' name=ID (':' type=ID)? '=' value=Expr;

// Function Declarations and Definitions
// 여기서 fragment를 사용하는 이유는 이 함수 정의와 선언의 루트 노드의 타입을 FunDcl, FunDef로 해주기 위해서이다.
// fragment를 사용하지 않으면 루트 노드의 타입이 Params이 된다.

FunDcl:
  'def' FunSig;
FunDef:
  'def' FunSig '=' Block;
fragment FunSig:
  name=ID '(' Params? ')' (':' returnType=ID)?;
fragment Params:
  params+=Param (',' params+=Param)*;
Param:
  name=ID (':' type=ID)? ('=' initVal=Expr)?;
fragment Block:
  '{' (body+=(Expr | Stmt))* '}';
  // '{' body+=Expr ((Semi*) body+=Expr)* result=Expr? '}';

FunCall:
  def=[FunDef:ID] '(' (args+=Expr (',' args+=Expr)*)? ')';

// Expressions
// Expressions are composed of operators and operands.
// Expression forms are discussed subsequently in decreasing order of precedence.

// Exprs:
//   exprs+=Expr (',' exprs+=Expr)*;

Expr:
  PrimExpr
  | Add
  | IfExpr
  | DoExpr
  | WhileExpr
  | ForExpr
  // | ReturnExpr
  // | ThrowExpr
  | FunCall
  | Bypass
  ;

PrimExpr:
  Literal | Group | Ref;

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
  '(' group=Expr ')';

// cross-reference to a parameter
Ref:
  // value=[Def:ID];
  // value=[Param:ID];
  value=ID;

Add  infers Expr: 
  Mult ({infer BinExpr.e1=current} op=('+'|'-') e2=Mult)*;

Mult infers Expr: 
  PrimExpr ({infer BinExpr.e1=current} op=('*'|'/') e2=PrimExpr)*;

// Assignments
// Expr1:
//   [SimpleExpr '.'] id '=' Expr
//   | SimpleExpr1 ArgumentExprs '=' Expr;

// Conditional Expressions
IfExpr:
  'if' '(' condition=Expr ')' (NL)* then=Expr ((Semi)? 'else' else=Expr)?;

// Do Loop Expressions
DoExpr:
  'do' loop=Expr (Semi)? 'while' '(' condition=Expr ')';

// While Loop Expressions
WhileExpr:
  'while' '(' condition=Expr ')' (NL)* loop=Expr;

// For Comprehensions and For Loops
// Expr1:
//   'for' ('(' Enumerators ')' | '{' Enumerators '}')
//   {NL} ['yield'] Expr;
// Enumerators: Generator {Semi Generator};
// Generator  : Pattern1 '<-' Expr {[Semi] Guard | Semi Pattern1 '=' Expr};
// Guard      : 'if' PostfixExpr;
ForExpr:
  'for' '(' var=Param '=' e1=PrimExpr 'to' e2=PrimExpr ')' Block;

// Return Expressions
// ReturnExpr: 'return' (Expr)?;

// Throw Expressions
// ThrowExpr: 'throw' Expr;

// Try Expressions
// Expr1: 'try' ('{' Block '}' | Expr) ['catch' '{' CaseClauses '}']
//   ['finally' Expr] ;

// Anonymous Functions
// Expr        : (Bindings | ['implicit'] id | '_') '=>' Expr;
// ResultExpr  : (Bindings | (['implicit'] id | '_') ':' CompoundType) '=>' Block;
// Bindings    : '(' Binding {',' Binding} ')';
// Binding     : (id | '_') [':' Type];


// Statements
Stmt:
  Dcl | Def;

// Type:
//     DataType | Entity;

// DataType:
//     'datatype' name=ID;

// Entity:
//     'entity' name=ID ('extends' superType=[Entity:QualifiedName])? '{'
//         (features+=Feature)*
//     '}';

// Feature:
//     (many?='many')? name=ID ':' type=[Type:QualifiedName];

// QualifiedName returns string:
//     ID ('.' ID)*;

// Parentheses
// terminal Paren    : '(' | ')' | '[' | ']' | '{' | '}';

// Delimiter characters
// terminal Delim : '`' | ''' | '"' | '.' | ';' | ',';
// terminal Delim    : /[`'".;,]/;

// New line and semicolon
// Whitespace를 hidden terminal로 설정한 WS로 인해 NL은 인식되지 않고 있음
terminal NL       : /[\n\r]/;
terminal Semi     : ';' | (NL)+;

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
terminal PrintableChar: /[\u0020-\u007F]/;
terminal CharEscapeSeq: '\b' | '\t' | '\n' | '\f' | '\r' | '\"' | '\'' | '\\';

// terminal Upper        :  /[A-Z$_]/;     // and Unicode category Lu
// terminal Lower        :  /[a-z]/;       // and Unicode category Ll
// terminal Letter       :  Upper | Lower; // and Unicode categories Lo, Lt, Nl

// String Literals
// terminal STRING       : /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal StringLiteral: '"' (StringElement)+ '"';
terminal StringElement: PrintableChar |  CharEscapeSeq;

// Identifiers
// 이것은 BooleanLiteral 다음에 와야 한다.
// 그렇지 않으면 true, false가 ID로 취급되어진다.

// op       ::=  opchar {opchar}
// varid    ::=  lower idrest
// plainid  ::=  upper idrest
//            |  varid
//            |  op
// id       ::=  plainid
//            |  '`' stringLiteral '`'
// idrest   ::=  {letter | digit} ['_' op]

terminal ID       : /[_a-zA-Z][\w_]*/;

// Whitespace and Comments
hidden terminal WS        : /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
