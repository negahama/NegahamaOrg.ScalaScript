# Changelog

All notable changes to this project will be documented in this file.

## 🔗 Release Notes

### 0.6.3 - December 23, 2024

- seperate the object type and class type
- for-statement validator was implemented
- adjust new line position for bypass comment
- fixed the bug about super class

### 0.6.2 - December 20, 2024

- fix the bug about rest parameter type

### 0.6.1 - December 19, 2024

- checking rest parameter was implemented

### 0.6.0 - December 19, 2024

- A parameter check function was implemented

### 0.5.8 - December 10, 2024

- reinforce Generic processing
- bug fix

### 0.5.7 - December 9, 2024

- make comma to be possible in ObjectDef, ObjectValue
- improve the Generic and functional method
- reinforce Scope and TypeSystem
- and bug fix

### 0.5.6 - December 2, 2024

- reinforce TypeSystem
- fixed bug about inferTypeSimpleType

### 0.5.5 - November 29, 2024

- refactoring TypeSystem
- The Langium version upgrade to 3.3.0
- support block with indent such as Python

### 0.5.4 - November 24, 2024

- fixed some bugs about function type variables

### 0.5.3 - November 22, 2024

- prepare to remove the FunctionDef

### 0.5.2 - November 21, 2024

- changed the grammar from `def object_type => { ... }` to `def object_type = { ... }`
- The readme is reinforced.
- refactoring

### 0.5.1 - November 19, 2024

- remove the TsAstViewer
- fixed the bug that is not parse correctly stuff like this : `var t: (arg: number) -> number[]`
