import express from 'express';
import { getSql, checkDbConnection, initializeDatabase, isDatabaseConfigured } from './db.js';

export const app = express();

app.use(express.json());

// Initialize DB schema on first startup if DATABASE_URL is provided
let dbInitAttempted = false;
async function ensureDbInit() {
  if (!dbInitAttempted && isDatabaseConfigured()) {
    dbInitAttempted = true;
    await initializeDatabase();
  }
}

// 1. Health check & DB connection status
app.get('/api/health', async (_req, res) => {
  await ensureDbInit();
  const status = await checkDbConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: status
  });
});

// 2. Admission Inquiries API
app.get('/api/inquiries', async (_req, res) => {
  await ensureDbInit();
  const sql = getSql();
  if (!sql) {
    return res.json({ source: 'local', data: [] });
  }

  try {
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
    return res.json({ source: 'neon', data: rows });
  } catch (err: any) {
    console.error('Error fetching inquiries from Neon:', err);
    return res.status(500).json({ error: 'Failed to fetch inquiries', details: err?.message });
  }
});

app.post('/api/inquiries', async (req, res) => {
  await ensureDbInit();
  const sql = getSql();
  const record = req.body;

  if (!record || !record.studentName || !record.phone) {
    return res.status(400).json({ error: 'Missing required student name or contact phone.' });
  }

  const id = record.id || `inq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const dateStr = record.date || new Date().toISOString().split('T')[0];

  if (!sql) {
    return res.json({ source: 'local', saved: false, message: 'Database not connected, saved to local state.' });
  }

  try {
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
    return res.json({ source: 'neon', saved: true, id });
  } catch (err: any) {
    console.error('Error saving inquiry to Neon:', err);
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
    return res.json({ source: 'local', saved: false, message: 'Saved in local browser session.' });
  }

  try {
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
    return res.json({ source: 'neon', saved: true, id });
  } catch (err: any) {
    console.error('Error saving tour booking to Neon:', err);
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
