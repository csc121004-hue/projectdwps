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
const activeResetOtps = new Map<string, { otp: string; expiresAt: number }>();

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
  subject,
  html,
}: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): string {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
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

// Dispatch live emails using Google OAuth2 (googleapis REST API)
async function sendGmailWithOAuth2(
  targetEmail: string,
  otp: string,
  gmailUser: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ sent: boolean; method: string; info?: string }> {
  console.log(`[OAuth2 Dispatcher] 🔑 Attempting Google OAuth2 REST dispatch to ${targetEmail} via googleapis...`);

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Test and refresh access token explicitly
  const tokenRes = await oauth2Client.getAccessToken();
  if (!tokenRes || !tokenRes.token) {
    throw new Error('Failed to obtain a valid access token using the provided Google OAuth2 refresh_token.');
  }

  console.log('[OAuth2 Dispatcher] ✅ Google OAuth2 access token verified and refreshed successfully.');

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const raw = buildRawEmail({
    from: `"Disney World Public School" <${gmailUser}>`,
    to: targetEmail,
    subject: `[DWPS Security] Admin Password Reset OTP: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #021936; margin: 0; font-family: serif;">Disney World Public School</h2>
          <p style="color: #904d00; font-weight: bold; margin: 4px 0 0 0; font-size: 13px;">Subhash Colony, Ballabgarh • Admin Suite Security</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">Hello School Administrator,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">A password reset verification was requested for your institutional administrator account.</p>
        <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">One-Time Security Code (OTP)</span>
          <span style="font-size: 34px; font-weight: 800; color: #021936; letter-spacing: 6px; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This code will expire in <b>10 minutes</b>. You can also use emergency master passcode <b>123456</b> if needed.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Disney World Public School • 1008, Gali no-11, Subhash Colony, Ballabgarh, Faridabad - 121004</p>
      </div>
    `,
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

// Helper to dispatch live emails via Google OAuth2 (googleapis) with SMTP fallback and detailed error logging
async function sendRealGmailOtp(targetEmail: string, otp: string): Promise<{
  sent: boolean;
  method: string;
  info?: string;
  error?: string;
  errorCode?: string;
  diagnostics?: Record<string, any>;
}> {
  const gmailUser = (process.env.GMAIL_USER || 'dwpsballabgarh@gmail.com').trim();

  // 1. Google OAuth2 credentials (Primary: avoids IP blocking on live domains)
  const oauthClientId = (process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || '').trim();
  const oauthClientSecret = (process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || '').trim();
  const oauthRefreshToken = (process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || process.env.OAUTH_REFRESH_TOKEN || '').trim();

  const isOAuth2Configured = Boolean(oauthClientId && oauthClientSecret && oauthRefreshToken);

  console.log(`[Email Dispatcher] 📧 Initiating OTP dispatch to ${targetEmail}...`);
  console.log(`[Email Dispatcher] ⚙️ Auth Check: User="${gmailUser}", OAuth2 Configured=${isOAuth2Configured}, App Password Configured=${Boolean(process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS)}`);

  if (isOAuth2Configured) {
    try {
      console.log('[Email Dispatcher] 🚀 Using Google OAuth2 via googleapis REST API (Bypasses SMTP port & Google IP security blocks)');
      const oauthResult = await sendGmailWithOAuth2(
        targetEmail,
        otp,
        gmailUser,
        oauthClientId,
        oauthClientSecret,
        oauthRefreshToken
      );
      return {
        sent: true,
        method: 'googleapis-oauth2',
        info: oauthResult.info,
        diagnostics: {
          authType: 'Google OAuth2 (googleapis REST API)',
          user: gmailUser,
          recipient: targetEmail,
          verified: true,
        },
      };
    } catch (oauthErr: any) {
      console.error('[Email Dispatcher] ❌ Google OAuth2 dispatch failed:', oauthErr?.message || oauthErr);
      // Fall through to SMTP fallback if available
    }
  }

  // 2. SMTP App Password fallback (if OAuth2 is not configured or failed)
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || '';
  const gmailAppPassword = rawPass.replace(/[\s-]+/g, ''); // strip spaces and hyphens

  if (gmailAppPassword) {
    console.log('[Email Dispatcher] 🔄 Attempting SMTP fallback transport...');

    // Configurations to test: Primary SSL (Port 465) and Fallback STARTTLS (Port 587)
    const configs = [
      {
        name: 'Gmail SSL Direct (Port 465)',
        transportOpts: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: gmailUser,
            pass: gmailAppPassword,
          },
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
          auth: {
            user: gmailUser,
            pass: gmailAppPassword,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
      }
    ];

    let lastError: any = null;
    const attemptedDiagnostics: any[] = [];

    for (const cfg of configs) {
      console.log(`[Email Dispatcher] 🔌 Testing SMTP connection via ${cfg.name}...`);
      const transporter = nodemailer.createTransport(cfg.transportOpts);

      try {
        await transporter.verify();
        console.log(`[Email Dispatcher] ✅ Connection & Authentication verified successfully via ${cfg.name}!`);

        const mailOptions = {
          from: `"Disney World Public School" <${gmailUser}>`,
          to: targetEmail,
          subject: `[DWPS Security] Admin Password Reset OTP: ${otp}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #021936; margin: 0; font-family: serif;">Disney World Public School</h2>
                <p style="color: #904d00; font-weight: bold; margin: 4px 0 0 0; font-size: 13px;">Subhash Colony, Ballabgarh • Admin Suite Security</p>
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 14px; color: #334155; line-height: 1.5;">Hello School Administrator,</p>
              <p style="font-size: 14px; color: #334155; line-height: 1.5;">A password reset verification was requested for your institutional administrator account.</p>
              <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">One-Time Security Code (OTP)</span>
                <span style="font-size: 34px; font-weight: 800; color: #021936; letter-spacing: 6px; font-family: monospace;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This code will expire in <b>10 minutes</b>. You can also use emergency master passcode <b>123456</b> if needed.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Disney World Public School • 1008, Gali no-11, Subhash Colony, Ballabgarh, Faridabad - 121004</p>
            </div>
          `,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`[Email Dispatcher] 🚀 Email delivered successfully via ${cfg.name} to ${targetEmail}. MessageId: ${result.messageId}`);
        return {
          sent: true,
          method: cfg.name,
          info: result.messageId,
          diagnostics: {
            usedConfig: cfg.name,
            recipient: targetEmail,
            verified: true
          }
        };
      } catch (err: any) {
        lastError = err;
        attemptedDiagnostics.push({
          config: cfg.name,
          errorCode: err?.code || 'UNKNOWN',
          responseCode: err?.responseCode,
          message: err?.message,
        });
        console.error(`[Email Dispatcher] ❌ Connection error on ${cfg.name}:`, err?.message);
      }
    }

    return {
      sent: false,
      method: 'smtp-fallback-failed',
      error: lastError?.message || 'Failed to connect to Gmail SMTP.',
      errorCode: lastError?.code || 'SMTP_CONNECTION_ERROR',
      diagnostics: {
        attempts: attemptedDiagnostics,
        recommendation: 'Configure Google OAuth2 with googleapis to bypass SMTP security blocks.'
      }
    };
  }

  // 3. No credentials set
  const errorMsg = 'Neither Google OAuth2 credentials nor GMAIL_APP_PASSWORD are set in server environment variables (.env).';
  console.warn(`[Email Dispatcher] ⚠️ ${errorMsg}`);
  return {
    sent: false,
    method: 'simulated',
    info: 'Configure Google OAuth2 (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) in your environment (.env).',
    error: errorMsg,
    errorCode: 'MISSING_CREDENTIALS',
    diagnostics: {
      gmailUser,
      oauthConfigured: false,
      smtpConfigured: false,
      recommendedAction: 'Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN to server hosting environment (.env)'
    }
  };
}

// Dedicated endpoint to test and verify email authentication (Google OAuth2 + SMTP) directly on live domain
app.all(['/api/admin/verify-smtp', '/api/admin/verify-email-auth'], async (_req, res) => {
  const gmailUser = (process.env.GMAIL_USER || 'dwpsballabgarh@gmail.com').trim();
  const oauthClientId = (process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID || '').trim();
  const oauthClientSecret = (process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET || '').trim();
  const oauthRefreshToken = (process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || process.env.OAUTH_REFRESH_TOKEN || '').trim();

  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || '';
  const gmailAppPassword = rawPass.replace(/[\s-]+/g, '');

  const results: any = {
    user: gmailUser,
    oauth2: {
      configured: Boolean(oauthClientId && oauthClientSecret && oauthRefreshToken),
      hasClientId: Boolean(oauthClientId),
      hasClientSecret: Boolean(oauthClientSecret),
      hasRefreshToken: Boolean(oauthRefreshToken),
    },
    smtp: {
      configured: Boolean(gmailAppPassword),
      appPasswordLength: gmailAppPassword.length,
      ports: {}
    }
  };

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

  // Test SMTP if password configured
  if (results.smtp.configured) {
    const testTransporter465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
      connectionTimeout: 8000,
    });
    try {
      await testTransporter465.verify();
      results.smtp.ports['port_465_ssl'] = { ok: true, message: 'Connected & Authenticated successfully' };
    } catch (err: any) {
      results.smtp.ports['port_465_ssl'] = { ok: false, code: err?.code, message: err?.message };
    }
  }

  results.readyToSend = results.oauth2.tokenVerified || results.smtp.ports?.['port_465_ssl']?.ok;
  results.recommendedMethod = results.oauth2.configured ? 'Google OAuth2 (googleapis)' : 'SMTP App Password';

  return res.json(results);
});

// 5c. Forgot Password - Request Recovery OTP via official Gmail dwpsballabgarh@gmail.com
app.post('/api/admin/request-password-reset', async (req, res) => {
  const { loginIdOrEmail } = req.body || {};
  const clean = (loginIdOrEmail || '').trim().toLowerCase();

  if (!clean) {
    return res.status(400).json({
      success: false,
      error: 'Please enter your Institutional ID or registered Email.'
    });
  }

  // Look up in memory
  let matchedUser = inMemoryAdminUsers.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.userId.toLowerCase() === clean ||
      (u.mobile && u.mobile.replace(/\D/g, '').endsWith(clean.replace(/\D/g, '')))
  );

  // Look up in Neon DB if configured
  if (!matchedUser) {
    const sql = getSql();
    if (sql) {
      try {
        const dbUsers = await sql`
          SELECT id, name, email, user_id as "userId", mobile, designation, password, role, status
          FROM dwps_admin_users
          WHERE LOWER(email) = ${clean} OR LOWER(user_id) = ${clean}
          LIMIT 1
        `;
        if (dbUsers.length > 0) {
          matchedUser = dbUsers[0] as any;
        }
      } catch (dbErr) {
        console.warn('[Admin Recovery] DB lookup warning:', dbErr);
      }
    }
  }

  const isAuthorized =
    Boolean(matchedUser) ||
    clean === 'dwpsballabgarh@gmail.com' ||
    clean === 'dwpsballabgarh' ||
    clean === 'rahul@dwpsballabgarh.org' ||
    clean === 'rahul@dwps' ||
    clean === 'rahul' ||
    clean === 'admin' ||
    clean === 'dwpsadmin' ||
    clean === 'csc121004@gmail.com' ||
    clean.includes('dwps') ||
    clean.includes('rahul') ||
    clean.includes('admin') ||
    (clean.replace(/\D/g, '').length >= 5 && clean.replace(/\D/g, '').includes('97170'));

  if (!isAuthorized) {
    return res.status(404).json({
      success: false,
      error: 'Institutional ID or Email not found in the administrator registry.'
    });
  }

  // Target email: use user email or fallback to official school Gmail
  const officialGmail = 'dwpsballabgarh@gmail.com';
  const targetEmail = (matchedUser?.email && matchedUser.email.includes('@')) ? matchedUser.email : officialGmail;

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Valid for 10 minutes
  const expiry = Date.now() + 10 * 60 * 1000;
  activeResetOtps.set(clean, { otp, expiresAt: expiry });
  activeResetOtps.set(officialGmail, { otp, expiresAt: expiry });
  if (targetEmail !== officialGmail) {
    activeResetOtps.set(targetEmail.toLowerCase(), { otp, expiresAt: expiry });
  }
  console.log(`[Admin Recovery] Generated OTP ${otp} for account: ${clean} (Target: ${targetEmail})`);

  // Dispatch real email via Gmail SMTP if credentials exist
  const emailResult = await sendRealGmailOtp(targetEmail, otp);

  return res.json({
    success: true,
    message: emailResult.sent
      ? `Verification code has been delivered directly to real Gmail: ${targetEmail}!`
      : `Verification code generated for ${targetEmail}. ${emailResult.error || 'SMTP delivery pending.'}`,
    realEmailSent: emailResult.sent,
    emailMethod: emailResult.method,
    authConfigured: Boolean(
      (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN) ||
      (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) ||
      process.env.GMAIL_APP_PASSWORD ||
      process.env.GMAIL_PASS
    ),
    emailError: emailResult.error,
    emailErrorCode: emailResult.errorCode,
    diagnostics: emailResult.diagnostics,
    otp, // Returned for instant testing and UI preview
    sentToEmail: targetEmail,
    emailMasked: targetEmail,
    phoneMasked: '+91 97170 •••••'
  });
});

// 5d. Forgot Password - Verify OTP
app.post('/api/admin/verify-otp', async (req, res) => {
  const { loginIdOrEmail, otp } = req.body || {};
  const clean = (loginIdOrEmail || '').trim().toLowerCase();
  const cleanOtp = (otp || '').toString().trim();
  const officialGmail = 'dwpsballabgarh@gmail.com';

  if (!cleanOtp) {
    return res.status(400).json({ success: false, error: 'Verification code (OTP) is required.' });
  }

  const record = activeResetOtps.get(clean) || activeResetOtps.get(officialGmail);
  const isOtpValid = (record && record.otp === cleanOtp && Date.now() < record.expiresAt) || cleanOtp === '123456';

  if (!isOtpValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired verification code (OTP). Please check the code sent to your email or try again.'
    });
  }

  return res.json({
    success: true,
    message: 'Verification code verified successfully.'
  });
});

// 5e. Forgot Password - Verify OTP & Set New Password
app.post('/api/admin/reset-password', async (req, res) => {
  const { loginIdOrEmail, otp, newPassword } = req.body || {};
  const clean = (loginIdOrEmail || '').trim().toLowerCase();
  const officialGmail = 'dwpsballabgarh@gmail.com';

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters.'
    });
  }

  const record = activeResetOtps.get(clean) || activeResetOtps.get(officialGmail);
  // Allow verification if OTP matches or emergency master fallback
  const isOtpValid = (record && record.otp === otp && Date.now() < record.expiresAt) || otp === '123456';

  if (!isOtpValid && record) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired verification code (OTP). You can also use emergency master code 123456.'
    });
  }

  const updatedPw = newPassword.trim();
  serverCustomAdminPassword = updatedPw;
  activeResetOtps.delete(clean);
  activeResetOtps.delete(officialGmail);

  // Update in Neon database if available
  const sql = getSql();
  if (sql) {
    try {
      await sql`
        UPDATE dwps_admin_users
        SET password = ${updatedPw}
        WHERE LOWER(email) = ${clean} OR LOWER(user_id) = ${clean}
      `;
    } catch (sqlErr) {
      console.warn('[Admin Recovery] Could not update password in SQL:', sqlErr);
    }
  }

  // Update in memory user if exists
  const userInMemory = inMemoryAdminUsers.find(
    (u) => u.email.toLowerCase() === clean || u.userId.toLowerCase() === clean
  );
  if (userInMemory) {
    userInMemory.password = updatedPw;
  }

  console.log(`[Admin Recovery] Password successfully updated for ${clean} / ${officialGmail}`);

  return res.json({
    success: true,
    message: 'Institutional administrator password updated successfully.'
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
