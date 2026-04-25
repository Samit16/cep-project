

export interface Member {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  contact_no?: string;
  contact_numbers?: string[];
  profession?: string;
  occupation?: string;
  company?: string;
  city?: string;
  current_place?: string;
  kutch_town?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  education?: string;
  marital_status?: string;
  family_members?: string[];
  relations?: { name: string; relation: string }[];
  joinDate?: string;
  nukh?: string;
  birthplace?: string;
  status?: 'verified' | 'pending' | 'inactive' | string;
  active?: boolean;
  role?: 'member' | 'committee' | 'admin' | string;
  contactVisible?: boolean;
  contact_visibility?: string;
  address?: string;
  bio?: string;
  expertise?: string[];
  officePhotoUrl?: string;
  officeLocation?: string;
  idNumber?: string;
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
