interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", title, action, style }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 ${className}`}
      style={style}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-dim)]",
    secondary: "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--card-border)]",
    danger: "bg-red-100 text-red-700 hover:bg-red-200",
    ghost: "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs text-[var(--muted)]">{label}</span>}
      <input
        className={`w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs text-[var(--muted)]">{label}</span>}
      <select
        className={`w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-xs text-[var(--muted)]">{label}</span>}
      <textarea
        className={`w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] ${className}`}
        rows={2}
        {...props}
      />
    </label>
  );
}
