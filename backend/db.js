const mysql = require('mysql2');
require('dotenv').config();

// In-memory data store for fallback mock mode
let mockDb = {
    users: [
        { id: 1, name: 'Rajesh Kumar', email: 'admin@incubator.com', password: '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', role: 'admin' },
        { id: 2, name: 'Ananya Sharma', email: 'ananya@startup.com', password: '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', role: 'founder' },
        { id: 3, name: 'Priya Patel', email: 'priya@invest.com', password: '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', role: 'investor' },
        { id: 4, name: 'Rohan Gupta', email: 'rohan@startup.com', password: '$2a$10$3y6QyJg7t63rOchJ9f6j9OlL1nsw.D8J8Fk71f654yC3vUu8Wb.Fm', role: 'founder' }
    ],
    startups: [
        { id: 1, name: 'GreenHarvest', founder_id: 2, industry: 'AgriTech', stage: 'Idea', funding_needed: 2000000.00, description: 'AgriTech automated vertical farming with AI-powered analytics to optimize crop yield and conserve water.', cash: 300000.00, revenue: 20000.00, expenses: 80000.00, progress: 45, at_risk: true },
        { id: 2, name: 'AirAware AI', founder_id: 2, industry: 'GovTech', stage: 'Idea', funding_needed: 1500000.00, description: 'Air quality predictive modeling systems for municipal environmental agencies using distributed low-power IoT sensors.', cash: 120000.00, revenue: 5000.00, expenses: 35000.00, progress: 10, at_risk: true },
        { id: 3, name: 'EduTech Pro', founder_id: 4, industry: 'EdTech', stage: 'MVP', funding_needed: 5000000.00, description: 'AI-powered personalized tutoring platform that integrates into K-12 learning systems to support teachers.', cash: 1200000.00, revenue: 100000.00, expenses: 150000.00, progress: 65, at_risk: false }
    ],
    cap_table: [
        { startup_id: 1, stakeholder_name: 'Ananya Sharma', shares: 600000, is_founder: true },
        { startup_id: 1, stakeholder_name: 'Aarav Mehta', shares: 300000, is_founder: true },
        { startup_id: 1, stakeholder_name: 'Existing Employees', shares: 100000, is_founder: false },
        { startup_id: 2, stakeholder_name: 'Ananya Sharma', shares: 800000, is_founder: true },
        { startup_id: 2, stakeholder_name: 'Technical Co-founder', shares: 200000, is_founder: true },
        { startup_id: 3, stakeholder_name: 'Rohan Gupta', shares: 700000, is_founder: true },
        { startup_id: 3, stakeholder_name: 'Angel Investor', shares: 150000, is_founder: false },
        { startup_id: 3, stakeholder_name: 'Employee Option Pool', shares: 150000, is_founder: false }
    ],
    feedbacks: [
        { id: 1, startup_id: 3, rater_name: 'Priya Patel', rating: 4, category: 'Product', comment: 'Excellent technical progress on the pilot deployment. Needs scaling checks.', created_at: new Date() },
        { id: 2, startup_id: 3, rater_name: 'Rajesh Kumar', rating: 3, category: 'Market', comment: 'Market competition is high. Ensure IP protection is solid.', created_at: new Date() },
        { id: 3, startup_id: 1, rater_name: 'Priya Patel', rating: 4, category: 'Team', comment: 'Strong agronomics expertise in the co-founding team.', created_at: new Date() }
    ],
    preferences: {},
    shortlists: [
        { investor_id: 3, startup_id: 3, type: 'shortlisted' },
        { investor_id: 3, startup_id: 1, type: 'interested' }
    ]
};

let useMock = false;
let pool;

if (process.env.VERCEL && !process.env.DB_HOST) {
    console.warn('⚠️ Running on Vercel without DB_HOST. Bootstrapping project in fallback IN-MEMORY MOCK DB mode.');
    useMock = true;
} else {
    // Create connection pool
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'inventure_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // Check connection
    pool.getConnection((err, connection) => {
        if (err) {
            console.warn('⚠️ MySQL not detected. Bootstrapping project in fallback IN-MEMORY MOCK DB mode.');
            console.warn('👉 Use this to test the site instantly. Run backend/schema.sql on local MySQL to switch back to SQL persistence.');
            useMock = true;
        } else {
            console.log('✅ Connected to MySQL database successfully.');
            connection.release();
        }
    });
}

// Mock Query Runner
const mockQuery = async (sql, params = []) => {
    const cleanedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // USERS Queries
    if (cleanedSql.startsWith('select * from users where email = ?')) {
        const email = params[0].toLowerCase();
        const user = mockDb.users.find(u => u.email.toLowerCase() === email);
        return [user ? [user] : [], []];
    }
    if (cleanedSql.startsWith('insert into users')) {
        const id = mockDb.users.length + 1;
        mockDb.users.push({ id, name: params[0], email: params[1], password: params[2], role: params[3] });
        return [{ insertId: id }, []];
    }
    if (cleanedSql.startsWith('delete from users where email = ?')) {
        mockDb.users = mockDb.users.filter(u => u.email.toLowerCase() !== params[0].toLowerCase());
        return [{ affectedRows: 1 }, []];
    }
    if (cleanedSql.startsWith('select name, email, role from users')) {
        return [mockDb.users, []];
    }

    // STARTUPS Queries
    if (cleanedSql.startsWith('select * from startups where founder_id = ?')) {
        const found = mockDb.startups.filter(s => s.founder_id == params[0]);
        return [found, []];
    }
    if (cleanedSql.startsWith('select * from startups')) {
        return [mockDb.startups, []];
    }
    if (cleanedSql.startsWith('insert into startups')) {
        const id = mockDb.startups.length + 1;
        mockDb.startups.push({
            id, name: params[0], founder_id: params[1], industry: params[2], stage: params[3],
            funding_needed: params[4], description: params[5], cash: params[6], revenue: params[7],
            expenses: params[8], progress: params[9], at_risk: params[10]
        });
        return [{ insertId: id }, []];
    }
    if (cleanedSql.startsWith('delete from startups where id = ?')) {
        mockDb.startups = mockDb.startups.filter(s => s.id != params[0]);
        return [{ affectedRows: 1 }, []];
    }

    // CAP TABLE Queries
    if (cleanedSql.startsWith('select stakeholder_name as name, shares, is_founder as founder') ||
        cleanedSql.startsWith('select stakeholder_name as name, shares, is_founder as isfounder from cap_table')) {
        const id = params[0];
        const cap = mockDb.cap_table.filter(c => c.startup_id == id);
        return [cap, []];
    }
    if (cleanedSql.startsWith('delete from cap_table where startup_id = ?')) {
        mockDb.cap_table = mockDb.cap_table.filter(c => c.startup_id != params[0]);
        return [{ affectedRows: 1 }, []];
    }
    if (cleanedSql.startsWith('insert into cap_table')) {
        mockDb.cap_table.push({ startup_id: params[0], stakeholder_name: params[1], shares: params[2], is_founder: params[3] });
        return [{ affectedRows: 1 }, []];
    }

    // FEEDBACKS Queries
    if (cleanedSql.startsWith('select rater_name as author, rating, category, comment, date_format')) {
        const id = params[0];
        const fb = mockDb.feedbacks.filter(f => f.startup_id == id).map(f => ({
            author: f.rater_name,
            rating: f.rating,
            category: f.category,
            comment: f.comment,
            date: new Date(f.created_at).toISOString().split('T')[0]
        }));
        return [fb, []];
    }
    if (cleanedSql.startsWith('insert into feedbacks')) {
        mockDb.feedbacks.push({
            id: mockDb.feedbacks.length + 1,
            startup_id: params[0], rater_name: params[1], rating: params[2], category: params[3], comment: params[4], created_at: new Date()
        });
        return [{ affectedRows: 1 }, []];
    }

    // PREFERENCES Queries
    if (cleanedSql.startsWith('select industry, stage, min_capital as mincapital, max_capital as maxcapital from investor_preferences')) {
        const userId = params[0];
        const pref = mockDb.preferences[userId] || { industry: 'Any', stage: 'Any', minCapital: 0, maxCapital: 10000000 };
        return [[pref], []];
    }
    if (cleanedSql.startsWith('insert into investor_preferences')) {
        mockDb.preferences[params[0]] = {
            industry: params[1], stage: params[2], minCapital: params[3], maxCapital: params[4]
        };
        return [{ affectedRows: 1 }, []];
    }

    // SHORTLISTS Queries
    if (cleanedSql.startsWith('select s.id, s.name, s.funding_needed as fundingneeded, sl.type from shortlists')) {
        const investorId = params[0];
        const res = mockDb.shortlists.filter(sl => sl.investor_id == investorId).map(sl => {
            const s = mockDb.startups.find(x => x.id == sl.startup_id) || {};
            return { id: s.id, name: s.name, fundingNeeded: s.funding_needed, type: sl.type };
        });
        return [res, []];
    }
    if (cleanedSql.startsWith('select * from shortlists where investor_id = ? and startup_id = ? and type = ?')) {
        const found = mockDb.shortlists.filter(sl => sl.investor_id == params[0] && sl.startup_id == params[1] && sl.type == params[2]);
        return [found, []];
    }
    if (cleanedSql.startsWith('delete from shortlists where investor_id = ? and startup_id = ? and type = ?')) {
        mockDb.shortlists = mockDb.shortlists.filter(sl => !(sl.investor_id == params[0] && sl.startup_id == params[1] && sl.type == params[2]));
        return [{ affectedRows: 1 }, []];
    }
    if (cleanedSql.startsWith('insert into shortlists')) {
        mockDb.shortlists.push({ investor_id: params[0], startup_id: params[1], type: params[2] });
        return [{ affectedRows: 1 }, []];
    }

    // ADMIN Queries
    if (cleanedSql.includes('select count(*) as total from startups')) {
        return [[{ total: mockDb.startups.length }], []];
    }
    if (cleanedSql.includes('select count(*) as risk from startups where at_risk = true')) {
        return [[{ risk: mockDb.startups.filter(s => s.at_risk).length }], []];
    }
    if (cleanedSql.includes('select ifnull(round(avg(progress)), 0) as progress from startups')) {
        const sum = mockDb.startups.reduce((s, x) => s + x.progress, 0);
        const avg = mockDb.startups.length > 0 ? Math.round(sum / mockDb.startups.length) : 0;
        return [[{ progress: avg }], []];
    }
    if (cleanedSql.includes('select count(*) as users from users')) {
        return [[{ users: mockDb.users.length }], []];
    }
    if (cleanedSql.startsWith('select stage, count(*) as count from startups group by stage')) {
        const counts = {};
        mockDb.startups.forEach(s => counts[s.stage] = (counts[s.stage] || 0) + 1);
        const res = Object.keys(counts).map(k => ({ stage: k, count: counts[k] }));
        return [res, []];
    }

    return [[], []];
};

module.exports = {
    query: (sql, params) => {
        if (useMock) {
            return mockQuery(sql, params);
        }
        return pool.promise().query(sql, params);
    }
};
