import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LiveMap } from '../../components/map/LiveMap';
import { MapErrorBoundary } from '../../components/map/MapErrorBoundary';
import { 
  Check, Wallet, ToggleLeft, ToggleRight, 
  Navigation2, Compass, AlertCircle, Phone, MessageSquare, Award, LogOut
} from 'lucide-react';

export const DeliveryPartnerPortal: React.FC = () => {
  const {
    drivers,
    orders,
    wallets,
    toggleDriverOnline,
    driverAcceptOrder,
    driverCompleteDelivery,
    withdrawDriverFunds,
    addAuditLog,
    logout
  } = useAppStore();

  const [driverId] = useState<string>('driver-1');
  const [activeTab, setActiveTab] = useState<'board' | 'navigation' | 'wallet'>('board');
  const [otpInput, setOtpInput] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const driver = drivers.find(d => d.id === driverId)!;
  const driverWallet = wallets.find(w => w.ownerId === driverId);

  // Available orders for pick-up (status: READY, and no driver assigned yet)
  const availableOrders = orders.filter(o => o.status === 'READY' && !o.driverId);
  const activeOrder = orders.find(o => o.driverId === driverId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const completedDeliveries = orders.filter(o => o.driverId === driverId && o.status === 'DELIVERED');
  const driverEarnings = completedDeliveries.reduce((sum, o) => sum + (o.deliveryFee + 2.50), 0);

  // Automatically switch tab if an active order exists
  useEffect(() => {
    if (activeOrder && activeTab === 'board') {
      setActiveTab('navigation');
    }
  }, [activeOrder]);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    const ok = driverCompleteDelivery(activeOrder.id, driverId, otpInput);
    if (ok) {
      setOtpInput('');
      setActiveTab('wallet');
      alert('Order delivered successfully! Payout credited to your wallet.');
    } else {
      alert('Invalid Security OTP. Please confirm with the customer.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-20">
      
      {/* Sticky top header bar */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent text-slate-900 flex items-center justify-center font-bold text-xs shadow-sm">
            DP
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-text leading-tight">{driver.name}</h1>
            <p className="text-[9px] text-text-secondary">Fleet Partner • {driver.vehicleType}</p>
          </div>
        </div>

        {/* Material Style Online/Offline Toggle */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-black uppercase tracking-wider ${driver.isOnline ? 'text-primary' : 'text-text-secondary'}`}>
            {driver.isOnline ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={() => {
              toggleDriverOnline(driverId);
              addAuditLog(`Driver toggled online status: ${!driver.isOnline}`);
            }}
            className="focus:outline-none transition-transform active:scale-95"
          >
            {driver.isOnline ? (
              <ToggleRight className="w-8 h-8 text-primary" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-300" />
            )}
          </button>
          <button
            onClick={logout}
            className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-colors ml-1"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </header>

      {/* Main Tab Screen Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        
        {/* TAB 1: AVAILABLE JOBS BOARD */}
        {activeTab === 'board' && (
          <div className="space-y-4">
            
            {/* Quick dashboard metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3.5 rounded-[22px] border border-slate-100 shadow-sm">
                <span className="text-[9px] text-text-secondary font-bold uppercase">Earned Today</span>
                <h4 className="text-base font-black text-text mt-0.5">₹{driverEarnings.toFixed(2)}</h4>
              </div>
              <div className="bg-white p-3.5 rounded-[22px] border border-slate-100 shadow-sm">
                <span className="text-[9px] text-text-secondary font-bold uppercase">Jobs Done</span>
                <h4 className="text-base font-black text-text mt-0.5">{completedDeliveries.length} Deliveries</h4>
              </div>
            </div>

            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Incoming Pickup Bids</span>
            
            {!driver.isOnline ? (
              <div className="bg-white rounded-[22px] border border-slate-100 p-6 text-center shadow-sm">
                <AlertCircle className="w-9 h-9 text-slate-300 mx-auto" />
                <p className="text-xs text-text-secondary mt-2">Toggle the online switch above to start receiving live delivery requests.</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="bg-white rounded-[22px] border border-slate-100 p-6 text-center text-xs text-text-secondary shadow-sm">
                No active delivery bids at this moment.
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map((o) => {
                  const driverPayout = o.deliveryFee + 25.00; // In INR: delivery fee + boost
                  return (
                    <div key={o.id} className="bg-white border border-slate-100 rounded-[22px] p-4 shadow-sm space-y-3.5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-xs text-text block leading-tight">{o.restaurantName}</span>
                          <span className="text-[9px] text-text-secondary block mt-0.5">
                            Distance: {parseFloat((Math.sqrt(Math.pow(o.deliveryLat - o.restaurantLat, 2) + Math.pow(o.deliveryLng - o.restaurantLng, 2)) * 100).toFixed(1))} km
                          </span>
                        </div>
                        <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-1 rounded-xl">₹{driverPayout.toFixed(2)}</span>
                      </div>
                      
                      <div className="text-[10px] text-text-secondary space-y-1.5 border-t border-b border-slate-50 py-3">
                        <div className="flex gap-2">
                          <span className="font-bold min-w-[30px]">From:</span>
                          <span className="text-text font-semibold">{o.restaurantName}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-bold min-w-[30px]">To:</span>
                          <span className="text-text font-semibold truncate">{o.deliveryAddress}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          driverAcceptOrder(o.id, driverId);
                          setActiveTab('navigation');
                        }}
                        className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Accept Payout Bid
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE NAVIGATION ROUTE MAP */}
        {activeTab === 'navigation' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">GPS Routing Navigator</span>

            {!activeOrder ? (
              <div className="bg-white rounded-[22px] border border-slate-100 p-8 text-center shadow-sm space-y-3">
                <Navigation2 className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-text">No Active Delivery Job</h3>
                  <p className="text-[10px] text-text-secondary">Accept a delivery bid from the incoming board to start tracking.</p>
                </div>
                <button
                  onClick={() => setActiveTab('board')}
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  View Bids Board
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Live Routing Map Viewport */}
                <div key={activeOrder ? `map-driver-${activeOrder.id}` : 'map-driver'} className="h-64 rounded-[22px] overflow-hidden shadow-inner border border-slate-100 relative bg-slate-100 z-10">
                  <MapErrorBoundary>
                    <LiveMap activeOrder={activeOrder} />
                  </MapErrorBoundary>
                </div>

                {/* Navigation details */}
                <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-text-secondary font-bold uppercase">Customer Destination</span>
                      <h4 className="font-extrabold text-xs text-text leading-tight mt-0.5">{activeOrder.customerName}</h4>
                      <p className="text-[9px] text-text-secondary mt-0.5 truncate max-w-[200px]">{activeOrder.deliveryAddress}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${activeOrder.customerPhone}`} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"><Phone className="w-4 h-4" /></a>
                      <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"><MessageSquare className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Security OTP Code form to complete checkout */}
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5 border-t border-slate-100 pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-text uppercase tracking-wider block">Confirm Security OTP</label>
                      <p className="text-[9px] text-text-secondary">Request the 4-digit verification code from the customer on doorstep arrival.</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="e.g. 4819"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-slate-100 rounded-xl text-xs font-mono text-center tracking-widest bg-slate-50 focus:outline-none focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="py-2.5 px-6 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Verify
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: DRIVER WALLET PAYOUT HISTORY */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Payout Wallet Ledger</span>
            
            {/* Premium balance display */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-[22px] p-5 text-white shadow-premium relative overflow-hidden flex flex-col justify-between h-40">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-400 to-transparent"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] tracking-wider text-slate-300 font-bold uppercase">Driver Account Balance</span>
                  <p className="text-[9px] text-slate-400 leading-none font-medium">Earnings settle on successful verification</p>
                </div>
                <Award className="w-5.5 h-5.5 text-primary" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">₹{driverWallet?.balance.toFixed(2)}</h2>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-white/10 text-slate-400">
                <span>Verification Settled</span>
                <span>Active Boost Active</span>
              </div>
            </div>

            {/* Withdrawal form */}
            <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
              <span className="text-xs font-extrabold text-text block">Instant Bank Account Cashout</span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-6 pr-3 py-2.5 border border-slate-100 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white"
                  />
                </div>
                <button
                  onClick={() => {
                    const amt = parseFloat(withdrawAmount);
                    if (amt > 0) {
                      const ok = withdrawDriverFunds(driverId, amt);
                      if (ok) {
                        setWithdrawAmount('');
                        alert(`Transfer request of ₹${amt.toFixed(2)} sent to bank account successfully!`);
                      } else {
                        alert('Insufficient balance.');
                      }
                    }
                  }}
                  className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Cashout
                </button>
              </div>
            </div>

            {/* Statement logs */}
            <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
              <span className="text-xs font-extrabold text-text block">Driver Payout Statements</span>
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {driverWallet?.transactions.length === 0 ? (
                  <p className="text-[10px] text-text-secondary text-center py-2">No transactions records found.</p>
                ) : (
                  driverWallet?.transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center text-[10px] border-b border-slate-50 pb-2">
                      <div>
                        <span className="font-bold text-text truncate max-w-[150px] block">{tx.description}</span>
                        <span className="text-[8px] text-text-secondary">{new Date(tx.date).toLocaleDateString()}</span>
                      </div>
                      <span className={`font-black ${tx.type === 'CREDIT' ? 'text-primary' : 'text-danger'}`}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Floating Bottom navigation bar */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 py-2.5 px-4 flex justify-between items-center z-40 select-none shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        {[
          { id: 'board' as const, label: 'Bids Board', icon: Compass, badge: availableOrders.length },
          { id: 'navigation' as const, label: 'Navigation', icon: Navigation2, badge: activeOrder ? 1 : 0 },
          { id: 'wallet' as const, label: 'Wallet', icon: Wallet }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 relative py-1"
            >
              <div className={`p-1 rounded-full transition-transform ${isActive ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-bold mt-0.5 ${isActive ? 'text-primary font-black' : 'text-slate-400'}`}>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-0 right-8 bg-danger text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

    </div>
  );
};
