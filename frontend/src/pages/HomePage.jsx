/*
 * HomePage.jsx
 * -----------------------------------------------
 * Public landing page for unauthenticated visitors.
 * Demonstrates: props passed to sub-components, conditional rendering,
 * lists rendered with .map(), event handler props.
 */

import { useNav } from '../context/AppContext';
import './HomePage.css';

// FeatureCard — reusable sub-component accepting props
function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}

// StepBadge — numbered step indicator sub-component
function StepBadge({ number, title, description, accent }) {
  return (
    <div className="step-item">
      <div className={`step-number step-number--${accent}`}>{number}</div>
      <div className="step-body">
        <div className="step-title">{title}</div>
        <div className="step-desc">{description}</div>
      </div>
    </div>
  );
}

// Data arrays — rendered via .map() to demonstrate list rendering
const FEATURES = [
  {
    icon: '🏗️',
    title: 'Post Your Project',
    description:
      'Describe your renovation, set your budget range, and publish to hundreds of verified contractors.',
  },
  {
    icon: '📋',
    title: 'Receive Proposals',
    description:
      'Qualified contractors submit competitive bids with pricing and a detailed message for your project.',
  },
  {
    icon: '✅',
    title: 'Accept & Build',
    description:
      'Review all proposals, accept the best fit, and Buildora automatically closes other bids for you.',
  },
  {
    icon: '🔒',
    title: 'Secure Platform',
    description:
      'JWT-authenticated accounts, role-based access control, and admin-verified contractor profiles.',
  },
  {
    icon: '📍',
    title: 'Location-Based',
    description:
      'Every project includes a location so contractors in your area can find relevant opportunities.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Updates',
    description:
      'Proposal counts, project statuses, and contractor verifications update instantly in the UI.',
  },
];

const STEPS_HOMEOWNER = [
  { number: 1, title: 'Register as a Homeowner',   description: 'Create your free account in under a minute.' },
  { number: 2, title: 'Post a Renovation Project', description: 'Add title, description, budget, and location.' },
  { number: 3, title: 'Review Incoming Proposals', description: 'Read each contractor\'s bid and message.' },
  { number: 4, title: 'Accept the Best Bid',       description: 'Click Accept — all other bids are auto-rejected.' },
];

const STATS = [
  { value: '500+', label: 'Active Projects' },
  { value: '1,200+', label: 'Verified Contractors' },
  { value: '$4.2M', label: 'Project Value Matched' },
  { value: '98%', label: 'Client Satisfaction' },
];

export default function HomePage() {
  const { navigate } = useNav();

  return (
    <div className="home-page">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" /> Canada's #1 Renovation Marketplace
        </div>
        <h1 className="hero-title">
          Connect Homeowners<br />
          with <span className="hero-accent">Trusted Contractors</span>
        </h1>
        <p className="hero-subtitle">
          Post your renovation project, receive competitive proposals from
          verified contractors, and get your dream home built — faster and
          smarter with Buildora.
        </p>
        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={() => navigate('register')}>
            Get Started Free →
          </button>
          <button className="hero-btn-secondary" onClick={() => navigate('login')}>
            Sign In
          </button>
        </div>

        {/* Stats strip */}
        <div className="hero-stats">
          {STATS.map((s) => (
            <div key={s.label} className="hero-stat">
              <span className="hero-stat-value">{s.value}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────── */}
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">Everything you need to renovate smarter</h2>
          <p className="section-subtitle">
            Built from the ground up for homeowners and contractors alike.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────── */}
      <section className="section how-it-works container">
        <div className="section-header">
          <h2 className="section-title">How Buildora works</h2>
          <p className="section-subtitle">Four simple steps from idea to construction.</p>
        </div>
        <div className="steps-list">
          {STEPS_HOMEOWNER.map((s, idx) => (
            <StepBadge
              key={s.number}
              {...s}
              accent={['orange', 'blue', 'green', 'purple'][idx]}
            />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────── */}
      <section className="cta-banner container">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to start your renovation?</h2>
          <p className="cta-subtitle">
            Join thousands of homeowners who found their perfect contractor on Buildora.
          </p>
          <div className="cta-actions">
            <button className="hero-btn-primary" onClick={() => navigate('register')}>
              Create Free Account
            </button>
            <button className="hero-btn-secondary" onClick={() => navigate('browse')}>
              Browse Projects
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
