import Link from 'next/link';
import Button from './Button';

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted leading-relaxed">
          {description}
        </p>
      ) : null}
      {actionHref ? (
        <Link href={actionHref} className="mt-6 inline-block">
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
      {onAction && !actionHref ? (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
