# Changelog

All notable changes to this project will be documented in this file.

## 🔗 Release Notes

### 0.6.10 - April 2, 2025

- changed the parameter `digit` of Number.toFixed(digit) to be nullable
- fixed the bug that the parameter `start` in Array.splice(start, deleteCount, ...) was 0 based index 

### 0.6.9 - March 9, 2025

- changed grammar to be possible to support regular expression other flags.(/g -> /gu)

### 0.6.8 - March 7, 2025

- bug fix

### 0.6.7 - March 6, 2025

- support import statement
- refactoring and bug fix
- allow comma to append in end of array 

### 0.6.6 - January 4, 2025

- bug fix

### 0.6.5 - January 4, 2025

1. adjust grammar
- remove type chaining
- remove the feature included ClassDef in ClassDef
2. refactoring scope provider
3. bug fix
4. tidy codes up

### 0.6.4 - December 30, 2024

- refactoring grammar and logic
- fixed bugs

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
