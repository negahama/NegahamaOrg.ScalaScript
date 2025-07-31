# Changelog

All notable changes to this project will be documented in this file.

## 🔗 Release Notes

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

### 0.6.11 - April 8, 2025

- bug fix and append extra information to error message for debuging

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
