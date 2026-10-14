const LABELS = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  PICKED_UP: 'Picked up',
  RETURNED: 'Returned',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export default function StatusBadge({ status, overdue }) {
  if (overdue) return <span className="badge badge-overdue">Overdue</span>;
  const cls = `badge badge-${status?.toLowerCase()}`;
  return <span className={cls}>{LABELS[status] || status}</span>;
}
