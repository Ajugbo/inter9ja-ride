require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express();
app.use(cors());
app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/health', (req,res) => res.json({ok:true}));

// Auth (simple register/login)
app.post('/api/auth/register', async (req,res) => {
  try {
    const { name,email,phone,password,role } = req.body;
    if(!email || !password) return res.status(400).json({ error: 'email & password required' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query('INSERT INTO users(name,email,phone,password_hash,role,verified) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,email,role', [name,email,phone,hash,role||'rider',false]);
    const user = r.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    res.json({ user, token });
  } catch (e) { console.error(e); res.status(500).json({ error: 'registration_failed' }); }
});

app.post('/api/auth/login', async (req,res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: 'email & password required' });
    const r = await pool.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email]);
    const user = r.rows[0];
    if(!user) return res.status(401).json({ error: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok) return res.status(401).json({ error: 'invalid_credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
    res.json({ user: { id:user.id,name:user.name,email:user.email,role:user.role }, token });
  } catch (e) { console.error(e); res.status(500).json({ error: 'login_failed' }); }
});

// List rides
app.get('/api/rides', async (req,res) => {
  try {
    const q = 'SELECT r.*, u.name as driver_name FROM rides r LEFT JOIN users u ON u.id = r.driver_id ORDER BY departure_at ASC LIMIT 200';
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'db_error' }); }
});

// Bookings + Paystack init (demo)
app.post('/api/bookings', async (req,res) => {
  try {
    const { ride_id, passenger_email } = req.body;
    const tx_ref = 'tx_' + Date.now();
    const insert = await pool.query('INSERT INTO bookings(ride_id, passenger_id, seats_booked, status, payment_ref) VALUES($1,$2,$3,$4,$5) RETURNING *', [ride_id, 1, 1, 'pending', tx_ref]);
    const booking = insert.rows[0];
    let payment = { tx_ref };
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if(paystackKey){
      const rideRes = await pool.query('SELECT price FROM rides WHERE id=$1 LIMIT 1', [ride_id]);
      const amount = (rideRes.rows[0] && rideRes.rows[0].price) || 0;
      try {
        const init = await axios.post('https://api.paystack.co/transaction/initialize', {
          email: passenger_email || 'no-reply@example.com',
          amount: amount * 100,
          reference: tx_ref,
          metadata: { booking_id: booking.id }
        }, { headers: { Authorization: `Bearer ${paystackKey}` } });
        payment.authorization_url = init.data.data.authorization_url;
      } catch (e) { console.warn('paystack init failed', e?.response?.data || e.message); }
    }
    res.json({ booking, payment });
  } catch (e) { console.error(e); res.status(500).json({ error: 'booking_error' }); }
});

// Paystack webhook with signature verification
app.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), async (req,res) => {
  try {
    const signature = req.headers['x-paystack-signature'] || '';
    const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_yourkeyhere';
    const computed = crypto.createHmac('sha512', secret).update(req.body).digest('hex');
    if(computed !== signature) {
      console.warn('Invalid signature'); return res.status(401).send('invalid_signature');
    }
    const event = JSON.parse(req.body.toString());
    if(event.event === 'charge.success' && event.data){
      const ref = event.data.reference;
      const amount = Math.floor((event.data.amount || 0)/100);
      try {
        await pool.query('UPDATE bookings SET status=$1, paid_amount=$2 WHERE payment_ref=$3', ['paid', amount, ref]);
      } catch (e) { console.error('update booking', e); }
    }
    res.status(200).send('ok');
  } catch (e) { console.error('webhook error', e); res.status(500).send('error'); }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Backend listening on', PORT));
