/**
 * Inventure SPA Controller
 * Manages database in localStorage, session state, navigation, rendering, and charts.
 */

// Initialize LocalStorage DB if empty
function initializeDB() {
    if (!localStorage.getItem('inventure_initialized')) {
        // Mock Users
        const users = [
            { email: 'admin@incubator.com', password: 'password123', name: 'Rajesh Kumar', role: 'admin' },
            { email: 'ananya@startup.com', password: 'password123', name: 'Ananya Sharma', role: 'founder' },
            { email: 'priya@invest.com', password: 'password123', name: 'Priya Patel', role: 'investor' },
            { email: 'rohan@startup.com', password: 'password123', name: 'Rohan Gupta', role: 'founder' }
        ];

        // Mock Startups
        const startups = [
            {
                id: '1',
                name: 'GreenHarvest',
                founderEmail: 'ananya@startup.com',
                industry: 'AgriTech',
                stage: 'Idea',
                fundingNeeded: 2000000,
                description: 'AgriTech automated vertical farming with AI-powered analytics to optimize crop yield and conserve water.',
                cash: 300000,
                revenue: 20000,
                expenses: 80000,
                progress: 45,
                atRisk: true,
                capTable: [
                    { name: 'Ananya Sharma', shares: 600000, isFounder: true },
                    { name: 'Aarav Mehta', shares: 300000, isFounder: true },
                    { name: 'Existing Employees', shares: 100000, isFounder: false }
                ]
            },
            {
                id: '2',
                name: 'AirAware AI',
                founderEmail: 'ananya@startup.com',
                industry: 'GovTech',
                stage: 'Idea',
                fundingNeeded: 1500000,
                description: 'Air quality predictive modeling systems for municipal environmental agencies using distributed low-power IoT sensors.',
                cash: 120000,
                revenue: 5000,
                expenses: 35000,
                progress: 10,
                atRisk: true,
                capTable: [
                    { name: 'Ananya Sharma', shares: 800000, isFounder: true },
                    { name: 'Technical Co-founder', shares: 200000, isFounder: true }
                ]
            },
            {
                id: '3',
                name: 'EduTech Pro',
                founderEmail: 'rohan@startup.com',
                industry: 'EdTech',
                stage: 'MVP',
                fundingNeeded: 5000000,
                description: 'AI-powered personalized tutoring platform that integrates into K-12 learning systems to support teachers.',
                cash: 1200000,
                revenue: 100000,
                expenses: 150000,
                progress: 65,
                atRisk: false,
                capTable: [
                    { name: 'Rohan Gupta', shares: 700000, isFounder: true },
                    { name: 'Angel Investor', shares: 150000, isFounder: false },
                    { name: 'Employee Option Pool', shares: 150000, isFounder: false }
                ]
            }
        ];

        // Mock Feedbacks
        const feedbacks = [
            { id: '1', startupId: '3', rating: 4, category: 'Product', comment: 'Excellent technical progress on the pilot deployment. Needs scaling checks.', author: 'Priya Patel', date: '2026-06-15' },
            { id: '2', startupId: '3', rating: 3, category: 'Market', comment: 'Market competition is high. Ensure IP protection is solid.', author: 'Rajesh Kumar', date: '2026-06-20' },
            { id: '3', startupId: '1', rating: 4, category: 'Team', comment: 'Strong agronomics expertise in the co-founding team.', author: 'Priya Patel', date: '2026-06-28' }
        ];

        // Mock Investor Preferences
        const preferences = {
            'priya@invest.com': {
                industry: 'AgriTech',
                stage: 'Idea',
                minCapital: 500000,
                maxCapital: 3000000
            }
        };

        // Mock shortlists
        const shortlists = {
            'priya@invest.com': {
                shortlisted: ['3'],
                interested: ['1']
            }
        };

        localStorage.setItem('inventure_users', JSON.stringify(users));
        localStorage.setItem('inventure_startups', JSON.stringify(startups));
        localStorage.setItem('inventure_feedbacks', JSON.stringify(feedbacks));
        localStorage.setItem('inventure_preferences', JSON.stringify(preferences));
        localStorage.setItem('inventure_shortlists', JSON.stringify(shortlists));
        localStorage.setItem('inventure_initialized', 'true');
    }
}

// Global App State
let currentUser = null;
let currentActiveTab = '';
let activeCharts = {};

// On Load
document.addEventListener('DOMContentLoaded', () => {
    initializeDB();
    checkSession();
});

function checkSession() {
    const session = sessionStorage.getItem('inventure_session');
    if (session) {
        currentUser = JSON.parse(session);
        showAppShell();
    } else {
        showAuthScreen();
    }
}

// ==============================================
// AUTH ACTIONS
// ==============================================

function switchAuthTab(mode) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    if (mode === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('inventure_users'));
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
        currentUser = user;
        sessionStorage.setItem('inventure_session', JSON.stringify(user));
        showAppShell();
    } else {
        alert('Invalid email or password.');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;

    const users = JSON.parse(localStorage.getItem('inventure_users'));
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('User with this email already exists.');
        return;
    }

    const newUser = { email, password, name, role };
    users.push(newUser);
    localStorage.setItem('inventure_users', JSON.stringify(users));

    alert('Registration successful! You can now log in.');
    switchAuthTab('login');
    document.getElementById('loginEmail').value = email;
}

function handleLogout() {
    sessionStorage.removeItem('inventure_session');
    currentUser = null;
    showAuthScreen();
}

function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appShell').style.display = 'none';
}

function showAppShell() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';

    document.getElementById('userDisplayName').innerText = currentUser.name;
    document.getElementById('userDisplayRole').innerText = currentUser.role;

    // Render Side Menu
    renderSidebarMenu();

    // Navigate to default tab
    if (currentUser.role === 'founder') {
        navigate('my-startups');
    } else if (currentUser.role === 'investor') {
        navigate('deal-flow');
    } else {
        navigate('admin-dashboard');
    }
}

// ==============================================
// SIDEBAR & NAVIGATION SYSTEM
// ==============================================

function renderSidebarMenu() {
    const menuContainer = document.getElementById('sidebarMenu');
    menuContainer.innerHTML = '';

    const menus = {
        founder: [
            { id: 'my-startups', label: 'My Startups', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
            { id: 'add-startup', label: 'Launch Venture', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'calculators', label: 'Financial Modeling', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 11h.01M12 7h.01M15 11h.01M15 14h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
            { id: 'founder-feedback', label: 'Investor Feedback', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
            { id: 'founder-investors', label: 'Browse Capital', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
        ],
        investor: [
            { id: 'deal-flow', label: 'Matchmaking Engine', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            { id: 'shortlist', label: 'Shortlisted Portfolio', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
            { id: 'preferences', label: 'Investment Mandate', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' }
        ],
        admin: [
            { id: 'admin-dashboard', label: 'Ecosystem Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'admin-startups', label: 'Startup Directory', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
            { id: 'admin-users', label: 'User Directory', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
        ]
    };

    const roleMenus = menus[currentUser.role] || [];
    roleMenus.forEach(item => {
        const li = document.createElement('li');
        li.className = 'sidebar-item';
        li.innerHTML = `
            <a class="sidebar-link" id="nav-${item.id}" onclick="navigate('${item.id}')">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
                </svg>
                ${item.label}
            </a>
        `;
        menuContainer.appendChild(li);
    });
}

function navigate(tabId) {
    currentActiveTab = tabId;
    
    // Clear page canvases before changing context to avoid ghost renderings
    Object.values(activeCharts).forEach(chart => chart.destroy());
    activeCharts = {};

    // Update nav links styling
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.getElementById(`nav-${tabId}`);
    if (activeLink) activeLink.classList.add('active');

    // Render tab header
    const titles = {
        'my-startups': 'My Incubated Startups',
        'add-startup': 'Launch New Venture',
        'calculators': 'Institutional Dilution & Runway Calculators',
        'founder-feedback': 'Performance & Pitch Reviews',
        'founder-investors': 'Syndicate & Venture Partners',
        'deal-flow': 'Automated Deal Flow Matchmaker',
        'shortlist': 'Monitored Deal Board',
        'preferences': 'Investment Strategy Preferences',
        'admin-dashboard': 'Ecosystem Vital Metrics',
        'admin-startups': 'Cohort Monitoring',
        'admin-users': 'User Account Manager'
    };
    document.getElementById('currentTabTitle').innerText = titles[tabId] || 'Overview';
    document.getElementById('headerSystemMetrics').innerText = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Execute tab rendering functions
    const contentContainer = document.getElementById('mainContent');
    contentContainer.innerHTML = `<div style="text-align: center; padding: 50px 0; color: var(--bank-text-muted);">Loading workspace...</div>`;

    setTimeout(() => {
        switch (tabId) {
            case 'my-startups': renderFounderStartups(contentContainer); break;
            case 'add-startup': renderAddStartup(contentContainer); break;
            case 'calculators': renderFounderCalculators(contentContainer); break;
            case 'founder-feedback': renderFounderFeedback(contentContainer); break;
            case 'founder-investors': renderFounderInvestors(contentContainer); break;
            case 'deal-flow': renderInvestorMatchmaking(contentContainer); break;
            case 'shortlist': renderInvestorShortlist(contentContainer); break;
            case 'preferences': renderInvestorPreferences(contentContainer); break;
            case 'admin-dashboard': renderAdminDashboard(contentContainer); break;
            case 'admin-startups': renderAdminStartups(contentContainer); break;
            case 'admin-users': renderAdminUsers(contentContainer); break;
        }
    }, 100);
}

// Helper: Get DB items
const getStartups = () => JSON.parse(localStorage.getItem('inventure_startups')) || [];
const saveStartups = (data) => localStorage.setItem('inventure_startups', JSON.stringify(data));
const getFeedbacks = () => JSON.parse(localStorage.getItem('inventure_feedbacks')) || [];
const saveFeedbacks = (data) => localStorage.setItem('inventure_feedbacks', JSON.stringify(data));
const getUsers = () => JSON.parse(localStorage.getItem('inventure_users')) || [];
const saveUsers = (data) => localStorage.setItem('inventure_users', JSON.stringify(data));

// ==============================================
// RENDERERS: FOUNDER
// ==============================================

function renderFounderStartups(container) {
    const startups = getStartups().filter(s => s.founderEmail === currentUser.email);
    
    if (startups.length === 0) {
        container.innerHTML = `
            <div class="form-card" style="text-align: center; padding: 60px;">
                <h3 style="margin-bottom: 12px; color: var(--bank-primary);">No Ventures Registered</h3>
                <p style="color: var(--bank-text-muted); margin-bottom: 24px;">Register your startup on InVenture to track financials and match with incubator syndicate partners.</p>
                <button class="btn btn-primary" onclick="navigate('add-startup')">Register First Startup</button>
            </div>
        `;
        return;
    }

    let startupsHTML = '';
    startups.forEach(s => {
        const runway = Calculators.calculateRunway(s.cash, s.revenue, s.expenses, 12);
        startupsHTML += `
            <div class="form-card mb-20">
                <div class="flex-between mb-20" style="border-bottom: 1px solid var(--bank-border); padding-bottom: 12px;">
                    <div>
                        <h2 style="color: var(--bank-primary); font-size: 20px;">${s.name}</h2>
                        <div style="font-size: 13px; color: var(--bank-text-muted); margin-top: 4px;">Industry: <strong>${s.industry}</strong> &nbsp;|&nbsp; Stage: <strong>${s.stage}</strong></div>
                    </div>
                    <div>
                        <span class="badge ${s.atRisk ? 'badge-danger' : 'badge-success'}">${s.atRisk ? 'High Risk' : 'Healthy'}</span>
                    </div>
                </div>
                <p style="font-size: 14px; margin-bottom: 20px; color: var(--bank-text-main);">${s.description}</p>
                
                <div class="stats-grid">
                    <div class="stat-card" style="padding: 16px;">
                        <div class="stat-label">Active Cash</div>
                        <div class="stat-value">$${s.cash.toLocaleString()}</div>
                    </div>
                    <div class="stat-card" style="padding: 16px;">
                        <div class="stat-label">Monthly Burn</div>
                        <div class="stat-value ${runway.monthlyBurnRate > 0 ? 'danger' : 'success'}">$${runway.monthlyBurnRate.toLocaleString()}</div>
                    </div>
                    <div class="stat-card" style="padding: 16px;">
                        <div class="stat-label">Months Runway</div>
                        <div class="stat-value ${parseFloat(runway.monthsOfRunway) < 6 ? 'danger' : 'success'}">${runway.monthsOfRunway}</div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = startupsHTML;
}

function renderAddStartup(container) {
    container.innerHTML = `
        <div class="form-card">
            <div class="section-header">
                <div class="section-title">Institutional Venture Registration</div>
            </div>
            <form onsubmit="saveNewStartup(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="stName">Venture Legal Name</label>
                        <input type="text" id="stName" placeholder="e.g. GreenHarvest Inc." required>
                    </div>
                    <div class="form-group">
                        <label for="stIndustry">Sector / Industry</label>
                        <select id="stIndustry" required>
                            <option value="AgriTech">AgriTech</option>
                            <option value="GovTech">GovTech</option>
                            <option value="EdTech">EdTech</option>
                            <option value="FinTech">FinTech</option>
                            <option value="BioTech">BioTech</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="stStage">Current Maturity Stage</label>
                        <select id="stStage" required>
                            <option value="Idea">Idea / Concept</option>
                            <option value="MVP">Minimum Viable Product (MVP)</option>
                            <option value="Pre-Seed">Pre-Seed</option>
                            <option value="Seed">Seed Round</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="stFunding">Capital Required ($)</label>
                        <input type="number" id="stFunding" placeholder="1000000" required>
                    </div>
                    <div class="form-group full-width">
                        <label for="stDesc">Executive Summary / Venture Overview</label>
                        <textarea id="stDesc" rows="4" placeholder="Describe the market opportunity, IP, and product..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="stCash">Current Cash Balance ($)</label>
                        <input type="number" id="stCash" value="250000" required>
                    </div>
                    <div class="form-group">
                        <label for="stRevenue">Projected Monthly Revenue ($)</label>
                        <input type="number" id="stRevenue" value="10000" required>
                    </div>
                    <div class="form-group">
                        <label for="stExpenses">Operating Monthly Expenses ($)</label>
                        <input type="number" id="stExpenses" value="40000" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Submit Registry & Build Cap Table</button>
            </form>
        </div>
    `;
}

function saveNewStartup(e) {
    e.preventDefault();
    const name = document.getElementById('stName').value.trim();
    const industry = document.getElementById('stIndustry').value;
    const stage = document.getElementById('stStage').value;
    const fundingNeeded = parseFloat(document.getElementById('stFunding').value);
    const description = document.getElementById('stDesc').value.trim();
    const cash = parseFloat(document.getElementById('stCash').value);
    const revenue = parseFloat(document.getElementById('stRevenue').value);
    const expenses = parseFloat(document.getElementById('stExpenses').value);

    const startups = getStartups();
    const newId = (startups.length + 1).toString();

    // Default Cap Table for the registered startup
    const defaultCapTable = [
        { name: currentUser.name, shares: 800000, isFounder: true },
        { name: 'Reserve Option Pool', shares: 200000, isFounder: false }
    ];

    const newSt = {
        id: newId,
        name,
        founderEmail: currentUser.email,
        industry,
        stage,
        fundingNeeded,
        description,
        cash,
        revenue,
        expenses,
        progress: 20,
        atRisk: (expenses - revenue) * 6 > cash, // At risk if less than 6 months runway
        capTable: defaultCapTable
    };

    startups.push(newSt);
    saveStartups(startups);
    alert('Startup registered successfully!');
    navigate('my-startups');
}

// ==============================================
// MODELER RENDER AND INTERACTIVITY (CRITICAL)
// ==============================================
let activeCapTableCopy = [];
let activeSafes = [];

function renderFounderCalculators(container) {
    const startups = getStartups().filter(s => s.founderEmail === currentUser.email);
    if (startups.length === 0) {
        container.innerHTML = `
            <div class="form-card" style="text-align: center; padding: 40px;">
                <h3>Active Startup Profile Required</h3>
                <p style="color: var(--bank-text-muted); margin-top: 10px;">Please register a startup before modeling runway and equity dilution.</p>
            </div>
        `;
        return;
    }

    const selectedSt = startups[0]; // Model the first startup in user portfolio
    activeCapTableCopy = JSON.parse(JSON.stringify(selectedSt.capTable));

    container.innerHTML = `
        <div class="modeler-grid">
            
            <!-- LEFT COLUMN: INPUT PARAMETERS -->
            <div>
                <!-- RUNWAY CALCULATOR -->
                <div class="calc-section">
                    <div class="calc-title">Burn Rate & Runway Modeler (${selectedSt.name})</div>
                    <div class="form-group mb-20">
                        <label for="cashInput">Liquid Cash Balance ($)</label>
                        <input type="number" id="cashInput" value="${selectedSt.cash}" oninput="runRunwayCalc()">
                    </div>
                    <div class="form-grid mb-20">
                        <div class="form-group">
                            <label for="revInput">Monthly Revenue ($)</label>
                            <input type="number" id="revInput" value="${selectedSt.revenue}" oninput="runRunwayCalc()">
                        </div>
                        <div class="form-group">
                            <label for="expInput">Monthly Expenses ($)</label>
                            <input type="number" id="expInput" value="${selectedSt.expenses}" oninput="runRunwayCalc()">
                        </div>
                    </div>
                    <div class="form-group mb-20">
                        <label for="targetRunwayInput">Target Desired Runway (Months)</label>
                        <input type="number" id="targetRunwayInput" value="12" oninput="runRunwayCalc()">
                    </div>
                    <div id="runwayResultsBox" style="background-color: var(--bank-bg-main); border: 1px solid var(--bank-border); padding: 16px; border-radius: 4px;">
                        <!-- Runway result output -->
                    </div>
                </div>

                <!-- DILUTION & CAP TABLE ROUND SETTINGS -->
                <div class="calc-section">
                    <div class="calc-title">Equity Dilution Round Modeler</div>
                    
                    <div class="form-grid mb-20">
                        <div class="form-group">
                            <label for="preMoneyVal">Pre-Money Valuation ($)</label>
                            <input type="number" id="preMoneyVal" value="8000000">
                        </div>
                        <div class="form-group">
                            <label for="roundInvestment">Investment Amount ($)</label>
                            <input type="number" id="roundInvestment" value="2000000">
                        </div>
                    </div>

                    <div class="form-grid mb-20">
                        <div class="form-group">
                            <label for="optionPoolPct">New Option Pool Target (%)</label>
                            <input type="number" id="optionPoolPct" value="10" placeholder="e.g. 10">
                        </div>
                        <div class="form-group">
                            <label for="optionPoolTime">Option Pool Setup Timing</label>
                            <select id="optionPoolTime">
                                <option value="pre-money">Pre-Money Top-Up (Founders Dilute)</option>
                                <option value="post-money">Post-Money Top-Up (All Dilute)</option>
                            </select>
                        </div>
                    </div>

                    <div class="calc-title" style="font-size:13px; margin-top: 20px;">SAFE / Convertible Note Conversions</div>
                    <div id="safesContainer" class="mb-20">
                        <!-- Dynamic list of SAFEs -->
                    </div>
                    <button class="btn btn-secondary btn-sm mb-20" onclick="addSafeInputRow()">+ Add Note / SAFE</button>
                    
                    <button class="btn btn-primary" style="width: 100%;" onclick="runDilutionModeling()">Execute Dilution Calculations</button>
                </div>
            </div>

            <!-- RIGHT COLUMN: CAP TABLE AND VISUAL RESULTS -->
            <div>
                <!-- Pre-Money Cap Table Input -->
                <div class="calc-section">
                    <div class="calc-title">Pre-Round Shareholders Registry</div>
                    <div class="table-container" style="margin-bottom:15px;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Shareholder</th>
                                    <th class="text-right">Shares Held</th>
                                    <th class="text-right">Starting %</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="preRoundInputsBody">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="addPreRoundRow()">+ Add Stakeholder</button>
                </div>

                <!-- Dilution Simulation Results -->
                <div id="dilutionResultsPanel" class="calc-section" style="display: none;">
                    <div class="calc-title" style="color: var(--bank-accent);">Dilution Simulation Output</div>
                    
                    <div class="stats-grid" style="margin-bottom: 20px;">
                        <div class="stat-card" style="padding: 12px;">
                            <div class="stat-label">Post-Money Val</div>
                            <div id="resPostMoney" class="stat-value" style="font-size:18px;">-</div>
                        </div>
                        <div class="stat-card" style="padding: 12px;">
                            <div class="stat-label">Share Price</div>
                            <div id="resSharePrice" class="stat-value" style="font-size:18px;">-</div>
                        </div>
                        <div class="stat-card" style="padding: 12px;">
                            <div class="stat-label">Investor Share %</div>
                            <div id="resInvPct" class="stat-value" style="font-size:18px;">-</div>
                        </div>
                    </div>

                    <!-- Comparison Table -->
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Stakeholder</th>
                                    <th class="text-right">Pre-Round %</th>
                                    <th class="text-right">Post-Round Shares</th>
                                    <th class="text-right" style="color: var(--bank-accent);">Post-Round %</th>
                                </tr>
                            </thead>
                            <tbody id="comparisonTableBody">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Pie Charts Side-by-Side -->
                    <div class="charts-comparison">
                        <div class="chart-wrapper">
                            <strong>Pre-Round Ownership</strong>
                            <div class="chart-canvas-container">
                                <canvas id="preRoundChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-wrapper">
                            <strong>Post-Round Dilution</strong>
                            <div class="chart-canvas-container">
                                <canvas id="postRoundChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Fintech Educational Alert -->
                    <div style="background-color: #f0fdf4; border: 1px solid #bcf0da; padding: 14px; border-radius: 4px; font-size:13px; margin-top:20px; line-height: 1.4;">
                        <strong style="color: #065f46;">Cap Table Insights:</strong>
                        <p id="dilutionInsightMessage" style="color: #1e293b; margin-top: 4px;"></p>
                    </div>
                </div>
            </div>

        </div>
    `;

    // Render initial runs
    runRunwayCalc();
    renderPreRoundInputs();
}

function runRunwayCalc() {
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    const rev = parseFloat(document.getElementById('revInput').value) || 0;
    const exp = parseFloat(document.getElementById('expInput').value) || 0;
    const target = parseFloat(document.getElementById('targetRunwayInput').value) || 12;

    const res = Calculators.calculateRunway(cash, rev, exp, target);
    
    document.getElementById('runwayResultsBox').innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Monthly Net Burn:</span>
            <strong>$${res.monthlyBurnRate.toLocaleString()}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Runway:</span>
            <strong class="${parseFloat(res.monthsOfRunway) < 6 ? 'danger' : 'success'}" style="color: ${parseFloat(res.monthsOfRunway) < 6 ? 'var(--bank-danger)' : 'var(--bank-success)'};">${res.monthsOfRunway} Months</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span>Capital Needed for ${target}mo:</span>
            <strong>$${res.fundingNeeded.toLocaleString()}</strong>
        </div>
    `;
}

function renderPreRoundInputs() {
    const tbody = document.getElementById('preRoundInputsBody');
    tbody.innerHTML = '';

    const totalShares = activeCapTableCopy.reduce((sum, item) => sum + item.shares, 0);

    activeCapTableCopy.forEach((item, index) => {
        const pct = totalShares > 0 ? ((item.shares / totalShares) * 100).toFixed(2) : '0.00';
        tbody.innerHTML += `
            <tr>
                <td><input type="text" value="${item.name}" onchange="updatePreRoundName(${index}, this.value)" style="width: 100%; border:none; padding:4px; font-weight:500;"></td>
                <td><input type="number" value="${item.shares}" onchange="updatePreRoundShares(${index}, this.value)" style="width: 100%; border:none; text-align:right; padding:4px; font-weight:500;"></td>
                <td class="text-right" style="font-weight: 600; color: var(--bank-text-muted);">${pct}%</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removePreRoundRow(${index})" style="padding: 2px 6px;">Delete</button>
                </td>
            </tr>
        `;
    });
}

function updatePreRoundName(idx, val) {
    activeCapTableCopy[idx].name = val;
    renderPreRoundInputs();
}

function updatePreRoundShares(idx, val) {
    activeCapTableCopy[idx].shares = Math.max(0, parseInt(val) || 0);
    renderPreRoundInputs();
}

function addPreRoundRow() {
    activeCapTableCopy.push({ name: 'New Stakeholder', shares: 100000, isFounder: false });
    renderPreRoundInputs();
}

function removePreRoundRow(idx) {
    activeCapTableCopy.splice(idx, 1);
    renderPreRoundInputs();
}

function addSafeInputRow() {
    activeSafes.push({ name: `SAFE Note Series ${activeSafes.length + 1}`, investment: 100000, cap: 5000000, discount: 20 });
    renderSafesList();
}

function renderSafesList() {
    const cont = document.getElementById('safesContainer');
    cont.innerHTML = '';

    activeSafes.forEach((safe, index) => {
        const div = document.createElement('div');
        div.style.border = '1px solid var(--bank-border)';
        div.style.padding = '12px';
        div.style.borderRadius = '4px';
        div.style.marginBottom = '10px';
        div.style.backgroundColor = '#fafafa';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <input type="text" value="${safe.name}" onchange="updateSafeData(${index}, 'name', this.value)" style="border:none; background:transparent; font-weight:600; width:70%;">
                <button class="btn btn-danger btn-sm" onclick="removeSafeRow(${index})" style="padding: 2px 6px;">Remove</button>
            </div>
            <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div class="form-group">
                    <label style="font-size:11px;">Invested ($)</label>
                    <input type="number" value="${safe.investment}" oninput="updateSafeData(${index}, 'investment', this.value)" style="padding: 4px 8px; font-size:12px;">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">Cap ($)</label>
                    <input type="number" value="${safe.cap}" oninput="updateSafeData(${index}, 'cap', this.value)" style="padding: 4px 8px; font-size:12px;">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">Discount (%)</label>
                    <input type="number" value="${safe.discount}" oninput="updateSafeData(${index}, 'discount', this.value)" style="padding: 4px 8px; font-size:12px;">
                </div>
            </div>
        `;
        cont.appendChild(div);
    });
}

function updateSafeData(idx, key, val) {
    if (key === 'name') activeSafes[idx].name = val;
    else activeSafes[idx][key] = parseFloat(val) || 0;
}

function removeSafeRow(idx) {
    activeSafes.splice(idx, 1);
    renderSafesList();
}

function runDilutionModeling() {
    const preVal = parseFloat(document.getElementById('preMoneyVal').value) || 0;
    const invest = parseFloat(document.getElementById('roundInvestment').value) || 0;
    const opPct = parseFloat(document.getElementById('optionPoolPct').value) || 0;
    const opTiming = document.getElementById('optionPoolTime').value;

    if (preVal <= 0 || invest <= 0) {
        alert('Please enter positive values for Pre-Money Valuation and Investment.');
        return;
    }

    const roundData = {
        preMoneyValuation: preVal,
        investmentAmount: invest,
        optionPoolPercent: opPct,
        optionPoolTiming: opTiming,
        safes: activeSafes
    };

    const results = Calculators.modelFundingRound(activeCapTableCopy, roundData);
    displayDilutionResults(results, opPct, opTiming);
}

function displayDilutionResults(res, opPct, opTiming) {
    document.getElementById('dilutionResultsPanel').style.display = 'block';

    document.getElementById('resPostMoney').innerText = `$${res.postMoneyValuation.toLocaleString()}`;
    document.getElementById('resSharePrice').innerText = `$${res.postRoundSharePrice.toFixed(4)}`;
    
    const investorObj = res.afterRound.find(x => x.name === 'New Investor');
    const investorPct = investorObj ? investorObj.percent : 0;
    document.getElementById('resInvPct').innerText = `${investorPct.toFixed(2)}%`;

    // Populate Comparison Table
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    res.afterRound.forEach(postMember => {
        // Find matching pre-round member
        const preMember = res.beforeRound.find(x => x.name === postMember.name);
        const prePct = preMember ? `${preMember.percent.toFixed(2)}%` : '0.00%';
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${postMember.name}</td>
                <td class="text-right">${prePct}</td>
                <td class="text-right" style="color: var(--bank-text-muted);">${Math.round(postMember.shares).toLocaleString()}</td>
                <td class="text-right" style="font-weight: 700; color: var(--bank-accent);">${postMember.percent.toFixed(2)}%</td>
            </tr>
        `;
    });

    // Subtlety explanation
    let insightStr = '';
    if (opPct > 0) {
        if (opTiming === 'pre-money') {
            insightStr = `Creating a <strong>${opPct}% Option Pool PRE-money</strong> dilutes the founders from the start. Under this method, the founders' share ownership falls significantly to fit both the option pool and the new investor, protecting the incoming investor from pool expansion dilution.`;
        } else {
            insightStr = `Creating a <strong>${opPct}% Option Pool POST-money</strong> dilutes all stakeholders proportionally, including the incoming investor. This reduces the dilution impact on founders but decreases the investor's final ownership below their nominal percentage.`;
        }
    } else {
        insightStr = 'Standard priced round dilutes founders proportionally to the investment amount and conversion price.';
    }

    if (res.safeDetails.length > 0) {
        insightStr += ` Additionally, ${res.safeDetails.length} SAFE/convertible note(s) converted at this round, diluting the founders prior to investor equity valuation matching.`;
    }

    document.getElementById('dilutionInsightMessage').innerHTML = insightStr;

    // Render Side-by-Side Pie Charts
    renderCapCharts(res.beforeRound, res.afterRound);
}

function renderCapCharts(before, after) {
    const ctxPre = document.getElementById('preRoundChart').getContext('2d');
    const ctxPost = document.getElementById('postRoundChart').getContext('2d');

    // Destroy active charts if already existing to avoid graphic memory leaks
    if (activeCharts['pre']) activeCharts['pre'].destroy();
    if (activeCharts['post']) activeCharts['post'].destroy();

    const chartConfig = (dataList) => {
        const labels = dataList.map(x => x.name);
        const data = dataList.map(x => x.percent);
        const colors = [
            '#0f172a', // Navy
            '#0f766e', // Teal
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#6366f1', // Indigo
            '#ec4899'  // Pink
        ];

        return {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, dataList.length),
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 10, family: 'Inter' },
                            boxWidth: 10
                        }
                    }
                }
            }
        };
    };

    activeCharts['pre'] = new Chart(ctxPre, chartConfig(before));
    activeCharts['post'] = new Chart(ctxPost, chartConfig(after));
}

// ==============================================
// RENDERERS: FOUNDER FEEDBACK & BROWSE PARTNERS
// ==============================================

function renderFounderFeedback(container) {
    const startups = getStartups().filter(s => s.founderEmail === currentUser.email);
    if (startups.length === 0) {
        container.innerHTML = `<div class="form-card"><p>No registered startups found to review feedback.</p></div>`;
        return;
    }

    const allFeedbacks = getFeedbacks();
    const stIds = startups.map(s => s.id);
    const feedbackList = allFeedbacks.filter(f => stIds.includes(f.startupId));

    if (feedbackList.length === 0) {
        container.innerHTML = `
            <div class="form-card">
                <h3>No Pitch Reviews Recorded</h3>
                <p style="color: var(--bank-text-muted); margin-top: 8px;">Investors have not yet submitted reviews for your startups. Engage syndicate partners to request a valuation review.</p>
            </div>
        `;
        return;
    }

    let html = '';
    feedbackList.forEach(f => {
        const st = startups.find(s => s.id === f.startupId);
        html += `
            <div class="form-card mb-20" style="padding: 20px;">
                <div class="flex-between mb-20">
                    <div>
                        <strong>${st.name}</strong> &middot; <span class="badge badge-info">${f.category} Review</span>
                    </div>
                    <div>
                        <strong style="color: var(--bank-warning);">&#9733; ${f.rating}/5</strong>
                    </div>
                </div>
                <p style="font-size:14px; color: var(--bank-text-main); font-style:italic;">"${f.comment}"</p>
                <div style="font-size:12px; color: var(--bank-text-muted); text-align:right; margin-top:10px;">Submitted by ${f.author} on ${f.date}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderFounderInvestors(container) {
    const users = getUsers().filter(u => u.role === 'investor');
    let html = `
        <div class="section-header">
            <div class="section-title">Syndicate Venture Partners Directory</div>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Partner Name</th>
                        <th>Email Contact</th>
                        <th>Institution Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    users.forEach(u => {
        html += `
            <tr>
                <td style="font-weight:600;">${u.name}</td>
                <td><a href="mailto:${u.email}" style="color:var(--bank-accent);">${u.email}</a></td>
                <td><span class="badge badge-success">Verified Investor</span></td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// ==============================================
// RENDERERS: INVESTOR WORKSPACE
// ==============================================

function renderInvestorMatchmaking(container) {
    const startups = getStartups();
    const prefs = JSON.parse(localStorage.getItem('inventure_preferences')) || {};
    const investorPrefs = prefs[currentUser.email] || { industry: 'Any', stage: 'Any', minCapital: 0, maxCapital: 10000000 };

    let html = `
        <div class="section-header">
            <div class="section-title">Active Matchmaking Deal Flow</div>
            <div style="font-size:12px; color: var(--bank-text-muted);">Matches dynamically calculated based on investment mandate.</div>
        </div>
    `;

    // Filter bar
    html += `
        <div class="mb-20" style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="filterInvestorDeals('All')">All Cohort</button>
            <button class="btn btn-secondary btn-sm" onclick="filterInvestorDeals('Idea')">Idea Stage</button>
            <button class="btn btn-secondary btn-sm" onclick="filterInvestorDeals('MVP')">MVP Stage</button>
            <button class="btn btn-secondary btn-sm" onclick="filterInvestorDeals('Funding')">Seeking Investment</button>
        </div>
        <div class="deal-flow-grid" id="investorDealsGrid">
    `;

    startups.forEach(s => {
        // Match calculation logic
        let matchScore = 0;
        let reasons = [];

        if (investorPrefs.industry === 'Any' || s.industry === investorPrefs.industry) {
            matchScore += 40;
            reasons.push('Sector alignment');
        }
        if (investorPrefs.stage === 'Any' || s.stage === investorPrefs.stage) {
            matchScore += 30;
            reasons.push('Maturity stage matches');
        }
        if (s.fundingNeeded >= investorPrefs.minCapital && s.fundingNeeded <= investorPrefs.maxCapital) {
            matchScore += 30;
            reasons.push('Funding size mandate');
        }

        const matchClass = matchScore >= 70 ? 'high-match' : 'med-match';

        html += `
            <div class="deal-card ${matchClass}" data-stage="${s.stage}">
                <div class="deal-header">
                    <div>
                        <h3 class="deal-title">${s.name}</h3>
                        <div class="deal-meta-row" style="margin-top:4px;">
                            <span>Sector: <strong>${s.industry}</strong></span>
                            <span>Maturity: <strong>${s.stage}</strong></span>
                            <span>Capital Need: <strong>$${s.fundingNeeded.toLocaleString()}</strong></span>
                        </div>
                    </div>
                    <div class="deal-match-badge">${matchScore}% Fit</div>
                </div>
                <p class="deal-desc">${s.description}</p>
                <div style="font-size:12px; color:var(--bank-text-muted);">Match Reason: ${reasons.join(', ') || 'General pipeline'}</div>
                <div class="deal-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewStartupDetails('${s.id}')">View Due Diligence</button>
                    <button class="btn btn-secondary btn-sm" onclick="toggleShortlist('${s.id}', 'interested')">Mark Interest</button>
                    <button class="btn btn-secondary btn-sm" onclick="toggleShortlist('${s.id}', 'shortlisted')">Shortlist</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function filterInvestorDeals(filter) {
    const cards = document.querySelectorAll('#investorDealsGrid .deal-card');
    cards.forEach(card => {
        const stage = card.getAttribute('data-stage');
        if (filter === 'All') {
            card.style.display = 'flex';
        } else if (filter === 'Funding') {
            card.style.display = 'flex'; // Simplified seeking funding
        } else {
            card.style.display = stage === filter ? 'flex' : 'none';
        }
    });
}

function toggleShortlist(startupId, type) {
    const list = JSON.parse(localStorage.getItem('inventure_shortlists')) || {};
    if (!list[currentUser.email]) {
        list[currentUser.email] = { shortlisted: [], interested: [] };
    }

    const index = list[currentUser.email][type].indexOf(startupId);
    if (index === -1) {
        list[currentUser.email][type].push(startupId);
        alert(`Startup successfully added to ${type} list.`);
    } else {
        list[currentUser.email][type].splice(index, 1);
        alert(`Startup removed from ${type} list.`);
    }

    localStorage.setItem('inventure_shortlists', JSON.stringify(list));
}

function renderInvestorShortlist(container) {
    const list = JSON.parse(localStorage.getItem('inventure_shortlists')) || {};
    const userList = list[currentUser.email] || { shortlisted: [], interested: [] };
    const startups = getStartups();

    let html = `
        <div class="section-header">
            <div class="section-title">Institutional Watchlist Dashboard</div>
        </div>
    `;

    // Render Shortlisted Section
    html += `<h3 style="margin-bottom:15px; color: var(--bank-primary);">Priority Shortlisted (High Match)</h3>`;
    const shorted = startups.filter(s => userList.shortlisted.includes(s.id));
    if (shorted.length === 0) {
        html += `<p style="font-size:13px; color: var(--bank-text-muted); margin-bottom: 25px;">No startups shortlisted yet.</p>`;
    } else {
        html += `<div class="deal-flow-grid mb-20">`;
        shorted.forEach(s => {
            html += `
                <div class="deal-card" style="border-left-color: var(--bank-success)">
                    <div class="deal-header">
                        <div>
                            <h4 class="deal-title">${s.name}</h4>
                            <div class="deal-meta-row" style="margin-top:4px;">
                                <span>$${s.fundingNeeded.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm" style="align-self: flex-start;" onclick="viewStartupDetails('${s.id}')">Review Deal Info</button>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Render Interested Section
    html += `<h3 style="margin-bottom:15px; color: var(--bank-primary); margin-top:30px;">General Interest Pipeline</h3>`;
    const interest = startups.filter(s => userList.interested.includes(s.id));
    if (interest.length === 0) {
        html += `<p style="font-size:13px; color: var(--bank-text-muted);">No startups in general interest pipeline.</p>`;
    } else {
        html += `<div class="deal-flow-grid">`;
        interest.forEach(s => {
            html += `
                <div class="deal-card" style="border-left-color: var(--bank-accent)">
                    <div class="deal-header">
                        <div>
                            <h4 class="deal-title">${s.name}</h4>
                            <div class="deal-meta-row" style="margin-top:4px;">
                                <span>$${s.fundingNeeded.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm" style="align-self: flex-start;" onclick="viewStartupDetails('${s.id}')">Review Deal Info</button>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
}

function renderInvestorPreferences(container) {
    const prefs = JSON.parse(localStorage.getItem('inventure_preferences')) || {};
    const ip = prefs[currentUser.email] || { industry: 'AgriTech', stage: 'Idea', minCapital: 100000, maxCapital: 2000000 };

    container.innerHTML = `
        <div class="form-card">
            <div class="section-header">
                <div class="section-title">Institutional Mandate & Investment Preferences</div>
            </div>
            <form onsubmit="savePreferences(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="prefIndustry">Preferred Industry Sector</label>
                        <select id="prefIndustry">
                            <option value="Any" ${ip.industry === 'Any' ? 'selected' : ''}>Any / All Sectors</option>
                            <option value="AgriTech" ${ip.industry === 'AgriTech' ? 'selected' : ''}>AgriTech</option>
                            <option value="GovTech" ${ip.industry === 'GovTech' ? 'selected' : ''}>GovTech</option>
                            <option value="EdTech" ${ip.industry === 'EdTech' ? 'selected' : ''}>EdTech</option>
                            <option value="FinTech" ${ip.industry === 'FinTech' ? 'selected' : ''}>FinTech</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="prefStage">Preferred Investment Stage</label>
                        <select id="prefStage">
                            <option value="Any" ${ip.stage === 'Any' ? 'selected' : ''}>Any Stage</option>
                            <option value="Idea" ${ip.stage === 'Idea' ? 'selected' : ''}>Idea / Concept</option>
                            <option value="MVP" ${ip.stage === 'MVP' ? 'selected' : ''}>MVP</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="prefMin">Minimum Deal Size ($)</label>
                        <input type="number" id="prefMin" value="${ip.minCapital}">
                    </div>
                    <div class="form-group">
                        <label for="prefMax">Maximum Deal Size ($)</label>
                        <input type="number" id="prefMax" value="${ip.maxCapital}">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Update Mandate Filters</button>
            </form>
        </div>
    `;
}

function savePreferences(e) {
    e.preventDefault();
    const industry = document.getElementById('prefIndustry').value;
    const stage = document.getElementById('prefStage').value;
    const minCapital = parseFloat(document.getElementById('prefMin').value) || 0;
    const maxCapital = parseFloat(document.getElementById('prefMax').value) || 0;

    const prefs = JSON.parse(localStorage.getItem('inventure_preferences')) || {};
    prefs[currentUser.email] = { industry, stage, minCapital, maxCapital };
    localStorage.setItem('inventure_preferences', JSON.stringify(prefs));

    alert('Investment mandate updated. Pipeline matching recalculating...');
    navigate('deal-flow');
}

// ==============================================
// DETAILED STARTUP VIEW (DUE DILIGENCE + RATING)
// ==============================================

function viewStartupDetails(startupId) {
    const s = getStartups().find(x => x.id === startupId);
    if (!s) return;

    const container = document.getElementById('mainContent');
    const fbs = getFeedbacks().filter(f => f.startupId === startupId);
    
    // Average rating
    const avg = fbs.length > 0 ? (fbs.reduce((sum, f) => sum + f.rating, 0) / fbs.length).toFixed(1) : 'Unrated';

    container.innerHTML = `
        <div class="detail-view">
            <a class="detail-nav-back" onclick="navigate('deal-flow')">&larr; Back to Pipeline</a>
            
            <div class="detail-header">
                <div class="flex-between">
                    <div>
                        <h1 style="color:var(--bank-primary); font-size: 26px;">${s.name}</h1>
                        <p style="color:var(--bank-text-muted); font-size:14px; margin-top:4px;">Founder Registry &middot; Contact: ${s.founderEmail}</p>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:24px; font-weight:700; color:var(--bank-warning);">&#9733; ${avg}</div>
                        <span style="font-size:11px; color:var(--bank-text-muted);">${fbs.length} Reviews Submitted</span>
                    </div>
                </div>
            </div>

            <div class="form-grid mb-20" style="grid-template-columns: 2fr 1fr; gap: 30px;">
                
                <!-- Venture Summary -->
                <div>
                    <h3 style="font-size:16px; margin-bottom:10px; color: var(--bank-primary);">Venture Overview</h3>
                    <p style="font-size:14px; color:var(--bank-text-main); margin-bottom:20px; line-height: 1.6;">${s.description}</p>
                    
                    <h3 style="font-size:16px; margin-bottom:10px; color: var(--bank-primary);">Pre-Round Cap Table Registry</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Shareholder</th>
                                    <th class="text-right">Shares Held</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(s.capTable || []).map(c => `
                                    <tr>
                                        <td>${c.name}</td>
                                        <td class="text-right">${Math.round(c.shares).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Financial Quick Metrics -->
                <div style="background-color: var(--bank-bg-main); border: 1px solid var(--bank-border); padding: 20px; border-radius: 4px;">
                    <h3 style="font-size:14px; margin-bottom:15px; color: var(--bank-primary); border-bottom:1px solid var(--bank-border); padding-bottom:8px;">FINANCIAL METRICS</h3>
                    
                    <div style="margin-bottom:12px;">
                        <span style="font-size:11px; color:var(--bank-text-muted); font-weight:600; text-transform:uppercase;">Incubator Ask</span>
                        <div style="font-size:18px; font-weight:700; color:var(--bank-accent);">$${s.fundingNeeded.toLocaleString()}</div>
                    </div>
                    <div style="margin-bottom:12px;">
                        <span style="font-size:11px; color:var(--bank-text-muted); font-weight:600; text-transform:uppercase;">Cash Balance</span>
                        <div style="font-size:16px; font-weight:600;">$${(s.cash || 0).toLocaleString()}</div>
                    </div>
                    <div style="margin-bottom:12px;">
                        <span style="font-size:11px; color:var(--bank-text-muted); font-weight:600; text-transform:uppercase;">Maturity Segment</span>
                        <div style="font-size:16px; font-weight:600;">${s.stage}</div>
                    </div>
                </div>
            </div>

            <!-- Pitch Reviews Section -->
            <div style="border-top:1px solid var(--bank-border); padding-top:30px; margin-top:30px;">
                <h3 style="font-size:16px; margin-bottom:15px; color: var(--bank-primary);">Pitch Reviews & Evaluations</h3>
                
                <!-- Feedback Submission Form -->
                <div class="form-card mb-20" style="padding:20px; background-color:#fafbfc;">
                    <h4 style="font-size:13px; margin-bottom:12px; color: var(--bank-primary);">Submit Pitch Feedback Note</h4>
                    <form onsubmit="submitFeedback(event, '${s.id}')">
                        <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div class="form-group">
                                <label for="fbRating">Score Rating (1-5)</label>
                                <select id="fbRating" required>
                                    <option value="5">5 - Strong Buy / Exceptional</option>
                                    <option value="4">4 - High Potential</option>
                                    <option value="3">3 - Hold / Medium Risk</option>
                                    <option value="2">2 - Weak Pipeline</option>
                                    <option value="1">1 - Avoid Investment</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="fbCategory">Analysis Category</label>
                                <select id="fbCategory" required>
                                    <option value="Product">Product Tech / Utility</option>
                                    <option value="Market">Market Size / Strategy</option>
                                    <option value="Team">Leadership Team</option>
                                    <option value="Financials">Financials / Dilution</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group mb-20">
                            <label for="fbComment">Detailed Memo Comment</label>
                            <textarea id="fbComment" rows="3" placeholder="Provide professional valuation feedback..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Commit Feedback Note</button>
                    </form>
                </div>

                <!-- Feedbacks list -->
                <div id="startupFeedbacksList">
                    ${fbs.map(f => `
                        <div class="feedback-item">
                            <div class="feedback-meta">
                                <span><strong>${f.author}</strong> &middot; ${f.category} Memo</span>
                                <strong style="color:var(--bank-warning); font-size:14px;">&#9733; ${f.rating}/5</strong>
                            </div>
                            <p style="font-size:13px; font-style:italic; color:var(--bank-text-main);">"${f.comment}"</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function submitFeedback(e, startupId) {
    e.preventDefault();
    const rating = parseInt(document.getElementById('fbRating').value);
    const category = document.getElementById('fbCategory').value;
    const comment = document.getElementById('fbComment').value.trim();

    const feedbacks = getFeedbacks();
    const newFb = {
        id: (feedbacks.length + 1).toString(),
        startupId,
        rating,
        category,
        comment,
        author: currentUser.name,
        date: new Date().toISOString().split('T')[0]
    };

    feedbacks.push(newFb);
    saveFeedbacks(feedbacks);
    alert('Pitch feedback submitted successfully!');
    viewStartupDetails(startupId);
}

// ==============================================
// RENDERERS: ADMIN ECOSYSTEM MONITORING
// ==============================================

function renderAdminDashboard(container) {
    const startups = getStartups();
    const users = getUsers();
    const atRiskCount = startups.filter(s => s.atRisk).length;
    
    // Average progress
    const avgProgress = startups.length > 0 ? Math.round(startups.reduce((sum, s) => sum + (s.progress || 0), 0) / startups.length) : 0;

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Active Startups Cohort</div>
                <div class="stat-value">${startups.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Urgent Care (At Risk)</div>
                <div class="stat-value danger">${atRiskCount}</div>
                <div class="stat-desc">Startups with low runway</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Cohort Progress</div>
                <div class="stat-value warning">${avgProgress}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Registered Users</div>
                <div class="stat-value">${users.length}</div>
            </div>
        </div>

        <div class="modeler-grid" style="grid-template-columns: 1.5fr 1fr;">
            <!-- Stage distribution chart -->
            <div class="calc-section">
                <div class="calc-title">Cohort Distribution by Stage</div>
                <div style="position:relative; height: 300px;">
                    <canvas id="adminStageChart"></canvas>
                </div>
            </div>

            <!-- Risk Action Panel -->
            <div class="calc-section">
                <div class="calc-title">At-Risk Startups Quick Action</div>
                <div style="font-size:13px; color: var(--bank-text-muted); line-height: 1.5;">
                    ${startups.filter(s => s.atRisk).map(s => `
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--bank-border); padding:8px 0;">
                            <div>
                                <strong>${s.name}</strong><br>
                                <span style="font-size:11px;">Runway short!</span>
                            </div>
                            <button class="btn btn-secondary btn-sm" style="padding:2px 6px;" onclick="navigate('admin-startups')">Review</button>
                        </div>
                    `).join('') || '<p>All startups show healthy runway metrics.</p>'}
                </div>
            </div>
        </div>
    `;

    // Render Stage distribution Chart.js bar chart
    renderAdminCharts(startups);
}

function renderAdminCharts(startups) {
    const ctx = document.getElementById('adminStageChart').getContext('2d');
    
    // Count stages
    const counts = { 'Idea': 0, 'MVP': 0, 'Pre-Seed': 0, 'Seed': 0 };
    startups.forEach(s => {
        if (counts[s.stage] !== undefined) counts[s.stage]++;
        else counts[s.stage] = 1;
    });

    activeCharts['adminStage'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: 'Startups Count',
                data: Object.values(counts),
                backgroundColor: '#0f766e',
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderAdminStartups(container) {
    const startups = getStartups();
    let html = `
        <div class="section-header">
            <div class="section-title">Cohort Incubation Directory</div>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Venture Name</th>
                        <th>Industry Sector</th>
                        <th>Stage</th>
                        <th>Runway Health</th>
                        <th>Ecosystem Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    startups.forEach(s => {
        const healthBadge = s.atRisk ? '<span class="badge badge-danger">At Risk</span>' : '<span class="badge badge-success">Healthy</span>';
        
        html += `
            <tr>
                <td style="font-weight:600;">${s.name}</td>
                <td>${s.industry}</td>
                <td>${s.stage}</td>
                <td>${healthBadge}</td>
                <td><span class="badge badge-info">Active Cohort</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="toggleStartupRisk('${s.id}')">Toggle Risk</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStartup('${s.id}')">Remove</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function toggleStartupRisk(id) {
    const startups = getStartups();
    const st = startups.find(s => s.id === id);
    if (st) {
        st.atRisk = !st.atRisk;
        saveStartups(startups);
        alert(`Startup risk status updated to ${st.atRisk ? 'At Risk' : 'Healthy'}`);
        navigate('admin-startups');
    }
}

function deleteStartup(id) {
    if (confirm('Are you sure you want to remove this startup from the cohort?')) {
        let startups = getStartups();
        startups = startups.filter(s => s.id !== id);
        saveStartups(startups);
        alert('Startup removed successfully.');
        navigate('admin-startups');
    }
}

function renderAdminUsers(container) {
    const users = getUsers();
    let html = `
        <div class="section-header">
            <div class="section-title">Ecosystem User Account Registry</div>
        </div>
        
        <div class="modeler-grid" style="grid-template-columns: 2fr 1fr;">
            
            <!-- List of Users -->
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User Name</th>
                            <th>Email Address</th>
                            <th>System Role</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td style="font-weight:600;">${u.name}</td>
                                <td>${u.email}</td>
                                <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'founder' ? 'badge-success' : 'badge-warning'}">${u.role}</span></td>
                                <td>
                                    ${u.email !== currentUser.email ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.email}')">Delete</button>` : '<em>Self</em>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Create New User Form -->
            <div class="form-card" style="padding: 20px;">
                <h4 style="font-size:14px; margin-bottom:12px; color: var(--bank-primary);">Provision Account</h4>
                <form onsubmit="adminCreateUser(event)">
                    <div class="form-group mb-20">
                        <label for="adName">Full Name</label>
                        <input type="text" id="adName" required>
                    </div>
                    <div class="form-group mb-20">
                        <label for="adEmail">Email Address</label>
                        <input type="email" id="adEmail" required>
                    </div>
                    <div class="form-group mb-20">
                        <label for="adPassword">Temp Password</label>
                        <input type="password" id="adPassword" value="password123" required>
                    </div>
                    <div class="form-group mb-20">
                        <label for="adRole">Platform Role</label>
                        <select id="adRole">
                            <option value="founder">Founder</option>
                            <option value="investor">Investor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">Create Account</button>
                </form>
            </div>

        </div>
    `;

    container.innerHTML = html;
}

function adminCreateUser(e) {
    e.preventDefault();
    const name = document.getElementById('adName').value.trim();
    const email = document.getElementById('adEmail').value.trim();
    const password = document.getElementById('adPassword').value;
    const role = document.getElementById('adRole').value;

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('User with this email already exists.');
        return;
    }

    users.push({ name, email, password, role });
    saveUsers(users);
    alert('User account provisioned.');
    navigate('admin-users');
}

function deleteUser(email) {
    if (confirm(`Are you sure you want to delete account ${email}?`)) {
        let users = getUsers();
        users = users.filter(u => u.email !== email);
        saveUsers(users);
        alert('User deleted.');
        navigate('admin-users');
    }
}
