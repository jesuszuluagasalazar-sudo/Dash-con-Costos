# Guía de IndexedDB para Gestión del Equipo

## 📋 Descripción

Los datos del equipo ahora se almacenan en **IndexedDB**, una base de datos local del navegador que permite:

- ✅ **Persistencia local**: Los datos se mantienen incluso después de cerrar el navegador
- ✅ **Edición en tiempo real**: Modifica cualquier dato del equipo directamente desde la interfaz
- ✅ **Exportación/Importación**: Guarda y restaura datos en formato JSON
- ✅ **Sin backend**: Todo funciona localmente en el navegador

## 🗄️ Estructura de Datos

Cada miembro del equipo tiene los siguientes campos:

### Campos Almacenados en IndexedDB

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | number | ID único (auto-incrementado) | 1, 2, 3... |
| `nombre` | string | Nombre completo | "Monica Restrepo" |
| `rol` | string | Rol o cargo | "Delivery Manager" |
| `seniority` | string | Nivel de experiencia | "Senior", "Advanced", "Junior", "Máster" |
| `asignacion` | number | % de asignación al proyecto | 100, 50, 75 |
| `costoMensual` | number | Costo mensual en USD | 7188 |
| `ingresoMensual` | number | Ingreso mensual en USD | 7000 |
| `area` | string | Área de trabajo | "Backend", "Frontend", "QA", etc. |
| `incluido` | boolean | Si está incluido en el cálculo | true, false |
| `mesesEnProyecto` | number | Cantidad de meses en el proyecto | 22 (default) |

### Campos Calculados Automáticamente

Estos campos **NO se almacenan** en IndexedDB, sino que se calculan dinámicamente mediante la función `calculateMemberMetrics()`:

| Campo | Fórmula | Descripción |
|-------|---------|-------------|
| `costoTotalProyecto` | `costoMensual × mesesEnProyecto` | **Costo Total del Proyecto (Columna AM del Excel)** |
| `ingresoTotalProyecto` | `ingresoMensual × mesesEnProyecto` | Ingreso total durante el proyecto |
| `margen` | `((ingresoMensual - costoMensual) / ingresoMensual) × 100` | Margen de rentabilidad en % |
| `utilidadMensual` | `ingresoMensual - costoMensual` | Utilidad mensual en USD |

#### Ejemplo de Cálculo del Costo Total

Para un desarrollador con:
- `costoMensual: 5000 USD`
- `mesesEnProyecto: 22 meses`

El **Costo Total del Proyecto** será:
```javascript
costoTotalProyecto = 5000 × 22 = 110,000 USD
```

Este valor se muestra en la columna "Costo Total" de la tabla y corresponde exactamente a la **columna AM del Excel**.

---

### Valores por Defecto

Todos los miembros del equipo tienen por defecto:
- `mesesEnProyecto: 22` (duración del proyecto: Enero 2026 - Octubre 2027)
- `incluido: true` (incluidos en el cálculo de rentabilidad)
- `asignacion: 100` (100% asignados al proyecto)

---

## 🎯 Funcionalidades Disponibles

### 1. **Seleccionar Miembros para Cálculo de Rentabilidad** ⭐ NUEVO
- Cada miembro tiene un **checkbox** en la primera columna
- **Checkbox "Marcar/Desmarcar Todos"** en el header de la tabla
  - Click para seleccionar o deseleccionar todos los miembros visibles
  - Útil para análisis rápidos de diferentes escenarios
- **Marca/desmarca** checkboxes individuales para incluir o excluir del cálculo
- Los totales se actualizan automáticamente en tiempo real
- **Panel de resumen** muestra:
  - Número de miembros incluidos
  - Costo total calculado (basado en meses individuales)
  - Ingreso total calculado (basado en meses individuales)
  - Margen de rentabilidad calculado
- Las filas excluidas se muestran con opacidad reducida (50%)
- Útil para:
  - Analizar diferentes configuraciones del equipo
  - Comparar escenarios con/sin ciertos miembros
  - Calcular rentabilidad de equipos específicos
  - Evaluar impacto de agregar/quitar recursos

### 2. **Meses en Proyecto por Miembro** ⭐ NUEVO
- Columna **"Meses"** editable para cada miembro
- Define cuántos meses estará cada persona en el proyecto (1-60 meses)
- Por defecto: 22 meses (duración total del proyecto)
- Los cálculos de costo total e ingreso total usan los meses individuales
- Útil para:
  - Modelar incorporaciones tardías al equipo
  - Planificar salidas anticipadas
  - Calcular costos de recursos temporales
  - Simular rotación de personal
- **Ejemplo**: Un desarrollador temporal que solo estará 6 meses tendrá su costo total calculado como: `costoMensual × 6`

### 3. **Ver Datos del Equipo**
- Navega a la pestaña **"Costos y Rentabilidad"**
- La tabla muestra todos los miembros con sus datos actualizados

### 4. **Agregar un Nuevo Miembro** ⭐ NUEVO
- Haz clic en el botón **"Agregar"** (verde) en la barra de herramientas
- Se abre una nueva fila en la tabla con campos editables:
  - **Checkbox**: Incluir en cálculo (marcado por defecto)
  - **Nombre**: Campo obligatorio
  - **Rol**: Campo obligatorio
  - **Seniority**: Desplegable (Máster, Senior, Advanced, Junior)
  - **% Asignación**: Por defecto 100%
  - **Meses**: Por defecto 22 meses
  - **Costo Mensual**: En USD
  - **Ingreso Mensual**: En USD
  - **Área**: Desplegable (Alineación, Backend, Frontend, etc.)
- Haz clic en **"Guardar"** para agregar el miembro
- O en **"Cancelar"** para descartar
- El nuevo miembro se guarda en IndexedDB automáticamente
- Los cálculos se actualizan en tiempo real

### 5. **Editar un Miembro**
- Haz clic en el botón **"Editar"** (ícono de lápiz) en la fila del miembro
- Modifica los campos que necesites:
  - Nombre
  - Rol
  - Seniority (desplegable)
  - % Asignación
  - **Meses en Proyecto** (1-60)
  - Costo Mensual
  - Ingreso Mensual
  - Incluido en cálculo (checkbox)
- Haz clic en **"Guardar"** para aplicar los cambios
- O en **"Cancelar"** para descartar

### 6. **Eliminar un Miembro**
- Haz clic en el botón **"Eliminar"** (ícono de basura)
- Confirma la acción en el diálogo

### 7. **Buscar Miembros**
- Usa la barra de búsqueda para filtrar por:
  - Nombre
  - Rol
  - Seniority

### 8. **Ordenar Tabla**
- Haz clic en cualquier encabezado de columna para ordenar
- Clic adicional invierte el orden (ascendente/descendente)
- Columnas ordenables: Nombre, Rol, Seniority, % Asignación, **Meses**, Costo, Ingreso, Margen, Utilidad, Costo Total

### 9. **Exportar Datos**
- Haz clic en el botón **"Exportar"** en la barra de herramientas
- Se descargará un archivo JSON con todos los datos
- Nombre del archivo: `team-data-YYYY-MM-DD.json`

### 10. **Restaurar Datos Iniciales**
- Haz clic en **"Restaurar Datos Iniciales"** (botón rojo en la parte superior)
- Confirma la acción
- Esto eliminará todos los cambios y restaurará los 45 miembros originales del Excel

## 🔧 API de IndexedDB

Si necesitas interactuar programáticamente con la base de datos, puedes usar estas funciones desde `src/utils/teamDB.js`:

### Obtener Todos los Miembros
```javascript
import { getAllTeamMembers } from '@/utils/teamDB';

const members = await getAllTeamMembers();
console.log(members);
```

### Agregar un Nuevo Miembro
```javascript
import { addTeamMember } from '@/utils/teamDB';

const newMember = {
  nombre: 'Juan Pérez',
  rol: 'Desarrollador Full Stack',
  seniority: 'Senior',
  asignacion: 100,
  costoMensual: 5000,
  ingresoMensual: 7000,
  area: 'Backend'
};

await addTeamMember(newMember);
```

### Actualizar un Miembro
```javascript
import { updateTeamMember } from '@/utils/teamDB';

const updatedMember = {
  id: 1,
  nombre: 'Monica Restrepo',
  rol: 'Delivery Manager',
  seniority: 'Senior',
  asignacion: 100,
  costoMensual: 7500, // Nuevo costo
  ingresoMensual: 8000, // Nuevo ingreso
  area: 'Alineación'
};

await updateTeamMember(updatedMember);
```

### Eliminar un Miembro
```javascript
import { deleteTeamMember } from '@/utils/teamDB';

await deleteTeamMember(1); // Elimina el miembro con ID 1
```

### Obtener Miembro por ID
```javascript
import { getTeamMemberById } from '@/utils/teamDB';

const member = await getTeamMemberById(1);
console.log(member);
```

### Buscar por Área
```javascript
import { getTeamMembersByArea } from '@/utils/teamDB';

const backendTeam = await getTeamMembersByArea('Backend');
console.log(backendTeam);
```

### Buscar por Seniority
```javascript
import { getTeamMembersBySeniority } from '@/utils/teamDB';

const seniors = await getTeamMembersBySeniority('Senior');
console.log(seniors);
```

### Calcular Métricas
```javascript
import { calculateMemberMetrics } from '@/utils/teamDB';

const member = {
  nombre: 'Test',
  costoMensual: 5000,
  ingresoMensual: 7000
};

const withMetrics = calculateMemberMetrics(member, 22); // 22 meses
console.log(withMetrics);
// {
//   ...member,
//   margen: "28.6",
//   utilidadMensual: 2000,
//   costoTotalProyecto: 110000,
//   ingresoTotalProyecto: 154000
// }
```

### Exportar a JSON
```javascript
import { exportTeamDataToJSON } from '@/utils/teamDB';

await exportTeamDataToJSON(); // Descarga automáticamente el archivo
```

### Importar desde JSON
```javascript
import { importTeamDataFromJSON } from '@/utils/teamDB';

const jsonData = [
  { nombre: 'Test 1', rol: 'Dev', ... },
  { nombre: 'Test 2', rol: 'QA', ... }
];

await importTeamDataFromJSON(jsonData);
```

### Reinicializar con Datos por Defecto
```javascript
import { initializeTeamData } from '@/utils/teamDB';

await initializeTeamData(); // Restaura los 45 miembros originales
```

## 🗂️ Estructura de la Base de Datos

- **Nombre de la DB**: `TeamManagementDB`
- **Versión**: 1
- **Object Store**: `teamMembers`
- **Key Path**: `id` (auto-incremental)

### Índices Creados:
- `nombre`: Para búsquedas por nombre
- `rol`: Para búsquedas por rol
- `seniority`: Para búsquedas por nivel
- `area`: Para búsquedas por área

## 🔍 Inspeccionar la Base de Datos

### Chrome/Edge DevTools:
1. Abre DevTools (F12)
2. Ve a la pestaña **"Application"**
3. En el panel izquierdo, expande **"IndexedDB"**
4. Busca **"TeamManagementDB"**
5. Expande y haz clic en **"teamMembers"** para ver todos los registros

### Firefox DevTools:
1. Abre DevTools (F12)
2. Ve a la pestaña **"Storage"**
3. Expande **"Indexed DB"**
4. Busca **"TeamManagementDB"**

## 📊 Datos Iniciales

La base de datos se inicializa automáticamente con **45 miembros del equipo** distribuidos en:

- **Alineación Funcional y Técnica**: 10 personas
- **UX/UI**: 3 personas
- **Arquitectura**: 3 personas
- **Backend**: 6 personas
- **Frontend**: 6 personas
- **QA**: 4 personas
- **Persona Jurídica (PJ)**: 13 personas
  - 2 Arquitectos PJ
  - 5 Frontend PJ
  - 6 Backend PJ

## ⚠️ Consideraciones Importantes

1. **Datos Locales**: Los datos se almacenan en el navegador del usuario. Si cambias de navegador o limpias los datos del navegador, perderás los cambios.

2. **Backup Recomendado**: Usa la función de exportar regularmente para tener un respaldo de tus datos.

3. **Sincronización**: No hay sincronización entre dispositivos. Cada navegador tiene su propia copia de los datos.

4. **Límites de Almacenamiento**: IndexedDB tiene límites de almacenamiento según el navegador (generalmente varios GB), más que suficiente para este caso de uso.

5. **Compatibilidad**: IndexedDB es compatible con todos los navegadores modernos (Chrome, Firefox, Safari, Edge).

## 🚀 Próximas Mejoras Posibles

- [ ] Agregar función para importar desde archivo JSON
- [ ] Agregar función para agregar nuevos miembros desde la UI
- [ ] Implementar historial de cambios (audit log)
- [ ] Agregar validaciones de datos más robustas
- [ ] Implementar sincronización con backend (opcional)
- [ ] Agregar filtros avanzados por múltiples criterios
- [ ] Exportar a Excel/CSV además de JSON

## 📝 Notas Técnicas

- La base de datos se inicializa automáticamente la primera vez que se accede
- Si no hay datos, se cargan automáticamente los 45 miembros iniciales
- Los cálculos de margen, utilidad y totales se realizan en tiempo real
- La duración del proyecto está configurada en 22 meses (Enero 2026 - Octubre 2027)

---

**Última actualización**: Mayo 2026
