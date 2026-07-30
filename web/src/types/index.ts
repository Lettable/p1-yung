// User Types
export interface User {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'admin' | 'agent' | 'client';
  accountBalance: number; // in cents
  monthlySpent: number;
  accountCreatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  apiKey: string;
  settings: UserSettings;
}

export interface UserSettings {
  callerID?: string;
  selectedAudio?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

// Campaign Types
export interface CallCampaign {
  _id: string;
  userId: string;
  campaignName: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  phoneNumbers: string[];
  audioScript: string;
  greetingAudio: string;
  totalCalls: number;
  completedCalls: number;
  answeredCalls: number;
  failedCalls: number;
  averageDuration: number;
  costPerMinute: number;
  totalCost: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  trunkCapacity: number;
  currentTrunksInUse: number;
}

// Call Record Types
export interface CallRecord {
  _id: string;
  campaignId: string;
  userId: string;
  phoneNumber: string;
  callerID: string;
  status: 'pending' | 'ringing' | 'answered' | 'failed' | 'completed';
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  recordingPath?: string;
  recordingUrl?: string;
  recordingFilesize?: number;
  dtmfPressed?: string;
  dtmfPressedTime?: Date;
  agentHandledBy?: string;
  cost: number; // cents
  notes?: string;
}

// Greeting Types
export interface Greeting {
  _id: string;
  name: string;
  filename: string;
  duration: number;
  category: 'bank' | 'telecom' | 'custom' | 'test';
  audioUrl: string;
  isGlobal: boolean;
  createdBy?: string;
  createdAt: Date;
}

// Agent Types
export interface Agent {
  _id: string;
  userId: string;
  extensionNumber: number;
  agentName: string;
  isActive: boolean;
  isOnline: boolean;
  currentCallChannel?: string;
  currentCallNumber?: string;
  currentCallDuration?: number;
  totalCallsHandled: number;
  totalDtmfCaptured: string[];
  lastLogin?: Date;
  qrCode?: string;
}

// Transaction Types
export interface Transaction {
  _id: string;
  userId: string;
  type: 'topup' | 'charge';
  amount: number; // cents
  paymentMethod: 'admin_manual' | 'stripe' | 'crypto' | 'other';
  campaignId?: string;
  description: string;
  createdAt: Date;
  createdBy?: string;
  status: 'completed' | 'pending' | 'failed';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalLaunched: number;
  totalAnswered: number;
  answerRate: number;
  totalSpent: number;
  accountBalance: number;
  currentlyLive: number;
}

// Platform Analytics (Admin)
export interface PlatformAnalytics {
  totalCalls: number;
  totalAnswered: number;
  answerRate: number;
  totalRevenue: number;
  activeUsers: number;
  topUsers: Array<{
    userId: string;
    username: string;
    totalCalls: number;
    totalSpent: number;
  }>;
}

// Session Types
export interface Session {
  user: {
    _id: string;
    email: string;
    username: string;
    role: 'admin' | 'agent' | 'client';
    image?: string;
  };
  expires: string;
}
