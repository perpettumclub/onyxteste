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

export interface TaskLabel {
  id: string;
  name: string;
  color: string; // Tailwind color class like 'bg-red-500'
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

// Playbook - Killer Feature do MVP 0
export interface Playbook {
  id: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'LINK' | 'CHECKLIST';
  url: string;
  duration?: string; // ex: "4min" para vídeos
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  // Gantt Chart fields
  startDate?: string;      // Data de início (ISO string)
  endDate?: string;        // Data de término (ISO string)
  progress?: number;       // Progresso 0-100%
  parentTaskId?: string;   // Para subtarefas/dependências
  comments: Comment[];
  labels?: TaskLabel[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  checklist?: ChecklistItem[];
  subtasks?: Subtask[];
  // Playbook-Powered Kanban - MVP 0
  playbooks?: Playbook[];
  xp_reward?: number; // XP ganho ao completar (default: 50)
}

// Activity Log para Channel View (Feed de Atividades)
export type ActivityAction = 'CREATED' | 'UPDATED' | 'COMPLETED' | 'COMMENTED' | 'ASSIGNED' | 'STATUS_CHANGED';

export interface ActivityLog {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  taskId?: string;
  taskTitle?: string;
  action: ActivityAction;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface LessonMaterial {
  id: string;
  title: string;
  file_url: string;
  file_type: 'PDF' | 'LINK' | 'DOWNLOAD';
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'VIDEO' | 'TEXT' | 'DOCUMENT';
  isCompleted: boolean;
  contentUrl?: string;
  materials?: LessonMaterial[];
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
  manualGrossRevenue?: number;
  manualDailyAverage?: number;
  manualProjectionDays?: number;
  customTaxes?: { name: string, percentage: number }[];
}

export interface SalesConfig {
  tenant_id: string;
  financial_goal_target: number;
  financial_goal_start_date: string;
  platform_fee_percentage: number;
  expert_split_percentage: number;
  team_split_percentage: number;
  manual_gross_revenue?: number;
  manual_daily_average?: number;
  manual_projection_days?: number;
  custom_taxes?: { name: string, percentage: number }[];
}

export interface Subscription {
  tenant_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  kiwify_order_id?: string;
  kiwify_customer_email?: string;
  plan_id: 'starter' | 'pro' | 'business';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

export interface Transaction {
  id: string;
  customerName: string;
  productName: string;
  amount: number;
  date: string;
  status: 'APPROVED' | 'PENDING' | 'REFUNDED';
}

// Gamification Types
export interface UserGamification {
  user_id: string;
  tenant_id: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_lessons_completed: number;
  total_watch_time_minutes: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: 'LESSONS_COMPLETED' | 'STREAK_DAYS' | 'XP_EARNED' | 'MODULES_COMPLETED' | 'FIRST_LESSON' | 'FIRST_COMMENT';
  condition_value: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface ActivityFeedItem {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  activity_type: 'LESSON_COMPLETED' | 'ACHIEVEMENT_UNLOCKED' | 'STREAK_MILESTONE' | 'MODULE_COMPLETED' | 'NEW_MEMBER' | 'PURCHASE' | 'LEVEL_UP';
  activity_data?: Record<string, unknown>;
  message: string;
  created_at: string;
}

// XP rewards for different actions
export const XP_REWARDS = {
  TASK_COMPLETE: 50,      // Completar task
  TASK_COMPLETE_HIGH: 100, // Completar task de alta prioridade
  LESSON_COMPLETE: 25,
  MODULE_COMPLETE: 100,
  STREAK_DAY: 10,
  FIRST_LOGIN_DAY: 5,
  COMMENT: 5,
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2200,   // Level 7
  3000,   // Level 8
  4000,   // Level 9
  5500,   // Level 10
];

export const LEVEL_NAMES = [
  'Bronze',     // 1
  'Bronze II',  // 2
  'Prata',      // 3
  'Prata II',   // 4
  'Ouro',       // 5
  'Ouro II',    // 6
  'Platina',    // 7
  'Platina II', // 8
  'Diamante',   // 9
  'Mestre',     // 10
];

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  KANBAN = 'KANBAN',
  LEADS = 'LEADS',
  SALES = 'SALES',
  MEMBER_AREA = 'MEMBER_AREA',
  BILLING = 'BILLING',
  SETTINGS = 'SETTINGS'
}