import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, Weight, Clock, Award, Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import NGOVerification from '../components/NGOVerification';
import { useAuth } from '../context/AuthContext';

export default function NGODashboard() {
  const { user, refreshUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const verStatus = user?.ngoVerification?.status;
  const isVerified = ['EMAIL_VERIFIED', 'VERIFIED'].includes(verStatus);
  const isPending = verStatus === 'PENDING_ADMIN';

  const fetchDonations = async () => {
    if (!isVerified) return setLoading(false);
    setLoading(true);
    try {
      // Try GPS first, fallback to no coords
      const pos = await new Promise((res) =>
        navigator.geolocation?.getCurrentPosition(
          (p) => res({ lng: p.coords.longitude, lat: p.coords.latitude }),
          () => res(null),
          { timeout: 4000 }
        ) ?? res(null)
      );
      const params = pos ? `?lng=${pos.lng}&lat=${pos.lat}` : '';
      const res = await api.get(`/donations/nearby${params}`);
      setDonations(res.data.donations);
    } catch { toast.error('Failed to fetch donations.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDonations(); }, [isVerified]);

  const claimDonation = async (id) => {
    setClaiming(id);
    try {
      await api.patch(`/donations/${id}/reserve`);
      toast.success('🎉 Donation claimed successfully!');
      setDonations(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Claim failed — may already be taken.');
    } finally { setClaiming(null); }
  };

  const handleVerified = async () => {
    await refreshUser();
    window.location.reload();
  };

  // Verification wall
  if (!isVerified && !isPending) {
    return (
      <div className="min-h-screen bg-dark">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">NGO Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Complete verification to access food donations.</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <NGOVerification onVerified={handleVerified} />
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield size={16} className="text-blue-400" /> Why Verification?</h3>
              <div className="flex flex-col gap-3 text-sm text-gray-400">
                {['Protects food recipients from unverified actors', 'Ensures food goes to legitimate NGOs', 'Builds trust across the entire supply chain', 'Mumbai 2025 NGO data sourced officially'].map(t => (
                  <div key={t} className="flex items-start gap-2"><CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending approval wall
  if (isPending) {
    return (
      <div className="min-h-screen bg-dark">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Awaiting Admin Approval</h2>
          <p className="text-gray-500 text-sm">Your Darpan ID has been submitted and is under review. You'll be notified once approved. This typically takes 24–48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar links={[{ label: 'Refresh', onClick: fetchDonations }]} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              {verStatus === 'EMAIL_VERIFIED' && (
                <span className="badge bg-green-400/10 text-green-400 border border-green-400/20">
                  <CheckCircle size={10} /> Trusted NGO
                </span>
              )}
              {verStatus === 'VERIFIED' && (
                <span className="badge bg-blue-400/10 text-blue-400 border border-blue-400/20">
                  <Award size={10} /> Admin Verified
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">Nearby available food donations (within 10km)</p>
          </div>
          <button onClick={fetchDonations} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package} label="Available Nearby" value={donations.length} delay={0} />
          <StatCard icon={Shield} label="Trust Score" value={`${user?.ngoVerification?.trustScore ?? 0}/100`} color="text-blue-400" delay={0.05} />
          <StatCard icon={Weight} label="Total Weight (kg)" value={donations.reduce((a, d) => a + d.weight, 0).toFixed(1)} color="text-amber-400" delay={0.1} />
          <StatCard icon={CheckCircle} label="Est. Meals" value={donations.reduce((a, d) => a + Math.floor(d.weight / 0.5), 0)} color="text-purple-400" delay={0.15} />
        </div>

        {/* Donations grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : donations.length === 0 ? (
          <div className="card text-center py-16">
            <Package size={48} className="text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No donations nearby</h3>
            <p className="text-gray-500 text-sm">Check back later or enable location for better matching.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {donations.map((d, i) => (
                <motion.div key={d._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }} className="card flex flex-col gap-4">
                  {d.imageUrl && <img src={d.imageUrl} alt={d.foodItems} className="w-full h-40 object-cover rounded-xl -mt-2 -mx-2 w-[calc(100%+16px)]" style={{ width: 'calc(100% + 32px)', marginLeft: '-16px', marginTop: '-16px', borderRadius: '16px 16px 0 0' }} />}

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-snug">{d.foodItems}</h3>
                      <StatusBadge status={d.status} />
                    </div>
                    {d.description && <p className="text-xs text-gray-500 mt-1">{d.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Weight size={12} className="text-gray-600" />{d.weight}kg
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Package size={12} className="text-gray-600" />~{Math.floor(d.weight / 0.5)} meals
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={12} className="text-gray-600" />
                      {new Date(d.expiryTime).toLocaleDateString()}
                    </div>
                    {d.ward && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={12} className="text-gray-600" />{d.ward}
                      </div>
                    )}
                  </div>

                  {d.donorId && (
                    <p className="text-xs text-gray-600 border-t border-border pt-3">Donor: {d.donorId.name}</p>
                  )}

                  <button onClick={() => claimDonation(d._id)} disabled={claiming === d._id}
                    className="btn-primary text-sm flex items-center justify-center gap-2 mt-auto">
                    {claiming === d._id
                      ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                      : 'Claim Donation'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}