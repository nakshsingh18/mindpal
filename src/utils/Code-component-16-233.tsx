// Simple sentiment analysis utility for MindPal
// This uses keyword-based analysis to determine mood from journal text

interface MoodKeywords {
  [key: string]: string[];
}

const moodKeywords: MoodKeywords = {
  happy: [
    'happy', 'joy', 'excited', 'great', 'amazing', 'wonderful', 'fantastic', 'awesome', 
    'cheerful', 'delighted', 'pleased', 'thrilled', 'elated', 'overjoyed', 'ecstatic',
    'blissful', 'content', 'satisfied', 'grateful', 'thankful', 'blessed', 'lucky',
    'love', 'beautiful', 'perfect', 'brilliant', 'excellent', 'outstanding', 'incredible',
    'celebrate', 'achievement', 'success', 'win', 'victory', 'accomplished', 'proud'
  ],
  sad: [
    'sad', 'depressed', 'down', 'upset', 'disappointed', 'heartbroken', 'devastated',
    'miserable', 'gloomy', 'melancholy', 'sorrowful', 'grief', 'mourning', 'crying',
    'tears', 'lonely', 'isolated', 'abandoned', 'rejected', 'hurt', 'pain', 'suffering',
    'hopeless', 'despair', 'defeat', 'failure', 'loss', 'broken', 'empty', 'void',
    'regret', 'guilt', 'shame', 'worthless', 'useless', 'terrible', 'awful', 'horrible'
  ],
  anxious: [
    'anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'panic', 'fear', 'scared',
    'afraid', 'terrified', 'concerned', 'uneasy', 'troubled', 'restless', 'agitated',
    'tense', 'pressure', 'burden', 'struggling', 'difficult', 'challenging', 'hard',
    'uncertain', 'confused', 'lost', 'doubt', 'insecure', 'vulnerable', 'fragile',
    'chaos', 'mess', 'disaster', 'crisis', 'emergency', 'urgent', 'deadline', 'rush'
  ],
  calm: [
    'calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'quiet', 'still', 'centered',
    'balanced', 'stable', 'grounded', 'mindful', 'present', 'meditate', 'meditation',
    'breathe', 'breathing', 'yoga', 'zen', 'harmony', 'gentle', 'soft', 'soothing',
    'comfortable', 'cozy', 'warm', 'safe', 'secure', 'protected', 'sheltered',
    'nature', 'garden', 'beach', 'sunset', 'sunrise', 'mountains', 'trees', 'flowers'
  ],
  excited: [
    'excited', 'enthusiastic', 'energetic', 'motivated', 'inspired', 'passionate',
    'eager', 'anticipating', 'looking forward', 'can\'t wait', 'pumped', 'hyped',
    'adventure', 'journey', 'explore', 'discover', 'new', 'fresh', 'opportunity',
    'chance', 'possibility', 'potential', 'future', 'dreams', 'goals', 'ambition',
    'creative', 'innovative', 'breakthrough', 'progress', 'growth', 'learning'
  ]
};

export type AnalyzedMood = 'happy' | 'sad' | 'calm' | 'anxious' | 'excited';

export function analyzeSentiment(text: string): AnalyzedMood {
  if (!text || text.trim().length === 0) {
    return 'calm';
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  // Count mood indicators
  const moodScores: { [key in AnalyzedMood]: number } = {
    happy: 0,
    sad: 0,
    anxious: 0,
    calm: 0,
    excited: 0
  };

  // Check for keyword matches
  for (const word of words) {
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      for (const keyword of keywords) {
        if (word.includes(keyword) || keyword.includes(word)) {
          moodScores[mood as AnalyzedMood] += 1;
        }
      }
    }
  }

  // Check for negation patterns
  const negationWords = ['not', 'no', 'never', 'don\'t', 'doesn\'t', 'won\'t', 'can\'t', 'couldn\'t', 'shouldn\'t'];
  
  // Simple negation handling - if negation is found before positive words, flip to negative
  for (let i = 0; i < words.length - 1; i++) {
    if (negationWords.includes(words[i])) {
      const nextWord = words[i + 1];
      // If next word is positive, reduce happy/excited scores and increase sad/anxious
      if (moodKeywords.happy.some(keyword => nextWord.includes(keyword)) ||
          moodKeywords.excited.some(keyword => nextWord.includes(keyword))) {
        moodScores.happy = Math.max(0, moodScores.happy - 1);
        moodScores.excited = Math.max(0, moodScores.excited - 1);
        moodScores.sad += 1;
      }
    }
  }

  // Intensity markers that boost emotional scores
  const intensifiers = ['very', 'really', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely'];
  for (const word of words) {
    if (intensifiers.includes(word)) {
      // Boost all non-zero scores slightly
      Object.keys(moodScores).forEach(mood => {
        if (moodScores[mood as AnalyzedMood] > 0) {
          moodScores[mood as AnalyzedMood] += 0.5;
        }
      });
    }
  }

  // Handle specific emotional patterns
  if (lowerText.includes('mixed feelings') || lowerText.includes('conflicted')) {
    moodScores.anxious += 1;
  }
  
  if (lowerText.includes('grateful') || lowerText.includes('thankful') || lowerText.includes('blessed')) {
    moodScores.happy += 1;
    moodScores.calm += 0.5;
  }

  // Find the mood with the highest score
  let dominantMood: AnalyzedMood = 'calm';
  let maxScore = 0;

  for (const [mood, score] of Object.entries(moodScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantMood = mood as AnalyzedMood;
    }
  }

  // If no clear mood is detected, analyze text length and punctuation for excitement
  if (maxScore === 0) {
    const exclamationCount = (lowerText.match(/!/g) || []).length;
    const questionCount = (lowerText.match(/\?/g) || []).length;
    
    if (exclamationCount >= 2) {
      return 'excited';
    } else if (questionCount >= 2) {
      return 'anxious';
    } else if (words.length > 50) {
      // Longer entries might indicate processing complex emotions
      return 'calm';
    }
  }

  return dominantMood;
}

// Helper function to get mood confidence score (0-1)
export function getMoodConfidence(text: string, detectedMood: AnalyzedMood): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  const moodWords = moodKeywords[detectedMood] || [];
  
  let matches = 0;
  for (const word of words) {
    if (moodWords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      matches++;
    }
  }

  // Confidence based on ratio of mood words to total words
  const confidence = Math.min(matches / Math.max(words.length * 0.1, 1), 1);
  return Math.round(confidence * 100) / 100;
}

// Helper function to get a friendly explanation of the detected mood
export function getMoodExplanation(text: string, mood: AnalyzedMood): string {
  const confidence = getMoodConfidence(text, mood);
  
  const explanations = {
    happy: "I noticed positive words and uplifting language in your entry! 😊",
    sad: "Your writing seems to express some difficult emotions. It's okay to feel this way. 💙",
    anxious: "I can sense some worry or stress in your words. Take a deep breath. 🌸",
    calm: "Your entry has a peaceful, reflective tone. That's wonderful! 🕯️",
    excited: "There's lots of energy and enthusiasm in your writing! 🌟"
  };

  const confidenceText = confidence > 0.7 ? " I'm quite confident about this reading." :
                        confidence > 0.4 ? " This is my best interpretation." :
                        " This is just a gentle guess based on your words.";

  return explanations[mood] + confidenceText;
}