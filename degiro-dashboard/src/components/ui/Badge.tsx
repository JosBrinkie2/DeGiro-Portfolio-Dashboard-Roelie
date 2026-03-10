import clsx from 'clsx';

type BadgeVariant = 'green' | 'red' | 'neutral' | 'blue';

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        {
          'bg-green-100 text-green-800': variant === 'green',
          'bg-red-100 text-red-800': variant === 'red',
          'bg-slate-100 text-slate-700': variant === 'neutral',
          'bg-blue-100 text-blue-800': variant === 'blue',
        }
      )}
    >
      {children}
    </span>
  );
}
