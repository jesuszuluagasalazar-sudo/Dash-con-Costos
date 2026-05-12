# Cálculo del Costo Total del Proyecto

## 📊 Columna AM del Excel - Costo Total

El **Costo Total del Proyecto** se calcula automáticamente para cada miembro del equipo y corresponde exactamente a la **columna AM** del archivo Excel "Copia de Presupuesto ejecución".

---

## 🧮 Fórmula de Cálculo

```javascript
Costo Total del Proyecto = Costo Mensual × Meses en Proyecto
```

### Ejemplo Práctico

Para **Monica Restrepo** (Delivery Manager):
- **Costo Mensual**: USD 7,188
- **Meses en Proyecto**: 22 meses
- **Costo Total**: USD 7,188 × 22 = **USD 158,136**

---

## 🔧 Implementación Técnica

### Ubicación del Cálculo

El cálculo se realiza en la función `calculateMemberMetrics()` ubicada en:
```
src/utils/teamDB.js
```

### Código de Implementación

```javascript
export function calculateMemberMetrics(member, duracionMesesDefault = 22) {
  const meses = member.mesesEnProyecto || duracionMesesDefault;
  
  // Cálculo del Costo Total del Proyecto (Columna AM del Excel)
  const costoTotalProyecto = member.costoMensual * meses;
  
  return {
    ...member,
    costoTotalProyecto,
    // ... otros campos calculados
  };
}
```

### Características Importantes

1. **Cálculo Dinámico**: El valor se calcula en tiempo real cada vez que se cargan los datos
2. **No se Almacena**: No se guarda en IndexedDB, se genera al vuelo
3. **Personalizable**: Cada miembro puede tener diferente cantidad de meses
4. **Valor por Defecto**: Si no se especifica, usa 22 meses (duración del proyecto)

---

## 📋 Visualización en la Tabla

La columna "Costo Total" aparece en la tabla "Detalle Completo del Equipo" con las siguientes características:

### Ubicación
- **Posición**: Penúltima columna de la tabla (antes de "Acciones")
- **Header**: "Costo Total" con icono de ordenamiento
- **Formato**: USD con separadores de miles

### Ejemplo de Visualización

```
┌──────────────────────────────────────────────────────────┐
│ Nombre          │ Costo/Mes │ Meses │ Costo Total       │
├──────────────────────────────────────────────────────────┤
│ Monica Restrepo │ USD 7,188 │  22   │ USD 158,136       │
│ Daniela Urrego  │ USD 3,305 │  22   │ USD 72,710        │
│ Valeria Salazar │ USD 2,737 │  22   │ USD 60,214        │
└──────────────────────────────────────────────────────────┘
```

### Estilos Aplicados

```javascript
<td style={{ 
  textAlign: 'right', 
  fontFamily: 'monospace', 
  color: '#4A0099' 
}}>
  USD {person.costoTotalProyecto.toLocaleString('en-US')}
</td>
```

- **Alineación**: Derecha (para números)
- **Fuente**: Monospace (para alineación de dígitos)
- **Color**: Morado (#4A0099) - color corporativo del proyecto

---

## 🎯 Casos de Uso

### 1. Cálculo de Totales del Proyecto

El sistema suma automáticamente todos los costos totales de los miembros **incluidos** en el cálculo:

```javascript
const costoTotal = includedMembers.reduce((sum, m) => {
  const meses = m.mesesEnProyecto || 22;
  return sum + (m.costoMensual * meses);
}, 0);
```

### 2. Miembros con Diferentes Duraciones

Algunos miembros pueden estar menos tiempo en el proyecto:

**Ejemplo**:
- **Desarrollador Temporal**: 12 meses
  - Costo Mensual: USD 4,000
  - Costo Total: USD 4,000 × 12 = **USD 48,000**

- **Desarrollador Permanente**: 22 meses
  - Costo Mensual: USD 4,000
  - Costo Total: USD 4,000 × 22 = **USD 88,000**

### 3. Edición de Meses

Los usuarios pueden modificar la cantidad de meses de dos formas:

#### A. Edición Individual
1. Click en botón "Editar" del miembro
2. Modificar campo "Meses"
3. Guardar cambios
4. El Costo Total se recalcula automáticamente

#### B. Edición Masiva
1. Seleccionar múltiples miembros
2. Click en "Editar Masivo"
3. Elegir campo "Meses en Proyecto"
4. Establecer nuevo valor o aplicar fórmula
5. Todos los Costos Totales se recalculan

---

## 📊 Integración con Cálculos de Rentabilidad

El Costo Total se usa en varios cálculos del dashboard:

### 1. Panel de Resumen de Rentabilidad

```javascript
const calculatedTotals = {
  costoTotal: includedMembers.reduce((sum, m) => 
    sum + (m.costoMensual * m.mesesEnProyecto), 0
  ),
  ingresoTotal: includedMembers.reduce((sum, m) => 
    sum + (m.ingresoMensual * m.mesesEnProyecto), 0
  ),
  margen: ((ingresoTotal - costoTotal) / ingresoTotal) * 100
};
```

### 2. Comparación con Presupuesto

El sistema compara el costo total calculado con:
- **Presupuesto Base**: USD 2,657,266
- **Con Contingencia 10%**: USD 2,922,993
- **Precio PJ + 7%**: USD 4,546,430

### 3. Análisis de Escenarios

Los usuarios pueden:
- Incluir/excluir miembros del cálculo
- Ajustar meses individuales
- Ver impacto en tiempo real en el margen de rentabilidad

---

## ⚠️ Consideraciones Importantes

### 1. Actualización Automática
- Los valores se recalculan automáticamente al:
  - Cargar la página
  - Editar un miembro
  - Cambiar el checkbox de "incluido"
  - Modificar meses o costo mensual

### 2. Precisión de Datos
- Los valores provienen del Excel original
- Se mantienen en USD (sin conversión a COP en la tabla)
- Formato con separadores de miles para legibilidad

### 3. Performance
- El cálculo es muy rápido (operación simple)
- Se ejecuta para cada miembro al cargar (45 miembros)
- No afecta el rendimiento de la aplicación

### 4. Validación
- `mesesEnProyecto` debe estar entre 1 y 60
- `costoMensual` debe ser un número positivo
- El resultado siempre es un número válido

---

## 🔄 Flujo de Datos Completo

```
1. Usuario carga la página
   ↓
2. getAllTeamMembers() lee datos de IndexedDB
   ↓
3. Para cada miembro:
   calculateMemberMetrics(member)
   ↓
4. Calcula: costoTotalProyecto = costoMensual × mesesEnProyecto
   ↓
5. Retorna miembro con campos calculados
   ↓
6. Tabla muestra el Costo Total en columna AM
   ↓
7. Panel de resumen suma todos los costos totales
   ↓
8. Muestra margen de rentabilidad calculado
```

---

## 📈 Ejemplo Completo con Datos Reales

### Equipo de Alineación (10 personas)

| Nombre | Rol | Costo/Mes | Meses | Costo Total |
|--------|-----|-----------|-------|-------------|
| Monica Restrepo | Delivery Manager | USD 7,188 | 22 | **USD 158,136** |
| Daniela Urrego | Gerente de Proyecto | USD 3,305 | 22 | **USD 72,710** |
| Valeria Salazar | Gerente de Proyecto 2 | USD 2,737 | 22 | **USD 60,214** |
| Valentina Villegas | Business Consultant | USD 1,123 | 22 | **USD 24,706** |
| Davi Ospino | Business Consultant | USD 8,788 | 22 | **USD 193,336** |
| Jairo Duarte | Líder de Arquitectura | USD 7,932 | 22 | **USD 174,504** |
| Kaylee Paez | Ing. DevOps | USD 4,182 | 22 | **USD 92,004** |
| Rommy Duarte | Líder Técnico Backend | USD 5,063 | 22 | **USD 111,386** |
| Abraham Vega | Líder Técnico Backend | USD 6,216 | 22 | **USD 136,752** |
| Juan Carlos Suarez | Líder Técnico Frontend | USD 4,378 | 22 | **USD 96,316** |

**Total Equipo Alineación**: **USD 1,120,064**

---

## 🎓 Resumen

✅ **Cálculo Automático**: `costoMensual × mesesEnProyecto`  
✅ **Corresponde a**: Columna AM del Excel  
✅ **Ubicación**: Función `calculateMemberMetrics()` en `teamDB.js`  
✅ **Visualización**: Columna "Costo Total" en la tabla  
✅ **Editable**: Sí, mediante edición individual o masiva  
✅ **Actualización**: Automática en tiempo real  
✅ **Formato**: USD con separadores de miles  

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0.0
