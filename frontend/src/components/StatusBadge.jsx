import { Circle } from 'lucide-react';

const STATUS_MAP = {
  AVAILABLE: { cls: 'status-available', label: 'Available' },
  RESERVED: { cls: 'status-reserved', label: 'Reserved' },
  IN_TRANSIT: { cls: 'status-transit', label: 'In Transit' },
  COMPLETED: { cls: 'status-completed', label: 'Completed' },
  EXPIRED: { cls: 'status-expired', label: 'Expired' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { cls: 'badge bg-gray-500/10 text-gray-400', label: status };
  return <span className={s.cls}><Circle size={6} className="fill-current" />{s.label}</span>;
}