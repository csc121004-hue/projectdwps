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
  'dwps_newsletter_subscribers',
  'dwps_fee_structures'
];

export const findDatabaseUrl = (): { url: string | null; detectedKey: string | null; availableEnvKeys: string[] } => {
  // Collect non-sensitive keys currently visible to Node runtime
  const allKeys = Object.keys(process.env);
  const relevantKeys = allKeys.filter(k => 
    !k.startsWith('npm_') && 
    !k.startsWith('_') && 
    !k.startsWith('VERCEL_ANALYTICS') &&
    k !== 'PATH'
  );

  // 1. Direct standard check
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    return { url: process.env.DATABASE_URL.trim(), detectedKey: 'DATABASE_URL', availableEnvKeys: relevantKeys };
  }

  // 2. Check case-insensitive and trimmed key names
  for (const [key, val] of Object.entries(process.env)) {
    if (!val || typeof val !== 'string') continue;
    const cleanKey = key.trim().toUpperCase();
    if (['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'NEON_DATABASE_URL', 'NEON_URL', 'DB_URL'].includes(cleanKey)) {
      if (val.trim() !== '') {
        return { url: val.trim(), detectedKey: key, availableEnvKeys: relevantKeys };
      }
    }
  }

  // 3. Fallback: Check if user named the variable "Value", "Key", or anything else that contains a postgres connection string
  for (const [key, val] of Object.entries(process.env)) {
    if (!val || typeof val !== 'string') continue;
    const trimmedVal = val.trim();
    if (trimmedVal.startsWith('postgres://') || trimmedVal.startsWith('postgresql://')) {
      return { url: trimmedVal, detectedKey: key, availableEnvKeys: relevantKeys };
    }
  }

  return { url: null, detectedKey: null, availableEnvKeys: relevantKeys };
};

export const isDatabaseConfigured = (): boolean => {
  return Boolean(findDatabaseUrl().url);
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
  const { url } = findDatabaseUrl();
  if (!url) return null;
  return neon(url);
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

  const { url, detectedKey, availableEnvKeys } = findDatabaseUrl();
  if (!url) {
    const keysList = availableEnvKeys.length > 0 ? availableEnvKeys.join(', ') : 'none';
    log(`[NeonDB] ⚠️ DATABASE_URL is not detected in environment variables.`);
    log(`[NeonDB] ℹ️ Non-sensitive env keys currently present in Vercel runtime: [ ${keysList} ]`);
    log(`[NeonDB] 💡 ACTION REQUIRED: In Vercel, after adding/editing an Environment Variable, you MUST click "Redeploy" under Deployments. Existing deployments never receive new variables automatically.`);
    return {
      ok: false,
      configured: false,
      message: `DATABASE_URL is not set in this deployment. Available env keys: [ ${keysList} ]. Please ensure the Key is named DATABASE_URL and trigger a Redeploy in Vercel.`,
      logs
    };
  }

  if (detectedKey !== 'DATABASE_URL') {
    log(`[NeonDB] ℹ️ Note: Detected database connection string under environment key "${detectedKey}". Using it!`);
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
        } else if (tableName === 'dwps_fee_structures') {
          const res = await sql`SELECT COUNT(*)::int as c FROM dwps_fee_structures`;
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

  const { url, detectedKey, availableEnvKeys } = findDatabaseUrl();
  if (!url) {
    const keysList = availableEnvKeys.length > 0 ? availableEnvKeys.join(', ') : 'none';
    log(`[NeonDB] ⚠️ Cannot initialize database: DATABASE_URL is not set.`);
    log(`[NeonDB] ℹ️ Non-sensitive env keys currently present in Vercel runtime: [ ${keysList} ]`);
    log(`[NeonDB] 💡 Remember: In Vercel, after saving DATABASE_URL, you MUST trigger a Redeploy under Deployments!`);
    return {
      success: false,
      message: `DATABASE_URL is not configured in this deployment. Available keys: [ ${keysList} ]. Please check Vercel Environment Variables and Redeploy.`,
      tables: [],
      logs
    };
  }

  if (detectedKey !== 'DATABASE_URL') {
    log(`[NeonDB] ℹ️ Initializing using database URL found in env key "${detectedKey}"`);
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

    // 6. Fee structures & tuition rates table
    await sql`
      CREATE TABLE IF NOT EXISTS dwps_fee_structures (
        id VARCHAR(64) PRIMARY KEY,
        grade_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        age_group VARCHAR(100),
        monthly_tuition INT NOT NULL,
        annual_charges INT NOT NULL,
        activity_smart_class INT NOT NULL,
        admission_fee INT NOT NULL,
        security_deposit INT NOT NULL,
        description TEXT,
        features JSONB DEFAULT '[]'::jsonb,
        display_order INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    log('[NeonDB] ✓ Table verified/created: dwps_fee_structures');

    // Seed default fee structures if empty
    const feeCount = await sql`SELECT COUNT(*)::int as count FROM dwps_fee_structures`;
    if ((feeCount[0]?.count || 0) === 0) {
      log('[NeonDB] 🌿 Seeding initial grade fee structures into dwps_fee_structures...');
      const defaultFees = [
        {
          id: 'playgroup',
          gradeName: 'Playgroup (Toddlers)',
          category: 'Early Years',
          ageGroup: '2.5 – 3 Years',
          monthlyTuition: 2600,
          annualCharges: 3500,
          activitySmartClass: 400,
          admissionFee: 4000,
          securityDeposit: 1500,
          description: 'Montessori play modules, gross motor skills play arena, sensory toy learning, and storytelling.',
          features: ['1:15 Student-Teacher Ratio', 'Child-Safe Soft Play Area', 'Mid-day healthy snack monitoring', 'Air-cooled child suites']
        },
        {
          id: 'nursery',
          gradeName: 'Nursery',
          category: 'Early Years',
          ageGroup: '3 – 4 Years',
          monthlyTuition: 2800,
          annualCharges: 3800,
          activitySmartClass: 450,
          admissionFee: 4500,
          securityDeposit: 1500,
          description: 'Early childhood phonics, numeracy readiness, creative arts, rhythm, and social confidence building.',
          features: ['Phonics & Pre-reading Modules', 'Interactive smart audiovisuals', 'Indoor & outdoor recreation', 'Parent consultation portal']
        },
        {
          id: 'lkg',
          gradeName: 'L.KG (Lower KG)',
          category: 'Early Years',
          ageGroup: '4 – 5 Years',
          monthlyTuition: 3000,
          annualCharges: 4000,
          activitySmartClass: 500,
          admissionFee: 4500,
          securityDeposit: 1500,
          description: 'Foundational literacy in English & Hindi, practical math concepts, expressive speaking, and fine arts.',
          features: ['Bilingual speech foundations', 'Early STEM science puzzles', 'Music, dance & physical fitness', 'Pre-writing & motor skills']
        },
        {
          id: 'ukg',
          gradeName: 'U.KG (Upper KG)',
          category: 'Early Years',
          ageGroup: '5 – 6 Years',
          monthlyTuition: 3200,
          annualCharges: 4200,
          activitySmartClass: 500,
          admissionFee: 4800,
          securityDeposit: 1500,
          description: 'Pre-primary graduation stage focusing on advanced phonics, sentence formation, mental math, and seamless transition to Grade 1.',
          features: ['Smooth Grade 1 transition kit', 'Sentence formation & phonics mastery', 'Early science & environmental exploration', 'Confidence & stage speech presentation']
        },
        {
          id: 'class-1',
          gradeName: 'Class 1 (Grade 1)',
          category: 'Primary Wing',
          ageGroup: '6 – 7 Years',
          monthlyTuition: 3300,
          annualCharges: 4500,
          activitySmartClass: 550,
          admissionFee: 5000,
          securityDeposit: 2000,
          description: 'Formal CBSE foundational primary stage with interactive digital smart boards, arithmetic, and phonetics.',
          features: ['Smart Classroom Digitization', 'Math lab & hands-on manipulatives', 'Weekly sports & physical training', 'Reading club & library access']
        },
        {
          id: 'class-2',
          gradeName: 'Class 2 (Grade 2)',
          category: 'Primary Wing',
          ageGroup: '7 – 8 Years',
          monthlyTuition: 3300,
          annualCharges: 4500,
          activitySmartClass: 550,
          admissionFee: 5000,
          securityDeposit: 2000,
          description: 'Consolidating reading fluency, mental arithmetic, conversational English, and environmental exploration.',
          features: ['Interactive Smart Boards', 'Mental Math & Logic Puzzles', 'Physical Education & Yoga', 'Art, Craft & Creative Writing']
        },
        {
          id: 'grade-3-5',
          gradeName: 'Class 3 to 5 (Grades 3–5)',
          category: 'Primary Wing',
          ageGroup: '8 – 11 Years',
          monthlyTuition: 3600,
          annualCharges: 4800,
          activitySmartClass: 600,
          admissionFee: 5000,
          securityDeposit: 2000,
          description: 'Conceptual STEM science, English vocabulary mastery, computer lab literacy, and competitive sports.',
          features: ['Computer & Coding basics', 'Science experimentation kits', 'Public speaking & debate rounds', 'Inter-house competitions']
        },
        {
          id: 'class-6',
          gradeName: 'Class 6 (Grade 6)',
          category: 'Middle Wing',
          ageGroup: '11 – 12 Years',
          monthlyTuition: 4000,
          annualCharges: 5200,
          activitySmartClass: 700,
          admissionFee: 5500,
          securityDeposit: 2500,
          description: 'Middle school entry level focusing on composite science labs, STEM concepts, coding, and sports.',
          features: ['CBSE Middle Curriculum', 'Science & Math practical labs', 'Robotics & Computer Programming', 'Inter-House Sports & Olympiad prep']
        },
        {
          id: 'class-7',
          gradeName: 'Class 7 (Grade 7)',
          category: 'Middle Wing',
          ageGroup: '12 – 13 Years',
          monthlyTuition: 4000,
          annualCharges: 5200,
          activitySmartClass: 700,
          admissionFee: 5500,
          securityDeposit: 2500,
          description: 'Analytical skill building, scientific experimentation, debate and literary clubs, and competitive sports coaching.',
          features: ['Advanced Science Lab experiments', 'English Literary & Debate Club', 'Digital IT & Computational Thinking', 'Sports training & athletics']
        },
        {
          id: 'class-8',
          gradeName: 'Class 8 (Grade 8)',
          category: 'Middle Wing',
          ageGroup: '13 – 14 Years',
          monthlyTuition: 4000,
          annualCharges: 5200,
          activitySmartClass: 700,
          admissionFee: 5500,
          securityDeposit: 2500,
          description: 'Culminating middle school stage preparing students for secondary board syllabus, leadership, and Olympiads.',
          features: ['Secondary Board readiness syllabus', 'Advanced STEM & Chemistry/Physics lab', 'Student Leadership Council', 'Career guidance & aptitude coaching']
        }
      ];

      for (let i = 0; i < defaultFees.length; i++) {
        const f = defaultFees[i];
        await sql`
          INSERT INTO dwps_fee_structures (
            id, grade_name, category, age_group, monthly_tuition, annual_charges,
            activity_smart_class, admission_fee, security_deposit, description, features, display_order
          ) VALUES (
            ${f.id}, ${f.gradeName}, ${f.category}, ${f.ageGroup}, ${f.monthlyTuition}, ${f.annualCharges},
            ${f.activitySmartClass}, ${f.admissionFee}, ${f.securityDeposit}, ${f.description},
            ${JSON.stringify(f.features)}::jsonb, ${i}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      log('[NeonDB] ✓ Seeded 6 grade fee structures into dwps_fee_structures.');
    }

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
