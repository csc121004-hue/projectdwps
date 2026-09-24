import { InquiryRecord, SchoolAnnouncement } from '../data/schoolData';

export interface DbHealthResponse {
  status: string;
  timestamp: string;
  database: {
    ok: boolean;
    configured: boolean;
    message: string;
    database?: string;
    version?: string;
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
  }
};
