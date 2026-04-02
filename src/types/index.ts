

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profession: string;
  company?: string;
  city: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  education?: string;
  joinDate: string;
  status: 'verified' | 'pending' | 'inactive';
  role: 'member' | 'committee' | 'admin';
  contactVisible: boolean;
  address?: string;
  bio?: string;
  expertise?: string[];
  officePhotoUrl?: string;
  officeLocation?: string;
  idNumber: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  description: string;
  imageUrl?: string;
  importantNotes?: string;
  committeeContacts: {
    name: string;
    phone: string;
  }[];
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
}

export interface StatsData {
  totalMembers: number;
  verifiedProfessionals: number;
  newApplications: number;
  globalChapters: number;
}
