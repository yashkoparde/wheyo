import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, Utensils, Truck, Zap, ShieldCheck, Calendar, Sparkles } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    { id: 'all', label: 'All FAQs' },
    { id: 'nutrition', label: 'Macros & Prep' },
    { id: 'delivery', label: 'Belagavi Delivery' },
    { id: 'subscriptions', label: 'Tiffins & Plans' },
    { id: 'points', label: 'Points & Discounts' }
  ];

  const faqs: FAQItem[] = [
    {
      category: 'nutrition',
      question: 'How do you guarantee ±2g protein accuracy on every meal?',
      answer: 'Our central kitchen in Tilakwadi uses commercial digital scales for every meal prep station. Raw boneless chicken breast, eggs, and dairy paneer are weighed before and after cooking to calibrate yield ratios. Each box carries a tamper-evident macro breakdown sticker showing exact cooked protein, carbs, and fats.'
    },
    {
      category: 'nutrition',
      question: 'Are Wheyo meals cooked in palm oil or heavy gravies?',
      answer: 'Zero palm oil. We steam, grill, or roast with cold-pressed olive or mustard oil. Our gravies use roasted vegetable purees and Greek yogurt instead of the heavy cashew-cream or hydrogenated fats common in standard restaurants.'
    },
    {
      category: 'delivery',
      question: 'Which college campuses in Belagavi do you deliver to?',
      answer: 'We operate dedicated batch drop-boxes to KLS GIT (Udyambag), KLE Technological University, JNMC / KAHER Medical Hostels (Nehru Nagar), VTU Headquarters (Machhe), and Jain College of Engineering (JCE), plus 35+ partner gyms in Tilakwadi, Camp, and Bhagyanagar.'
    },
    {
      category: 'delivery',
      question: 'What are the daily delivery slots?',
      answer: 'We dispatch two scheduled runs: 1:00 PM for the collegiate lunch rush, and 7:30 PM to 9:30 PM for post-workout evening recovery. Scheduled batch deliveries to college hostel gates have zero delivery surcharge.'
    },
    {
      category: 'subscriptions',
      question: 'How does the 24-Day Monthly High-Protein Tiffin work?',
      answer: 'You choose your goal (Bulking, Lean Shred, or Student High-Calorie), select your delivery window, and your meal is delivered every Monday through Saturday. You can pause or reschedule delivery days directly in the app if you travel for semester breaks.'
    },
    {
      category: 'subscriptions',
      question: 'Can I cancel or pause my subscription?',
      answer: 'Yes. Pausing takes 1 tap in the Subscriptions tab. If you pause, remaining meal credits stay valid for up to 90 days. Unconsumed balances can also be refunded pro-rata.'
    },
    {
      category: 'points',
      question: 'How do workout logs convert into meal discounts?',
      answer: 'Every 1,000 kg of lifted volume (Sets × Reps × Weight) or 100 kcal of verified cardio awards 10 Wheyo Points. 100 Points = ₹10 direct discount at checkout. The app has a deterministic mathematical ledger with zero arbitrary AI rounding.'
    },
    {
      category: 'points',
      question: 'What is the Belgaum Campus League?',
      answer: 'Every workout you log contributes points to your college (KLS GIT, KLE Tech, JNMC, VTU, or Independent Lifter). The winning campus each month gets free Wheyo merchandise and custom campus meal discounts.'
    }
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#070708] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-4xl mx-auto space-y-10"
      >
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#D4FF00]/10 border border-[#D4FF00]/25 rounded-full">
            <HelpCircle className="h-4 w-4 text-[#D4FF00]" />
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#D4FF00] font-bold">
              Knowledge Base // Kitchen Standards
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-sans font-black tracking-tighter text-white uppercase">
            Frequently Asked <span className="text-[#D4FF00]">Questions</span>
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-mono text-zinc-400">
            Everything you need to know about macro calculations, delivery routes across Belagavi campuses, and the sweat-to-savor point system.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.3)]'
                  : 'bg-[#0C0C0E] border border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-[#0C0C0E] border border-white/5 rounded-2xl overflow-hidden transition-colors hover:border-white/10"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                >
                  <span className="font-sans font-bold text-sm sm:text-base text-white tracking-tight">
                    {faq.question}
                  </span>
                  <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-[#D4FF00] transition-transform duration-200 ${isOpen ? 'rotate-180 bg-[#D4FF00]/15' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Need more help box */}
        <div className="bg-[#0C0C0E] border border-[#D4FF00]/20 rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-sans font-bold uppercase text-white text-base">
            Have a custom macro question or dietary requirement?
          </h3>
          <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
            Our central kitchen chef and nutritionist can customize meal prep for allergies or high-calorie competitive bulks.
          </p>
          <a
            href="mailto:kitchen@wheyo.fit"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold uppercase text-[#D4FF00] hover:bg-white/10 transition-colors"
          >
            Email: kitchen@wheyo.fit
          </a>
        </div>
      </motion.div>
    </div>
  );
}
