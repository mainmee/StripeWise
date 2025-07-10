import "./styles.css";
import { createRoot } from "react-dom/client";
import App from "./app";
import { Providers } from "@/providers";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const ScrollableApp = () => {
  const [currentView, setCurrentView] = useState('intro'); // Start with intro
  const [showChat, setShowChat] = useState(false);
  type User = { email: string; name: string } | null;
  const [user, setUser] = useState<User>(null);

  const handleSignIn = (email: string, password: any) => {
    if (email && password) {
      setUser({ email, name: email.split('@')[0] });
      setCurrentView('landing'); // Go to landing page after signin
    } else {
      alert('Please enter email and password');
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentView('intro');
    setShowChat(false);
  };

  const scrollToServices = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    // Run animations based on current view
    if (currentView === 'intro') {
      // Glimmer animation for the intro title
      gsap.fromTo(
        ".intro-title",
        { backgroundPosition: "0% 50%" },
        {
          backgroundPosition: "200% 50%",
          duration: 2,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: ".title-section",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // Fade-out animation for the title section
      gsap.to(".title-section", {
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".title-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    } else if (currentView === 'landing') {
      // Glimmer animation for the landing title
      gsap.fromTo(
        ".title",
        { backgroundPosition: "0% 50%" },
        {
          backgroundPosition: "200% 50%",
          duration: 2,
          ease: "power1.inOut",
          repeat: -1,
        }
      );

      // Animate service tiles on load
      gsap.fromTo(
        ".service-tile",
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9 
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.5,
          ease: "power2.out",
        }
      );
    }
  }, [currentView]);

  // Introduction Page View - First screen users see
  if (currentView === 'intro') {
    return (
      <Providers>
        <div className="chat-container bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
          {/* Title Section */}
          <section className="title-section min-h-screen flex flex-col items-center justify-center">
            <h1 className="intro-title text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] bg-[length:200%_auto] mb-8">
              StripeWise
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 text-center max-w-2xl">
              Your AI-powered assistant for smart financial decisions
            </p>

            <button
              onClick={() => setCurrentView('signin')}
              className="bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Get Started
            </button>
          </section>

          {/* Chatbot Section (Preview) */}
          <section className="chatbot-section min-h-screen flex items-center justify-center">
           
          </section>
        </div>
      </Providers>
    );
  }

  // Sign In View
  if (currentView === 'signin') {
    return (
      <Providers>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] mb-2">
                StripeWise
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Welcome! Please sign in to continue.</p>
            </div>
            
            <SignInForm onSignIn={handleSignIn} />
          </div>
        </div>
      </Providers>
    );
  }

  // Chat View
  if (showChat) {
    return (
      <Providers>
        <div className="chat-container bg-black text-white min-h-screen">
          <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
            <button 
              onClick={() => setShowChat(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Home
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm">Hello, {user?.name}!</span>
              <button
                onClick={handleSignOut}
                className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          <App />
        </div>
      </Providers>
    );
  }

  // Landing Page View - Shown after successful signin
  return (
    <Providers>
      <div className="min-h-screen bg-black text-white">
        {/* Navigation */}
        <nav className="flex items-center justify-between p-6 bg-gray-600 border-b border-gray-500">
          <div className="text-4xl font-bold text-white">StripeWise</div>
          <div className="flex items-center space-x-8 text-lg">
            <a href="#" className="text-gray-200 hover:text-white transition-colors font-medium">Home</a>
            <a href="#" className="text-gray-200 hover:text-white transition-colors font-medium">Dashboard</a>
            <a href="#services" className="text-gray-200 hover:text-white transition-colors font-medium">Services</a>
            <a href="#about" className="text-gray-200 hover:text-white transition-colors font-medium">About</a>
            <a href="#key-features" className="text-gray-200 hover:text-white transition-colors font-medium">Key Features</a>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">Welcome, {user?.name}!</span>
              <button 
                onClick={() => setShowChat(true)}
                className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Start Chat
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex items-center justify-between px-6 py-20 max-w-7xl mx-auto">
          <div className="flex-1 max-w-2xl">
            <h1 className="title text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-[length:200%_auto] mb-6">
              Optimize your financial future with StripeWise
            </h1>
            
            {/* Zebra Image */}
            <div className="mt-12 flex justify-center">
              <div className="rounded-2xl overflow-hidden">
                <img 
                  src="/zebra.jpg" 
                  alt="StripeWise Zebra" 
                  className="w-80 h-64 object-cover opacity-95 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div id="services" className="flex-1 grid grid-cols-2 gap-6 max-w-2xl ml-20">
            <div 
              className="service-tile bg-gray-600 hover:bg-gray-500 p-8 rounded-2xl border border-gray-500 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-green-500/20"
              onClick={() => setShowChat(true)}
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Finance</h3>
              <p className="text-gray-300 text-base">
                Vehicle finance at prime -1%. Flexible home loans with no early settlement fees.
              </p>
            </div>

            <div 
              className="service-tile bg-gray-600 hover:bg-gray-500 p-8 rounded-2xl border border-gray-500 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-blue-500/20"
              onClick={() => setShowChat(true)}
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Save</h3>
              <p className="text-gray-300 text-base">
                Instant access, notice and fixed deposit savings accounts - no monthly fees, starting from R1,000.
              </p>
            </div>

            <div 
              className="service-tile bg-gray-600 hover:bg-gray-500 p-8 rounded-2xl border border-gray-500 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-purple-500/20"
              onClick={() => setShowChat(true)}
            >
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Invest</h3>
              <p className="text-gray-300 text-base">
                No minimum requirement for online share trading. Local and offshore tax-free unit trusts with R1,000 monthly debit order.
              </p>
            </div>

            <div 
              className="service-tile bg-gray-600 hover:bg-gray-500 p-8 rounded-2xl border border-gray-500 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-red-500/20"
              onClick={() => setShowChat(true)}
            >
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Insure</h3>
              <p className="text-gray-300 text-base">
                Easy activation on no-cost life insurance of R25,000. Additional funeral cover and complimentary travel insurance.
              </p>
            </div>
          </div>
        </section>

        {/* What is StripeWise Section */}
        <section id="about" className="py-16" style={{ backgroundColor: '#3A3B3C' }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-white mb-8 text-center">What is StripeWise?</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
              {/* Left Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">AI-Powered Financial Coach</h3>
                  <p className="text-gray-300 leading-relaxed">
                    StripeWise is an intelligent financial assistant designed specifically for young professionals who bank with Investec. 
                    Our AI leverages advanced algorithms to analyze your financial patterns, spending habits, and goals to provide 
                    personalized recommendations that help you make smarter financial decisions.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Tailored for Young Professionals</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Whether you're just starting your career, planning major purchases like your first home or car, or looking to 
                    build long-term wealth, StripeWise understands the unique financial challenges and opportunities that come with 
                    being a young professional in today's economy.
                  </p>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Investec Integration</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Built specifically for Investec Private Banking clients, StripeWise seamlessly integrates with your existing 
                    banking relationship to provide insights based on your actual financial data. This means more accurate advice, 
                    better predictions, and recommendations that truly fit your financial situation.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">Smart Financial Guidance</h3>
                  <p className="text-gray-300 leading-relaxed">
                    From optimizing your savings strategy to finding the best investment opportunities, StripeWise provides 
                    actionable insights that help you build wealth more effectively. Our AI considers market conditions, 
                    your risk tolerance, and your financial goals to deliver advice that's both smart and achievable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Key Features Section - Full Width Black */}
        <section id="key-features" className="bg-black py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="border-t-4 border-black pt-12">
              <h3 className="text-3xl font-semibold text-white mb-12 text-center">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-3 text-lg">Smart Analytics</h4>
                  <p className="text-gray-400 text-base">Real-time analysis of your spending patterns and financial health</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-3 text-lg">Goal Setting</h4>
                  <p className="text-gray-400 text-base">Personalized financial goals with actionable steps to achieve them</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/50">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-3 text-lg">Instant Advice</h4>
                  <p className="text-gray-400 text-base">Get immediate answers to your financial questions through AI chat</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-3 text-lg">Secure & Private</h4>
                  <p className="text-gray-400 text-base">Bank-grade security with complete privacy protection for your data</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Providers>
  );
};

// Sign In Form Component
type SignInFormProps = {
  onSignIn: (email: string, password: string) => void;
};

const SignInForm: React.FC<SignInFormProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
          placeholder="Email address"
          required
        />
      </div>
      
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
          placeholder="Password"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
      >
        Sign In
      </button>
    </form>
  );
};

const container = document.getElementById("app");
if (!container) {
  throw new Error('Root container with id "app" not found');
}
const root = createRoot(container);
root.render(<ScrollableApp />);