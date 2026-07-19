import React, { useState, useEffect } from 'react';
import { useAppStore, Restaurant, Food, CartItem, Order } from '../../store/useAppStore';
import { LiveMap } from '../../components/map/LiveMap';
import { MapErrorBoundary } from '../../components/map/MapErrorBoundary';
import { 
  ShoppingBag, Search, Star, Compass, Wallet, MapPin, 
  Award, Trash2, ArrowRight,
  Sparkles, CheckCircle2, ShieldCheck, User, Plus, Minus, 
  Phone, MessageSquare, ChevronLeft, Tag, LogOut,
  Smartphone, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footer } from '../../components/footer/Footer';
import { FooterPage } from './FooterPage';
import { AuthModal } from '../../components/auth/AuthModal';

import { LocationPickerMap } from '../../components/map/LocationPickerMap';

export const CustomerPortal: React.FC = () => {
  const {
    currentUser,
    restaurants,
    foodCategories,
    orders,
    cart,
    addToCart,
    removeFromCart,
    deliveryAddress,
    applyPromoCode,
    promoCode,
    discountPercentage,
    placeOrder,
    cancelOrder,
    wallets,
    addMoneyToCustomerWallet,
    submitSupportTicket,
    updateUserProfile,
    logout,
    setDeliveryAddress,
    welcomeBannerImage,
    isAuthenticated,
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'cart' | 'orders' | 'profile'>('home');
  const [activeFooterPage, setActiveFooterPage] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  // Profile Information Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profileDob, setProfileDob] = useState(currentUser.dob || '');
  const [profileGender, setProfileGender] = useState(currentUser.gender || 'Male');
  const [profileLang, setProfileLang] = useState(currentUser.preferredLanguage || 'English');

  // Address Management States
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address Form States
  const [recipientName, setRecipientName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [addressType, setAddressType] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [houseNumber, setHouseNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('USA');
  const [pincode, setPincode] = useState('');
  const [addressLat, setAddressLat] = useState(40.7484);
  const [addressLng, setAddressLng] = useState(-73.9857);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isAddressDefault, setIsAddressDefault] = useState(false);

  // Guest authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState<{ title?: string; subtitle?: string; initialTab?: 'login' | 'register' }>({});

  const checkAuthAndExecute = (action: () => void, title?: string, subtitle?: string) => {
    if (!isAuthenticated) {
      setAuthModalConfig({ title, subtitle, initialTab: 'login' });
      setShowAuthModal(true);
    } else {
      action();
    }
  };
  
  // Customization modal states
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isVegOnly, setIsVegOnly] = useState(false);

  // Live GPS location state
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'live' | 'denied'>('idle');
  const [liveLocationLabel, setLiveLocationLabel] = useState<string | null>(null);

  // Request GPS on mount, reverse-geocode via Nominatim
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address;
          // Build a short readable label
          const label = [
            addr.road || addr.pedestrian || addr.neighbourhood,
            addr.suburb || addr.city_district,
            addr.city || addr.town || addr.village
          ].filter(Boolean).join(', ');
          const displayLabel = label || data.display_name?.split(',').slice(0, 2).join(',').trim();
          setLiveLocationLabel(displayLabel);
          setDeliveryAddress(displayLabel, latitude, longitude);
          setLocationStatus('live');
        } catch {
          setLocationStatus('live');
        }
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Check URL query parameters for payment return redirection from JZ Store Cash Gateway
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gatewayOrderId = params.get('gateway_order_id');
    if (gatewayOrderId) {
      const verifyReturnedOrder = async (orderId: string) => {
        setPaymentVerifyStatus('verifying');
        try {
          const token = import.meta.env.VITE_JZ_CASH_TOKEN || '509ffd178aff24dc09640796da90fc22';
          const statusUrl = import.meta.env.VITE_JZ_CASH_STATUS_URL || 'https://cash.free.jzstore.in/api/check-order-status';
          
          // Send as form-urlencoded (same format as create-order) to avoid corsproxy body mangling
          const formBody = new URLSearchParams();
          formBody.append('user_token', token);
          formBody.append('order_id', orderId);

          const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(statusUrl)}`;
          const res = await fetch(proxiedUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString()
          });
          const data = await res.json();

          console.log('Payment status response:', data);
          
          // API returns status:true on success with result containing order details
          const isSuccess = data && (
            data.status === true ||
            data.status === 'SUCCESS' ||
            data.status === 'COMPLETED' ||
            data.result?.status === 'SUCCESS' ||
            data.result?.status === 'COMPLETED' ||
            data.result?.txnStatus === 'COMPLETED' ||
            data.result?.txnStatus === 'SUCCESS'
          );

          if (isSuccess) {
            const orderRes = placeOrder('CARD');
            if (typeof orderRes === 'string') {
              alert(`Payment verified but order placement failed: ${orderRes}`);
            } else {
              alert('🎉 Payment successful! Your order has been placed.');
              setActiveTab('orders');
            }
          } else {
            alert(`Payment verification failed: ${data.message || data.result?.message || 'Transaction was not completed'}`);
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          alert('Network issue during payment verification. Please check your order history.');
        } finally {
          setPaymentVerifyStatus('idle');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      
      verifyReturnedOrder(gatewayOrderId);
    }
  }, []);

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setRecipientName(currentUser.name || '');
    setAddressPhone(currentUser.phone || '');
    setAlternativePhone('');
    setAddressType('HOME');
    setHouseNumber('');
    setBuildingName('');
    setStreet('');
    setLandmark('');
    setArea('');
    setCity('');
    setState('');
    setCountry('USA');
    setPincode('');
    setAddressLat(40.7484);
    setAddressLng(-73.9857);
    setDeliveryNote('');
    setIsAddressDefault(addresses.length === 0);
    setShowAddressForm(true);
  };

  const openEditAddressForm = (addr: any) => {
    setEditingAddressId(addr.id);
    setRecipientName(addr.recipientName);
    setAddressPhone(addr.phoneNumber);
    setAlternativePhone(addr.alternativePhone || '');
    setAddressType(addr.addressType);
    setHouseNumber(addr.houseNumber);
    setBuildingName(addr.buildingName || '');
    setStreet(addr.street);
    setLandmark(addr.landmark || '');
    setArea(addr.area);
    setCity(addr.city);
    setState(addr.state);
    setCountry(addr.country);
    setPincode(addr.pincode);
    setAddressLat(addr.latitude);
    setAddressLng(addr.longitude);
    setDeliveryNote(addr.deliveryNote || '');
    setIsAddressDefault(addr.isDefault);
    setShowAddressForm(true);
  };

  const detectAddressLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddressLat(latitude);
        setAddressLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address;
          
          setHouseNumber(addr.house_number || '');
          setBuildingName(addr.building || addr.apartment || '');
          setStreet(addr.road || addr.pedestrian || '');
          setArea(addr.suburb || addr.neighbourhood || addr.city_district || '');
          setCity(addr.city || addr.town || addr.village || '');
          setState(addr.state || '');
          setCountry(addr.country || 'USA');
          setPincode(addr.postcode || '');
        } catch (err) {
          console.error('Error reverse geocoding address:', err);
        }
      },
      (err) => {
        alert(`Error fetching GPS coordinates: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSaveAddress = () => {
    if (!recipientName.trim()) {
      alert('Recipient Name is required');
      return;
    }
    if (!addressPhone.trim()) {
      alert('Phone Number is required');
      return;
    }
    if (!houseNumber.trim() || !street.trim()) {
      alert('House Number and Street Name are required');
      return;
    }
    if (!city.trim() || !state.trim()) {
      alert('City and State are required');
      return;
    }
    if (!pincode.trim()) {
      alert('Pincode / ZIP Code is required');
      return;
    }

    const payload = {
      userId: currentUser.id,
      recipientName,
      phoneNumber: addressPhone,
      alternativePhone,
      addressType,
      houseNumber,
      buildingName,
      street,
      landmark,
      area,
      city,
      state,
      country,
      pincode,
      latitude: addressLat,
      longitude: addressLng,
      deliveryNote,
      isDefault: isAddressDefault
    };

    if (editingAddressId) {
      updateAddress(editingAddressId, payload);
      if (isAddressDefault) {
        const label = `${houseNumber} ${buildingName ? buildingName + ', ' : ''}${street}, ${area}, ${city}, ${state} ${pincode}`;
        setDeliveryAddress(label, addressLat, addressLng);
      }
    } else {
      addAddress(payload);
      if (isAddressDefault) {
        const label = `${houseNumber} ${buildingName ? buildingName + ', ' : ''}${street}, ${area}, ${city}, ${state} ${pincode}`;
        setDeliveryAddress(label, addressLat, addressLng);
      }
    }

    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  const saveProfileChanges = () => {
    if (!profileName.trim()) {
      alert('Profile Name is required');
      return;
    }
    if (!profilePhone.trim()) {
      alert('Phone Number is required');
      return;
    }

    updateUserProfile({
      name: profileName,
      phone: profilePhone,
      email: profileEmail,
      dob: profileDob,
      gender: profileGender,
      preferredLanguage: profileLang
    });

    setIsEditingProfile(false);
    alert('🎉 Profile details updated successfully!');
  };

  // Driver Tipping Option
  const [driverTip, setDriverTip] = useState<number>(0);

  // Wallet and ticket forms
  const [amountToAdd, setAmountToAdd] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'WALLET' | 'COD' | 'CARD'>('WALLET');
  const [paymentVerifyStatus, setPaymentVerifyStatus] = useState<'idle' | 'verifying'>('idle');
  const [orderSuccessToast, setOrderSuccessToast] = useState(false);

  const customerWallet = wallets.find(w => w.ownerId === currentUser.id);
  const activeOrder = orders.find(o => o.customerId === currentUser.id && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');

  // Math calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    const itemPrice = item.food.price + 
      (item.selectedVariant ? item.selectedVariant.price : 0) +
      item.selectedAddons.reduce((aSum, a) => aSum + a.price, 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  const isPrime = currentUser.membershipTier === 'PRIME';
  const deliveryFee = isPrime ? 0.00 : 39.00; // In INR
  const tax = 0.00; // Taxes & GST is FREE
  const discount = parseFloat((cartSubtotal * (discountPercentage / 100)).toFixed(2));
  const cartTotal = parseFloat((cartSubtotal + deliveryFee + tax + driverTip - discount).toFixed(2));

  // Handle Addon selection toggle
  const toggleAddon = (addon: any) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Add customized item to Zustand cart
  const handleAddToCart = () => {
    if (!selectedFood) return;
    checkAuthAndExecute(() => {
      const cartItem: CartItem = {
        food: selectedFood,
        quantity,
        selectedVariant,
        selectedAddons
      };
      addToCart(cartItem);
      setSelectedFood(null);
      setQuantity(1);
      setSelectedVariant(null);
      setSelectedAddons([]);
    }, 'Add to Basket', 'Please sign in to add delicious items to your basket and customize options.');
  };

  // Open food customization modal
  const openFoodModal = (food: Food) => {
    setSelectedFood(food);
    setSelectedVariant(food.variants && food.variants.length > 0 ? food.variants[0] : null);
    setSelectedAddons([]);
    setQuantity(1);
  };

  const handleCheckout = async () => {
    checkAuthAndExecute(async () => {
      if (checkoutPaymentMethod === 'CARD') {
        setPaymentVerifyStatus('verifying');
        const uniqueId = `ORD${Math.floor(100000 + Math.random() * 900000)}`;
        try {
          const rawPhone = currentUser.phone || '9876543210';
          const cleanMobile = rawPhone.replace(/\D/g, '').slice(-10) || '9876543210';
          const token = import.meta.env.VITE_JZ_CASH_TOKEN || '509ffd178aff24dc09640796da90fc22';
          const createUrl = import.meta.env.VITE_JZ_CASH_CREATE_URL || 'https://cash.free.jzstore.in/api/create-order';

          const formDataObj = new URLSearchParams();
          formDataObj.append('customer_mobile', cleanMobile);
          formDataObj.append('user_token', token);
          formDataObj.append('amount', Math.round(cartTotal).toString());
          formDataObj.append('order_id', uniqueId);
          formDataObj.append('redirect_url', `${window.location.origin}${window.location.pathname}?gateway_order_id=${uniqueId}`);
          formDataObj.append('remark1', currentUser.name);
          formDataObj.append('remark2', 'Shipbite Checkout');

          const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(createUrl)}`;
          const response = await fetch(proxiedUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formDataObj.toString()
          });
          const data = await response.json();
          
          if (data && data.status === true && data.result?.payment_url) {
            window.location.href = data.result.payment_url;
          } else {
            alert(`Failed to create gateway order: ${data.message || 'Unknown error'}`);
            setPaymentVerifyStatus('idle');
          }
        } catch (err) {
          console.error('Error redirecting to payment gateway:', err);
          alert('Network issue contacting payment gateway. Please try again.');
          setPaymentVerifyStatus('idle');
        }
      } else {
        const res = placeOrder(checkoutPaymentMethod) as string | Order;
        if (typeof res === 'string') {
          alert(res);
        } else {
          setDriverTip(0);
          setOrderSuccessToast(true);
          setTimeout(() => {
            setOrderSuccessToast(false);
            setActiveTab('orders');
          }, 2000);
        }
      }
    }, 'Checkout Securely', 'Create an account or sign in to complete your payment and place the order.');
  };

  const categories = [
    { name: 'All', icon: '🍽️' },
    ...foodCategories.map(c => {
      const iconMap: Record<string, string> = {
        'Pizza': '🍕',
        'Burgers': '🍔',
        'Sushi': '🍣',
        'Desserts': '🍰',
        'Healthy': '🥗',
        'Chinese': '🥢',
        'Italian': '🍝',
        'Indian': '🍛',
        'Mexican': '🌮',
        'Fast Food': '🍟',
        'Drinks': '🧃',
        'Bakery': '🥐'
      };
      return { name: c.name, icon: iconMap[c.name] || '🍲' };
    })
  ];

  if (activeFooterPage) {
    return (
      <FooterPage 
        pageId={activeFooterPage} 
        onBack={() => setActiveFooterPage(null)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setSelectedRestaurant(null);
          setActiveFooterPage(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-20">
      
      {/* Sticky Top Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-40 px-4 py-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                locationStatus === 'live' ? 'bg-primary/10' : 'bg-slate-100'
              }`}
            >
              {locationStatus === 'fetching' ? (
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <MapPin className={`w-4 h-4 ${locationStatus === 'live' ? 'text-primary' : 'text-slate-400'}`} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                  {locationStatus === 'fetching' ? 'Locating...' : locationStatus === 'live' ? 'Live Location' : 'Delivering To'}
                </span>
                {locationStatus === 'live' && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                )}
                {locationStatus === 'denied' && (
                  <span className="text-[8px] text-amber-500 font-bold">(GPS off)</span>
                )}
              </div>
              <span className="text-xs font-extrabold text-text truncate max-w-[160px] block leading-tight">
                {locationStatus === 'fetching'
                  ? 'Getting your location…'
                  : (liveLocationLabel || deliveryAddress)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  setAuthModalConfig({ title: 'Welcome to Shipbite', subtitle: 'Sign in to access your profile, track active orders and checkout.' });
                  setShowAuthModal(true);
                }}
                className="text-[10px] font-black uppercase tracking-wider bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Sign In
              </button>
            ) : (
              <>
                {isPrime ? (
                  <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 fill-current" /> PRIME
                  </span>
                ) : (
                  <button 
                    onClick={() => updateUserProfile({ membershipTier: 'PRIME' })}
                    className="text-[9px] border border-amber-500 text-amber-600 hover:bg-amber-50 font-bold px-2 py-0.5 rounded-full transition-all"
                  >
                    Join Prime
                  </button>
                )}
                <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <button
                  onClick={logout}
                  className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Global sticky search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pizza, burger, sushi near you..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'home' && activeTab !== 'search') {
                setActiveTab('search');
              }
            }}
            onFocus={() => {
              if (activeTab !== 'home') setActiveTab('search');
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-100 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all shadow-inner"
          />
        </div>
      </header>

      {/* Main Tab Screen Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME FEED */}
          {activeTab === 'home' && (
            <motion.div
              key="home-feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {!selectedRestaurant ? (
                <>
                  {/* Offers banner carousel card */}
                  <div 
                    className="rounded-[22px] p-5 text-white shadow-premium relative overflow-hidden flex flex-col justify-between h-40 bg-cover bg-center"
                    style={{
                      backgroundImage: welcomeBannerImage 
                        ? `linear-gradient(to bottom right, rgba(16, 185, 129, 0.3), rgba(6, 78, 59, 0.95)), url(${welcomeBannerImage})`
                        : 'linear-gradient(to bottom right, #059669, #047857)'
                    }}
                  >
                    <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-25 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent"></div>
                    <div className="space-y-1.5 max-w-[240px] z-10">
                      <span className="bg-white/20 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">Welcome Offer</span>
                      <h2 className="text-lg font-black leading-tight">Flat 50% Off on Pizza & Cuisines!</h2>
                      <p className="text-[10px] text-green-100">Use promo coupon code <strong className="font-mono bg-white/25 px-1.5 py-0.5 rounded font-black">WELCOME50</strong></p>
                    </div>
                  </div>

                  {/* Guest Sign-In CTA Banner */}
                  {!isAuthenticated && (
                    <div className="rounded-[18px] border border-primary/20 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 p-4 flex items-center justify-between gap-3 shadow-sm">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 leading-tight">🔒 Sign in to place orders</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Log in or create an account to add items &amp; checkout</p>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setAuthModalConfig({ title: 'Welcome Back!', subtitle: 'Sign in to add items to your cart and place orders.', initialTab: 'login' });
                            setShowAuthModal(true);
                          }}
                          className="text-[10px] font-black uppercase tracking-wider bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => {
                            setAuthModalConfig({ title: 'Join Shipbite 🚀', subtitle: 'Create a free account to order food, track deliveries and more.', initialTab: 'register' });
                            setShowAuthModal(true);
                          }}
                          className="text-[10px] font-black uppercase tracking-wider border border-primary text-primary hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-all active:scale-95 whitespace-nowrap"
                        >
                          Create Account
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Circle horizontal categories */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Eat what saves your mood</span>
                    <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar justify-between">
                      {categories.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setSelectedCategory(c.name)}
                          className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                        >
                          <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-xl transition-all shadow-sm ${
                            selectedCategory === c.name 
                              ? 'bg-primary border-primary text-white scale-105 ring-4 ring-primary/10'
                              : 'bg-white border-slate-100 text-slate-700 group-hover:bg-slate-50'
                          }`}>
                            {c.icon}
                          </div>
                          <span className={`text-[10px] font-bold ${selectedCategory === c.name ? 'text-primary' : 'text-text-secondary'}`}>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Veg-only fast filter toggle pill */}
                  <div className="flex justify-between items-center bg-white p-3 rounded-[16px] border border-slate-100 shadow-sm text-xs">
                    <span className="font-bold text-text-secondary">Vegetarian food option only</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isVegOnly}
                        onChange={(e) => setIsVegOnly(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Restaurant list */}
                  <div className="space-y-4">
                    <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Popular Restaurants Nearby</span>
                    <div className="space-y-4">
                      {restaurants
                        .filter(r => r.isApproved)
                        .filter(r => selectedCategory === 'All' || r.categories.some(c => c.name === selectedCategory))
                        .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((rest) => (
                          <div
                            key={rest.id}
                            onClick={() => setSelectedRestaurant(rest)}
                            className="bg-white rounded-[22px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300 cursor-pointer flex flex-col group relative"
                          >
                            <div className="h-36 w-full overflow-hidden relative bg-slate-100">
                              <img 
                                src={rest.banner} 
                                alt={rest.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm text-[10px] font-black text-text">
                                <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                                <span>{rest.rating.toFixed(1)}</span>
                              </div>
                              {rest.isVerified && (
                                <div className="absolute top-3 left-3 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                                  <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                                </div>
                              )}
                              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                                {rest.deliveryRadius} km • {20 + Math.floor(rest.rating * 2)} mins
                              </div>
                            </div>
                            <div className="p-4 flex gap-3.5 items-start">
                              <img 
                                src={rest.logo} 
                                alt={rest.name} 
                                className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-sm text-text group-hover:text-primary transition-colors truncate">{rest.name}</h4>
                                <p className="text-[10px] text-text-secondary truncate mt-0.5">{rest.description}</p>
                                <p className="text-[9px] text-primary font-bold mt-1 bg-green-50 inline-block px-1.5 py-0.5 rounded">Free delivery with Prime</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <Footer onLinkClick={setActiveFooterPage} />
                </>
              ) : (
                /* Restaurant Detail Page (Native iOS screen format) */
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setSelectedRestaurant(null)}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-primary transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back to feed
                    </button>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Restaurant Menu</span>
                  </div>

                  {/* Header profile banner of restaurant */}
                  <div className="h-44 rounded-[22px] overflow-hidden relative shadow-premium bg-slate-100">
                    <img 
                      src={selectedRestaurant.banner} 
                      alt={selectedRestaurant.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                      <div className="flex gap-3 items-center">
                        <img 
                          src={selectedRestaurant.logo} 
                          alt={selectedRestaurant.name} 
                          className="w-12 h-12 rounded-xl border border-white object-cover shadow-md"
                        />
                        <div className="space-y-0.5">
                          <h2 className="text-base font-black leading-tight">{selectedRestaurant.name}</h2>
                          <p className="text-[9px] text-white/80 line-clamp-1">{selectedRestaurant.description}</p>
                        </div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm text-xs font-black text-white">
                        <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                        <span>{selectedRestaurant.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu offering rows */}
                  <div className="space-y-3">
                    <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Menu Options</span>
                    <div className="space-y-3">
                      {selectedRestaurant.menu
                        .filter(f => !isVegOnly || f.isVeg)
                        .map((food) => {
                          const quantityInCart = cart.find(it => it.food.id === food.id)?.quantity || 0;
                          return (
                            <div 
                              key={food.id}
                              className="bg-white rounded-[22px] border border-slate-100 p-3.5 flex gap-3 shadow-sm hover:shadow-premium transition-shadow relative"
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden relative bg-slate-100 flex-shrink-0">
                                <img 
                                  src={food.image} 
                                  alt={food.name} 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1.5 left-1.5">
                                  <span className={`w-3 h-3 rounded border border-white flex items-center justify-center ${food.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-start gap-1">
                                    <h4 className="font-extrabold text-xs text-text leading-snug truncate">{food.name}</h4>
                                    {food.isBestseller && (
                                      <span className="bg-amber-400 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase">Bestseller</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">{food.description}</p>
                                </div>
                                <div className="flex justify-between items-center mt-2.5">
                                  <span className="font-extrabold text-xs text-primary">₹{food.price.toFixed(2)}</span>
                                  {quantityInCart > 0 ? (
                                    <div className="flex items-center bg-primary text-white rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-sm gap-2">
                                      <button onClick={() => removeFromCart(food.id)} className="hover:scale-105 active:scale-95"><Minus className="w-3 h-3" /></button>
                                      <span>{quantityInCart}</span>
                                      <button onClick={() => openFoodModal(food)} className="hover:scale-105 active:scale-95"><Plus className="w-3 h-3" /></button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => openFoodModal(food)}
                                      className="py-1 px-3.5 border border-primary hover:bg-primary/5 text-primary rounded-lg font-extrabold text-[10px] transition-colors shadow-sm"
                                    >
                                      Add +
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: SEARCH DISHES */}
          {activeTab === 'search' && (
            <motion.div
              key="search-portal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Discover foods & cuisines</span>
                <p className="text-[10px] text-text-secondary">Search across the entire platform's multi-vendor kitchens.</p>
              </div>

              {/* Keyword chips tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['Pizza', 'Burger', 'Sushi', 'Desserts', 'Garlic Knots', 'Maki'].map(word => (
                  <button
                    key={word}
                    onClick={() => setSearchQuery(word)}
                    className="px-3 py-1.5 bg-white border border-slate-100 hover:border-primary/30 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm transition-all"
                  >
                    #{word}
                  </button>
                ))}
              </div>

              {/* Cuisines listing */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase block">Matched Menu Offerings</span>
                {restaurants
                  .flatMap(r => r.menu.map(f => ({ ...f, restaurant: r })))
                  .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((food) => (
                    <div 
                      key={food.id}
                      className="bg-white rounded-[22px] border border-slate-100 p-3 flex gap-3 shadow-sm items-center hover:shadow-premium transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedRestaurant(food.restaurant);
                        setActiveTab('home');
                      }}
                    >
                      <img 
                        src={food.image} 
                        alt={food.name} 
                        className="w-14 h-14 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded uppercase">{food.restaurant.name}</span>
                        <h4 className="font-extrabold text-xs text-text leading-tight truncate mt-0.5">{food.name}</h4>
                        <p className="text-[10px] font-bold text-primary mt-0.5">₹{food.price.toFixed(2)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: CART SUMMARY & CHECKOUT */}
          {activeTab === 'cart' && (
            <motion.div
              key="cart-checkout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Verify Basket Checkout</span>
                <p className="text-[10px] text-text-secondary">Confirm payment models, apply deals and add driver tips.</p>
              </div>

              {cart.length === 0 ? (
                <div className="bg-white rounded-[22px] border border-slate-100 p-8 text-center shadow-sm space-y-4">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-text">Your Basket is Empty</h3>
                    <p className="text-[10px] text-text-secondary">Browse restaurants to select delicious foods!</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="py-2.5 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Browse Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Checkout Delivery Address Selector Card */}
                  <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-text flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-primary animate-pulse" />
                        <span>Delivery Address</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddressManager(true)}
                        className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2.5 py-0.5 rounded-lg"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-1 text-xs">
                      {addresses.find(a => a.isDefault) ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[7px] font-black uppercase text-slate-600">
                              {addresses.find(a => a.isDefault)?.addressType}
                            </span>
                            <span className="font-extrabold text-text text-[10px]">
                              {addresses.find(a => a.isDefault)?.recipientName} ({addresses.find(a => a.isDefault)?.phoneNumber})
                            </span>
                          </div>
                          <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                            {addresses.find(a => a.isDefault)?.houseNumber} {addresses.find(a => a.isDefault)?.buildingName ? addresses.find(a => a.isDefault)?.buildingName + ', ' : ''}{addresses.find(a => a.isDefault)?.street}, {addresses.find(a => a.isDefault)?.area}, {addresses.find(a => a.isDefault)?.city}, {addresses.find(a => a.isDefault)?.state} {addresses.find(a => a.isDefault)?.pincode}
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                          {deliveryAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cart items list */}
                  <div className="bg-white rounded-[22px] border border-slate-100 p-4 space-y-3.5 shadow-sm">
                    {cart.map((item, index) => {
                      const itemPrice = item.food.price + 
                        (item.selectedVariant ? item.selectedVariant.price : 0) +
                        item.selectedAddons.reduce((sum, a) => sum + a.price, 0);
                      return (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-text">{item.quantity}x {item.food.name}</span>
                            <div className="text-[9px] text-text-secondary flex flex-wrap gap-1">
                              {item.selectedVariant && (
                                <span className="bg-slate-100 px-1 rounded font-semibold text-slate-600">{item.selectedVariant.name}</span>
                              )}
                              {item.selectedAddons.map(a => (
                                <span key={a.id} className="text-primary font-medium">+{a.name}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-text">₹{(itemPrice * item.quantity).toFixed(2)}</span>
                            <button 
                              onClick={() => removeFromCart(item.food.id, item.selectedVariant?.id, item.selectedAddons.map(x => x.id))}
                              className="text-danger hover:text-danger/80"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Card */}
                  <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-secondary flex items-center gap-1"><Tag className="w-4 h-4 text-primary" /> Apply Promo Code</span>
                      {discountPercentage > 0 && <span className="text-[10px] text-primary font-bold">Applied!</span>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. WELCOME50"
                        value={promoCode}
                        onChange={(e) => applyPromoCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-100 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white"
                      />
                      <button
                        onClick={() => {
                          const ok = applyPromoCode(promoCode);
                          if (ok) {
                            alert(`Promo code applied successfully!`);
                          } else {
                            alert('Invalid coupon code. Try WELCOME50');
                          }
                        }}
                        className="py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Driver Tipping card */}
                  <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-extrabold text-text block">Support delivery partner</span>
                        <p className="text-[9px] text-text-secondary">Tip goes directly to driver's bank payouts</p>
                      </div>
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <Award className="w-4.5 h-4.5 text-primary" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[10, 20, 50].map((tip) => (
                        <button
                          key={tip}
                          onClick={() => setDriverTip(driverTip === tip ? 0 : tip)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            driverTip === tip 
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          ₹{tip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkout Payment choice cards */}
                  <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
                    <span className="text-xs font-extrabold text-text block">Select Payment Mode</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setCheckoutPaymentMethod('WALLET')}
                        className={`p-2.5 border rounded-xl text-center text-[10px] font-semibold flex flex-col items-center justify-between min-h-20 transition-all ${
                          checkoutPaymentMethod === 'WALLET'
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <motion.div
                          animate={checkoutPaymentMethod === 'WALLET' ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="flex-shrink-0"
                        >
                          <Wallet className="w-4.5 h-4.5" />
                        </motion.div>
                        <span className="leading-tight mt-1">Wallet</span>
                        <span className="text-[7px] text-text-secondary truncate max-w-full font-medium mt-0.5">(₹{customerWallet?.balance.toFixed(0)})</span>
                      </button>
                      <button
                        onClick={() => setCheckoutPaymentMethod('CARD')}
                        className={`p-2.5 border rounded-xl text-center text-[10px] font-semibold flex flex-col items-center justify-between min-h-20 transition-all ${
                          checkoutPaymentMethod === 'CARD'
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <motion.div
                          animate={checkoutPaymentMethod === 'CARD' ? { y: [0, -3, 0], scale: [1, 1.1, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                          className="flex-shrink-0"
                        >
                          <Smartphone className="w-4.5 h-4.5" />
                        </motion.div>
                        <span className="leading-tight mt-1">UPI</span>
                        <span className="text-[7px] text-text-secondary truncate max-w-full font-medium mt-0.5">Instant Pay</span>
                      </button>
                      <button
                        onClick={() => setCheckoutPaymentMethod('COD')}
                        className={`p-2.5 border rounded-xl text-center text-[10px] font-semibold flex flex-col items-center justify-between min-h-20 transition-all ${
                          checkoutPaymentMethod === 'COD'
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <motion.div
                          animate={checkoutPaymentMethod === 'COD' ? { rotate: [0, 12, -12, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                          className="flex-shrink-0"
                        >
                          <Coins className="w-4.5 h-4.5" />
                        </motion.div>
                        <span className="leading-tight mt-1">COD</span>
                        <span className="text-[7px] text-text-secondary truncate max-w-full font-medium mt-0.5">Pay on Delivery</span>
                      </button>
                    </div>
                  </div>

                  {/* Calculations details */}
                  <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-2 text-xs font-semibold text-text-secondary">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span>{isPrime ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & GST (FREE)</span>
                      <span className="text-primary font-bold">₹0.00</span>
                    </div>
                    {driverTip > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Partner Tipping</span>
                        <span>₹{driverTip.toFixed(2)}</span>
                      </div>
                    )}
                    {discountPercentage > 0 && (
                      <div className="flex justify-between text-primary font-bold">
                        <span>Promo Discount (-{discountPercentage}%)</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold text-text pt-2 border-t border-slate-100">
                      <span>Grand Total</span>
                      <span className="text-primary text-base">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Touch Friendly large action pay button */}
                   <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Proceed & Pay ₹{cartTotal.toFixed(2)}</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>

                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: ORDER TRACKING MAP / DETAILS */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders-tracking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {activeOrder ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Live Delivery Progress</span>
                    <p className="text-[10px] text-text-secondary">Expected delivery within 20 mins. Pin verification active.</p>
                  </div>

                  {/* Leaflet Live route Map inside phone viewport */}
                  <div key={`map-wrap-${activeOrder.id}`} className="h-60 rounded-[22px] overflow-hidden shadow-inner border border-slate-100 relative bg-slate-100 z-10">
                    <MapErrorBoundary>
                      <LiveMap activeOrder={activeOrder} />
                    </MapErrorBoundary>
                  </div>

                  {/* Driver detail card overlay */}
                  <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">D</div>
                        <div>
                          <span className="text-xs font-extrabold text-text block">Michael Davis</span>
                          <span className="text-[9px] text-text-secondary block">Your Delivery Partner</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"><Phone className="w-4 h-4" /></button>
                        <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"><MessageSquare className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Checkpoint list */}
                    <div className="space-y-3.5 border-t border-slate-100 pt-4 text-xs font-semibold text-text-secondary">
                      {[
                        { status: 'PENDING', label: 'Order Placed', desc: 'Awaiting restaurant approval' },
                        { status: 'ACCEPTED', label: 'Accepted', desc: 'Kitchen is confirming ingredients' },
                        { status: 'PREPARING', label: 'Preparing', desc: 'Chef is baking your meal' },
                        { status: 'READY', label: 'Ready', desc: 'Awaiting driver pickup' },
                        { status: 'PICKED_UP', label: 'Out for Delivery', desc: 'Driver is on their way' },
                        { status: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your food!' }
                      ].map((stage, idx, arr) => {
                        const orderIdx = arr.findIndex(s => s.status === activeOrder.status);
                        const isDone = idx <= orderIdx;
                        const isCurrent = idx === orderIdx;

                        return (
                          <div key={stage.status} className="flex gap-3 relative">
                            {idx < arr.length - 1 && (
                              <div className={`absolute left-2.5 top-5 bottom-0 w-0.5 -translate-x-1/2 ${isDone ? 'bg-primary' : 'bg-slate-200'}`}></div>
                            )}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                              isDone 
                                ? 'bg-primary border-primary text-white' 
                                : 'bg-white border-slate-200 text-slate-300'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <h5 className={`text-[11px] font-extrabold ${isCurrent ? 'text-primary' : 'text-text'}`}>{stage.label}</h5>
                              <p className="text-[9px] text-text-secondary font-medium leading-none mt-0.5">{stage.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Security pin display */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-semibold mt-4">
                      <div>
                        <span className="font-extrabold text-amber-800">Security OTP Check-in</span>
                        <p className="text-[9px] text-amber-600 font-medium">Verify with driver on delivery</p>
                      </div>
                      <span className="font-bold text-sm tracking-widest text-amber-900 bg-white border border-amber-300 px-3 py-1 rounded-lg font-mono shadow-sm">{activeOrder.otp}</span>
                    </div>

                    {activeOrder.status === 'PENDING' && (
                      <button
                        onClick={() => cancelOrder(activeOrder.id)}
                        className="w-full py-2.5 bg-danger/10 hover:bg-danger/20 text-danger font-bold text-xs rounded-xl transition-colors mt-2"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-xs font-extrabold text-text uppercase tracking-wider block">Past Order History</span>
                  {orders.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-xs shadow-sm">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-text-secondary mt-2">No completed orders found.</p>
                    </div>
                  ) : (
                    orders.map((o) => (
                      <div key={o.id} className="bg-white border border-slate-100 rounded-[22px] p-4 space-y-3.5 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 text-xs">
                          <div>
                            <span className="font-extrabold text-text">{o.restaurantName}</span>
                            <p className="text-[9px] text-text-secondary mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[8px] ${
                            o.status === 'DELIVERED' 
                              ? 'bg-green-50 text-green-700' 
                              : o.status === 'CANCELLED' 
                                ? 'bg-red-50 text-red-700' 
                                : 'bg-yellow-50 text-yellow-700'
                          }`}>{o.status}</span>
                        </div>
                        <div className="text-xs text-text-secondary space-y-1.5">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="font-medium">{it!.quantity}x {it!.name} {it!.variant && `(${it!.variant})`}</span>
                              <span className="font-bold">₹{(it!.price * it!.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-xs font-extrabold text-text">
                          <span>Settled Price Paid</span>
                          <span className="text-primary text-sm">₹{o.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: PROFILE WALLET & SUPPORT LOGS */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-options"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Premium user profile credit card display */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-[22px] p-5 text-white shadow-premium relative overflow-hidden flex flex-col justify-between h-44">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-400 to-transparent"></div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-wider text-slate-300 font-bold uppercase">Shipbite Payout Card</span>
                    <h3 className="text-sm font-extrabold text-white">Alex Johnson</h3>
                  </div>
                  <Award className="w-5.5 h-5.5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400">Available Wallet Cash</span>
                  <h2 className="text-2xl font-black tracking-tight text-white">₹{customerWallet?.balance.toFixed(2)}</h2>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-3 border-t border-white/10 text-slate-400">
                  <span>Reward Coins: <strong className="text-primary font-bold">{currentUser.rewardPoints} Pts</strong></span>
                  <span>Active Member</span>
                </div>
              </div>

              {/* My Profile Information Details Card */}
              <div className="bg-white rounded-[22px] border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-text flex items-center gap-1.5">
                    <User className="w-4.5 h-4.5 text-primary" />
                    <span>My Profile</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingProfile) {
                        saveProfileChanges();
                      } else {
                        setIsEditingProfile(true);
                      }
                    }}
                    className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-lg"
                  >
                    {isEditingProfile ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>

                <div className="flex items-center gap-3.5 pb-2">
                  <div className="relative">
                    <img 
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                      alt="Profile Avatar" 
                      className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm"
                    />
                    {isEditingProfile && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-slate-900 border border-white text-white flex items-center justify-center rounded-full text-[6px] cursor-pointer">✎</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-text">{currentUser.name}</h4>
                    <p className="text-[9px] text-text-secondary">Member since {currentUser.memberSince || 'January 2024'}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Full Name</label>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    ) : (
                      <span className="font-semibold text-text">{currentUser.name}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Phone Number</label>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profilePhone} 
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    ) : (
                      <span className="font-semibold text-text">{currentUser.phone}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Email Address</label>
                    {isEditingProfile ? (
                      <input 
                        type="email" 
                        value={profileEmail} 
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    ) : (
                      <span className="font-semibold text-text">{currentUser.email}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Date of Birth</label>
                    {isEditingProfile ? (
                      <input 
                        type="date" 
                        value={profileDob} 
                        onChange={(e) => setProfileDob(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    ) : (
                      <span className="font-semibold text-text">{currentUser.dob || 'Not specified'}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Gender</label>
                    {isEditingProfile ? (
                      <select 
                        value={profileGender} 
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-text">{currentUser.gender || 'Not specified'}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Preferred Language</label>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={profileLang} 
                        onChange={(e) => setProfileLang(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    ) : (
                      <span className="font-semibold text-text">{currentUser.preferredLanguage || 'English'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* My Addresses Trigger Card */}
              <button
                type="button"
                onClick={() => setShowAddressManager(true)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm text-left hover:bg-slate-50 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-text block">My Saved Addresses</span>
                    <span className="text-[9px] text-text-secondary">Manage Home, Work, and other delivery points</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Wallet topup card */}
              <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
                <span className="text-xs font-extrabold text-text block">Load Wallet Cash</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="Load money amount"
                      value={amountToAdd}
                      onChange={(e) => setAmountToAdd(e.target.value)}
                      className="w-full pl-6 pr-3 py-2.5 border border-slate-100 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const amt = parseFloat(amountToAdd);
                      if (amt > 0) {
                        addMoneyToCustomerWallet(amt);
                        setAmountToAdd('');
                        alert(`Successfully added ₹${amt.toFixed(2)} to your wallet!`);
                      }
                    }}
                    className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    Deposit
                  </button>
                </div>
              </div>

              {/* Transaction Logs Accordion */}
              <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
                <span className="text-xs font-extrabold text-text block">Wallet Transaction Payouts</span>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {customerWallet?.transactions.length === 0 ? (
                    <p className="text-[10px] text-text-secondary text-center py-2">No payouts logs found.</p>
                  ) : (
                    customerWallet?.transactions.map((tx) => (
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

              {/* Support ticket desk form */}
              <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3">
                <span className="text-xs font-extrabold text-text block">Submit Support Case</span>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Case Subject"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-100 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white"
                  />
                  <textarea
                    placeholder="Describe issue..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-100 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white resize-none"
                  ></textarea>
                  <button
                    onClick={() => {
                      if (supportSubject && supportMessage) {
                        submitSupportTicket(supportSubject, supportMessage);
                        setSupportSubject('');
                        setSupportMessage('');
                        alert('Support ticket submitted successfully!');
                      } else {
                        alert('Please fill out all fields.');
                      }
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    Submit Case
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating cart alert banner inside CustomerPortal */}
      {cart.length > 0 && activeTab !== 'cart' && (
        <div className="absolute bottom-22 left-4 right-4 bg-primary text-white p-3 rounded-[16px] shadow-lg flex justify-between items-center z-30 animate-bounce">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-extrabold">{cart.reduce((sum, item) => sum + item.quantity, 0)} Items Added</span>
          </div>
          <button 
            onClick={() => setActiveTab('cart')}
            className="flex items-center gap-0.5 text-xs font-black uppercase text-white bg-slate-900/20 px-3 py-1 rounded-lg"
          >
            View Cart <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Circle bottom navigation bar */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 py-2.5 px-4 flex justify-between items-center z-40 select-none shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        {[
          { id: 'home' as const, label: 'Home', icon: Compass },
          { id: 'search' as const, label: 'Search', icon: Search },
          { id: 'cart' as const, label: 'Cart', icon: ShoppingBag, badge: cart.reduce((sum, item) => sum + item.quantity, 0) },
          { id: 'orders' as const, label: 'Tracking', icon: MapPin },
          { id: 'profile' as const, label: 'Profile', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== 'home' && tab.id !== 'search') {
                  checkAuthAndExecute(() => {
                    setActiveTab(tab.id);
                    setSelectedRestaurant(null);
                  }, `${tab.label} Details`, `Sign in or create an account to view your ${tab.label.toLowerCase()}.`);
                } else {
                  setActiveTab(tab.id);
                  if (tab.id !== 'home') setSelectedRestaurant(null);
                }
              }}
              className="flex flex-col items-center justify-center flex-1 relative py-1"
            >
              <div className={`p-1 rounded-full transition-transform ${isActive ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-bold mt-0.5 ${isActive ? 'text-primary font-black' : 'text-slate-400'}`}>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-0 right-4 bg-danger text-white text-[7px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Customized Add Food Modal */}
      {selectedFood && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[24px] overflow-hidden w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl relative"
          >
            <div className="h-40 relative bg-slate-100 flex-shrink-0">
              <img src={selectedFood.image} alt={selectedFood.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedFood(null)}
                className="absolute top-3 right-3 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded border border-white flex items-center justify-center ${selectedFood.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  <h3 className="font-extrabold text-sm text-text leading-tight">{selectedFood.name}</h3>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed">{selectedFood.description}</p>
              </div>

              {/* Variants choice */}
              {selectedFood.variants && selectedFood.variants.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-extrabold text-text uppercase tracking-wider block">Choose Variant</span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFood.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2 border rounded-xl text-center text-[10px] font-bold transition-all ${
                          selectedVariant?.id === v.id
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {v.name}
                        <span className="block text-[8px] text-text-secondary font-medium mt-0.5">+₹{v.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons checkbox choices */}
              {selectedFood.addons && selectedFood.addons.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-extrabold text-text uppercase tracking-wider block">Add Extras</span>
                  <div className="space-y-2">
                    {selectedFood.addons.map((a) => {
                      const isChecked = selectedAddons.some(addon => addon.id === a.id);
                      return (
                        <label 
                          key={a.id} 
                          className={`flex justify-between items-center p-2.5 border rounded-xl cursor-pointer text-[10px] font-bold transition-all select-none ${
                            isChecked 
                              ? 'border-primary bg-primary/5' 
                              : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddon(a)}
                              className="w-3.5 h-3.5 text-primary border-slate-200 rounded focus:ring-primary"
                            />
                            <span>{a.name}</span>
                          </div>
                          <span className="text-primary font-black">+₹{a.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom customize actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center bg-white border border-slate-100 rounded-xl p-1 gap-3.5 shadow-sm text-xs font-bold text-text">
                <button onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} className="hover:scale-105 p-1"><Minus className="w-3.5 h-3.5 text-slate-500" /></button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="hover:scale-105 p-1"><Plus className="w-3.5 h-3.5 text-slate-500" /></button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 ml-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-extrabold text-[11px] shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Add to Basket</span>
                <span>•</span>
                <span>
                  ₹{((
                    selectedFood.price +
                    (selectedVariant ? selectedVariant.price : 0) +
                    selectedAddons.reduce((sum, a) => sum + a.price, 0)
                  ) * quantity).toFixed(2)}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Auth Modal Trigger overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)}
            title={authModalConfig.title}
            subtitle={authModalConfig.subtitle}
            initialTab={authModalConfig.initialTab || 'login'}
          />
        )}
      </AnimatePresence>

      {/* Payment Redirection & Verification Loading Overlay */}
      <AnimatePresence>
        {paymentVerifyStatus === 'verifying' && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[24px] p-6 max-w-xs shadow-2xl space-y-4 border border-slate-100 flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800">Contacting Secure Gateway</h4>
                <p className="text-[9px] text-slate-400 font-medium font-semibold leading-relaxed">Connecting to JZ Store Cash UPI network...</p>
              </div>
              <span className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Placed Success Toast */}
      <AnimatePresence>
        {orderSuccessToast && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="bg-white rounded-[28px] p-6 max-w-xs w-full shadow-2xl border border-slate-100 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-3xl animate-bounce">
                🎉
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">Order Placed!</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Your order has been confirmed.<br />Taking you to live tracking...
                </p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Address Manager Overlay */}
      <AnimatePresence>
        {showAddressManager && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xs z-[999] flex flex-col justify-between p-0">
            {/* Header bar */}
            <div className="bg-white px-4 py-3.5 flex justify-between items-center border-b border-slate-100 text-text flex-shrink-0">
              <span className="text-xs font-black uppercase tracking-wider">My Saved Addresses</span>
              <button
                type="button"
                onClick={() => setShowAddressManager(false)}
                className="text-xs font-black text-slate-500 hover:text-text"
              >
                Close
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
              {addresses.length === 0 ? (
                <div className="bg-white rounded-[22px] border border-slate-100 p-8 text-center shadow-sm space-y-4">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs text-text">No Saved Addresses</h3>
                    <p className="text-[9px] text-text-secondary">Please add a delivery address to complete your checkout faster.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openNewAddressForm}
                    className="py-2.5 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className={`bg-white rounded-[20px] border p-4 shadow-sm space-y-3 transition-all ${
                        addr.isDefault ? 'border-primary ring-1 ring-primary' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-0.5 rounded-full font-black uppercase text-[8px] bg-slate-100 text-slate-700 flex items-center gap-1">
                          {addr.addressType === 'HOME' ? '🏠 Home' : addr.addressType === 'WORK' ? '🏢 Work' : '📍 Other'}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[8px] bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">Default</span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs">
                        <span className="font-extrabold text-text block">{addr.recipientName}</span>
                        <span className="text-text-secondary text-[10px] block font-medium">{addr.phoneNumber}</span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          {addr.houseNumber} {addr.buildingName ? addr.buildingName + ', ' : ''}{addr.street}, {addr.area}, {addr.city}, {addr.state} {addr.pincode}
                        </p>
                        {addr.deliveryNote && (
                          <p className="text-[9px] text-slate-400 italic font-medium">Instructions: "{addr.deliveryNote}"</p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-50">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(addr.id)}
                            className="flex-1 py-2 border border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase transition-all"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditAddressForm(addr)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this address?')) {
                              deleteAddress(addr.id);
                            }
                          }}
                          className="py-2 px-3.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl text-[10px] font-black uppercase transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom sticky bar */}
            {addresses.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={openNewAddressForm}
                  className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black tracking-wide uppercase transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Add New Address</span>
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Address Editor Form Overlay */}
      <AnimatePresence>
        {showAddressForm && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xs z-[1000] flex flex-col justify-between p-0">
            {/* Header bar */}
            <div className="bg-white px-4 py-3.5 flex justify-between items-center border-b border-slate-100 text-text flex-shrink-0">
              <span className="text-xs font-black uppercase tracking-wider">{editingAddressId ? 'Edit Address' : 'Add New Address'}</span>
              <button
                type="button"
                onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}
                className="text-xs font-black text-slate-500 hover:text-text"
              >
                Cancel
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-4 no-scrollbar">
              
              {/* Geolocation map picker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pin Location on Map</span>
                  <button
                    type="button"
                    onClick={detectAddressLocation}
                    className="text-[9px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Detect My GPS</span>
                  </button>
                </div>
                <LocationPickerMap
                  lat={addressLat}
                  lng={addressLng}
                  onChange={(lat, lng) => {
                    setAddressLat(lat);
                    setAddressLng(lng);
                  }}
                />
                
                {/* Coordinates inputs */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-100 p-2 rounded-xl text-center">
                    <span className="text-[8px] text-slate-400 block font-semibold">LATITUDE</span>
                    <span className="font-mono font-bold text-slate-700">{addressLat.toFixed(6)}</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-xl text-center">
                    <span className="text-[8px] text-slate-400 block font-semibold">LONGITUDE</span>
                    <span className="font-mono font-bold text-slate-700">{addressLng.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-white rounded-[22px] border border-slate-100 p-4 shadow-sm space-y-3.5 text-left">
                
                {/* Address Type Choice */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Address Type</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressType(type)}
                        className={`py-2 border rounded-xl text-center text-xs font-bold transition-all ${
                          addressType === type
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {type === 'HOME' ? '🏠 Home' : type === 'WORK' ? '🏢 Work' : '📍 Other'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="grid grid-cols-1 gap-3 pt-1">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Recipient Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Phone Number *</label>
                      <input
                        type="text"
                        placeholder="10-digit number"
                        value={addressPhone}
                        onChange={(e) => setAddressPhone(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Alt Phone (Optional)</label>
                      <input
                        type="text"
                        placeholder="Alternative phone"
                        value={alternativePhone}
                        onChange={(e) => setAlternativePhone(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                  </div>
                </div>

                {/* Address specifics */}
                <div className="space-y-3 pt-2 border-t border-slate-50">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Flat / House No. *</label>
                      <input
                        type="text"
                        placeholder="e.g. Apt 4B"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Building Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Highrise Residency"
                        value={buildingName}
                        onChange={(e) => setBuildingName(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Street / Road *</label>
                    <input
                      type="text"
                      placeholder="e.g. 5th Avenue"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Landmark</label>
                      <input
                        type="text"
                        placeholder="e.g. Empire State"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Area / Locality *</label>
                      <input
                        type="text"
                        placeholder="e.g. Midtown"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">City *</label>
                      <input
                        type="text"
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">State *</label>
                      <input
                        type="text"
                        placeholder="NY"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-text-secondary uppercase">Pincode *</label>
                      <input
                        type="text"
                        placeholder="10118"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Country *</label>
                    <input
                      type="text"
                      placeholder="USA"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <label className="text-[9px] font-bold text-text-secondary uppercase">Delivery Instructions (Optional)</label>
                    <textarea
                      placeholder="e.g. Ring doorbell, leave with receptionist"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      rows={2}
                      className="px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-xs font-semibold text-text resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div>
                      <span className="text-xs font-extrabold text-text block">Set Default Address</span>
                      <span className="text-[8px] text-text-secondary">Use automatically during checkout</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isAddressDefault}
                        onChange={(e) => setIsAddressDefault(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

              </div>

            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
              <button
                type="button"
                onClick={handleSaveAddress}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black tracking-wide uppercase transition-colors shadow-md"
              >
                Save Address
              </button>
            </div>

          </div>
        )}
      </AnimatePresence>



    </div>
  );
};
