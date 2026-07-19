import React, { useState } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, Phone, User, X, AlertCircle, 
  ChevronRight, Chrome, Bike, Store
} from 'lucide-react';
import { useAppStore, Role } from '../../store/useAppStore';
import { motion } from 'framer-motion';

import shipbiteLogo from '../../favicon/favicon-96x96.png';

interface AuthModalProps {
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialTab?: 'login' | 'register';
}

const ROLES: { id: Role; label: string; icon: React.ReactNode; color: string; gradient: string }[] = [
  {
    id: 'CUSTOMER',
    label: 'Customer',
    icon: <User className="w-4 h-4" />,
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  },
  {
    id: 'RESTAURANT_OWNER',
    label: 'Merchant',
    icon: <Store className="w-4 h-4" />,
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  },
  {
    id: 'DELIVERY_PARTNER',
    label: 'Driver',
    icon: <Bike className="w-4 h-4" />,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  },
];


export const AuthModal: React.FC<AuthModalProps> = ({ 
  onClose, 
  title = 'Join Shipbite',
  subtitle = 'Login or create an account to start placing orders and managing your dashboard.',
  initialTab = 'login'
}) => {
  const { login, register, authError, addAuditLog } = useAppStore();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('CUSTOMER');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(emailInput, passInput);
      setLoading(false);
      if (ok) onClose();
    }, 600);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = register(regName, regEmail, regPhone, regPass, selectedRole);
      setLoading(false);
      if (ok) onClose();
    }, 600);
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4">
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-white rounded-t-[32px] sm:rounded-[28px] overflow-hidden w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl relative border border-slate-100"
      >
        {/* Header Hero Area */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-5 pt-7 pb-6 text-white flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-3">
            <img 
              src={shipbiteLogo} 
              alt="Shipbite Logo" 
              className="w-7 h-7 rounded-lg object-cover shadow-md border border-white/10 bg-white/10" 
            />
            <span className="text-xs font-black tracking-wider text-slate-300">Shipbite</span>
          </div>

          <h3 className="text-base font-black tracking-tight leading-tight">{title}</h3>
          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{subtitle}</p>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 flex-shrink-0">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all ${
                tab === t
                  ? 'bg-white text-primary shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form Body Scroll Area */}
        <div className="p-5 overflow-y-auto no-scrollbar flex-1 space-y-4">
          
          {/* Error display */}
          {authError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-danger font-semibold leading-relaxed">{authError}</p>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs text-left">
              
              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-black shadow-md mt-2 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs text-left">
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary block">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border bg-gradient-to-br transition-all ${
                        selectedRole === r.id ? `${r.gradient} ring-1 ring-current` : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <span className={selectedRole === r.id ? r.color : 'text-slate-400'}>{r.icon}</span>
                      <span className={`font-black ${selectedRole === r.id ? r.color : 'text-slate-500'}`}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white"
                  placeholder="Ramesh Kumar"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white"
                  placeholder="ramesh@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-secondary">Password</label>
                <input
                  type="password"
                  required
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white"
                  placeholder="Min 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-black shadow-md mt-2 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Account <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* Social Sign In Shortcuts */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                login('customer@shipbite.com', 'demo1234');
                addAuditLog('User logged in via Google SSO');
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100/60 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            >
              <Chrome className="w-4 h-4 text-red-500" />
              <span>Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                login('customer@shipbite.com', 'demo1234');
                addAuditLog('User logged in via OTP Verification');
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100/60 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Continue with Phone Number</span>
            </button>
          </div>

          {/* Continue as Guest */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors mt-2"
          >
            Continue as Guest (Browse Only)
          </button>

        </div>
      </motion.div>
    </div>
  );
};
