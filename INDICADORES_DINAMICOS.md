# Indicadores Financieros Dinámicos

## 🎯 Transformación Realizada

Los **4 cards de "Indicadores Financieros"** han sido convertidos de **valores estáticos** a **valores dinámicos** que se calculan en tiempo real basándose en los datos del equipo almacenados en IndexedDB.

---

## 📊 Cards Actualizados

### Antes (Estático) vs Ahora (Dinámico)

| Card | Antes (Estático) | Ahora (Dinámico) | Fuente de Datos |
|------|------------------|------------------|-----------------|
| **1. Costo Total** | USD 2,922,993 (fijo) | `calculatedTotals.costoTotal` | Suma de `costoMensual × mesesEnProyecto` de miembros incluidos |
| **2. Precio PJ + 7%** | USD 4,546,430 (fijo) | `calculatedTotals.ingresoTotal` | Suma de `ingresoMensual × mesesEnProyecto` de miembros incluidos |
| **3. Margen** | 35.71% (fijo) | `calculatedTotals.margen` | `((ingresoTotal - costoTotal) / ingresoTotal) × 100` |
| **4. Equipo** | 43 (fijo) | `calculatedTotals.count` | Cantidad de miembros con `incluido: true` |

---

## 🔄 Cálculo Dinámico en Tiempo Real

### Función Principal: `calculatedTotals`

```javascript
const calculatedTotals = useMemo(() => {
  const included = teamData.filter(m => m.incluido);
  const costoMensual = included.reduce((sum, m) => sum + m.costoMensual, 0);
  const ingresoMensual = included.reduce((sum, m) => sum + m.ingresoMensual, 0);
  
  // Calcular totales usando los meses individuales de cada miembro
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
    count: included.length,
    costoMensual,
    ingresoMensual,
    costoTotal,
    ingresoTotal,
    margen,
    utilidad,
  };
}, [teamData]);
```

### Características del Cálculo

✅ **Reactivo**: Se actualiza automáticamente cuando cambian los datos  
✅ **Optimizado**: Usa `useMemo` para evitar recálculos innecesarios  
✅ **Flexible**: Respeta los meses individuales de cada miembro  
✅ **Filtrado**: Solo incluye miembros con `incluido: true`  

---

## 🎨 Visualización de los Cards

### Card 1: Costo Total (Morado)

```jsx
<div className="summary-card" style={{ borderLeftColor: '#7B3FE4' }}>
  <div className="label">Costo Total</div>
  <div className="value" style={{ color: '#7B3FE4' }}>
    {formatUSD(Math.round(calculatedTotals.costoTotal))}
  </div>
  <div className="sub">
    {formatCOP(Math.round(calculatedTotals.costoTotal * TRM))} COP
  </div>
  <div className="sub" style={{ fontSize: '0.7rem', marginTop: 4 }}>
    {calculatedTotals.count} miembros × duración variable
  </div>
</div>
```

**Muestra**:
- Costo total calculado en USD
- Conversión a COP (TRM: 3700)
- Cantidad de miembros incluidos

### Card 2: Precio PJ + Contingencia 7% (Verde)

```jsx
<div className="summary-card green">
  <div className="label">Precio PJ + Contingencia 7%</div>
  <div className="value">
    {formatUSD(Math.round(calculatedTotals.ingresoTotal))}
  </div>
  <div className="sub">Ingreso calculado del equipo seleccionado</div>
  <div className="sub" style={{ fontSize: '0.7rem', marginTop: 4 }}>
    Base: {formatUSD(Math.round(calculatedTotals.ingresoTotal / 1.07))} + 7%
  </div>
</div>
```

**Muestra**:
- Ingreso total calculado
- Desglose: base + 7% contingencia
- Descripción del cálculo

### Card 3: Margen Calculado (Azul/Dinámico)

```jsx
<div className="summary-card blue">
  <div className="label">Margen Calculado</div>
  <div className="value" style={{ 
    color: calculatedTotals.margen >= 30 ? '#22c55e' : 
           calculatedTotals.margen >= 20 ? '#3b82f6' : 
           calculatedTotals.margen >= 10 ? '#f59e0b' : '#ef4444'
  }}>
    {calculatedTotals.margen.toFixed(1)}%
  </div>
  <div className="sub">Utilidad: {formatUSD(Math.round(calculatedTotals.utilidad))}</div>
  <div className="sub" style={{ fontSize: '0.7rem', marginTop: 4 }}>
    {calculatedTotals.margen >= 30 ? 'Excelente rentabilidad' : 
     calculatedTotals.margen >= 20 ? 'Buena rentabilidad' : 
     calculatedTotals.margen >= 10 ? 'Rentabilidad aceptable' : 'Revisar costos'}
  </div>
</div>
```

**Características especiales**:
- **Color dinámico** según el margen:
  - Verde (≥30%): Excelente
  - Azul (≥20%): Buena
  - Naranja (≥10%): Aceptable
  - Rojo (<10%): Revisar
- Muestra utilidad total
- Mensaje descriptivo del estado

### Card 4: Equipo (Ámbar)

```jsx
<div className="summary-card amber">
  <div className="label">Equipo</div>
  <div className="value">{calculatedTotals.count}</div>
  <div className="sub">miembros activos</div>
  <div className="sub" style={{ fontSize: '0.7rem', marginTop: 4 }}>
    de {teamData.length} totales
  </div>
</div>
```

**Muestra**:
- Cantidad de miembros incluidos
- Total de miembros en la base de datos
- Proporción incluidos/totales

---

## 📊 Nueva Tabla de Comparación

Se agregó una **tabla comparativa** que muestra las diferencias entre el presupuesto original (Excel) y los valores calculados dinámicamente:

### Columnas de la Tabla

1. **Concepto**: Qué se está comparando
2. **Presupuesto Original**: Valor del Excel (estático)
3. **Calculado Actual**: Valor dinámico actual
4. **Diferencia**: Diferencia absoluta en USD
5. **Variación %**: Porcentaje de cambio

### Filas Comparadas

| Concepto | Descripción |
|----------|-------------|
| **Costo Total** | Compara costo con contingencia vs calculado |
| **Ingreso Total** | Compara precio PJ+7% vs calculado |
| **Margen de Rentabilidad** | Compara 35.7% vs margen calculado |
| **Utilidad Total** | Compara utilidad presupuestada vs calculada |
| **Tamaño del Equipo** | Compara 43 vs miembros incluidos |

### Colores de Variación

- 🟢 **Verde**: Variación favorable (menor costo, mayor ingreso, mejor margen)
- 🔴 **Rojo**: Variación desfavorable (mayor costo, menor ingreso, peor margen)

---

## 🎯 Casos de Uso

### Caso 1: Análisis de Escenarios

**Escenario**: ¿Qué pasa si excluimos 5 desarrolladores temporales?

**Pasos**:
1. Desmarcar checkbox de 5 desarrolladores
2. Los 4 cards se actualizan automáticamente
3. Ver nueva rentabilidad en tiempo real
4. Comparar con presupuesto original en la tabla

**Resultado**: Impacto inmediato visible en costos, ingresos y margen

### Caso 2: Ajuste de Duración

**Escenario**: Reducir duración de 10 miembros de 22 a 18 meses

**Pasos**:
1. Seleccionar 10 miembros
2. Edición masiva → Meses en Proyecto → 18
3. Cards se actualizan con nuevos totales
4. Ver ahorro en costo total

**Resultado**: Reducción de costos visible inmediatamente

### Caso 3: Optimización de Margen

**Escenario**: Encontrar configuración óptima para margen >30%

**Pasos**:
1. Ajustar costos mensuales de algunos miembros
2. Observar cambio de color en Card 3 (Margen)
3. Cuando sea verde (≥30%), configuración óptima encontrada
4. Exportar datos para documentar

**Resultado**: Configuración óptima identificada visualmente

### Caso 4: Comparación con Presupuesto

**Escenario**: Verificar si estamos dentro del presupuesto

**Pasos**:
1. Ver tabla de comparación
2. Revisar columna "Diferencia"
3. Si costo calculado < presupuesto original → ✅ Dentro del presupuesto
4. Si costo calculado > presupuesto original → ⚠️ Revisar

**Resultado**: Visibilidad clara del estado presupuestario

---

## 🔧 Implementación Técnica

### Archivos Modificados

1. **`src/components/tabs/TabCostosRentabilidad.jsx`**
   - Actualizado sección "RESUMEN EJECUTIVO — 4 Cards"
   - Cambiado de valores estáticos (`FINANCIAL_DATA`) a dinámicos (`calculatedTotals`)
   - Agregada tabla de comparación
   - Agregados colores dinámicos según valores

### Dependencias

- `calculatedTotals`: useMemo que calcula totales en tiempo real
- `teamData`: Array de miembros del equipo desde IndexedDB
- `FINANCIAL_DATA`: Constante con valores originales del Excel (para comparación)
- `TRM`: Tasa de cambio COP/USD (3700)

### Performance

- **Optimizado con `useMemo`**: Solo recalcula cuando `teamData` cambia
- **Cálculo rápido**: O(n) donde n = cantidad de miembros
- **Sin impacto en UX**: Actualización instantánea

---

## 📈 Beneficios de la Implementación Dinámica

### 1. **Visibilidad en Tiempo Real**
- Los cambios se reflejan inmediatamente
- No hay necesidad de recargar la página
- Feedback visual instantáneo

### 2. **Análisis de Escenarios**
- Probar diferentes configuraciones fácilmente
- Ver impacto de decisiones al instante
- Comparar múltiples opciones rápidamente

### 3. **Precisión**
- Cálculos basados en datos reales actuales
- No hay desfase entre datos y visualización
- Elimina errores de sincronización

### 4. **Flexibilidad**
- Cada miembro puede tener duración diferente
- Incluir/excluir miembros selectivamente
- Ajustar costos e ingresos individualmente

### 5. **Trazabilidad**
- Tabla de comparación muestra diferencias
- Fácil identificar desviaciones del presupuesto
- Documentación clara de cambios

---

## ⚠️ Consideraciones Importantes

### 1. Valores de Referencia

Los valores originales del Excel (`FINANCIAL_DATA`) se mantienen como **referencia** para:
- Comparación con presupuesto original
- Análisis de desviaciones
- Documentación histórica

### 2. Actualización Automática

Los cards se actualizan automáticamente cuando:
- Se marca/desmarca un miembro (checkbox "incluido")
- Se edita el costo mensual de un miembro
- Se edita el ingreso mensual de un miembro
- Se cambia la cantidad de meses de un miembro
- Se agrega o elimina un miembro

### 3. Validación de Datos

El sistema valida que:
- `costoMensual` y `ingresoMensual` sean números positivos
- `mesesEnProyecto` esté entre 1 y 60
- Los cálculos no produzcan NaN o Infinity

### 4. Formato de Visualización

- **USD**: Formato con separadores de miles (ej: USD 2,922,993)
- **COP**: Conversión automática con TRM 3700
- **Porcentajes**: 1 decimal de precisión (ej: 35.7%)
- **Colores**: Semáforo visual para interpretación rápida

---

## 🎓 Resumen de Cambios

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Fuente de datos** | Constantes estáticas | Cálculo dinámico desde IndexedDB |
| **Actualización** | Manual (editar código) | Automática en tiempo real |
| **Flexibilidad** | Valores fijos | Valores ajustables por usuario |
| **Precisión** | Aproximada | Exacta según datos actuales |
| **Análisis** | Limitado | Escenarios múltiples |
| **Comparación** | No disponible | Tabla comparativa incluida |
| **Feedback visual** | Estático | Dinámico con colores |

---

## 🚀 Próximas Mejoras Sugeridas

1. **Gráficos Dinámicos**
   - Gráfico de barras comparativo
   - Evolución temporal del margen
   - Distribución de costos por área

2. **Alertas Automáticas**
   - Notificar si margen < 20%
   - Alertar si costo > presupuesto
   - Avisar si equipo < mínimo requerido

3. **Exportación de Escenarios**
   - Guardar configuraciones
   - Comparar múltiples escenarios
   - Generar reportes PDF

4. **Histórico de Cambios**
   - Registrar modificaciones
   - Ver evolución de indicadores
   - Auditoría de cambios

5. **Predicciones**
   - Proyección de costos futuros
   - Estimación de margen final
   - Análisis de tendencias

---

**Última actualización**: Mayo 2026  
**Versión**: 2.0.0 (Dinámico)
