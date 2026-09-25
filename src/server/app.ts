import express from 'express';
import { getSql, checkDbConnection, initializeDatabase, isDatabaseConfigured } from './db.js';
import { GRADE_FEE_STRUCTURES } from '../data/schoolData.js';

export const app = express();

app.use(express.json());

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
    console.log(`[NeonDB] 🎉 [POST /api/tour-bookings] Successfully saved tour booking ID "${id}" in Neon!`);
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

// 5b. School Admin Authentication API
app.post('/api/admin/login', (req, res) => {
  const { loginId, password } = req.body || {};
  const cleanString = (str: string) =>
    (str || '').replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();

  const normalizedId = cleanString(loginId).toLowerCase();
  let normalizedPw = cleanString(password);
  if (normalizedPw.startsWith('-')) {
    normalizedPw = cleanString(normalizedPw.substring(1));
  }

  const isValidId =
    normalizedId === 'rahul@dwpsballabgarh.org' ||
    normalizedId === 'rahul@dwps' ||
    normalizedId === 'rahul' ||
    normalizedId === 'rahul@dwpsballabgarh' ||
    normalizedId === 'csc121004@gmail.com';

  const isValidPassword =
    normalizedPw.toLowerCase() === 'rahul#dwps2026' ||
    normalizedPw.toLowerCase() === 'rahul@dwps2026' ||
    normalizedPw.toLowerCase() === 'rahul2026' ||
    normalizedPw.toLowerCase() === 'rahul#2026' ||
    normalizedPw === 'dwps#2026' ||
    normalizedPw === 'dwps2026';

  if (isValidId && isValidPassword) {
    return res.json({
      success: true,
      user: {
        name: 'Mr. Rahul Chaudhary',
        role: 'School Director / Administrator',
        email: 'Rahul@dwpsballabgarh.org',
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid Institutional ID or Password. All previous credentials have been nulled.'
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
