import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// --- MOCK DATA FOR PREVIEW ---
let mockData = {
  niches: [
    { id: 'A-1-1', section: 'Cluster A', row: 1, col: 1, price: 220000, status: 'AVAILABLE', capacity: 6 },
    { id: 'A-1-2', section: 'Cluster A', row: 1, col: 2, price: 220000, status: 'RESERVED', capacity: 6 },
    { id: 'A-1-3', section: 'Cluster A', row: 1, col: 3, price: 220000, status: 'OCCUPIED', capacity: 6 },
  ],
  records: [
    { id: 1, firstName: 'Juan', lastName: 'Luna', nicheId: 'A-1-3', dateInterred: '2023-01-01' }
  ],
  reservations: [
    { id: 1, nicheId: 'A-1-2', reservedBy: 'Maria Clara', contactNumber: '09171234567', reservationDate: '2023-10-10', status: 'APPROVED' }
  ],
  users: [
    { id: 1, username: 'admin', role: 'ADMIN', lastLogin: null, status: 'ACTIVE', email: 'romulosabado2024@gmail.com' },
    { id: 2, username: 'staff1', role: 'STAFF', lastLogin: null, status: 'ACTIVE', email: 'staff1@example.com' }
  ]
};

// Simple OTP store: { [username]: { code: '123456', expires: Date } }
let otpStore: Record<string, { code: string; expires: number }> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger for debugging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // API MOCK HANDLERS (Flexible paths for subfolder hosting)
  const apiPrefix = "*/api";
  app.get(`${apiPrefix}/get_niches.php`, (req, res) => res.json(mockData.niches));
  app.get(`${apiPrefix}/get_records.php`, (req, res) => res.json(mockData.records));
  app.get(`${apiPrefix}/get_reservations.php`, (req, res) => res.json(mockData.reservations));
  app.get(`${apiPrefix}/get_users.php`, (req, res) => res.json(mockData.users));
  
  app.post(`${apiPrefix}/login.php`, (req, res) => {
    const { username, password } = req.body;
    // For demo: admin/admin or staff1/staff1
    const user = mockData.users.find(u => u.username === username);
    const validPass = (username === 'admin' && password === 'admin') || (username === 'staff1' && password === 'staff1');

    if (user && validPass) {
      // Step 1 Success: Generate and "send" OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore[username] = { code: otp, expires: Date.now() + 300000 }; // 5 mins

      console.log(`[SIMULATED EMAIL] To: ${user.email}`);
      console.log(`[SIMULATED EMAIL] Subject: Your OTP Code for Maria Della Strada Columbarium`);
      console.log(`[SIMULATED EMAIL] Body: Your verification code is: ${otp}`);

      res.json({ success: true, requireOTP: true, email: user.email });
    } else {
      res.json({ success: false, error: 'Invalid credentials. (Try admin/admin for demo)' });
    }
  });

  app.post(`${apiPrefix}/verify_otp.php`, (req, res) => {
    const { username, otp } = req.body;
    const stored = otpStore[username];

    if (stored && stored.code === otp && stored.expires > Date.now()) {
      const user = mockData.users.find(u => u.username === username);
      delete otpStore[username];
      res.json({ success: true, role: user?.role });
    } else {
      res.json({ success: false, error: 'Invalid or expired OTP.' });
    }
  });

  app.post(`${apiPrefix}/forgot_password.php`, (req, res) => {
    const { username } = req.body;
    const user = mockData.users.find(u => u.username === username);
    
    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore[username] = { code: otp, expires: Date.now() + 300000 };

      console.log(`[SIMULATED EMAIL] To: ${user.email}`);
      console.log(`[SIMULATED EMAIL] Subject: Password Reset OTP for ${username}`);
      console.log(`[SIMULATED EMAIL] Body: You requested a password reset. Use this code to verify: ${otp}`);
      
      res.json({ success: true, message: `OTP sent to your registered email: ${user.email.replace(/(.{2}).+(.{2})@/, '$1***$2@')}` });
    } else {
      res.json({ success: false, error: 'Username not found.' });
    }
  });

  app.post(`${apiPrefix}/create_user.php`, (req, res) => {
    const { username, password, email, role } = req.body;
    const existing = mockData.users.find(u => u.username === username);
    if (existing) {
      return res.json({ success: false, error: 'User already exists.' });
    }
    const newUser = {
      id: mockData.users.length + 1,
      username,
      email,
      role,
      status: 'ACTIVE',
      lastLogin: null
    };
    mockData.users.push(newUser);
    res.json({ success: true });
  });

  app.post(`${apiPrefix}/update_user.php`, (req, res) => {
    const { id, email, status } = req.body;
    const user = mockData.users.find(u => u.id === parseInt(id));
    if (user) {
      if (email) user.email = email;
      if (status) user.status = status;
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'User not found.' });
    }
  });

  app.get(`${apiPrefix}/setup_db.php`, (req, res) => {
    // This was previously a security risk. Now it only returns a message.
    // In a real app, this should be protected by a secret key or disabled after deployment.
    res.json({ 
      success: false, 
      error: 'Direct database reset is disabled for security. Please contact the administrator.' 
    });
  });

  // Fallback for all other .php calls to avoid "parse error"
  app.all(`${apiPrefix}/*.php`, (req, res) => {
    res.json({ success: true, message: 'Simulated PHP response' });
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
