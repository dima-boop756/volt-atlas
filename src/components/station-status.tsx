import { statusLabels, type Status } from "@/lib/catalog";

export function StationStatus({ status }: { status: Status }) {
  return <span className={`station-status status-${status}`}><i aria-hidden />{statusLabels[status]}</span>;
}
