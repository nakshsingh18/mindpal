// src/types.tsx

export interface Pet {
  name: string;
  emoji: string;
  color: string;
  type: 'dog' | 'cat' | 'rabbit' | 'penguin'; // Added type property
  description?: string; // Added description property
}

export type Profile = {
  id: string;
  updated_at?: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  coins: number;
  pet_type?: string;
  pet_name?: string;
  pet_hunger?: number;
  pet_happiness?: number;
  pet_health?: number;
  last_fed?: string;
  last_played?: string;
};

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  user_type?: 'user' | 'therapist';
  is_Premium?: boolean;
  createdAt?: Date;
  selected_pet?: Pet | null;
  coins?: number;
  journal_entries?: any[];
  pet_mood?: string;
}

export interface TherapistProfile {
  id: string; // auth user id
  name: string;
  specialization?: string;
  experience?: string;
  description?: string;
  avatar?: string;
  rating?: number;
  languages?: string[];
  response_time?: string;
  price?: number;
}

export interface TherapistRequest {
  id: string;
  user_id: string;
  therapist_id: string;
  message?: string;
  status: 'pending'|'accepted'|'rejected';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

// Journal Entry type
export interface JournalEntry {
  mood: "happy" | "sad" | "calm" | "anxious" | "excited" | "angry" | "irritated" | "frustrated" | "content" | "energetic";
  content: string;
  date: Date;
  confidence?: number;
  aiAnalysis?: string;
}

// Mood Analytics types
export interface MoodAnalytics {
  totalEntries: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  moodDistribution: { name: string; value: number; color: string }[];
  trend: 'improving' | 'declining' | 'stable';
  suggestions: string[];
  rewards: MoodReward[];
}

export interface MoodReward {
  type: string;
  title: string;
  description: string;
  emoji: string;
  coinReward: number;
}