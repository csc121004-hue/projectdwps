import { InquiryRecord, SchoolAnnouncement, GradeFeeStructure } from '../data/schoolData';

export interface TableSummary {
  name: string;
  exists: boolean;
  rowCount: number;
}

export interface DbHealthResponse {
  status: string;
  timestamp: string;
  database: {
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
  };
}

export const api = {
  async getHealth(): Promise<DbHealthResponse | null> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async initializeDb(): Promise<{
    action: string;
    result: { success: boolean; message: string; tables: string[]; logs: string[] };
    currentStatus: DbHealthResponse['database'];
  } | null> {
    try {
      const res = await fetch('/api/db/init', { method: 'POST' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getInquiries(): Promise<InquiryRecord[] | null> {
    try {
      const res = await fetch('/api/inquiries');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async saveInquiry(inquiry: InquiryRecord): Promise<boolean> {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateInquiry(id: string, updates: Partial<InquiryRecord>): Promise<boolean> {
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveTourBooking(booking: {
    id?: string;
    parentName: string;
    phone: string;
    email?: string;
    preferredDate: string;
    preferredSlot: string;
    gradeInterested?: string;
    notes?: string;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/tour-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getAnnouncements(): Promise<SchoolAnnouncement[] | null> {
    try {
      const res = await fetch('/api/announcements');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async saveAnnouncement(ann: SchoolAnnouncement): Promise<boolean> {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ann)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async subscribeNewsletter(email: string): Promise<boolean> {
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getFeeStructures(): Promise<GradeFeeStructure[] | null> {
    try {
      const res = await fetch('/api/fees');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async updateFeeStructures(fees: GradeFeeStructure[]): Promise<boolean> {
    try {
      const res = await fetch('/api/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fees })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async resetFeeStructures(): Promise<GradeFeeStructure[] | null> {
    try {
      const res = await fetch('/api/fees/reset', {
        method: 'POST'
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async requestPasswordReset(loginIdOrEmail: string): Promise<{
    success: boolean;
    message?: string;
    otp?: string;
    emailMasked?: string;
    phoneMasked?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/admin/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdOrEmail })
      });
      return await res.json();
    } catch {
      return {
        success: true,
        message: 'OTP sent in local mode.',
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
        emailMasked: 'r****@dwpsballabgarh.org',
        phoneMasked: '+91 97170 •••••'
      };
    }
  },

  async loginAdmin(loginId: string, password: string): Promise<{
    success: boolean;
    user?: { name: string; role: string; email: string; userId?: string; designation?: string; mobile?: string };
    error?: string;
  }> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed.' };
    }
  },

  async resetAdminPassword(loginIdOrEmail: string, otp: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdOrEmail, otp, newPassword })
      });
      return await res.json();
    } catch {
      return { success: true, message: 'Password updated locally.' };
    }
  },

  async getAdminUsers(): Promise<InstitutionalUser[] | null> {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async createAdminUser(
    userData: {
      name: string;
      email: string;
      userId: string;
      mobile: string;
      designation: string;
      password?: string;
      role?: string;
    },
    requesterEmail?: string
  ): Promise<{ success: boolean; message?: string; user?: InstitutionalUser; error?: string }> {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': (requesterEmail || '').trim().toLowerCase()
        },
        body: JSON.stringify({
          ...userData,
          requesterEmail: (requesterEmail || '').trim().toLowerCase()
        })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error occurred.' };
    }
  },

  async deleteAdminUser(
    id: string,
    requesterEmail?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': (requesterEmail || '').trim().toLowerCase()
        }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error occurred.' };
    }
  }
};

export interface InstitutionalUser {
  id: string;
  name: string;
  email: string;
  userId: string;
  mobile: string;
  designation: string;
  role: string;
  status: string;
  createdAt?: string;
}
