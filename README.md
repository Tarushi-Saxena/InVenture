# 🚀 InVenture — Startup Incubator Management System

A clean, role-based Mini SaaS built for college projects.
**Stack (Migrated):** Python 3 · Streamlit · MySQL

---

## ⚡ Quick Start (5 steps)

### Step 1 — Install Dependencies
Make sure you have Python 3.10+ installed.
```bash
cd incubator
pip install -r requirements.txt
```

### Step 2 — Set up MySQL database
Open MySQL Workbench, phpMyAdmin, or the MySQL CLI and run:
```sql
SOURCE /full/path/to/incubator/schema.sql;
```
Or open `schema.sql` and paste its contents into your MySQL tool.

### Step 3 — Configure environment
The existing `.env` will be automatically read by python-dotenv. 
Ensure variables are correct:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password_here
DB_NAME=incubator_db
```

### Step 4 — Seed the database with demo data (if not already seeded)
Use your MySQL tool to insert the sample data provided at the bottom of `schema.sql`.

### Step 5 — Start the Streamlit application
```bash
streamlit run app.py
```
Open your browser at: **http://localhost:8501** (or whichever port Streamlit specifies).

---

## 🔐 Demo Login Accounts

Password for all accounts: **`password`**

| Role     | Email                   | What they can do |
|----------|-------------------------|------------------|
| Admin    | admin@incubator.com     | View all startups, add feedback, manage users |
| Founder  | alice@startup.com       | Manage EduTech Pro & MediTrack |
| Investor | carol@invest.com        | Browse matches (EdTech preference) |

---

## 📁 New Project Structure

```
incubator/
├── views_st/
│   ├── admin_view.py          ← Admin: startups, feedback, user management
│   ├── founder_view.py        ← Founder: update, upload, calculators
│   ├── investor_view.py       ← Investor: matchmaking, shortlist, preferences
│   └── startup_detail.py      ← Public startup detail page
├── uploads/                   ← Uploaded documents stored here
├── .env                       ← Environment variables
├── requirements.txt           ← Python dependencies
├── database.py                ← MySQL connection tools
├── auth.py                    ← Helper for login logic
├── app.py                     ← Streamlit main entrypoint
├── schema.sql                 ← Raw SQL schema (CREATE TABLE statements)
└── README.md                  ← This documentation
```
