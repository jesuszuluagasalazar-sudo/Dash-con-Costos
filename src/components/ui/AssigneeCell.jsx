export function AssigneeCell({ assignee, onClickUser }) {
  if (!assignee) return <span style={{ color: '#bbb', fontSize: '0.78rem' }}>Sin asignar</span>;

  const name      = assignee.displayName || assignee.emailAddress || '?';
  const avatar    = assignee.avatarUrls?.['24x24'] || '';
  const accountId = assignee.accountId || '';

  return (
    <span
      className="assignee-cell assignee-link"
      onClick={() => accountId && onClickUser?.(accountId, name, avatar)}
      title={`Ver perfil de ${name}`}
      style={{ cursor: accountId ? 'pointer' : 'default' }}
    >
      {avatar && (
        <img
          className="assignee-avatar"
          src={avatar}
          alt=""
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}
      {name}
    </span>
  );
}
