import React from 'react';
import ReactDOM from 'react-dom/client';
import { useAppStore } from './store/useAppStore';
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { RestaurantOwnerPortal } from './pages/restaurant/RestaurantOwnerPortal';
import { DeliveryPartnerPortal } from './pages/driver/DeliveryPartnerPortal';
import { SuperAdminPortal } from './pages/admin/SuperAdminPortal';
import { AuthPage } from './pages/auth/AuthPage';
import './index.css';

const App: React.FC = () => {
  const { activeRole, isAuthenticated } = useAppStore();

  const renderActivePortal = () => {
    if (!isAuthenticated && activeRole !== 'CUSTOMER') return <AuthPage />;
    switch (activeRole) {
      case 'CUSTOMER':
        return <CustomerPortal />;
      case 'RESTAURANT_OWNER':
        return <RestaurantOwnerPortal />;
      case 'DELIVERY_PARTNER':
        return <DeliveryPartnerPortal />;
      case 'SUPER_ADMIN':
        return <SuperAdminPortal />;
      default:
        return <CustomerPortal />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans antialiased selection:bg-primary/20 selection:text-primary flex items-center justify-center p-0 md:p-6 overflow-x-hidden relative">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Phone Mockup Frame — centered */}
      <div className="relative flex-shrink-0 w-full max-w-[430px] h-screen md:h-[92vh] md:max-h-[880px] flex flex-col z-10">
        {/* Smartphone Bezel */}
        <div className="w-full h-full md:rounded-[55px] md:border-[14px] md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative bg-background overflow-hidden flex flex-col ring-1 ring-white/5">
          
          {/* Screen Content Container */}
          <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            
            {/* Status Bar Emulation */}
            <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-1 select-none text-[11px] font-semibold text-text bg-white/70 backdrop-blur-md sticky top-0 z-50">
              <span>9:41</span>
              {/* Simulated dynamic notch/island */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full shadow-inner flex items-center justify-center gap-1 px-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-800"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.2 19.58 10.56 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
                <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 24 24"><path d="M17 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 12H3V7h14v10zm4-8v6c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z"/></svg>
              </div>
            </div>

            {/* Portal Target Screen */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col h-full bg-slate-50">
              {renderActivePortal()}
            </div>

            {/* Home Indicator Emulation */}
            <div className="hidden md:block py-2 bg-white/70 backdrop-blur-md border-t border-slate-100 select-none sticky bottom-0 z-50">
              <div className="w-32 h-1 bg-slate-300 hover:bg-slate-400 active:scale-95 transition-colors rounded-full mx-auto"></div>
            </div>
            
          </div>
          
        </div>
      </div>

    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
