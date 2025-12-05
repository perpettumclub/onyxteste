export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  plan?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  comments: Comment[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'VIDEO' | 'TEXT' | 'DOCUMENT';
  isCompleted: boolean;
  contentUrl?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  image?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  value: number;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST';
  lastContact: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  planName: string;
}

export interface Post {
  id: string;
  author: string;
  authorRole: string;
  time: string;
  title?: string;
  content: string;
  likes: number;
  comments: number;
  pinned: boolean;
  avatar?: string;
}

export interface FinancialGoal {
  current: number;
  target: number;
  startDate: string; // ISO Date
}

export interface SalesMetrics {
  grossTotal: number;
  platformFeePercentage: number; // e.g., 0.10 for 10%
  expertSplitPercentage: number; // e.g., 0.60 for 60% of Net
  teamSplitPercentage: number;   // e.g., 0.40 for 40% of Net
  manualDailyAverage?: number;
  manualProjectionDays?: number;
}

export interface Transaction {
  id: string;
  customerName: string;
  productName: string;
  amount: number;
  date: string;
  status: 'APPROVED' | 'PENDING' | 'REFUNDED';
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  KANBAN = 'KANBAN',
  LEADS = 'LEADS',
  SALES = 'SALES', // New View
  MEMBER_AREA = 'MEMBER_AREA',
  BILLING = 'BILLING',
  SETTINGS = 'SETTINGS'
}