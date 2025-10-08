require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ridedb' });

async function run(){
  console.log('Seeding DB...');
  const schema = fs.readFileSync(__dirname + '/../sql/schema.sql','utf-8');
  await pool.query(schema);
  const adminEmail = 'Inter9ja@gmail.com';
  const adminPass = 'AdminPass123!';
  const pwAdmin = await bcrypt.hash(adminPass, 10);
  await pool.query(`INSERT INTO users(name,email,phone,password_hash,role,verified) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role`, ['Admin', adminEmail, '+2348000000000', pwAdmin, 'admin', true]);
  const pw = await bcrypt.hash('password123', 10);
  await pool.query(`INSERT INTO users(name,email,phone,password_hash,role,verified) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`, ['Emeka','emeka@example.com','+2348010000001',pw,'driver',true]);
  await pool.query(`INSERT INTO users(name,email,phone,password_hash,role,verified) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`, ['Aisha','aisha@example.com','+2348010000002',pw,'rider',true]);
  await pool.query(`INSERT INTO rides(driver_id, origin, destination, departure_at, seats_available, price, notes)
    VALUES (1,'Lagos','Abuja', NOW() + interval '2 day', 3, 8000, 'Leaves Lekki'),
           (1,'Lagos','Ibadan', NOW() + interval '1 day', 2, 2500, 'Pickup at VI') ON CONFLICT DO NOTHING;`).catch(()=>{});
  console.log('Seeding complete. Admin:', adminEmail, 'Password:', adminPass);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
