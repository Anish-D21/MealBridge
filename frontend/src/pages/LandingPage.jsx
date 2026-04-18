import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ArrowRight, Users, Truck, Building2, TrendingUp, Shield, Zap } from 'lucide-react';

const STATS = [
  { value: '2,400+', label: 'Meals Delivered' },
  { value: '180+', label: 'NGO Partners' },
  { value: '3.2T', label: 'CO₂ Saved (kg)' },
  { value: '92', label: 'Mumbai Wards' },
];

const FEATURES = [
  { icon: Shield, title: 'Trust-First NGO Verification', desc: 'Fuzzy-matched against the official Mumbai 2025 NGO directory. OTP-verified email. Zero fake actors.' },
  { icon: Zap, title: 'Atomic Claiming', desc: 'Race-condition-proof donation reservations. When an NGO claims food, it\'s locked instantly at the database level.' },
  { icon: TrendingUp, title: 'Real-Time Impact', desc: 'Every completed delivery auto-calculates meals provided and CO₂ saved using SDG-aligned formulas.' },
];

const ROLES = [
  { icon: Users, role: 'Donor', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', desc: 'Post surplus food in 60 seconds with photo upload and location.' },
  { icon: Building2, role: 'NGO', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', desc: 'Browse verified nearby donations. Claim with one tap. Track impact.' },
  { icon: Truck, role: 'Volunteer', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', desc: 'Accept delivery tasks in your area. Mark complete. Make a difference.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark text-light overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-dark" />
          </div>
          <span className="font-semibold text-lg">FoodBridge <span className="text-gray-500 font-normal">Mumbai</span></span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/login')} className="btn-secondary text-sm py-2 px-4">Login</button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2 px-4">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Mumbai Phase — Live
          </span>
          <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6">
            No Food <br />
            <span className="text-green-400">Goes to Waste.</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            A zero-cost platform connecting Mumbai's surplus food donors with verified NGOs and volunteers — in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/register')} className="btn-primary flex items-center gap-2 justify-center text-base">
              Join the Platform <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary text-base">
              I already have an account
            </button>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
          {STATS.map((s, i) => (
            <div key={i} className="card text-center py-5">
              <p className="text-2xl font-bold text-green-400">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Roles */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Three Roles. One Mission.</h2>
        <p className="text-gray-500 text-center text-sm mb-10">Register as whichever role fits you best.</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {ROLES.map(({ icon: Icon, role, color, bg, desc }) => (
            <motion.div key={role} whileHover={{ y: -4 }} className={`card border ${bg} cursor-pointer`} onClick={() => navigate('/register')}>
              <div className={`w-10 h-10 rounded-xl border ${bg} flex items-center justify-center ${color} mb-4`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-light mb-2">{role}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border">
        <h2 className="text-2xl font-bold text-center mb-10">Built for Trust & Scale</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card">
              <Icon size={20} className="text-green-400 mb-3" />
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flow diagram */}
      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-border text-center">
        <h2 className="text-2xl font-bold mb-10">How It Works</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {['Donor Posts Food', 'NGO Claims It', 'Volunteer Delivers', 'Impact Recorded'].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="card py-3 px-4 text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 bg-green-400/20 text-green-400 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                {step}
              </div>
              {i < 3 && <ArrowRight size={14} className="text-border hidden sm:block flex-shrink-0" />}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf size={14} className="text-green-400" />
          <span className="font-medium text-light">FoodBridge Mumbai</span>
        </div>
        <p>Zero-cost. Open-source. SDG-aligned. Built for Mumbai, scalable for India.</p>
      </footer>
    </div>
  );
}