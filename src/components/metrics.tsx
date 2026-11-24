import type { ReactNode } from "react";

export function Metrics({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="metrics">
      {items.map(({ label, value }) => (
        <div className="metric" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
