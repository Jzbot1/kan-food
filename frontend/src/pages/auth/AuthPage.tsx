import React, { useState } from 'react';
import { useAppStore, Role } from '../../store/useAppStore';
import { 
  Mail, Lock, Eye, EyeOff, Phone, User, 
  ChevronRight, Bike, Store, ArrowLeft, AlertCircle
} from 'lucide-react';

type AuthView = 'login' | 'register';

const ROLES: { id: Role; label: string; icon: React.ReactNode; color: string; gradient: string }[] = [
  {
    id: 'CUSTOMER',
    label: 'Customer',
    icon: <User className="w-5 h-5" />,
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  },
  {
    id: 'RESTAURANT_OWNER',
    label: 'Restaurant Owner',
    icon: <Store className="w-5 h-5" />,
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  },
  {
    id: 'DELIVERY_PARTNER',
    label: 'Delivery Partner',
    icon: <Bike className="w-5 h-5" />,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  },
];

import shipbiteLogo from '../../favicon/favicon-96x96.png';

export const AuthPage: React.FC = () => {
  const { login, register, authError } = useAppStore();
  const [view, setView] = useState<AuthView>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('CUSTOMER');

  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(loginEmail, loginPassword);
      setLoading(false);
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      register(regName, regEmail, regPhone, regPassword, selectedRole);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar">

      {/* Hero top band */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-6 pt-12 pb-10 overflow-hidden flex-shrink-0">
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Back button (register only) */}
        {view === 'register' && (
          <button
            onClick={() => setView('login')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        )}

        {/* Logo + Brand */}
        <div className="flex items-center gap-3 mb-5">
          <img 
            src={shipbiteLogo} 
            alt="Shipbite Logo" 
            className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-primary/30 border border-white/10 bg-white/10" 
          />
          <div>
            <h1 className="text-white text-xl font-black tracking-tight">Shipbite</h1>
            <p className="text-slate-400 text-[10px] font-medium">Multi-Vendor Food Platform</p>
          </div>
        </div>

        <h2 className="text-white text-2xl font-black leading-tight">
          {view === 'login' ? 'Welcome back 👋' : 'Create Account 🚀'}
        </h2>
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
          {view === 'login'
            ? 'Sign in to continue to your dashboard'
            : 'Join as customer, restaurant owner, or delivery partner'}
        </p>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-5 py-6 space-y-5">

        {/* Error Banner */}
        {authError && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-danger font-semibold leading-relaxed">{authError}</p>
          </div>
        )}

        {/* ===== LOGIN FORM ===== */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-text focus:outline-none focus:bg-white focus:border-primary/40 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-text focus:outline-none focus:bg-white focus:border-primary/40 transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl text-sm tracking-wide shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ChevronRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Switch to Register */}
            <p className="text-center text-xs text-text-secondary pt-1">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setView('register')}
                className="text-primary font-black hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ===== REGISTER FORM ===== */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Role Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider block">Join as</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border bg-gradient-to-br transition-all ${
                      selectedRole === r.id
                        ? `${r.gradient} ring-1 ring-current`
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={selectedRole === r.id ? r.color : 'text-slate-400'}>{r.icon}</span>
                    <span className={`text-[10px] font-black ${selectedRole === r.id ? r.color : 'text-slate-500'}`}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-text focus:outline-none focus:bg-white focus:border-primary/40 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-text focus:outline-none focus:bg-white focus:border-primary/40 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-text focus:outline-none focus:bg-white focus:border-primary/40 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showRegPass ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-text focus:outline-none focus:bg-white focus:border-primary/40 transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* T&C note */}
            <p className="text-[9px] text-slate-400 leading-relaxed text-center">
              By registering, you agree to Shipbite's{' '}
              <span className="text-primary font-bold">Terms of Service</span> and{' '}
              <span className="text-primary font-bold">Privacy Policy</span>.
            </p>

            {/* Create Account CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl text-sm tracking-wide shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ChevronRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Switch to Login */}
            <p className="text-center text-xs text-text-secondary pt-1 pb-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-primary font-black hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};
