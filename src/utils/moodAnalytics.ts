export interface JournalEntry {
  mood: string;
  content: string;
  date: Date | string;
  confidence?: number;
  aiAnalysis?: string;
  fineEmotions?: Array<{ label: string; score: number }>;
  sarcastic?: boolean;
}

export interface MoodAnalytics {
  totalEntries: number;
  dominantMood: string;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  moodCounts: Record<string, number>;
  topFineEmotions: Array<{ label: string; score: number }>;
  rewards: MoodReward[];
}

export interface MoodReward {
  type: string;
  title: string;
  description: string;
  emoji: string;
  coinReward: number;
}

const POSITIVE_MOODS = ['happy', 'excited', 'love', 'grateful', 'hopeful', 'pride', 'content', 'energetic'];
const NEUTRAL_MOODS = ['calm', 'confused', 'bored', 'nostalgic'];
const NEGATIVE_MOODS = ['sad', 'angry', 'anxious', 'frustrated', 'lonely', 'disappointed', 'embarrassed', 'overwhelmed', 'guilt', 'shame', 'disgust', 'envy', 'jealous'];

export function analyzeMoods(entries: JournalEntry[]): MoodAnalytics {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      dominantMood: 'neutral',
      positivePercentage: 0,
      neutralPercentage: 0,
      negativePercentage: 0,
      moodCounts: {},
      topFineEmotions: [],
      rewards: []
    };
  }

  const moodCounts: Record<string, number> = {};
  const allFineEmotions: Array<{ label: string; score: number }> = [];

  entries.forEach(entry => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    
    if (entry.fineEmotions) {
      allFineEmotions.push(...entry.fineEmotions);
    }
  });

  const dominantMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (POSITIVE_MOODS.includes(mood)) positiveCount += count;
    else if (NEUTRAL_MOODS.includes(mood)) neutralCount += count;
    else if (NEGATIVE_MOODS.includes(mood)) negativeCount += count;
  });

  const total = entries.length;
  const positivePercentage = Math.round((positiveCount / total) * 100);
  const neutralPercentage = Math.round((neutralCount / total) * 100);
  const negativePercentage = Math.round((negativeCount / total) * 100);

  // Aggregate fine emotions
  const emotionMap: Record<string, number[]> = {};
  allFineEmotions.forEach(emotion => {
    if (!emotionMap[emotion.label]) emotionMap[emotion.label] = [];
    emotionMap[emotion.label].push(emotion.score);
  });

  const topFineEmotions = Object.entries(emotionMap)
    .map(([label, scores]) => ({
      label,
      score: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const rewards = generateRewards(entries, moodCounts, positivePercentage);

  return {
    totalEntries: total,
    dominantMood,
    positivePercentage,
    neutralPercentage,
    negativePercentage,
    moodCounts,
    topFineEmotions,
    rewards
  };
}

function generateRewards(entries: JournalEntry[], moodCounts: Record<string, number>, positivePercentage: number): MoodReward[] {
  const rewards: MoodReward[] = [];

  if (entries.length >= 7) {
    rewards.push({
      type: 'consistency',
      title: 'Consistent Journaler',
      description: 'You\'ve written 7+ journal entries!',
      emoji: '📝',
      coinReward: 50
    });
  }

  if (positivePercentage >= 70) {
    rewards.push({
      type: 'positivity',
      title: 'Positive Mindset',
      description: '70%+ of your entries show positive emotions!',
      emoji: '🌟',
      coinReward: 75
    });
  }

  if (entries.length >= 30) {
    rewards.push({
      type: 'dedication',
      title: 'Dedicated Writer',
      description: 'Amazing! You\'ve written 30+ entries!',
      emoji: '🏆',
      coinReward: 100
    });
  }

  return rewards;
}

export function getMoodEmoji(mood: string): string {
  const emojiMap: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    excited: '🤩',
    calm: '😌',
    frustrated: '😤',
    love: '🥰',
    grateful: '🙏',
    hopeful: '🌈',
    lonely: '😔',
    confused: '😕',
    disappointed: '😞',
    proud: '😎',
    embarrassed: '😳',
    bored: '😑',
    overwhelmed: '🤯',
    content: '😊',
    energetic: '⚡',
    guilt: '😔',
    shame: '😞',
    disgust: '🤢',
    envy: '😒',
    jealous: '😒',
    nostalgic: '🥺'
  };
  return emojiMap[mood] || '😐';
}

export function getMoodColor(mood: string): string {
  if (POSITIVE_MOODS.includes(mood)) return 'bg-green-100 text-green-800';
  if (NEGATIVE_MOODS.includes(mood)) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}