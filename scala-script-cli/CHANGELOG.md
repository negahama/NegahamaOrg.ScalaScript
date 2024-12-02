# Changelog

All notable changes to this project will be documented in this file.

## 🔗 Release Notes

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
