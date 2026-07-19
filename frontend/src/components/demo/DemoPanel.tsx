import React, { useState } from 'react';
import { useAppStore, Role, Order } from '../../store/useAppStore';
import { 
  Play, RotateCcw, ShieldCheck, Activity, 
  ChevronRight, Zap, User, Store, Bike, Shield
} from 'lucide-react';

interface DemoPanelProps {
  isEmbedded?: boolean;
}

const ROLE_CONFIG: Record<Role, { label: string; short: string; icon: React.ReactNode; color: string; bg: string; ring: string }> = {
  CUSTOMER: {
    label: 'Customer App',
    short: 'Customer',
    icon: <User className="w-4 h-4" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/40 border-blue-500/30',
  },
  RESTAURANT_OWNER: {
    label: 'Kitchen KDS',
    short: 'Restaurant',
    icon: <Store className="w-4 h-4" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/40 border-amber-500/30',
  },
  DELIVERY_PARTNER: {
    label: 'Delivery Fleet',
    short: 'Driver',
    icon: <Bike className="w-4 h-4" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/40 border-emerald-500/30',
  },
  SUPER_ADMIN: {
    label: 'Admin Console',
    short: 'Admin',
    icon: <Shield className="w-4 h-4" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    ring: 'ring-purple-500/40 border-purple-500/30',
  },
};

const ROLE_DESCS: Record<Role, string> = {
  CUSTOMER: 'Browse restaurants, add to cart, checkout and track live delivery on Leaflet map.',
  RESTAURANT_OWNER: 'Accept incoming orders, update KDS cooking stages, manage menu & withdraw SaaS payouts.',
  DELIVERY_PARTNER: 'Accept bid, navigate route with GPS, verify customer OTP and earn per delivery.',
  SUPER_ADMIN: 'Approve vendors, manage driver onboarding, view GMV KPIs and resolve support cases.',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  ACCEPTED: 'bg-blue-500/20 text-blue-300',
  PREPARING: 'bg-orange-500/20 text-orange-300',
  READY: 'bg-teal-500/20 text-teal-300',
  PICKED_UP: 'bg-purple-500/20 text-purple-300',
  DELIVERED: 'bg-emerald-500/20 text-emerald-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};

export const DemoPanel: React.FC<DemoPanelProps> = ({ isEmbedded = false }) => {
  const { 
    activeRole, setRole, orders,
    acceptOrder, startPreparingOrder, markOrderReady,
    driverAcceptOrder, driverCompleteDelivery,
    resetSystemState, addAuditLog, auditLogs
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'actions' | 'logs'>('roles');

  const activeOrder = orders.find(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const currentRoleCfg = ROLE_CONFIG[activeRole];

  const handleAutoProgress = () => {
    if (!activeOrder) {
      addAuditLog('Demo: No active order — place an order first from Customer view.');
      return;
    }
    const stages: Record<Order['status'], () => void> = {
      PENDING:    () => { acceptOrder(activeOrder.id); addAuditLog(`[AUTO] Restaurant accepted order #${activeOrder.id.slice(-4)}`); },
      ACCEPTED:   () => { startPreparingOrder(activeOrder.id); addAuditLog(`[AUTO] Kitchen started cooking order #${activeOrder.id.slice(-4)}`); },
      PREPARING:  () => { markOrderReady(activeOrder.id); addAuditLog(`[AUTO] Order #${activeOrder.id.slice(-4)} marked ready for pickup`); },
      READY:      () => { driverAcceptOrder(activeOrder.id, 'driver-1'); addAuditLog(`[AUTO] Driver Michael accepted order #${activeOrder.id.slice(-4)}`); },
      PICKED_UP:  () => {
        const ok = driverCompleteDelivery(activeOrder.id, 'driver-1', activeOrder.otp);
        if (ok) addAuditLog(`[AUTO] Order #${activeOrder.id.slice(-4)} delivered — OTP verified ✓`);
      },
      DELIVERED: () => {},
      CANCELLED: () => {},
    };
    stages[activeOrder.status]?.();
  };

  const panel = (
    <div className="w-full flex flex-col gap-0 overflow-hidden">

      {/* Active Role Status Badge */}
      <div className={`flex items-center gap-3 p-3.5 rounded-2xl border mb-4 ${currentRoleCfg.bg} ${currentRoleCfg.ring} ring-1`}>
        <div className={`p-2 rounded-xl ${currentRoleCfg.bg} ${currentRoleCfg.color}`}>
          {currentRoleCfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active Viewport</p>
          <p className={`text-xs font-black ${currentRoleCfg.color}`}>{currentRoleCfg.label}</p>
        </div>
        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${currentRoleCfg.bg} ${currentRoleCfg.color}`}>
          Live
        </span>
      </div>

      {/* Tab Headers */}
      <div className="flex bg-slate-800/60 rounded-xl p-0.5 mb-4">
        {([
          { id: 'roles', label: 'Roles' },
          { id: 'actions', label: 'Macros' },
          { id: 'logs', label: 'Logs' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Role Switcher */}
      {activeTab === 'roles' && (
        <div className="space-y-2">
          {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([id, cfg]) => {
            const isActive = activeRole === id;
            return (
              <button
                key={id}
                onClick={() => { setRole(id); addAuditLog(`Role switched to ${id}`); }}
                className={`w-full text-left p-3 rounded-xl border transition-all group ${
                  isActive
                    ? `${cfg.bg} ${cfg.ring} ring-1`
                    : 'border-white/5 bg-slate-800/40 hover:bg-slate-800/80 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isActive ? `${cfg.bg} ${cfg.color}` : 'bg-slate-700/60 text-slate-500 group-hover:text-slate-300'}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black ${isActive ? cfg.color : 'text-slate-300'}`}>{cfg.label}</span>
                      {isActive && <ShieldCheck className={`w-3 h-3 ${cfg.color}`} />}
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight mt-0.5 truncate">{ROLE_DESCS[id]}</p>
                  </div>
                  <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isActive ? cfg.color : 'text-slate-600 group-hover:text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab: Automation Macros */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          {/* Active Order Tracker */}
          <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Active Order Flow</span>
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            </div>

            {activeOrder ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">#{activeOrder.id.slice(-6).toUpperCase()}</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[activeOrder.status] ?? 'bg-slate-700 text-slate-300'}`}>
                    {activeOrder.status}
                  </span>
                </div>

                {/* Progress bar visualization */}
                <div className="flex gap-0.5">
                  {(['PENDING','ACCEPTED','PREPARING','READY','PICKED_UP','DELIVERED'] as Order['status'][]).map((s, i) => {
                    const stages = ['PENDING','ACCEPTED','PREPARING','READY','PICKED_UP','DELIVERED'];
                    const idx = stages.indexOf(activeOrder.status);
                    return (
                      <div key={s} className={`flex-1 h-1 rounded-full transition-all ${i <= idx ? 'bg-primary' : 'bg-slate-700'}`} />
                    );
                  })}
                </div>

                <button
                  onClick={handleAutoProgress}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Advance to Next Stage
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                No active order. Switch to <strong className="text-slate-400">Customer App</strong> and place an order to begin the E2E simulation.
              </p>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={() => { resetSystemState(); addAuditLog('System state reset to defaults'); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-slate-400 hover:text-red-400 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Simulation State
          </button>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Real-time Event Stream</span>
          </div>
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto no-scrollbar">
            {auditLogs.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic py-4 text-center">No events yet. Start interacting with the emulator.</p>
            ) : (
              [...auditLogs].reverse().map((log) => {
                // Determine log color based on content
                const isError = log.action.toLowerCase().includes('error') || log.action.toLowerCase().includes('fail');
                const isSuccess = log.action.toLowerCase().includes('delivered') || log.action.toLowerCase().includes('success');
                const isAuto = log.action.startsWith('[AUTO]');
                return (
                  <div key={log.id} className="flex gap-2.5 items-start p-2.5 rounded-lg bg-slate-800/40 border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${isError ? 'bg-red-400' : isSuccess ? 'bg-emerald-400' : isAuto ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-slate-300 font-medium leading-snug break-words">{log.action}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] text-slate-600 font-mono">{new Date(log.date).toLocaleTimeString()}</span>
                        <span className="text-[8px] text-slate-600 truncate max-w-[100px]">{log.user}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );

  /* ── Embedded mode: used inside the desktop console sidebar ── */
  if (isEmbedded) return panel;

  /* ── Mobile/tablet: floating FAB + popover ── */
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          {/* Popover header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-black text-white tracking-wide">Simulation Deck</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors text-[10px] font-bold px-2 py-0.5 rounded hover:bg-white/10">✕</button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[550px] no-scrollbar">
            {panel}
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95"
        title="Open Simulation Panel"
      >
        <Zap className={`w-5 h-5 ${isOpen ? 'fill-white' : ''} transition-all`} />
      </button>
    </div>
  );
};
