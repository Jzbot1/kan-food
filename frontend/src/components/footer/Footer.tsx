import React, { useState, useEffect } from 'react';
import { 
  Send, Phone, Mail, MapPin, ShieldAlert, 
  Facebook, Instagram, Twitter, Youtube, ArrowUpRight,
  Download, Check, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

interface FooterProps {
  onLinkClick: (pageId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onLinkClick }) => {
  const { addAuditLog } = useAppStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // PWA & Platform States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSafariInstructions, setShowSafariInstructions] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone || 
                          localStorage.getItem('pwa_installed') === 'true';
    setIsInstalled(!!isStandalone);

    // Detect user platform
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowSuccess(true);
      setInstalling(false);
      localStorage.setItem('pwa_installed', 'true');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowSuccess(true);
          localStorage.setItem('pwa_installed', 'true');
        }
      } catch (err) {
        console.error('PWA installation error:', err);
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    } else {
      if (platform === 'ios') {
        setShowSafariInstructions(prev => !prev);
      } else {
        const isSupportedBrowser = 'BeforeInstallPromptEvent' in window || (window as any).hasOwnProperty('onbeforeinstallprompt');
        if (isSupportedBrowser) {
          alert('💡 Tip: If you don\'t see the install pop-up, you can click the "Install App" icon directly in the right side of your browser\'s address bar.');
        } else {
          setShowInstructions(prev => !prev);
        }
      }
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    addAuditLog(`Subscribed newsletter for ${email}`);
    setEmail('');
  };

  const sections = [
    {
      title: 'Quick Links',
      links: [
        { label: 'Home', action: () => onLinkClick('home') },
        { label: 'Restaurants', action: () => onLinkClick('restaurants') },
        { label: 'Food Categories', action: () => onLinkClick('categories') },
        { label: 'Offers', action: () => onLinkClick('offers') },
        { label: 'Popular Restaurants', action: () => onLinkClick('popular-restaurants') },
        { label: 'Become a Partner', action: () => onLinkClick('become-restaurant-partner') },
        { label: 'About Us', action: () => onLinkClick('about-us') },
        { label: 'Contact Us', action: () => onLinkClick('contact-support') },
        { label: 'Careers', action: () => onLinkClick('careers') },
        { label: 'Blog', action: () => onLinkClick('blog') },
        { label: 'News', action: () => onLinkClick('news') },
        { label: 'Gift Cards', action: () => onLinkClick('gift-cards') },
        { label: 'Membership', action: () => onLinkClick('membership') },
        { label: 'Refer & Earn', action: () => onLinkClick('refer-earn') },
      ]
    },
    {
      title: 'Customer Support',
      links: [
        { label: 'Help Center', action: () => onLinkClick('help-center') },
        { label: 'FAQs', action: () => onLinkClick('faqs') },
        { label: 'Contact Support', action: () => onLinkClick('contact-support') },
        { label: 'Live Chat', action: () => onLinkClick('live-chat') },
        { label: 'Raise Ticket', action: () => onLinkClick('raise-ticket') },
        { label: 'Order Support', action: () => onLinkClick('order-support') },
        { label: 'Payment Support', action: () => onLinkClick('payment-support') },
        { label: 'Delivery Support', action: () => onLinkClick('delivery-support') },
        { label: 'Report Issue', action: () => onLinkClick('report-issue') },
        { label: 'Feedback', action: () => onLinkClick('feedback') },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', action: () => onLinkClick('privacy-policy') },
        { label: 'Terms & Conditions', action: () => onLinkClick('terms-conditions') },
        { label: 'Refund Policy', action: () => onLinkClick('refund-policy') },
        { label: 'Cancellation Policy', action: () => onLinkClick('cancellation-policy') },
        { label: 'Shipping & Delivery', action: () => onLinkClick('shipping-delivery-policy') },
        { label: 'Cookie Policy', action: () => onLinkClick('cookie-policy') },
        { label: 'Vendor Agreement', action: () => onLinkClick('vendor-agreement') },
        { label: 'User Agreement', action: () => onLinkClick('user-agreement') },
        { label: 'Disclaimer', action: () => onLinkClick('disclaimer') },
      ]
    },
    {
      title: 'Business',
      links: [
        { label: 'Become Partner', action: () => onLinkClick('become-restaurant-partner') },
        { label: 'Delivery Fleet', action: () => onLinkClick('become-delivery-partner') },
        { label: 'Business Solutions', action: () => onLinkClick('business-solutions') },
        { label: 'Advertising', action: () => onLinkClick('advertising') },
        { label: 'Corporate Orders', action: () => onLinkClick('corporate-orders') },
        { label: 'Developer Portal', action: () => onLinkClick('developer-portal') },
      ]
    }
  ];

  return (
    <footer className="mt-8 bg-slate-900 border-t border-slate-800 rounded-t-[32px] px-5 pt-8 pb-6 text-white space-y-6">
      
      {/* Brand & Short Description */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-black text-white text-sm shadow-md shadow-primary/20">S</div>
          <span className="text-sm font-black tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Shipbite</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Your trusted multi-vendor food delivery platform delivering delicious meals from your favorite restaurants quickly and safely.
        </p>
      </div>

      {/* Newsletter Subscription */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Exclusive Offers</span>
          <h4 className="font-extrabold text-xs text-white mt-0.5">Subscribe to our newsletter</h4>
        </div>
        {subscribed ? (
          <p className="text-[9px] text-green-400 font-bold">✓ Subscribed successfully! Get ready for exclusive deals.</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input 
              type="email" 
              required
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-0 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-primary/40 placeholder:text-slate-500"
            />
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95">
              <span>Join</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        )}
      </div>

      {/* Quick links & support collapse section */}
      <div className="grid grid-cols-2 gap-6 pt-2">
        {sections.map((sect) => (
          <div key={sect.title} className="space-y-2.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{sect.title}</span>
            <ul className="space-y-1.5 text-[10px] text-slate-400">
              {sect.links.slice(0, 7).map((link) => (
                <li key={link.label}>
                  <button 
                    type="button" 
                    onClick={link.action} 
                    className="hover:text-primary transition-colors text-left flex items-center gap-0.5 group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* App Download (PWA Install Button) */}
      <div className="space-y-2.5 border-t border-slate-800 pt-5">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Download App</span>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-br from-slate-950/80 to-slate-900/60 border border-slate-800/80 rounded-[24px] p-5 shadow-xl overflow-hidden flex flex-col gap-4"
        >
          {/* Glassmorphism background ambient lights */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3.5 z-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center flex-shrink-0 shadow-inner p-1">
              <img src="/src/favicon/favicon-96x96.png" alt="Shipbite Icon" className="w-full h-full object-contain rounded-md" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-xs text-white">📱 Download App</h4>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                Install our app for a faster and better experience.
              </p>
            </div>
          </div>

          {/* List of benefits */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 z-10 text-[9px] font-extrabold text-slate-300">
            {[
              'One Tap Access', 'Faster Performance', 'Live Order Tracking',
              'Push Notifications', 'Works Offline', 'Native App Experience'
            ].map(benefit => (
              <div key={benefit} className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
                    {/* Action button */}
          <div className="z-10 mt-1">
            {isInstalled ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-[18px] text-xs font-black">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>✅ Shipbite Installed</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addAuditLog('Open PWA app clicked');
                    alert('🎉 Opening Shipbite PWA standalone application experience...');
                  }}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[18px] text-xs font-black uppercase tracking-wider transition-colors active:scale-[0.98]"
                >
                  Open App
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-[10px] font-black"
                  >
                    🎉 Shipbite has been installed successfully!
                  </motion.div>
                )}

                {!showSuccess && (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-white rounded-[18px] text-xs font-black transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10"
                  >
                    {installing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Download className="w-4 h-4 animate-bounce" />
                    )}
                    <span>{installing ? 'Installing...' : 'Install App'}</span>
                  </button>
                )}

                {/* Custom Safari iOS Instructions Modal */}
                {showSafariInstructions && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-[18px] text-[10px] text-slate-300 leading-relaxed space-y-2 text-left"
                  >
                    <span className="font-black text-white uppercase tracking-wider block text-[9px] border-b border-slate-800 pb-1.5">Install Shipbite</span>
                    <ol className="space-y-1.5 list-decimal list-inside font-bold text-slate-400">
                      <li>Tap the <strong className="text-primary font-black">Share</strong> button in Safari.</li>
                      <li>Scroll down and tap <strong className="text-white font-black">"Add to Home Screen"</strong>.</li>
                      <li>Tap <strong className="text-primary font-black">Add</strong> in the top-right corner.</li>
                    </ol>
                  </motion.div>
                )}

                {/* Custom Fallback Instruction Modal/Block */}
                {showInstructions && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[9px] text-slate-400 leading-relaxed space-y-1.5"
                  >
                    <span className="font-black text-white uppercase tracking-wider block text-[8px]">Installation Guide</span>
                    {platform === 'android' && (
                      <p>Tap the browser menu <strong className="text-primary font-bold">(⋮)</strong> and select <strong className="text-white font-bold">"Install app"</strong> or <strong className="text-white font-bold">"Add to Home screen"</strong>.</p>
                    )}
                    {platform === 'desktop' && (
                      <p>Click the <strong className="text-primary font-bold">Install</strong> icon in your browser's address bar or menu to save Shipbite to your computer.</p>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>      </div>
        </motion.div>
      </div>

      {/* Contact Info Card */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 text-[10px] text-slate-400">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Shipbite Headquarters</span>
        <div className="flex gap-2.5 items-start">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>7th Floor, Tech Hub Towers, Koramangala, Bengaluru, Karnataka 560034</span>
        </div>
        <div className="flex gap-2.5 items-center">
          <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>+91 80 4918 3000</span>
        </div>
        <div className="flex gap-2.5 items-center">
          <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>support@shipbite.com</span>
        </div>
      </div>

      {/* Social Media Link Icons */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-5">
        <span className="text-[10px] font-bold text-slate-500">Connect with us</span>
        <div className="flex gap-3">
          {[
            { icon: <Facebook className="w-4 h-4" />, name: 'Facebook' },
            { icon: <Instagram className="w-4 h-4" />, name: 'Instagram' },
            { icon: <Twitter className="w-4 h-4" />, name: 'Twitter' },
            { icon: <Youtube className="w-4 h-4" />, name: 'YouTube' }
          ].map((soc) => (
            <button 
              key={soc.name} 
              onClick={() => addAuditLog(`Clicked social media link: ${soc.name}`)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-primary flex items-center justify-center transition-colors text-slate-400 hover:text-white"
              title={soc.name}
            >
              {soc.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Badges & Security */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
        <div className="flex flex-wrap gap-1.5">
          {['Visa', 'MC', 'UPI', 'GPay', 'COD'].map((pay) => (
            <span key={pay} className="bg-slate-800 px-2 py-0.5 rounded text-[8px] font-black text-slate-300 uppercase tracking-wider">{pay}</span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[8px] text-green-400 font-extrabold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SSL 256-bit Encrypted</span>
        </div>
      </div>

      {/* Bottom Copyright Disclaimer */}
      <div className="text-center space-y-1.5 border-t border-slate-800 pt-5 text-[9px] text-slate-500">
        <p>© 2026 Shipbite SaaS Delivery. All Rights Reserved.</p>
        <p>Version v2.0.4 • Powered by Shipbite Inc.</p>
        <div className="flex justify-center gap-1.5 text-[8px] underline">
          <button onClick={() => onLinkClick('privacy-policy')}>Privacy Policy</button>
          <span>|</span>
          <button onClick={() => onLinkClick('terms-conditions')}>Terms</button>
          <span>|</span>
          <button onClick={() => onLinkClick('refund-policy')}>Refunds</button>
        </div>
      </div>

    </footer>
  );
};
