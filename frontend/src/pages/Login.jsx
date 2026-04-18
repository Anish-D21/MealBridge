import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const ROLE_ROUTES = { DONOR: '/donor', NGO: '/ngo', VOLUNTEER: '/volunteer', ADMIN: '/admin' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(ROLE_ROUTES[user.role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface border-r border-border p-12">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-dark" />
          </div>
          <span className="font-semibold text-lg">FoodBridge <span className="text-gray-500 font-normal">Mumbai</span></span>
        </div>
        <div>
          <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-bold text-light mb-4">
            Every meal<br /><span className="text-green-400">counts.</span>
          </motion.h2>
          <p className="text-gray-500">Sign back in to continue your work connecting surplus food with those who need it most.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[['2,400+', 'Meals Delivered'], ['180+', 'Verified NGOs'], ['3.2T kg', 'CO₂ Saved'], ['92', 'Wards Covered']].map(([v, l]) => (
            <div key={l} className="bg-dark rounded-xl p-4 border border-border">
              <p className="text-xl font-bold text-green-400">{v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 bg-green-400 rounded-lg flex items-center justify-center">
              <Leaf size={14} className="text-dark" />
            </div>
            <span className="font-semibold">FoodBridge Mumbai</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your FoodBridge account.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" required placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPass ? 'text' : 'password'} required placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 mt-2">
              {loading ? <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-400 hover:underline font-medium">Register here</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}