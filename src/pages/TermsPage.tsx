import { motion } from 'motion/react';
import { ShieldCheck, Calendar, Bell, ScrollText } from 'lucide-react';

export default function TermsPage() {
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
            <ScrollText className="h-4 w-4 text-[#D4FF00]" />
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4FF00] font-bold">Standard Legal Baseline</span>
          </div>
          <h1 className="text-4xl font-sans font-black tracking-tighter text-white uppercase sm:text-5xl">
            Terms of <span className="text-[#D4FF00] font-light">Service</span>
          </h1>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
            Last Updated: June 20, 2026
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-[#0C0C0E] border border-white/[0.04] rounded-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-7xl font-sans tracking-tight text-white uppercase select-none pointer-events-none">
            AGREEMENT
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <ShieldCheck className="h-5 w-5 text-[#D4FF00]" />
                <h2>1. Acceptance of Terms</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                By downloading, accessing, or subscribing to Wheyo ("the Platform", "the App"), you agree to abide by these Terms of Service. If you do not agree, please do not use the application. These terms apply to all visitors, trainees, athletes, and subscribing members.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <Calendar className="h-5 w-5 text-[#D4FF00]" />
                <h2>2. Subscriptions, Payments & Billing</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Certain modules of our active kitchen are billed on a recurring subscription cycle:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pl-4 font-mono">
                <li><strong className="text-white">Autopilot Plans:</strong> Calculated on either a weekly or monthly interval and auto-billed to your secured payment mechanism.</li>
                <li><strong className="text-white">Cancellation:</strong> You may cancel or halt renewals at any time from your account profile settings before your next scheduled drop sequence.</li>
                <li><strong className="text-white">Booster Addons:</strong> Additional shakers/protein boosts are synchronized to bill and arrive at your chosen drop point.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <Bell className="h-5 w-5 text-[#D4FF00]" />
                <h2>3. Delivery Handover and Collection</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                All food is delivered by our delivery partner/executive to your chosen designated drop location, where the user is notified and must come to retrieve their clean, freshly prepared order directly from the delivery boy.
              </p>
              <p className="text-xs text-gray-400 font-mono">
                *Trainees are solely responsible for arriving promptly to retrieve their orders within standard freshness windows (normally upon delivery arrival notice). Wheyo is not liable for products left uncollected.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-white font-bold uppercase font-sans tracking-tight text-sm">4. Nutritional & Allergen Warning</h3>
              <p className="text-xs text-[#9A99A2] leading-relaxed font-mono">
                All Wheyo fuel recipes specify complete macronutrient weight summaries (Carbs, Proteins, Fats) for convenience. Our facilities process milk, soy, whey isolate, and trace nuts. Athletes with intense clinical allergies must contact helpdesk coordinators directly before committing to automated subscript base plans.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
