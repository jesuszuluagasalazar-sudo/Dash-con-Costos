# ExecutiveSummary - Conversión a Dinámico

## ✅ Transformación Completada

El componente `ExecutiveSummary.jsx` ha sido convertido de **valores estáticos** a **valores dinámicos** que se calculan en tiempo real desde IndexedDB.

---

## 🎯 Componentes Actualizados

### 1. Indicadores Financieros (4 Cards)

| Card | Antes (Estático) | Ahora (Dinámico) |
|------|------------------|------------------|
| **Costo Total** | USD 2,922,993 | `financialIndicators.costoTotal.usd` |
| **Precio PJ + 7%** | USD 4,546,430 | `financialIndicators.precioConAdenda.usd` |
| **Margen** | 35.71% | `financialIndicators.margen.percent` |
| **Equipo** | 43 | `financialIndicators.equipo.size` |

### 2. Distribución del Equipo (3 Cards)

| Card | Antes (Estático) | Ahora (Dinámico) |
|------|------------------|------------------|
| **Alineación** | 10 | `teamDistribution.alineacion` |
| **Desarrollo** | 24 | `teamDistribution.desarrollo` |
| **Soporte y Calidad** | 9 | `teamDistribution.soporte` |

---

## 🔧 Implementación Técnica

### Imports Agregados

```javascript
import { useState, useEffect } from 'react';
import { getAllTeamMembers, calculateMemberMetrics } from '../../utils/teamDB';
```

### Estados Agregados

```javascript
const [teamData, setTeamData] = useState([]);
const [loading, setLoading] = useState(true);
```

### Función de Carga de Datos

```javascript
useEffect(() => {
  loadTeamData();
}, []);

const loadTeamData = async () => {
  try {
    setLoading(true);
    const members = await getAllTeamMembers();
    const membersWithMetrics = members.map(m => calculateMemberMetrics(m, 22));
    setTeamData(membersWithMetrics);
  } catch (error) {
    console.error('Error al cargar datos del equipo:', error);
  } finally {
    setLoading(false);
  }
};
```

### Cálculo de Indicadores Financieros

```javascript
const financialIndicators = useMemo(() => {
  const included = teamData.filter(m => m.incluido);
  
  const costoMensual = included.reduce((sum, m) => sum + m.costoMensual, 0);
  const ingresoMensual = included.reduce((sum, m) => sum + m.ingresoMensual, 0);
  
  const costoTotal = included.reduce((sum, m) => {
    const meses = m.mesesEnProyecto || 22;
    return sum + (m.costoMensual * meses);
  }, 0);
  
  const ingresoTotal = included.reduce((sum, m) => {
    const meses = m.mesesEnProyecto || 22;
    return sum + (m.ingresoMensual * meses);
  }, 0);
  
  const margen = ingresoTotal > 0 ? ((ingresoTotal - costoTotal) / ingresoTotal * 100) : 0;
  const utilidad = ingresoTotal - costoTotal;
  
  return {
    costoTotal: { usd: Math.round(costoTotal), cop: Math.round(costoTotal * TRM) },
    precioConAdenda: { 
      usd: Math.round(ingresoTotal), 
      precioInicial: Math.round(ingresoTotal / 1.07), 
      contingencia7: Math.round(ingresoTotal - (ingresoTotal / 1.07))
    },
    margen: { percent: margen, utilidad: Math.round(utilidad) },
    equipo: { size: included.length, label: 'miembros activos' },
  };
}, [teamData]);
```

### Cálculo de Distribución del Equipo

```javascript
const teamDistribution = useMemo(() => {
  const included = teamData.filter(m => m.incluido);
  
  // Alineación: Alineación
  const alineacion = included.filter(m => m.area === 'Alineación').length;
  
  // Desarrollo: Backend, Frontend, Backend PJ, Frontend PJ
  const desarrollo = included.filter(m => 
    m.area === 'Backend' || 
    m.area === 'Frontend' || 
    m.area === 'Backend PJ' || 
    m.area === 'Frontend PJ'
  ).length;
  
  // Soporte y Calidad: UX/UI, Arquitectura, Arquitectura PJ, QA
  const soporte = included.filter(m => 
    m.area === 'UX/UI' || 
    m.area === 'Arquitectura' || 
    m.area === 'Arquitectura PJ' || 
    m.area === 'QA'
  ).length;
  
  return { alineacion, desarrollo, soporte };
}, [teamData]);
```

---

## 🎨 Características Visuales

### Estado de Carga

Mientras se cargan los datos, los cards muestran `'...'`:

```javascript
<div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
  {loading ? '...' : formatUSD(financialIndicators.costoTotal.usd)}
</div>
```

### Color Dinámico del Margen

El card de Margen cambia de color según el valor:

```javascript
background: financialIndicators.margen.percent >= 0 
  ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'  // Azul si positivo
  : 'linear-gradient(135deg, #dc2626, #ef4444)'  // Rojo si negativo
```

### Icono Dinámico del Margen

```javascript
<Icon 
  name={financialIndicators.margen.percent >= 0 ? "trending_up" : "trending_down"} 
  size={18} 
  color={financialIndicators.margen.percent >= 0 ? "#bae6fd" : "#fecaca"} 
/>
```

---

## 🔄 Flujo de Datos

```
1. Componente se monta
   ↓
2. useEffect ejecuta loadTeamData()
   ↓
3. getAllTeamMembers() lee desde IndexedDB
   ↓
4. calculateMemberMetrics() calcula métricas para cada miembro
   ↓
5. setTeamData() actualiza el estado
   ↓
6. useMemo recalcula financialIndicators
   ↓
7. useMemo recalcula teamDistribution
   ↓
8. Cards se renderizan con valores dinámicos
```

---

## 📊 Cálculos Realizados

### Indicadores Financieros

1. **Costo Total**
   - Suma: `costoMensual × mesesEnProyecto` de cada miembro incluido
   - Conversión a COP: `costoTotal × TRM (3700)`

2. **Precio PJ + Contingencia 7%**
   - Suma: `ingresoMensual × mesesEnProyecto` de cada miembro incluido
   - Base: `ingresoTotal / 1.07`
   - Contingencia: `ingresoTotal - base`

3. **Margen**
   - Fórmula: `((ingresoTotal - costoTotal) / ingresoTotal) × 100`
   - Utilidad: `ingresoTotal - costoTotal`

4. **Equipo**
   - Cantidad de miembros con `incluido: true`

### Distribución del Equipo

1. **Alineación Funcional y Técnica**
   - Filtro: `area === 'Alineación'`

2. **Desarrollo**
   - Filtro: `area === 'Backend' || 'Frontend' || 'Backend PJ' || 'Frontend PJ'`

3. **Soporte y Calidad**
   - Filtro: `area === 'UX/UI' || 'Arquitectura' || 'Arquitectura PJ' || 'QA'`

---

## ✨ Beneficios de la Implementación

### 1. **Sincronización Automática**
- Los cards se actualizan cuando cambian los datos en IndexedDB
- No hay desfase entre diferentes vistas del dashboard

### 2. **Precisión en Tiempo Real**
- Los valores reflejan exactamente el estado actual del equipo
- Incluye solo miembros con `incluido: true`

### 3. **Flexibilidad**
- Respeta los meses individuales de cada miembro
- Se adapta a cambios en costos e ingresos

### 4. **Consistencia**
- Usa las mismas funciones de cálculo que `TabCostosRentabilidad`
- Garantiza coherencia entre todas las vistas

### 5. **Performance Optimizado**
- Usa `useMemo` para evitar recálculos innecesarios
- Solo recalcula cuando `teamData` cambia

---

## 🎯 Casos de Uso

### Caso 1: Visualización Inicial

**Escenario**: Usuario abre el dashboard

**Flujo**:
1. ExecutiveSummary se monta
2. Muestra "..." mientras carga
3. Carga datos de IndexedDB
4. Calcula indicadores
5. Muestra valores reales

**Resultado**: Cards muestran datos actuales del equipo

### Caso 2: Cambio en Tab Costos y Rentabilidad

**Escenario**: Usuario modifica un miembro en la tabla detallada

**Flujo**:
1. Usuario edita costo mensual de un miembro
2. Datos se guardan en IndexedDB
3. ExecutiveSummary NO se actualiza automáticamente (requiere refresh)

**Nota**: Para sincronización automática entre tabs, se necesitaría implementar un sistema de eventos o context global.

### Caso 3: Exclusión de Miembros

**Escenario**: Usuario desmarca checkbox "incluido" de varios miembros

**Flujo**:
1. Miembros se marcan como `incluido: false`
2. Al recargar ExecutiveSummary, los cálculos excluyen esos miembros
3. Cards muestran nuevos totales

**Resultado**: Indicadores reflejan solo miembros incluidos

---

## ⚠️ Consideraciones Importantes

### 1. Sincronización entre Tabs

**Limitación actual**: Los cambios en `TabCostosRentabilidad` no actualizan automáticamente `ExecutiveSummary` sin recargar.

**Solución futura**: Implementar un sistema de eventos o usar React Context para sincronización en tiempo real.

### 2. Performance

- Los cálculos son rápidos (O(n) donde n = cantidad de miembros)
- `useMemo` optimiza para evitar recálculos innecesarios
- No hay impacto perceptible en la UX

### 3. Estado de Carga

- Muestra "..." mientras carga datos
- Previene mostrar valores incorrectos o undefined
- Mejora la experiencia de usuario

### 4. Manejo de Errores

- Captura errores en `loadTeamData()`
- Registra en consola para debugging
- No bloquea el renderizado del componente

---

## 🚀 Próximas Mejoras Sugeridas

### 1. **Sincronización en Tiempo Real**

Implementar un sistema de eventos para actualizar ExecutiveSummary cuando cambian datos en otros tabs:

```javascript
// En TabCostosRentabilidad
const handleSave = async () => {
  await updateTeamMember(editForm);
  window.dispatchEvent(new Event('teamDataUpdated'));
  // ...
};

// En ExecutiveSummary
useEffect(() => {
  const handleUpdate = () => loadTeamData();
  window.addEventListener('teamDataUpdated', handleUpdate);
  return () => window.removeEventListener('teamDataUpdated', handleUpdate);
}, []);
```

### 2. **Animaciones de Transición**

Animar cambios de valores para mejor feedback visual:

```javascript
import { motion } from 'framer-motion';

<motion.div
  key={financialIndicators.costoTotal.usd}
  initial={{ scale: 1.1, color: '#22c55e' }}
  animate={{ scale: 1, color: '#fff' }}
  transition={{ duration: 0.5 }}
>
  {formatUSD(financialIndicators.costoTotal.usd)}
</motion.div>
```

### 3. **Indicadores de Cambio**

Mostrar flechas de tendencia (↑/↓) comparando con valores anteriores:

```javascript
const [previousValues, setPreviousValues] = useState(null);

useEffect(() => {
  if (previousValues) {
    const change = financialIndicators.costoTotal.usd - previousValues.costoTotal.usd;
    // Mostrar indicador de cambio
  }
  setPreviousValues(financialIndicators);
}, [financialIndicators]);
```

### 4. **Tooltips Informativos**

Agregar tooltips con detalles adicionales:

```javascript
<Tooltip content="Suma de costos mensuales × meses de todos los miembros incluidos">
  <div>Costo Total</div>
</Tooltip>
```

### 5. **Exportación de Snapshot**

Permitir exportar el estado actual de los indicadores:

```javascript
const exportSnapshot = () => {
  const snapshot = {
    timestamp: new Date().toISOString(),
    financialIndicators,
    teamDistribution,
  };
  downloadJSON(snapshot, `snapshot-${Date.now()}.json`);
};
```

---

## 📁 Archivos Modificados

1. ✅ `src/components/ui/ExecutiveSummary.jsx`
   - Agregados imports de IndexedDB
   - Agregados estados `teamData` y `loading`
   - Agregada función `loadTeamData()`
   - Agregado `useMemo` para `financialIndicators`
   - Agregado `useMemo` para `teamDistribution`
   - Actualizados todos los cards para usar valores dinámicos
   - Eliminada constante `FINANCIAL_INDICATORS`

---

## 🎓 Resumen de Cambios

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Fuente de datos** | Constante estática | IndexedDB dinámico |
| **Actualización** | Manual (editar código) | Automática al cargar |
| **Costo Total** | USD 2,922,993 (fijo) | Calculado en tiempo real |
| **Precio PJ** | USD 4,546,430 (fijo) | Calculado en tiempo real |
| **Margen** | 35.71% (fijo) | Calculado en tiempo real |
| **Equipo** | 43 (fijo) | Cantidad de incluidos |
| **Distribución** | 10/24/9 (fijo) | Calculada por área |
| **Sincronización** | No aplica | Con datos de IndexedDB |
| **Estado de carga** | No | Sí (muestra "...") |

---

**Última actualización**: Mayo 2026  
**Versión**: 2.0.0 (Dinámico)  
**Componente**: `src/components/ui/ExecutiveSummary.jsx`
