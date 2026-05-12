import { useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'dashboard_sections_order';

/**
 * Hook para manejar drag & drop de secciones del dashboard.
 * Persiste el orden en localStorage.
 *
 * @param {string[]} defaultOrder - IDs de secciones en orden por defecto
 */
export function useDragSections(defaultOrder) {
  const getSavedOrder = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validar que tenga los mismos IDs (por si se agregaron nuevas secciones)
        if (
          parsed.length === defaultOrder.length &&
          defaultOrder.every(id => parsed.includes(id))
        ) {
          return parsed;
        }
      }
    } catch (_) {}
    return defaultOrder;
  };

  const [order, setOrder] = useState(getSavedOrder);
  const dragItem = useRef(null);       // índice del item que se arrastra
  const dragOverItem = useRef(null);   // índice del item sobre el que se pasa
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);

  const handleDragStart = useCallback((id) => {
    dragItem.current = id;
    setDraggingId(id);
  }, []);

  const handleDragEnter = useCallback((id) => {
    dragOverItem.current = id;
    setOverId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDraggingId(null);
      setOverId(null);
      return;
    }
    if (dragItem.current === dragOverItem.current) {
      setDraggingId(null);
      setOverId(null);
      return;
    }

    setOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragItem.current);
      const toIdx = next.indexOf(dragOverItem.current);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragItem.current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingId(null);
    setOverId(null);
  }, []);

  const resetOrder = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrder(defaultOrder);
  }, [defaultOrder]);

  /**
   * Retorna los props que se deben pasar al contenedor de cada sección.
   */
  const getSectionProps = useCallback((id) => ({
    draggable: true,
    onDragStart: () => handleDragStart(id),
    onDragEnter: () => handleDragEnter(id),
    onDragEnd: handleDragEnd,
    onDragOver: (e) => e.preventDefault(),
    'data-section-id': id,
  }), [handleDragStart, handleDragEnter, handleDragEnd]);

  return {
    order,
    draggingId,
    overId,
    getSectionProps,
    resetOrder,
  };
}
