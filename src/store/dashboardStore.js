import { create } from 'zustand';
import { fetchJiraAll, JQL, categorize, countByStatus } from '../utils/jira';
import { getAllTeamMembers, updateTeamMember, calculateMemberMetrics } from '../utils/teamDB';

const API = '';

export const useDashboardStore = create((set, get) => ({
  // ── Estado ──────────────────────────────────────────────────────────────
  loading:       true,
  filterLoading: false,   // loader ligero para cambios de filtro/tablero/sprint
  loadingMsg:    'Consultando Jira...',
  error:         null,
  lastUpdated:   null,

  // ── Estado del equipo (compartido entre ExecutiveSummary y TabCostosRentabilidad) ──
  teamData:        [],   // miembros con métricas calculadas
  teamDataLoading: true,

  // ── Ajustes de margen (costos/ingresos adicionales) ──────────────────────
  extraCosts:    [],
  extraRevenues: [],
  ajustesLoading: false,

  // Issues crudos (sin filtrar)
  rawIssues: {
    issHfMvp: [], issHfR1: [], issHabFront: [],
    issHabBack: [], issHt: [], issDef: [],
  },
  rawIssuesBase: null, // copia inmutable para restaurar

  // Filtros
  activeFilter: 'all',       // 'all' | 'pragma' | 'mercantil'
  advFilters: {
    boardId: '1636', sprintId: '', sprintName: '',
    createdFrom: '', createdTo: '',
  },

  // Filtros de versión locales por tab (para sincronizar con Resumen Ejecutivo)
  tabVersionFilters: {
    hfMvp: 'MVP_Banca_Personas',  // versión por defecto para MVP
    hfR1: '',   // versión seleccionada en TabHF para R1
  },

  // Issues filtrados por versión (para sincronizar TabHF con ExecutiveSummary)
  tabFilteredIssues: {
    hfMvp: null,  // null = usar rawIssues, array = issues filtrados por versión
    hfR1: null,
  },

  // Tableros y sprints
  boards:      [],
  boardsCache: {},
  versions:    [],   // versiones del proyecto NT

  // ── Acciones ─────────────────────────────────────────────────────────────
  loadDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const [issHfMvp, issHfR1, issHabFront, issHabBack, issHt, issDef] =
        await Promise.all([
          fetchJiraAll(JQL.hfMvp),
          fetchJiraAll(JQL.hfR1),
          fetchJiraAll(JQL.habFront),
          fetchJiraAll(JQL.habBack),
          fetchJiraAll(JQL.ht),
          fetchJiraAll(JQL.def),
        ]);

      const raw = { issHfMvp, issHfR1, issHabFront, issHabBack, issHt, issDef };
      set({
        rawIssues:     raw,
        rawIssuesBase: raw,
        lastUpdated:   new Date(),
        loading:       false,
      });

      // Cargar tableros, versiones, equipo y ajustes en paralelo
      get().loadBoards();
      get().loadVersions();
      get().loadTeamData();
      get().loadAjustesMargen();
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  // ── Equipo ───────────────────────────────────────────────────────────────
  loadTeamData: async () => {
    set({ teamDataLoading: true });
    try {
      const members = await getAllTeamMembers();
      const withMetrics = members.map(m => calculateMemberMetrics(m, 22));
      set({ teamData: withMetrics, teamDataLoading: false });
    } catch (err) {
      console.error('Error cargando equipo:', err);
      set({ teamDataLoading: false });
    }
  },

  // Actualiza un miembro en IndexedDB y recarga el estado global
  updateTeamMemberAndRefresh: async (member) => {
    await updateTeamMember(member);
    get().loadTeamData();
  },

  // ── Ajustes de margen ────────────────────────────────────────────────────
  loadAjustesMargen: async () => {
    set({ ajustesLoading: true });
    try {
      const res  = await fetch('/api/ajustes-margen');
      if (!res.ok) throw new Error(`ajustes-margen GET: ${res.status}`);
      const data = await res.json();
      set({ extraCosts: data.extraCosts, extraRevenues: data.extraRevenues });
    } catch (err) {
      console.error('Error cargando ajustes:', err);
    } finally {
      set({ ajustesLoading: false });
    }
  },

  setAjustesMargen: async (extraCosts, extraRevenues) => {
    // Optimistic update
    set({ extraCosts, extraRevenues });
    try {
      const res = await fetch('/api/ajustes-margen', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ extraCosts, extraRevenues }),
      });
      if (!res.ok) throw new Error(`ajustes-margen POST: ${res.status}`);
      const data = await res.json();
      // Actualizar con los IDs reales devueltos por la DB
      set({ extraCosts: data.extraCosts, extraRevenues: data.extraRevenues });
    } catch (err) {
      console.error('Error guardando ajustes:', err);
    }
  },

  loadVersions: async () => {
    try {
      const res  = await fetch(`${API}/api/versions?project=NT`);
      if (!res.ok) return;
      const data = await res.json();
      // Filtrar solo versiones no archivadas y ordenar por fecha de inicio desc
      const versions = (data || [])
        .filter(v => !v.archived)
        .sort((a, b) => {
          if (a.startDate && b.startDate) return new Date(b.startDate) - new Date(a.startDate);
          return 0;
        });
      set({ versions });
    } catch { /* silencioso */ }
  },

  loadBoards: async () => {
    try {
      const res  = await fetch(`${API}/api/boards?project=NT`);
      if (!res.ok) return;
      const data = await res.json();
      const cache = {};
      (data.values || []).forEach(b => { cache[b.id] = { name: b.name, sprints: [] }; });
      set({ boards: data.values || [], boardsCache: cache });

      // Auto-cargar sprints del tablero por defecto (1636 - Delivery PN)
      const defaultBoard = data.values?.find(b => String(b.id) === '1636');
      if (defaultBoard) {
        get().loadBoardSprints('1636');
      }
    } catch { /* silencioso */ }
  },

  loadBoardSprints: async (boardId) => {
    set({ filterLoading: true, loadingMsg: 'Cargando sprints...' });
    const { boardsCache } = get();
    if (boardsCache[boardId]?.sprints?.length) {
      set({ filterLoading: false });
      return boardsCache[boardId].sprints;
    }
    try {
      const res  = await fetch(`${API}/api/board-sprints?boardId=${boardId}&state=active,future,closed`);
      if (!res.ok) { set({ filterLoading: false }); return []; }
      const data = await res.json();
      const sprints = data.values || [];
      set(s => ({
        filterLoading: false,
        boardsCache: { ...s.boardsCache, [boardId]: { ...s.boardsCache[boardId], sprints } },
      }));
      return sprints;
    } catch { set({ filterLoading: false }); return []; }
  },

  loadBoardIssues: async (boardId, sprintId = '') => {
    set({ filterLoading: true, loadingMsg: sprintId ? 'Cargando sprint...' : 'Cargando tablero...' });
    let all = [], startAt = 0;
    while (true) {
      const url = sprintId
        ? `${API}/api/board-issues?boardId=${boardId}&sprintId=${sprintId}&maxResults=100&startAt=${startAt}`
        : `${API}/api/board-issues?boardId=${boardId}&maxResults=100&startAt=${startAt}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const issues = data.issues || [];
      all = all.concat(issues);
      if (all.length >= (data.total || 0) || issues.length === 0) break;
      startAt += 100;
    }
    // Excluir Desestimado/Reclasificado de todos los tipos al cargar por tablero
    const notExcluded = i => {
      const s = i.fields?.status?.name || '';
      return s !== 'Desestimado' && s !== 'Reclasificado';
    };
    const byType = t => all.filter(i => i.fields?.issuetype?.name === t && notExcluded(i));
    const raw = {
      issHfMvp:    byType('Historia Funcional'),
      issHfR1:     byType('Historia Funcional'),
      issHabFront: byType('Habilitador Front'),
      issHabBack:  byType('Habilitador Back'),
      issHt:       byType('HT Backend'),
      issDef:      byType('Defecto'),
    };
    set({ rawIssues: raw, filterLoading: false });
  },

  restoreBaseIssues: () => {
    const { rawIssuesBase } = get();
    if (rawIssuesBase) set({ rawIssues: rawIssuesBase });
  },

  setActiveFilter: (f) => set({ activeFilter: f }),
  setAdvFilters:   (f) => set(s => ({ advFilters: { ...s.advFilters, ...f } })),
  clearAdvFilters: () => {
    get().restoreBaseIssues();
    set({ advFilters: { boardId: '1636', sprintId: '', sprintName: '', createdFrom: '', createdTo: '' } });
  },

  // Setters para filtros de versión por tab
  setTabVersionFilter: (tab, version) => set(s => ({
    tabVersionFilters: { ...s.tabVersionFilters, [tab]: version }
  })),
  clearTabVersionFilters: () => set({ 
    tabVersionFilters: { hfMvp: '', hfR1: '' },
    tabFilteredIssues: { hfMvp: null, hfR1: null }
  }),

  // Setter para issues filtrados por versión
  setTabFilteredIssues: (tab, issues) => set(s => ({
    tabFilteredIssues: { ...s.tabFilteredIssues, [tab]: issues }
  })),

  // ── Selector: issues filtrados ───────────────────────────────────────────
  // skipVersionFilter: true → no aplica el filtro de versión del header
  // (para arrays que ya tienen fixVersion fija en su JQL, como issHfMvp e issHfR1)
  getFilteredIssues: (key, skipVersionFilter = false) => {
    const { rawIssues, activeFilter, advFilters } = get();
    let issues = rawIssues[key] || [];

    // Siempre excluir Desestimado y Reclasificado (doble seguridad además del JQL)
    issues = issues.filter(i => {
      const s = i.fields?.status?.name || '';
      return s !== 'Desestimado' && s !== 'Reclasificado';
    });

    if (activeFilter !== 'all') {
      issues = issues.filter(i => {
        const email    = i.fields?.assignee?.emailAddress || '';
        const isPragma = email.includes('_pragma@');
        return activeFilter === 'pragma' ? isPragma : !isPragma;
      });
    }
    if (advFilters.createdFrom) {
      const from = new Date(advFilters.createdFrom + 'T00:00:00');
      issues = issues.filter(i => i.fields?.created && new Date(i.fields.created) >= from);
    }
    if (advFilters.createdTo) {
      const to = new Date(advFilters.createdTo + 'T23:59:59');
      issues = issues.filter(i => i.fields?.created && new Date(i.fields.created) <= to);
    }
    // El filtro de versión NO aplica a arrays con versión fija en su JQL
    if (advFilters.version && !skipVersionFilter) {
      issues = issues.filter(i =>
        (i.fields?.fixVersions || []).some(v => v.name === advFilters.version)
      );
    }
    return issues;
  },
}));
