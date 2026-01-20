# Changelog

All notable changes to this project will be documented in this file.

## 🔗 Release Notes

### 0.7.13 - January 21, 2026

- support `return nil` at function with union return type included nil type

### 0.7.12 - December 28, 2025

- support the import statement without the braket
- treat the match expression as the value such like `var x = a match { ... }`

### 0.7.11 - December 24, 2025

- Expand for type system, especially array type
  so it's possible to use array of (union, function) such like `(string | number)[]`, `(() -> void)[]` now

### 0.7.10 - December 19, 2025

- Fixed incorrect object assignment behavior when assigning to any type properties

### 0.7.9 - December 15, 2025

- append `Date`, `process`, `performance` classes and some timer functions in library
- append the `type` keyword at `import` statement
- remove the new line in front of the bypass statement `%%`
- remove the space at `case: ` in match-case statement
- hide the error messages

### 0.7.8 - November 25, 2025

- changed the type of flatMap

### 0.7.5 - July 31, 2025

- ROLL BACK to 0.7.3 : cause out of heap memory

### 0.7.4 - July 31, 2025

- add new features to grammar

### 0.7.3 - July 30, 2025

- fixed the bug on version 0.7.2

### 0.7.2 - July 30, 2025

- Changed the logical operator to be available for all types
- fixed the bug: `extends` at interface don't be transpiled properly

### 0.7.1 - July 30, 2025

- change the try-catch statement like Scala to one like JavaScript
- support static methods of Array such like Array.from

### 0.7.0 - July 19, 2025

- Langium Version Upgrade (3.3.0 -> 3.5.0)
- append `readonly` variable modifier
- correct the bugs about Map class
- correct the bug with an incorrect close parentheses indent in the class definition
