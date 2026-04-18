import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, X, Users, Package, Weight, Leaf, AlertCircle, Clock, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ngoRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pending-ngos'),
      ]);
      setAdminData(statsRes.data);
      setPendingNGOs(ngoRes.data.ngos);
    } catch { toast.error('Failed to load admin data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const approveNGO = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/admin/approve/${id}`);
      toast.success('✅ NGO approved!');
      setPendingNGOs(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    } finally { setActionId(null); }
  };

  const rejectNGO = async (id) => {
    setActionId(id + '-reject');
    try {
      await api.patch(`/admin/reject/${id}`);
      toast.success('NGO rejected.');
      setPendingNGOs(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    } finally { setActionId(null); }
  };

  const stats = adminData?.stats || {};
  const userBreakdown = adminData?.userBreakdown || [];
  const recentDonations = adminData?.recentDonations || [];

  const getCount = (role) => userBreakdown.find(u => u._id === role)?.count || 0;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar links={[{ label: 'Refresh', onClick: fetchData }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield size={22} className="text-red-400" /> Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Platform oversight and NGO verification.</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingNGOs.length > 0 && (
              <span className="badge bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <AlertCircle size={10} /> {pendingNGOs.length} pending
              </span>
            )}
            <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Impact stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Package} label="Total Donations" value={stats.totalDonations ?? 0} delay={0} />
          <StatCard icon={Leaf} label="Meals Provided" value={stats.totalMealsProvided ?? 0} color="text-green-400" delay={0.05} />
          <StatCard icon={Weight} label="kg Redistributed" value={(stats.totalWeightKg ?? 0).toFixed(1)} color="text-amber-400" delay={0.1} />
          <StatCard icon={Leaf} label="CO₂ Saved (kg)" value={(stats.totalCO2SavedKg ?? 0).toFixed(1)} color="text-emerald-400" delay={0.15} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Users} label="Donors" value={getCount('DONOR')} color="text-amber-400" delay={0.2} />
          <StatCard icon={Shield} label="NGOs" value={getCount('NGO')} color="text-blue-400" delay={0.25} />
          <StatCard icon={Users} label="Volunteers" value={getCount('VOLUNTEER')} color="text-purple-400" delay={0.3} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-6 w-fit">
          {[['overview', 'Recent Activity'], ['pending', `Pending NGOs${pendingNGOs.length > 0 ? ` (${pendingNGOs.length})` : ''}`]].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === val ? 'bg-green-400 text-dark' : 'text-gray-400 hover:text-light'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : tab === 'overview' ? (
          /* Recent donations */
          <div className="card">
            <h2 className="font-semibold mb-4">Recent Donations</h2>
            {recentDonations.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No donations yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentDonations.map((d, i) => (
                  <motion.div key={d._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{d.foodItems}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {d.donorId?.name} · {d.weight}kg · {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Pending NGOs */
          <div className="card">
            <h2 className="font-semibold mb-4">NGOs Pending Verification</h2>
            {pendingNGOs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-medium">All clear!</p>
                <p className="text-gray-500 text-sm mt-1">No NGOs awaiting approval.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingNGOs.map((ngo, i) => (
                  <motion.div key={ngo._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark border border-border rounded-xl">
                    <div>
                      <p className="font-semibold text-sm">{ngo.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ngo.email}</p>
                      {ngo.ngoVerification?.darpanId && (
                        <div className="flex items-center gap-1 mt-1">
                          <FileText size={11} className="text-gray-500" />
                          <span className="font-mono text-xs text-gray-400">{ngo.ngoVerification.darpanId}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                        <Clock size={10} />
                        Submitted {new Date(ngo.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => rejectNGO(ngo._id)} disabled={!!actionId}
                        className="btn-danger text-sm flex items-center gap-1.5 px-3 py-2">
                        {actionId === ngo._id + '-reject' ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <X size={14} />}
                        Reject
                      </button>
                      <button onClick={() => approveNGO(ngo._id)} disabled={!!actionId}
                        className="btn-primary text-sm flex items-center gap-1.5 px-3 py-2">
                        {actionId === ngo._id ? <div className="w-3 h-3 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}