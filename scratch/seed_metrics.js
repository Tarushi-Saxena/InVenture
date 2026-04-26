const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('Seeding metrics...');
    
    // Clear old sample metrics to prevent duplicates if Rerunning
    await db.execute('DELETE FROM startup_metrics WHERE startup_id IN (1, 2, 3)');

    // EduTech Pro (1): High Efficiency (2x)
    await db.execute('INSERT INTO startup_metrics (startup_id, mrr, burn, users) VALUES (1, 80000, 40000, 1200)');
    
    // GreenHarvest (2): Low Efficiency (0.1x) - Heavy Burn
    await db.execute('INSERT INTO startup_metrics (startup_id, mrr, burn, users) VALUES (2, 5000, 50000, 150)');
    
    // MediTrack (3): Profitable (1.33x)
    await db.execute('INSERT INTO startup_metrics (startup_id, mrr, burn, users) VALUES (3, 200000, 150000, 5000)');

    console.log('Sample metrics successfully seeded.');
  } catch (err) {
    console.error('Seed Error:', err);
  } finally {
    process.exit();
  }
})();
