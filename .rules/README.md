# Reglas de Desarrollo - Booking Platform API

Este directorio contiene las reglas específicas para mantener Clean Architecture, SOLID, KISS y las mejores prácticas en el proyecto.

## 📚 Índice de Reglas

### 🎓 Enfoque del Proyecto
- **`project-approach.mdc`** - ⚠️ **MUY IMPORTANTE**: Reglas sobre comprensión, documentación y uso del modo agente

### 🗺️ Roadmap y Alcance
- **`roadmap.mdc`** - Referencias al roadmap del proyecto y verificación de alcance del MVP

### 🏗️ Arquitectura
- **`folder-structure.mdc`** - Estructura detallada de carpetas y ubicación de archivos
- **`clean-architecture.mdc`** - Principios y reglas de Clean Architecture
- **`dependencies.mdc`** - Reglas de dependencias entre capas

### 🎯 Principios de Diseño
- **`solid-principles.mdc`** - Aplicación de los principios SOLID
- **`kiss-principle.mdc`** - Principio KISS y evitar over-engineering

### 📝 Código y Convenciones
- **`code-conventions.mdc`** - Nomenclatura, formato y convenciones de código

### 🔧 Implementación
- **`dependency-injection.mdc`** - Configuración y uso de inyección de dependencias
- **`strategy-pattern.mdc`** - Implementación del Strategy Pattern para notificaciones
- **`testing.mdc`** - Reglas y convenciones de testing

### ⚠️ Buenas Prácticas
- **`anti-patterns.mdc`** - Anti-patrones comunes a evitar
- **`pre-commit-checklist.mdc`** - Checklist obligatorio antes de cada commit

## 🚀 Uso Rápido

### ⚠️ PRIMERO: Leer esto
1. **Leer `project-approach.mdc`** - Reglas fundamentales sobre el enfoque del proyecto

### Antes de crear un archivo
1. Consultar `folder-structure.mdc` para la ubicación correcta
2. Verificar `dependencies.mdc` para las dependencias permitidas
3. Asegurar comprensión completa (ver `project-approach.mdc`)

### Antes de hacer commit
1. Revisar `pre-commit-checklist.mdc` completamente
2. Verificar que no se violan reglas en `anti-patterns.mdc`

### Al implementar features
1. Verificar `roadmap.mdc` para confirmar que está en el alcance del MVP
2. Aplicar principios de `solid-principles.mdc` y `kiss-principle.mdc`

## 📖 Documentos Relacionados

Estas reglas complementan los siguientes documentos en la raíz del proyecto:
- `folder_structure.md` - Estructura visual de carpetas
- `proyect_requirements.md` - Requerimientos funcionales y técnicos
- `technical_checklist.md` - Roadmap de fases de desarrollo

## 🔍 Búsqueda Rápida

**¿Cómo debo trabajar en este proyecto?** → `project-approach.mdc` ⚠️ **LEER PRIMERO**
**¿Dónde va mi archivo?** → `folder-structure.mdc`
**¿Puedo importar de aquí?** → `dependencies.mdc`
**¿Sigue SOLID?** → `solid-principles.mdc`
**¿Es muy complejo?** → `kiss-principle.mdc`
**¿Está en el MVP?** → `roadmap.mdc`
**¿Sigue convenciones?** → `code-conventions.mdc`
**¿Es un anti-patrón?** → `anti-patterns.mdc`
