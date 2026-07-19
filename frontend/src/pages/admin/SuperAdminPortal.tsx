import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Building, UserCheck, Shield, MessageSquare, 
  Send, Activity, BarChart, Check, LogOut, ImagePlus, X,
  Package, PlusCircle, Edit, Trash2, ToggleLeft, ToggleRight, Utensils
} from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SuperAdminPortal: React.FC = () => {
  const {
    restaurants,
    drivers,
    orders,
    wallets,
    supportTickets,
    auditLogs,
    subscriptionPlans,
    addSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    toggleSubscriptionPlanStatus,
    foodCategories,
    addFoodCategory,
    updateFoodCategory,
    deleteFoodCategory,
    approveRestaurant,
    verifyRestaurant,
    banRestaurant,
    unbanRestaurant,
    deleteRestaurant,
    approveDriver,
    replyToSupportTicket,
    addAuditLog,
    logout,
    welcomeBannerImage,
    updateWelcomeBannerImage
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'kpis' | 'restaurants' | 'drivers' | 'subscriptions' | 'cuisines' | 'support' | 'logs'>('kpis');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  // Modal State for Subscription Packs
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planCommission, setPlanCommission] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');

  // Modal State for Cuisine Categories
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const handleBannerFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateWelcomeBannerImage(e.target?.result as string);
      addAuditLog('Super Admin updated the welcome offer banner image');
    };
    reader.readAsDataURL(file);
  };
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const platformWallet = wallets.find(w => w.ownerId === 'PLATFORM')!;
  const pendingRestaurants = restaurants.filter(r => !r.isApproved && !r.isBanned);
  const activeRestaurants = restaurants.filter(r => r.isApproved && !r.isBanned);
  const bannedRestaurants = restaurants.filter(r => r.isBanned);
  
  const pendingDrivers = drivers.filter(d => !d.isApproved);
  const activeDrivers = drivers.filter(d => d.isApproved);

  // Calculations
  const grossSalesVolume = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0);
  const totalCommission = platformWallet.balance;

  // Chart data
  const chartData = [
    { name: 'Pizzas', sales: grossSalesVolume * 0.4 },
    { name: 'Burgers', sales: grossSalesVolume * 0.35 },
    { name: 'Sushi', sales: grossSalesVolume * 0.25 }
  ];

  const handleSendReply = (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text || !text.trim()) return;

    replyToSupportTicket(ticketId, text);
    setReplyText({ ...replyText, [ticketId]: '' });
    addAuditLog(`Replied to support ticket ${ticketId}`);
    alert('Reply sent and ticket resolved.');
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planPrice || !planCommission) return;

    const featuresList = planFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    if (editingPlanId) {
      updateSubscriptionPlan(editingPlanId, {
        name: planName,
        price: parseFloat(planPrice),
        commissionRate: parseFloat(planCommission),
        description: planDesc,
        features: featuresList.length > 0 ? featuresList : ['Standard Outlet Support']
      });
      addAuditLog(`Updated subscription pack: ${planName}`);
    } else {
      addSubscriptionPlan({
        name: planName,
        price: parseFloat(planPrice),
        commissionRate: parseFloat(planCommission),
        billingCycle: 'MONTHLY',
        description: planDesc || 'Standard SaaS Vendor Subscription Plan',
        features: featuresList.length > 0 ? featuresList : ['Standard Outlet Support'],
        isActive: true
      });
    }

    setShowPlanModal(false);
    setEditingPlanId(null);
    setPlanName('');
    setPlanPrice('');
    setPlanCommission('');
    setPlanDesc('');
    setPlanFeatures('');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catName.trim()) return;

    if (editingCatId) {
      updateFoodCategory(editingCatId, {
        name: catName.trim(),
        description: catDesc.trim()
      });
      addAuditLog(`Updated Cuisine Category: ${catName}`);
    } else {
      addFoodCategory({
        name: catName.trim(),
        description: catDesc.trim() || 'Popular platform cuisine category'
      });
    }

    setShowCatModal(false);
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-20">
      
      {/* Sticky top header bar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-30 px-4 py-3 space-y-2 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-extrabold text-xs text-text leading-tight">Admin Console</h1>
              <p className="text-[9px] text-text-secondary">Global SaaS Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[8px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-700 uppercase tracking-wider">
              Root Access
            </div>
            <button
              onClick={logout}
              className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Top Header Tab Selector Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1 select-none">
          {[
            { id: 'kpis' as const, label: 'KPIs', icon: BarChart },
            { id: 'subscriptions' as const, label: 'SaaS Packs', icon: Package },
            { id: 'cuisines' as const, label: 'Cuisines', icon: Utensils, badge: foodCategories.length },
            { id: 'restaurants' as const, label: 'Stores', icon: Building, badge: pendingRestaurants.length },
            { id: 'drivers' as const, label: 'Drivers', icon: UserCheck, badge: pendingDrivers.length },
            { id: 'support' as const, label: 'Support', icon: MessageSquare, badge: supportTickets.filter(t => t.status === 'OPEN').length },
            { id: 'logs' as const, label: 'Audits', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-danger text-white text-[7px] px-1.5 py-0.2 rounded-full font-black">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab View contents */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        
        {/* TAB 1: PLATFORM METRICS */}
        {activeTab === 'kpis' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Global Platform KPIs</span>
            
            {/* SaaS Subscription Manager Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 rounded-[22px] text-white shadow-md flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-xs font-black text-white">Restaurant Subscription Packs</span>
                </div>
                <p className="text-[9px] text-slate-300">
                  {subscriptionPlans.filter(p => p.isActive).length} active packs configured for vendor outlets.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className="py-2 px-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                Manage Packs →
              </button>
            </div>

            {/* Stat blocks */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3.5 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Net Commission</span>
                <h3 className="text-base font-black text-text">₹{totalCommission.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-3.5 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Gross Sales GMV</span>
                <h3 className="text-base font-black text-text">₹{grossSalesVolume.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-3.5 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Active Outlets</span>
                <h3 className="text-base font-black text-text">{activeRestaurants.length} Stores</h3>
              </div>
              <div className="bg-white p-3.5 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Active Fleets</span>
                <h3 className="text-base font-black text-text">{activeDrivers.length} Drivers</h3>
              </div>
            </div>

            {/* Recharts Breakdown */}
            <div className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase">GMV Cuisines Breakdown</span>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip formatter={(val: number) => [`₹${val.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="sales" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={24} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform Settings / Welcome Banner Upload */}
            <div className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold text-text-secondary uppercase">Welcome Offer Banner Settings</span>
                <p className="text-[9px] text-text-secondary mt-0.5">Upload a custom promotional banner image shown on the customer feed page.</p>
              </div>

              {/* Upload Zone */}
              <div
                onClick={() => bannerInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleBannerFile(file);
                }}
                className={`relative h-28 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all flex items-center justify-center ${
                  isDraggingOver
                    ? 'border-primary bg-primary/5'
                    : welcomeBannerImage
                    ? 'border-transparent'
                    : 'border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-primary/3'
                }`}
              >
                {welcomeBannerImage ? (
                  <>
                    <img src={welcomeBannerImage} alt="banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-white text-center">
                        <ImagePlus className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-[10px] font-bold">Replace Banner</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updateWelcomeBannerImage(null); addAuditLog('Super Admin cleared the custom banner image'); }}
                      className="absolute top-2 right-2 w-6.5 h-6.5 bg-black/60 hover:bg-black/85 rounded-full flex items-center justify-center transition-colors"
                      title="Clear custom image"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center px-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <ImagePlus className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Tap or drag image to set custom banner</p>
                    <p className="text-[8px] text-slate-400">Supports JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBannerFile(file);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: STORES VERIFICATION & APPLICATION REVIEW */}
        {activeTab === 'restaurants' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Merchant Onboarding & Application Approvals</span>

            {/* Pending Merchant Applications */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-text-secondary uppercase">Pending Merchant Applications ({pendingRestaurants.length})</h3>
                {pendingRestaurants.length > 0 && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                    Action Required
                  </span>
                )}
              </div>

              {pendingRestaurants.length === 0 ? (
                <div className="bg-white rounded-[22px] p-6 text-center text-xs text-text-secondary border border-slate-100 shadow-sm">
                  No pending restaurant applications. All merchant accounts approved.
                </div>
              ) : (
                pendingRestaurants.map((r) => (
                  <div key={r.id} className="bg-white rounded-[22px] border border-slate-100 overflow-hidden shadow-sm space-y-3">
                    {/* Banner Cover */}
                    <div className="h-24 relative bg-slate-900 overflow-hidden">
                      <img src={r.banner} alt={r.name} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                        Pending Verification
                      </div>
                      <div className="absolute -bottom-3 left-4 border-2 border-white rounded-xl overflow-hidden shadow-md w-12 h-12 bg-white">
                        <img src={r.logo} alt={r.name} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="pt-2 px-4 pb-4 space-y-3">
                      <div>
                        <h4 className="font-black text-sm text-text leading-tight">{r.name}</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 font-medium">{r.description || 'New Merchant Outlet Application'}</p>
                      </div>

                      {/* Application Info Chips */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[7.5px]">Outlet Address</span>
                          <span className="font-bold text-slate-700 truncate block">{r.address}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[7.5px]">Delivery Radius</span>
                          <span className="font-bold text-slate-700 block">{r.deliveryRadius || 5} km zone</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[7.5px]">Default Plan</span>
                          <span className="font-bold text-primary block">{r.subscriptionPlan || 'Starter Pack'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[7.5px]">Commission Rate</span>
                          <span className="font-bold text-slate-700 block">{r.commissionRate || 10}%</span>
                        </div>
                      </div>

                      {/* Approve Action */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            approveRestaurant(r.id);
                            addAuditLog(`Super Admin approved restaurant application: ${r.name}`);
                          }}
                          className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-4 h-4" /> Approve Merchant Account
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Active Merchants */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase">Active Stores ({activeRestaurants.length})</h3>
              {activeRestaurants.map((r) => (
                <div key={r.id} className="bg-white rounded-[22px] border border-slate-100 p-3.5 shadow-sm flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <img src={r.logo} alt={r.name} className="w-9 h-9 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-extrabold text-xs text-text">{r.name}</h4>
                      <p className="text-[8px] text-text-secondary">Plan: <strong className="text-primary">{r.subscriptionPlan}</strong> • Fee: {r.commissionRate}%</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verifyRestaurant(r.id)}
                      className={`py-1 px-3 rounded-lg text-[9px] font-extrabold transition-colors ${r.isVerified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {r.isVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to ban ${r.name}?`)) {
                          banRestaurant(r.id);
                          addAuditLog(`Super Admin banned restaurant: ${r.name}`);
                        }
                      }}
                      className="py-1 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[9px] font-extrabold transition-colors"
                    >
                      Ban
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Banned Merchants */}
            {bannedRestaurants.length > 0 && (
              <div className="space-y-3 pt-3">
                <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Banned Stores ({bannedRestaurants.length})</h3>
                {bannedRestaurants.map((r) => (
                  <div key={r.id} className="bg-red-50/50 rounded-[22px] border border-red-100 p-3.5 shadow-sm flex items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <img src={r.logo} alt={r.name} className="w-9 h-9 rounded-xl object-cover grayscale" />
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 line-through">{r.name}</h4>
                        <p className="text-[8px] text-slate-500">Plan: {r.subscriptionPlan} • Fee: {r.commissionRate}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          unbanRestaurant(r.id);
                          addAuditLog(`Super Admin unbanned restaurant: ${r.name}`);
                        }}
                        className="py-1 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[9px] font-extrabold transition-colors"
                      >
                        Unban
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete/remove ${r.name} permanently? This will delete all associated menus and order histories!`)) {
                            deleteRestaurant(r.id);
                            addAuditLog(`Super Admin permanently deleted restaurant: ${r.name}`);
                          }
                        }}
                        className="p-1 px-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[9px] transition-colors flex items-center justify-center"
                        title="Delete Merchant Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FLEET DRIVER VERIFICATION */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Fleet Partner Approvals</span>
            
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase">Pending Fleet Applications ({pendingDrivers.length})</h3>
              {pendingDrivers.length === 0 ? (
                <div className="bg-white rounded-[22px] p-6 text-center text-xs text-text-secondary border border-slate-100 shadow-sm">
                  No pending fleet driver applications.
                </div>
              ) : (
                pendingDrivers.map((d) => (
                  <div key={d.id} className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-text">{d.name}</h4>
                      <p className="text-[9px] text-text-secondary mt-0.5">{d.phone} • Vehicle: {d.vehiclePlate}</p>
                    </div>
                    <button
                      onClick={() => approveDriver(d.id)}
                      className="py-1.5 px-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Approve Fleet
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase">Active Fleets ({activeDrivers.length})</h3>
              {activeDrivers.map((d) => (
                <div key={d.id} className="bg-white rounded-[22px] border border-slate-100 p-3.5 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-text">{d.name}</h4>
                    <p className="text-[8px] text-text-secondary">{d.vehicleType} • Plate: {d.vehiclePlate}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${d.isOnline ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {d.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUBSCRIPTION PACKS MANAGEMENT */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Restaurant SaaS Subscription Packs</span>
                <p className="text-[9px] text-text-secondary mt-0.5">Manage pricing, commissions, and feature highlights for vendors.</p>
              </div>
              <button
                onClick={() => {
                  setEditingPlanId(null);
                  setPlanName('');
                  setPlanPrice('');
                  setPlanCommission('');
                  setPlanDesc('');
                  setPlanFeatures('');
                  setShowPlanModal(true);
                }}
                className="flex items-center gap-1 py-1.5 px-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-[10px] shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Add Pack
              </button>
            </div>

            {/* List of Subscription Packs */}
            <div className="space-y-3">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-text leading-tight">{plan.name}</h4>
                        <span className="text-[9px] text-text-secondary font-medium block mt-0.5">{plan.billingCycle} BILLING</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${plan.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {plan.isActive ? 'Active' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => toggleSubscriptionPlanStatus(plan.id)}
                        title="Toggle Status"
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        {plan.isActive ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-slate-300" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPlanId(plan.id);
                          setPlanName(plan.name);
                          setPlanPrice(plan.price.toString());
                          setPlanCommission(plan.commissionRate.toString());
                          setPlanDesc(plan.description);
                          setPlanFeatures(plan.features.join('\n'));
                          setShowPlanModal(true);
                        }}
                        title="Edit Plan"
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete subscription pack "${plan.name}"?`)) {
                            deleteSubscriptionPlan(plan.id);
                          }
                        }}
                        title="Delete Plan"
                        className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-b border-slate-50 py-2.5">
                    <div>
                      <span className="text-[9px] text-text-secondary font-bold uppercase block">Monthly Price</span>
                      <h3 className="text-sm font-black text-text">₹{plan.price.toFixed(2)}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-text-secondary font-bold uppercase block">Order Commission</span>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{plan.commissionRate}% Fee</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-text-secondary">{plan.description}</p>

                  {/* Highlights/Features */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pack Benefits</span>
                    <ul className="grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-700">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CUISINE CATEGORIES MANAGEMENT */}
        {activeTab === 'cuisines' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Global Platform Cuisine Categories</span>
                <p className="text-[9px] text-text-secondary mt-0.5">Manage food categories for restaurant menus & customer search filters.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCatId(null);
                  setCatName('');
                  setCatDesc('');
                  setShowCatModal(true);
                }}
                className="flex items-center gap-1 py-1.5 px-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-[10px] shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Add Cuisine
              </button>
            </div>

            {/* List of Cuisine Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {foodCategories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-2 relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs border border-amber-500/20">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-text">{cat.name}</h4>
                      <p className="text-[9px] text-text-secondary mt-0.5 max-w-[180px]">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setCatName(cat.name);
                        setCatDesc(cat.description || '');
                        setShowCatModal(true);
                      }}
                      title="Edit Category"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${cat.name}"?`)) {
                          deleteFoodCategory(cat.id);
                        }
                      }}
                      title="Delete Category"
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: DISPATCH SUPPORT DESK */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Customer Support Tickets</span>
            
            <div className="space-y-3">
              {supportTickets.length === 0 ? (
                <div className="bg-white rounded-[22px] p-6 text-center text-xs text-text-secondary border border-slate-100 shadow-sm">
                  No support tickets reported.
                </div>
              ) : (
                supportTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                      <div>
                        <h4 className="font-extrabold text-xs text-text">{ticket.subject}</h4>
                        <p className="text-[8px] text-text-secondary mt-0.5">By {ticket.userName} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ticket.status === 'OPEN' ? 'bg-red-50 text-danger' : 'bg-slate-150 text-slate-500'}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{ticket.message}</p>

                    {ticket.status === 'OPEN' && (
                      <div className="space-y-2 pt-2 border-t border-slate-50">
                        <textarea
                          placeholder="Type reply to customer..."
                          value={replyText[ticket.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-100 rounded-xl text-[10px] bg-slate-50 focus:outline-none focus:bg-white resize-none"
                        ></textarea>
                        <button
                          onClick={() => handleSendReply(ticket.id)}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Dispatch Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SECURITY AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Security Audit Trail</span>
            
            <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm max-h-[75vh] overflow-y-auto no-scrollbar space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-[10px] border-b border-slate-50 pb-2 space-y-1.5">
                  <div className="flex justify-between text-[9px] text-text-secondary font-bold">
                    <span>{new Date(log.date).toLocaleTimeString()}</span>
                    <span>SUCCESS</span>
                  </div>
                  <p className="text-slate-700 font-semibold leading-relaxed">{log.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom navigation bar */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 py-2.5 px-2 flex justify-between items-center z-40 select-none shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        {[
          { id: 'kpis' as const, label: 'KPIs', icon: BarChart },
          { id: 'subscriptions' as const, label: 'SaaS Packs', icon: Package },
          { id: 'cuisines' as const, label: 'Cuisines', icon: Utensils, badge: foodCategories.length },
          { id: 'restaurants' as const, label: 'Stores', icon: Building, badge: pendingRestaurants.length },
          { id: 'drivers' as const, label: 'Drivers', icon: UserCheck, badge: pendingDrivers.length },
          { id: 'support' as const, label: 'Support', icon: MessageSquare, badge: supportTickets.filter(t => t.status === 'OPEN').length },
          { id: 'logs' as const, label: 'Audits', icon: Activity }
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
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[7.5px] font-bold mt-0.5 ${isActive ? 'text-primary font-black' : 'text-slate-400'}`}>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-0 right-2 bg-danger text-white text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold border border-white animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Modal for Creating / Editing Cuisine Category */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] overflow-hidden w-full max-w-sm flex flex-col shadow-2xl relative p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold text-text uppercase">
                  {editingCatId ? 'Edit Cuisine Category' : 'Create Cuisine Category'}
                </span>
              </div>
              <button
                onClick={() => setShowCatModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Cuisine Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Italian, Chinese, Fast Food, Mexican"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Description</label>
                <textarea
                  placeholder="e.g. Authentic hand-crafted pastas, wood-fired sourdough pizzas & risottos..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md transition-colors mt-2"
              >
                {editingCatId ? 'Save Cuisine Changes' : 'Publish Cuisine Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing Subscription Pack */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] overflow-hidden w-full max-w-sm flex flex-col shadow-2xl relative p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold text-text uppercase">
                  {editingPlanId ? 'Edit Subscription Pack' : 'Create Subscription Pack'}
                </span>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Pack Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Express Pack"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-text-secondary block">Price (₹ / month)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1999"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-text-secondary block">Commission Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 7.5"
                    value={planCommission}
                    onChange={(e) => setPlanCommission(e.target.value)}
                    className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Description</label>
                <textarea
                  placeholder="e.g. Tailored for mid-tier restaurants requiring low commissions and priority delivery..."
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white resize-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Pack Benefits (One per line)</label>
                <textarea
                  placeholder="Unlimited Menu Items&#10;7.5% Low Commission&#10;Priority Dispatch Support"
                  value={planFeatures}
                  onChange={(e) => setPlanFeatures(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white resize-none font-sans"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md transition-colors mt-2"
              >
                {editingPlanId ? 'Save Pack Changes' : 'Publish Subscription Pack'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
