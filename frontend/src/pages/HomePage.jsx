/*
 * HomePage.jsx
 * Public landing page for unauthenticated visitors.
 * Demonstrates: props passed to sub-components, conditional rendering,
 * lists rendered with .map(), event handler props.
 */

import { useNav } from '../context/AppContext';
import './HomePage.css';

/* ── Reusable sub-components ── */

function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon-wrap">
        <span className="feature-icon">{icon}</span>
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}

function StepItem({ number, icon, title, description, detail, accent }) {
  return (
    <div className="step-item">
      <div className={`step-number step-number--${accent}`}>
        <span className="step-num-text">{number}</span>
      </div>
      <div className="step-body">
        <div className="step-header">
          <span className="step-icon">{icon}</span>
          <div className="step-title">{title}</div>
        </div>
        <div className="step-desc">{description}</div>
        {detail && <div className="step-detail">{detail}</div>}
      </div>
    </div>
  );
}

function TrustBadge({ icon, value, label }) {
  return (
    <div className="trust-badge">
      <span className="trust-badge-icon">{icon}</span>
      <div>
        <div className="trust-badge-value">{value}</div>
        <div className="trust-badge-label">{label}</div>
      </div>
    </div>
  );
}

/* ── Data ── */

const FEATURES = [
  {
    icon: '🏗️',
    title: 'Post Your Project',
    description:
      'Describe your renovation scope, set a realistic budget range, and publish to our network of verified contractors instantly — no listing fees.',
  },
  {
    icon: '📋',
    title: 'Receive Competitive Bids',
    description:
      'Qualified contractors submit detailed proposals with their price and a personal cover message tailored to your specific project needs.',
  },
  {
    icon: '✅',
    title: 'Accept & Start Building',
    description:
      'Review all proposals side by side, accept the best fit, and Buildora automatically notifies every contractor of the outcome.',
  },
  {
    icon: '🔒',
    title: 'JWT-Secured Accounts',
    description:
      'Every API call is protected with JSON Web Tokens, role-based access control enforced on both server and client, and bcrypt-hashed passwords.',
  },
  {
    icon: '📍',
    title: 'Location-Based Matching',
    description:
      'Every project includes a city field so local contractors can discover relevant work in their area and homeowners get nearby talent.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Updates',
    description:
      'Proposal counts, project statuses, and contractor verifications reflect instantly — no stale data, no manual refresh needed.',
  },
];

const HOMEOWNER_STEPS = [
  {
    number: 1,
    icon: '📝',
    title: 'Create a free account',
    description: 'Register as a Homeowner in under 60 seconds.',
    detail: 'Fill in your name, email, and a secure password. Your account is ready immediately — no email confirmation wait.',
    accent: 'orange',
  },
  {
    number: 2,
    icon: '🏠',
    title: 'Post a renovation project',
    description: 'Add a title, full description, budget range, and city.',
    detail: 'Be as specific as possible — detailed projects attract more relevant bids from qualified contractors in your area.',
    accent: 'blue',
  },
  {
    number: 3,
    icon: '📨',
    title: 'Review incoming proposals',
    description: 'Each contractor bid shows their quoted price and a personal message.',
    detail: 'Compare proposals side by side. Check price, read their message, and decide who fits your project vision best.',
    accent: 'green',
  },
  {
    number: 4,
    icon: '🎉',
    title: 'Accept the best bid',
    description: 'One click accepts the winning proposal.',
    detail: 'Once accepted, your project status updates to "In Progress" and the contractor is notified. All other bids are automatically closed.',
    accent: 'purple',
  },
];

const CONTRACTOR_STEPS = [
  {
    number: 1,
    icon: '🔨',
    title: 'Register as a Contractor',
    description: 'Create your contractor account with your professional details.',
    detail: 'An admin verifies your contractor status to ensure only qualified professionals are visible to homeowners on the platform.',
    accent: 'orange',
  },
  {
    number: 2,
    icon: '🔍',
    title: 'Browse open projects',
    description: 'Explore all available projects posted by homeowners.',
    detail: 'Filter by budget range, location, or keyword. Find jobs that match your skills, schedule, and preferred work area.',
    accent: 'blue',
  },
  {
    number: 3,
    icon: '💼',
    title: 'Submit a proposal',
    description: 'Set your quoted price and write a compelling cover message.',
    detail: "Explain your approach, relevant experience, and why you're the best fit. Stand out from the competition with a personalized pitch.",
    accent: 'green',
  },
  {
    number: 4,
    icon: '🏆',
    title: 'Win the project',
    description: 'If the homeowner accepts your bid, the job is yours.',
    detail: "Track all your active and past proposals in \"My Proposals\". Withdraw bids you're no longer interested in at any time.",
    accent: 'purple',
  },
];

const STATS = [
  { value: '500+',   label: 'Active Projects' },
  { value: '1,200+', label: 'Verified Contractors' },
  { value: '$4.2M',  label: 'Project Value Matched' },
  { value: '98%',    label: 'Client Satisfaction' },
];

const TRUST_BADGES = [
  { icon: '🔐', value: 'JWT Auth',        label: 'Secure token authentication' },
  { icon: '🛡️', value: 'Role-Based',      label: 'Homeowner · Contractor · Admin' },
  { icon: '🐘', value: 'PostgreSQL',      label: 'Relational database backend' },
  { icon: '☁️', value: 'Cloud Deployed',  label: 'Live on Render infrastructure' },
  { icon: '⚛️', value: 'React 18',        label: 'Modern frontend SPA' },
  { icon: '🚀', value: 'REST API',         label: 'Express.js with full CRUD' },
];

/* ── Page Component ── */

export default function HomePage() {
  const { navigate } = useNav();

  return (
    <div className="home-page">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Canada's #1 Renovation Marketplace
        </div>

        <h1 className="hero-title">
          Connect Homeowners<br />
          with <span className="hero-accent">Trusted Contractors</span>
        </h1>

        <p className="hero-subtitle">
          Post your renovation project, receive competitive proposals from
          verified local contractors, and get your dream home built —
          faster and smarter with Buildora.
        </p>

        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={() => navigate('register')}>
            Get Started Free →
          </button>
          <button className="hero-btn-secondary" onClick={() => navigate('login')}>
            Sign In
          </button>
        </div>

        <div className="hero-stats">
          {STATS.map((s) => (
            <div key={s.label} className="hero-stat">
              <span className="hero-stat-value">{s.value}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="section container">
        <div className="section-header">
          <span className="section-eyebrow">Platform Features</span>
          <h2 className="section-title">Everything you need to renovate smarter</h2>
          <p className="section-subtitle">
            Built from the ground up with React 18, Node.js, Express, and PostgreSQL
            for homeowners and contractors alike.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-title">From idea to construction in four steps</h2>
            <p className="section-subtitle">
              Two types of users, one seamless workflow. Buildora bridges homeowners
              and contractors with a transparent, proposal-driven marketplace.
            </p>
          </div>

          <div className="how-grid">
            {/* Homeowner flow */}
            <div className="how-column">
              <div className="how-column-header">
                <div className="how-column-icon how-column-icon--orange">🏠</div>
                <div>
                  <div className="how-column-title">For Homeowners</div>
                  <div className="how-column-subtitle">Post a project, pick the best contractor</div>
                </div>
              </div>
              <div className="steps-list">
                {HOMEOWNER_STEPS.map((s) => (
                  <StepItem key={s.number} {...s} />
                ))}
              </div>
              <div className="how-column-cta">
                <button className="how-cta-btn how-cta-btn--orange" onClick={() => navigate('register')}>
                  Post a Project →
                </button>
              </div>
            </div>

            {/* Contractor flow */}
            <div className="how-column">
              <div className="how-column-header">
                <div className="how-column-icon how-column-icon--blue">🔨</div>
                <div>
                  <div className="how-column-title">For Contractors</div>
                  <div className="how-column-subtitle">Browse jobs, submit proposals, win work</div>
                </div>
              </div>
              <div className="steps-list">
                {CONTRACTOR_STEPS.map((s) => (
                  <StepItem key={s.number} {...s} />
                ))}
              </div>
              <div className="how-column-cta">
                <button className="how-cta-btn how-cta-btn--blue" onClick={() => navigate('register')}>
                  Find Projects →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Strip ── */}
      <section className="tech-strip">
        <div className="container">
          <p className="tech-strip-label">Powered by</p>
          <div className="tech-strip-items">
            {TRUST_BADGES.map((b) => (
              <div key={b.value} className="tech-strip-item">
                <span className="tech-strip-icon">{b.icon}</span>
                <span className="tech-strip-name">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner container">
        <div className="cta-inner">
          <div className="cta-eyebrow">Free to join</div>
          <h2 className="cta-title">Ready to start your renovation?</h2>
          <p className="cta-subtitle">
            Join thousands of homeowners who found their perfect contractor on Buildora.
            No listing fees, no commissions — just results.
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
