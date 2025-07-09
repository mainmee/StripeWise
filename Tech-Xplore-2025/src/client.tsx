import "./styles.css";
import { createRoot } from "react-dom/client";
import App from "./app";
import { Providers } from "@/providers";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const ScrollableApp = () => {
  useEffect(() => {
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
  }, []);

  return (
    <Providers>
      <div className="chat-container bg-neutral-50 text-base text-neutral-900 antialiased transition-colors selection:bg-blue-700 selection:text-white dark:bg-neutral-950 dark:text-neutral-100">
        {/* Title Section */}
        <section className="title-section min-h-screen flex items-center justify-center">
          <h1 className="title text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F59E0B] bg-[length:200%_auto]">
            StripeWise
          </h1>
        </section>

        {/* Chatbot Section */}
        <section className="chatbot-section min-h-screen flex items-center justify-center">
          <App />
        </section>
      </div>
    </Providers>
  );
};

const root = createRoot(document.getElementById("app")!);
root.render(<ScrollableApp />);