import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color = 'text-green-400', delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-light">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
    </motion.div>
  );
}