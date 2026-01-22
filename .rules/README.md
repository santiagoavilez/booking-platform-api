# Development Rules - Booking Platform API

This directory contains specific rules to maintain Clean Architecture, SOLID, KISS and best practices in the project.

## 📚 Rules Index

### 🎓 Project Approach
- **`project-approach.mdc`** - ⚠️ **VERY IMPORTANT**: Rules about understanding, documentation and agent mode usage

### 🗺️ Roadmap and Scope
- **`roadmap.mdc`** - References to project roadmap and MVP scope verification

### 🏗️ Architecture
- **`folder-structure.mdc`** - Detailed folder structure and file location
- **`clean-architecture.mdc`** - Clean Architecture principles and rules
- **`dependencies.mdc`** - Dependency rules between layers

### 🎯 Design Principles
- **`solid-principles.mdc`** - Application of SOLID principles
- **`kiss-principle.mdc`** - KISS principle and avoiding over-engineering

### 📝 Code and Conventions
- **`code-conventions.mdc`** - Naming, format and code conventions

### 🔧 Implementation
- **`dependency-injection.mdc`** - Dependency injection configuration and usage
- **`strategy-pattern.mdc`** - Strategy Pattern implementation for notifications
- **`testing.mdc`** - Testing rules and conventions

### ⚠️ Best Practices
- **`anti-patterns.mdc`** - Common anti-patterns to avoid
- **`pre-commit-checklist.mdc`** - Mandatory checklist before each commit

## 🚀 Quick Usage

### ⚠️ FIRST: Read this
1. **Read `project-approach.mdc`** - Fundamental rules about project approach

### Before creating a file
1. Consult `folder-structure.mdc` for correct location
2. Verify `dependencies.mdc` for allowed dependencies
3. Ensure complete understanding (see `project-approach.mdc`)

### Before committing
1. Review `pre-commit-checklist.mdc` completely
2. Verify that rules in `anti-patterns.mdc` are not violated

### When implementing features
1. Verify `roadmap.mdc` to confirm it's within MVP scope
2. Apply principles from `solid-principles.mdc` and `kiss-principle.mdc`

## 📖 Related Documents

These rules complement the following documents in the project root:
- `folder_structure.md` - Visual folder structure
- `proyect_requirements.md` - Functional and technical requirements
- `technical_checklist.md` - Development phase roadmap

## 🔍 Quick Search

**How should I work on this project?** → `project-approach.mdc` ⚠️ **READ FIRST**
**Where does my file go?** → `folder-structure.mdc`
**Can I import from here?** → `dependencies.mdc`
**Does it follow SOLID?** → `solid-principles.mdc`
**Is it too complex?** → `kiss-principle.mdc`
**Is it in the MVP?** → `roadmap.mdc`
**Does it follow conventions?** → `code-conventions.mdc`
**Is it an anti-pattern?** → `anti-patterns.mdc`
