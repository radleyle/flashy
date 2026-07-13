export default function Input({
  label,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={`w-full h-11 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      />
    </label>
  );
}
