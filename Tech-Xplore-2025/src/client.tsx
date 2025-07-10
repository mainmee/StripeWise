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
  const [currentView, setCurrentView] = useState('landing');
  type User = { email: string; name: string } | null;
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    // Only run animations on landing view
    if (currentView === 'landing') {
      // Glimmer animation for the title
      gsap.fromTo(
        ".title",
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
    }
  }, [currentView]);

  const handleSignIn = (email: string, password: any) => {
    if (email && password) {
      setUser({ email, name: email.split('@')[0] });
      setCurrentView('app');
    } else {
      alert('Please enter email and password');
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentView('landing');
  };

  // Landing Page View (Original Design)
  if (currentView === 'landing') {
    return (
      <Providers>
        <div className="chat-container bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
          {/* Title Section */}
          <section className="title-section min-h-screen flex flex-col items-center justify-center">
            <h1 className="title text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] bg-[length:200%_auto] mb-8">
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
              <p className="text-gray-600 dark:text-gray-300">Welcome back!</p>
            </div>
            
            <SignInForm onSignIn={handleSignIn} />
            
            <button
              onClick={() => setCurrentView('landing')}
              className="w-full mt-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-center"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </Providers>
    );
  }

  // Main App View
  return (
    <Providers>
      <div className="bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-900 shadow-sm p-4 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B]">
              StripeWise
            </h1>
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
        </header>

        {/* Main Content */}
        <main className="min-h-screen">
          <div className="max-w-6xl mx-auto p-4">
            <App />
          </div>
        </main>
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

  const handleSubmit = () => {
    onSignIn(email, password);
  };

  return (
    <div className="space-y-6">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
          placeholder="Email address"
        />
      </div>
      
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
          placeholder="Password"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
      >
        Sign In
      </button>
    </div>
  );
};

const container = document.getElementById("app");
if (!container) {
  throw new Error('Root container with id "app" not found');
}
const root = createRoot(container);
root.render(<ScrollableApp />);