import React, { useState } from 'react';
import { 
  ArrowLeft, Gift, BookOpen, Award, FileText
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FooterPageProps {
  pageId: string;
  onBack: () => void;
  onNavigateTab: (tab: 'home' | 'search' | 'cart' | 'orders' | 'profile') => void;
}

export const FooterPage: React.FC<FooterPageProps> = ({ pageId, onBack, onNavigateTab }) => {
  const { addAuditLog, submitSupportTicket, updateUserProfile } = useAppStore();
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleFormChange = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent, logMsg: string) => {
    e.preventDefault();
    setSubmitted(true);
    addAuditLog(logMsg);
    if (pageId === 'raise-ticket' || pageId === 'contact-support') {
      submitSupportTicket(formData.subject || 'Footer Ticket', formData.message || '');
    }
  };

  // Content generators based on category/pageId
  const getPageConfig = () => {
    const defaultHero = {
      title: pageId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      subtitle: 'Information and updates regarding our Shipbite ecosystem.',
      bg: 'from-slate-900 via-slate-800 to-emerald-950'
    };

    switch (pageId) {
      // --- PARTNERS & BUSINESS ---
      case 'become-restaurant-partner':
      case 'become-partner':
        return {
          hero: {
            title: 'Grow Your Business with Shipbite',
            subtitle: 'Join India’s premier food delivery network and reach millions of hungry foodies.',
            bg: 'from-emerald-800 to-teal-950'
          },
          render: () => (
            <div className="space-y-5">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-extrabold text-sm text-text">Partner Registration Form</h3>
                {submitted ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                    <h4 className="font-black text-xs text-text">Application Submitted!</h4>
                    <p className="text-[10px] text-text-secondary">Our merchant onboarding manager will contact you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleFormSubmit(e, 'New restaurant partner application')} className="space-y-3.5 text-[11px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary">Restaurant Name</label>
                        <input required type="text" onChange={(e) => handleFormChange('restName', e.target.value)} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50" placeholder="e.g. Spice Villa" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary">Contact Name</label>
                        <input required type="text" onChange={(e) => handleFormChange('ownerName', e.target.value)} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50" placeholder="Your Name" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-text-secondary">Contact Email</label>
                      <input required type="email" onChange={(e) => handleFormChange('email', e.target.value)} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50" placeholder="partner@example.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-text-secondary">Business Details (Cuisine, City)</label>
                      <textarea onChange={(e) => handleFormChange('details', e.target.value)} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 h-16 resize-none" placeholder="Provide average order value and specialties..."></textarea>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-md">Apply Now</button>
                  </form>
                )}
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-text-secondary tracking-wider block">Why partner with us?</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-primary font-black text-xs">30%+ Growth</span>
                    <p className="text-[9px] text-text-secondary">Boost your revenue through localized digital targeting.</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-primary font-black text-xs">Live Analytics</span>
                    <p className="text-[9px] text-text-secondary">Track customer feedback, menu clicks, and payout structures.</p>
                  </div>
                </div>
              </div>
            </div>
          )
        };

      case 'become-delivery-partner':
      case 'delivery-partner-registration':
        return {
          hero: {
            title: 'Earn Extra Income with Shipbite',
            subtitle: 'Deliver orders, manage your own schedule, and earn competitive payouts.',
            bg: 'from-blue-800 to-indigo-950'
          },
          render: () => (
            <div className="space-y-5">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-extrabold text-sm text-text">Driver Registration Form</h3>
                {submitted ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                    <h4 className="font-black text-xs text-text">Driver Application Submitted!</h4>
                    <p className="text-[10px] text-text-secondary">Our fleet management team will coordinate for document submission.</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleFormSubmit(e, 'New driver fleet partner application')} className="space-y-3.5 text-[11px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary">First Name</label>
                        <input required type="text" className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50" placeholder="e.g. Ramesh" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary">Last Name</label>
                        <input required type="text" className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50" placeholder="Kumar" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary">Vehicle Type</label>
                        <select className="w-full border border-slate-100 rounded-xl px-2.5 py-2 bg-slate-50 font-bold">
                          <option>Motorcycle / Scooter</option>
                          <option>Bicycle</option>
                          <option>E-Bike</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary">City</label>
                        <input required type="text" className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50" placeholder="e.g. Bangalore" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-md">Join Delivery Fleet</button>
                  </form>
                )}
              </div>
            </div>
          )
        };

      // --- CUSTOMER SERVICE ---
      case 'help-center':
      case 'support-center':
      case 'contact-support':
      case 'raise-ticket':
        return {
          hero: {
            title: 'Shipbite Help & Support',
            subtitle: 'Have issues? Raise a ticket or read our curated service answers.',
            bg: 'from-purple-800 to-indigo-950'
          },
          render: () => (
            <div className="space-y-5">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="font-extrabold text-sm text-text">Raise a Support Ticket</h3>
                {submitted ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                    <h4 className="font-black text-xs text-text">Ticket Submitted Successfully!</h4>
                    <p className="text-[10px] text-text-secondary">You can track resolution logs under the admin console tickets.</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleFormSubmit(e, 'Raised support ticket')} className="space-y-3.5 text-[11px]">
                    <div className="space-y-1">
                      <label className="font-bold text-text-secondary">Support Subject</label>
                      <input required type="text" onChange={(e) => handleFormChange('subject', e.target.value)} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50" placeholder="e.g. Missing refund on order #89A2" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-text-secondary">Detailed Message</label>
                      <textarea required onChange={(e) => handleFormChange('message', e.target.value)} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50 h-24 resize-none" placeholder="Provide transaction IDs and restaurant details..."></textarea>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs shadow-md">Submit Support Case</button>
                  </form>
                )}
              </div>
            </div>
          )
        };

      case 'faqs':
        return {
          hero: {
            title: 'Frequently Answered FAQs',
            subtitle: 'Service answers about payments, refunds, delivery speeds and PRIME.',
            bg: 'from-slate-900 to-slate-950'
          },
          render: () => {
            const list = [
              { q: 'How long does a refund take?', a: 'Refunds initiated via UPI or wallet credit are instantly credited. Netbanking or card refunds can take 3-5 business days.' },
              { q: 'What is Shipbite PRIME?', a: 'PRIME is a premium loyalty program offering unlimited free delivery on all orders above ₹199 from verified restaurants.' },
              { q: 'Can I change my delivery address after placing an order?', a: 'Addresses cannot be changed once the kitchen accepts the order to avoid logistical discrepancies. Contact support immediately.' },
              { q: 'How do I cancel my order?', a: 'Orders can only be cancelled within 60 seconds of placement. Beyond that, a 100% cancellation fee is levied to cover restaurant and driver compensation.' }
            ];
            return (
              <div className="space-y-3">
                {list.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full text-left p-3.5 flex justify-between items-center hover:bg-slate-50/50"
                    >
                      <span className="font-extrabold text-xs text-text">{item.q}</span>
                      <span className="text-primary font-bold text-xs">{activeFaq === idx ? '−' : '+'}</span>
                    </button>
                    {activeFaq === idx && (
                      <div className="px-3.5 pb-3.5 text-[10px] text-text-secondary leading-relaxed border-t border-slate-50 pt-2">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          }
        };

      // --- LEGAL DOCUMENTS ---
      case 'privacy-policy':
      case 'terms-conditions':
      case 'refund-policy':
      case 'cancellation-policy':
      case 'shipping-delivery-policy':
      case 'cookie-policy':
      case 'vendor-agreement':
      case 'user-agreement':
        return {
          hero: {
            title: defaultHero.title,
            subtitle: 'Effective Date: July 17, 2026. Official statutory document guidelines.',
            bg: 'from-slate-900 via-slate-800 to-slate-950'
          },
          render: () => (
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-[10px] text-text-secondary leading-relaxed">
              <div className="flex items-center gap-2 border-b pb-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-extrabold text-text uppercase">Statutory Document Regulation</span>
              </div>
              <p>
                This document defines the contractual arrangement between Shipbite Food Delivery SaaS (the "Company") and registered subscribers. Terms outlined herein are subject to state laws and regulatory compliance frameworks.
              </p>
              <h4 className="font-extrabold text-text mt-2 text-[11px]">1. Operational Terms</h4>
              <p>
                Service dispatch, payout processing, and commissions are computed dynamically based on the merchant subscription structure. Delivery parameters operate under standard localized dispatching models.
              </p>
              <h4 className="font-extrabold text-text mt-2 text-[11px]">2. Dispute Mechanisms</h4>
              <p>
                Any transaction disputes, refund issues, or payout claims must be routed through the platform support tickets. Arbitration resolutions are processed within standard operational SLAs.
              </p>
            </div>
          )
        };

      // --- OTHER INFORMATION PAGES ---
      case 'about-us':
        return {
          hero: {
            title: 'Welcome to Shipbite',
            subtitle: 'Connecting localized culinary artists with food lovers through hyper-local logistics.',
            bg: 'from-emerald-700 to-emerald-950'
          },
          render: () => (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                <h4 className="font-extrabold text-xs text-text">Our Mission</h4>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  We empower independent restaurants and delivery fleets to work seamlessly under a single commission-fair digital SaaS layer. We believe in high delivery reliability without squeezing merchant margins.
                </p>
              </div>
            </div>
          )
        };

      case 'careers':
        return {
          hero: {
            title: 'Shape the Future of FoodTech',
            subtitle: 'Join Shipbite and build robust hyper-local tech ecosystems.',
            bg: 'from-slate-900 to-slate-950'
          },
          render: () => {
            const jobs = [
              { title: 'Senior Backend Engineer', dept: 'Core Logistics Platform', loc: 'Bangalore' },
              { title: 'Frontend Developer (React / Next.js)', dept: 'Merchant Dashboard Team', loc: 'Remote' },
              { title: 'hyper-local Fleet Dispatch Manager', dept: 'Operations Control', loc: 'Mumbai' }
            ];
            return (
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-text-secondary block">Open Positions</span>
                {jobs.map((j, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-xs text-text">{j.title}</h4>
                      <p className="text-[9px] text-text-secondary mt-0.5">{j.dept} • {j.loc}</p>
                    </div>
                    <button type="button" onClick={() => addAuditLog(`Applied for position: ${j.title}`)} className="text-[9px] font-bold text-primary border border-primary/20 px-3 py-1 rounded-lg">Apply</button>
                  </div>
                ))}
              </div>
            );
          }
        };

      case 'gift-cards':
        return {
          hero: {
            title: 'Shipbite Gift Cards',
            subtitle: 'Send meals, delicious treats, and premium dine-ins to friends.',
            bg: 'from-amber-600 to-amber-950'
          },
          render: () => (
            <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="h-32 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl p-4 flex flex-col justify-between text-slate-900 shadow-inner">
                <Gift className="w-8 h-8 opacity-90" />
                <div>
                  <h3 className="font-black text-sm">GIFT VOUCHER</h3>
                  <p className="text-[9px] font-bold opacity-75">Redeemable on all menus & outlets</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map(val => (
                  <button key={val} onClick={() => addAuditLog(`Purchased ₹${val} Gift Card`)} className="py-2 border border-slate-100 rounded-xl font-black text-xs text-text hover:bg-slate-50">₹{val}</button>
                ))}
              </div>
            </div>
          )
        };

      case 'membership':
        return {
          hero: {
            title: 'Shipbite PRIME Membership',
            subtitle: 'Get unlimited free deliveries, zero surge charges, and 2x reward points.',
            bg: 'from-yellow-600 to-amber-950'
          },
          render: () => (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
              <Award className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
              <div>
                <h4 className="font-black text-sm text-text">Upgrade to PRIME Loyalty</h4>
                <p className="text-[10px] text-text-secondary mt-1">Unlock benefits valid for 3 months at just ₹299.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateUserProfile({ membershipTier: 'PRIME' });
                  addAuditLog('Upgraded user profile membershipTier to PRIME');
                  alert('Congratulations! You are now a Shipbite PRIME member.');
                  onNavigateTab('home');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-extrabold rounded-xl text-xs shadow-md"
              >
                Join PRIME Now
              </button>
            </div>
          )
        };

      default:
        return {
          hero: defaultHero,
          render: () => (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center space-y-3">
              <BookOpen className="w-9 h-9 text-slate-300 mx-auto" />
              <h4 className="font-black text-xs text-text">Welcome to {defaultHero.title}</h4>
              <p className="text-[9px] text-text-secondary leading-relaxed">
                Thank you for utilizing Shipbite. Our hyper-local network operations are currently expanding to your local region soon. Stay tuned!
              </p>
            </div>
          )
        };
    }
  };

  const config = getPageConfig();

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Dynamic Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-extrabold text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-[10px] text-text-secondary font-black uppercase tracking-wider">Shipbite Directory</span>
      </header>

      {/* Dynamic Hero section */}
      <div className={`bg-gradient-to-br ${config.hero.bg} text-white px-5 py-8 flex flex-col justify-center`}>
        <h2 className="text-lg font-black leading-tight tracking-tight">{config.hero.title}</h2>
        <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">{config.hero.subtitle}</p>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 px-4 py-5">
        {config.render()}
      </div>
    </div>
  );
};
