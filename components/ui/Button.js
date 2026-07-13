export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-sans font-bold tracking-tight transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const sizes = {
    sm: 'h-9 px-3.5 text-sm rounded-lg',
    md: 'h-10 px-5 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-xl',
  };

  const variants = {
    primary:
      'bg-accent text-white hover:bg-accent-hover shadow-[0_8px_22px_rgba(255,92,74,0.28)]',
    secondary:
      'bg-surface text-ink border-2 border-line hover:border-accent/40 hover:bg-surface-2',
    ghost: 'bg-transparent text-ink hover:bg-accent-soft hover:text-accent',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
