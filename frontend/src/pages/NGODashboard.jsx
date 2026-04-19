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
  const [nearby, setNearby] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [tab, setTab] = useState('available'); // 'available', 'claims', 'history'
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'expiryAsc', 'expiryDesc'
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const verStatus = user?.ngoVerification?.status;
  const isVerified = ['EMAIL_VERIFIED', 'VERIFIED'].includes(verStatus);
  const isPending = verStatus === 'PENDING_ADMIN';

  const fetchDonations = async () => {
    if (!isVerified) return setLoading(false);
    setLoading(true);
    try {
      const pos = await new Promise((res) =>
        navigator.geolocation?.getCurrentPosition(
          (p) => res({ lng: p.coords.longitude, lat: p.coords.latitude }),
          () => res(null),
          { timeout: 4000 }
        ) ?? res(null)
      );
      const params = pos ? `?lng=${pos.lng}&lat=${pos.lat}` : '';
      
      const [nearbyRes, claimsRes] = await Promise.all([
        api.get(`/donations/nearby${params}`),
        api.get('/donations/ngo/claims')
      ]);

      setNearby(nearbyRes.data.donations);
      setMyClaims(claimsRes.data.claims);
    } catch { toast.error('Failed to fetch donations.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDonations(); }, [isVerified]);

  const claimDonation = async (id, e) => {
    e.stopPropagation();
    setClaiming(id);
    try {
      await api.patch(`/donations/${id}/reserve`);
      toast.success('🎉 Donation claimed successfully!');
      fetchDonations(); // Refresh to move it to My Claims
    } catch (err) {
      toast.error(err.response?.data?.message || 'Claim failed — may already be taken.');
    } finally { setClaiming(null); }
  };

  let displayList = [];
  if (tab === 'available') displayList = nearby;
  else if (tab === 'claims') displayList = myClaims.filter(d => ['RESERVED', 'IN_TRANSIT'].includes(d.status));
  else if (tab === 'history') displayList = myClaims.filter(d => d.status === 'COMPLETED');

  // Sorting
  displayList = [...displayList].sort((a, b) => {
    if (sortBy === 'distance') return 0; // maintain api order
    const ta = new Date(a.expiryTime).getTime();
    const tb = new Date(b.expiryTime).getTime();
    return sortBy === 'expiryAsc' ? ta - tb : tb - ta;
  });

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
            <p className="text-gray-500 text-sm">Coordinate food pickups and deliveries.</p>
          </div>
          <button onClick={fetchDonations} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package} label="Available Nearby" value={nearby.length} delay={0} />
          <StatCard icon={Shield} label="Trust Score" value={`${user?.ngoVerification?.trustScore ?? 0}/100`} color="text-blue-400" delay={0.05} />
          <StatCard icon={Weight} label="Total Received (kg)" value={myClaims.filter(d=>d.status==='COMPLETED').reduce((a, d) => a + d.weight, 0).toFixed(1)} color="text-amber-400" delay={0.1} />
          <StatCard icon={CheckCircle} label="Est. Meals" value={myClaims.filter(d=>d.status==='COMPLETED').reduce((a, d) => a + Math.floor(d.weight / 0.5), 0)} color="text-purple-400" delay={0.15} />
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div className="flex gap-2 p-1 bg-dark rounded-lg border border-border overflow-x-auto w-fit">
               {[
                 { id: 'available', label: 'Available Nearby', count: nearby.length },
                 { id: 'claims', label: 'My Claims', count: myClaims.filter(d => ['RESERVED', 'IN_TRANSIT'].includes(d.status)).length },
                 { id: 'history', label: 'History', count: myClaims.filter(d => d.status === 'COMPLETED').length }
               ].map(t => (
                 <button key={t.id} onClick={() => setTab(t.id)}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-2 ${tab === t.id ? 'bg-surface text-light shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                   {t.label} 
                   <span className="bg-dark/50 text-gray-400 px-1.5 py-0.5 rounded-full text-[10px]">{t.count}</span>
                 </button>
               ))}
           </div>

           <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
             className="bg-dark border border-border rounded-lg px-3 py-2 text-sm text-light focus:outline-none focus:border-green-400 transition-colors w-full sm:w-auto cursor-pointer">
             <option value="distance">Sort: Distance (Nearest)</option>
             <option value="expiryAsc">Sort: Expiry (Soonest)</option>
             <option value="expiryDesc">Sort: Expiry (Latest)</option>
           </select>
        </div>

        {/* Donations grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : displayList.length === 0 ? (
          <div className="card text-center py-16">
            <Package size={48} className="text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No donations found</h3>
            <p className="text-gray-500 text-sm">There are no donations matching this view currently.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {displayList.map((d, i) => (
                <motion.div key={d._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }} 
                  onClick={() => setExpandedCardId(expandedCardId === d._id ? null : d._id)}
                  className="card flex flex-col gap-4 cursor-pointer hover:border-gray-600 transition-colors relative overflow-hidden">
                  {d.imageUrl && <img src={d.imageUrl} alt={d.foodItems} className="w-full h-40 object-cover rounded-xl -mt-2 -mx-2" style={{ width: 'calc(100% + 32px)', marginLeft: '-16px', marginTop: '-16px', borderRadius: '16px 16px 0 0' }} />}

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-snug">{d.foodItems}</h3>
                      <StatusBadge status={d.status} />
                    </div>
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
                    {d.donorId?.ward && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={12} className="text-gray-600" />{d.donorId.ward}
                      </div>
                    )}
                  </div>

                  {d.donorId && (
                    <p className="text-xs text-gray-600 border-t border-border pt-3">Donor: {d.donorId.name}</p>
                  )}

                  {/* Expanded Content */}
                  <AnimatePresence>
                     {expandedCardId === d._id && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                         <div className="pt-2 flex flex-col gap-3">
                            <div className="bg-surface p-3 rounded-xl flex flex-col gap-1 border border-border">
                              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Pickup Details</p>
                              <p className="text-light text-xs flex gap-2 items-start"><MapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0" /> <span>{d.donorId?.address || 'Address not provided'} {d.donorId?.ward ? `(${d.donorId.ward})` : ''}</span></p>
                              <p className="text-gray-400 text-xs mt-1 ml-5">Phone: <span className="text-light">{d.donorId?.phone || 'N/A'}</span></p>
                              <p className="text-amber-400/80 text-xs mt-1 ml-5 flex items-center gap-1"><Clock size={12} /> {new Date(d.expiryTime).toLocaleTimeString()}</p>
                            </div>
                            
                            {tab === 'claims' && d.status !== 'COMPLETED' && (
                              d.deliveryCode ? (
                                <div className="bg-amber-400/5 border border-amber-400/20 p-3 rounded-xl flex flex-col items-center justify-center">
                                  <p className="text-amber-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Delivery OTP</p>
                                  <p className="text-2xl font-mono text-light tracking-[0.3em] font-bold">{d.deliveryCode}</p>
                                  <p className="text-gray-500 text-[10px] mt-1 text-center">Share this carefully with the volunteer</p>
                                </div>
                              ) : (
                                <div className="bg-surface p-3 rounded-xl border border-border flex flex-col items-center justify-center">
                                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Legacy Claim</p>
                                  <p className="text-sm text-gray-500">No OTP Required</p>
                                </div>
                              )
                            )}

                            {d.assignedVolunteer && (
                               <div className="bg-surface p-3 rounded-xl border border-border flex flex-col gap-2">
                                 <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Assigned Volunteer</p>
                                 <div className="text-xs">
                                     <span className="text-purple-400 font-medium">Name:</span> <span className="text-light">{d.assignedVolunteer.name}</span>
                                     {d.assignedVolunteer.phone && <p className="text-gray-400 mt-1">Phone: <span className="text-light">{d.assignedVolunteer.phone}</span></p>}
                                 </div>
                               </div>
                            )}
                            
                            {d.description && (
                              <div className="text-xs text-gray-400 bg-surface p-3 rounded-xl border border-border">
                                <span className="font-semibold uppercase tracking-wider block mb-1">Notes</span>
                                <p className="text-light">{d.description}</p>
                              </div>
                            )}
                         </div>
                       </motion.div>
                     )}
                  </AnimatePresence>

                  {tab === 'available' && d.status === 'AVAILABLE' && (
                    <button onClick={(e) => claimDonation(d._id, e)} disabled={claiming === d._id}
                      className="btn-primary text-sm flex items-center justify-center gap-2 mt-auto">
                      {claiming === d._id
                        ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                        : 'Claim Donation'}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}