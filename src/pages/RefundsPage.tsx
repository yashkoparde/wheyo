import { motion } from 'motion/react';
import { HelpCircle, RefreshCw, Milestone, HandCoins } from 'lucide-react';

export default function RefundsPage() {
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
            <HandCoins className="h-4 w-4 text-[#D4FF00]" />
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4FF00] font-bold">Transparent Finances</span>
          </div>
          <h1 className="text-4xl font-sans font-black tracking-tighter text-white uppercase sm:text-5xl">
            Refund <span className="text-[#D4FF00] font-light">Policy</span>
          </h1>
          <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
            Last Updated: June 20, 2026
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-[#0C0C0E] border border-white/[0.04] rounded-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-7xl font-sans tracking-tight text-white uppercase select-none pointer-events-none">
            RECOVERY
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <RefreshCw className="h-5 w-5 text-[#D4FF00]" />
                <h2>1. Cancellations and Subscription Billing</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                As a premium fresh-protein food platform, we operate under specialized timelines. Subscriptions can be deactivated anytime from the member portal. Since meals are prepared daily based on strict macro quotas:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pl-4 font-mono">
                <li><strong className="text-white">Upcoming Drops:</strong> Cancellations must be made at least 24 hours prior to the next billing/preparation batch to avoid charges.</li>
                <li><strong className="text-white">Active Prepared Batches:</strong> Once a meal block is formulated or active, we cannot issue instant refunds for that specific drop.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <Milestone className="h-5 w-5 text-[#D4FF00]" />
                <h2>2. Delivery Disputes & Handover Issues</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                If your customized shaker or protein macro box was not correctly handed over at your designated drop-off location by our delivery executive, you are entitled to a full replacement or financial compensation:
              </p>
              <p className="text-xs text-gray-400 font-mono">
                *Please report delivery issues within 12 hours. We will investigate with our delivery boy team immediately and process either credit back to your account card or immediate preparation reschedule free of cost.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold uppercase font-sans tracking-tight text-lg">
                <HelpCircle className="h-5 w-5 text-[#D4FF00]" />
                <h2>3. Contacting Support</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-mono">
                Have questions or need aid with App Store invoice inquiries?
                Our central service coordinators are ready to evaluate any refunds immediately:
              </p>
              <p className="text-xs text-gray-400 font-mono">
                Helpdesk Email: <span className="text-[#D4FF00]">support@wheyo.co</span><br />
                Active Hours: Mon - Fri: 8:00 AM - 6:00 PM IST
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
