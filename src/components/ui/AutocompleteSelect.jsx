import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

/**
 * AutocompleteSelect
 * Props:
 *  - options: [{ value, label, meta? }]  — lista de opciones
 *  - value: string                        — valor seleccionado actualmente
 *  - onChange: (value, option) => void
 *  - placeholder: string
 *  - disabled: boolean
 *  - loading: boolean                     — muestra spinner mientras carga
 *  - emptyText: string                    — texto cuando no hay resultados
 *  - icon: string                         — nombre de Material Icon
 */
export function AutocompleteSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  loading = false,
  emptyText = 'Sin resultados',
  icon,
  style = {},
}) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState('');
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  // Label del valor seleccionado
  const selectedLabel = options.find(o => o.value === value)?.label || '';

  // Filtrar opciones por query
  const filtered = query.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.meta || '').toLowerCase().includes(query.toLowerCase())
      )
    : options;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = useCallback((opt) => {
    onChange(opt.value, opt);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setOpen(false);
    setQuery('');
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', minWidth: 200, ...style }}
    >
      {/* Trigger */}
      <div
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px 5px 10px',
          border: `1.5px solid ${open ? '#7B3FE4' : '#d4c5ff'}`,
          borderRadius: 8,
          background: disabled ? '#f9f7ff' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: 180,
          boxShadow: open ? '0 0 0 3px rgba(123,63,228,0.12)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          userSelect: 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {icon && <Icon name={icon} size={15} color="#7B3FE4" />}
        <span style={{
          flex: 1, fontSize: '0.82rem',
          color: value ? '#1a1a2e' : '#9ca3af',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {loading ? 'Cargando...' : (selectedLabel || placeholder)}
        </span>
        {value && !disabled ? (
          <span
            onClick={handleClear}
            style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1, padding: '0 2px', cursor: 'pointer' }}
            title="Limpiar"
          >✕</span>
        ) : (
          <Icon name={open ? 'expand_less' : 'expand_more'} size={16} color="#9ca3af" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff',
          border: '1.5px solid #e0d4ff',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(123,63,228,0.15)',
          zIndex: 9999,
          overflow: 'hidden',
          minWidth: 220,
        }}>
          {/* Input de búsqueda */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0ebff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="search" size={15} color="#9ca3af" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: '0.82rem', color: '#1a1a2e', background: 'transparent',
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                  if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0]);
                }}
              />
              {query && (
                <span onClick={() => setQuery('')} style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '0.85rem' }}>✕</span>
              )}
            </div>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {/* Opción "Todos" */}
            <div
              onClick={() => handleSelect({ value: '', label: '' })}
              style={{
                padding: '8px 12px',
                fontSize: '0.82rem',
                color: '#9ca3af',
                cursor: 'pointer',
                background: !value ? '#f5f3ff' : 'transparent',
                fontStyle: 'italic',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
              onMouseLeave={e => e.currentTarget.style.background = !value ? '#f5f3ff' : 'transparent'}
            >
              — Todos —
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>
                {emptyText}
              </div>
            ) : filtered.map(opt => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: opt.value === value ? '#f5f3ff' : 'transparent',
                  color: opt.value === value ? '#4A0099' : '#1a1a2e',
                  fontWeight: opt.value === value ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderLeft: opt.value === value ? '3px solid #7B3FE4' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = '#faf8ff'; }}
                onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt.dot && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: opt.dot,
                  }} />
                )}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {opt.meta && (
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', flexShrink: 0 }}>{opt.meta}</span>
                )}
                {opt.value === value && <Icon name="check" size={14} color="#7B3FE4" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
