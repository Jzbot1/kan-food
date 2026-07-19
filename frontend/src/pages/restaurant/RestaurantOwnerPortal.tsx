import React, { useState, useRef } from 'react';
import { useAppStore, Food } from '../../store/useAppStore';
import { 
  Clock, Utensils, 
  Award, Wallet, BarChart2, PlusCircle, LogOut, ImagePlus, X,
  ShieldAlert, Lock, Check, AlertCircle, Package
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RestaurantOwnerPortal: React.FC = () => {
  const {
    currentUser,
    restaurants,
    orders,
    acceptOrder,
    startPreparingOrder,
    markOrderReady,
    wallets,
    subscriptionPlans,
    foodCategories,
    withdrawRestaurantFunds,
    upgradeRestaurantSubscription,
    updateRestaurantMenu,
    addRestaurant,
    addAuditLog,
    logout
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'wallet'>('dashboard');
  const [activeRestaurantId, setActiveRestaurantId] = useState<string>('rest-1');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Form states for adding/editing foods
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodDesc, setNewFoodDesc] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState('');
  const [newFoodCat, setNewFoodCat] = useState('Pizza');
  const [newFoodVeg, setNewFoodVeg] = useState(true);
  const [newFoodImage, setNewFoodImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // New Outlet Application Form States
  const [showAppModal, setShowAppModal] = useState(false);
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appAddress, setAppAddress] = useState('');
  const [appRadius, setAppRadius] = useState('5');
  const [appLogo, setAppLogo] = useState('');
  const [appBanner, setAppBanner] = useState('');

  const handleApplyRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appAddress) return;

    const newId = addRestaurant({
      ownerId: currentUser?.id || 'user-owner',
      name: appName.trim(),
      description: appDesc.trim() || 'Freshly prepared artisanal dishes',
      address: appAddress.trim(),
      lat: 40.7484,
      lng: -73.9857,
      deliveryRadius: parseFloat(appRadius) || 5,
      logo: appLogo.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      banner: appBanner.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      commissionRate: 10.0,
      subscriptionPlan: 'Starter Kitchen Pack',
      subscriptionExpires: new Date(Date.now() + 86400000 * 30).toISOString(),
      categories: foodCategories,
      menu: []
    });

    if (newId) {
      setActiveRestaurantId(newId);
    }

    setShowAppModal(false);
    setAppName('');
    setAppDesc('');
    setAppAddress('');
    setAppRadius('5');
    setAppLogo('');
    setAppBanner('');
    alert('Restaurant application submitted! Waiting for Super Admin approval.');
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setNewFoodImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const restaurant = restaurants.find(r => r.id === activeRestaurantId) || restaurants[0];
  const restaurantWallet = wallets.find(w => w.ownerId === (restaurant?.id || activeRestaurantId));
  const restaurantOrders = orders.filter(o => o.restaurantId === (restaurant?.id || activeRestaurantId));

  // Subscription Active & Expiry Calculations
  const isSubscriptionActive = React.useMemo(() => {
    if (!restaurant || !restaurant.subscriptionExpires) return false;
    return new Date(restaurant.subscriptionExpires).getTime() > Date.now();
  }, [restaurant]);

  const daysRemaining = React.useMemo(() => {
    if (!restaurant || !restaurant.subscriptionExpires) return 0;
    const diff = new Date(restaurant.subscriptionExpires).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [restaurant]);

  const pendingOrders = restaurantOrders.filter(o => o.status === 'PENDING');
  const activeOrders = restaurantOrders.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'READY');
  const completedOrders = restaurantOrders.filter(o => o.status === 'DELIVERED');

  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.total - o.deliveryFee - o.discount - o.commission), 0);

  // Generate mock chart data based on completed orders
  const chartData = [
    { name: 'Mon', sales: totalEarnings * 0.1 },
    { name: 'Tue', sales: totalEarnings * 0.15 },
    { name: 'Wed', sales: totalEarnings * 0.12 },
    { name: 'Thu', sales: totalEarnings * 0.2 },
    { name: 'Fri', sales: totalEarnings * 0.25 },
    { name: 'Sat', sales: totalEarnings * 0.35 },
    { name: 'Sun', sales: totalEarnings * 0.4 }
  ];

  // Menu action triggers
  const handleToggleAvailability = (foodId: string) => {
    const updatedMenu = restaurant.menu.map(f => f.id === foodId ? { ...f, isAvailable: !f.isAvailable } : f);
    updateRestaurantMenu(activeRestaurantId, updatedMenu);
    addAuditLog(`Toggled availability of dish ${foodId}`);
  };

  const handleAddNewFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName || !newFoodPrice) return;

    const newFood: Food = {
      id: `food-${activeRestaurantId}-${Date.now()}`,
      name: newFoodName,
      description: newFoodDesc,
      price: parseFloat(newFoodPrice),
      image: newFoodImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
      isVeg: newFoodVeg,
      isBestseller: false,
      isAvailable: true,
      category: newFoodCat
    };

    const updatedMenu = [...restaurant.menu, newFood];
    updateRestaurantMenu(activeRestaurantId, updatedMenu);
    
    // Reset form
    setNewFoodName('');
    setNewFoodDesc('');
    setNewFoodPrice('');
    setNewFoodVeg(true);
    setNewFoodImage(null);
    setShowAddFoodModal(false);
    addAuditLog(`Added new menu item: ${newFood.name}`);
  };

  const renderLockedFeatureNotice = (featureTitle: string) => (
    <div className="bg-white rounded-[24px] border border-amber-200 p-8 text-center shadow-sm space-y-4 my-4">
      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-xs">
        <Lock className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-sm text-text">Subscription Required for {featureTitle}</h3>
        <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
          Your outlet subscription has expired or no active pack is assigned. Subscribe to a SaaS pack to accept live orders and publish menu items.
        </p>
      </div>
      <button
        onClick={() => setActiveTab('wallet')}
        className="py-2.5 px-6 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-1.5 mx-auto"
      >
        <Package className="w-4 h-4" /> Browse Subscription Packs
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-20">
      
      {/* Unapproved Application Warning Banner */}
      {restaurant && !restaurant.isApproved && (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-[10px] font-bold shadow-sm z-40">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>Application Pending Super Admin Approval — Under review by root admin.</span>
          </div>
          <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">Pending Approval</span>
        </div>
      )}

      {/* Expiry Warning Banner */}
      {restaurant && restaurant.isApproved && !isSubscriptionActive && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-[10px] font-bold shadow-sm z-40">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Subscription Expired! Active pack required to accept orders.</span>
          </div>
          <button
            onClick={() => setActiveTab('wallet')}
            className="bg-white text-amber-700 hover:bg-amber-50 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-xs transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      )}

      {/* Sticky top header bar */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 px-4 py-3 flex flex-col gap-2 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src={restaurant.logo} 
              alt={restaurant.name} 
              className="w-8 h-8 rounded-xl object-cover border border-slate-100"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-xs text-text leading-tight">{restaurant.name}</h1>
                <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase ${
                  !restaurant.isApproved 
                    ? 'bg-amber-100 text-amber-800'
                    : isSubscriptionActive ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-600'
                }`}>
                  {!restaurant.isApproved ? 'PENDING APPROVAL' : isSubscriptionActive ? `${daysRemaining}d left` : 'EXPIRED'}
                </span>
              </div>
              <p className="text-[9px] text-text-secondary mt-0.5">SaaS Vendor Portal • <strong className="text-primary uppercase font-bold">{restaurant.subscriptionPlan || 'No Plan'}</strong></p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <select 
              value={activeRestaurantId} 
              onChange={(e) => setActiveRestaurantId(e.target.value)}
              className="border border-slate-100 rounded-lg text-[9px] px-2 py-1 bg-slate-50 focus:outline-none focus:bg-white font-bold"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name} {!r.isApproved ? '(Pending)' : ''}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAppModal(true)}
              className="py-1 px-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[9px] font-black transition-colors whitespace-nowrap"
            >
              + Apply Outlet
            </button>
            <button
              onClick={logout}
              className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-colors ml-0.5"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab View contents */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        
        {/* TAB 1: ANALYTICS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Today's Outlet Performance</span>

            {/* Metric widgets */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Gross Payouts</span>
                <h3 className="text-base font-black text-text">₹{totalEarnings.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Deliveries</span>
                <h3 className="text-base font-black text-text">{completedOrders.length} Completed</h3>
              </div>
              <div className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Kitchen Queue</span>
                <h3 className="text-base font-black text-text">{pendingOrders.length + activeOrders.length} Pending</h3>
              </div>
              <div className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Store Rating</span>
                <h3 className="text-base font-black text-text">{restaurant.rating.toFixed(1)} ★</h3>
              </div>
            </div>

            {/* Sales visual performance chart */}
            <div className="bg-white p-4 rounded-[22px] border border-slate-100 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase">Weekly Revenue Trend</span>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip formatter={(val: number) => [`₹${val.toFixed(2)}`, 'Sales']} />
                    <Area type="monotone" dataKey="sales" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE ORDERS QUEUE */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Live KDS Display Queue</span>

            {!isSubscriptionActive ? (
              renderLockedFeatureNotice('Live KDS Queue & Order Processing')
            ) : (
              /* Incoming list */
              <div className="space-y-3">
                {pendingOrders.length === 0 && activeOrders.length === 0 ? (
                  <div className="bg-white rounded-[22px] p-6 text-center text-xs text-text-secondary border border-slate-100">
                    No active orders in preparation queue.
                  </div>
                ) : (
                  [...pendingOrders, ...activeOrders].map((o) => (
                    <div key={o.id} className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-extrabold text-xs text-text">Order #{o.id.split('-')[1]}</span>
                          <p className="text-[8px] text-text-secondary mt-0.5">{new Date(o.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{o.status}</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-medium">
                            <span>{it!.quantity}x {it!.name}</span>
                            <span className="text-text-secondary">{it!.variant}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-extrabold text-xs text-primary">Total: ₹{o.total.toFixed(2)}</span>
                        
                        {o.status === 'PENDING' && (
                          <button
                            onClick={() => acceptOrder(o.id)}
                            className="py-1.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-[10px]"
                          >
                            Accept
                          </button>
                        )}
                        {o.status === 'ACCEPTED' && (
                          <button
                            onClick={() => startPreparingOrder(o.id)}
                            className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px]"
                          >
                            Start Cooking
                          </button>
                        )}
                        {o.status === 'PREPARING' && (
                          <button
                            onClick={() => markOrderReady(o.id)}
                            className="py-1.5 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-bold text-[10px]"
                          >
                            Ready
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MENU CATALOG EDIT */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-text uppercase tracking-wider">Menu Catalog</span>
              {isSubscriptionActive && (
                <button
                  onClick={() => setShowAddFoodModal(true)}
                  className="flex items-center gap-1 py-1.5 px-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-[10px] shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Dish
                </button>
              )}
            </div>

            {!isSubscriptionActive ? (
              renderLockedFeatureNotice('Menu Management & Dish Publishing')
            ) : (
              /* Menu List cards */
              <div className="space-y-3">
                {restaurant.menu.map((food) => (
                  <div key={food.id} className="bg-white rounded-[22px] border border-slate-100 p-3 flex gap-3.5 items-center shadow-sm">
                    <img src={food.image} alt={food.name} className="w-14 h-14 rounded-xl object-cover border border-slate-100" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">{food.category}</span>
                      <h4 className="font-extrabold text-xs text-text truncate mt-0.5">{food.name}</h4>
                      <p className="text-[10px] font-bold text-primary">₹{food.price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${food.isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {food.isAvailable ? 'Active' : 'Hidden'}
                      </span>
                      <button
                        onClick={() => handleToggleAvailability(food.id)}
                        className="py-1 px-2.5 border border-slate-200 hover:bg-slate-50 text-[9px] font-bold rounded-lg"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WALLET & SUBSCRIPTION PLANS */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Wallet Balance & SaaS Subscriptions</span>
            
            {/* Payout metrics */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-[22px] p-5 text-white shadow-premium relative overflow-hidden flex flex-col justify-between h-40">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-400 to-transparent"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] tracking-wider text-slate-300 font-bold uppercase">Outlet Cash Balance</span>
                  <p className="text-[9px] text-slate-400 leading-none">Complete deliveries settle instantly</p>
                </div>
                <Award className="w-5.5 h-5.5 text-primary" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">₹{restaurantWallet?.balance.toFixed(2)}</h2>
              <div className="flex justify-between items-center text-[10px] pt-3 border-t border-white/10 text-slate-400">
                <span>Commission Settled</span>
                <span>Payout Safe</span>
              </div>
            </div>

            {/* Withdraw form */}
            <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
              <span className="text-xs font-extrabold text-text block">Instant Bank Cash Withdrawal</span>
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
                      const ok = withdrawRestaurantFunds(activeRestaurantId, amt);
                      if (ok) {
                        setWithdrawAmount('');
                        alert(`Withdrawal request of ₹${amt.toFixed(2)} completed!`);
                      } else {
                        alert('Insufficient wallet balance.');
                      }
                    }
                  }}
                  className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* SaaS Subscription Packs from Store */}
            <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-4">
              <div>
                <span className="text-xs font-extrabold text-text block">Restaurant SaaS Subscription Packs</span>
                <p className="text-[9px] text-text-secondary mt-0.5">Activate a pack to unlock KDS queue, manage menu, and lower commission fees.</p>
              </div>

              {/* Current Active Plan summary card */}
              <div className={`p-4 rounded-2xl border flex justify-between items-center ${isSubscriptionActive ? 'bg-primary/5 border-primary/30' : 'bg-amber-50 border-amber-200'}`}>
                <div>
                  <span className="text-[9px] font-black uppercase text-text-secondary block">Current Outlet Subscription</span>
                  <h4 className="font-black text-sm text-text mt-0.5">{restaurant.subscriptionPlan || 'No Active Plan'}</h4>
                  <p className="text-[9px] text-text-secondary mt-0.5">
                    {isSubscriptionActive 
                      ? `Valid until ${new Date(restaurant.subscriptionExpires).toLocaleDateString()} (${daysRemaining} days left)`
                      : 'Expired on ' + new Date(restaurant.subscriptionExpires).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isSubscriptionActive ? 'bg-primary text-white' : 'bg-amber-600 text-white'}`}>
                  {isSubscriptionActive ? 'Active' : 'Expired'}
                </span>
              </div>

              <div className="space-y-3">
                {subscriptionPlans.filter(p => p.isActive).map((plan) => {
                  const isCurrent = restaurant.subscriptionPlan === plan.name;
                  return (
                    <div 
                      key={plan.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isCurrent 
                          ? 'border-primary bg-primary/3 shadow-sm' 
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-xs text-text">{plan.name}</h4>
                            {isCurrent && (
                              <span className="bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Current</span>
                            )}
                          </div>
                          <p className="text-[9px] text-text-secondary mt-0.5">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <h3 className="text-sm font-black text-text">₹{plan.price.toFixed(2)}</h3>
                          <span className="text-[8px] bg-slate-100 font-bold px-1.5 py-0.5 rounded text-slate-600 block mt-0.5">{plan.commissionRate}% Fee</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                        <ul className="space-y-1 text-[9px] text-slate-600 font-medium flex-1">
                          {plan.features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-primary flex-shrink-0" />
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => {
                            if (restaurantWallet && restaurantWallet.balance >= plan.price) {
                              upgradeRestaurantSubscription(activeRestaurantId, plan.id);
                              alert(`Successfully subscribed to ${plan.name}! Subscription valid for 30 days.`);
                            } else {
                              const confirmDirect = confirm(
                                `Your wallet balance (₹${restaurantWallet?.balance.toFixed(2)}) is less than ₹${plan.price}. Would you like to complete subscription activation?`
                              );
                              if (confirmDirect) {
                                upgradeRestaurantSubscription(activeRestaurantId, plan.id);
                                alert(`Subscribed to ${plan.name}! Subscription active for 30 days.`);
                              }
                            }
                          }}
                          className={`py-2 px-4 rounded-xl text-xs font-extrabold shadow-xs transition-all ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-primary hover:bg-primary-dark text-white'
                          }`}
                        >
                          {isCurrent ? 'Renew Plan' : 'Subscribe Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Floating Circle bottom navigation bar */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 py-2.5 px-4 flex justify-between items-center z-40 select-none shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        {[
          { id: 'dashboard' as const, label: 'Analytics', icon: BarChart2 },
          { id: 'orders' as const, label: 'KDS Queue', icon: Clock, badge: pendingOrders.length + activeOrders.length },
          { id: 'menu' as const, label: 'Menu', icon: Utensils },
          { id: 'wallet' as const, label: 'Wallet/SaaS', icon: Wallet }
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
                <span className="absolute top-0 right-6 bg-danger text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Menu add dish Modal */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] overflow-hidden w-full max-w-sm flex flex-col shadow-2xl relative p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-text uppercase">Add Menu Dish</span>
              <button
                onClick={() => { setShowAddFoodModal(false); setNewFoodImage(null); }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Image Upload Zone */}
            <div
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleImageFile(file);
              }}
              className={`relative h-36 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all flex items-center justify-center ${
                isDraggingOver
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : newFoodImage
                  ? 'border-transparent'
                  : 'border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-primary/3'
              }`}
            >
              {newFoodImage ? (
                <>
                  <img src={newFoodImage} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="text-white text-center">
                      <ImagePlus className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-[10px] font-bold">Change Photo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setNewFoodImage(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center px-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <ImagePlus className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500">Tap to upload dish photo</p>
                  <p className="text-[9px] text-slate-400">JPG, PNG, WEBP · Max 5 MB</p>
                </div>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />
            
            <form onSubmit={handleAddNewFood} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Dish Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourdough Garlic Bread"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 199.00"
                  value={newFoodPrice}
                  onChange={(e) => setNewFoodPrice(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Description</label>
                <textarea
                  placeholder="e.g. Hand stretched sourdough knots with garlic butter..."
                  value={newFoodDesc}
                  onChange={(e) => setNewFoodDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white resize-none"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-text-secondary block">Cuisine Category</label>
                  <select
                    value={newFoodCat}
                    onChange={(e) => setNewFoodCat(e.target.value)}
                    className="w-full border border-slate-100 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:bg-white font-bold"
                  >
                    {foodCategories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="relative inline-flex items-center cursor-pointer select-none pb-2">
                    <input
                      type="checkbox"
                      checked={newFoodVeg}
                      onChange={(e) => setNewFoodVeg(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-2 text-[10px] font-bold text-text-secondary">Veg-certified</span>
                  </label>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md transition-colors mt-4"
              >
                Publish Dish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Registering / Applying for a New Restaurant Outlet */}
      {showAppModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] overflow-hidden w-full max-w-sm flex flex-col shadow-2xl relative p-5 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold text-text uppercase">Apply for Restaurant Account</span>
              </div>
              <button
                onClick={() => setShowAppModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleApplyRestaurant} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Restaurant / Outlet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Curry House"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Outlet Street Address & Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 142 MG Road, Indiranagar, Bengaluru"
                  value={appAddress}
                  onChange={(e) => setAppAddress(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Delivery Service Radius (km)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="5.0"
                  value={appRadius}
                  onChange={(e) => setAppRadius(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Store Description</label>
                <textarea
                  placeholder="e.g. Authentic North Indian curries & tandoori breads baked fresh..."
                  value={appDesc}
                  onChange={(e) => setAppDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white resize-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Logo Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={appLogo}
                  onChange={(e) => setAppLogo(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-mono text-[10px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-text-secondary block">Banner Cover URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={appBanner}
                  onChange={(e) => setAppBanner(e.target.value)}
                  className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:bg-white font-mono text-[10px]"
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-[9px] text-amber-800 font-semibold space-y-1">
                <p>ℹ️ Submitted applications require <strong>Super Admin Review & Approval</strong> before opening for live orders.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md transition-colors mt-2"
              >
                Submit Application to Super Admin
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
