import { useRef, useState, useEffect } from 'react';
import { ArrowRight, Zap, Dumbbell, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { supabase, getPublicUrl } from '../lib/supabase';

function IntroSequence({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* Cinematic Pre-Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1.05, 1.1], filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'] }}
        transition={{ duration: 2.8, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
        className="absolute flex flex-col items-center justify-center text-center px-4 z-10 w-full"
      >
        <span className="text-red-600 font-mono text-sm md:text-lg font-bold uppercase tracking-[0.5em] mb-3 md:mb-4">
          Belgaum's First
        </span>
        <span className="text-gray-200 font-display text-3xl md:text-6xl uppercase tracking-widest drop-shadow-lg">
          Cloud Protein Kitchen
        </span>
      </motion.div>

      {/* "WHEYO" Slam */}
      <motion.div
        initial={{ scale: 30, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.1, delay: 3.0, ease: "easeIn" }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2000); // Hold for 2s after slam
        }}
        className="relative flex flex-col items-center justify-center z-30 w-full"
      >
        <motion.h1 
          animate={{ x: [0, -15, 15, -10, 10, 0], y: [0, 15, -15, 10, -10, 0] }}
          transition={{ duration: 0.4, delay: 3.0 }}
          className="text-[28vw] md:text-[22rem] font-black uppercase tracking-tighter leading-none text-white drop-shadow-[0_0_50px_rgba(255,0,0,0.8)]"
        >
          WHEYO
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 3.15, type: "spring", stiffness: 200 }}
          className="bg-red-600 text-white px-6 py-2 md:py-4 mt-[-6vw] md:mt-[-4vw] z-40 transform -rotate-2 shadow-2xl border-2 border-black"
        >
          <h2 className="text-2xl md:text-6xl font-display uppercase tracking-widest m-0 leading-none">
            The Protein Kitchen
          </h2>
        </motion.div>
      </motion.div>

      {/* Impact Flash & Blood Splatter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.4, 0] }}
        transition={{ duration: 1.5, delay: 3.0, times: [0, 0.05, 0.2, 1] }}
        className="absolute inset-0 bg-red-600 mix-blend-overlay pointer-events-none z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.9, 0.9], scale: [0.5, 1.1, 1.15] }}
        transition={{ duration: 2.5, delay: 3.0, ease: "easeOut" }}
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-color-dodge pointer-events-none z-20"
      />
      
      {/* Vignette for cinematic feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#050505_100%)] z-50 pointer-events-none" />
    </motion.div>
  );
}

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [precisionProducts, setPrecisionProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRandomProducts = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);
      
      if (data && !error) {
        // Randomly select 4 products
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setPrecisionProducts(shuffled.slice(0, 4));
      }
    };
    fetchRandomProducts();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (showIntro) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showIntro]);

  // Global scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  // Hero Parallax
  const heroBgY = useTransform(scrollYProgress, [0, 0.2], [0, 200]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  // Struggle Reveal (Sticky)
  const struggleRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: struggleProgress } = useScroll({ target: struggleRef, offset: ["start center", "end center"] });
  const struggleOpacity1 = useTransform(struggleProgress, [0, 0.2], [0.1, 1]);
  const struggleOpacity2 = useTransform(struggleProgress, [0.2, 0.4], [0.1, 1]);
  const struggleOpacity3 = useTransform(struggleProgress, [0.4, 0.6], [0.1, 1]);
  
  // Dynamic Spotlight for Struggle Section
  const spotlightOpacity = useTransform(struggleProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const spotlightY = useTransform(struggleProgress, [0, 1], ["-20%", "120%"]);

  // Science Parallax
  const scienceRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scienceProgress } = useScroll({ target: scienceRef, offset: ["start end", "end start"] });
  const numberY = useTransform(scienceProgress, [0, 1], [150, -150]);
  const scienceTextY = useTransform(scienceProgress, [0, 1], [50, -50]);

  // Solution Parallax (Asymmetric Cards)
  const solutionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: solutionProgress } = useScroll({ target: solutionRef, offset: ["start end", "end start"] });
  const card1Y = useTransform(solutionProgress, [0, 1], [50, -50]);
  const card2Y = useTransform(solutionProgress, [0, 1], [150, -150]);
  const card3Y = useTransform(solutionProgress, [0, 1], [100, -100]);
  const card4Y = useTransform(solutionProgress, [0, 1], [200, -200]);

  // Process Line Draw
  const processRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: processProgress } = useScroll({ target: processRef, offset: ["start center", "end center"] });
  const lineHeight = useTransform(processProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="bg-[#050505] text-white selection:bg-[#D4FF00] selection:text-black relative">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-[#D4FF00] origin-left z-[200]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Cinematic Noise Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <AnimatePresence>
        {showIntro && <IntroSequence onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Hero Section - Deep Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroBgY }} className="absolute inset-0 z-0 origin-top">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#050505] z-10" />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=2000" 
            alt="Athlete training"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-30 text-center px-4 max-w-5xl mx-auto pt-32 pb-48 md:pt-40 md:pb-64">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
              <span className="text-sm font-mono text-white uppercase tracking-wider">Trusted by 500+ Campus Athletes</span>
            </div>
            
            <h1 className="text-7xl md:text-[10rem] font-display uppercase tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl">
              Don't Starve <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4FF00] to-emerald-600 italic pr-4">
                Your Gains
              </span>
            </h1>
            <p className="text-xl md:text-3xl font-light text-gray-300 max-w-3xl mx-auto mb-10">
              High-protein, cafe-style meals. Zero BS.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link to="/menu" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#D4FF00] text-black px-8 py-4 md:px-10 md:py-5 rounded-full font-bold text-base md:text-xl hover:bg-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(212,255,0,0.3)]">
                <Zap className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                Order on WhatsApp
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Angled Scrolling Ticker */}
        <div className="absolute bottom-4 left-0 w-full overflow-hidden z-10 -rotate-1 scale-105 pointer-events-none">
          <div className="bg-[#D4FF00] py-4 border-y-4 border-black shadow-2xl">
            <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 15 }} className="flex whitespace-nowrap text-black font-display text-2xl md:text-4xl uppercase tracking-wider font-black">
              <span className="mx-6">HIGH PROTEIN</span> • <span className="mx-6">ZERO BS</span> • <span className="mx-6">CAFE STYLE</span> • <span className="mx-6">MACRO TRACKED</span> • <span className="mx-6">INDIAN FLAVORS</span> • 
              <span className="mx-6">HIGH PROTEIN</span> • <span className="mx-6">ZERO BS</span> • <span className="mx-6">CAFE STYLE</span> • <span className="mx-6">MACRO TRACKED</span> • <span className="mx-6">INDIAN FLAVORS</span> • 
              <span className="mx-6">HIGH PROTEIN</span> • <span className="mx-6">ZERO BS</span> • <span className="mx-6">CAFE STYLE</span> • <span className="mx-6">MACRO TRACKED</span> • <span className="mx-6">INDIAN FLAVORS</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chapter 1: The Problem (Sticky Reveal) */}
      <section ref={struggleRef} className="py-32 md:py-64 px-4 relative min-h-[150vh] overflow-hidden">
        {/* Dynamic Spotlight */}
        <motion.div 
          style={{ opacity: spotlightOpacity, top: spotlightY }}
          className="absolute left-1/2 -translate-x-1/2 w-[600px] md:w-[1000px] h-[600px] md:h-[1000px] bg-[radial-gradient(circle_at_center,rgba(212,255,0,0.12)_0%,transparent_60%)] pointer-events-none blur-3xl z-0"
        />
        
        <div className="sticky top-24 md:top-1/3 max-w-5xl mx-auto relative z-10">
          <span className="text-[#FF3E00] font-mono font-bold tracking-widest uppercase mb-8 block">01 / The Struggle</span>
          <h2 className="text-5xl md:text-8xl font-display uppercase leading-[0.9] mb-8">
            <motion.span style={{ opacity: struggleOpacity1 }} className="block text-white">You train for 2 hours.</motion.span>
            <motion.span style={{ opacity: struggleOpacity2 }} className="block text-gray-600">You lose it all</motion.span>
            <motion.span style={{ opacity: struggleOpacity3 }} className="block text-[#D4FF00]">in the dining hall.</motion.span>
          </h2>
          <motion.p style={{ opacity: struggleOpacity3 }} className="text-xl md:text-3xl text-gray-400 font-light leading-relaxed max-w-3xl mt-12">
            Hostel food is built for survival, not performance. Less than 15g of protein per meal. Hidden oils. Empty carbs. You are working out hard, but your nutrition is holding you back.
          </motion.p>
        </div>
      </section>

      {/* Chapter 2: The Science (Parallax) */}
      <section ref={scienceRef} id="science" className="py-32 md:py-48 bg-[#111] text-white px-4 overflow-hidden relative border-y border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,255,0,0.05)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div style={{ y: isMobile ? 0 : scienceTextY }} className="flex-1 z-20">
              <span className="text-[#D4FF00] font-mono font-bold tracking-widest uppercase mb-4 block">02 / The Science</span>
              <h2 className="text-6xl md:text-8xl font-display uppercase leading-[0.9] mb-8">
                Muscle is built<br/>in the kitchen.
              </h2>
              <p className="text-xl md:text-2xl text-gray-400 font-light max-w-lg mb-12">
                Science demands 1.6g to 2.2g of protein per kg of body weight. Anything less, and you're just breaking down muscle without rebuilding it.
              </p>
              <div className="bg-black/50 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-2xl">
                <Target className="w-8 h-8 md:w-10 md:h-10 text-[#D4FF00] mb-6" />
                <h3 className="text-xl md:text-2xl font-display uppercase mb-6 tracking-wide text-white">The Wheyo Standard</h3>
                <ul className="space-y-4 md:space-y-5 font-mono text-base md:text-lg text-gray-300">
                  <li className="flex items-center gap-4"><ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-[#D4FF00] shrink-0" /> Minimum <span className="text-[#D4FF00] font-bold text-xl md:text-2xl">30g</span> protein/meal</li>
                  <li className="flex items-center gap-4"><ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-[#D4FF00] shrink-0" /> Weighed to the gram</li>
                  <li className="flex items-center gap-4"><ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-[#D4FF00] shrink-0" /> Zero hidden seed oils</li>
                </ul>
              </div>
            </motion.div>
            <div className="flex-1 relative w-full h-[250px] md:h-auto flex items-center justify-center">
              <motion.div style={{ y: isMobile ? 0 : numberY }} className="text-[8rem] sm:text-[12rem] md:text-[25rem] font-display leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent absolute">
                2.2g
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3: The Solution (Asymmetric Scroll) */}
      <section ref={solutionRef} className="py-32 md:py-48 px-4 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32">
            <span className="text-[#D4FF00] font-mono font-bold tracking-widest uppercase mb-4 block">03 / The Solution</span>
            <h2 className="text-6xl md:text-8xl font-display uppercase tracking-tighter">Precision Fuel.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {(precisionProducts.length > 0 ? precisionProducts.slice(0, 4) : [
              { id: 1, image_url: '/images/101.png', name: 'Chicken Roll (Buy 1 Get 1)', protein: 25, calories: 350, description: 'Authentic Indian spices. Weighed, tracked, and ready to eat.' },
              { id: 2, image_url: '/images/102.png', name: 'Boiled Chicken (100g)', protein: 31, calories: 165, description: 'Cafe-style indulgence. Zero guilt. Maximum protein.' },
              { id: 3, image_url: '/images/103.png', name: 'Soya Rice', protein: 30, calories: 350, description: 'Vegetarian muscle fuel. Rich, creamy, and macro-perfect.' },
              { id: 4, image_url: '/images/104.png', name: 'Soya Roll', protein: 20, calories: 280, description: 'High-protein vegetarian wrap. Quick, easy, and macro-friendly.' }
            ]).map((product, index) => {
              const cardYs = [card1Y, card2Y, card3Y, card4Y];
              return (
                <motion.div key={product.id} onClick={() => navigate('/menu')} style={{ y: isMobile ? 0 : cardYs[index] }} className={`group relative h-[350px] md:h-[450px] rounded-3xl overflow-hidden border border-white/10 cursor-pointer ${index % 2 !== 0 ? 'md:mt-24' : ''}`}>
                  <img src={getPublicUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                    <div className="flex gap-3 mb-4 md:mb-6">
                      <span className="bg-[#D4FF00] text-black px-3 py-1.5 md:px-4 md:py-2 rounded-full font-mono text-xs md:text-sm font-bold">{product.protein}g PRO</span>
                      <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-mono text-xs md:text-sm">{product.calories} kcal</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-display uppercase mb-2 md:mb-4 tracking-wide text-white group-hover:text-[#D4FF00] transition-colors">{product.name}</h3>
                    <p className="text-gray-400 text-base md:text-lg line-clamp-2">{product.description || ""}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chapter 4: The Process (Line Draw) */}
      <section ref={processRef} className="py-32 md:py-48 px-4 relative bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-[27px] md:left-[39px] top-0 bottom-0 w-1 bg-white/5 rounded-full" />
          <motion.div style={{ height: lineHeight }} className="absolute left-[27px] md:left-[39px] top-0 w-1 bg-gradient-to-b from-[#D4FF00] to-[#FF3E00] rounded-full shadow-[0_0_15px_rgba(212,255,0,0.5)]" />

          <div className="space-y-24 relative z-10">
            {[
              { num: "01", title: "Choose Your Fuel", desc: "Browse our fuel station of high-protein, macro-calculated meals designed for specific training goals." },
              { num: "02", title: "WhatsApp Order", desc: "No apps. No signups. Just tap to order via WhatsApp and we'll have it ready for pickup or delivery." },
              { num: "03", title: "Grow", desc: "Hit your protein targets consistently. Recover faster. Build more muscle. It's that simple." }
            ].map((step, i) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="flex gap-8 md:gap-16 items-start"
              >
                <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 bg-[#141414] border border-white/10 rounded-2xl flex items-center justify-center text-2xl md:text-4xl font-display text-[#D4FF00] shadow-xl relative z-10">
                  {step.num}
                </div>
                <div className="pt-2 md:pt-4">
                  <h3 className="text-3xl md:text-5xl font-display uppercase mb-4 text-white tracking-wide">{step.title}</h3>
                  <p className="text-xl text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Climax / CTA */}
      <section className="py-40 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#D4FF00]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-10 mix-blend-multiply" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <h2 className="text-7xl md:text-9xl font-display uppercase text-black leading-[0.85] mb-8 tracking-tighter">
              Stop Guessing.<br />Start Growing.
            </h2>
            <p className="text-2xl md:text-3xl text-black/80 font-medium mb-12 max-w-2xl mx-auto">
              Join the campus athletes who have outsourced their nutrition to Wheyo.
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-4 bg-black text-white px-12 py-6 md:px-16 md:py-8 rounded-full font-bold text-2xl md:text-3xl hover:bg-gray-900 transition-all hover:scale-105 shadow-2xl group"
            >
              <Dumbbell className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform" />
              Order Your First Meal
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
