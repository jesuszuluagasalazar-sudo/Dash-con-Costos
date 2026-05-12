import { useMemo, useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { 
  getAllTeamMembers, 
  updateTeamMember, 
  addTeamMember, 
  deleteTeamMember,
  calculateMemberMetrics,
  exportTeamDataToJSON,
  initializeTeamData
} from '../../utils/teamDB';
import { BulkEditModal } from '../modals/BulkEditModal';
import { AjustesMargenModal } from '../modals/AjustesMargenModal';
import { useDashboardStore } from '../../store/dashboardStore';

// Componente de tabla detallada del equipo
function TeamDetailTable({ teamData, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'margen', direction: 'desc' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [allChecked, setAllChecked] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    nombre: '',
    rol: '',
    seniority: 'Senior',
    asignacion: 100,
    costoMensual: 0,
    ingresoMensual: 0,
    area: 'Backend',
    incluido: true,
    mesesEnProyecto: 22,
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const getSeniorityColor = (seniority) => {
    const colors = {
      'Máster': '#2D0066',
      'Senior': '#7B3FE4',
      'Advanced': '#3b82f6',
      'Junior': '#a855f7',
    };
    return colors[seniority] || '#888';
  };

  const getMargenColor = (margen) => {
    const m = parseFloat(margen);
    if (m >= 30) return '#22c55e';
    if (m >= 20) return '#84cc16';
    if (m >= 10) return '#f59e0b';
    return '#ef4444';
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleEdit = (person) => {
    setEditingId(person.id);
    setEditForm({ ...person });
  };

  const handleToggleIncluido = async (person) => {
    try {
      const updated = { ...person, incluido: !person.incluido };
      await updateTeamMember(updated);
      onRefresh();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = teamData.filter(
      (person) =>
        person.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.seniority.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [teamData, searchTerm, sortConfig]);

  const handleToggleAll = async () => {
    try {
      const newState = !allChecked;
      setAllChecked(newState);
      
      // Actualizar todos los miembros filtrados
      const updates = filteredAndSorted.map(person => 
        updateTeamMember({ ...person, incluido: newState })
      );
      
      await Promise.all(updates);
      onRefresh();
    } catch (error) {
      console.error('Error al actualizar todos:', error);
    }
  };

  // Actualizar estado de allChecked cuando cambian los datos
  useEffect(() => {
    const allIncluded = filteredAndSorted.every(p => p.incluido);
    setAllChecked(allIncluded);
  }, [filteredAndSorted]);

  const handleSave = async () => {
    try {
      await updateTeamMember(editForm);
      setEditingId(null);
      setEditForm({});
      onRefresh();
    } catch (error) {
      console.error('Error al actualizar miembro:', error);
      alert('Error al guardar los cambios');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este miembro del equipo?')) {
      try {
        await deleteTeamMember(id);
        onRefresh();
      } catch (error) {
        console.error('Error al eliminar miembro:', error);
        alert('Error al eliminar el miembro');
      }
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewMemberForm({
      nombre: '',
      rol: '',
      seniority: 'Senior',
      asignacion: 100,
      costoMensual: 0,
      ingresoMensual: 0,
      area: 'Backend',
      incluido: true,
      mesesEnProyecto: 22,
    });
  };

  const handleSaveNew = async () => {
    if (!newMemberForm.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    if (!newMemberForm.rol.trim()) {
      alert('El rol es obligatorio');
      return;
    }

    try {
      await addTeamMember(newMemberForm);
      setIsAddingNew(false);
      setNewMemberForm({
        nombre: '',
        rol: '',
        seniority: 'Senior',
        asignacion: 100,
        costoMensual: 0,
        ingresoMensual: 0,
        area: 'Backend',
        incluido: true,
        mesesEnProyecto: 22,
      });
      onRefresh();
    } catch (error) {
      console.error('Error al agregar miembro:', error);
      alert('Error al agregar el miembro');
    }
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewMemberForm({
      nombre: '',
      rol: '',
      seniority: 'Senior',
      asignacion: 100,
      costoMensual: 0,
      ingresoMensual: 0,
      area: 'Backend',
      incluido: true,
      mesesEnProyecto: 22,
    });
  };

  const handleToggleSelection = (personId) => {
    setSelectedMembers(prev => {
      if (prev.includes(personId)) {
        return prev.filter(id => id !== personId);
      } else {
        return [...prev, personId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredAndSorted.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredAndSorted.map(p => p.id));
    }
  };

  const handleBulkEdit = () => {
    if (selectedMembers.length === 0) {
      alert('Selecciona al menos un miembro para editar');
      return;
    }
    setIsBulkEditOpen(true);
  };

  const handleBulkSave = async (updates, editMode) => {
    try {
      const membersToUpdate = teamData.filter(m => selectedMembers.includes(m.id));
      
      const updatePromises = membersToUpdate.map(member => {
        let updatedMember = { ...member };

        if (editMode === 'field') {
          // Establecer valor directo
          updatedMember = { ...updatedMember, ...updates };
        } else {
          // Aplicar fórmula
          const field = updates.field;
          const currentValue = member[field];

          if (updates.operation === 'increase') {
            updatedMember[field] = currentValue * (1 + updates.percentage / 100);
          } else if (updates.operation === 'decrease') {
            updatedMember[field] = currentValue * (1 - updates.percentage / 100);
          } else if (updates.operation === 'multiply') {
            updatedMember[field] = currentValue * updates.factor;
          }
        }

        return updateTeamMember(updatedMember);
      });

      await Promise.all(updatePromises);
      setIsBulkEditOpen(false);
      setSelectedMembers([]);
      onRefresh();
      alert(`${membersToUpdate.length} miembro(s) actualizado(s) correctamente`);
    } catch (error) {
      console.error('Error en edición masiva:', error);
      alert('Error al aplicar los cambios masivos');
    }
  };

  const totales = useMemo(() => {
    // Solo calcular totales de miembros incluidos
    const includedMembers = filteredAndSorted.filter(p => p.incluido);
    return includedMembers.reduce(
      (acc, person) => ({
        costoMensual: acc.costoMensual + person.costoMensual,
        ingresoMensual: acc.ingresoMensual + person.ingresoMensual,
        utilidadMensual: acc.utilidadMensual + person.utilidadMensual,
        costoTotal: acc.costoTotal + person.costoTotalProyecto,
        ingresoTotal: acc.ingresoTotal + person.ingresoTotalProyecto,
        count: acc.count + 1,
      }),
      { costoMensual: 0, ingresoMensual: 0, utilidadMensual: 0, costoTotal: 0, ingresoTotal: 0, count: 0 }
    );
  }, [filteredAndSorted]);

  const margenPromedio = ((totales.ingresoMensual - totales.costoMensual) / totales.ingresoMensual * 100).toFixed(1);

  return (
    <div className="detail-table-card" style={{ marginBottom: 24 }}>
      <h3>
        <Icon name="badge" size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#4A0099' }} />
        Detalle Completo del Equipo — {teamData.length} Personas ({totales.count} incluidas en cálculo)
      </h3>

      {/* Barra de búsqueda y acciones */}
      <div className="detail-table-toolbar">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            className="detail-search"
            placeholder="Buscar por nombre, rol o seniority..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {selectedMembers.length > 0 && (
            <div style={{
              padding: '6px 12px',
              background: '#7B3FE4',
              color: '#fff',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              {selectedMembers.length} seleccionado{selectedMembers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="detail-count">
            Mostrando {filteredAndSorted.length} de {teamData.length} personas
          </div>
          {selectedMembers.length > 0 && (
            <button
              onClick={handleBulkEdit}
              style={{
                padding: '6px 12px',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Editar seleccionados"
            >
              <Icon name="edit_note" size={14} />
              Editar Masivo
            </button>
          )}
          <button
            onClick={handleAddNew}
            style={{
              padding: '6px 12px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Agregar nuevo miembro"
          >
            <Icon name="add" size={14} />
            Agregar
          </button>
          <button
            onClick={exportTeamDataToJSON}
            style={{
              padding: '6px 12px',
              background: '#7B3FE4',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Exportar datos a JSON"
          >
            <Icon name="download" size={14} />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table className="detail-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedMembers.length === filteredAndSorted.length && filteredAndSorted.length > 0}
                  onChange={handleSelectAll}
                  style={{ 
                    width: 18, 
                    height: 18, 
                    cursor: 'pointer',
                    accentColor: '#f59e0b'
                  }}
                  title="Seleccionar todos para edición masiva"
                />
              </th>
              <th style={{ width: 50, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleToggleAll}
                  style={{ 
                    width: 18, 
                    height: 18, 
                    cursor: 'pointer',
                    accentColor: '#7B3FE4'
                  }}
                  title={allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                />
              </th>
              <th onClick={() => handleSort('nombre')} style={{ minWidth: 160 }}>
                Nombre {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('rol')} style={{ minWidth: 180 }}>
                Rol {sortConfig.key === 'rol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('seniority')} style={{ minWidth: 100 }}>
                Seniority {sortConfig.key === 'seniority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('asignacion')} style={{ textAlign: 'center' }}>
                % Asig. {sortConfig.key === 'asignacion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('mesesEnProyecto')} style={{ textAlign: 'center', width: 80 }}>
                Meses {sortConfig.key === 'mesesEnProyecto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('costoMensual')} style={{ textAlign: 'right' }}>
                Costo/Mes {sortConfig.key === 'costoMensual' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('ingresoMensual')} style={{ textAlign: 'right' }}>
                Ingreso/Mes {sortConfig.key === 'ingresoMensual' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('margen')} style={{ textAlign: 'center' }}>
                Margen {sortConfig.key === 'margen' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('utilidadMensual')} style={{ textAlign: 'right' }}>
                Utilidad/Mes {sortConfig.key === 'utilidadMensual' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('costoTotalProyecto')} style={{ textAlign: 'right' }}>
                Costo Total {sortConfig.key === 'costoTotalProyecto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('ingresoTotalProyecto')} style={{ textAlign: 'right' }}>
                Ingreso Total {sortConfig.key === 'ingresoTotalProyecto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ textAlign: 'center', width: 120 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((person, idx) => (
              <tr key={person.id || idx} style={{ opacity: person.incluido ? 1 : 0.5 }}>
                {editingId === person.id ? (
                  // Modo edición
                  <>
                    <td style={{ textAlign: 'center' }}>
                      {/* No selection checkbox in edit mode */}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={editForm.incluido}
                        onChange={(e) => setEditForm({ ...editForm, incluido: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        style={{ width: '100%', padding: 4, fontSize: '0.85rem' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editForm.rol}
                        onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                        style={{ width: '100%', padding: 4, fontSize: '0.85rem' }}
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.seniority}
                        onChange={(e) => setEditForm({ ...editForm, seniority: e.target.value })}
                        style={{ width: '100%', padding: 4, fontSize: '0.85rem' }}
                      >
                        <option value="Máster">Máster</option>
                        <option value="Senior">Senior</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Junior">Junior</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editForm.asignacion}
                        onChange={(e) => setEditForm({ ...editForm, asignacion: parseInt(e.target.value) })}
                        style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'center' }}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editForm.mesesEnProyecto || 22}
                        onChange={(e) => setEditForm({ ...editForm, mesesEnProyecto: parseInt(e.target.value) })}
                        style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'center' }}
                        min="1"
                        max="60"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editForm.costoMensual}
                        onChange={(e) => setEditForm({ ...editForm, costoMensual: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editForm.ingresoMensual}
                        onChange={(e) => setEditForm({ ...editForm, ingresoMensual: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'right' }}
                      />
                    </td>
                    <td colSpan="3" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          onClick={handleSave}
                          style={{
                            padding: '4px 12px',
                            background: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          style={{
                            padding: '4px 12px',
                            background: '#94a3b8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Modo visualización
                  <>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(person.id)}
                        onChange={() => handleToggleSelection(person.id)}
                        style={{ 
                          width: 18, 
                          height: 18, 
                          cursor: 'pointer',
                          accentColor: '#f59e0b'
                        }}
                        title="Seleccionar para edición masiva"
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={person.incluido}
                        onChange={() => handleToggleIncluido(person)}
                        style={{ 
                          width: 18, 
                          height: 18, 
                          cursor: 'pointer',
                          accentColor: '#7B3FE4'
                        }}
                        title={person.incluido ? 'Excluir del cálculo' : 'Incluir en el cálculo'}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{person.nombre}</td>
                    <td>{person.rol}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${getSeniorityColor(person.seniority)}15`,
                          color: getSeniorityColor(person.seniority),
                          border: `1px solid ${getSeniorityColor(person.seniority)}40`,
                        }}
                      >
                        {person.seniority}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{person.asignacion}%</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#7B3FE4' }}>
                      {person.mesesEnProyecto || 22}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      USD {person.costoMensual.toLocaleString('en-US')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      USD {person.ingresoMensual.toLocaleString('en-US')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          color: getMargenColor(person.margen),
                          fontWeight: 700,
                          fontSize: '0.88rem',
                        }}
                      >
                        {person.margen}%
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        color: person.utilidadMensual >= 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 600,
                      }}
                    >
                      USD {person.utilidadMensual.toLocaleString('en-US')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#4A0099' }}>
                      USD {person.costoTotalProyecto.toLocaleString('en-US')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontWeight: 600 }}>
                      USD {person.ingresoTotalProyecto.toLocaleString('en-US')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(person)}
                          style={{
                            padding: '4px 8px',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                          title="Editar"
                        >
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                          title="Eliminar"
                        >
                          <Icon name="delete" size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            
            {/* Fila para agregar nuevo miembro */}
            {isAddingNew && (
              <tr style={{ background: '#f0fdf4', border: '2px solid #22c55e' }}>
                <td style={{ textAlign: 'center' }}>
                  {/* No selection checkbox for new row */}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={newMemberForm.incluido}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, incluido: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22c55e' }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={newMemberForm.nombre}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, nombre: e.target.value })}
                    style={{ width: '100%', padding: 4, fontSize: '0.85rem', border: '1px solid #22c55e' }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Rol *"
                    value={newMemberForm.rol}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, rol: e.target.value })}
                    style={{ width: '100%', padding: 4, fontSize: '0.85rem', border: '1px solid #22c55e' }}
                  />
                </td>
                <td>
                  <select
                    value={newMemberForm.seniority}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, seniority: e.target.value })}
                    style={{ width: '100%', padding: 4, fontSize: '0.85rem', border: '1px solid #22c55e' }}
                  >
                    <option value="Máster">Máster</option>
                    <option value="Senior">Senior</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Junior">Junior</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={newMemberForm.asignacion}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, asignacion: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'center', border: '1px solid #22c55e' }}
                    min="0"
                    max="100"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={newMemberForm.mesesEnProyecto}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, mesesEnProyecto: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'center', border: '1px solid #22c55e' }}
                    min="1"
                    max="60"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Costo"
                    value={newMemberForm.costoMensual}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, costoMensual: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'right', border: '1px solid #22c55e' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Ingreso"
                    value={newMemberForm.ingresoMensual}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, ingresoMensual: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: 4, fontSize: '0.85rem', textAlign: 'right', border: '1px solid #22c55e' }}
                  />
                </td>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                    <select
                      value={newMemberForm.area}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, area: e.target.value })}
                      style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #22c55e', borderRadius: 4 }}
                    >
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
                    <button
                      onClick={handleSaveNew}
                      style={{
                        padding: '4px 12px',
                        background: '#22c55e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelNew}
                      style={{
                        padding: '4px 12px',
                        background: '#94a3b8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f3e8ff', fontWeight: 700 }}>
              {/* col 1: ícono */}
              <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                <Icon name="calculate" size={16} color="#4A0099" />
              </td>
              {/* cols 2-7: label (checkbox-incluido, Nombre, Rol, Seniority, %Asig, Meses) */}
              <td colSpan="6" style={{ textAlign: 'right', padding: '10px 12px', color: '#4A0099', fontSize: '0.82rem' }}>
                <strong>TOTALES ({totales.count} incluidos):</strong>
              </td>
              {/* col 8: Costo/Mes */}
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#4A0099', padding: '10px 8px' }}>
                USD {totales.costoMensual.toLocaleString('en-US')}
              </td>
              {/* col 9: Ingreso/Mes */}
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700, padding: '10px 8px' }}>
                USD {totales.ingresoMensual.toLocaleString('en-US')}
              </td>
              {/* col 10: Margen */}
              <td style={{ textAlign: 'center', color: getMargenColor(margenPromedio), fontSize: '0.92rem', padding: '10px 8px' }}>
                {margenPromedio}%
              </td>
              {/* col 11: Utilidad/Mes */}
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700, padding: '10px 8px' }}>
                USD {totales.utilidadMensual.toLocaleString('en-US')}
              </td>
              {/* col 12: Costo Total */}
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#4A0099', padding: '10px 8px' }}>
                USD {totales.costoTotal.toLocaleString('en-US')}
              </td>
              {/* col 13: Ingreso Total */}
              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#16a34a', fontWeight: 700, padding: '10px 8px' }}>
                USD {totales.ingresoTotal.toLocaleString('en-US')}
              </td>
              {/* col 14: Acciones — vacía */}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal de Edición Masiva */}
      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedMembers={selectedMembers}
        onSave={handleBulkSave}
      />
    </div>
  );
}

// Datos financieros del proyecto (desde "Copia de Presupuesto ejecución")
const TRM = 3700; // COP/USD

const FINANCIAL_DATA = {
  costoTotalCOP: 9767783194,
  costoTotalUSD: 2639941,
  costoDic2025USD: 17324.94,
  costoTotalRealUSD: 2657266,
  contingencia10USD: 265727,
  costoConContingenciaUSD: 2922993,
  precioInicialUSD: 2550000,
  precioConAdendaUSD: 2874500,
  precioPJBaseUSD: 4249000,
  contingencia7Pct: 7,
  contingencia7USD: 297430,
  precioPJConContingenciaUSD: 4546430,
  ingresoTotalUSD: 4546430,
  duracionMeses: 22,
  equipoSize: 43,
};

// Distribución por Seniority (datos aproximados del Excel)
const SENIORITY_DATA = [
  { level: 'Senior', count: 18, costoMensualUSD: 5200, color: '#7B3FE4' },
  { level: 'Advanced', count: 12, costoMensualUSD: 4100, color: '#3b82f6' },
  { level: 'Máster', count: 8, costoMensualUSD: 6500, color: '#2D0066' },
  { level: 'Junior', count: 5, costoMensualUSD: 2800, color: '#a855f7' },
];

// Top 10 roles más costosos (datos aproximados)
const TOP_ROLES = [
  { rol: 'Arquitecto de Soluciones', count: 2, costoMensualUSD: 7200 },
  { rol: 'Tech Lead', count: 3, costoMensualUSD: 6800 },
  { rol: 'Desarrollador Senior Full Stack', count: 8, costoMensualUSD: 5500 },
  { rol: 'QA Lead', count: 2, costoMensualUSD: 5200 },
  { rol: 'Desarrollador Senior Backend', count: 6, costoMensualUSD: 5000 },
  { rol: 'Scrum Master', count: 2, costoMensualUSD: 4800 },
  { rol: 'Desarrollador Advanced Frontend', count: 5, costoMensualUSD: 4200 },
  { rol: 'QA Advanced', count: 4, costoMensualUSD: 3900 },
  { rol: 'Analista Funcional', count: 3, costoMensualUSD: 3600 },
  { rol: 'Desarrollador Junior', count: 5, costoMensualUSD: 2800 },
];

// Escenarios de precio
const SCENARIOS = [
  {
    nombre: 'Precio Inicial',
    precioUSD: 2550000,
    costoUSD: 2922993,
    margen: -14.6,
    color: '#ef4444',
    icon: 'trending_down',
  },
  {
    nombre: 'Con Adenda (+$325K)',
    precioUSD: 2874500,
    costoUSD: 2922993,
    margen: -1.7,
    color: '#ef4444',
    icon: 'warning',
  },
  {
    nombre: 'Precio PJ Base',
    precioUSD: 4249000,
    costoUSD: 2922993,
    margen: 31.2,
    color: '#22c55e',
    icon: 'trending_up',
  },
  {
    nombre: 'Precio PJ + Contingencia 7%',
    precioUSD: 4546430,
    costoUSD: 2922993,
    margen: 35.7,
    color: '#22c55e',
    icon: 'celebration',
  },
];

// Proyección mensual (simplificada - 22 meses)
const MONTHLY_PROJECTION = Array.from({ length: 22 }, (_, i) => ({
  mes: i + 1,
  label: `Mes ${i + 1}`,
  costoUSD: Math.round(2922993 / 22),
}));

// Utilidades de formato
const formatUSD = (value) => `USD ${value.toLocaleString('en-US')}`;
const formatCOP = (value) => `COP ${value.toLocaleString('es-CO')}`;
const formatPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export function TabCostosRentabilidad() {
  const teamData        = useDashboardStore(s => s.teamData);
  const loading         = useDashboardStore(s => s.teamDataLoading);
  const loadTeamData    = useDashboardStore(s => s.loadTeamData);
  const extraCosts      = useDashboardStore(s => s.extraCosts);
  const extraRevenues   = useDashboardStore(s => s.extraRevenues);
  const setAjustesMargen = useDashboardStore(s => s.setAjustesMargen);

  const [showAjustes, setShowAjustes] = useState(false);

  const handleRefresh = () => {
    loadTeamData();
  };

  const handleResetData = async () => {
    if (confirm('¿Estás seguro de restaurar los datos iniciales del equipo? Esto eliminará todos los cambios.')) {
      try {
        await initializeTeamData();
        loadTeamData();
        alert('Datos restaurados correctamente');
      } catch (error) {
        console.error('Error al restaurar datos:', error);
        alert('Error al restaurar los datos');
      }
    }
  };

  // Calcular totales basados en miembros incluidos
  const calculatedTotals = useMemo(() => {
    const included = teamData.filter(m => m.incluido);
    const costoMensual = included.reduce((sum, m) => sum + m.costoMensual, 0);
    const ingresoMensual = included.reduce((sum, m) => sum + m.ingresoMensual, 0);
    
    // Calcular totales usando los meses individuales de cada miembro
    const costoBaseTotal = included.reduce((sum, m) => {
      const meses = m.mesesEnProyecto || FINANCIAL_DATA.duracionMeses;
      return sum + (m.costoMensual * meses);
    }, 0);
    
    const ingresoBaseTotal = included.reduce((sum, m) => {
      const meses = m.mesesEnProyecto || FINANCIAL_DATA.duracionMeses;
      return sum + (m.ingresoMensual * meses);
    }, 0);

    // Sumar ajustes adicionales
    const totalExtraCost    = extraCosts.reduce((s, c) => s + (c.monto || 0), 0);
    const totalExtraRevenue = extraRevenues.reduce((s, r) => s + (r.monto || 0), 0);

    const costoTotal    = costoBaseTotal    + totalExtraCost;
    const ingresoTotal  = ingresoBaseTotal  + totalExtraRevenue;
    
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
  }, [teamData, extraCosts, extraRevenues]);

  // Cálculo de métricas adicionales
  const avgCostPerPerson = useMemo(
    () => calculatedTotals.count > 0 ? Math.round(calculatedTotals.costoMensual / calculatedTotals.count) : 0,
    [calculatedTotals]
  );

  const avgRate = useMemo(
    () => calculatedTotals.count > 0 ? Math.round(calculatedTotals.ingresoMensual / calculatedTotals.count) : 0,
    [calculatedTotals]
  );

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#7B3FE4', marginBottom: 12 }}>
          Cargando datos del equipo...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Costos y Rentabilidad — Proyecto NT</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowAjustes(true)}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #2D0066, #7B3FE4)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Ajustar costos e ingresos adicionales"
          >
            <Icon name="tune" size={16} />
            Ajustar Margen
            {(extraCosts.length > 0 || extraRevenues.length > 0) && (
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}>
                {extraCosts.length + extraRevenues.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          RESUMEN DE CÁLCULO BASADO EN SELECCIÓN
          ══════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
        border: '2px solid #7B3FE4',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 28,
        boxShadow: '0 4px 12px rgba(123,63,228,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Icon name="calculate" size={24} color="#7B3FE4" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#4A0099', fontWeight: 800 }}>
            Cálculo de Rentabilidad — Basado en Selección
          </h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {/* Miembros Incluidos */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px', border: '1px solid #DDD6FE' }}>
            <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, marginBottom: 8 }}>
              Miembros Incluidos
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4A0099', lineHeight: 1 }}>
              {calculatedTotals.count}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>
              de {teamData.length} totales
            </div>
          </div>

          {/* Costo Total Calculado */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px', border: '1px solid #DDD6FE' }}>
            <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, marginBottom: 8 }}>
              Costo Total (22 meses)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7B3FE4', lineHeight: 1 }}>
              {formatUSD(Math.round(calculatedTotals.costoTotal))}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>
              {formatUSD(Math.round(calculatedTotals.costoMensual))}/mes
            </div>
          </div>

          {/* Ingreso Total Calculado */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px', border: '1px solid #DDD6FE' }}>
            <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, marginBottom: 8 }}>
              Ingreso Total (22 meses)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
              {formatUSD(Math.round(calculatedTotals.ingresoTotal))}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>
              {formatUSD(Math.round(calculatedTotals.ingresoMensual))}/mes
            </div>
          </div>

          {/* Margen Calculado */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px', border: '1px solid #DDD6FE' }}>
            <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, marginBottom: 8 }}>
              Margen Calculado
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 900, 
              color: calculatedTotals.margen >= 0 ? '#22c55e' : '#ef4444', 
              lineHeight: 1 
            }}>
              {calculatedTotals.margen.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>
              Utilidad: {formatUSD(Math.round(calculatedTotals.utilidad))}
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: 16, 
          padding: '12px 16px', 
          background: '#fff', 
          borderRadius: 8,
          border: '1px solid #DDD6FE',
          fontSize: '0.8rem',
          color: '#4A0099',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Icon name="info" size={16} color="#7B3FE4" />
          <span>
            <strong>Nota:</strong> Los cálculos se actualizan automáticamente según los miembros seleccionados con el checkbox. 
            Desmarca los miembros que no quieras incluir en el análisis de rentabilidad.
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          1. RESUMEN EJECUTIVO — 4 Cards DINÁMICOS
          ══════════════════════════════════════════════════ */}
      <div className="summary-grid" style={{ marginBottom: 28 }}>
        {/* Card 1: Costo Total Calculado (Dinámico) */}
        <div className="summary-card" style={{ borderLeftColor: '#7B3FE4' }}>
          <div className="label">Costo Total</div>
          <div className="value" style={{ color: '#7B3FE4' }}>
            {formatUSD(Math.round(calculatedTotals.costoTotal))}
          </div>
          <div className="sub">{formatCOP(Math.round(calculatedTotals.costoTotal * TRM))} COP</div>
          <div className="sub" style={{ fontSize: '0.7rem', marginTop: 4 }}>
            {calculatedTotals.count} miembros × duración variable
          </div>
        </div>

        {/* Card 2: Precio/Ingreso Total (Dinámico) */}
        <div className="summary-card green">
          <div className="label">Precio PJ + Contingencia 7%</div>
          <div className="value">{formatUSD(Math.round(calculatedTotals.ingresoTotal))}</div>
          <div className="sub">Ingreso calculado del equipo seleccionado</div>
          <div className="sub" style={{ fontSize: '0.7rem', marginTop: 4 }}>
            Base: {formatUSD(Math.round(calculatedTotals.ingresoTotal / 1.07))} + 7%
          </div>
        </div>

        {/* Card 3: Margen Calculado (Dinámico) */}
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

        {/* Card 4: Tamaño del Equipo (Dinámico) */}
        <div className="summary-card amber">
          <div className="label">Equipo</div>
          <div className="value">{calculatedTotals.count}</div>
          <div className="sub">miembros activos</div>
          <div className="sub" style={{ fontSize: '0.7rem', marginTop: 4 }}>
            de {teamData.length} totales
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          1.5. COMPARACIÓN: PRESUPUESTO ORIGINAL VS CALCULADO
          ══════════════════════════════════════════════════ */}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <h3>
          <Icon name="compare_arrows" size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#7B3FE4' }} />
          Comparación: Presupuesto Original vs Calculado Dinámicamente
        </h3>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Presupuesto Original</th>
              <th>Calculado Actual</th>
              <th>Diferencia</th>
              <th>Variación %</th>
            </tr>
          </thead>
          <tbody>
            {/* Costo/Mes Total */}
            <tr>
              <td><strong>Costo/Mes Total</strong></td>
              <td>{formatUSD(Math.round(FINANCIAL_DATA.costoConContingenciaUSD / FINANCIAL_DATA.duracionMeses))}</td>
              <td style={{ fontWeight: 600, color: '#7B3FE4' }}>
                {formatUSD(Math.round(calculatedTotals.costoMensual))}
              </td>
              <td style={{ 
                color: calculatedTotals.costoMensual > (FINANCIAL_DATA.costoConContingenciaUSD / FINANCIAL_DATA.duracionMeses) ? '#ef4444' : '#22c55e',
                fontWeight: 600 
              }}>
                {formatUSD(Math.round(calculatedTotals.costoMensual - (FINANCIAL_DATA.costoConContingenciaUSD / FINANCIAL_DATA.duracionMeses)))}
              </td>
              <td style={{ 
                color: calculatedTotals.costoMensual > (FINANCIAL_DATA.costoConContingenciaUSD / FINANCIAL_DATA.duracionMeses) ? '#ef4444' : '#22c55e',
                fontWeight: 600 
              }}>
                {(((calculatedTotals.costoMensual - (FINANCIAL_DATA.costoConContingenciaUSD / FINANCIAL_DATA.duracionMeses)) / (FINANCIAL_DATA.costoConContingenciaUSD / FINANCIAL_DATA.duracionMeses)) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Ingreso/Mes Total */}
            <tr>
              <td><strong>Ingreso/Mes Total</strong></td>
              <td>{formatUSD(Math.round(FINANCIAL_DATA.precioPJConContingenciaUSD / FINANCIAL_DATA.duracionMeses))}</td>
              <td style={{ fontWeight: 600, color: '#22c55e' }}>
                {formatUSD(Math.round(calculatedTotals.ingresoMensual))}
              </td>
              <td style={{ 
                color: calculatedTotals.ingresoMensual > (FINANCIAL_DATA.precioPJConContingenciaUSD / FINANCIAL_DATA.duracionMeses) ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {formatUSD(Math.round(calculatedTotals.ingresoMensual - (FINANCIAL_DATA.precioPJConContingenciaUSD / FINANCIAL_DATA.duracionMeses)))}
              </td>
              <td style={{ 
                color: calculatedTotals.ingresoMensual > (FINANCIAL_DATA.precioPJConContingenciaUSD / FINANCIAL_DATA.duracionMeses) ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {(((calculatedTotals.ingresoMensual - (FINANCIAL_DATA.precioPJConContingenciaUSD / FINANCIAL_DATA.duracionMeses)) / (FINANCIAL_DATA.precioPJConContingenciaUSD / FINANCIAL_DATA.duracionMeses)) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Margen */}
            <tr>
              <td><strong>Margen</strong></td>
              <td>35.7%</td>
              <td style={{ fontWeight: 600, color: '#3b82f6' }}>
                {calculatedTotals.margen.toFixed(1)}%
              </td>
              <td style={{ 
                color: calculatedTotals.margen > 35.7 ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {(calculatedTotals.margen - 35.7).toFixed(1)} pp
              </td>
              <td style={{ 
                color: calculatedTotals.margen > 35.7 ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {calculatedTotals.margen > 35.7 ? '↑ Mejor' : '↓ Menor'}
              </td>
            </tr>

            {/* Utilidad/Mes Total */}
            <tr>
              <td><strong>Utilidad/Mes Total</strong></td>
              <td>{formatUSD(Math.round((FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) / FINANCIAL_DATA.duracionMeses))}</td>
              <td style={{ fontWeight: 600, color: '#16a34a' }}>
                {formatUSD(Math.round(calculatedTotals.utilidadMensual))}
              </td>
              <td style={{ 
                color: calculatedTotals.utilidadMensual > ((FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) / FINANCIAL_DATA.duracionMeses) ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {formatUSD(Math.round(calculatedTotals.utilidadMensual - ((FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) / FINANCIAL_DATA.duracionMeses)))}
              </td>
              <td style={{ 
                color: calculatedTotals.utilidadMensual > ((FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) / FINANCIAL_DATA.duracionMeses) ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {(((calculatedTotals.utilidadMensual - ((FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) / FINANCIAL_DATA.duracionMeses)) / ((FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) / FINANCIAL_DATA.duracionMeses)) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Costo Total del Proyecto */}
            <tr>
              <td><strong>Costo Total</strong></td>
              <td>{formatUSD(FINANCIAL_DATA.costoConContingenciaUSD)}</td>
              <td style={{ fontWeight: 600, color: '#7B3FE4' }}>
                {formatUSD(Math.round(calculatedTotals.costoTotal))}
              </td>
              <td style={{ 
                color: calculatedTotals.costoTotal > FINANCIAL_DATA.costoConContingenciaUSD ? '#ef4444' : '#22c55e',
                fontWeight: 600 
              }}>
                {formatUSD(Math.round(calculatedTotals.costoTotal - FINANCIAL_DATA.costoConContingenciaUSD))}
              </td>
              <td style={{ 
                color: calculatedTotals.costoTotal > FINANCIAL_DATA.costoConContingenciaUSD ? '#ef4444' : '#22c55e',
                fontWeight: 600 
              }}>
                {(((calculatedTotals.costoTotal - FINANCIAL_DATA.costoConContingenciaUSD) / FINANCIAL_DATA.costoConContingenciaUSD) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Ingreso Total del Proyecto */}
            <tr>
              <td><strong>Ingreso Total</strong></td>
              <td>{formatUSD(FINANCIAL_DATA.precioPJConContingenciaUSD)}</td>
              <td style={{ fontWeight: 600, color: '#22c55e' }}>
                {formatUSD(Math.round(calculatedTotals.ingresoTotal))}
              </td>
              <td style={{ 
                color: calculatedTotals.ingresoTotal > FINANCIAL_DATA.precioPJConContingenciaUSD ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {formatUSD(Math.round(calculatedTotals.ingresoTotal - FINANCIAL_DATA.precioPJConContingenciaUSD))}
              </td>
              <td style={{ 
                color: calculatedTotals.ingresoTotal > FINANCIAL_DATA.precioPJConContingenciaUSD ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {(((calculatedTotals.ingresoTotal - FINANCIAL_DATA.precioPJConContingenciaUSD) / FINANCIAL_DATA.precioPJConContingenciaUSD) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Utilidad Total del Proyecto */}
            <tr>
              <td><strong>Utilidad Total</strong></td>
              <td>{formatUSD(FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD)}</td>
              <td style={{ fontWeight: 600, color: '#16a34a' }}>
                {formatUSD(Math.round(calculatedTotals.utilidad))}
              </td>
              <td style={{ 
                color: calculatedTotals.utilidad > (FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {formatUSD(Math.round(calculatedTotals.utilidad - (FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD)))}
              </td>
              <td style={{ 
                color: calculatedTotals.utilidad > (FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD) ? '#22c55e' : '#ef4444',
                fontWeight: 600 
              }}>
                {(((calculatedTotals.utilidad - (FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD)) / (FINANCIAL_DATA.precioPJConContingenciaUSD - FINANCIAL_DATA.costoConContingenciaUSD)) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Tamaño del Equipo */}
            <tr>
              <td><strong>Miembros del Equipo</strong></td>
              <td>{FINANCIAL_DATA.equipoSize} miembros</td>
              <td style={{ fontWeight: 600, color: '#f59e0b' }}>
                {calculatedTotals.count} miembros
              </td>
              <td style={{ 
                color: calculatedTotals.count > FINANCIAL_DATA.equipoSize ? '#ef4444' : '#22c55e',
                fontWeight: 600 
              }}>
                {calculatedTotals.count - FINANCIAL_DATA.equipoSize > 0 ? '+' : ''}{calculatedTotals.count - FINANCIAL_DATA.equipoSize}
              </td>
              <td style={{ 
                color: calculatedTotals.count > FINANCIAL_DATA.equipoSize ? '#ef4444' : '#22c55e',
                fontWeight: 600 
              }}>
                {calculatedTotals.count === FINANCIAL_DATA.equipoSize ? '=' : calculatedTotals.count > FINANCIAL_DATA.equipoSize ? '↑ Más' : '↓ Menos'}
              </td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ 
          marginTop: 16, 
          padding: '12px 16px', 
          background: '#f0f9ff', 
          borderRadius: 8,
          border: '1px solid #bae6fd',
          fontSize: '0.8rem',
          color: '#0369a1',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Icon name="info" size={16} color="#0284c7" />
          <span>
            <strong>Nota:</strong> Los valores calculados se actualizan en tiempo real según los miembros incluidos en el cálculo. 
            Las diferencias muestran la variación respecto al presupuesto original del Excel. Los nombres coinciden con las columnas de la tabla "Detalle Completo del Equipo".
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          2. TABLA COMPARATIVA DE ESCENARIOS
          ══════════════════════════════════════════════════ */}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <h3>
          <Icon name="compare" size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#7B3FE4' }} />
          Comparativa de Escenarios Financieros
        </h3>
        <table>
          <thead>
            <tr>
              <th>Escenario</th>
              <th>Precio (USD)</th>
              <th>Costo (USD)</th>
              <th>Margen</th>
              <th>Utilidad (USD)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((scenario, idx) => {
              const utilidad = scenario.precioUSD - scenario.costoUSD;
              return (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name={scenario.icon} size={16} color={scenario.color} />
                      <strong>{scenario.nombre}</strong>
                    </div>
                  </td>
                  <td>{formatUSD(scenario.precioUSD)}</td>
                  <td>{formatUSD(scenario.costoUSD)}</td>
                  <td>
                    <span
                      style={{
                        color: scenario.margen >= 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {formatPercent(scenario.margen)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: utilidad >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      {formatUSD(utilidad)}
                    </span>
                  </td>
                  <td>
                    <div
                      className="badge"
                      style={{
                        background: scenario.margen >= 10 ? '#dcfce7' : scenario.margen >= 0 ? '#fef3c7' : '#fee2e2',
                        color: scenario.margen >= 10 ? '#16a34a' : scenario.margen >= 0 ? '#d97706' : '#dc2626',
                      }}
                    >
                      {scenario.margen >= 10 ? 'Excelente' : scenario.margen >= 0 ? 'Viable' : 'Riesgo'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════
          3. DISTRIBUCIÓN POR ROL Y SENIORITY
          ══════════════════════════════════════════════════ */}
      <div className="charts-row cols-2" style={{ marginBottom: 24 }}>
        {/* Top 10 Roles */}
        <div className="table-card" style={{ margin: 0 }}>
          <h3>
            <Icon name="groups" size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#7B3FE4' }} />
            Top 10 Roles Más Costosos
          </h3>
          <table>
            <thead>
              <tr>
                <th>Rol</th>
                <th>Cantidad</th>
                <th>Costo/Mes (USD)</th>
                <th>Total Proyecto</th>
              </tr>
            </thead>
            <tbody>
              {TOP_ROLES.map((role, idx) => {
                const totalProyecto = role.count * role.costoMensualUSD * FINANCIAL_DATA.duracionMeses;
                return (
                  <tr key={idx}>
                    <td>{role.rol}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{role.count}</td>
                    <td>{formatUSD(role.costoMensualUSD)}</td>
                    <td style={{ fontWeight: 600, color: '#4A0099' }}>{formatUSD(totalProyecto)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Distribución por Seniority */}
        <div className="table-card" style={{ margin: 0 }}>
          <h3>
            <Icon name="bar_chart" size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: '#7B3FE4' }} />
            Distribución por Seniority
          </h3>
          <table>
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Cantidad</th>
                <th>Costo/Mes (USD)</th>
                <th>% del Equipo</th>
              </tr>
            </thead>
            <tbody>
              {SENIORITY_DATA.map((level, idx) => {
                const pct = ((level.count / FINANCIAL_DATA.equipoSize) * 100).toFixed(1);
                return (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: level.color,
                          }}
                        />
                        <strong>{level.level}</strong>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{level.count}</td>
                    <td>{formatUSD(level.costoMensualUSD)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{pct}%</span>
                        <div className="prog-bar-wrap" style={{ flex: 1 }}>
                          <div
                            className="prog-bar"
                            style={{ width: `${pct}%`, background: level.color }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          3.5. DETALLE COMPLETO DEL EQUIPO
          ══════════════════════════════════════════════════ */}
      <TeamDetailTable teamData={teamData} onRefresh={handleRefresh} />

      {/* ══════════════════════════════════════════════════
          6. NOTAS Y CONSIDERACIONES
          ══════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Icon name="info" size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
              Notas Importantes
            </h4>
            <ul style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>
                <strong>TRM utilizada:</strong> {TRM.toLocaleString('es-CO')} COP/USD (fija para todo el proyecto)
              </li>
              <li>
                <strong>Duración:</strong> Enero 2026 - Octubre 2027 (22 meses)
              </li>
              <li>
                <strong>Costo Diciembre 2025:</strong> {formatUSD(FINANCIAL_DATA.costoDic2025USD)} (incluido en costo total real)
              </li>
              <li>
                <strong>Contingencia sobre costos:</strong> 10% = {formatUSD(FINANCIAL_DATA.contingencia10USD)}
              </li>
              <li>
                <strong>Contingencia sobre ingresos:</strong> 7% = {formatUSD(FINANCIAL_DATA.contingencia7USD)}
              </li>
              <li>
                <strong>Costo Total con Contingencia:</strong> {formatUSD(FINANCIAL_DATA.costoConContingenciaUSD)}
              </li>
              <li>
                <strong>Precio PJ con Contingencia 7%:</strong> {formatUSD(FINANCIAL_DATA.precioPJConContingenciaUSD)} 
                (Base: {formatUSD(FINANCIAL_DATA.precioPJBaseUSD)} + 7%)
              </li>
              <li>
                <strong>Escenario recomendado:</strong> Precio PJ + Contingencia 7% ({formatUSD(FINANCIAL_DATA.precioPJConContingenciaUSD)}) 
                ofrece un margen saludable del 35.7%
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de ajustes de margen */}
      {showAjustes && (
        <AjustesMargenModal
          extraCosts={extraCosts}
          extraRevenues={extraRevenues}
          onSave={setAjustesMargen}
          onClose={() => setShowAjustes(false)}
        />
      )}
    </div>
  );
}
