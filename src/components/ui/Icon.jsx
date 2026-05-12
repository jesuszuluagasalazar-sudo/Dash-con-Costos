/**
 * Icon — wrapper para Material Icons Round
 * Uso: <Icon name="check_circle" size={20} color="#22c55e" />
 */
export function Icon({ name, size = 20, color, style = {}, className = '' }) {
  return (
    <span
      className={`material-icons-round ${className}`}
      style={{
        fontSize: size,
        color,
        lineHeight: 1,
        verticalAlign: 'middle',
        userSelect: 'none',
        ...style,
      }}
    >
      {name}
    </span>
  );
}
