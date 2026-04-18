import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, KeyRound, FileText, CheckCircle, Shield, AlertCircle, ChevronRight, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

const STEPS = ['Search NGO', 'Confirm Email', 'Enter OTP'];

export default function NGOVerification({ onVerified }) {
  const [step, setStep] = useState(0); // 0=search, 1=email, 2=otp, 3=darpan
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [darpanId, setDarpanId] = useState('');
  const [loading, setLoading] = useState(false);

  const searchNGO = async () => {
    if (query.trim().length < 3) return toast.error('Enter at least 3 characters.');
    setLoading(true);
    try {
      const res = await api.post('/ngo/check-name', { name: query });
      if (res.data.found) {
        setResults(res.data.results);
      } else {
        toast('NGO not found in directory. Use Darpan ID instead.', { icon: 'ℹ️' });
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed.');
    } finally { setLoading(false); }
  };

  const selectNGO = (ngo) => {
    setSelected(ngo);
    setResults([]);
    setStep(1);
  };

  const verifyEmail = async () => {
    if (!email) return toast.error('Enter your email.');
    setLoading(true);
    try {
      await api.post('/ngo/verify-email', { ngoId: selected.id, email });
      toast.success('OTP sent! Check your inbox.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email verification failed.');
    } finally { setLoading(false); }
  };

  const confirmOTP = async () => {
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP.');
    setLoading(true);
    try {
      const resp = await api.post('/ngo/confirm-otp', { email, otp });

      // Update local storage with the newly verified user's token and payload
      if (resp.data.token) {
        localStorage.setItem('fb_token', resp.data.token);
        localStorage.setItem('fb_user', JSON.stringify(resp.data.user));
      }

      toast.success('✅ NGO Verified! You are now trusted.');
      onVerified();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.');
    } finally { setLoading(false); }
  };

  const submitDarpan = async () => {
    setLoading(true);
    try {
      await api.post('/ngo/submit-darpan', { darpanId });
      toast.success('Darpan ID submitted. Awaiting admin review.');
      onVerified();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-400/10 border border-blue-400/20 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg">NGO Verification</h2>
            <p className="text-xs text-gray-500">Verify your NGO to access donations</p>
          </div>
        </div>

        {/* Step indicators (not shown for darpan path) */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= step ? 'bg-green-400 text-dark' : 'bg-border text-gray-500'}`}>
                  {i < step ? <CheckCircle size={12} /> : i + 1}
                </div>
                <span className={`text-xs ${i === step ? 'text-light' : 'text-gray-500'}`}>{s}</span>
                {i < STEPS.length - 1 && <ChevronRight size={12} className="text-border" />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 0: Search */}
          {step === 0 && (
            <motion.div key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-sm text-gray-400 mb-3">Search for your NGO in the official Mumbai 2025 directory:</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" placeholder="Type your NGO name..." value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchNGO()}
                    className="input pl-9 text-sm" />
                </div>
                <button onClick={searchNGO} disabled={loading} className="btn-primary px-4 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : 'Search'}
                </button>
              </div>

              {results.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-xs text-gray-500 mb-1">Found {results.length} match(es):</p>
                  {results.map((r) => (
                    <button key={r.id} onClick={() => selectNGO(r)}
                      className="flex items-center justify-between p-3 bg-dark border border-border rounded-xl hover:border-green-400/40 hover:bg-green-400/5 transition-all text-left">
                      <div>
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Ward: {r.ward} • {r.maskedEmail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.isBmcPartner && (
                          <span className="badge bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs">
                            <Award size={10} /> BMC Partner
                          </span>
                        )}
                        <ChevronRight size={14} className="text-gray-500" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(3)} className="text-xs text-gray-500 hover:text-gray-300 mt-4 underline w-full text-center">
                My NGO is not in the directory → Use Darpan ID
              </button>
            </motion.div>
          )}

          {/* Step 1: Confirm email */}
          {step === 1 && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="p-3 bg-green-400/5 border border-green-400/20 rounded-xl mb-4">
                <p className="text-xs text-green-400 font-medium">✓ Found in directory</p>
                <p className="text-sm font-semibold mt-0.5">{selected?.name}</p>
                <p className="text-xs text-gray-500">Ward: {selected?.ward}</p>
              </div>
              <p className="text-sm text-gray-400 mb-1">The registered email for this NGO is:</p>
              <p className="font-mono text-sm text-gray-300 bg-dark border border-border rounded-lg px-3 py-2 mb-4">{selected?.maskedEmail}</p>
              <p className="text-sm text-gray-400 mb-2">Enter the full email to verify ownership:</p>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" placeholder="Full registered email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verifyEmail()}
                  className="input pl-9 text-sm" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1 text-sm">Back</button>
                <button onClick={verifyEmail} disabled={loading} className="btn-primary flex-1 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin mx-auto" /> : 'Send OTP'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 p-3 bg-blue-400/5 border border-blue-400/20 rounded-xl mb-4">
                <Mail size={14} className="text-blue-400" />
                <p className="text-xs text-blue-400">OTP sent to your registered email. Expires in 10 minutes.</p>
              </div>
              <label className="block text-sm text-gray-400 mb-2">Enter 6-digit OTP</label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" maxLength={6} placeholder="000000" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
                  className="input pl-9 text-sm font-mono tracking-widest text-center text-xl" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 text-sm">Back</button>
                <button onClick={confirmOTP} disabled={loading} className="btn-primary flex-1 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin mx-auto" /> : 'Verify OTP'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Darpan ID */}
          {step === 3 && (
            <motion.div key="darpan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-2 p-3 bg-amber-400/5 border border-amber-400/20 rounded-xl mb-4">
                <AlertCircle size={14} className="text-amber-400" />
                <p className="text-xs text-amber-400">Your NGO was not found in the Mumbai 2025 directory. Submit your Darpan ID for admin verification.</p>
              </div>
              <label className="block text-sm text-gray-400 mb-1.5">Darpan ID</label>
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="MH/XXXX/XXXXXXX" value={darpanId}
                  onChange={e => setDarpanId(e.target.value.toUpperCase())}
                  className="input pl-9 text-sm font-mono" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Format: MH/XXXX/XXXXXXX</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1 text-sm">Back</button>
                <button onClick={submitDarpan} disabled={loading || !darpanId} className="btn-primary flex-1 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin mx-auto" /> : 'Submit for Review'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}