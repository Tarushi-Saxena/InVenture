import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('inventure_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('inventure_user')) || null);
  
  // Navigation / View State
  const [showPortal, setShowPortal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // App workspace states
  const [startups, setStartups] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [preferences, setPreferences] = useState({ industry: 'Any', stage: 'Any', minCapital: 0, maxCapital: 10000000 });
  const [shortlists, setShortlists] = useState({ shortlisted: [], interested: [] });
  
  // Admin stats
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);

  // Auth fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('founder');

  // Runway inputs
  const [runwayCash, setRunwayCash] = useState(250000);
  const [runwayRev, setRunwayRev] = useState(10000);
  const [runwayExp, setRunwayExp] = useState(40000);
  const [runwayTarget, setRunwayTarget] = useState(12);
  const [runwayResult, setRunwayResult] = useState(null);

  // Dilution inputs
  const [preMoneyValuation, setPreMoneyValuation] = useState(8000000);
  const [investmentAmount, setInvestmentAmount] = useState(2000000);
  const [optionPoolPercent, setOptionPoolPercent] = useState(10);
  const [optionPoolTiming, setOptionPoolTiming] = useState('pre-money');
  const [activeCapTable, setActiveCapTable] = useState([]);
  const [activeSafes, setActiveSafes] = useState([]);
  const [dilutionResult, setDilutionResult] = useState(null);

  // --- UNIT ECONOMICS MODELER ---
  const [cacSpent, setCacSpent] = useState(5000);
  const [cacAcquired, setCacAcquired] = useState(100);
  const [ltvArpu, setLtvArpu] = useState(80);
  const [ltvChurn, setLtvChurn] = useState(5);

  // Chart refs
  const preChartRef = useRef(null);
  const postChartRef = useRef(null);
  const adminChartRef = useRef(null);
  const preChartInstance = useRef(null);
  const postChartInstance = useRef(null);
  const adminChartInstance = useRef(null);

  // Fetch headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Sync token and user
  useEffect(() => {
    if (token) {
      localStorage.setItem('inventure_token', token);
      localStorage.setItem('inventure_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('inventure_token');
      localStorage.removeItem('inventure_user');
    }
  }, [token, user]);

  // Set default view on login
  useEffect(() => {
    if (user) {
      if (user.role === 'founder') {
        setActiveTab('my-startups');
      } else if (user.role === 'investor') {
        setActiveTab('deal-flow');
      } else if (user.role === 'admin') {
        setActiveTab('admin-dashboard');
      }
    }
  }, [user]);

  // Load active tab data
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'my-startups' || activeTab === 'calculators' || activeTab === 'deal-flow') {
      fetchStartups();
    }
    if (activeTab === 'deal-flow') {
      fetchPreferences();
      fetchShortlists();
    }
    if (activeTab === 'shortlist') {
      fetchShortlists();
      fetchStartups();
    }
    if (activeTab === 'preferences') {
      fetchPreferences();
    }
    if (activeTab === 'admin-dashboard') {
      fetchAdminMetrics();
    }
    if (activeTab === 'admin-startups') {
      fetchStartups();
    }
    if (activeTab === 'admin-users') {
      fetchAdminUsers();
    }
  }, [activeTab, token]);

  const fetchStartups = async () => {
    try {
      const res = await fetch('/api/startups', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setStartups(data);
        if (data.length > 0) {
          const st = data[0];
          setRunwayCash(st.cash);
          setRunwayRev(st.revenue);
          setRunwayExp(st.expenses);
          setActiveCapTable(st.capTable || []);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/preferences', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setPreferences(data);
    } catch (e) { console.error(e); }
  };

  const fetchShortlists = async () => {
    try {
      const res = await fetch('/api/shortlists', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setShortlists(data);
    } catch (e) { console.error(e); }
  };

  const fetchAdminMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setAdminMetrics(data);
    } catch (e) { console.error(e); }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setAdminUsers(data);
    } catch (e) { console.error(e); }
  };

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
      } else {
        alert(data.message || 'Login failed.');
      }
    } catch (err) {
      alert('Error connecting to backend server.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registration successful! Please log in.');
        setAuthMode('login');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error registering user.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    setShowPortal(false);
  };

  // Runway Live Calculations
  useEffect(() => {
    if (!token) return;
    const calculateLiveRunway = async () => {
      try {
        const res = await fetch('/api/calculators/runway', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ cash: runwayCash, revenue: runwayRev, expenses: runwayExp, desiredRunway: runwayTarget })
        });
        const data = await res.json();
        if (res.ok) setRunwayResult(data);
      } catch (err) { console.error(err); }
    };
    calculateLiveRunway();
  }, [runwayCash, runwayRev, runwayExp, runwayTarget, token]);

  // Modeler Calculations
  const runDilutionModeling = async () => {
    if (startups.length === 0) return;
    const stId = startups[0].id;
    try {
      await fetch(`/api/startups/${stId}/cap-table`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ capTable: activeCapTable })
      });

      const res = await fetch(`/api/startups/${stId}/model-round`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          preMoneyValuation,
          investmentAmount,
          optionPoolPercent,
          optionPoolTiming,
          safes: activeSafes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDilutionResult(data);
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  // Render Modeler Pie Charts
  useEffect(() => {
    if (!dilutionResult) return;

    if (preChartInstance.current) preChartInstance.current.destroy();
    const ctxPre = preChartRef.current.getContext('2d');
    preChartInstance.current = new Chart(ctxPre, {
      type: 'doughnut',
      data: {
        labels: dilutionResult.beforeRound.map(x => x.name),
        datasets: [{
          data: dilutionResult.beforeRound.map(x => x.percent),
          backgroundColor: ['#0284c7', '#0f766e', '#10b981', '#f59e0b', '#6366f1', '#ec4899']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    if (postChartInstance.current) postChartInstance.current.destroy();
    const ctxPost = postChartRef.current.getContext('2d');
    postChartInstance.current = new Chart(ctxPost, {
      type: 'doughnut',
      data: {
        labels: dilutionResult.afterRound.map(x => x.name),
        datasets: [{
          data: dilutionResult.afterRound.map(x => x.percent),
          backgroundColor: ['#0284c7', '#0f766e', '#10b981', '#f59e0b', '#6366f1', '#ec4899']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }, [dilutionResult]);

  // Render Admin Bar Chart
  useEffect(() => {
    if (activeTab !== 'admin-dashboard' || !adminMetrics) return;

    if (adminChartInstance.current) adminChartInstance.current.destroy();
    const ctx = adminChartRef.current.getContext('2d');

    const labels = (adminMetrics.stages || []).map(s => s.stage);
    const counts = (adminMetrics.stages || []).map(s => s.count);

    adminChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Idea', 'MVP'],
        datasets: [{
          label: 'Startups Count',
          data: counts.length > 0 ? counts : [0, 0],
          backgroundColor: '#0ea5e9',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }, [adminMetrics, activeTab]);

  // UI Navigation Sidebar Tabs
  const getSidebarTabs = () => {
    if (user.role === 'founder') {
      return [
        { id: 'my-startups', label: 'My Startups' },
        { id: 'calculators', label: 'Financial Modeling' },
        { id: 'budget-metrics', label: 'Budget & Metrics' }
      ];
    } else if (user.role === 'investor') {
      return [
        { id: 'deal-flow', label: 'Matchmaker Engine' },
        { id: 'shortlist', label: 'Shortlist WATCH' },
        { id: 'preferences', label: 'Mandate Preference' }
      ];
    } else {
      return [
        { id: 'admin-dashboard', label: 'Ecosystem Health' },
        { id: 'admin-startups', label: 'Cohort Registry' },
        { id: 'admin-users', label: 'Ecosystem Users' }
      ];
    }
  };

  // Unit Economics Calculator Helpers
  const computedCac = cacAcquired > 0 ? (cacSpent / cacAcquired).toFixed(2) : 0;
  const computedLtv = ltvChurn > 0 ? (ltvArpu / (ltvChurn / 100)).toFixed(2) : 0;
  const computedRatio = computedCac > 0 ? (computedLtv / computedCac).toFixed(1) : 0;

  // 1. SAAS LANDING PAGE
  if (!token && !showPortal) {
    return (
      <div className="landing-wrapper" style={{ backgroundColor: '#f8fafc' }}>
        <header className="landing-nav">
          <div className="nav-brand">In<span>Venture</span></div>
          <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
            <span>Cap Table Modeler</span>
            <span>Runway Ratios</span>
            <span>Incubator Cohorts</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => { setShowPortal(true); setAuthMode('login'); }}>Sign In</button>
            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => { setShowPortal(true); setAuthMode('register'); }}>Create Free Account</button>
          </div>
        </header>

        <section className="hero-section">
          <div style={{ paddingRight: '40px' }}>
            <div className="hero-tag" style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0f766e' }}>Enterprise Platform</div>
            <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.15', color: '#0f172a', marginBottom: '24px', letterSpacing: '-1.5px' }}>
              The Operating System for Startup Equity.
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
              Manage cap tables, model complex priced rounds, audit option pool top-up metrics, and connect with venture syndicate partners. Everything pre-built to keep your cohort aligned.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => setShowPortal(true)}>Start Sandbox Tour</button>
              <button className="btn btn-secondary" style={{ padding: '12px 24px' }} onClick={() => setShowPortal(true)}>Model a Round</button>
            </div>
          </div>

          <div className="hero-visual">
            <div style={{ width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>GreenHarvest (Series A Round)</strong>
                <span className="badge badge-success" style={{ fontSize: '10px' }}>Active Simulation</span>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Post-Money Valuation</span>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>$10,000,000</div>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Investor Share</span>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f766e', marginTop: '4px' }}>20.00%</div>
                  </div>
                </div>
                <table style={{ fontSize: '12px', width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Stakeholder</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Shares</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px' }}>Ananya Sharma (Founder)</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>600,000</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>48.00%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px' }}>New Investor</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>250,000</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>20.00%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-card">
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Cap Table Modeling</h3>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
              Model priced funding rounds including pre/post option pool carve-outs and SAFE/Note triggers.
            </p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚡</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Financial Runway Forecasts</h3>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
              Calculate burn rates and runway metrics directly linked to institutional registry profiles.
            </p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>🤝</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Investor Pipeline Match</h3>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
              Score venture matches based on sector preferences, staging ranges, and check sizes.
            </p>
          </div>
        </section>

        <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '40px 80px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <span>&copy; 2026 InVenture Inc. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Security</span>
            <span>API Docs</span>
            <span>System Status</span>
          </div>
        </footer>
      </div>
    );
  }

  // 2. PORTAL SIGN-IN CARD
  if (!token) {
    return (
      <div className="landing-wrapper" style={{ backgroundColor: '#f8fafc' }}>
        <header className="landing-nav">
          <div className="nav-brand" onClick={() => setShowPortal(false)}>In<span>Venture</span></div>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Authentication Workspace</span>
        </header>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-tabs">
              <div className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Access Account</div>
              <div className={`auth-tab ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>Register Account</div>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group mb-20">
                  <label>Institutional Email</label>
                  <input type="email" placeholder="name@organization.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group mb-20">
                  <label>Security Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', fontWeight: '600' }}>Secure Login</button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group mb-20">
                  <label>Full Name</label>
                  <input type="text" placeholder="Amit Kumar" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group mb-20">
                  <label>Institutional Email</label>
                  <input type="email" placeholder="name@organization.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group mb-20">
                  <label>Password</label>
                  <input type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="form-group mb-20">
                  <label>Account Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)}>
                    <option value="founder">Founder (Add Startup / Model Round)</option>
                    <option value="investor">Investor (Filter & Match Pipeline)</option>
                    <option value="admin">Ecosystem Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', fontWeight: '600' }}>Provision Account</button>
              </form>
            )}

            <div className="demo-accounts">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong>System Demo Access (Click to prefill):</strong>
                <span style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }} onClick={() => setShowPortal(false)}>&larr; Back to Home</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li className="demo-account-item" onClick={() => { setEmail('admin@incubator.com'); setPassword('password123'); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <span className="badge badge-info">Admin</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>admin@incubator.com</span>
                </li>
                <li className="demo-account-item" onClick={() => { setEmail('ananya@startup.com'); setPassword('password123'); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <span className="badge badge-success">Founder</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>ananya@startup.com</span>
                </li>
                <li className="demo-account-item" onClick={() => { setEmail('priya@invest.com'); setPassword('password123'); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <span className="badge badge-warning">Investor</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>priya@invest.com</span>
                </li>
              </ul>
              <div style={{ fontSize: '11px', marginTop: '8px', color: '#94a3b8' }}>Password for all profiles: <strong>password123</strong></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. WORKSPACE DASHBOARDS (WITH TOP HORIZONTAL NAVIGATION TABS)
  return (
    <div className="app-shell">
      
      {/* Top App Header with Horizontal Tabs */}
      <header className="app-header">
        <div className="nav-brand" onClick={handleLogout}>In<span>Venture</span></div>
        
        {/* Horizontal Navigation Links */}
        <div className="nav-tabs">
          {getSidebarTabs().map(tab => (
            <a key={tab.id} className={`nav-tab-link ${activeTab === tab.id ? 'active' : ''}`} onClick={() => { setSelectedStartup(null); setActiveTab(tab.id); }}>
              {tab.label}
            </a>
          ))}
        </div>

        {/* User Stats & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bright)' }}>{user.name}</div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.role}</div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleLogout}>Disconnect</button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-layout">
        <main className="main-content">
          
          {/* ==============================================
               FOUNDER VIEW: MY STARTUPS
               ============================================== */}
          {activeTab === 'my-startups' && !selectedStartup && (
            <div>
              {startups.length === 0 ? (
                <div className="form-card" style={{ textAlign: 'center', padding: '60px' }}>
                  <h3 style={{ marginBottom: '12px' }}>No Incubated Startups Found</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Launch a startup profile to access runway calculative boards.</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('add-startup')}>Register Startup</button>
                </div>
              ) : (
                startups.map(st => (
                  <div key={st.id} className="form-card mb-20">
                    <div className="flex-between mb-20" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div>
                        <h3>{st.name}</h3>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Sector: {st.industry} &middot; Stage: {st.stage}</div>
                      </div>
                      <span className={`badge ${st.at_risk ? 'badge-danger' : 'badge-success'}`}>{st.at_risk ? 'At Risk' : 'Healthy'}</span>
                    </div>
                    <p style={{ fontSize: '14px', marginBottom: '20px' }}>{st.description}</p>
                    
                    <div className="stats-grid">
                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div className="stat-label">Active Cash</div>
                        <div className="stat-value">${parseFloat(st.cash).toLocaleString()}</div>
                      </div>
                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div className="stat-label">Projected Revenue</div>
                        <div className="stat-value">${parseFloat(st.revenue).toLocaleString()}</div>
                      </div>
                      <div className="stat-card" style={{ padding: '16px' }}>
                        <div className="stat-label">Operating Expenses</div>
                        <div className="stat-value">${parseFloat(st.expenses).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==============================================
               FOUNDER VIEW: LAUNCH VENTURE (ADD STARTUP)
               ============================================== */}
          {activeTab === 'add-startup' && (
            <div className="form-card">
              <div className="section-header"><div className="section-title">Incubator Startup Registry</div></div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const body = {
                  name: form.stName.value,
                  industry: form.stIndustry.value,
                  stage: form.stStage.value,
                  fundingNeeded: form.stFunding.value,
                  description: form.stDesc.value,
                  cash: form.stCash.value,
                  revenue: form.stRevenue.value,
                  expenses: form.stExpenses.value
                };

                const res = await fetch('/api/startups', {
                  method: 'POST',
                  headers: getHeaders(),
                  body: JSON.stringify(body)
                });
                if (res.ok) {
                  alert('Startup profile logged.');
                  fetchStartups();
                  setActiveTab('my-startups');
                } else {
                  alert('Submission failed.');
                }
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Venture Legal Name</label>
                    <input type="text" name="stName" placeholder="GreenHarvest Inc" required />
                  </div>
                  <div className="form-group">
                    <label>Sector / Industry</label>
                    <select name="stIndustry">
                      <option value="AgriTech">AgriTech</option>
                      <option value="GovTech">GovTech</option>
                      <option value="EdTech">EdTech</option>
                      <option value="FinTech">FinTech</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Current Stage</label>
                    <select name="stStage">
                      <option value="Idea">Idea / Concept</option>
                      <option value="MVP">Minimum Viable Product (MVP)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Capital Required ($)</label>
                    <input type="number" name="stFunding" placeholder="1500000" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Executive Description</label>
                    <textarea name="stDesc" rows="3" required></textarea>
                  </div>
                  <div className="form-group">
                    <label>Liquid Cash Balance ($)</label>
                    <input type="number" name="stCash" defaultValue="200000" required />
                  </div>
                  <div className="form-group">
                    <label>Monthly Revenue ($)</label>
                    <input type="number" name="stRevenue" defaultValue="5000" required />
                  </div>
                  <div className="form-group">
                    <label>Operating Monthly Expenses ($)</label>
                    <input type="number" name="stExpenses" defaultValue="35000" required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Register Cohort Profile</button>
              </form>
            </div>
          )}

          {/* ==============================================
               FOUNDER VIEW: CALCULATORS (CAP TABLE & RUNWAY)
               ============================================== */}
          {activeTab === 'calculators' && (
            <div className="modeler-grid">
              <div>
                <div className="calc-section">
                  <div className="calc-title">Ecosystem Runway Modeler</div>
                  <div className="form-group mb-20">
                    <label>Liquid Cash Balance ($)</label>
                    <input type="number" value={runwayCash} onChange={e => setRunwayCash(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-grid mb-20">
                    <div className="form-group">
                      <label>Monthly Revenue ($)</label>
                      <input type="number" value={runwayRev} onChange={e => setRunwayRev(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label>Monthly Expenses ($)</label>
                      <input type="number" value={runwayExp} onChange={e => setRunwayExp(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="form-group mb-20">
                    <label>Target Months</label>
                    <input type="number" value={runwayTarget} onChange={e => setRunwayTarget(parseInt(e.target.value) || 12)} />
                  </div>
                  {runwayResult && (
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '4px' }}>
                      <div className="flex-between mb-20">
                        <span>Net Burn:</span> <strong>${runwayResult.monthlyBurnRate.toLocaleString()}</strong>
                      </div>
                      <div className="flex-between mb-20">
                        <span>Available Runway:</span> <strong style={{ color: 'var(--accent)' }}>{runwayResult.monthsOfRunway} Months</strong>
                      </div>
                      <div className="flex-between">
                        <span>Runway Target Funding Gap:</span> <strong>${runwayResult.fundingNeeded.toLocaleString()}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="calc-section">
                  <div className="calc-title">Equity Dilution Modeler</div>
                  <div className="form-grid mb-20">
                    <div className="form-group">
                      <label>Pre-Money Valuation ($)</label>
                      <input type="number" value={preMoneyValuation} onChange={e => setPreMoneyValuation(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label>Investment Size ($)</label>
                      <input type="number" value={investmentAmount} onChange={e => setInvestmentAmount(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="form-grid mb-20">
                    <div className="form-group">
                      <label>Option Pool Target (%)</label>
                      <input type="number" value={optionPoolPercent} onChange={e => setOptionPoolPercent(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label>Option Pool Timing</label>
                      <select value={optionPoolTiming} onChange={e => setOptionPoolTiming(e.target.value)}>
                        <option value="pre-money">Pre-Money Top-Up (Dilutes Founders)</option>
                        <option value="post-money">Post-Money Top-Up (Dilutes All)</option>
                      </select>
                    </div>
                  </div>

                  <div className="calc-title" style={{ fontSize: '13px' }}>Convertible Notes / SAFEs</div>
                  {activeSafes.map((safe, index) => (
                    <div key={index} style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', marginBottom: '10px', backgroundColor: '#f8fafc' }}>
                      <div className="flex-between mb-20">
                        <input type="text" value={safe.name} onChange={e => {
                          const copy = [...activeSafes];
                          copy[index].name = e.target.value;
                          setActiveSafes(copy);
                        }} style={{ border: 'none', background: 'transparent', fontWeight: 'bold', color: '#000' }} />
                        <button className="btn btn-danger btn-sm" onClick={() => setActiveSafes(activeSafes.filter((_, i) => i !== index))}>Delete</button>
                      </div>
                      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '11px' }}>Invested ($)</label>
                          <input type="number" value={safe.investment} onChange={e => {
                            const copy = [...activeSafes];
                            copy[index].investment = parseFloat(e.target.value) || 0;
                            setActiveSafes(copy);
                          }} style={{ padding: '4px' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '11px' }}>Cap ($)</label>
                          <input type="number" value={safe.cap} onChange={e => {
                            const copy = [...activeSafes];
                            copy[index].cap = parseFloat(e.target.value) || 0;
                            setActiveSafes(copy);
                          }} style={{ padding: '4px' }} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '11px' }}>Discount (%)</label>
                          <input type="number" value={safe.discount} onChange={e => {
                            const copy = [...activeSafes];
                            copy[index].discount = parseFloat(e.target.value) || 0;
                            setActiveSafes(copy);
                          }} style={{ padding: '4px' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-sm mb-20" onClick={() => setActiveSafes([...activeSafes, { name: `SAFE Note Series ${activeSafes.length + 1}`, investment: 100000, cap: 5000000, discount: 20 }])}>+ Add Note</button>

                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={runDilutionModeling}>Calculate Dilution Round</button>
                </div>
              </div>

              <div>
                <div className="calc-section">
                  <div className="calc-title">Current Shareholders Registry</div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Shareholder</th>
                          <th className="text-right">Shares Held</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCapTable.map((sh, index) => (
                          <tr key={index}>
                            <td>
                              <input type="text" value={sh.name} onChange={e => {
                                const copy = [...activeCapTable];
                                copy[index].name = e.target.value;
                                setActiveCapTable(copy);
                              }} style={{ border: 'none', width: '100%', fontWeight: '500', background: 'transparent', color: '#000' }} />
                            </td>
                            <td>
                              <input type="number" value={sh.shares} onChange={e => {
                                const copy = [...activeCapTable];
                                copy[index].shares = parseInt(e.target.value) || 0;
                                setActiveCapTable(copy);
                              }} style={{ border: 'none', width: '100%', textAlign: 'right', fontWeight: '500', background: 'transparent', color: '#000' }} />
                            </td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => setActiveCapTable(activeCapTable.filter((_, i) => i !== index))}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveCapTable([...activeCapTable, { name: 'New Stakeholder', shares: 100000, isFounder: false }])}>+ Add Stakeholder</button>
                </div>

                {dilutionResult && (
                  <div className="calc-section">
                    <div className="calc-title" style={{ color: 'var(--accent)' }}>Dilution Modeling Output</div>
                    <div className="stats-grid" style={{ marginBottom: '20px' }}>
                      <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-label">Post-Money Value</div>
                        <div className="stat-value" style={{ fontSize: '18px' }}>${dilutionResult.postMoneyValuation.toLocaleString()}</div>
                      </div>
                      <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-label">Share Price</div>
                        <div className="stat-value" style={{ fontSize: '18px' }}>${dilutionResult.postRoundSharePrice.toFixed(4)}</div>
                      </div>
                    </div>

                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Shareholder</th>
                            <th className="text-right">Shares Post-Round</th>
                            <th className="text-right" style={{ color: 'var(--accent)' }}>Post-Round %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dilutionResult.afterRound.map((m, index) => (
                            <tr key={index}>
                              <td style={{ fontWeight: '500' }}>{m.name}</td>
                              <td className="text-right">{Math.round(m.shares).toLocaleString()}</td>
                              <td className="text-right" style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{m.percent.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="charts-comparison">
                      <div className="chart-wrapper">
                        <strong>Pre-Round ownership</strong>
                        <div className="chart-canvas-container"><canvas ref={preChartRef}></canvas></div>
                      </div>
                      <div className="chart-wrapper">
                        <strong>Post-Round Dilution</strong>
                        <div className="chart-canvas-container"><canvas ref={postChartRef}></canvas></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================
               FOUNDER VIEW: BUDGET & UNIT ECONOMICS
               ============================================== */}
          {activeTab === 'budget-metrics' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
              <div className="calc-section">
                <div className="calc-title">CAC & LTV Modeler</div>
                <div className="form-group mb-20">
                  <label>Total Marketing Ad Spend ($)</label>
                  <input type="number" value={cacSpent} onChange={e => setCacSpent(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-group mb-20">
                  <label>Customers Acquired (Monthly)</label>
                  <input type="number" value={cacAcquired} onChange={e => setCacAcquired(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-grid mb-20">
                  <div className="form-group">
                    <label>ARPU / Monthly Yield ($)</label>
                    <input type="number" value={ltvArpu} onChange={e => setLtvArpu(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label>Monthly Churn Rate (%)</label>
                    <input type="number" value={ltvChurn} onChange={e => setLtvChurn(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '4px', marginTop: '20px' }}>
                  <div className="flex-between mb-20">
                    <span>Customer Acquisition Cost (CAC):</span> <strong>${computedCac}</strong>
                  </div>
                  <div className="flex-between mb-20">
                    <span>Lifetime Value (LTV):</span> <strong>${computedLtv}</strong>
                  </div>
                  <div className="flex-between">
                    <span>LTV : CAC Ratio:</span> 
                    <strong style={{ color: computedRatio >= 3 ? 'var(--success)' : 'var(--danger)' }}>
                      {computedRatio}x {computedRatio >= 3 ? '(Healthy)' : '(Low margins)'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="calc-section">
                <div className="calc-title">Seed Budget Planner</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div className="flex-between" style={{ fontSize: '13px', marginBottom: '6px' }}>
                      <strong>Product Engineering (R&D)</strong>
                      <span>50%</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '50%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex-between" style={{ fontSize: '13px', marginBottom: '6px' }}>
                      <strong>Marketing & Sales (CAC)</strong>
                      <span>30%</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '30%', background: 'var(--accent)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex-between" style={{ fontSize: '13px', marginBottom: '6px' }}>
                      <strong>Operations & Overhead</strong>
                      <span>15%</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '15%', background: 'var(--warning)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex-between" style={{ fontSize: '13px', marginBottom: '6px' }}>
                      <strong>Legal & IP Filing</strong>
                      <span>5%</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '5%', background: 'var(--danger)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               INVESTOR VIEW: MATCHMAKING
               ============================================== */}
          {activeTab === 'deal-flow' && !selectedStartup && (
            <div>
              <div className="section-header"><div className="section-title">Mandate Deal Pipeline</div></div>
              <div className="deal-flow-grid">
                {startups.map(st => (
                  <div key={st.id} className="deal-card high-match">
                    <div className="deal-header">
                      <div>
                        <h4 className="deal-title">{st.name}</h4>
                        <div className="deal-meta-row" style={{ marginTop: '4px' }}>
                          <span>Sector: {st.industry}</span> &middot; <span>Target Ask: ${parseFloat(st.funding_needed).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <p className="deal-desc">{st.description}</p>
                    <div className="deal-actions">
                      <button className="btn btn-primary btn-sm" onClick={async () => {
                        setSelectedStartup(st);
                        try {
                          const res = await fetch(`/api/startups/${st.id}/feedbacks`, { headers: getHeaders() });
                          const fbs = await res.json();
                          if (res.ok) setFeedbacks(fbs);
                        } catch (err) { console.error(err); }
                      }}>Due Diligence info</button>
                      <button className="btn btn-secondary btn-sm" onClick={async () => {
                        await fetch('/api/shortlists', {
                          method: 'POST',
                          headers: getHeaders(),
                          body: JSON.stringify({ startupId: st.id, type: 'shortlisted' })
                        });
                        alert('Watchlist status updated.');
                      }}>Shortlist</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================
               INVESTOR VIEW: STARTUP DETAILED REVIEW
               ============================================== */}
          {selectedStartup && (
            <div className="detail-view">
              <a className="detail-nav-back" onClick={() => setSelectedStartup(null)}>&larr; Back to Pipeline</a>
              <div className="detail-header">
                <h2>{selectedStartup.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Maturity stage: {selectedStartup.stage} &middot; Sector: {selectedStartup.industry}</p>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Executive Summary</h3>
                  <p style={{ fontSize: '14px', marginBottom: '20px' }}>{selectedStartup.description}</p>

                  <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Existing Cap Table</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Stakeholder</th>
                          <th className="text-right">Shares Held</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedStartup.capTable || []).map((sh, idx) => (
                          <tr key={idx}>
                            <td>{sh.name}</td>
                            <td className="text-right">{sh.shares.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '4px' }}>
                  <h4>FINANCIAL SUMMARY</h4>
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>INCUBATION ASK</span>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent)' }}>${parseFloat(selectedStartup.funding_needed).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACTIVE CASH RUNWAY</span>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>${parseFloat(selectedStartup.cash).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3>Pitch Reviews & Evaluations</h3>
                <div className="form-card mb-20" style={{ backgroundColor: '#f8fafc', marginTop: '15px' }}>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const body = {
                      rating: e.target.fbRating.value,
                      category: e.target.fbCategory.value,
                      comment: e.target.fbComment.value
                    };
                    const res = await fetch(`/api/startups/${selectedStartup.id}/feedbacks`, {
                      method: 'POST',
                      headers: getHeaders(),
                      body: JSON.stringify(body)
                    });
                    if (res.ok) {
                      alert('Pitch note submitted.');
                      const fRes = await fetch(`/api/startups/${selectedStartup.id}/feedbacks`, { headers: getHeaders() });
                      const fbsData = await fRes.json();
                      setFeedbacks(fbsData);
                      e.target.reset();
                    }
                  }}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div className="form-group">
                        <label>Rating Score (1-5)</label>
                        <select name="fbRating">
                          <option value="5">5 - Exceptional</option>
                          <option value="4">4 - Strong Buy</option>
                          <option value="3">3 - Hold</option>
                          <option value="2">2 - High Risk</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Category Focus</label>
                        <select name="fbCategory">
                          <option value="Product">Product Tech</option>
                          <option value="Market">Market Opportunity</option>
                          <option value="Team">Leadership Team</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group mb-20">
                      <label>Comment Memo</label>
                      <textarea name="fbComment" rows="3" required></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">Add Evaluation Note</button>
                  </form>
                </div>

                <div>
                  {feedbacks.map((fb, idx) => (
                    <div key={idx} className="feedback-item">
                      <div className="feedback-meta">
                        <span><strong>{fb.author}</strong> &middot; {fb.category} Category</span>
                        <strong style={{ color: 'var(--warning)' }}>&#9733; {fb.rating}/5</strong>
                      </div>
                      <p style={{ fontSize: '13px', fontStyle: 'italic' }}>"{fb.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               INVESTOR VIEW: MANDATE PREFERENCES
               ============================================== */}
          {activeTab === 'preferences' && (
            <div className="form-card">
              <div className="section-header"><div className="section-title">Institutional Mandate preferences</div></div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const body = {
                  industry: e.target.pInd.value,
                  stage: e.target.pStg.value,
                  minCapital: e.target.pMin.value,
                  maxCapital: e.target.pMax.value
                };
                const res = await fetch('/api/preferences', {
                  method: 'PUT',
                  headers: getHeaders(),
                  body: JSON.stringify(body)
                });
                if (res.ok) alert('mandate updated.');
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Preferred Industry</label>
                    <select name="pInd" defaultValue={preferences.industry}>
                      <option value="Any">Any Sector</option>
                      <option value="AgriTech">AgriTech</option>
                      <option value="GovTech">GovTech</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Preferred Stage</label>
                    <select name="pStg" defaultValue={preferences.stage}>
                      <option value="Any">Any Stage</option>
                      <option value="Idea">Idea</option>
                      <option value="MVP">MVP</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Min Capital Deal ($)</label>
                    <input type="number" name="pMin" defaultValue={preferences.minCapital} />
                  </div>
                  <div className="form-group">
                    <label>Max Capital Deal ($)</label>
                    <input type="number" name="pMax" defaultValue={preferences.maxCapital} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Update mandate</button>
              </form>
            </div>
          )}

          {/* ==============================================
               INVESTOR VIEW: SHORTLIST
               ============================================== */}
          {activeTab === 'shortlist' && (
            <div>
              <div className="section-header"><div className="section-title">Priority Watchlist Board</div></div>
              <h3 style={{ marginBottom: '15px' }}>Shortlisted Deal Rooms</h3>
              <div className="deal-flow-grid">
                {(shortlists.shortlisted || []).map(b => (
                  <div key={b.id} className="deal-card" style={{ borderLeftColor: 'var(--accent)' }}>
                    <div className="deal-header"><h4>{b.name}</h4></div>
                    <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSelectedStartup(b)}>Review Due Diligence</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================
               ADMIN VIEW: DASHBOARD & HEALTH
               ============================================== */}
          {activeTab === 'admin-dashboard' && adminMetrics && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Active Startups</div>
                  <div className="stat-value">{adminMetrics.total}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Urgent Care (At Risk)</div>
                  <div className="stat-value danger">{adminMetrics.risk}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Ecosystem Average Progress</div>
                  <div className="stat-value warning">{adminMetrics.progress}%</div>
                </div>
              </div>

              <div className="modeler-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                <div className="calc-section">
                  <div className="calc-title">Cohort Distribution by Stage</div>
                  <div style={{ position: 'relative', height: '280px' }}><canvas ref={adminChartRef}></canvas></div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
               ADMIN VIEW: COHORT REGISTRY
               ============================================== */}
          {activeTab === 'admin-startups' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Legal Venture</th>
                    <th>Industry Sector</th>
                    <th>Stage</th>
                    <th>Health</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {startups.map(st => (
                    <tr key={st.id}>
                      <td style={{ fontWeight: 'bold' }}>{st.name}</td>
                      <td>{st.industry}</td>
                      <td>{st.stage}</td>
                      <td><span className={`badge ${st.at_risk ? 'badge-danger' : 'badge-success'}`}>{st.at_risk ? 'At Risk' : 'Healthy'}</span></td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={async () => {
                          if (confirm('Delete profile?')) {
                            await fetch(`/api/startups/${st.id}`, { method: 'DELETE', headers: getHeaders() });
                            fetchStartups();
                          }
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ==============================================
               ADMIN VIEW: ECOSYSTEM USERS MANAGER
               ============================================== */}
          {activeTab === 'admin-users' && (
            <div className="modeler-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email Address</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.email}>
                        <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className="badge badge-info">{u.role}</span></td>
                        <td>
                          {u.email !== user.email && (
                            <button className="btn btn-danger btn-sm" onClick={async () => {
                              if (confirm('Remove user?')) {
                                await fetch(`/api/admin/users/${u.email}`, { method: 'DELETE', headers: getHeaders() });
                                fetchAdminUsers();
                              }
                            }}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-card" style={{ padding: '20px' }}>
                <h4>Provision Account</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const body = {
                    name: e.target.adName.value,
                    email: e.target.adEmail.value,
                    password: e.target.adPassword.value,
                    role: e.target.adRole.value
                  };
                  const res = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(body)
                  });
                  if (res.ok) {
                    alert('User account provisioned.');
                    fetchAdminUsers();
                    e.target.reset();
                  } else {
                    alert('Failed.');
                  }
                }}>
                  <div className="form-group mb-20"><label>Name</label><input type="text" name="adName" required /></div>
                  <div className="form-group mb-20"><label>Email</label><input type="email" name="adEmail" required /></div>
                  <div className="form-group mb-20"><label>Password</label><input type="password" name="adPassword" defaultValue="password123" required /></div>
                  <div className="form-group mb-20">
                    <label>Role</label>
                    <select name="adRole">
                      <option value="founder">Founder</option>
                      <option value="investor">Investor</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>Provision Account</button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
