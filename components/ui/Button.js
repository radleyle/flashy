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
    'inline-flex items-center justify-center gap-2 font-sans font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none';

  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-lg',
    md: 'h-11 px-5 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-xl',
  };

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-white text-ink border border-line hover:bg-canvas',
    ghost: 'bg-transparent text-ink hover:bg-white/70',
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
