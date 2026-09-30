import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { getSql, checkDbConnection, initializeDatabase, isDatabaseConfigured } from './db.js';
import { GRADE_FEE_STRUCTURES, INITIAL_STAFF_MEMBERS, StaffMember } from '../data/schoolData.js';

export const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Enable CORS for custom domain live deployment (e.g. https://www.dwpsballabgarh.org)
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-email');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Global request & database availability logger for Vercel Runtime Logs
app.use((req, _res, next) => {
  const method = req.method;
  const url = req.url;
  const dbConfigured = isDatabaseConfigured();
  console.log(`[DWPS API] 🌐 ${method} ${url} | Neon DATABASE_URL: ${dbConfigured ? 'CONNECTED' : 'NOT SET (check Vercel env & redeploy)'}`);
  next();
});

// Initialize DB schema on first startup if DATABASE_URL is provided
let dbInitAttempted = false;
async function ensureDbInit() {
  if (!dbInitAttempted && isDatabaseConfigured()) {
    dbInitAttempted = true;
    console.log('[NeonDB] 🚀 Triggering first-time schema verification/initialization...');
    await initializeDatabase();
  }
}

// 1. Health check & DB connection status
app.get('/api/health', async (_req, res) => {
  await ensureDbInit();
  const status = await checkDbConnection();
  console.log(`[NeonDB] Health check requested. Status ok: ${status.ok}, tables count: ${status.tables?.length || 0}`);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: status
  });
});

// Explicit manual trigger to initialize and verify database tables
app.all(['/api/db/init', '/api/init-db'], async (_req, res) => {
  console.log('[NeonDB] ⚡ Manual DB initialization requested via /api/db/init');
  const initResult = await initializeDatabase();
  const status = await checkDbConnection();
  res.json({
    action: 'initializeDatabase',
    result: initResult,
    currentStatus: status
  });
});

// Direct database status endpoint
app.get('/api/db/status', async (_req, res) => {
  const status = await checkDbConnection();
  res.json(status);
});

// 2. Admission Inquiries API
app.get('/api/inquiries', async (_req, res) => {
  await ensureDbInit();
  const sql = getSql();
  if (!sql) {
    console.log('[NeonDB] ⚠️ [GET /api/inquiries] DATABASE_URL is NOT set. Returning empty local data.');
    return res.json({ source: 'local', data: [] });
  }

  try {
    console.log('[NeonDB] 🔍 [GET /api/inquiries] Querying table "dwps_inquiries" from Neon...');

    // Auto-sync any tour bookings that do not exist in dwps_inquiries yet
    try {
      await sql`
        INSERT INTO dwps_inquiries (
          id, student_name, phone, email, grade, message, date, status, notes, priority, follow_up_date
        )
        SELECT 
          tb.id,
          tb.parent_name,
          tb.phone,
          COALESCE(tb.email, ''),
          COALESCE(NULLIF(tb.grade_interested, ''), 'Nursery'),
          '🏫 Campus Tour Scheduled: ' || COALESCE(tb.preferred_date, '') || ' (' || COALESCE(tb.preferred_slot, '') || ')',
          COALESCE(NULLIF(tb.preferred_date, ''), CURRENT_DATE::text),
          'Tour Scheduled',
          'Tour Pass ID: ' || tb.id || ' | Slot: ' || COALESCE(tb.preferred_slot, '') || ' | ' || COALESCE(tb.notes, ''),
          'High',
          tb.preferred_date
        FROM dwps_tour_bookings tb
        LEFT JOIN dwps_inquiries inq ON inq.id = tb.id
        WHERE inq.id IS NULL
        ON CONFLICT (id) DO NOTHING;
      `;
    } catch (syncErr) {
      console.warn('[NeonDB] Note on tour-bookings auto-sync to inquiries:', syncErr);
    }

    const rows = await sql`
      SELECT 
        id,
        student_name as "studentName",
        phone,
        email,
        grade,
        message,
        date,
        status,
        notes,
        priority,
        follow_up_date as "followUpDate",
        created_at as "createdAt"
      FROM dwps_inquiries
      ORDER BY created_at DESC
    `;
    console.log(`[NeonDB] ✅ [GET /api/inquiries] Retrieved ${rows.length} inquiries from Neon DB.`);
    return res.json({ source: 'neon', data: rows });
  } catch (err: any) {
    console.error('[NeonDB] ❌ [GET /api/inquiries] Error querying Neon:', err);
    return res.status(500).json({ error: 'Failed to fetch inquiries', details: err?.message });
  }
});

app.post('/api/inquiries', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const record = req.body;

  if (!record || !record.studentName || !record.phone) {
    console.warn('[NeonDB] ⚠️ [POST /api/inquiries] Bad request: Missing studentName or phone.');
    return res.status(400).json({ error: 'Missing required student name or contact phone.' });
  }

  const id = record.id || `inq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const dateStr = record.date || new Date().toISOString().split('T')[0];

  if (!sql) {
    console.warn('[NeonDB] ⚠️ [POST /api/inquiries] DATABASE_URL is NOT set in environment variables! Inquiry cannot be written to Neon.');
    return res.json({ source: 'local', saved: false, message: 'Database not connected in Vercel environment variables.' });
  }

  try {
    console.log(`[NeonDB] 💾 [POST /api/inquiries] Inserting inquiry for "${record.studentName}" (Grade: ${record.grade}) into Neon table "dwps_inquiries"...`);
    await sql`
      INSERT INTO dwps_inquiries (
        id, student_name, phone, email, grade, message, date, status, notes, priority, follow_up_date
      ) VALUES (
        ${id},
        ${record.studentName},
        ${record.phone},
        ${record.email || ''},
        ${record.grade || 'General Inquiry'},
        ${record.message || ''},
        ${dateStr},
        ${record.status || 'New'},
        ${record.notes || ''},
        ${record.priority || 'Normal'},
        ${record.followUpDate || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        student_name = EXCLUDED.student_name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        grade = EXCLUDED.grade,
        message = EXCLUDED.message,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        priority = EXCLUDED.priority,
        follow_up_date = EXCLUDED.follow_up_date;
    `;
    console.log(`[NeonDB] 🎉 [POST /api/inquiries] Successfully inserted/updated record ID "${id}" in Neon!`);
    return res.json({ source: 'neon', saved: true, id });
  } catch (err: any) {
    console.error('[NeonDB] ❌ [POST /api/inquiries] Error saving inquiry to Neon:', err);
    return res.status(500).json({ error: 'Failed to save inquiry to database', details: err?.message });
  }
});

app.patch('/api/inquiries/:id', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const { id } = req.params;
  const { status, notes, priority, followUpDate } = req.body;

  if (!sql) {
    return res.json({ source: 'local', updated: false });
  }

  try {
    await sql`
      UPDATE dwps_inquiries
      SET 
        status = COALESCE(${status}, status),
        notes = COALESCE(${notes}, notes),
        priority = COALESCE(${priority}, priority),
        follow_up_date = COALESCE(${followUpDate}, follow_up_date)
      WHERE id = ${id}
    `;
    return res.json({ source: 'neon', updated: true, id });
  } catch (err: any) {
    console.error('Error updating inquiry in Neon:', err);
    return res.status(500).json({ error: 'Failed to update inquiry', details: err?.message });
  }
});

// 3. Campus Tour Bookings API
app.get('/api/tour-bookings', async (_req, res) => {
  await ensureDbInit();
  const sql = getSql();
  if (!sql) {
    return res.json({ source: 'local', data: [] });
  }

  try {
    const rows = await sql`
      SELECT 
        id,
        parent_name as "parentName",
        phone,
        email,
        preferred_date as "preferredDate",
        preferred_slot as "preferredSlot",
        grade_interested as "gradeInterested",
        notes,
        status,
        created_at as "createdAt"
      FROM dwps_tour_bookings
      ORDER BY created_at DESC
    `;
    return res.json({ source: 'neon', data: rows });
  } catch (err: any) {
    console.error('Error fetching tour bookings:', err);
    return res.status(500).json({ error: 'Failed to fetch tour bookings', details: err?.message });
  }
});

app.post('/api/tour-bookings', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const record = req.body;

  if (!record || !record.parentName || !record.phone) {
    return res.status(400).json({ error: 'Missing parent name or phone number.' });
  }

  const id = record.id || `tour-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  if (!sql) {
    console.warn('[NeonDB] ⚠️ [POST /api/tour-bookings] DATABASE_URL is not set. Saving to local session.');
    return res.json({ source: 'local', saved: false, message: 'Saved in local browser session.' });
  }

  try {
    console.log(`[NeonDB] 💾 [POST /api/tour-bookings] Saving tour booking for "${record.parentName}" (Date: ${record.preferredDate})...`);
    await sql`
      INSERT INTO dwps_tour_bookings (
        id, parent_name, phone, email, preferred_date, preferred_slot, grade_interested, notes, status
      ) VALUES (
        ${id},
        ${record.parentName},
        ${record.phone},
        ${record.email || ''},
        ${record.preferredDate || ''},
        ${record.preferredSlot || 'Morning 10:00 AM'},
        ${record.gradeInterested || ''},
        ${record.notes || ''},
        ${record.status || 'Confirmed'}
      )
    `;

    // Also mirror to dwps_inquiries so it immediately appears in the Lead Board
    const inquiryMsg = `🏫 Campus Tour Scheduled: ${record.preferredDate || ''} (${record.preferredSlot || 'Morning Batch'}). Interests: ${record.notes || 'Campus walkthrough'}`;
    const today = new Date().toISOString().split('T')[0];
    await sql`
      INSERT INTO dwps_inquiries (
        id, student_name, phone, email, grade, message, date, status, notes, priority, follow_up_date
      ) VALUES (
        ${id},
        ${record.parentName},
        ${record.phone},
        ${record.email || ''},
        ${record.gradeInterested || 'Nursery'},
        ${inquiryMsg},
        ${today},
        'Tour Scheduled',
        ${'Tour Pass ID: ' + id + ' | Slot: ' + (record.preferredSlot || '') + ' | ' + (record.notes || '')},
        'High',
        ${record.preferredDate || today}
      )
      ON CONFLICT (id) DO UPDATE SET
        student_name = EXCLUDED.student_name,
        phone = EXCLUDED.phone,
        status = 'Tour Scheduled',
        notes = EXCLUDED.notes;
    `;

    console.log(`[NeonDB] 🎉 [POST /api/tour-bookings] Successfully saved tour booking ID "${id}" and mirrored to Lead Board in Neon!`);
    return res.json({ source: 'neon', saved: true, id });
  } catch (err: any) {
    console.error('[NeonDB] ❌ [POST /api/tour-bookings] Error saving tour booking to Neon:', err);
    return res.status(500).json({ error: 'Failed to save tour booking', details: err?.message });
  }
});

// 4. Newsletter Subscribers API
app.post('/api/newsletter/subscribe', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!sql) {
    return res.json({ source: 'local', saved: false, message: 'Saved in local session.' });
  }

  try {
    const id = `sub-${Date.now()}`;
    await sql`
      INSERT INTO dwps_newsletter_subscribers (id, email)
      VALUES (${id}, ${email.trim().toLowerCase()})
      ON CONFLICT (email) DO NOTHING
    `;
    return res.json({ source: 'neon', saved: true, email: email.trim().toLowerCase() });
  } catch (err: any) {
    console.error('Error subscribing email:', err);
    return res.status(500).json({ error: 'Subscription failed', details: err?.message });
  }
});

// 5. School Announcements API
app.get('/api/announcements', async (_req, res) => {
  await ensureDbInit();
  const sql = getSql();
  if (!sql) {
    return res.json({ source: 'local', data: [] });
  }

  try {
    const rows = await sql`
      SELECT 
        id,
        title,
        category,
        date,
        content,
        badge,
        is_urgent as "isUrgent",
        action_label as "actionLabel",
        action_link as "actionLink"
      FROM dwps_announcements
      ORDER BY created_at DESC
    `;
    return res.json({ source: 'neon', data: rows });
  } catch (err: any) {
    console.error('Error fetching announcements from Neon:', err);
    return res.status(500).json({ error: 'Failed to fetch announcements', details: err?.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const ann = req.body;

  if (!ann || !ann.title || !ann.content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  if (!sql) {
    return res.json({ source: 'local', saved: false });
  }

  try {
    const id = ann.id || `ann-${Date.now()}`;
    await sql`
      INSERT INTO dwps_announcements (
        id, title, category, date, content, badge, is_urgent, action_label, action_link
      ) VALUES (
        ${id},
        ${ann.title},
        ${ann.category || 'General'},
        ${ann.date || new Date().toISOString().split('T')[0]},
        ${ann.content},
        ${ann.badge || null},
        ${Boolean(ann.isUrgent)},
        ${ann.actionLabel || null},
        ${ann.actionLink || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        date = EXCLUDED.date,
        content = EXCLUDED.content,
        badge = EXCLUDED.badge,
        is_urgent = EXCLUDED.is_urgent,
        action_label = EXCLUDED.action_label,
        action_link = EXCLUDED.action_link;
    `;
    return res.json({ source: 'neon', saved: true, id });
  } catch (err: any) {
    console.error('Error saving announcement to Neon:', err);
    return res.status(500).json({ error: 'Failed to save announcement', details: err?.message });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const { id } = req.params;

  if (!sql) {
    return res.json({ source: 'local', deleted: false });
  }

  try {
    await sql`DELETE FROM dwps_announcements WHERE id = ${id}`;
    return res.json({ source: 'neon', deleted: true, id });
  } catch (err: any) {
    console.error('Error deleting announcement in Neon:', err);
    return res.status(500).json({ error: 'Failed to delete announcement', details: err?.message });
  }
});

// 5b. School Admin Authentication & User Management API
let serverCustomAdminPassword: string | null = null;

export interface SecureOtpRecord {
  email: string;
  userId?: string;
  hashedOtp: string; // HMAC-SHA256 hash of OTP with random salt
  salt: string;
  createdAt: number;
  expiresAt: number; // 10 minutes from creation
  attempts: number; // failed verify attempts
  maxAttempts: number; // 5 attempts max
  verified: boolean;
  verifiedAt?: number;
  used: boolean;
  usedAt?: number;
  resetToken?: string;
  resetTokenExpiresAt?: number;
}

export const activeSecureOtps = new Map<string, SecureOtpRecord>();

// Cooldown and rate-limiting map: key = email, value = { lastRequestTime, requestCount, windowStart }
export const otpRequestLimits = new Map<string, { lastRequestTime: number; requestCount: number; windowStart: number }>();

export function hashOtpValue(otp: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(otp.trim()).digest('hex');
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  userId: string;
  mobile: string;
  designation: string;
  password?: string;
  role: string;
  status: string;
  createdAt: string;
}

const defaultAdminUsers: AdminUserRecord[] = [
  {
    id: 'user-admin-1',
    name: 'DWPS Ballabgarh Administration',
    email: 'dwpsballabgarh@gmail.com',
    userId: 'dwpsballabgarh',
    mobile: '+91 97170 82348',
    designation: 'Institutional Head Office & Reception',
    password: 'dwps2026',
    role: 'Official School Administrator',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-admin-2',
    name: 'Mr. Rahul Chaudhary',
    email: 'rahul@dwpsballabgarh.org',
    userId: 'rahul@dwpsballabgarh.org',
    mobile: '+91 97170 82348',
    designation: 'Founder & School Director',
    password: 'dwps2026',
    role: 'Executive Director',
    status: 'Active',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

let inMemoryAdminUsers: AdminUserRecord[] = [...defaultAdminUsers];

// Fetch all registered admin users
app.get('/api/admin/users', async (_req, res) => {
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, name, email, user_id as "userId", mobile, designation, role, status, created_at as "createdAt"
        FROM dwps_admin_users
        ORDER BY created_at ASC
      `;
      if (rows && rows.length > 0) {
        return res.json({ success: true, data: rows });
      }
    } catch (err) {
      console.warn('[Admin Users] DB query failed, falling back to in-memory store:', err);
    }
  }

  const sanitized = inMemoryAdminUsers.map(({ password: _p, ...u }) => u);
  return res.json({ success: true, data: sanitized });
});

// Create new institutional user account (Name, User Email ID, User ID, Mobile No, Designation)
app.post('/api/admin/users', async (req, res) => {
  const requester = (req.headers['x-admin-email'] || req.body?.requesterEmail || '').toString().trim().toLowerCase();
  if (requester !== 'dwpsballabgarh@gmail.com') {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only user dwpsballabgarh@gmail.com is authorized to create new user accounts.'
    });
  }

  const { name, email, userId, mobile, designation, password, role } = req.body || {};

  if (!name || !email || !userId || !mobile || !designation) {
    return res.status(400).json({
      success: false,
      error: 'All fields (Name, User Email ID, User ID, Mobile No, Designation) are mandatory.'
    });
  }

  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanUserId = (userId || '').trim().toLowerCase().replace(/\s+/g, '');
  const cleanMobile = (mobile || '').trim();
  const cleanDesignation = (designation || '').trim();
  const userPassword = (password || '').trim() || 'dwps2026';
  const newId = `user-admin-${Date.now()}`;
  const now = new Date().toISOString();

  // Validate duplicate user ID or email
  const duplicate = inMemoryAdminUsers.find(
    u => u.userId.toLowerCase() === cleanUserId || u.email.toLowerCase() === cleanEmail
  );
  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: `A user with User ID "${cleanUserId}" or Email "${cleanEmail}" already exists.`
    });
  }

  const newUser: AdminUserRecord = {
    id: newId,
    name: cleanName,
    email: cleanEmail,
    userId: cleanUserId,
    mobile: cleanMobile,
    designation: cleanDesignation,
    password: userPassword,
    role: role || 'Administrator',
    status: 'Active',
    createdAt: now
  };

  const sql = getSql();
  if (sql) {
    try {
      await sql`
        INSERT INTO dwps_admin_users (id, name, email, user_id, mobile, designation, password, role, status, created_at)
        VALUES (${newId}, ${cleanName}, ${cleanEmail}, ${cleanUserId}, ${cleanMobile}, ${cleanDesignation}, ${userPassword}, ${newUser.role}, 'Active', ${now})
        ON CONFLICT (id) DO NOTHING
      `;
    } catch (err: any) {
      console.error('[Admin Users] DB insert failed:', err);
      if (err?.message?.includes('unique') || err?.message?.includes('duplicate')) {
        return res.status(409).json({
          success: false,
          error: `User ID "${cleanUserId}" or Email "${cleanEmail}" is already in use in database.`
        });
      }
    }
  }

  inMemoryAdminUsers.push(newUser);
  console.log(`[Admin Users] ✅ Created new user account: ${cleanName} (${cleanUserId}) - ${cleanDesignation}`);

  const { password: _p, ...sanitized } = newUser;
  return res.status(201).json({
    success: true,
    message: `Institutional user account for "${cleanName}" created successfully!`,
    user: sanitized
  });
});

// Delete user account
app.delete('/api/admin/users/:id', async (req, res) => {
  const requester = (req.headers['x-admin-email'] || req.query.requesterEmail || req.body?.requesterEmail || '').toString().trim().toLowerCase();
  if (requester !== 'dwpsballabgarh@gmail.com') {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only user dwpsballabgarh@gmail.com is authorized to delete user accounts.'
    });
  }

  const { id } = req.params;
  if (id === 'user-admin-1' || id === 'user-admin-2') {
    return res.status(403).json({
      success: false,
      error: 'Primary institutional master administrator accounts cannot be deleted.'
    });
  }

  const sql = getSql();
  if (sql) {
    try {
      await sql`DELETE FROM dwps_admin_users WHERE id = ${id}`;
    } catch (err) {
      console.error('[Admin Users] Failed to delete from DB:', err);
    }
  }

  inMemoryAdminUsers = inMemoryAdminUsers.filter(u => u.id !== id);
  return res.json({ success: true, message: 'User account removed successfully.' });
});

// Update created user details and/or password
app.put('/api/admin/users/:id', async (req, res) => {
  const requester = (req.headers['x-admin-email'] || req.body?.requesterEmail || '').toString().trim().toLowerCase();
  const { id } = req.params;
  const { name, email, userId, mobile, designation, password, role, status } = req.body || {};

  const isSuper = requester === 'dwpsballabgarh@gmail.com';

  // Find existing user in DB or in-memory
  const sql = getSql();
  let existingUser: any = null;
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, name, email, user_id as "userId", mobile, designation, password, role, status, created_at as "createdAt"
        FROM dwps_admin_users
        WHERE id = ${id}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        existingUser = rows[0];
      }
    } catch (err) {
      console.warn('[Admin Users] DB lookup for update failed:', err);
    }
  }

  if (!existingUser) {
    existingUser = inMemoryAdminUsers.find(u => u.id === id);
  }

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      error: `User account with ID "${id}" was not found.`
    });
  }

  const isSelf =
    (existingUser.email && existingUser.email.toLowerCase() === requester) ||
    (existingUser.userId && existingUser.userId.toLowerCase() === requester);

  if (!isSuper && !isSelf) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only user dwpsballabgarh@gmail.com or the account owner is authorized to modify this user account.'
    });
  }

  const cleanName = (name !== undefined ? name : existingUser.name).toString().trim();
  const cleanEmail = (email !== undefined ? email : existingUser.email).toString().trim().toLowerCase();
  const cleanUserId = (userId !== undefined ? userId : (existingUser.userId || existingUser.user_id)).toString().trim().toLowerCase().replace(/\s+/g, '');
  const cleanMobile = (mobile !== undefined ? mobile : existingUser.mobile).toString().trim();
  const cleanDesignation = (designation !== undefined ? designation : existingUser.designation).toString().trim();
  const cleanRole = (role !== undefined ? role : (existingUser.role || 'Administrator')).toString().trim();
  const cleanStatus = (status !== undefined ? status : (existingUser.status || 'Active')).toString().trim();

  let finalPassword = existingUser.password;
  let passwordChanged = false;
  if (password && typeof password === 'string' && password.trim().length > 0) {
    const trimmedPw = password.trim();
    if (trimmedPw.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }
    finalPassword = trimmedPw;
    passwordChanged = true;
  }

  // Check duplicate user_id or email with OTHER users
  if (cleanUserId !== (existingUser.userId || existingUser.user_id) || cleanEmail !== existingUser.email) {
    const duplicate = inMemoryAdminUsers.find(
      u => u.id !== id && (u.userId.toLowerCase() === cleanUserId || u.email.toLowerCase() === cleanEmail)
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `Another user with User ID "${cleanUserId}" or Email "${cleanEmail}" already exists.`
      });
    }
  }

  if (sql) {
    try {
      await sql`
        UPDATE dwps_admin_users
        SET 
          name = ${cleanName},
          email = ${cleanEmail},
          user_id = ${cleanUserId},
          mobile = ${cleanMobile},
          designation = ${cleanDesignation},
          password = ${finalPassword},
          role = ${cleanRole},
          status = ${cleanStatus}
        WHERE id = ${id}
      `;
    } catch (err: any) {
      console.error('[Admin Users] DB update failed:', err);
      if (err?.message?.includes('unique') || err?.message?.includes('duplicate')) {
        return res.status(409).json({
          success: false,
          error: `User ID "${cleanUserId}" or Email "${cleanEmail}" is already taken.`
        });
      }
    }
  }

  // Update in memory
  const idx = inMemoryAdminUsers.findIndex(u => u.id === id);
  const updatedUser: AdminUserRecord = {
    id,
    name: cleanName,
    email: cleanEmail,
    userId: cleanUserId,
    mobile: cleanMobile,
    designation: cleanDesignation,
    password: finalPassword,
    role: cleanRole,
    status: cleanStatus,
    createdAt: existingUser.createdAt || existingUser.created_at || new Date().toISOString()
  };

  if (idx !== -1) {
    inMemoryAdminUsers[idx] = updatedUser;
  } else {
    inMemoryAdminUsers.push(updatedUser);
  }

  if (cleanEmail === 'dwpsballabgarh@gmail.com' || cleanUserId === 'dwpsballabgarh') {
    if (passwordChanged) {
      serverCustomAdminPassword = finalPassword;
    }
  }

  console.log(`[Admin Users] ✅ Successfully updated user "${cleanName}" (${cleanUserId}) - Password Changed: ${passwordChanged}`);

  const { password: _p, ...sanitized } = updatedUser;
  return res.json({
    success: true,
    message: passwordChanged
      ? `User account and password updated successfully! "${cleanName}" can now log in with the new password in Admin Login.`
      : `User account details updated successfully for "${cleanName}".`,
    user: sanitized,
    passwordChanged
  });
});

// Dedicated endpoint to edit password for created users
app.patch('/api/admin/users/:id/password', async (req, res) => {
  const requester = (req.headers['x-admin-email'] || req.body?.requesterEmail || '').toString().trim().toLowerCase();
  const { id } = req.params;
  const { newPassword } = req.body || {};

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password is required and must contain at least 6 characters.'
    });
  }

  const trimmedPw = newPassword.trim();
  const isSuper = requester === 'dwpsballabgarh@gmail.com';

  const sql = getSql();
  let existingUser: any = null;
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, name, email, user_id as "userId", password
        FROM dwps_admin_users
        WHERE id = ${id}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        existingUser = rows[0];
      }
    } catch (err) {
      console.warn('[Admin Users] DB lookup for password patch failed:', err);
    }
  }

  if (!existingUser) {
    existingUser = inMemoryAdminUsers.find(u => u.id === id);
  }

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      error: `User account with ID "${id}" was not found.`
    });
  }

  const isSelf =
    (existingUser.email && existingUser.email.toLowerCase() === requester) ||
    (existingUser.userId && existingUser.userId.toLowerCase() === requester);

  if (!isSuper && !isSelf) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only user dwpsballabgarh@gmail.com or account owner can update password.'
    });
  }

  if (sql) {
    try {
      await sql`
        UPDATE dwps_admin_users
        SET password = ${trimmedPw}
        WHERE id = ${id}
      `;
    } catch (err) {
      console.error('[Admin Users] DB password update failed:', err);
    }
  }

  const memUser = inMemoryAdminUsers.find(u => u.id === id);
  if (memUser) {
    memUser.password = trimmedPw;
  }

  if (existingUser.email?.toLowerCase() === 'dwpsballabgarh@gmail.com' || existingUser.userId?.toLowerCase() === 'dwpsballabgarh') {
    serverCustomAdminPassword = trimmedPw;
  }

  console.log(`[Admin Users] 🔑 Password updated for user: ${existingUser.name} (${existingUser.userId || existingUser.id})`);

  return res.json({
    success: true,
    message: `Password for "${existingUser.name}" updated successfully! The user can now log in using this new password in Admin Login.`
  });
});

app.post('/api/admin/login', async (req, res) => {
  const { loginId, password } = req.body || {};
  const cleanString = (str: string) =>
    (str || '').replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();

  const normalizedId = cleanString(loginId).toLowerCase();
  let normalizedPw = cleanString(password);
  if (normalizedPw.startsWith('-')) {
    normalizedPw = cleanString(normalizedPw.substring(1));
  }

  // Master password check
  const isMasterPassword =
    normalizedPw.toLowerCase() === 'rahul#dwps2026' ||
    normalizedPw.toLowerCase() === 'rahul@dwps2026' ||
    normalizedPw.toLowerCase() === 'rahul2026' ||
    normalizedPw.toLowerCase() === 'rahul#2026' ||
    normalizedPw === 'dwps#2026' ||
    normalizedPw === 'dwps2026' ||
    (serverCustomAdminPassword !== null && normalizedPw === serverCustomAdminPassword);

  // 1. Check in Neon DB first if available
  const sql = getSql();
  let matchedUser: any = null;
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, name, email, user_id as "userId", mobile, designation, password, role, status
        FROM dwps_admin_users
        WHERE LOWER(user_id) = ${normalizedId} OR LOWER(email) = ${normalizedId}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        matchedUser = rows[0];
      }
    } catch (err) {
      console.warn('[Admin Login] DB query failed, checking memory:', err);
    }
  }

  // 2. Check in memory
  if (!matchedUser) {
    matchedUser = inMemoryAdminUsers.find(
      u => u.userId.toLowerCase() === normalizedId || u.email.toLowerCase() === normalizedId
    );
  }

  if (matchedUser) {
    const isPasswordCorrect = isMasterPassword || matchedUser.password === normalizedPw;
    if (isPasswordCorrect) {
      return res.json({
        success: true,
        user: {
          name: matchedUser.name,
          role: matchedUser.role || matchedUser.designation,
          email: matchedUser.email,
          userId: matchedUser.userId,
          designation: matchedUser.designation,
          mobile: matchedUser.mobile
        }
      });
    }
  }

  // 3. Director shortcut aliases
  const isValidDirectorAlias =
    normalizedId === 'rahul@dwps' ||
    normalizedId === 'rahul' ||
    normalizedId === 'rahul@dwpsballabgarh' ||
    normalizedId === 'csc121004@gmail.com';

  if (isValidDirectorAlias && isMasterPassword) {
    return res.json({
      success: true,
      user: {
        name: 'Mr. Rahul Chaudhary',
        role: 'School Director / Executive Administrator',
        email: 'Rahul@dwpsballabgarh.org',
        userId: 'rahul@dwpsballabgarh.org',
        designation: 'Founder & School Director',
        mobile: '+91 97170 82348'
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid Institutional User ID, Email, or Password.'
  });
});

// Helper to build RFC 2822 encoded raw email string for Google Gmail API
function buildRawEmail({
  from,
  to,
  cc,
  subject,
  html,
}: {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
}): string {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html.trim(),
  ];
  return Buffer.from(messageParts.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate secure HTML email template for OTP
function buildOtpEmailHtml(otp: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #021936; margin: 0; font-family: serif; font-size: 22px;">Disney World Public School</h2>
        <p style="color: #904d00; font-weight: 700; margin: 4px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Institutional Portal Security</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 14px; color: #1e293b; line-height: 1.6; margin-bottom: 8px;">Hello Administrator,</p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">A verification request was initiated to reset your institutional administrator password.</p>
      <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0;">
        <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 8px; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px;">One-Time Security Verification Code</span>
        <span style="font-size: 36px; font-weight: 800; color: #021936; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; display: inline-block;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This verification code is strictly confidential and will expire in <b>10 minutes</b>. If you did not initiate this request, please inform the school administration immediately.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Disney World Public School • Subhash Colony, Ballabgarh, Faridabad - 121004</p>
    </div>
  `;
}

// Dispatch live emails using Google OAuth2 (googleapis REST API)
async function sendGmailWithOAuth2(
  targetEmail: string,
  otp: string,
  gmailUser: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  ccEmail?: string
): Promise<{ sent: boolean; method: string; info?: string }> {
  console.log(`[OAuth2 Dispatcher] 🔑 Attempting Google OAuth2 REST dispatch via googleapis...`);

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const tokenRes = await oauth2Client.getAccessToken();
  if (!tokenRes || !tokenRes.token) {
    throw new Error('Failed to obtain a valid access token using the provided Google OAuth2 refresh_token.');
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const raw = buildRawEmail({
    from: `"Disney World Public School" <${gmailUser}>`,
    to: targetEmail,
    cc: ccEmail,
    subject: `[DWPS Security] Administrator Password Reset Verification Code`,
    html: buildOtpEmailHtml(otp),
  });

  const sendRes = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  console.log(`[OAuth2 Dispatcher] 🚀 Email delivered successfully via Google OAuth2 REST API! Message ID: ${sendRes.data.id}`);
  return {
    sent: true,
    method: 'googleapis-oauth2',
    info: sendRes.data.id || undefined,
  };
}

// Production-ready email dispatcher supporting generic SMTP and Gmail configurations
async function sendOtpEmail({
  targetEmail,
  otp,
  officialEmail
}: {
  targetEmail: string;
  otp: string;
  officialEmail: string;
}): Promise<{
  sent: boolean;
  method: string;
  info?: string;
  error?: string;
  errorCode?: string;
  diagnostics?: Record<string, any>;
}> {
  const configuredOfficial = (process.env.OFFICIAL_EMAIL || process.env.ADMIN_EMAIL || officialEmail || 'dwpsballabgarh@gmail.com').trim();
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || configuredOfficial).trim();
  const rawSmtpPass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim();
  const smtpPass = rawSmtpPass.replace(/[\s-]+/g, '');
  const isSmtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  // Send a copy to the configured official/admin email using CC
  const shouldCcAdmin = configuredOfficial && targetEmail.toLowerCase() !== configuredOfficial.toLowerCase();
  const ccRecipient = shouldCcAdmin ? configuredOfficial : undefined;

  console.log(`[Email Dispatcher] 📧 Initiating OTP dispatch (CC to Admin: ${configuredOfficial})...`);

  // 1. Check custom SMTP configuration if SMTP_HOST is set
  if (smtpHost && smtpPass) {
    try {
      console.log(`[Email Dispatcher] 🔌 Connecting to custom SMTP server ${smtpHost}:${smtpPort}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: isSmtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const mailOptions = {
        from: `"Disney World Public School" <${smtpUser}>`,
        to: targetEmail,
        ...(ccRecipient ? { cc: ccRecipient } : {}),
        subject: `[DWPS Security] Administrator Password Reset Verification Code`,
        html: buildOtpEmailHtml(otp),
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`[Email Dispatcher] ✅ Email delivered via SMTP server (${smtpHost}). Message ID: ${result.messageId}`);
      return {
        sent: true,
        method: `smtp-${smtpHost}`,
        info: result.messageId,
        diagnostics: {
          host: smtpHost,
          port: smtpPort,
          cc: ccRecipient,
          verified: true
        }
      };
    } catch (smtpErr: any) {
      console.error(`[Email Dispatcher] ❌ Custom SMTP failed: ${smtpErr?.message}`);
      // Fall through to other configured methods
    }
  }

  // 2. Google OAuth2 credentials (googleapis REST API)
  const oauthClientId = (process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || '').trim();
  const oauthClientSecret = (process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || '').trim();
  const oauthRefreshToken = (process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || process.env.OAUTH_REFRESH_TOKEN || '').trim();

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    try {
      console.log('[Email Dispatcher] 🚀 Using Google OAuth2 via googleapis REST API...');
      const oauthResult = await sendGmailWithOAuth2(
        targetEmail,
        otp,
        smtpUser,
        oauthClientId,
        oauthClientSecret,
        oauthRefreshToken,
        ccRecipient
      );
      return {
        sent: true,
        method: 'googleapis-oauth2',
        info: oauthResult.info,
        diagnostics: {
          authType: 'Google OAuth2 (googleapis REST API)',
          user: smtpUser,
          cc: ccRecipient,
          verified: true,
        },
      };
    } catch (oauthErr: any) {
      console.error('[Email Dispatcher] ❌ Google OAuth2 dispatch failed:', oauthErr?.message || oauthErr);
      // Fall through to Gmail SMTP fallback
    }
  }

  // 3. Gmail App Password fallback
  if (smtpPass) {
    console.log('[Email Dispatcher] 🔄 Attempting Gmail SMTP fallback...');
    const gmailConfigs = [
      {
        name: 'Gmail SSL Direct (Port 465)',
        transportOpts: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
      },
      {
        name: 'Gmail STARTTLS (Port 587)',
        transportOpts: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: { user: smtpUser, pass: smtpPass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
      }
    ];

    let lastError: any = null;
    for (const cfg of gmailConfigs) {
      try {
        const transporter = nodemailer.createTransport(cfg.transportOpts);
        const mailOptions = {
          from: `"Disney World Public School" <${smtpUser}>`,
          to: targetEmail,
          ...(ccRecipient ? { cc: ccRecipient } : {}),
          subject: `[DWPS Security] Administrator Password Reset Verification Code`,
          html: buildOtpEmailHtml(otp),
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`[Email Dispatcher] ✅ Email delivered via ${cfg.name}. Message ID: ${result.messageId}`);
        return {
          sent: true,
          method: cfg.name,
          info: result.messageId,
          diagnostics: {
            usedConfig: cfg.name,
            cc: ccRecipient,
            verified: true
          }
        };
      } catch (err: any) {
        lastError = err;
        console.error(`[Email Dispatcher] ❌ Connection error on ${cfg.name}:`, err?.message);
      }
    }

    return {
      sent: false,
      method: 'smtp-fallback-failed',
      error: lastError?.message || 'Failed to connect to email SMTP server.',
      errorCode: lastError?.code || 'SMTP_CONNECTION_ERROR'
    };
  }

  // 4. Missing credentials
  const errorMsg = 'SMTP / Gmail credentials not configured in server environment variables (OFFICIAL_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, or GMAIL_APP_PASSWORD).';
  console.warn(`[Email Dispatcher] ⚠️ ${errorMsg}`);
  return {
    sent: false,
    method: 'unconfigured',
    error: errorMsg,
    errorCode: 'MISSING_CREDENTIALS'
  };
}

// Helper to look up an administrator account by ID or email
async function findAdminUser(cleanIdOrEmail: string): Promise<AdminUserRecord | null> {
  const clean = cleanIdOrEmail.trim().toLowerCase();

  // 1. Check in-memory store
  const memUser = inMemoryAdminUsers.find(
    (u) => u.email.toLowerCase() === clean || u.userId.toLowerCase() === clean
  );
  if (memUser) return memUser;

  // 2. Check Neon database if available
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, name, email, user_id as "userId", mobile, designation, password, role, status, created_at as "createdAt"
        FROM dwps_admin_users
        WHERE LOWER(email) = ${clean} OR LOWER(user_id) = ${clean}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        return rows[0] as AdminUserRecord;
      }
    } catch (err) {
      console.warn('[Admin Auth] DB query error while looking up user:', err);
    }
  }

  // 3. Fallback to default official accounts if matching
  if (clean === 'dwpsballabgarh@gmail.com' || clean === 'dwpsballabgarh') {
    return defaultAdminUsers[0];
  }
  if (clean === 'rahul@dwpsballabgarh.org' || clean === 'rahul@dwps' || clean === 'rahul' || clean === 'csc121004@gmail.com') {
    return defaultAdminUsers[1];
  }

  return null;
}

// Dedicated endpoint to test and verify email authentication (Google OAuth2 + SMTP) directly on live domain
app.all(['/api/admin/verify-smtp', '/api/admin/verify-email-auth'], async (_req, res) => {
  const officialEmail = (process.env.OFFICIAL_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'dwpsballabgarh@gmail.com').trim();
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || officialEmail).trim();
  const rawPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || '';
  const smtpPass = rawPass.replace(/[\s-]+/g, '');

  const oauthClientId = (process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || '').trim();
  const oauthClientSecret = (process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || '').trim();
  const oauthRefreshToken = (process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || process.env.OAUTH_REFRESH_TOKEN || '').trim();

  const results: any = {
    officialEmail,
    smtpUser,
    customSmtp: {
      configured: Boolean(smtpHost && smtpPass),
      host: smtpHost || 'not set',
      port: smtpPort,
    },
    oauth2: {
      configured: Boolean(oauthClientId && oauthClientSecret && oauthRefreshToken),
      hasClientId: Boolean(oauthClientId),
      hasClientSecret: Boolean(oauthClientSecret),
      hasRefreshToken: Boolean(oauthRefreshToken),
    },
    smtp: {
      configured: Boolean(smtpPass),
      ports: {}
    }
  };

  // Test custom SMTP if configured
  if (results.customSmtp.configured) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 8000,
      });
      await transporter.verify();
      results.customSmtp.verified = true;
      results.customSmtp.message = 'Connected & Authenticated successfully with custom SMTP server.';
    } catch (err: any) {
      results.customSmtp.verified = false;
      results.customSmtp.error = err?.message;
    }
  }

  // Test OAuth2 with googleapis if credentials exist
  if (results.oauth2.configured) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        oauthClientId,
        oauthClientSecret,
        'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({ refresh_token: oauthRefreshToken });
      const token = await oauth2Client.getAccessToken();
      results.oauth2.tokenVerified = Boolean(token && token.token);
      results.oauth2.status = 'AUTHENTICATED_AND_READY';
      results.oauth2.message = 'Google OAuth2 REST API is active and successfully authenticated with googleapis!';
    } catch (err: any) {
      results.oauth2.tokenVerified = false;
      results.oauth2.status = 'OAUTH_VERIFICATION_FAILED';
      results.oauth2.error = err?.message;
    }
  }

  // Test standard Gmail SMTP if password configured
  if (results.smtp.configured && !results.customSmtp.configured) {
    const testTransporter465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 8000,
    });
    try {
      await testTransporter465.verify();
      results.smtp.ports['port_465_ssl'] = { ok: true, message: 'Connected & Authenticated successfully' };
    } catch (err: any) {
      results.smtp.ports['port_465_ssl'] = { ok: false, code: err?.code, message: err?.message };
    }
  }

  results.readyToSend = results.customSmtp.verified || results.oauth2.tokenVerified || results.smtp.ports?.['port_465_ssl']?.ok;
  return res.json(results);
});

// 5c. Forgot Password - Request Recovery OTP
app.post('/api/admin/request-password-reset', async (req, res) => {
  const { loginIdOrEmail } = req.body || {};
  const clean = (loginIdOrEmail || '').trim().toLowerCase();

  if (!clean) {
    return res.status(400).json({
      success: false,
      error: 'Please enter your registered institutional email or User ID.'
    });
  }

  // 1. Verify that the email or User ID belongs to an existing user
  const user = await findAdminUser(clean);

  // If email/ID is unknown, return a generic response to prevent account enumeration
  if (!user) {
    console.log(`[Admin Recovery] Password reset requested for unregistered identifier. Generic response returned.`);
    return res.json({
      success: true,
      message: 'If this email is registered, an OTP has been sent. Please check your inbox and spam folder.'
    });
  }

  // Account status check
  if (user.status && user.status.toLowerCase() === 'suspended') {
    return res.status(403).json({
      success: false,
      error: 'This administrator account is suspended. Please contact the institutional head office.'
    });
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = (user.userId || '').trim().toLowerCase();

  // 2. Rate limiting and cooldown check
  const rateLimitKey = userEmail;
  const now = Date.now();
  const limitRecord = otpRequestLimits.get(rateLimitKey) || { lastRequestTime: 0, requestCount: 0, windowStart: now };

  // Reset 15-minute rolling window
  if (now - limitRecord.windowStart > 15 * 60 * 1000) {
    limitRecord.windowStart = now;
    limitRecord.requestCount = 0;
  }

  // Cooldown: 60 seconds
  const cooldownRemaining = Math.ceil((limitRecord.lastRequestTime + 60 * 1000 - now) / 1000);
  if (cooldownRemaining > 0 && limitRecord.lastRequestTime > 0) {
    return res.status(429).json({
      success: false,
      error: `A verification code was requested recently. Please wait ${cooldownRemaining} second${cooldownRemaining === 1 ? '' : 's'} before requesting a new code.`
    });
  }

  // Max 5 OTP requests per 15-minute window
  if (limitRecord.requestCount >= 5) {
    const minutesRemaining = Math.ceil((limitRecord.windowStart + 15 * 60 * 1000 - now) / 1000 / 60);
    return res.status(429).json({
      success: false,
      error: `Too many verification code requests. Please wait ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} before trying again.`
    });
  }

  // 3. Invalidate old OTPs when a new one is requested
  for (const [key, oldRecord] of activeSecureOtps.entries()) {
    if (oldRecord.email === userEmail || (userId && oldRecord.userId === userId)) {
      activeSecureOtps.delete(key);
    }
  }

  // 4. Generate secure 6-digit OTP only on the server
  const otp = crypto.randomInt(100000, 1000000).toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashOtpValue(otp, salt);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes expiry

  const secureRecord: SecureOtpRecord = {
    email: userEmail,
    userId,
    hashedOtp,
    salt,
    createdAt: now,
    expiresAt,
    attempts: 0,
    maxAttempts: 5,
    verified: false,
    used: false,
  };

  // Store hashed OTP indexed by email, userId, and requested identifier
  activeSecureOtps.set(userEmail, secureRecord);
  if (userId) {
    activeSecureOtps.set(userId, secureRecord);
  }
  if (clean !== userEmail && clean !== userId) {
    activeSecureOtps.set(clean, secureRecord);
  }

  // Update cooldown and rate limits
  limitRecord.lastRequestTime = now;
  limitRecord.requestCount += 1;
  otpRequestLimits.set(rateLimitKey, limitRecord);

  // 5. Send OTP to user's registered email with copy (CC) to official/admin email
  const officialAdminEmail = (process.env.OFFICIAL_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'dwpsballabgarh@gmail.com').trim();
  const emailResult = await sendOtpEmail({
    targetEmail: userEmail,
    otp,
    officialEmail: officialAdminEmail
  });

  const maskedEmail = userEmail.replace(/(^.{2})(.*)(@.*$)/, (_m, p1, p2, p3) => p1 + '•'.repeat(Math.max(p2.length, 3)) + p3);
  console.log(`[Admin Recovery] Verification code dispatched for user: ${user.name} (${maskedEmail}) - Dispatch status: ${emailResult.sent ? 'Delivered' : 'Pending'}`);

  // Do NOT expose OTP in response or logs!
  return res.json({
    success: true,
    message: emailResult.sent
      ? `A 6-digit verification code has been dispatched to your registered email (${maskedEmail}).`
      : 'If this email is registered, an OTP has been sent. Please check your inbox and spam folder.',
    sentToEmail: maskedEmail,
    realEmailSent: emailResult.sent,
    emailError: emailResult.sent ? undefined : emailResult.error
  });
});

// 5d. Forgot Password - Verify OTP on Backend
app.post('/api/admin/verify-otp', async (req, res) => {
  const { loginIdOrEmail, otp } = req.body || {};
  const clean = (loginIdOrEmail || '').trim().toLowerCase();
  const cleanOtp = (otp || '').toString().trim();

  if (!clean) {
    return res.status(400).json({ success: false, error: 'User identifier or email is required.' });
  }

  if (!cleanOtp) {
    return res.status(400).json({ success: false, error: 'Please enter the 6-digit verification code.' });
  }

  if (!/^\d{6}$/.test(cleanOtp)) {
    return res.status(400).json({ success: false, error: 'Verification code must be exactly 6 digits.' });
  }

  const record = activeSecureOtps.get(clean);

  if (!record || record.used) {
    return res.status(400).json({
      success: false,
      error: 'No active verification code found for this account, or the code has already been used. Please request a new one.'
    });
  }

  // Check expiry (10 minutes)
  if (Date.now() > record.expiresAt) {
    activeSecureOtps.delete(clean);
    if (record.email) activeSecureOtps.delete(record.email);
    if (record.userId) activeSecureOtps.delete(record.userId);
    return res.status(400).json({
      success: false,
      error: 'This verification code has expired. Please request a new code.'
    });
  }

  // Check maximum failed attempts (5 max)
  if (record.attempts >= record.maxAttempts) {
    activeSecureOtps.delete(clean);
    if (record.email) activeSecureOtps.delete(record.email);
    if (record.userId) activeSecureOtps.delete(record.userId);
    return res.status(429).json({
      success: false,
      error: 'Too many incorrect attempts. This verification code has been invalidated for security. Please request a new one.'
    });
  }

  // Securely verify OTP hash
  const computedHash = hashOtpValue(cleanOtp, record.salt);
  if (computedHash !== record.hashedOtp) {
    record.attempts += 1;
    const remaining = record.maxAttempts - record.attempts;
    if (remaining <= 0) {
      activeSecureOtps.delete(clean);
      if (record.email) activeSecureOtps.delete(record.email);
      if (record.userId) activeSecureOtps.delete(record.userId);
      return res.status(429).json({
        success: false,
        error: 'Incorrect verification code. Maximum attempts exceeded. This code has been invalidated.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    });
  }

  // OTP verified! Generate secure one-time reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  record.verified = true;
  record.verifiedAt = Date.now();
  record.resetToken = resetToken;
  record.resetTokenExpiresAt = Date.now() + 10 * 60 * 1000;

  console.log(`[Admin Recovery] Verification code successfully validated for: ${record.email}`);

  return res.json({
    success: true,
    message: 'Verification code verified successfully. Please enter your new password.',
    resetToken
  });
});

// 5e. Forgot Password - Verify OTP & Set New Password
app.post('/api/admin/reset-password', async (req, res) => {
  const { loginIdOrEmail, otp, resetToken, newPassword } = req.body || {};
  const clean = (loginIdOrEmail || '').trim().toLowerCase();
  const cleanOtp = (otp || '').toString().trim();

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must contain at least 6 characters.'
    });
  }

  const record = activeSecureOtps.get(clean);

  if (!record || record.used) {
    return res.status(400).json({
      success: false,
      error: 'Verification session has expired or has already been used. Please request a new verification code.'
    });
  }

  // Check expiry
  const now = Date.now();
  if (now > (record.resetTokenExpiresAt || record.expiresAt)) {
    activeSecureOtps.delete(clean);
    if (record.email) activeSecureOtps.delete(record.email);
    if (record.userId) activeSecureOtps.delete(record.userId);
    return res.status(400).json({
      success: false,
      error: 'Verification session has expired. Please request a new verification code.'
    });
  }

  // Verify that either the resetToken matches OR the OTP hash matches
  let isValidSession = false;
  if (resetToken && record.resetToken && resetToken === record.resetToken && record.verified) {
    isValidSession = true;
  } else if (cleanOtp && hashOtpValue(cleanOtp, record.salt) === record.hashedOtp) {
    isValidSession = true;
  }

  if (!isValidSession) {
    return res.status(400).json({
      success: false,
      error: 'Invalid verification session or code. Please restart the password reset process.'
    });
  }

  const updatedPw = newPassword.trim();

  // Invalidate OTP and reset session immediately after password reset
  record.used = true;
  record.usedAt = now;
  activeSecureOtps.delete(clean);
  if (record.email) activeSecureOtps.delete(record.email);
  if (record.userId) activeSecureOtps.delete(record.userId);

  // Update in Neon database if available
  const sql = getSql();
  if (sql) {
    try {
      await sql`
        UPDATE dwps_admin_users
        SET password = ${updatedPw}
        WHERE LOWER(email) = ${record.email} OR LOWER(user_id) = ${record.userId || ''}
      `;
    } catch (sqlErr) {
      console.warn('[Admin Recovery] Could not update password in SQL:', sqlErr);
    }
  }

  // Update in memory user if exists
  const userInMemory = inMemoryAdminUsers.find(
    (u) => u.email.toLowerCase() === record.email || (record.userId && u.userId.toLowerCase() === record.userId)
  );
  if (userInMemory) {
    userInMemory.password = updatedPw;
  }

  if (record.email === 'dwpsballabgarh@gmail.com' || record.userId === 'dwpsballabgarh') {
    serverCustomAdminPassword = updatedPw;
  }

  console.log(`[Admin Recovery] Password reset successful and OTP session invalidated for: ${record.email}`);

  return res.json({
    success: true,
    message: 'Institutional administrator password updated successfully! You can now log in with your new password.'
  });
});

// 6. Institutional Fee Structures API (Live Fee Updates)
app.get('/api/fees', async (_req, res) => {
  await ensureDbInit();
  const sql = getSql();
  if (!sql) {
    return res.json({ source: 'local', data: GRADE_FEE_STRUCTURES });
  }

  try {
    console.log('[NeonDB] 🔍 [GET /api/fees] Fetching live fee structures from dwps_fee_structures...');
    const rows = await sql`
      SELECT 
        id,
        grade_name as "gradeName",
        category,
        age_group as "ageGroup",
        monthly_tuition as "monthlyTuition",
        annual_charges as "annualCharges",
        activity_smart_class as "activitySmartClass",
        admission_fee as "admissionFee",
        security_deposit as "securityDeposit",
        description,
        features,
        display_order as "displayOrder"
      FROM dwps_fee_structures
      ORDER BY display_order ASC, monthly_tuition ASC
    `;

    if (rows && rows.length > 0) {
      // If table is missing individual middle wing classes or has fewer than 10 classes, auto-sync to all 10 classes
      const has10Classes =
        rows.length >= 10 &&
        rows.some((r: any) => r.id === 'class-6') &&
        rows.some((r: any) => r.id === 'class-7') &&
        rows.some((r: any) => r.id === 'class-8');

      if (!has10Classes) {
        console.log('[NeonDB] 🌿 Auto-synchronizing all 10 classes (including Middle Wing Class 6, 7 & 8) to Neon database...');
        for (let i = 0; i < GRADE_FEE_STRUCTURES.length; i++) {
          const f = GRADE_FEE_STRUCTURES[i];
          await sql`
            INSERT INTO dwps_fee_structures (
              id, grade_name, category, age_group, monthly_tuition, annual_charges,
              activity_smart_class, admission_fee, security_deposit, description, features, display_order
            ) VALUES (
              ${f.id}, ${f.gradeName}, ${f.category}, ${f.ageGroup}, ${f.monthlyTuition}, ${f.annualCharges},
              ${f.activitySmartClass}, ${f.admissionFee}, ${f.securityDeposit}, ${f.description},
              ${JSON.stringify(f.features)}::jsonb, ${i}
            )
            ON CONFLICT (id) DO UPDATE SET
              grade_name = EXCLUDED.grade_name,
              category = EXCLUDED.category,
              age_group = EXCLUDED.age_group,
              monthly_tuition = EXCLUDED.monthly_tuition,
              annual_charges = EXCLUDED.annual_charges,
              activity_smart_class = EXCLUDED.activity_smart_class,
              admission_fee = EXCLUDED.admission_fee,
              security_deposit = EXCLUDED.security_deposit,
              description = EXCLUDED.description,
              features = EXCLUDED.features,
              display_order = EXCLUDED.display_order;
          `;
        }
        // Remove obsolete merged row IDs if present
        await sql`DELETE FROM dwps_fee_structures WHERE id IN ('grade-1-2', 'grade-6-8', 'kg-prep')`;

        const refreshed = await sql`
          SELECT 
            id,
            grade_name as "gradeName",
            category,
            age_group as "ageGroup",
            monthly_tuition as "monthlyTuition",
            annual_charges as "annualCharges",
            activity_smart_class as "activitySmartClass",
            admission_fee as "admissionFee",
            security_deposit as "securityDeposit",
            description,
            features,
            display_order as "displayOrder"
          FROM dwps_fee_structures
          ORDER BY display_order ASC, monthly_tuition ASC
        `;
        return res.json({ source: 'neon', data: refreshed });
      }

      console.log(`[NeonDB] ✅ [GET /api/fees] Retrieved ${rows.length} fee structures from Neon.`);
      return res.json({ source: 'neon', data: rows });
    }
    return res.json({ source: 'default', data: GRADE_FEE_STRUCTURES });
  } catch (err: any) {
    console.error('[NeonDB] ❌ [GET /api/fees] Error fetching fee structures:', err);
    return res.json({ source: 'fallback', data: GRADE_FEE_STRUCTURES, error: err?.message });
  }
});

app.put('/api/fees', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const { fees } = req.body;

  if (!Array.isArray(fees) || fees.length === 0) {
    return res.status(400).json({ error: 'Expected an array of fee structures in body.fees' });
  }

  if (!sql) {
    console.warn('[NeonDB] ⚠️ [PUT /api/fees] DATABASE_URL is not set. Updated in local session.');
    return res.json({ source: 'local', saved: true, count: fees.length });
  }

  try {
    console.log(`[NeonDB] 💾 [PUT /api/fees] Upserting ${fees.length} grade fee structures into dwps_fee_structures...`);
    for (let i = 0; i < fees.length; i++) {
      const f = fees[i];
      await sql`
        INSERT INTO dwps_fee_structures (
          id, grade_name, category, age_group, monthly_tuition, annual_charges,
          activity_smart_class, admission_fee, security_deposit, description, features, display_order, updated_at
        ) VALUES (
          ${f.id},
          ${f.gradeName},
          ${f.category},
          ${f.ageGroup || ''},
          ${Number(f.monthlyTuition) || 0},
          ${Number(f.annualCharges) || 0},
          ${Number(f.activitySmartClass) || 0},
          ${Number(f.admissionFee) || 0},
          ${Number(f.securityDeposit) || 0},
          ${f.description || ''},
          ${JSON.stringify(f.features || [])}::jsonb,
          ${i},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          grade_name = EXCLUDED.grade_name,
          category = EXCLUDED.category,
          age_group = EXCLUDED.age_group,
          monthly_tuition = EXCLUDED.monthly_tuition,
          annual_charges = EXCLUDED.annual_charges,
          activity_smart_class = EXCLUDED.activity_smart_class,
          admission_fee = EXCLUDED.admission_fee,
          security_deposit = EXCLUDED.security_deposit,
          description = EXCLUDED.description,
          features = EXCLUDED.features,
          display_order = EXCLUDED.display_order,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }
    console.log(`[NeonDB] 🎉 [PUT /api/fees] Successfully synced ${fees.length} fee structures to Neon!`);
    return res.json({ source: 'neon', saved: true, count: fees.length });
  } catch (err: any) {
    console.error('[NeonDB] ❌ [PUT /api/fees] Error updating fee structures:', err);
    return res.status(500).json({ error: 'Failed to update fee structures in Neon', details: err?.message });
  }
});

app.post('/api/fees/reset', async (_req, res) => {
  await ensureDbInit();
  const sql = getSql();
  if (!sql) {
    return res.json({ source: 'local', reset: true, data: GRADE_FEE_STRUCTURES });
  }

  try {
    console.log('[NeonDB] ⚡ [POST /api/fees/reset] Resetting fee structures to default CBSE values...');
    await sql`DELETE FROM dwps_fee_structures`;
    for (let i = 0; i < GRADE_FEE_STRUCTURES.length; i++) {
      const f = GRADE_FEE_STRUCTURES[i];
      await sql`
        INSERT INTO dwps_fee_structures (
          id, grade_name, category, age_group, monthly_tuition, annual_charges,
          activity_smart_class, admission_fee, security_deposit, description, features, display_order
        ) VALUES (
          ${f.id}, ${f.gradeName}, ${f.category}, ${f.ageGroup}, ${f.monthlyTuition}, ${f.annualCharges},
          ${f.activitySmartClass}, ${f.admissionFee}, ${f.securityDeposit}, ${f.description},
          ${JSON.stringify(f.features)}::jsonb, ${i}
        );
      `;
    }
    console.log('[NeonDB] ✅ [POST /api/fees/reset] Fees reset successfully.');
    return res.json({ source: 'neon', reset: true, data: GRADE_FEE_STRUCTURES });
  } catch (err: any) {
    console.error('[NeonDB] ❌ [POST /api/fees/reset] Error resetting fees:', err);
    return res.status(500).json({ error: 'Failed to reset fees', details: err?.message });
  }
});

// ============================================================================
// 10. STAFF MANAGEMENT SYSTEM (Neon PostgreSQL & School Admin Authentication)
// ============================================================================

let inMemoryStaff: StaffMember[] = [...INITIAL_STAFF_MEMBERS];

function verifyAdminAuth(req: express.Request): { authorized: boolean; email: string } {
  const requester = (
    req.headers['x-admin-email'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
    req.query.adminEmail ||
    req.body?.requesterEmail ||
    ''
  ).toString().trim().toLowerCase();

  if (!requester) {
    return { authorized: false, email: '' };
  }

  if (
    requester === 'dwpsballabgarh@gmail.com' ||
    requester === 'rahul@dwpsballabgarh.org' ||
    requester === 'dwpsballabgarh' ||
    inMemoryAdminUsers.some(u => u.email.toLowerCase() === requester || u.userId.toLowerCase() === requester)
  ) {
    return { authorized: true, email: requester };
  }

  return { authorized: false, email: requester };
}

function mapDbRowToStaff(row: any): StaffMember {
  let subjects: string[] = [];
  try {
    subjects = Array.isArray(row.subjects) ? row.subjects : JSON.parse(row.subjects || '[]');
  } catch {
    subjects = [];
  }

  let skills: string[] = [];
  try {
    skills = Array.isArray(row.skills) ? row.skills : JSON.parse(row.skills || '[]');
  } catch {
    skills = [];
  }

  return {
    id: String(row.id),
    name: String(row.name),
    photoUrl: String(row.photo_url || ''),
    imageUrl: String(row.photo_url || ''),
    designation: String(row.designation || 'Teacher'),
    role: String(row.designation || 'Teacher'),
    category: (row.category as 'Leadership' | 'Faculty') || 'Faculty',
    subjects,
    skills,
    description: String(row.description || ''),
    qualification: String(row.qualification || ''),
    qualifications: String(row.qualification || ''),
    experience: String(row.experience || ''),
    displayOrder: typeof row.display_order === 'number' ? row.display_order : Number(row.display_order) || 0,
    status: (row.status as 'Active' | 'Inactive') || 'Active',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
  };
}

// 10a. Public Staff Directory (Active members only, ordered by display_order ASC)
app.get('/api/staff', async (_req, res) => {
  await ensureDbInit();
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM dwps_staff 
        WHERE status = 'Active' 
        ORDER BY display_order ASC, created_at ASC
      `;
      if (rows && rows.length > 0) {
        return res.json({ success: true, source: 'neon', data: rows.map(mapDbRowToStaff) });
      }
    } catch (err) {
      console.warn('[Staff API] Neon query error, falling back to local memory:', err);
    }
  }

  const activeStaff = inMemoryStaff
    .filter(s => s.status === 'Active')
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return res.json({ success: true, source: 'local', data: activeStaff });
});

// 10b. Admin Staff Directory (All members, protected)
app.get('/api/admin/staff', async (req, res) => {
  const auth = verifyAdminAuth(req);
  if (!auth.authorized) {
    return res.status(401).json({
      success: false,
      error: 'Authorization error: School Admin credentials required.'
    });
  }

  await ensureDbInit();
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM dwps_staff 
        WHERE status != 'deleted' 
        ORDER BY display_order ASC, created_at ASC
      `;
      if (rows && rows.length > 0) {
        return res.json({ success: true, source: 'neon', data: rows.map(mapDbRowToStaff) });
      }
    } catch (err) {
      console.warn('[Staff Admin API] Neon query error, falling back to local memory:', err);
    }
  }

  const allStaff = [...inMemoryStaff]
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return res.json({ success: true, source: 'local', data: allStaff });
});

// 10c. Upload Staff Photo (Exact uploaded file from admin computer, stored persistently)
app.post('/api/admin/staff/upload-photo', async (req, res) => {
  const auth = verifyAdminAuth(req);
  if (!auth.authorized) {
    return res.status(401).json({
      success: false,
      error: 'Authorization error: School Admin credentials required to upload photos.'
    });
  }

  try {
    const { filename, fileData, mimeType } = req.body || {};
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Unable to upload photo. Please select an image file.'
      });
    }

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const detectedMime = (mimeType || '').toLowerCase();
    if (detectedMime && !validMimes.includes(detectedMime)) {
      return res.status(400).json({
        success: false,
        error: 'Unable to upload photo. Please upload a valid image file (JPEG, PNG, WebP).'
      });
    }

    // Determine extension
    let extension = 'jpg';
    if (detectedMime.includes('png')) extension = 'png';
    else if (detectedMime.includes('webp')) extension = 'webp';
    else if (detectedMime.includes('gif')) extension = 'gif';

    let base64Content = fileData;
    if (fileData.startsWith('data:')) {
      const match = fileData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        if (match[1] === 'jpeg' || match[1] === 'jpg') extension = 'jpg';
        else if (match[1] === 'png') extension = 'png';
        else if (match[1] === 'webp') extension = 'webp';
        else if (match[1] === 'gif') extension = 'gif';
        base64Content = match[2];
      } else {
        const commaIdx = fileData.indexOf(',');
        if (commaIdx !== -1) {
          base64Content = fileData.substring(commaIdx + 1);
        }
      }
    }

    const buffer = Buffer.from(base64Content, 'base64');

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Unable to upload photo. File size exceeds 5MB limit (${(buffer.length / (1024 * 1024)).toFixed(1)}MB).`
      });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public/uploads/staff');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Unique safe filename
    const cleanOrigName = (filename || 'photo')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueName = `staff_${Date.now()}_${cleanOrigName}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);
    console.log(`[Staff Photo] 📸 Saved uploaded photo: ${filePath} (${buffer.length} bytes)`);

    const publicUrl = `/uploads/staff/${uniqueName}`;

    return res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully.',
      photoUrl: publicUrl
    });
  } catch (err: any) {
    console.error('[Staff Photo] Upload error:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to upload photo. Please try again.'
    });
  }
});

// 10d. Serve Uploaded Staff Photo Direct Stream
app.get('/api/staff/photo/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(process.cwd(), 'public/uploads/staff', filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send('Image not found');
});

// 10e. Create Staff Member (Protected, with validation)
app.post('/api/admin/staff', async (req, res) => {
  const auth = verifyAdminAuth(req);
  if (!auth.authorized) {
    return res.status(401).json({
      success: false,
      error: 'Authorization error: School Admin credentials required.'
    });
  }

  const {
    name,
    photoUrl,
    designation,
    category,
    subjects,
    skills,
    description,
    qualification,
    experience,
    displayOrder,
    status
  } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Staff Name is required.' });
  }

  if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.trim()) {
    return res.status(400).json({ success: false, error: 'Photo is required when creating a new staff member.' });
  }

  const cleanName = name.trim();
  const cleanDesignation = (designation || 'Faculty Member').trim();
  const cleanPhotoUrl = photoUrl.trim();
  const cleanCategory = (category === 'Leadership' ? 'Leadership' : 'Faculty') as 'Leadership' | 'Faculty';
  const cleanSubjects = Array.isArray(subjects) ? subjects : [];
  const cleanSkills = Array.isArray(skills) ? skills : [];
  const cleanDescription = (description || '').trim();
  const cleanQualification = (qualification || '').trim();
  const cleanExperience = (experience || '').trim();
  const parsedOrder = typeof displayOrder === 'number' ? displayOrder : parseInt(displayOrder, 10) || 0;
  const cleanStatus = (status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive';

  const newId = `staff-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const newStaff: StaffMember = {
    id: newId,
    name: cleanName,
    photoUrl: cleanPhotoUrl,
    imageUrl: cleanPhotoUrl,
    designation: cleanDesignation,
    role: cleanDesignation,
    category: cleanCategory,
    subjects: cleanSubjects,
    skills: cleanSkills,
    description: cleanDescription,
    qualification: cleanQualification,
    qualifications: cleanQualification,
    experience: cleanExperience,
    displayOrder: parsedOrder,
    status: cleanStatus,
    createdAt: now,
    updatedAt: now
  };

  await ensureDbInit();
  const sql = getSql();
  if (sql) {
    try {
      await sql`
        INSERT INTO dwps_staff (
          id, name, photo_url, designation, category, subjects, skills,
          description, qualification, experience, display_order, status, created_at, updated_at
        ) VALUES (
          ${newId}, ${cleanName}, ${cleanPhotoUrl}, ${cleanDesignation}, ${cleanCategory},
          ${JSON.stringify(cleanSubjects)}::jsonb,
          ${JSON.stringify(cleanSkills)}::jsonb,
          ${cleanDescription}, ${cleanQualification}, ${cleanExperience},
          ${parsedOrder}, ${cleanStatus}, ${now}, ${now}
        );
      `;
      console.log(`[NeonDB] ✅ [POST /api/admin/staff] Created staff: ${cleanName} (${newId})`);
    } catch (err: any) {
      console.error('[NeonDB] ❌ [POST /api/admin/staff] DB error:', err);
    }
  }

  inMemoryStaff.push(newStaff);

  return res.status(201).json({
    success: true,
    message: 'Staff member added successfully.',
    staff: newStaff
  });
});

// 10f. Update Staff Member (Protected, preserves photo if none provided)
app.put('/api/admin/staff/:id', async (req, res) => {
  const auth = verifyAdminAuth(req);
  if (!auth.authorized) {
    return res.status(401).json({
      success: false,
      error: 'Authorization error: School Admin credentials required.'
    });
  }

  const { id } = req.params;
  const existing = inMemoryStaff.find(s => s.id === id);

  const {
    name,
    photoUrl,
    designation,
    category,
    subjects,
    skills,
    description,
    qualification,
    experience,
    displayOrder,
    status
  } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Staff Name is required.' });
  }

  const cleanName = name.trim();
  const cleanDesignation = (designation || 'Faculty Member').trim();
  const finalPhotoUrl = (photoUrl && photoUrl.trim()) ? photoUrl.trim() : (existing?.photoUrl || '/assets/faculty/anuradha.jpg');
  const cleanCategory = (category === 'Leadership' ? 'Leadership' : 'Faculty') as 'Leadership' | 'Faculty';
  const cleanSubjects = Array.isArray(subjects) ? subjects : [];
  const cleanSkills = Array.isArray(skills) ? skills : [];
  const cleanDescription = (description || '').trim();
  const cleanQualification = (qualification || '').trim();
  const cleanExperience = (experience || '').trim();
  const parsedOrder = typeof displayOrder === 'number' ? displayOrder : parseInt(displayOrder, 10) || 0;
  const cleanStatus = (status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive';
  const now = new Date().toISOString();

  const updatedStaff: StaffMember = {
    id,
    name: cleanName,
    photoUrl: finalPhotoUrl,
    imageUrl: finalPhotoUrl,
    designation: cleanDesignation,
    role: cleanDesignation,
    category: cleanCategory,
    subjects: cleanSubjects,
    skills: cleanSkills,
    description: cleanDescription,
    qualification: cleanQualification,
    qualifications: cleanQualification,
    experience: cleanExperience,
    displayOrder: parsedOrder,
    status: cleanStatus,
    updatedAt: now
  };

  await ensureDbInit();
  const sql = getSql();
  if (sql) {
    try {
      await sql`
        UPDATE dwps_staff SET
          name = ${cleanName},
          photo_url = ${finalPhotoUrl},
          designation = ${cleanDesignation},
          category = ${cleanCategory},
          subjects = ${JSON.stringify(cleanSubjects)}::jsonb,
          skills = ${JSON.stringify(cleanSkills)}::jsonb,
          description = ${cleanDescription},
          qualification = ${cleanQualification},
          experience = ${cleanExperience},
          display_order = ${parsedOrder},
          status = ${cleanStatus},
          updated_at = ${now}
        WHERE id = ${id};
      `;
      console.log(`[NeonDB] ✅ [PUT /api/admin/staff/:id] Updated staff: ${cleanName} (${id})`);
    } catch (err: any) {
      console.error('[NeonDB] ❌ [PUT /api/admin/staff/:id] DB error:', err);
    }
  }

  const idx = inMemoryStaff.findIndex(s => s.id === id);
  if (idx !== -1) {
    inMemoryStaff[idx] = { ...inMemoryStaff[idx], ...updatedStaff };
  } else {
    inMemoryStaff.push(updatedStaff);
  }

  return res.json({
    success: true,
    message: 'Staff member updated successfully.',
    staff: updatedStaff
  });
});

// 10g. Delete Staff Member (Protected, soft-delete to Inactive)
app.delete('/api/admin/staff/:id', async (req, res) => {
  const auth = verifyAdminAuth(req);
  if (!auth.authorized) {
    return res.status(401).json({
      success: false,
      error: 'Authorization error: School Admin credentials required.'
    });
  }

  const { id } = req.params;
  const isPermanent = req.query.permanent === 'true';

  await ensureDbInit();
  const sql = getSql();
  if (sql) {
    try {
      if (isPermanent) {
        await sql`DELETE FROM dwps_staff WHERE id = ${id}`;
      } else {
        await sql`UPDATE dwps_staff SET status = 'Inactive', updated_at = NOW() WHERE id = ${id}`;
      }
      console.log(`[NeonDB] ✅ [DELETE /api/admin/staff/:id] Removed/Deactivated staff (${id})`);
    } catch (err: any) {
      console.error('[NeonDB] ❌ [DELETE /api/admin/staff/:id] DB error:', err);
    }
  }

  if (isPermanent) {
    inMemoryStaff = inMemoryStaff.filter(s => s.id !== id);
  } else {
    const s = inMemoryStaff.find(st => st.id === id);
    if (s) s.status = 'Inactive';
  }

  return res.json({
    success: true,
    message: 'Staff member deleted successfully.'
  });
});

// 10h. Toggle Staff Status (Active / Inactive)
app.patch('/api/admin/staff/:id/status', async (req, res) => {
  const auth = verifyAdminAuth(req);
  if (!auth.authorized) {
    return res.status(401).json({
      success: false,
      error: 'Authorization error: School Admin credentials required.'
    });
  }

  const { id } = req.params;
  const { status } = req.body || {};
  const targetStatus = status === 'Inactive' ? 'Inactive' : 'Active';

  await ensureDbInit();
  const sql = getSql();
  if (sql) {
    try {
      await sql`UPDATE dwps_staff SET status = ${targetStatus}, updated_at = NOW() WHERE id = ${id}`;
    } catch (err: any) {
      console.error('[NeonDB] Status toggle error:', err);
    }
  }

  const s = inMemoryStaff.find(st => st.id === id);
  if (s) s.status = targetStatus;

  return res.json({
    success: true,
    message: `Staff status changed to ${targetStatus}.`,
    status: targetStatus
  });
});
