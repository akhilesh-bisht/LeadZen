export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "not_interested"
  | "converted";

export type UserRole = "admin" | "sales_rep";
export type DashboardPermission = "overview" | "search" | "leads" | "team";
export type LeadPriority = "normal" | "high";

export interface IUser {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: DashboardPermission[];
  teamMemberId?: string;
  avatarColor?: string;
  phone?: string;
  active: boolean;
  createdAt?: string | Date;
  lastLogin?: string | Date;
}

export interface UserWithAuth extends IUser {
  token?: string;
}

export interface AuthSession {
  user: IUser;
  token: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatarColor: string;
  phone?: string;
  active: boolean;
  userId?: string;
  createdAt?: string;
}

export interface ILead {
  _id?: string;
  businessName: string;
  category: string;
  address?: string | null;
  city: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  priority?: LeadPriority;
  instagram?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  externalId?: string | null;
  source: string;
  status: LeadStatus;
  assignedTo?: string | null;
  assignedAt?: string | Date | null;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LeadSearchResult {
  businessName: string;
  category: string;
  address: string | null;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  priority?: LeadPriority;
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviewCount: number | null;
  externalId: string | null;
  source: string;
  isSaved?: boolean;
  savedLeadId?: string;
  savedStatus?: LeadStatus;
  assignedTo?: string | null;
}

export interface TeamWorkloadStats {
  memberId: string;
  memberName: string;
  role: string;
  avatarColor: string;
  totalAssigned: number;
  contacted: number;
  interested: number;
  converted: number;
  uncontacted: number;
}

export interface DashboardStats {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  not_interested: number;
  converted: number;
  unassignedCount: number;
  assignedCount: number;
  teamWorkload: TeamWorkloadStats[];
  categoriesCount: { category: string; count: number }[];
  citiesCount: { city: string; count: number }[];
  recentLeads: ILead[];
  dbType: "mongodb" | "local_persistent";
}

export interface LeadsQueryParams {
  search?: string;
  category?: string;
  city?: string;
  status?: string;
  assignedTo?: string;
  sortBy?:
    | "createdAt"
    | "businessName"
    | "rating"
    | "reviewCount"
    | "status"
    | "assignedTo";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  leads: ILead[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  availableCategories: string[];
  availableCities: string[];
  availableAssignees: string[];
}
