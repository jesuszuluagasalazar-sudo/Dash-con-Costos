import { STATUS_DONE, STATUS_QA, STATUS_IN_PROGRESS, STATUS_REFINEMENT } from '../../utils/jira';

export function StatusBadge({ status }) {
  if (!status) return <span>—</span>;
  let cls = 'badge-pend';
  if (STATUS_DONE.includes(status))             cls = 'badge-done';
  else if (STATUS_QA.includes(status))          cls = 'badge-qa';
  else if (STATUS_IN_PROGRESS.includes(status)) cls = 'badge-prog';
  else if (STATUS_REFINEMENT.includes(status))  cls = 'badge-ref';
  return <span className={`badge ${cls}`}>{status}</span>;
}

const PRIO_ICONS = {
  Highest: { icon: '⬆⬆', cls: 'prio-highest' },
  High:    { icon: '⬆',  cls: 'prio-high' },
  Medium:  { icon: '▶',  cls: 'prio-medium' },
  Low:     { icon: '⬇',  cls: 'prio-low' },
  Lowest:  { icon: '⬇⬇', cls: 'prio-lowest' },
};

export function PriorityIcon({ priority }) {
  if (!priority) return null;
  const p = PRIO_ICONS[priority.name];
  if (!p) return null;
  return <span className={`priority-icon ${p.cls}`}>{p.icon}</span>;
}
