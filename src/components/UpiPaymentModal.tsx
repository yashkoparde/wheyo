import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShieldCheck, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
}

export function UpiPaymentModal({ isOpen, onClose, onSuccess, amount }: UpiPaymentModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const upiId = 'yashkoparde@slc';
  const merchantName = 'Wheyo';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR`;

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(212,255,0,0.1)] relative"
          >
            <button 
              onClick={onClose}
              disabled={isVerifying}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#D4FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#D4FF00]/20">
                <ShieldCheck className="w-6 h-6 text-[#D4FF00]" />
              </div>
              <h2 className="text-xl font-display uppercase tracking-tight text-white">Secure UPI Payment</h2>
              <p className="text-xs text-gray-400 font-mono mt-1">Scan to pay securely via any UPI app</p>
            </div>

            <div className="bg-white p-4 rounded-2xl mx-auto mb-4 w-fit shadow-lg shadow-[#D4FF00]/5">
              <QRCode 
                value={upiUrl} 
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            
            <div className="flex justify-center mb-6">
              <a 
                href={upiUrl}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[10px] font-bold uppercase py-2 px-5 rounded-xl transition-all flex items-center gap-2 active:scale-95"
              >
                Pay Directly via UPI App
              </a>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center px-4 py-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Amount to Pay</span>
                <span className="text-lg font-black text-[#D4FF00]">₹{amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center px-4 py-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Paying To</span>
                <span className="text-xs font-mono font-bold text-white">{upiId}</span>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full bg-[#D4FF00] hover:bg-white text-black font-black py-4 rounded-xl text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(212,255,0,0.15)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-[#D4FF00]"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Payment...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  I Have Paid ₹{amount.toLocaleString()}
                </>
              )}
            </button>
            <p className="text-[9px] font-mono text-gray-500 text-center mt-3 uppercase tracking-wider">
              Please do not close this window while verifying
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
