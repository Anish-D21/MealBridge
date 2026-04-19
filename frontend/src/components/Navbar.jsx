import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Leaf, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_COLORS = {
  DONOR: 'text-amber-400',
  NGO: 'text-blue-400',
  VOLUNTEER: 'text-purple-400',
  ADMIN: 'text-red-400',
};

export default function Navbar({ links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-dark/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-dark" />
          </div>
          <span className="font-semibold text-light text-lg">FoodBridge</span>
          <span className="text-gray-500 text-sm hidden sm:block">Mumbai</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <button key={link.label} onClick={link.onClick} className="text-gray-400 hover:text-light text-sm transition-colors">
              {link.label}
            </button>
          ))}
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-light">{user?.name}</p>
            <p className={`text-xs font-mono ${ROLE_COLORS[user?.role]}`}>{user?.role}</p>
          </div>
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-light transition-colors rounded-lg">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10">
            <LogOut size={16} />
          </button>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-2">
            {links.map((link) => (
              <button key={link.label} onClick={() => { link.onClick(); setMenuOpen(false); }}
                className="text-left text-gray-300 hover:text-light py-2 text-sm">{link.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}