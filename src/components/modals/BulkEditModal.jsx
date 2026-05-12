import { useState } from 'react';
import { Icon } from '../ui/Icon';

export function BulkEditModal({ isOpen, onClose, selectedMembers, onSave }) {
  const [editMode, setEditMode] = useState('field'); // 'field' o 'formula'
  const [selectedField, setSelectedField] = useState('seniority');
  const [newValue, setNewValue] = useState('');
  const [operation, setOperation] = useState('set'); // 'set', 'add', 'multiply'
  const [percentage, setPercentage] = useState(0);

  if (!isOpen) return null;

  const handleSave = () => {
    const updates = {};
    
    if (editMode === 'field') {
      // Edición por campo específico
      if (selectedField === 'seniority' || selectedField === 'area') {
        updates[selectedField] = newValue;
      } else if (selectedField === 'asignacion' || selectedField === 'mesesEnProyecto') {
        updates[selectedField] = parseInt(newValue) || 0;
      } else if (selectedField === 'costoMensual' || selectedField === 'ingresoMensual') {
        updates[selectedField] = parseFloat(newValue) || 0;
      } else if (selectedField === 'incluido') {
        updates[selectedField] = newValue === 'true';
      }
    } else {
      // Edición por fórmula/operación
      if (operation === 'increase') {
        updates.operation = 'increase';
        updates.field = selectedField;
        updates.percentage = percentage;
      } else if (operation === 'decrease') {
        updates.operation = 'decrease';
        updates.field = selectedField;
        updates.percentage = percentage;
      } else if (operation === 'multiply') {
        updates.operation = 'multiply';
        updates.field = selectedField;
        updates.factor = parseFloat(newValue) || 1;
      }
    }

    onSave(updates, editMode);
  };

  const handleClose = () => {
    setEditMode('field');
    setSelectedField('seniority');
    setNewValue('');
    setOperation('set');
    setPercentage(0);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '32px',
        maxWidth: 600,
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="edit_note" size={28} color="#7B3FE4" />
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#4A0099' }}>
              Edición Masiva
            </h2>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
            }}
          >
            <Icon name="close" size={24} color="#666" />
          </button>
        </div>

        {/* Info */}
        <div style={{
          background: '#f3e8ff',
          border: '1px solid #7B3FE4',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Icon name="info" size={20} color="#7B3FE4" />
          <span style={{ fontSize: '0.9rem', color: '#4A0099' }}>
            <strong>{selectedMembers.length}</strong> miembro{selectedMembers.length !== 1 ? 's' : ''} seleccionado{selectedMembers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Modo de edición */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Modo de Edición
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setEditMode('field')}
              style={{
                flex: 1,
                padding: '12px',
                background: editMode === 'field' ? '#7B3FE4' : '#f3f4f6',
                color: editMode === 'field' ? '#fff' : '#666',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Icon name="edit" size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Establecer Valor
            </button>
            <button
              onClick={() => setEditMode('formula')}
              style={{
                flex: 1,
                padding: '12px',
                background: editMode === 'formula' ? '#7B3FE4' : '#f3f4f6',
                color: editMode === 'formula' ? '#fff' : '#666',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Icon name="calculate" size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Aplicar Fórmula
            </button>
          </div>
        </div>

        {/* Campo a modificar */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Campo a Modificar
          </label>
          <select
            value={selectedField}
            onChange={(e) => {
              setSelectedField(e.target.value);
              setNewValue('');
            }}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              outline: 'none',
            }}
          >
            <option value="seniority">Seniority</option>
            <option value="area">Área</option>
            <option value="asignacion">% Asignación</option>
            <option value="mesesEnProyecto">Meses en Proyecto</option>
            <option value="costoMensual">Costo Mensual</option>
            <option value="ingresoMensual">Ingreso Mensual</option>
            <option value="incluido">Incluido en Cálculo</option>
          </select>
        </div>

        {/* Modo: Establecer Valor */}
        {editMode === 'field' && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>
              Nuevo Valor
            </label>
            
            {selectedField === 'seniority' && (
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="Máster">Máster</option>
                <option value="Senior">Senior</option>
                <option value="Advanced">Advanced</option>
                <option value="Junior">Junior</option>
              </select>
            )}

            {selectedField === 'area' && (
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="Alineación">Alineación</option>
                <option value="UX/UI">UX/UI</option>
                <option value="Arquitectura">Arquitectura</option>
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="QA">QA</option>
                <option value="Arquitectura PJ">Arquitectura PJ</option>
                <option value="Backend PJ">Backend PJ</option>
                <option value="Frontend PJ">Frontend PJ</option>
              </select>
            )}

            {selectedField === 'incluido' && (
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="true">Sí (Incluido)</option>
                <option value="false">No (Excluido)</option>
              </select>
            )}

            {(selectedField === 'asignacion' || selectedField === 'mesesEnProyecto' || 
              selectedField === 'costoMensual' || selectedField === 'ingresoMensual') && (
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Nuevo ${selectedField === 'asignacion' ? '% asignación' : 
                             selectedField === 'mesesEnProyecto' ? 'meses' : 'valor'}`}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                }}
              />
            )}
          </div>
        )}

        {/* Modo: Aplicar Fórmula */}
        {editMode === 'formula' && (selectedField === 'costoMensual' || selectedField === 'ingresoMensual' || 
                                     selectedField === 'asignacion' || selectedField === 'mesesEnProyecto') && (
          <>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>
                Operación
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                }}
              >
                <option value="increase">Aumentar en %</option>
                <option value="decrease">Disminuir en %</option>
                <option value="multiply">Multiplicar por</option>
              </select>
            </div>

            {(operation === 'increase' || operation === 'decrease') && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>
                  Porcentaje
                </label>
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 10 para 10%"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.95rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 6 }}>
                  {operation === 'increase' ? 'Aumentará' : 'Disminuirá'} el valor actual en {percentage}%
                </div>
              </div>
            )}

            {operation === 'multiply' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>
                  Factor de Multiplicación
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Ej: 1.5 para multiplicar por 1.5"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.95rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 6 }}>
                  Multiplicará el valor actual por {newValue || '1'}
                </div>
              </div>
            )}
          </>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#666',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: '#7B3FE4',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
