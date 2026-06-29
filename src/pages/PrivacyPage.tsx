import { motion } from 'motion/react';
import { Shield, Eye, Lock, Globe } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#070708] text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-12"
      >
        {/* Header section */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4FF00]/10 border border-[#D4FF00]/20 rounded-full">
            <Shield className="h-4 w-4 text-[#D4FF00]" />
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4FF00] font-bold">Trusted Security Protocol</span>
          </div>
          <h1 className="text-4xl font-sans font-black tracking-tighter text-white uppercase sm:text-5xl">
            Privacy <span className="text-[#D4FF00] font-light">Policy</span>
          </h1>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
            Last Updated: June 20, 2026
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-[#0C0C0E] border border-white/[0.04] rounded-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-7xl font-sans tracking-tight text-white uppercase select-none pointer-events-none">
            DATA SECURE
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <Eye className="h-5 w-5 text-[#D4FF00]" />
                <h2>1. Information Collection and Usage</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                At Wheyo, we respect your privacy and are committed to protecting it. We collect personal information essential to power your high-protein meal preparations and secure app functionality:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pl-4 font-mono">
                <li><strong className="text-white">Account Info:</strong> Authentication details managed via secure systems (such as email, hashed password, dynamic user ID).</li>
                <li><strong className="text-white">Preferences:</strong> Specific daily protein targets or macro-plate customizations selected in the app.</li>
                <li><strong className="text-white">Order Details:</strong> Delivery point selections, transaction logs, active subscriptions, and ordered booster configurations.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <Lock className="h-5 w-5 text-[#D4FF00]" />
                <h2>2. Data Security & Storage Protocols</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                All application-level updates, customer transactions, and athlete profiles are secured inside cloud databases utilizing strict <strong className="text-white">Row Level Security (RLS)</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pl-4 font-mono">
                <li>Only you can mutate your own active subscription pipelines or orders.</li>
                <li>Sensitive billing details are tokenized securely and are never stored directly on our servers.</li>
                <li>Access traces are encrypted over TLS during client-server hops.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <Globe className="h-5 w-5 text-[#D4FF00]" />
                <h2>3. Cookies and Analytics</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                We use secure locale storage keys and analytical cookies to preserve active context. These records ensure seamless local checkout flow transitions without requiring frequent re-authentication. They also capture aggregate performance telemetry used to optimize the protein kitchen.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-white font-bold uppercase font-sans tracking-tight text-sm">4. App Store & Google Play Third-Party Disclosure</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Wheyo does not rent, sell, or trade personal identifiers. Information is strictly shared with delivery partners to facilitate handovers at designated drop locations by our delivery executive. Customers reserve the right to request full data deletion at any stage from their profile controls.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
