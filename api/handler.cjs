const fs = require('fs');
const path = require('path');
const { StringDecoder } = require('string_decoder');
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const fallbackData = {
  niches: [
    { id: 'A-1-1', section: 'Cluster A', row: 1, col: 1, price: 220000, status: 'AVAILABLE', capacity: 6 },
    { id: 'A-1-2', section: 'Cluster A', row: 1, col: 2, price: 220000, status: 'RESERVED', capacity: 6 },
    { id: 'A-1-3', section: 'Cluster A', row: 1, col: 3, price: 220000, status: 'OCCUPIED', capacity: 6 }
  ],
  records: [
    { id: 'R-1', nicheId: 'A-1-3', firstName: 'Juan', lastName: 'Luna', dateOfBirth: '1900-01-01', dateOfDeath: '2023-01-01', intermentDate: '2023-01-01', notes: '' }
  ],
  reservations: [
    { id: 'RES-1', nicheId: 'A-1-2', reservedBy: 'Maria Clara', contactNumber: '09171234567', reservationDate: '2023-10-10', status: 'APPROVED' }
  ],
  users: [
    { id: 1, username: 'admin', role: 'ADMIN', lastLogin: null, status: 'ACTIVE', email: 'romulosabado2024@gmail.com', password: '$2y$10$0kZrh/1EochcEys6f9MZKeWlwT3s7OvounA8hD7aLZayOaXANwn0u' },
    { id: 2, username: 'staff1', role: 'STAFF', lastLogin: null, status: 'ACTIVE', email: 'staff1@example.com', password: '$2y$10$0kZrh/1EochcEys6f9MZKeWlwT3s7OvounA8hD7aLZayOaXANwn0u' }
  ]
};

const otpStore = {};
const demoCredentials = {
  admin: 'admin',
  staff1: 'staff1'
};

const shouldUseSsl = process.env.DB_SSL !== 'false' || String(process.env.DB_HOST || '').includes('planetscale.com');
const dbConfig = {
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || '',
  port: Number(process.env.DB_PORT || 3306),
  decimalNumbers: true,
  ssl: shouldUseSsl ? { rejectUnauthorized: true } : undefined
};

const schemaPath = path.resolve(__dirname, '..', 'database.sql');

async function createSchema() {
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    return { success: false, error: 'Database configuration is missing.' };
  }

  if (!fs.existsSync(schemaPath)) {
    return { success: false, error: 'Database schema file not found.' };
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  let connection;

  try {
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true
    });

    await connection.query(sql);

    const hash = await bcrypt.hash('admin', 10);
    await connection.execute(
      'INSERT INTO users (username, password, email, role, status) SELECT ?, ?, ?, ?, ? FROM dual WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ?)',
      ['admin', hash, 'romulosabado2024@gmail.com', 'ADMIN', 'ACTIVE', 'admin']
    );

    return { success: true, message: 'Database schema created and default admin seeded.' };
  } catch (error) {
    return { success: false, error: error.message || 'Schema creation failed.' };
  } finally {
    if (connection) await connection.end();
  }
}

function sendJson(res, payload, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve) => {
    const decoder = new StringDecoder('utf8');
    let body = '';
    req.on('data', (chunk) => {
      body += decoder.write(chunk);
    });
    req.on('end', () => {
      body += decoder.end();
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function getNextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function findUser(username) {
  return fallbackData.users.find((user) => user.username === username);
}

async function connectDb() {
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) return null;
  try {
    return await mysql.createConnection(dbConfig);
  } catch (error) {
    console.warn('MySQL connection failed:', error.message);
    return null;
  }
}

async function queryDb(sql, params = []) {
  const connection = await connectDb();
  if (!connection) return null;

  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('MySQL query failed:', error.message, sql, params);
    return null;
  } finally {
    await connection.end();
  }
}

async function executeDb(sql, params = []) {
  const connection = await connectDb();
  if (!connection) return null;

  try {
    const [result] = await connection.execute(sql, params);
    return result;
  } catch (error) {
    console.warn('MySQL execute failed:', error.message, sql, params);
    return null;
  } finally {
    await connection.end();
  }
}

async function verifyPassword(password, stored) {
  if (!stored) return false;
  try {
    const matched = await bcrypt.compare(password, stored);
    if (matched) return true;
  } catch (_err) {
    // fall through to plain-text fallback
  }
  return password === stored;
}

module.exports = async function handler(req, res) {
  const url = req.url || '';
  const query = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const path = (params.get('path') || '').replace(/\.php$/i, '').replace(/^\//, '');
  const data = await parseBody(req);

  if (req.method === 'OPTIONS') {
    return sendJson(res, { success: true });
  }

  const useDb = !!(dbConfig.host && dbConfig.user && dbConfig.database);

  switch (path) {
    case 'get_niches': {
      if (useDb) {
        const rows = await queryDb('SELECT * FROM niches');
        if (rows) {
          return sendJson(res, rows.map((row) => ({
            ...row,
            row: Number(row.row),
            col: Number(row.col),
            price: Number(row.price)
          })));
        }
      }
      return sendJson(res, fallbackData.niches);
    }
    case 'get_records': {
      if (useDb) {
        const rows = await queryDb('SELECT * FROM records');
        if (rows) return sendJson(res, rows);
      }
      return sendJson(res, fallbackData.records);
    }
    case 'get_reservations': {
      if (useDb) {
        const rows = await queryDb('SELECT * FROM reservations');
        if (rows) return sendJson(res, rows);
      }
      return sendJson(res, fallbackData.reservations);
    }
    case 'get_users': {
      if (useDb) {
        const rows = await queryDb('SELECT id, username, role, lastLogin, status, email FROM users');
        if (rows) return sendJson(res, rows);
      }
      return sendJson(res, fallbackData.users.map(({ password, ...user }) => user));
    }
    case 'setup_db': {
      if (!useDb) {
        return sendJson(res, { success: false, error: 'Database configuration is missing. Set DB_HOST, DB_USER, DB_NAME.', needs_setup: true });
      }
      const result = await createSchema();
      if (result.success) {
        return sendJson(res, { success: true, message: result.message, needs_setup: false });
      }
      return sendJson(res, { success: false, error: result.error, needs_setup: true });
    }
    case 'login': {
      const { username, password } = data;
      if (useDb) {
        const rows = await queryDb('SELECT * FROM users WHERE username = ? AND status = "ACTIVE" LIMIT 1', [username]);
        if (rows && rows.length === 1) {
          const userData = rows[0];
          if (await verifyPassword(password, userData.password)) {
            await executeDb('UPDATE users SET lastLogin = NOW() WHERE id = ?', [userData.id]);
            return sendJson(res, { success: true, role: userData.role });
          }
        }
      }

      const user = findUser(username);
      if (!user || demoCredentials[username] !== password) {
        return sendJson(res, { success: false, error: 'Invalid username or password.' });
      }
      const otp = '123456';
      otpStore[username] = { code: otp, expires: Date.now() + 300000 };
      console.log(`Demo OTP for ${username}: ${otp}`);
      return sendJson(res, { success: true, requireOTP: true, email: user.email });
    }
    case 'verify_otp': {
      const { username, otp } = data;
      const record = otpStore[username];
      if (record && record.code === otp && record.expires > Date.now()) {
        delete otpStore[username];
        const user = findUser(username);
        return sendJson(res, { success: true, role: user?.role || 'STAFF' });
      }
      return sendJson(res, { success: false, error: 'Invalid or expired OTP.' });
    }
    case 'forgot_password': {
      const { username } = data;
      if (useDb) {
        const rows = await queryDb('SELECT email FROM users WHERE username = ? LIMIT 1', [username]);
        if (rows && rows.length === 1) {
          const otp = '123456';
          otpStore[username] = { code: otp, expires: Date.now() + 300000 };
          console.log(`Demo password OTP for ${username}: ${otp}`);
          return sendJson(res, { success: true, message: `OTP sent to ${rows[0].email}` });
        }
      }
      const user = findUser(username);
      if (!user) return sendJson(res, { success: false, error: 'Username not found.' });
      const otp = '123456';
      otpStore[username] = { code: otp, expires: Date.now() + 300000 };
      console.log(`Demo password OTP for ${username}: ${otp}`);
      return sendJson(res, { success: true, message: `OTP sent to ${user.email}` });
    }
    case 'create_user': {
      if (useDb) {
        const existing = await queryDb('SELECT id FROM users WHERE username = ? LIMIT 1', [data.username]);
        if (existing && existing.length > 0) {
          return sendJson(res, { success: false, error: 'User already exists.' });
        }
        const hash = await bcrypt.hash(data.password || 'staff1', 10);
        const result = await executeDb('INSERT INTO users (username, password, email, role, status, lastLogin) VALUES (?, ?, ?, ?, ?, NULL)', [data.username, hash, data.email || '', data.role || 'STAFF', 'ACTIVE']);
        if (result) return sendJson(res, { success: true });
      }
      const existing = findUser(data.username);
      if (existing) return sendJson(res, { success: false, error: 'User already exists.' });
      fallbackData.users.push({
        id: getNextId(fallbackData.users),
        username: data.username,
        email: data.email || '',
        role: data.role || 'STAFF',
        status: 'ACTIVE',
        lastLogin: null,
        password: data.password || 'staff1'
      });
      return sendJson(res, { success: true });
    }
    case 'update_user': {
      if (useDb) {
        const result = await executeDb('UPDATE users SET email = ?, status = ? WHERE id = ?', [data.email || null, data.status || null, data.id]);
        if (result) return sendJson(res, { success: true });
      }
      const user = fallbackData.users.find((item) => String(item.id) === String(data.id));
      if (!user) return sendJson(res, { success: false, error: 'User not found.' });
      if (data.email) user.email = data.email;
      if (data.status) user.status = data.status;
      return sendJson(res, { success: true });
    }
    case 'create_niche': {
      if (useDb) {
        const id = data.id || `N-${Date.now()}`;
        const result = await executeDb('INSERT INTO niches (id, section, row, col, price, status) VALUES (?, ?, ?, ?, ?, ?)', [id, data.section || 'Cluster A', Number(data.row) || 1, Number(data.col) || 1, Number(data.price) || 0, data.status || 'AVAILABLE']);
        if (result) return sendJson(res, { success: true });
      }
      fallbackData.niches.push({ id: data.id || `NEW-${getNextId(fallbackData.niches)}`, section: data.section || 'Cluster A', row: Number(data.row) || 1, col: Number(data.col) || 1, price: Number(data.price) || 0, status: data.status || 'AVAILABLE', capacity: Number(data.capacity) || 6 });
      return sendJson(res, { success: true });
    }
    case 'update_niche': {
      if (useDb) {
        const result = await executeDb('UPDATE niches SET section = ?, row = ?, col = ?, price = ?, status = ? WHERE id = ?', [data.section, Number(data.row), Number(data.col), Number(data.price), data.status, data.id]);
        if (result) return sendJson(res, { success: true });
      }
      const niche = fallbackData.niches.find((item) => item.id === data.id);
      if (!niche) return sendJson(res, { success: false, error: 'Niche not found.' });
      Object.assign(niche, data);
      return sendJson(res, { success: true });
    }
    case 'delete_niche': {
      if (useDb) {
        const result = await executeDb('DELETE FROM niches WHERE id = ?', [data.id]);
        if (result) return sendJson(res, { success: true });
      }
      fallbackData.niches = fallbackData.niches.filter((item) => item.id !== data.id);
      return sendJson(res, { success: true });
    }
    case 'create_record': {
      if (useDb) {
        const id = data.id || `R-${Date.now()}`;
        const result = await executeDb('INSERT INTO records (id, nicheId, firstName, lastName, dateOfBirth, dateOfDeath, intermentDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, data.nicheId, data.firstName, data.lastName, data.dateOfBirth, data.dateOfDeath, data.intermentDate, data.notes || null]);
        if (result) return sendJson(res, { success: true });
      }
      fallbackData.records.push({ id: getNextId(fallbackData.records), nicheId: data.nicheId, firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth, dateOfDeath: data.dateOfDeath, intermentDate: data.intermentDate, notes: data.notes || '' });
      return sendJson(res, { success: true });
    }
    case 'create_reservation': {
      if (useDb) {
        const id = data.id || `RES-${Date.now()}`;
        const result = await executeDb('INSERT INTO reservations (id, nicheId, reservedBy, contactNumber, reservationDate, status) VALUES (?, ?, ?, ?, ?, ?)', [id, data.nicheId, data.reservedBy, data.contactNumber, data.reservationDate, data.status || 'PENDING']);
        if (result) return sendJson(res, { success: true });
      }
      fallbackData.reservations.push({ id: getNextId(fallbackData.reservations), nicheId: data.nicheId, reservedBy: data.reservedBy, contactNumber: data.contactNumber, reservationDate: data.reservationDate, status: data.status || 'PENDING' });
      return sendJson(res, { success: true });
    }
    case 'update_reservation': {
      if (useDb) {
        const result = await executeDb('UPDATE reservations SET status = ? WHERE id = ?', [data.status, data.id]);
        if (result) return sendJson(res, { success: true });
      }
      const reservation = fallbackData.reservations.find((item) => String(item.id) === String(data.id));
      if (!reservation) return sendJson(res, { success: false, error: 'Reservation not found.' });
      reservation.status = data.status || reservation.status;
      return sendJson(res, { success: true });
    }
    case 'delete_reservation': {
      if (useDb) {
        const result = await executeDb('DELETE FROM reservations WHERE nicheId = ?', [data.nicheId]);
        if (result) return sendJson(res, { success: true });
      }
      fallbackData.reservations = fallbackData.reservations.filter((item) => item.nicheId !== data.nicheId);
      return sendJson(res, { success: true });
    }
    case 'delete_record': {
      if (useDb) {
        const result = await executeDb('DELETE FROM records WHERE id = ?', [data.recordId]);
        if (result) return sendJson(res, { success: true });
      }
      fallbackData.records = fallbackData.records.filter((item) => String(item.id) !== String(data.recordId));
      return sendJson(res, { success: true });
    }
    default:
      return sendJson(res, { success: false, error: 'API route not found.' }, 404);
  }
};
