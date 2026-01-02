// Simple sentiment analysis utility for MindPal
// This uses keyword-based analysis to determine mood from journal text

interface MoodKeywords {
  [key: string]: string[];
}

const moodKeywords: MoodKeywords = {
  happy: [
    'happy', 'joy', 'great', 'amazing', 'wonderful', 'fantastic', 'awesome', 
    'cheerful', 'delighted', 'pleased', 'thrilled', 'elated', 'overjoyed', 'ecstatic',
    'blissful', 'satisfied', 'grateful', 'thankful', 'blessed', 'lucky',
    'love', 'beautiful', 'perfect', 'brilliant', 'excellent', 'outstanding', 'incredible',
    'celebrate', 'achievement', 'success', 'win', 'victory', 'accomplished', 'proud'
  ],
  excited: [
    'excited', 'enthusiastic', 'motivated', 'inspired', 'passionate',
    'eager', 'anticipating', 'looking forward', 'can\'t wait', 'pumped', 'hyped',
    'adventure', 'journey', 'explore', 'discover', 'new', 'fresh', 'opportunity',
    'chance', 'possibility', 'potential', 'future', 'dreams', 'goals', 'ambition',
    'creative', 'innovative', 'breakthrough', 'progress', 'growth', 'learning'
  ],
  energetic: [
    'energetic', 'active', 'vibrant', 'dynamic', 'lively', 'spirited', 'vigorous',
    'power', 'strength', 'force', 'drive', 'momentum', 'motion', 'movement',
    'workout', 'exercise', 'run', 'dance', 'jump', 'bounce', 'rush', 'boost',
    'charged', 'electric', 'intense', 'powerful', 'strong', 'fierce', 'bold'
  ],
  content: [
    'content', 'satisfied', 'peaceful', 'comfortable', 'settled', 'fulfilled',
    'complete', 'whole', 'enough', 'sufficient', 'adequate', 'pleased',
    'accepting', 'serene', 'tranquil', 'steady', 'stable', 'balanced'
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
  angry: [
    'angry', 'mad', 'furious', 'rage', 'outraged', 'livid', 'enraged', 'incensed',
    'seething', 'boiling', 'steaming', 'fuming', 'irate', 'indignant', 'heated',
    'pissed', 'annoyed', 'aggravated', 'infuriated', 'exasperated', 'provoked',
    'hate', 'disgusted', 'appalled', 'outrageous', 'unacceptable', 'ridiculous'
  ],
  irritated: [
    'irritated', 'annoyed', 'bothered', 'agitated', 'vexed', 'irked', 'frustrated',
    'aggravated', 'pestered', 'harassed', 'bugged', 'ticked off', 'fed up',
    'impatient', 'restless', 'edgy', 'cranky', 'grumpy', 'moody', 'snappy',
    'short-tempered', 'touchy', 'sensitive', 'on edge', 'wound up'
  ],
  frustrated: [
    'frustrated', 'stuck', 'blocked', 'hindered', 'obstructed', 'thwarted',
    'stymied', 'hampered', 'impeded', 'discouraged', 'defeated', 'stumped',
    'baffled', 'perplexed', 'confused', 'puzzled', 'lost', 'helpless',
    'powerless', 'unable', 'can\'t', 'impossible', 'difficult', 'challenging'
  ],
  calm: [
    'calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'quiet', 'still', 'centered',
    'balanced', 'stable', 'grounded', 'mindful', 'present', 'meditate', 'meditation',
    'breathe', 'breathing', 'yoga', 'zen', 'harmony', 'gentle', 'soft', 'soothing',
    'comfortable', 'cozy', 'warm', 'safe', 'secure', 'protected', 'sheltered',
    'nature', 'garden', 'beach', 'sunset', 'sunrise', 'mountains', 'trees', 'flowers'
  ]
};

export type AnalyzedMood = 'happy' | 'sad' | 'calm' | 'anxious' | 'excited' | 'angry' | 'irritated' | 'frustrated' | 'content' | 'energetic';

export type AnalysisResult = {
  mood: AnalyzedMood;
  confidence: number; // 0-1
  triggers: string[];
  source: 'local' | 'hf';
};

// Synchronous, local keyword-based analyzer (keeps backward compatibility)
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
    excited: 0,
    angry: 0,
    irritated: 0,
    frustrated: 0,
    content: 0,
    energetic: 0
  };

  // Helper to escape keywords for regex
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Check for keyword matches using word-boundary regexes to avoid partial matches
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    for (const keyword of keywords) {
      const pattern = `\\b${escapeRegExp(keyword)}\\b`;
      const re = new RegExp(pattern, 'i');
      if (re.test(lowerText)) {
        moodScores[mood as AnalyzedMood] += 1;
      }
    }
  }

  // Check for negation patterns
  const negationWords = ['not', 'no', 'never', 'dont', "don't", 'doesnt', "doesn't", 'wont', "won't", 'cant', "can't", 'couldnt', "couldn't", 'shouldnt', "shouldn't"]; 
  
  // Simple negation handling - if negation is found before positive words, flip to negative
  for (let i = 0; i < words.length - 1; i++) {
    if (negationWords.includes(words[i])) {
      const nextWord = words[i + 1];
      // If next word is positive, reduce happy/excited scores and increase sad/anxious
      if (moodKeywords.happy.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(nextWord)) ||
          moodKeywords.excited.some(keyword => new RegExp(`\\b${keyword}\\b`, 'i').test(nextWord))) {
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
  
  // Count occurrences of mood keywords in the whole text using word-boundary regex
  let matches = 0;
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const keyword of moodWords) {
    const re = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
    const found = (lowerText.match(re) || []).length;
    matches += found;
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
    excited: "There's lots of energy and enthusiasm in your writing! 🌟",
    energetic: "I can feel the vibrant energy and activity in your words! ⚡",
    content: "Your writing shows a lovely sense of satisfaction and peace. 🌻",
    sad: "Your writing seems to express some difficult emotions. It's okay to feel this way. 💙",
    anxious: "I can sense some worry or stress in your words. Take a deep breath. 🌸",
    angry: "I detect some strong anger in your writing. Your feelings are valid. 🔥",
    irritated: "There seems to be some annoyance or irritation. That's understandable. 😤",
    frustrated: "I can sense frustration in your words. Sometimes things feel stuck. 😓",
    calm: "Your entry has a peaceful, reflective tone. That's wonderful! 🕯️"
  };

  const confidenceText = confidence > 0.7 ? " I'm quite confident about this reading." :
                        confidence > 0.4 ? " This is my best interpretation." :
                        " This is just a gentle guess based on your words.";

  return explanations[mood] + confidenceText;
}

// --- Trigger word detection ---
const triggerWords = [
  'suicide', 'kill myself', 'kill myself', 'want to die', 'end my life', 'self-harm', 'self harm', 'hurt myself',
  'overdose', 'hang myself', 'cut myself', 'bleed out', 'die by suicide', 'die', 'bomb', 'shoot', 'stab', 'kill',
  'rape', 'molest', 'assault', 'abuse', 'threaten', 'threat', 'kill you', 'hurt you', 'hate myself', 'hate my self'
];

export function detectTriggers(text: string): string[] {
  if (!text) return [];
  const tl = text.toLowerCase();
  const found = new Set<string>();
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const t of triggerWords) {
    const re = new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i');
    if (re.test(tl)) found.add(t);
  }
  return Array.from(found);
}

// --- Hugging Face inference integration (async) ---
async function analyzeWithHuggingFace(text: string): Promise<{ mood: AnalyzedMood; confidence: number } | null> {
  try {
    const key = (import.meta as any).env?.VITE_HF_API_KEY;
    if (!key) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch('https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const data = await resp.json();
    // data is usually an array of {label, score}
    const items: Array<{ label: string; score: number }> = Array.isArray(data) ? data : data as any;
    if (!items || items.length === 0) return null;

    const top = items.reduce((a, b) => (a.score > b.score ? a : b));
    const label = top.label.toLowerCase();
    const score = top.score || 0;

    // Map HF labels to our AnalyzedMood
    const map: Record<string, AnalyzedMood> = {
      joy: 'happy',
      happiness: 'happy',
      sad: 'sad',
      sadness: 'sad',
      anger: 'angry',
      disgust: 'irritated',
      fear: 'anxious',
      neutral: 'calm',
      surprise: 'excited',
      love: 'happy'
    };

    // Some models return labels like 'joy', 'anger', etc. Try direct mapping, fallback heuristics
    let mood: AnalyzedMood = map[label] || 'calm';
    // handle cases where label might be 'positive'/'negative' or longer text
    if (!map[label]) {
      if (label.includes('joy') || label.includes('happy')) mood = 'happy';
      else if (label.includes('sad')) mood = 'sad';
      else if (label.includes('anger')) mood = 'angry';
      else if (label.includes('fear')) mood = 'anxious';
      else if (label.includes('surprise') || label.includes('excite')) mood = 'excited';
      else if (label.includes('disgust')) mood = 'irritated';
    }

    return { mood, confidence: Math.min(Math.max(score, 0), 1) };
  } catch (err) {
    return null;
  }
}

// Public async analyzer: prefers HF when key is present, falls back to local analyzer
export async function analyzeSentimentAuto(text: string): Promise<AnalysisResult> {
  const triggers = detectTriggers(text);
  const hf = await analyzeWithHuggingFace(text);
  if (hf) {
    return { mood: hf.mood, confidence: hf.confidence, triggers, source: 'hf' };
  }

  const localMood = analyzeSentiment(text);
  const conf = getMoodConfidence(text, localMood);
  return { mood: localMood, confidence: conf, triggers, source: 'local' };
}

// --- Advanced analysis: emotions distribution, polarity, trigger severity, suicidal risk ---
export type TriggerSeverity = 'low' | 'medium' | 'high';

export type AdvancedAnalysis = {
  emotions: Record<string, number>; // emotion label -> score
  polarity: { label: 'positive' | 'neutral' | 'negative'; score: number };
  mood: AnalyzedMood;
  confidence: number; // overall confidence 0-1
  triggers: Array<{ word: string; severity: TriggerSeverity }>;
  suicidalRisk: boolean;
  source: 'hf' | 'hybrid' | 'local';
};

async function callHFModel(model: string, text: string): Promise<Array<{ label: string; score: number }> | null> {
  try {
    const key = (import.meta as any).env?.VITE_HF_API_KEY;
    if (!key) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data) return null;
    // HF sometimes returns {error} or an array; normalize to array of {label,score}
    if (Array.isArray(data)) return data as any;
    if (data.hasOwnProperty('label') && data.hasOwnProperty('score')) return [data as any];
    // some models return {labels: [...], scores: [...]} -- try to coerce
    if ((data as any).labels && (data as any).scores) {
      const labels = (data as any).labels;
      const scores = (data as any).scores;
      return labels.map((l: string, i: number) => ({ label: l, score: scores[i] }));
    }
    return null;
  } catch (err) {
    return null;
  }
}

function severityForTrigger(word: string): TriggerSeverity {
  const high = ['suicide', 'kill myself', 'want to die', 'end my life', 'overdose', 'hang myself', 'cut myself', 'bleed out', 'die by suicide', 'hate myself'];
  const medium = ['self-harm', 'hurt myself', 'abuse', 'assault', 'rape', 'molest'];
  if (high.includes(word)) return 'high';
  if (medium.includes(word)) return 'medium';
  return 'low';
}

export async function analyzeAdvancedAuto(text: string): Promise<AdvancedAnalysis> {
  // try to get detailed emotion distribution and sentiment polarity from HF
  const emotionModel = 'j-hartmann/emotion-english-distilroberta-base';
  const polarityModel = 'distilbert-base-uncased-finetuned-sst-2-english';

  const [emotionRes, polarityRes] = await Promise.all([
    callHFModel(emotionModel, text),
    callHFModel(polarityModel, text)
  ]);

  const triggersFound = detectTriggers(text).map(t => ({ word: t, severity: severityForTrigger(t) }));
  const suicidalRisk = triggersFound.some(t => t.severity === 'high');

  // Build emotions map
  const emotions: Record<string, number> = {};
  if (emotionRes) {
    for (const it of emotionRes) emotions[it.label.toLowerCase()] = it.score || 0;
  }

  // Polarity mapping
  let polarity: AdvancedAnalysis['polarity'] = { label: 'neutral', score: 0 };
  if (polarityRes && polarityRes.length > 0) {
    const top = polarityRes.reduce((a, b) => (a.score > b.score ? a : b));
    const lbl = top.label.toLowerCase();
    if (lbl.includes('positive') || lbl.includes('pos') || lbl.includes('1') ) polarity = { label: 'positive', score: top.score };
    else if (lbl.includes('negative') || lbl.includes('neg') || lbl.includes('0')) polarity = { label: 'negative', score: top.score };
    else polarity = { label: 'neutral', score: top.score };
  }

  // Determine a mapped mood from emotions or fallback local
  let mappedMood: AnalyzedMood = 'calm';
  if (Object.keys(emotions).length > 0) {
    // map highest emotion to nearest AnalyzedMood
    const entries = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    const topLabel = entries[0][0];
    const map: Record<string, AnalyzedMood> = {
      joy: 'happy', happiness: 'happy', love: 'happy', optimism: 'happy', pride: 'happy', excitement: 'excited', surprise: 'excited',
      sadness: 'sad', grief: 'sad', anger: 'angry', disgust: 'irritated', fear: 'anxious', neutral: 'calm'
    };
    mappedMood = map[topLabel] || analyzeSentiment(text);
  } else {
    mappedMood = analyzeSentiment(text);
  }

  const confidence = Math.max(polarity.score || 0, getMoodConfidence(text, mappedMood));

  return {
    emotions,
    polarity,
    mood: mappedMood,
    confidence: Math.round(Math.min(Math.max(confidence, 0), 1) * 100) / 100,
    triggers: triggersFound,
    suicidalRisk,
    source: emotionRes || polarityRes ? 'hf' : 'local'
  };
}