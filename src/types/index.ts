

export interface Member {
  id?: string;
  _id?: string;
  family_id?: string;
  name?: string; // Keep for backward compatibility/computed purposes
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email: string;
  email_verified?: boolean;
    whatsapp?: string;
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
  relation?: string;
  gender?: string;
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
  _merged?: boolean;
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

export interface FamilyGroup {
  family_id: string;
  family_name: string;
  members: Member[];
}

export interface ArchivePost {
  id: string;
  author_id: string;
  content: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  // joined author fields from the API
  author_name?: string;
  author_photo?: string;
  // view tracking
  view_count?: number;
}
