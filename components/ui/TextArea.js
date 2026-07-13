export default function TextArea({
  label,
  className = '',
  id,
  rows = 4,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 resize-y ${className}`}
        {...props}
      />
    </label>
  );
}
