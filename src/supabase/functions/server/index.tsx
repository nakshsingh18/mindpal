import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
// Supabase client not required here because storage access is done via `kv_store`.
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));
app.use('*', logger(console.log));

// If you want to use Supabase directly here, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// in the environment and import/create the client dynamically. The file currently uses
// `kv_store.tsx` which handles Supabase vs in-memory fallback.

// Helper function to detect mood from text
function detectMoodFromText(text: string): 'happy' | 'sad' | 'stressed' | 'calm' {
  const lowerText = text.toLowerCase();

  // Happy indicators
  const happyWords = ['happy', 'great', 'amazing', 'wonderful', 'excited', 'joy', 'fantastic', 'awesome', 'love', 'grateful', 'blessed', 'perfect'];
  const happyCount = happyWords.filter(word => lowerText.includes(word)).length;

  // Sad indicators
  const sadWords = ['sad', 'upset', 'down', 'terrible', 'awful', 'depressed', 'lonely', 'crying', 'hurt', 'disappointed', 'broken'];
  const sadCount = sadWords.filter(word => lowerText.includes(word)).length;

  // Stressed indicators
  const stressWords = ['stress', 'anxiety', 'worried', 'overwhelm', 'panic', 'pressure', 'tense', 'nervous', 'frantic', 'chaos', 'exhausted'];
  const stressCount = stressWords.filter(word => lowerText.includes(word)).length;

  // Calm indicators
  const calmWords = ['calm', 'peace', 'relaxed', 'serene', 'tranquil', 'zen', 'peaceful', 'quiet', 'still', 'centered', 'balanced'];
  const calmCount = calmWords.filter(word => lowerText.includes(word)).length;

  // Determine dominant mood
  const maxCount = Math.max(happyCount, sadCount, stressCount, calmCount);

  if (maxCount === 0) return 'calm'; // default
  if (happyCount === maxCount) return 'happy';
  if (sadCount === maxCount) return 'sad';
  if (stressCount === maxCount) return 'stressed';
  return 'calm';
}

// Routes


// Get user profile and pet data
app.get('/make-server-6d448e25/profile/:userId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    
    const profile = await kv.get(`profile:${userId}`);
    
    if (!profile) {
      // Create default profile
      const defaultProfile = {
        userId,
        selectedPet: null,
        level: 1,
        coins: 100, // Use coins instead of gems
        streak: 0,
        joinDate: new Date().toISOString(),
        totalEntries: 0,
        lastActive: new Date().toISOString(),
        isPremium: false // Add this line
      };
      
      await kv.set(`profile:${userId}`, defaultProfile);
      return c.json(defaultProfile);
    }
    
    return c.json(profile);
  } catch (error) {
    console.log('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// ... (the rest of your file)

// Update user profile
app.post('/make-server-6d448e25/profile/:userId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const updates = await c.req.json();

    const existingProfile = await kv.get(`profile:${userId}`);
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      lastActive: new Date().toISOString()
    };

    await kv.set(`profile:${userId}`, updatedProfile);
    return c.json(updatedProfile);
  } catch (error) {
    console.log('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Save journal entry
app.post('/make-server-6d448e25/journal/:userId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const { text, mood } = await c.req.json();

    if (!text || !text.trim()) {
      return c.json({ error: 'Journal text is required' }, 400);
    }

    const entryId = `entry:${userId}:${Date.now()}`;
    const detectedMood = detectMoodFromText(text);

    const entry = {
      id: entryId,
      userId,
      text: text.trim(),
      userMood: mood,
      detectedMood,
      timestamp: new Date().toISOString(),
      wordCount: text.trim().split(/\s+/).length
    };

    await kv.set(entryId, entry);

    // Update user profile stats
    const profile = await kv.get(`profile:${userId}`);
    if (profile) {
      const today = new Date().toDateString();
      const lastActiveDate = new Date(profile.lastActive).toDateString();

      const updatedProfile = {
        ...profile,
        totalEntries: (profile.totalEntries || 0) + 1,
        lastActive: new Date().toISOString(),
        streak: today === lastActiveDate ? profile.streak : (profile.streak || 0) + 1,
        coins: (profile.coins || 0) + 10 // Changed gems to coins and reward for journaling
      };

      await kv.set(`profile:${userId}`, updatedProfile);
    }

    return c.json({ entry, detectedMood });
  } catch (error) {
    console.log('Error saving journal entry:', error);
    return c.json({ error: 'Failed to save journal entry' }, 500);
  }
});

// Get journal entries for user
app.get('/make-server-6d448e25/journal/:userId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const limit = parseInt(c.req.query('limit') || '10');

    const entries = await kv.getByPrefix(`entry:${userId}:`);

    // Sort by timestamp (newest first) and limit
    const sortedEntries = entries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return c.json(sortedEntries);
  } catch (error) {
    console.log('Error fetching journal entries:', error);
    return c.json({ error: 'Failed to fetch journal entries' }, 500);
  }
});

// Get mood analytics
app.get('/make-server-6d448e25/analytics/:userId', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const days = parseInt(c.req.query('days') || '7');

    const entries = await kv.getByPrefix(`entry:${userId}:`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEntries = entries.filter(entry =>
      new Date(entry.timestamp) >= cutoffDate
    );

    // Calculate mood distribution
    const moodCounts = { happy: 0, sad: 0, stressed: 0, calm: 0 };
    recentEntries.forEach((entry: any) => {
      const dm = entry?.detectedMood as keyof typeof moodCounts;
      if (dm && Object.prototype.hasOwnProperty.call(moodCounts, dm)) {
        moodCounts[dm]++;
      }
    });

    // Calculate daily averages
    const dailyMoods: { [key: string]: string[] } = {};
    recentEntries.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      if (!dailyMoods[date]) dailyMoods[date] = [];
      dailyMoods[date].push(entry.detectedMood);
    });

    const moodTrend = Object.entries(dailyMoods).map(([date, moods]) => {
      const moodScore = moods.reduce((score, mood) => {
        switch (mood) {
          case 'happy': return score + 2;
          case 'calm': return score + 1;
          case 'sad': return score - 1;
          case 'stressed': return score - 2;
          default: return score;
        }
      }, 0) / moods.length;

      return { date, score: moodScore, count: moods.length };
    });

    // Generate insights
    const totalEntries = recentEntries.length;
    const mostCommonMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'calm';

    const averageWordsPerEntry = totalEntries > 0
      ? Math.round(recentEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0) / totalEntries)
      : 0;

    return c.json({
      period: `${days} days`,
      totalEntries,
      moodDistribution: moodCounts,
      mostCommonMood,
      averageWordsPerEntry,
      moodTrend: moodTrend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      insights: [
        totalEntries === 0 ? "Start journaling to track your mood patterns!" :
        mostCommonMood === 'happy' ? "You've been feeling positive lately! Keep it up! 🌟" :
        mostCommonMood === 'stressed' ? "Consider trying some relaxation techniques. Your pet is here to help! 🧘‍♀️" :
        mostCommonMood === 'sad' ? "Remember, it's okay to have difficult days. Take care of yourself 💙" :
        "You seem to be in a peaceful state of mind. Great balance! ⚖️"
      ]
    });
  } catch (error) {
    console.log('Error generating analytics:', error);
    return c.json({ error: 'Failed to generate analytics' }, 500);
  }
});

// Get and update quest progress
app.get('/make-server-6d448e25/quests/:userId', async (c: any) => {
  try {
    const userId = c.req.param('userId');

    const questProgress = await kv.get(`quests:${userId}`);

    if (!questProgress) {
      const defaultQuests = {
        userId,
        quests: {
          '1': { progress: 0, completed: false },
          '2': { progress: 0, completed: false },
          '3': { progress: 0, completed: false },
          '4': { progress: 0, completed: false }
        },
        weeklyStreak: 0,
        lastReset: new Date().toISOString()
      };

      await kv.set(`quests:${userId}`, defaultQuests);
      return c.json(defaultQuests);
    }

    return c.json(questProgress);
  } catch (error) {
    console.log('Error fetching quests:', error);
    return c.json({ error: 'Failed to fetch quests' }, 500);
  }
});

app.post('/make-server-6d448e25/quests/:userId/complete', async (c: any) => {
  try {
    const userId = c.req.param('userId');
    const { questId, reward } = await c.req.json();

    const questProgress = await kv.get(`quests:${userId}`) || {
      userId,
      quests: {},
      weeklyStreak: 0
    };

    if (!questProgress.quests[questId]) {
      questProgress.quests[questId] = { progress: 0, completed: false };
    }

    questProgress.quests[questId].completed = true;
    questProgress.quests[questId].completedAt = new Date().toISOString();

    await kv.set(`quests:${userId}`, questProgress);

    // Update user coins
    const profile = await kv.get(`profile:${userId}`);
    if (profile) {
      profile.coins = (profile.coins || 0) + reward; // Changed gems to coins
      await kv.set(`profile:${userId}`, profile);
    }

    return c.json({ success: true, questProgress });
  } catch (error) {
    console.log('Error completing quest:', error);
    return c.json({ error: 'Failed to complete quest' }, 500);
  }
});

// Health check
app.get('/make-server-6d448e25/health', (c: any) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

console.log('MindPal server starting...');

export default {
  fetch: app.fetch,
};