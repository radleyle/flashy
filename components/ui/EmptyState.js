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
    <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted leading-relaxed">
          {description}
        </p>
      ) : null}
      {actionHref ? (
        <Link href={actionHref} className="mt-5 inline-block">
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
      {onAction && !actionHref ? (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
