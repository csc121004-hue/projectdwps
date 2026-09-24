import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

export interface DbStatus {
  ok: boolean;
  configured: boolean;
  message: string;
  database?: string;
  version?: string;
}

export const isDatabaseConfigured = (): boolean => {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
};

export const getSql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
};

export async function checkDbConnection(): Promise<DbStatus> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return {
      ok: false,
      configured: false,
      message: 'DATABASE_URL is not set. Running in local fallback mode.'
    };
  }

  try {
    const sql = neon(url);
    const result = await sql`SELECT current_database() as db, version() as ver`;
    const dbName = result[0]?.db as string;
    const versionStr = result[0]?.ver as string;

    return {
      ok: true,
      configured: true,
      message: `Connected to Neon PostgreSQL database: "${dbName}"`,
      database: dbName,
      version: versionStr ? versionStr.split(' ')[0] + ' ' + versionStr.split(' ')[1] : 'PostgreSQL'
    };
  } catch (err: any) {
    return {
      ok: false,
      configured: true,
      message: `Failed to connect to Neon DB: ${err?.message || String(err)}`
    };
  }
}

export async function initializeDatabase(): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return false;

  try {
    const sql = neon(url);

    // 1. Admission inquiries
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

    // 2. Campus tour bookings
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

    // 3. Newsletters & bulletins
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

    // 4. Announcements
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

    // 5. Newsletter Subscribers
    await sql`
      CREATE TABLE IF NOT EXISTS dwps_newsletter_subscribers (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return true;
  } catch (err) {
    console.warn('⚠️ Neon database initialization note:', err);
    return false;
  }
}
