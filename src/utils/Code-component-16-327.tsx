import { AnalyzedMood } from './sentimentAnalysis';

export interface JournalEntry {
  mood: AnalyzedMood;
  content: string;
  date: Date;
  confidence?: number;
  aiAnalysis?: string;
}

export interface MoodAnalytics {
  totalEntries: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  moodCounts: { [key in AnalyzedMood]: number };
  recentTrend: 'improving' | 'declining' | 'stable';
  dominantMood: AnalyzedMood;
  suggestions: string[];
  rewards: MoodReward[];
}

export interface MoodReward {
  type: 'positive_streak' | 'balance_achievement' | 'growth_milestone' | 'consistency_bonus';
  title: string;
  description: string;
  coinReward: number;
  emoji: string;
}

// Categorize moods into positive, negative, and neutral
const POSITIVE_MOODS: AnalyzedMood[] = ['happy', 'excited', 'energetic', 'content'];
const NEGATIVE_MOODS: AnalyzedMood[] = ['sad', 'anxious', 'angry', 'irritated', 'frustrated'];
const NEUTRAL_MOODS: AnalyzedMood[] = ['calm'];

export function categorizeMood(mood: AnalyzedMood): 'positive' | 'negative' | 'neutral' {
  if (POSITIVE_MOODS.includes(mood)) return 'positive';
  if (NEGATIVE_MOODS.includes(mood)) return 'negative';
  return 'neutral';
}

export function analyzeMoods(entries: JournalEntry[]): MoodAnalytics {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      positivePercentage: 0,
      negativePercentage: 0,
      neutralPercentage: 0,
      moodCounts: {
        happy: 0, excited: 0, energetic: 0, content: 0,
        sad: 0, anxious: 0, angry: 0, irritated: 0, frustrated: 0,
        calm: 0
      },
      recentTrend: 'stable',
      dominantMood: 'calm',
      suggestions: [],
      rewards: []
    };
  }

  // Count moods
  const moodCounts: { [key in AnalyzedMood]: number } = {
    happy: 0, excited: 0, energetic: 0, content: 0,
    sad: 0, anxious: 0, angry: 0, irritated: 0, frustrated: 0,
    calm: 0
  };

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  entries.forEach(entry => {
    moodCounts[entry.mood]++;
    const category = categorizeMood(entry.mood);
    if (category === 'positive') positiveCount++;
    else if (category === 'negative') negativeCount++;
    else neutralCount++;
  });

  const totalEntries = entries.length;
  const positivePercentage = Math.round((positiveCount / totalEntries) * 100);
  const negativePercentage = Math.round((negativeCount / totalEntries) * 100);
  const neutralPercentage = Math.round((neutralCount / totalEntries) * 100);

  // Find dominant mood
  const dominantMood = Object.entries(moodCounts).reduce((a, b) => 
    moodCounts[a[0] as AnalyzedMood] > moodCounts[b[0] as AnalyzedMood] ? a : b
  )[0] as AnalyzedMood;

  // Analyze recent trend (last 7 entries vs previous 7)
  const recentTrend = analyzeRecentTrend(entries);

  // Generate suggestions based on mood patterns
  const suggestions = generateSuggestions(moodCounts, positivePercentage, negativePercentage);

  // Generate rewards based on positive patterns
  const rewards = generateRewards(entries, positivePercentage, moodCounts);

  return {
    totalEntries,
    positiveCount,
    negativeCount,
    neutralCount,
    positivePercentage,
    negativePercentage,
    neutralPercentage,
    moodCounts,
    recentTrend,
    dominantMood,
    suggestions,
    rewards
  };
}

function analyzeRecentTrend(entries: JournalEntry[]): 'improving' | 'declining' | 'stable' {
  if (entries.length < 6) return 'stable';

  const recent = entries.slice(-7);
  const previous = entries.slice(-14, -7);

  if (previous.length === 0) return 'stable';

  const recentPositive = recent.filter(e => categorizeMood(e.mood) === 'positive').length;
  const previousPositive = previous.filter(e => categorizeMood(e.mood) === 'positive').length;

  const recentPositiveRatio = recentPositive / recent.length;
  const previousPositiveRatio = previousPositive / previous.length;

  const difference = recentPositiveRatio - previousPositiveRatio;

  if (difference > 0.15) return 'improving';
  if (difference < -0.15) return 'declining';
  return 'stable';
}

function generateSuggestions(
  moodCounts: { [key in AnalyzedMood]: number },
  positivePercentage: number,
  negativePercentage: number
): string[] {
  const suggestions: string[] = [];

  // If negative moods are dominant
  if (negativePercentage > 60) {
    suggestions.push("Try spending 10 minutes in nature or by a window each day");
    suggestions.push("Practice deep breathing: inhale for 4, hold for 4, exhale for 6");
    suggestions.push("Write down 3 things you're grateful for each morning");
  }

  // Specific mood-based suggestions
  if (moodCounts.angry > 2) {
    suggestions.push("When feeling angry, try the 5-4-3-2-1 grounding technique");
    suggestions.push("Physical exercise can help release anger constructively");
  }

  if (moodCounts.anxious > 2) {
    suggestions.push("Progressive muscle relaxation can help with anxiety");
    suggestions.push("Limit caffeine and try herbal teas like chamomile");
  }

  if (moodCounts.frustrated > 2) {
    suggestions.push("Break big tasks into smaller, manageable steps");
    suggestions.push("Take regular breaks to prevent overwhelm");
  }

  if (moodCounts.sad > 3) {
    suggestions.push("Connect with friends or family - social support matters");
    suggestions.push("Engage in activities that brought you joy before");
  }

  // Positive reinforcement
  if (positivePercentage > 70) {
    suggestions.push("You're doing great! Keep up the positive habits");
    suggestions.push("Share your positivity with others - it's contagious!");
  }

  // Balanced suggestions
  if (positivePercentage >= 40 && positivePercentage <= 60) {
    suggestions.push("You're maintaining good emotional balance - that's healthy!");
    suggestions.push("Consider adding one small self-care activity to your routine");
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}

function generateRewards(
  entries: JournalEntry[],
  positivePercentage: number,
  moodCounts: { [key in AnalyzedMood]: number }
): MoodReward[] {
  const rewards: MoodReward[] = [];

  // Positive streak reward
  const recentPositiveStreak = calculatePositiveStreak(entries);
  if (recentPositiveStreak >= 3) {
    rewards.push({
      type: 'positive_streak',
      title: `${recentPositiveStreak}-Day Positive Streak!`,
      description: `You've maintained positive moods for ${recentPositiveStreak} consecutive entries!`,
      coinReward: recentPositiveStreak * 10,
      emoji: '🌟'
    });
  }

  // Balance achievement
  if (positivePercentage >= 70 && entries.length >= 10) {
    rewards.push({
      type: 'balance_achievement',
      title: 'Emotional Wellness Master',
      description: `${positivePercentage}% of your recent entries show positive emotions!`,
      coinReward: 50,
      emoji: '🏆'
    });
  }

  // Growth milestone
  if (entries.length >= 30 && positivePercentage >= 60) {
    rewards.push({
      type: 'growth_milestone',
      title: 'Journey Milestone',
      description: 'You\'ve completed 30 journal entries with great emotional awareness!',
      coinReward: 100,
      emoji: '🌱'
    });
  }

  // Consistency bonus
  if (entries.length >= 7) {
    const lastWeek = entries.slice(-7);
    const uniqueDays = new Set(lastWeek.map(e => new Date(e.date).toDateString())).size;
    if (uniqueDays >= 7) {
      rewards.push({
        type: 'consistency_bonus',
        title: 'Daily Journaling Champion',
        description: 'You\'ve journaled every day this week!',
        coinReward: 30,
        emoji: '📔'
      });
    }
  }

  return rewards;
}

function calculatePositiveStreak(entries: JournalEntry[]): number {
  let streak = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (categorizeMood(entries[i].mood) === 'positive') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getMoodEmoji(mood: AnalyzedMood): string {
  const moodEmojis: { [key in AnalyzedMood]: string } = {
    happy: '😊',
    excited: '🤗',
    energetic: '⚡',
    content: '😌',
    sad: '😢',
    anxious: '😰',
    angry: '😡',
    irritated: '😤',
    frustrated: '😓',
    calm: '🕯️'
  };
  return moodEmojis[mood];
}

export function getMoodColor(mood: AnalyzedMood): string {
  const category = categorizeMood(mood);
  switch (category) {
    case 'positive': return 'bg-green-100 text-green-700';
    case 'negative': return 'bg-red-100 text-red-700';
    case 'neutral': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}