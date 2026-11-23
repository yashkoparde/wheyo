import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Mail, Phone, Clock, Send, CheckCircle2, MessageSquare, Dumbbell } from 'lucide-react';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Student Athlete',
    campus: 'KLS GIT',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', role: 'Student Athlete', campus: 'KLS GIT', message: '' });
    }, 4500);
  };

  const contactCards = [
    {
      icon: MapPin,
      title: 'Central Cloud Kitchen',
      detail: 'Tilakwadi / Udyambag Junction',
      sub: 'Belagavi, Karnataka 590006',
      accent: 'text-[#D4FF00]'
    },
    {
      icon: Clock,
      title: 'Kitchen Dispatch Hours',
      detail: '11:30 AM — 10:00 PM',
      sub: 'Mon - Sun (Batch Dispatches at 1 PM & 8 PM)',
      accent: 'text-[#FF3E00]'
    },
    {
      icon: Mail,
      title: 'Official Mailboxes',
      detail: 'orders@wheyo.fit',
      sub: 'Partnerships: gyms@wheyo.fit',
      accent: 'text-[#00E5FF]'
    },
    {
      icon: Phone,
      title: 'Customer Dispatch Line',
      detail: '+91 831 245 8890',
      sub: 'WhatsApp Kitchen Desk Available',
      accent: 'text-[#D4FF00]'
    }
  ];

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
            <MessageSquare className="h-4 w-4 text-[#D4FF00]" />
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#D4FF00] font-bold">
              Dispatch Desk // Hub Support
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-sans font-black tracking-tighter text-white uppercase">
            Contact <span className="text-[#D4FF00]">Wheyo</span>
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-mono text-zinc-400">
            Have an order question, want to become a campus ambassador, or looking to register your Belagavi gym for the "Sweat-to-Savor" discount program?
          </p>
        </div>

        {/* 4 Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contactCards.map((card, i) => (
            <div 
              key={i}
              className="bg-[#0C0C0E] border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:border-white/10 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${card.accent}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {card.title}
                </div>
                <div className="text-sm font-bold font-sans text-white uppercase mt-0.5 truncate">
                  {card.detail}
                </div>
                <div className="text-xs font-mono text-zinc-400 mt-0.5">
                  {card.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold font-sans uppercase text-white tracking-tight flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#D4FF00]" />
              Send a Message to the Kitchen Operations Team
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Guaranteed response within 4 hours during kitchen operational windows.
            </p>
          </div>

          {formSubmitted ? (
            <div className="py-12 text-center space-y-3 bg-[#D4FF00]/5 border border-[#D4FF00]/20 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-[#D4FF00] mx-auto animate-bounce" />
              <h3 className="text-lg font-bold font-sans uppercase text-white">
                Message Dispatched to Kitchen Ops
              </h3>
              <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto">
                Thanks for reaching out! Our Tilakwadi coordinator will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yash or Rahul"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Contact Email / Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="athlete@domain.com or phone"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    You Are A:
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
                  >
                    <option value="Student Athlete">Student Athlete (Hosteller / Day Scholar)</option>
                    <option value="Gym Owner / Trainer">Gym Owner / Personal Trainer</option>
                    <option value="Campus Ambassador">Campus Ambassador Applicant</option>
                    <option value="Supplier / Vendor">Poultry / Dairy Supplier</option>
                    <option value="General Inquiry">General Nutrition Inquiry</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Primary Campus / Area
                  </label>
                  <select
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
                  >
                    <option value="KLS GIT">KLS GIT (Udyambag)</option>
                    <option value="KLE Tech">KLE Tech / BVBCET</option>
                    <option value="JNMC">JNMC / KAHER (Nehru Nagar)</option>
                    <option value="VTU">VTU HQ (Machhe)</option>
                    <option value="JCE">Jain College (JCE)</option>
                    <option value="Tilakwadi/Camp Gym">Tilakwadi / Camp Gym Lifter</option>
                    <option value="Other">Other Belagavi Area</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Your Message or Order Detail
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us what you need (e.g. customized high-protein subscription, partner gym inquiry, or delivery address update)..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-[#D4FF00] text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#bce400] transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,255,0,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Message
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
