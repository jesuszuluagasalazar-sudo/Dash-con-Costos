# Guía de Edición Masiva - Dashboard Jira

## ✅ Funcionalidad Completada

La funcionalidad de edición masiva ha sido completamente implementada en la tabla "Detalle Completo del Equipo".

---

## 🎯 Características Implementadas

### 1. **Selección de Miembros**
- **Checkbox de Selección Individual** (naranja): Primera columna de la tabla
  - Color de acento: `#f59e0b` (naranja)
  - Permite seleccionar miembros específicos para edición masiva
  - Independiente del checkbox de "incluido"

- **Checkbox "Seleccionar Todos"**: En el encabezado de la tabla
  - Selecciona/deselecciona todos los miembros filtrados
  - Se sincroniza automáticamente con las selecciones individuales

- **Contador de Selección**: Muestra cuántos miembros están seleccionados
  - Aparece en la barra de herramientas cuando hay selecciones
  - Formato: "X seleccionado(s)"

### 2. **Botón de Edición Masiva**
- **Ubicación**: Barra de herramientas superior
- **Color**: Naranja (`#f59e0b`)
- **Comportamiento**: 
  - Solo aparece cuando hay miembros seleccionados
  - Abre el modal de edición masiva
  - Muestra icono de edición y texto "Editar Masivo"

### 3. **Modal de Edición Masiva**
El modal ofrece dos modos de edición:

#### **Modo 1: Establecer Valor**
Permite establecer un valor específico para un campo seleccionado:

**Campos disponibles:**
- **Seniority**: Máster, Senior, Advanced, Junior
- **Área**: Alineación, UX/UI, Arquitectura, Backend, Frontend, QA, etc.
- **% Asignación**: Valor numérico (0-100)
- **Meses en Proyecto**: Valor numérico (1-60)
- **Costo Mensual**: Valor numérico en USD
- **Ingreso Mensual**: Valor numérico en USD
- **Incluido en Cálculo**: Sí/No

**Ejemplo de uso:**
1. Seleccionar 5 desarrolladores
2. Elegir campo "Seniority"
3. Establecer valor "Senior"
4. Aplicar cambios → Los 5 desarrolladores ahora son Senior

#### **Modo 2: Aplicar Fórmula**
Permite aplicar operaciones matemáticas a campos numéricos:

**Operaciones disponibles:**
- **Aumentar en %**: Incrementa el valor actual por un porcentaje
  - Ejemplo: Aumentar 10% → valor actual × 1.10
- **Disminuir en %**: Reduce el valor actual por un porcentaje
  - Ejemplo: Disminuir 15% → valor actual × 0.85
- **Multiplicar por**: Multiplica el valor actual por un factor
  - Ejemplo: Multiplicar por 1.5 → valor actual × 1.5

**Campos numéricos aplicables:**
- Costo Mensual
- Ingreso Mensual
- % Asignación
- Meses en Proyecto

**Ejemplo de uso:**
1. Seleccionar 10 miembros del equipo Backend
2. Elegir campo "Costo Mensual"
3. Seleccionar operación "Aumentar en %"
4. Ingresar 12%
5. Aplicar cambios → Todos los costos aumentan un 12%

---

## 🎨 Diseño Visual

### Colores Utilizados
- **Naranja (`#f59e0b`)**: Selección y edición masiva
  - Checkbox de selección
  - Botón "Editar Masivo"
  - Contador de seleccionados
  
- **Morado (`#7B3FE4`)**: Checkbox de "incluido" (cálculo de rentabilidad)
  - Mantiene la distinción visual entre ambas funcionalidades

- **Verde (`#22c55e`)**: Agregar nuevo miembro
  - Botón "Agregar"
  - Fila de nuevo miembro

### Estructura de la Tabla
```
┌─────────────────────────────────────────────────────────────┐
│ [☑ Sel.All] [☑ Inc.All] Nombre  Rol  Seniority  ...        │
├─────────────────────────────────────────────────────────────┤
│ [☐ naranja] [☑ morado]  Juan    Dev  Senior     ...        │
│ [☑ naranja] [☑ morado]  María   QA   Advanced   ...        │
│ [☑ naranja] [☐ morado]  Pedro   Arq  Máster     ...        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### Archivos Modificados

1. **`src/components/tabs/TabCostosRentabilidad.jsx`**
   - Agregado estado `selectedMembers` para tracking de selección
   - Agregado estado `isBulkEditOpen` para control del modal
   - Implementadas funciones:
     - `handleToggleSelection(personId)`: Toggle selección individual
     - `handleSelectAll()`: Toggle selección de todos
     - `handleBulkEdit()`: Abrir modal de edición
     - `handleBulkSave(updates, editMode)`: Aplicar cambios masivos
   - Agregada columna de selección en la tabla
   - Agregado botón "Editar Masivo" en toolbar
   - Agregado contador de seleccionados
   - Integrado componente `<BulkEditModal>`

2. **`src/components/modals/BulkEditModal.jsx`**
   - Componente modal completo con dos modos de edición
   - Validación de campos según tipo
   - UI intuitiva con iconos y colores
   - Feedback visual de operaciones

3. **`src/utils/teamDB.js`**
   - Función `updateTeamMember()` utilizada para guardar cambios
   - Soporte para actualizaciones masivas con `Promise.all()`

### Flujo de Datos

```
Usuario selecciona miembros
    ↓
selectedMembers[] se actualiza
    ↓
Botón "Editar Masivo" aparece
    ↓
Usuario hace clic → Modal se abre
    ↓
Usuario configura cambios en modal
    ↓
handleBulkSave() procesa los cambios
    ↓
updateTeamMember() actualiza IndexedDB
    ↓
onRefresh() recarga datos
    ↓
Tabla se actualiza con nuevos valores
```

---

## 📋 Casos de Uso Comunes

### Caso 1: Ajuste Salarial Anual
**Escenario**: Aumentar el costo mensual de todos los desarrolladores Senior en un 8%

**Pasos**:
1. Filtrar por "Senior" en la búsqueda
2. Hacer clic en "Seleccionar Todos"
3. Clic en "Editar Masivo"
4. Modo: "Aplicar Fórmula"
5. Campo: "Costo Mensual"
6. Operación: "Aumentar en %"
7. Porcentaje: 8
8. Aplicar Cambios

### Caso 2: Reasignación de Área
**Escenario**: Mover 5 desarrolladores del área Backend a Backend PJ

**Pasos**:
1. Seleccionar manualmente los 5 desarrolladores
2. Clic en "Editar Masivo"
3. Modo: "Establecer Valor"
4. Campo: "Área"
5. Nuevo Valor: "Backend PJ"
6. Aplicar Cambios

### Caso 3: Ajuste de Duración
**Escenario**: Cambiar la duración de 10 miembros temporales a 12 meses

**Pasos**:
1. Seleccionar los 10 miembros temporales
2. Clic en "Editar Masivo"
3. Modo: "Establecer Valor"
4. Campo: "Meses en Proyecto"
5. Nuevo Valor: 12
6. Aplicar Cambios

### Caso 4: Exclusión Masiva del Cálculo
**Escenario**: Excluir todos los miembros PJ del cálculo de rentabilidad

**Pasos**:
1. Filtrar por "PJ" en la búsqueda
2. Hacer clic en "Seleccionar Todos"
3. Clic en "Editar Masivo"
4. Modo: "Establecer Valor"
5. Campo: "Incluido en Cálculo"
6. Nuevo Valor: "No (Excluido)"
7. Aplicar Cambios

---

## ⚠️ Consideraciones Importantes

### Validaciones
- El modal valida que al menos un miembro esté seleccionado
- Los campos numéricos solo aceptan números válidos
- Los porcentajes deben ser positivos
- Los factores de multiplicación deben ser mayores a 0

### Reversibilidad
- Todos los cambios se guardan inmediatamente en IndexedDB
- No hay función "Deshacer" automática
- Se recomienda exportar datos antes de cambios masivos importantes
- Usar el botón "Restaurar Datos Iniciales" para volver al estado original

### Performance
- Las actualizaciones masivas usan `Promise.all()` para paralelizar
- La tabla se refresca automáticamente después de los cambios
- Los cálculos de totales se actualizan en tiempo real

### Seguridad
- Los cambios solo afectan a los miembros seleccionados
- El modal muestra claramente cuántos miembros serán afectados
- Confirmación visual antes de aplicar cambios

---

## 🎯 Próximas Mejoras Sugeridas

1. **Historial de Cambios**
   - Registrar todas las ediciones masivas
   - Permitir deshacer cambios recientes

2. **Plantillas de Edición**
   - Guardar configuraciones de edición frecuentes
   - Aplicar plantillas con un clic

3. **Previsualización**
   - Mostrar cómo quedarán los datos antes de aplicar
   - Tabla de comparación antes/después

4. **Filtros Avanzados**
   - Selección por múltiples criterios
   - Guardar filtros personalizados

5. **Exportar Selección**
   - Exportar solo los miembros seleccionados
   - Formato CSV/Excel

---

## 📞 Soporte

Para cualquier duda o problema con la funcionalidad de edición masiva:
- Revisar esta guía
- Consultar `INDEXEDDB_GUIDE.md` para detalles de almacenamiento
- Verificar la consola del navegador para errores

---

**Última actualización**: Mayo 2026
**Versión**: 1.0.0
