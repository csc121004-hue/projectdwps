import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

export interface TableSummary {
  name: string;
  exists: boolean;
  rowCount: number;
}

export interface DbStatus {
  ok: boolean;
  configured: boolean;
  message: string;
  database?: string;
  user?: string;
  version?: string;
  hostMasked?: string;
  tables?: TableSummary[];
  allPublicTables?: string[];
  logs?: string[];
}

export const EXPECTED_TABLES = [
  'dwps_inquiries',
  'dwps_tour_bookings',
  'dwps_newsletters',
  'dwps_announcements',
  'dwps_newsletter_subscribers'
];

export const isDatabaseConfigured = (): boolean => {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
};

export const getMaskedConnectionString = (url?: string): string => {
  if (!url) return 'Not Configured';
  try {
    const parsed = new URL(url);
    const pass = parsed.password ? '****' : '';
    const auth = parsed.username ? `${parsed.username}:${pass}@` : '';
    return `${parsed.protocol}//${auth}${parsed.host}${parsed.pathname}`;
  } catch {
    return 'postgresql://[configured]';
  }
};

export const getSql = () => {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === '') return null;
  return neon(url.trim());
};

/**
 * Checks connection to Neon and returns list of tables and counts.
 */
export async function checkDbConnection(): Promise<DbStatus> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    console.log(msg);
  };

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    log('[NeonDB] ⚠️ DATABASE_URL is not set. Running in local session fallback mode.');
    return {
      ok: false,
      configured: false,
      message: 'DATABASE_URL is not set in environment variables. Running in local fallback mode.',
      logs
    };
  }

  log(`[NeonDB] 🔍 Connecting to Neon database: ${getMaskedConnectionString(url)}`);

  try {
    const sql = neon(url);
    const start = Date.now();
    const result = await sql`SELECT current_database() as db, current_user as usr, version() as ver`;
    const latency = Date.now() - start;

    const dbName = (result[0]?.db as string) || 'neondb';
    const currentUser = (result[0]?.usr as string) || 'unknown';
    const rawVer = (result[0]?.ver as string) || '';
    const verDisplay = rawVer.split(' ')[0] + ' ' + (rawVer.split(' ')[1] || '');

    log(`[NeonDB] ✅ Connected successfully to database "${dbName}" as user "${currentUser}" (${latency}ms)`);

    // Query tables existing in public schema
    const tableRows = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `;
    const existingTableNames = tableRows.map((r: any) => String(r.table_name));
    log(`[NeonDB] 📋 Public schema tables found (${existingTableNames.length}): [ ${existingTableNames.join(', ')} ]`);

    // Get table counts using tagged template literals
    const getCount = async (tableName: string): Promise<number> => {
      try {
        if (tableName === 'dwps_inquiries') {
          const res = await sql`SELECT COUNT(*)::int as c FROM dwps_inquiries`;
          return Number(res[0]?.c) || 0;
        } else if (tableName === 'dwps_tour_bookings') {
          const res = await sql`SELECT COUNT(*)::int as c FROM dwps_tour_bookings`;
          return Number(res[0]?.c) || 0;
        } else if (tableName === 'dwps_newsletters') {
          const res = await sql`SELECT COUNT(*)::int as c FROM dwps_newsletters`;
          return Number(res[0]?.c) || 0;
        } else if (tableName === 'dwps_announcements') {
          const res = await sql`SELECT COUNT(*)::int as c FROM dwps_announcements`;
          return Number(res[0]?.c) || 0;
        } else if (tableName === 'dwps_newsletter_subscribers') {
          const res = await sql`SELECT COUNT(*)::int as c FROM dwps_newsletter_subscribers`;
          return Number(res[0]?.c) || 0;
        }
      } catch {
        return 0;
      }
      return 0;
    };

    const tableSummaries: TableSummary[] = [];
    for (const tbl of EXPECTED_TABLES) {
      const exists = existingTableNames.includes(tbl);
      const count = exists ? await getCount(tbl) : 0;
      tableSummaries.push({
        name: tbl,
        exists,
        rowCount: count
      });
    }

    const allCreated = EXPECTED_TABLES.every((tbl) => existingTableNames.includes(tbl));
    const statusMessage = allCreated
      ? `Connected to Neon database "${dbName}". All ${EXPECTED_TABLES.length} DWPS application tables exist in public schema.`
      : `Connected to Neon database "${dbName}". ${existingTableNames.length} tables found (some expected tables may need initialization).`;

    return {
      ok: true,
      configured: true,
      message: statusMessage,
      database: dbName,
      user: currentUser,
      version: verDisplay,
      hostMasked: getMaskedConnectionString(url),
      tables: tableSummaries,
      allPublicTables: existingTableNames,
      logs
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    log(`[NeonDB] ❌ Database connection error: ${errMsg}`);
    return {
      ok: false,
      configured: true,
      message: `Failed to connect to Neon DB: ${errMsg}`,
      hostMasked: getMaskedConnectionString(url),
      logs
    };
  }
}

/**
 * Initializes all required tables and seeds initial sample records if empty.
 */
export async function initializeDatabase(): Promise<{ success: boolean; message: string; tables: string[]; logs: string[] }> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    console.log(msg);
  };

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    log('[NeonDB] ⚠️ Cannot initialize database: DATABASE_URL is not set.');
    return {
      success: false,
      message: 'DATABASE_URL is not configured.',
      tables: [],
      logs
    };
  }

  log(`[NeonDB] 🚀 Starting table initialization on Neon database...`);

  try {
    const sql = neon(url);

    // 1. Admission inquiries table
    await sql`
      CREATE TABLE IF NOT EXISTS dwps_inquiries (
        id VARCHAR(64) PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        grade VARCHAR(50) NOT NULL,
        message TEXT,
        date VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'New',
        notes TEXT,
        priority VARCHAR(20) DEFAULT 'Normal',
        follow_up_date VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    log('[NeonDB] ✓ Table verified/created: dwps_inquiries');

    // 2. Campus tour bookings table
    await sql`
      CREATE TABLE IF NOT EXISTS dwps_tour_bookings (
        id VARCHAR(64) PRIMARY KEY,
        parent_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        preferred_date VARCHAR(50) NOT NULL,
        preferred_slot VARCHAR(50) NOT NULL,
        grade_interested VARCHAR(50),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'Confirmed',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    log('[NeonDB] ✓ Table verified/created: dwps_tour_bookings');

    // 3. Newsletters & bulletins table
    await sql`
      CREATE TABLE IF NOT EXISTS dwps_newsletters (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        edition VARCHAR(100),
        publish_date VARCHAR(50),
        category VARCHAR(100),
        cover_image_url TEXT,
        summary TEXT,
        content TEXT,
        author VARCHAR(100),
        is_live BOOLEAN DEFAULT true,
        highlights JSONB DEFAULT '[]'::jsonb,
        pdf_download_url TEXT,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    log('[NeonDB] ✓ Table verified/created: dwps_newsletters');

    // 4. Announcements table
    await sql`
      CREATE TABLE IF NOT EXISTS dwps_announcements (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        date VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        badge VARCHAR(50),
        is_urgent BOOLEAN DEFAULT false,
        action_label VARCHAR(100),
        action_link TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    log('[NeonDB] ✓ Table verified/created: dwps_announcements');

    // 5. Newsletter Subscribers table
    await sql`
      CREATE TABLE IF NOT EXISTS dwps_newsletter_subscribers (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    log('[NeonDB] ✓ Table verified/created: dwps_newsletter_subscribers');

    // Seed sample announcements if table is empty so Neon console immediately shows data
    const annCount = await sql`SELECT COUNT(*)::int as count FROM dwps_announcements`;
    if ((annCount[0]?.count || 0) === 0) {
      log('[NeonDB] 🌿 Seeding initial school announcements into dwps_announcements...');
      await sql`
        INSERT INTO dwps_announcements (id, title, category, date, content, badge, is_urgent, action_label)
        VALUES 
          ('ann-1', 'Admissions Open for Academic Session 2026-27', 'Admissions', '2026-04-01', 'Admissions are officially open from Pre-Nursery to Grade XII with special merit scholarships.', 'Admissions Open', true, 'Apply Online'),
          ('ann-2', 'Annual Sports Meet & Athletic Championship 2026', 'Sports', '2026-04-18', 'Annual Inter-House Track and Field meet scheduled at the DWPS International Sports Arena.', 'Upcoming Event', false, 'View Schedule'),
          ('ann-3', 'CBSE Board Examination Outstanding Results Celebration', 'Academic', '2026-03-20', 'Congratulations to our Grade X & XII toppers achieving 100% pass record with 42 city distinctions.', 'Academic Honor', false, 'Read More')
        ON CONFLICT (id) DO NOTHING;
      `;
      log('[NeonDB] ✓ Seeded 3 sample announcements into dwps_announcements.');
    }

    // Seed sample inquiry if empty
    const inqCount = await sql`SELECT COUNT(*)::int as count FROM dwps_inquiries`;
    if ((inqCount[0]?.count || 0) === 0) {
      log('[NeonDB] 🌿 Seeding initial sample inquiry into dwps_inquiries...');
      await sql`
        INSERT INTO dwps_inquiries (id, student_name, phone, email, grade, message, date, status, priority)
        VALUES 
          ('inq-seed-1', 'Aarav Sharma', '+91 98765 43210', 'parent.aarav@example.com', 'Grade 6', 'Interested in STEM curriculum and sports facilities for 2026 session.', '2026-04-02', 'New', 'High')
        ON CONFLICT (id) DO NOTHING;
      `;
      log('[NeonDB] ✓ Seeded 1 sample inquiry into dwps_inquiries.');
    }

    // Retrieve verified list of tables in public schema
    const verified = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `;
    const verifiedTables = verified.map((r: any) => String(r.table_name));

    log(`[NeonDB] 🎉 Database schema successfully initialized and verified!`);
    log(`[NeonDB] 📊 Tables in Neon Console (public schema): ${verifiedTables.join(', ')}`);

    return {
      success: true,
      message: `Database successfully initialized! All tables verified in schema 'public'.`,
      tables: verifiedTables,
      logs
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    log(`[NeonDB] ⚠️ Initialization error: ${errMsg}`);
    return {
      success: false,
      message: `Initialization error: ${errMsg}`,
      tables: [],
      logs
    };
  }
}
