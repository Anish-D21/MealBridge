import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, User, Mail, Lock, Phone, Users, Building2, Truck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'DONOR', label: 'Donor', icon: Users, desc: 'I have surplus food to donate', color: 'text-amber-400', border: 'border-amber-400/40 bg-amber-400/5' },
  { value: 'NGO', label: 'NGO', icon: Building2, desc: 'We distribute food to communities', color: 'text-blue-400', border: 'border-blue-400/40 bg-blue-400/5' },
  { value: 'VOLUNTEER', label: 'Volunteer', icon: Truck, desc: 'I can handle food delivery', color: 'text-purple-400', border: 'border-purple-400/40 bg-purple-400/5' },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const ROLE_ROUTES = { DONOR: '/donor', NGO: '/ngo', VOLUNTEER: '/volunteer' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Please select your role.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created! Welcome to FoodBridge.');
      navigate(ROLE_ROUTES[user.role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-dark" />
          </div>
          <span className="font-semibold text-lg">FoodBridge <span className="text-gray-500 font-normal">Mumbai</span></span>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-6">Join Mumbai's food redistribution network.</p>

          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">I am a...</label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(({ value, label, icon: Icon, desc, color, border }) => (
                <button key={value} type="button"
                  onClick={() => setForm(f => ({ ...f, role: value }))}
                  className={`rounded-xl border p-3 text-center transition-all duration-200 ${form.role === value ? `${border} border-2` : 'border-border hover:border-gray-600'}`}>
                  <Icon size={20} className={`${color} mx-auto mb-1`} />
                  <p className={`text-xs font-semibold ${form.role === value ? color : 'text-gray-400'}`}>{label}</p>
                  <p className="text-gray-600 text-xs mt-0.5 hidden sm:block leading-tight">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Full name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" required placeholder="Your name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input pl-9 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Phone (optional)</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="input pl-9 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" required placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input pl-9 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPass ? 'text' : 'password'} required minLength={6} placeholder="Min. 6 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pl-9 pr-9 text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !form.role} className="btn-primary flex items-center justify-center gap-2 mt-1">
              {loading ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                : <>{form.role ? `Register as ${form.role}` : 'Select a role to continue'} <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-green-400 hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}