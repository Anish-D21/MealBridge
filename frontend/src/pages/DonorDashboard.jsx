import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Weight, Clock, MapPin, Upload, X, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const INITIAL_FORM = { foodItems: '', description: '', weight: '', expiryTime: '', address: '', ward: '', safetyDisclaimer: false };

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const fileRef = useRef();

  const fetchData = async () => {
    try {
      const [dRes, sRes] = await Promise.all([api.get('/donations/my'), api.get('/donations/stats')]);
      setDonations(dRes.data.donations);
      setStats(sRes.data.stats);
    } catch { toast.error('Failed to load data.'); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB.');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const getCoords = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      () => resolve(null),
      { timeout: 5000 }
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.safetyDisclaimer) return toast.error('Please accept the food safety disclaimer.');
    setLoading(true);
    try {
      const coords = await getCoords();
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coords) fd.append('coordinates', JSON.stringify(coords));
      else if (form.ward) fd.append('coordinates', JSON.stringify([72.8777, 19.0760])); // Mumbai default
      if (imageFile) fd.append('image', imageFile);

      await api.post('/donations', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Donation posted successfully! 🎉');
      setShowForm(false);
      setForm(INITIAL_FORM);
      setImageFile(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post donation.');
    } finally { setLoading(false); }
  };

  const myTotal = donations.filter(d => d.status === 'COMPLETED').reduce((a, d) => a + d.weight, 0);
  const myMeals = donations.filter(d => d.status === 'COMPLETED').reduce((a, d) => a + (d.mealsProvided || 0), 0);

  return (
    <div className="min-h-screen bg-dark">
      <Navbar links={[{ label: 'Post Donation', onClick: () => setShowForm(true) }]} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your food donations, all in one place.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> New Donation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package} label="Total Donations" value={donations.length} delay={0} />
          <StatCard icon={CheckCircle} label="Completed" value={donations.filter(d => d.status === 'COMPLETED').length} color="text-purple-400" delay={0.05} />
          <StatCard icon={Weight} label="kg Donated" value={myTotal.toFixed(1)} color="text-amber-400" delay={0.1} />
          <StatCard icon={Package} label="Meals Enabled" value={myMeals} color="text-blue-400" delay={0.15} />
        </div>

        {/* Donations list */}
        <div className="card">
          <h2 className="font-semibold mb-4">My Donations</h2>
          {fetching ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : donations.length === 0 ? (
            <div className="text-center py-12">
              <Package size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No donations yet. Post your first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {donations.map((d) => (
                <motion.div key={d._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-dark rounded-xl border border-border hover:border-gray-600 transition-colors">
                  <div className="flex gap-3 items-start">
                    {d.imageUrl && <img src={d.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-sm">{d.foodItems}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Weight size={10} />{d.weight}kg</span>
                        <span className="flex items-center gap-1"><Clock size={10} />Expires {new Date(d.expiryTime).toLocaleDateString()}</span>
                        {d.ward && <span className="flex items-center gap-1"><MapPin size={10} />{d.ward}</span>}
                      </div>
                      {d.assignedNgo && <p className="text-xs text-blue-400 mt-1">NGO: {d.assignedNgo.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {d.status === 'COMPLETED' && <span className="text-xs text-purple-400 font-mono">{d.mealsProvided} meals</span>}
                    <StatusBadge status={d.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Donation form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Post a Donation</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-light p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Food items *</label>
                  <input type="text" required placeholder="e.g. Rice, Dal, Roti (40 servings)" value={form.foodItems}
                    onChange={e => setForm(f => ({ ...f, foodItems: e.target.value }))} className="input text-sm" />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                  <textarea rows={2} placeholder="Any details about the food, packaging, etc." value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input text-sm resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Weight (kg) *</label>
                    <input type="number" required min="0.1" step="0.1" placeholder="e.g. 5.5" value={form.weight}
                      onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Expires at *</label>
                    <input type="datetime-local" required value={form.expiryTime}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={e => setForm(f => ({ ...f, expiryTime: e.target.value }))} className="input text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Mumbai Ward</label>
                    <input type="text" placeholder="e.g. K West" value={form.ward}
                      onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Address</label>
                    <input type="text" placeholder="Street address" value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input text-sm" />
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Food photo</label>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="" className="w-full h-36 object-cover rounded-xl" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-dark/80 rounded-full p-1 text-gray-300 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-green-400/40 transition-colors">
                      <Upload size={20} className="text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Click to upload (max 5MB)</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </div>

                {/* Safety disclaimer */}
                <div className="flex gap-3 p-3 bg-amber-400/5 border border-amber-400/20 rounded-xl">
                  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-400 font-medium">Food Safety Disclaimer</p>
                    <p className="text-xs text-gray-500 mt-0.5">I confirm this food is safe for consumption, properly stored, and will not cause harm to recipients.</p>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" checked={form.safetyDisclaimer}
                        onChange={e => setForm(f => ({ ...f, safetyDisclaimer: e.target.checked }))}
                        className="accent-green-400" />
                      <span className="text-xs text-gray-300">I accept this disclaimer</span>
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : 'Post Donation'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}