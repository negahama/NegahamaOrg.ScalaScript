grammar ScalaScript

entry Model:
  (bypasses+=Bypass | declarations+=Dcl | definitions+=Def | statements+=Stmt | prints+=Print)*;

terminal Bypass returns string: /%%[\s\S]*?%%/;

// Basic Declarations and Definitions
// A declaration introduces names and assigns them types.
// It can form part of a class definition or of a refinement in a compound type.

Dcl: ValDcl | VarDcl | FunDcl;
Def: ValDef | VarDef | FunDef;

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
FunDcl:
  // 'def' FunSig (':' Type)?;
  'def' name=ID '(' (params+=Param (',' params+=Param)*)? ')' Block;
// FunDef:
//   'def' FunSig (':' Type)? '=' value=Expr;
FunDef:
  'def' name=ID '(' (params+=Param (',' params+=Param)*)? ')' Block;
// FunSig:
//   name=ID [FunTypeParamClause] ParamClauses;
// FunTypeParamClause:
//   '[' TypeParam {',' TypeParam} ']';
// ParamClauses:
//   {ParamClause} [[NL] '(' 'implicit' Params ')'];
// ParamClause:
//   [NL] '(' [Params] ')';
// Params:
//   Param {',' Param};
// Param:
//   {Annotation} id [':' ParamType] ['=' Expr];
// ParamType:
//   Type
//   | '=>' Type
//   | Type '*';
Param: name=ID;


// Expressions
// Expressions are composed of operators and operands.
// Expression forms are discussed subsequently in decreasing order of precedence.

Expr:
  Add
  | Literal
  // | PrimExpr
  | IfExpr
  | DoExpr
  | WhileExpr
  | ForExpr
  // | ReturnExpr
  // | ThrowExpr
  ;

Add  infers Expr: 
    Mult ({infer BinExpr.e1=current} op=('+'|'-') e2=Mult)*;

Mult infers Expr: 
    PrimExpr ({infer BinExpr.e1=current} op=('*'|'/') e2=PrimExpr)*;

PrimExpr: Lit | Ref | Group | NegExpr;

// literal int
Lit:        val=INT;
// cross-reference to a parameter
Ref:        value=[Def:ID];
// grouped expression with parentheses
Group:      '(' group=Expr ')';
// negated expression
NegExpr:    '-' negex=Expr;

// Assignments
// Expr1:
//   [SimpleExpr '.'] id '=' Expr
//   | SimpleExpr1 ArgumentExprs '=' Expr;

// Conditional Expressions
IfExpr:
  'if' '(' condition=Expr ')' (NL)* then=Expr ((Semi)? 'else' else=Expr)?;

// Do Loop Expressions
DoExpr: 'do' loop=Expr (Semi)? 'while' '(' condition=Expr ')';

// While Loop Expressions
WhileExpr: 'while' '(' condition=Expr ')' (NL)* loop=Expr;

// For Comprehensions and For Loops
// Expr1:
//   'for' ('(' Enumerators ')' | '{' Enumerators '}')
//   {NL} ['yield'] Expr;
// Enumerators: Generator {Semi Generator};
// Generator  : Pattern1 '<-' Expr {[Semi] Guard | Semi Pattern1 '=' Expr};
// Guard      : 'if' PostfixExpr;
ForExpr:
  'for' '(' var=Param '=' e1=Expr 'to' e2=Expr ')' Block;

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
// BlockStat:
//   Import
//   | {Annotation} ['implicit' | 'lazy'] Def
//   | {Annotation} {LocalModifier} TmplDef
//   | Expr1;

// TemplateStat:
//   Import
//   | {Annotation} {Modifier} Def
//   | {Annotation} {Modifier} Dcl
//   | Expr;

// Stmt: FunctionCall | Print;
Stmt: FunctionCall;

FunctionCall:
  def=[Def:ID] '(' (args+=Expr (',' args+=Expr)*)? ')';

Type:
    DataType | Entity;

DataType:
    'datatype' name=ID;

Entity:
    'entity' name=ID ('extends' superType=[Entity:QualifiedName])? '{'
        (features+=Feature)*
    '}';

Feature:
    (many?='many')? name=ID ':' type=[Type:QualifiedName];

QualifiedName returns string:
    ID ('.' ID)*;

// 

fragment Block: '{' body+=Stmt* '}';

Print:
  'print' value=Expr;


// Parentheses
terminal Paren    : '(' | ')' | '[' | ']' | '{' | '}';

// Delimiter characters
// terminal Delim : '`' | ''' | '"' | '.' | ';' | ',';
terminal Delim    : /[`'".;,]/;

// New line and semicolon
terminal NL       : /[\n\r]/;
terminal Semi     : ';' |  (NL)+;

// Identifiers
// op       ::=  opchar {opchar}
// varid    ::=  lower idrest
// plainid  ::=  upper idrest
//            |  varid
//            |  op
// id       ::=  plainid
//            |  '`' stringLiteral '`'
// idrest   ::=  {letter | digit} ['_' op]

terminal Upper    :  /[A-Z$_]/;  // and Unicode category Lu
terminal Lower    :  /[a-z]/;    // and Unicode category Ll
terminal Letter   :  Upper | Lower; // and Unicode categories Lo, Lt, Nl

terminal ID       : /[_a-zA-Z][\w_]*/;

// Literals
// There are literals for integer numbers, floating point numbers, characters, booleans, symbols, strings.
// The syntax of these literals is in each case as in Java.
terminal Literal: 
  ('-')? IntegerLiteral
  | ('-')? FloatingPointLiteral
  | BooleanLiteral
  | CharacterLiteral
  | StringLiteral
  | 'null';

// Integer Literals
terminal INT              returns number : /[0-9]+/;
terminal IntegerLiteral   returns number : (DecimalNumeral | HexNumeral);
terminal DecimalNumeral   returns number : '0' | NonZeroDigit Digit*;
terminal HexNumeral       returns number : '0' ('x' | 'X') HexDigit+;
//terminal Digit          returns number : /[0-9]/;
terminal Digit            returns number : '0' | NonZeroDigit;
terminal HexDigit         returns string : /[0-9a-fA-F]/;
terminal NonZeroDigit     returns number : /[1-9]/;

// Floating Point Literals
// example : 0.0    1e30f    3.14159f    1.0e-100    .1
terminal FloatingPointLiteral returns number :
  (Digit)+ '.' (Digit)+ (ExponentPart)? (FloatType)?
  |  '.' (Digit)+ (ExponentPart)? (FloatType)?
  |  (Digit)+ ExponentPart (FloatType)?
  |  (Digit)+ (ExponentPart)? FloatType;
terminal ExponentPart: ('E' | 'e') ('+' | '-')? (Digit)+;
terminal FloatType   : /[FfDd]/;

// Boolean Literals
terminal BooleanLiteral   returns boolean: 'true' | 'false';

// Character Literals
terminal CharacterLiteral : ''' (PrintableChar | CharEscapeSeq) ''';
terminal PrintableChar    : /[\u0020-\u007F]/;
terminal CharEscapeSeq    : '\b' | '\t' | '\n' | '\f' | '\r' | '\"' | '\'' | '\\';

// String Literals
terminal STRING           : /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal StringLiteral    : '"' (StringElement)+ '"';
terminal StringElement    : PrintableChar |  CharEscapeSeq;

// Whitespace and Comments
hidden terminal WS        : /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
