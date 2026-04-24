"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { api } from "@/lib/api";
import "../landing.css";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [websiteName, setWebsiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);

    // Fetch settings from backend
    const fetchSettings = async () => {
      try {
        const settings = await api.getSettings();
        setWebsiteName(settings.website_name || "Research Nexus");
        setLogoUrl(settings.logo_url || "/logo-static.png");
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        // Use defaults if fetch fails
        setWebsiteName("Research Nexus");
        setLogoUrl("/logo-static.png");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <div className={`landing-page ${isDark ? "dark" : "light"}`}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`landing-page ${isDark ? "dark" : "light"}`}>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`navbar ${isScrolled ? "scrolled" : ""}`}
      >
        <div className="container">
          <Link href="/" className="nav-brand">
            <div className="brand-logo">
              <img src={logoUrl} alt={websiteName} />
            </div>
            <span>{websiteName}</span>
          </Link>
          <div className="nav-actions">
            <button onClick={toggleTheme} className="btn btn-ghost theme-toggle" aria-label="Toggle theme">
              {isDark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <Link href="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link href="/register" className="btn btn-primary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <motion.div style={{ opacity, scale }} className="hero-inner container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-content"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hero-badge"
            >
              <span className="badge-dot"></span>
              Streamline Your Research
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Systematic Reviews
              <br />
              <span className="gradient-text">Made Simple</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="hero-desc"
            >
              Collaborate with your team, screen articles efficiently, and manage your systematic literature reviews with powerful tools designed for researchers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="hero-cta"
            >
              <Link href="/register" className="btn btn-primary btn-lg">
                Get Started Free
                <span className="btn-arrow">→</span>
              </Link>
              <Link href="#features" className="btn btn-secondary btn-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                See How It Works
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="trusted-row"
            >
              <p className="trusted-label">Trusted by researchers worldwide</p>
              <div className="trusted-logos">
                <span className="trusted-logo">🎓 Universities</span>
                <span className="trusted-logo">🔬 Research Labs</span>
                <span className="trusted-logo">🏥 Medical Centers</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hero-mockup"
          >
            <div className="mockup-window">
              <div className="mockup-toolbar">
                <span className="mockup-dot"></span>
                <span className="mockup-dot"></span>
                <span className="mockup-dot"></span>
              </div>
              <div className="mockup-body">
                <div className="mockup-metric-row">
                  <AnimatedMetric label="Articles Screened" value="2,847" change="+12.3%" />
                  <AnimatedMetric label="Team Members" value="8" change="+2" />
                  <AnimatedMetric label="Reviews Active" value="5" change="+1" />
                </div>
                <div className="mockup-chart">
                  <div className="mockup-chart-label">Screening Progress — Last 7 days</div>
                  <svg viewBox="0 0 300 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
                        <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1 }}
                      d="M0 50 Q20 45 40 40 T80 30 T120 35 T160 20 T200 25 T240 15 T280 10 T300 5 V60 H0Z"
                      fill="url(#lineGrad)"
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1 }}
                      d="M0 50 Q20 45 40 40 T80 30 T120 35 T160 20 T200 25 T240 15 T280 10 T300 5"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Animated Background Elements */}
        <div className="hero-bg-shapes">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="shape shape-1"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="shape shape-2"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section" id="features">
        <div className="container">
          <FadeInSection>
            <div className="section-header">
              <p className="section-label">Features</p>
              <h2 className="section-title">
                Everything you need for
                <br />
                systematic reviews
              </h2>
              <p className="section-desc">
                Powerful tools designed specifically for research teams conducting systematic literature reviews.
              </p>
            </div>
          </FadeInSection>

          <div className="features-grid">
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="Team Collaboration"
              description="Invite team members, assign roles, and work together seamlessly on your systematic reviews."
              delay={0.1}
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              }
              title="Article Screening"
              description="Efficiently screen thousands of articles with custom criteria, keyword highlighting, and duplicate detection."
              delay={0.2}
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="Real-time Analytics"
              description="Track your progress with live dashboards showing screening statistics and team performance."
              delay={0.3}
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              }
              title="Import & Export"
              description="Import articles from CSV, RIS, BibTeX and export your results in multiple formats."
              delay={0.4}
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
              title="Secure & Private"
              description="Your research data is encrypted and stored securely with enterprise-grade security."
              delay={0.5}
            />
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              title="Save Time"
              description="Automate repetitive tasks and focus on what matters - conducting quality research."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <FadeInSection>
              <div className="stat-item">
                <CountUpNumber end={10000} suffix="+" />
                <div className="stat-label">Articles Screened</div>
              </div>
            </FadeInSection>
            <FadeInSection>
              <div className="stat-item">
                <CountUpNumber end={500} suffix="+" />
                <div className="stat-label">Research Teams</div>
              </div>
            </FadeInSection>
            <FadeInSection>
              <div className="stat-item">
                <CountUpNumber end={99} suffix="%" decimal />
                <div className="stat-label">User Satisfaction</div>
              </div>
            </FadeInSection>
            <FadeInSection>
              <div className="stat-item">
                <CountUpNumber end={24} suffix="/7" />
                <div className="stat-label">Support Available</div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <FadeInSection>
            <div className="cta-content">
              <h2>Ready to streamline your research?</h2>
              <p>Join hundreds of research teams using {websiteName} for their systematic reviews.</p>
              <div className="cta-buttons">
                <Link href="/register" className="btn btn-primary btn-lg">
                  Start Free Trial
                  <span className="btn-arrow">→</span>
                </Link>
                <Link href="/login" className="btn btn-secondary btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="nav-brand">
                <div className="brand-logo">
                  <img src={logoUrl} alt={websiteName} />
                </div>
                <span>{websiteName}</span>
              </div>
              <p className="footer-desc">
                Streamline your systematic literature reviews with powerful collaboration tools.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#docs">Documentation</a>
                <a href="#updates">Updates</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#blog">Blog</a>
                <a href="#careers">Careers</a>
                <a href="#contact">Contact</a>
              </div>
              <div className="footer-col">
                <h4>Legal</h4>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
                <a href="#security">Security</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {websiteName}. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Animated Metric Component
function AnimatedMetric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className="mockup-metric"
    >
      <div className="mm-label">{label}</div>
      <div className="mm-value">{value}</div>
      <div className="mm-change">{change}</div>
    </motion.div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
      className="feature-card"
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
}

// Fade In Section Component
function FadeInSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}

// Count Up Number Component
function CountUpNumber({ end, suffix = "", decimal = false }: { end: number; suffix?: string; decimal?: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, end]);

  return (
    <div ref={ref} className="stat-number">
      {decimal ? count.toFixed(0) : count.toLocaleString()}
      {suffix}
    </div>
  );
}
