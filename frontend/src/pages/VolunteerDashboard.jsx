import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Package, CheckCircle, MapPin, Weight, Clock, Building2, RefreshCw, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function VolunteerDashboard() {
  const [available, setAvailable] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [tab, setTab] = useState('available'); // 'available' | 'my'
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [avRes, myRes] = await Promise.all([
        api.get('/donations/reserved'),
        api.get('/donations/volunteer/my-tasks'),
      ]);
      setAvailable(avRes.data.donations);
      setMyTasks(myRes.data.tasks);
    } catch { toast.error('Failed to load tasks.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const acceptTask = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/donations/${id}/accept-delivery`);
      toast.success('Task accepted! Go pick up the food. 🚚');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept task.');
    } finally { setActionId(null); }
  };

  const completeTask = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/donations/${id}/complete`);
      toast.success('🎉 Delivery completed! Impact recorded.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark as complete.');
    } finally { setActionId(null); }
  };

  const totalCompleted = myTasks.filter(t => t.status === 'COMPLETED').length;
  const totalWeight = myTasks.filter(t => t.status === 'COMPLETED').reduce((a, t) => a + t.weight, 0);

  return (
    <div className="min-h-screen bg-dark">
      <Navbar links={[{ label: 'Refresh', onClick: fetchData }]} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Volunteer Hub</h1>
            <p className="text-gray-500 text-sm mt-0.5">Pick up and deliver food to verified NGOs.</p>
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package} label="Available Tasks" value={available.length} delay={0} />
          <StatCard icon={Truck} label="My Active" value={myTasks.filter(t => t.status === 'IN_TRANSIT').length} color="text-blue-400" delay={0.05} />
          <StatCard icon={CheckCircle} label="Completed" value={totalCompleted} color="text-purple-400" delay={0.1} />
          <StatCard icon={Weight} label="kg Delivered" value={totalWeight.toFixed(1)} color="text-amber-400" delay={0.15} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 mb-6 w-fit">
          {[['available', 'Available Tasks'], ['my', 'My Deliveries']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === val ? 'bg-green-400 text-dark' : 'text-gray-400 hover:text-light'}`}>
              {label}
              {val === 'available' && available.length > 0 && (
                <span className="ml-1.5 bg-dark/30 text-xs px-1.5 py-0.5 rounded-full">{available.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Available tasks */}
            {tab === 'available' && (
              <motion.div key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {available.length === 0 ? (
                  <div className="card text-center py-16">
                    <Truck size={48} className="text-gray-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">No tasks available</h3>
                    <p className="text-gray-500 text-sm">NGOs haven't claimed any donations yet. Check back soon.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {available.map((d, i) => (
                      <motion.div key={d._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="card flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{d.foodItems}</h3>
                            <StatusBadge status={d.status} />
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Weight size={11} />{d.weight}kg</span>
                            <span className="flex items-center gap-1"><Package size={11} />~{Math.floor(d.weight / 0.5)} meals</span>
                            {d.ward && <span className="flex items-center gap-1"><MapPin size={11} />{d.ward}</span>}
                            <span className="flex items-center gap-1"><Clock size={11} />Expiry {new Date(d.expiryTime).toLocaleDateString()}</span>
                          </div>
                          {d.assignedNgo && (
                            <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                              <Building2 size={11} /> Deliver to: {d.assignedNgo.name}
                            </p>
                          )}
                          {d.donorId && (
                            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                              <Navigation size={11} /> Pick up from: {d.donorId.name}
                              {d.donorId.phone && ` · ${d.donorId.phone}`}
                            </p>
                          )}
                        </div>
                        <button onClick={() => acceptTask(d._id)} disabled={actionId === d._id}
                          className="btn-primary text-sm whitespace-nowrap flex items-center gap-2">
                          {actionId === d._id ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : <><Truck size={14} /> Accept Task</>}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* My tasks */}
            {tab === 'my' && (
              <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {myTasks.length === 0 ? (
                  <div className="card text-center py-16">
                    <CheckCircle size={48} className="text-gray-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">No deliveries yet</h3>
                    <p className="text-gray-500 text-sm">Accept a task to see it here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {myTasks.map((d, i) => (
                      <motion.div key={d._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="card flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{d.foodItems}</h3>
                            <StatusBadge status={d.status} />
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Weight size={11} />{d.weight}kg</span>
                            {d.mealsProvided && <span className="flex items-center gap-1 text-purple-400"><Package size={11} />{d.mealsProvided} meals</span>}
                            {d.co2Saved && <span className="flex items-center gap-1 text-green-400">🌱 {d.co2Saved}kg CO₂ saved</span>}
                          </div>
                          {d.assignedNgo && <p className="text-xs text-blue-400 mt-1">NGO: {d.assignedNgo.name}</p>}
                          {d.completedAt && <p className="text-xs text-gray-600 mt-0.5">Completed: {new Date(d.completedAt).toLocaleDateString()}</p>}
                        </div>
                        {d.status === 'IN_TRANSIT' && (
                          <button onClick={() => completeTask(d._id)} disabled={actionId === d._id}
                            className="btn-primary text-sm whitespace-nowrap flex items-center gap-2">
                            {actionId === d._id ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : <><CheckCircle size={14} /> Mark Delivered</>}
                          </button>
                        )}
                        {d.status === 'COMPLETED' && (
                          <span className="badge bg-purple-400/10 text-purple-400 border border-purple-400/20 whitespace-nowrap">
                            <CheckCircle size={10} /> Delivered
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}