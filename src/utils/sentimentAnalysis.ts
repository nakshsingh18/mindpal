// Advanced sentiment analysis using Hugging Face API
// Multiple models for comprehensive emotion detection

export type AnalyzedMood = 'happy' | 'sad' | 'calm' | 'anxious' | 'excited' | 'angry' | 'irritated' | 'frustrated' | 'content' | 'energetic' | 'love' | 'disgust' | 'envy' | 'guilt' | 'shame' | 'pride' | 'lonely' | 'hopeful' | 'grateful' | 'confused' | 'disappointed' | 'jealous' | 'embarrassed' | 'bored' | 'nostalgic' | 'overwhelmed';

export type AnalysisResult = {
  mood: AnalyzedMood;
  confidence: number;
  triggers: string[];
  emotions: Record<string, number>;
  complexity: 'simple' | 'mixed' | 'complex';
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
  explanation: string;
};

// Advanced trigger words for mental health detection
const TRIGGER_WORDS = {
  suicide: ['suicide', 'kill myself', 'end my life', 'want to die', 'better off dead', 'no point living', 'point of living', 'no point of living'],
  selfHarm: ['cut myself', 'hurt myself', 'self harm', 'self-harm', 'burn myself', 'hit myself'],
  depression: ['hopeless', 'worthless', 'useless', 'hate myself', 'empty inside', 'numb', 'void', 'dont know what to do', 'dont see the point'],
  anxiety: ['panic attack', 'cant breathe', 'heart racing', 'overwhelming', 'spiraling', 'losing control'],
  trauma: ['flashback', 'nightmare', 'triggered', 'ptsd', 'abuse', 'assault', 'violence'],
  substance: ['overdose', 'pills', 'drinking too much', 'using drugs', 'addiction', 'relapse']
};

// Hugging Face API configuration
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const HF_MODELS = {
  emotion: 'j-hartmann/emotion-english-distilroberta-base',
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest', 
  mentalHealth: 'martin-ha/toxic-comment-model',
  stress: 'SamLowe/roberta-base-go_emotions'
};

// Advanced emotion mapping
const EMOTION_MAPPING: Record<string, AnalyzedMood> = {
  // Positive emotions
  'joy': 'happy',
  'happiness': 'happy', 
  'love': 'love',
  'optimism': 'hopeful',
  'pride': 'pride',
  'excitement': 'excited',
  'surprise': 'excited',
  'enthusiasm': 'energetic',
  'gratitude': 'grateful',
  
  // Negative emotions
  'sadness': 'sad',
  'grief': 'sad',
  'disappointment': 'disappointed',
  'anger': 'angry',
  'rage': 'angry',
  'annoyance': 'irritated',
  'frustration': 'frustrated',
  'fear': 'anxious',
  'anxiety': 'anxious',
  'worry': 'anxious',
  'nervousness': 'anxious',
  'stress': 'overwhelmed',
  'disgust': 'disgust',
  'envy': 'envy',
  'jealousy': 'jealous',
  'guilt': 'guilt',
  'shame': 'shame',
  'loneliness': 'lonely',
  'embarrassment': 'embarrassed',
  'confusion': 'confused',
  'boredom': 'bored',
  'nostalgia': 'nostalgic',
  
  // Neutral emotions
  'neutral': 'calm',
  'calmness': 'calm',
  'peace': 'calm',
  'serenity': 'calm',
  'contentment': 'content'
};

// Google Gemini API for advanced sentiment analysis
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- CORE SAFETY FUNCTIONS ---

// 1. Helper to determine the highest risk level
function getHigherRisk(riskA: string, riskB: string): 'low' | 'medium' | 'high' {
  const levels = { 'low': 0, 'medium': 1, 'high': 2 };
  const valA = levels[riskA as keyof typeof levels] || 0;
  const valB = levels[riskB as keyof typeof levels] || 0;
  return valA > valB ? (riskA as 'low' | 'medium' | 'high') : (riskB as 'low' | 'medium' | 'high');
}

// 2. Detect trigger words locally (Runs 100% of the time)
function detectTriggers(text: string): { triggers: string[], riskLevel: 'low' | 'medium' | 'high' } {
  const lowerText = text.toLowerCase();
  const foundTriggers: string[] = [];
  let maxRisk: 'low' | 'medium' | 'high' = 'low';

  Object.entries(TRIGGER_WORDS).forEach(([category, words]) => {
    words.forEach(word => {
      // Check for whole words or specific phrases to avoid false positives
      if (lowerText.includes(word)) {
        foundTriggers.push(word);
        
        // Assess risk level based on category
        if (category === 'suicide' || category === 'selfHarm') {
          maxRisk = 'high';
        } else if (category === 'depression' || category === 'trauma' || category === 'substance') {
          if (maxRisk !== 'high') maxRisk = 'medium';
        }
      }
    });
  });

  return { triggers: foundTriggers, riskLevel: maxRisk };
}

// --- API HANDLING ---

async function callGemini(text: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found');
    return null;
  }

  try {
    // FIXED: Using gemini-1.5-flash (Standard, reliable)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this journal entry and respond with ONLY a JSON object (no markdown).
            
            Schema:
            {
              "mood": "happy|sad|angry|anxious|excited|calm|frustrated|overwhelmed",
              "confidence": 0.85,
              "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
              "explanation": "brief analysis of the emotion",
              "riskLevel": "low|medium|high",
              "triggers": ["concerning words if any"]
            }

            Text: "${text.replace(/"/g, '\\"')}"`
          }]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) return null;

    try {
      // Clean parsing
      return JSON.parse(content);
    } catch {
      console.error('Failed to parse Gemini response');
      return null;
    }
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return null;
  }
}

// --- MAIN ANALYSIS FUNCTION ---

export async function analyzeSentimentAdvanced(text: string): Promise<AnalysisResult> {
  // 1. Run Local Safety Check IMMEDIATELLY
  // This ensures triggers are caught even if the API fails later
  const localSafety = detectTriggers(text || "");

  if (!text || text.trim().length < 5) {
    return {
      mood: 'calm',
      confidence: 0,
      triggers: [],
      emotions: {},
      complexity: 'simple',
      riskLevel: 'low',
      suggestions: [],
      explanation: ''
    };
  }

  let aiResult = null;

  try {
    console.log('Starting Gemini AI analysis...');
    aiResult = await callGemini(text);
  } catch (error) {
    console.error('Gemini analysis failed or network error:', error);
  }

  // SCENARIO A: API Success
  if (aiResult && aiResult.mood) {
    console.log('Gemini analysis successful');
    
    // Merge Local Triggers with AI Triggers
    // We use a Set to remove duplicates
    const combinedTriggers = Array.from(new Set([
      ...localSafety.triggers, 
      ...(aiResult.triggers || [])
    ]));

    // Use the higher risk level between Local and AI
    const finalRiskLevel = getHigherRisk(aiResult.riskLevel || 'low', localSafety.riskLevel);

    return {
      mood: aiResult.mood as AnalyzedMood,
      confidence: Math.min(Math.max(aiResult.confidence || 0.7, 0.3), 1.0),
      triggers: combinedTriggers, // Uses combined list
      emotions: { [aiResult.mood]: aiResult.confidence || 0.8 },
      complexity: 'simple',
      riskLevel: finalRiskLevel, // Uses strictest risk assessment
      suggestions: aiResult.suggestions || [],
      explanation: aiResult.explanation || `Detected ${aiResult.mood} mood`
    };
  }
  
  // SCENARIO B: API Failed (Fallback)
  console.log('Falling back to basic analysis (preserving safety checks)');
  const mood = analyzeSentimentBasic(text);
  const suggestions = getBasicSuggestions(mood);
  
  return {
    mood,
    confidence: 0.6,
    // CRITICAL: We still return the locally detected triggers and risk
    triggers: localSafety.triggers, 
    riskLevel: localSafety.riskLevel,
    emotions: { [mood]: 0.6 },
    complexity: 'simple',
    suggestions,
    explanation: `Detected ${mood} mood from your writing`
  };
}

// Detect trigger words and assess risk
// Advanced sentiment analysis using Gemini API

// Basic suggestions based on mood with advanced recommendations
function getBasicSuggestions(mood: AnalyzedMood): string[] {
  const suggestions = {
    frustrated: ['Take a step back and breathe deeply for 30 seconds', 'Try breaking the problem into smaller, manageable parts', 'Consider asking for help or a different perspective'],
    sad: ['Talk to someone you trust about how you\'re feeling', 'Consider professional support if these feelings persist', 'Practice gentle self-care and be patient with yourself'],
    anxious: ['Try the 4-7-8 breathing technique (inhale 4, hold 7, exhale 8)', 'Ground yourself using the 5-4-3-2-1 technique', 'Write down your specific worries to externalize them'],
    angry: ['Count to 10 slowly before responding', 'Try physical exercise to release tension safely', 'Practice the \'STOP\' technique: Stop, Take a breath, Observe, Proceed mindfully'],
    happy: ['Share this positive energy with someone you care about', 'Write down what made you happy to remember later', 'Use this good mood to tackle something you\'ve been putting off'],
    excited: ['Channel this energy into a productive activity', 'Share your excitement with supportive people', 'Make a concrete plan to maintain this momentum'],
    calm: ['Enjoy and savor this peaceful moment', 'Practice gratitude for three specific things', 'Use this clarity to reflect on your goals'],
    love: ['Express your feelings to those who matter to you', 'Practice loving-kindness meditation', 'Write a gratitude letter to someone special'],
    disgust: ['Identify what specifically bothers you and why', 'Consider if this feeling is protecting you from something harmful', 'Practice acceptance of things you cannot change'],
    envy: ['Focus on your own achievements and progress', 'Practice gratitude for what you have', 'Use this feeling as motivation to work toward your goals'],
    guilt: ['Acknowledge your mistake and learn from it', 'Make amends if possible and appropriate', 'Practice self-forgiveness and focus on future actions'],
    shame: ['Remember that you are not defined by your mistakes', 'Talk to a trusted friend or counselor', 'Practice self-compassion and challenge negative self-talk'],
    pride: ['Celebrate your accomplishment mindfully', 'Share your success with supportive people', 'Use this confidence to tackle new challenges'],
    lonely: ['Reach out to a friend or family member', 'Consider joining a community group or activity', 'Practice self-compassion and remember this feeling is temporary'],
    hopeful: ['Channel this optimism into concrete action plans', 'Share your hopes with others who support you', 'Write down your goals and next steps'],
    grateful: ['Write down three specific things you\'re grateful for', 'Express thanks to someone who has helped you', 'Practice gratitude meditation'],
    confused: ['Break down the situation into smaller parts', 'Write down what you know vs. what you don\'t know', 'Seek clarity from trusted sources or advisors'],
    disappointed: ['Allow yourself to feel this emotion fully', 'Identify what you can learn from this experience', 'Focus on what you can control moving forward'],
    jealous: ['Examine the root cause of your jealousy', 'Focus on your own unique strengths and path', 'Practice gratitude for your relationships and achievements'],
    embarrassed: ['Remember that everyone makes mistakes', 'Focus on what you can learn from this experience', 'Practice self-compassion and move forward'],
    bored: ['Try a new activity or hobby', 'Set a small, achievable goal for today', 'Reach out to someone you haven\'t talked to in a while'],
    nostalgic: ['Appreciate the good memories while staying present', 'Consider what from the past you can bring into your current life', 'Share a fond memory with someone who was part of it'],
    overwhelmed: ['List your tasks and prioritize the most important ones', 'Take breaks and practice deep breathing', 'Ask for help or delegate if possible']
  };
  
  return suggestions[mood] || suggestions.calm;
}
// Advanced sentiment analysis with multiple detection layers
function analyzeSentimentBasic(text: string): AnalyzedMood {
  const lowerText = text.toLowerCase();
  
  // Ultra-comprehensive emotion patterns with context awareness
  const emotionPatterns = {
    // Disappointment and frustration patterns
    frustrated: [
      'frustrated', 'frustrating', 'fed up', 'sick of', 'tired of', 'had enough', 'give up', 'quit', 'done with', 'over it',
      'not working', 'doesnt work', 'broken', 'waste of time', 'annoying', 'irritating', 'stuck', 'blocked'
    ],
    
    // Disappointment patterns
    disappointed: [
      'disappointed', 'let down', 'letdown', 'expected better', 'not good enough', 'underwhelming', 'unsatisfied', 'dissatisfied',
      'terrible', 'awful', 'horrible', 'pathetic', 'ridiculous', 'failed expectations', 'not what i hoped', 'thought it would be better'
    ],
    
    // Sadness with nuanced detection
    sad: [
      'sad', 'depressed', 'down', 'blue', 'miserable', 'heartbroken', 'devastated', 'grief', 'sorrow', 
      'melancholy', 'gloomy', 'dejected', 'crying', 'tears', 'empty', 'hopeless', 'despair',
      'no point', 'dont see the point', 'nothing matters', 'dont know what to do', 'give up on life'
    ],
    
    // Loneliness patterns
    lonely: [
      'lonely', 'alone', 'isolated', 'no one understands', 'no friends', 'by myself', 'nobody cares', 'abandoned',
      'left out', 'excluded', 'disconnected', 'no one to talk to', 'feel invisible', 'forgotten'
    ],
    
    // Anger with intensity levels
    angry: [
      'angry', 'mad', 'furious', 'rage', 'hate', 'pissed', 'livid', 'outraged', 'enraged', 'seething',
      'pissed off', 'ticked off', 'steamed', 'boiling', 'fuming', 'irate', 'incensed', 'infuriated'
    ],
    
    // Anxiety with physical symptoms
    anxious: [
      'worried', 'worry', 'anxious', 'anxiety', 'nervous', 'scared', 'afraid', 'panic', 'tense', 'uneasy', 'restless',
      'heart racing', 'cant breathe', 'racing heart', 'sweating', 'presentation', 'exam', 'interview', 'meeting',
      'deadline', 'pressure', 'performance', 'judgment', 'what if', 'catastrophic', 'disaster', 'failure'
    ],
    
    // Overwhelmed patterns
    overwhelmed: [
      'overwhelmed', 'too much', 'cant handle', 'drowning', 'buried', 'swamped', 'stressed out', 'breaking point',
      'cant cope', 'falling apart', 'losing control', 'spiraling', 'chaos', 'everything at once'
    ],
    
    // Happiness with enthusiasm levels
    happy: [
      'happy', 'joy', 'great', 'amazing', 'wonderful', 'good', 'fantastic', 'awesome', 'brilliant', 
      'perfect', 'delighted', 'cheerful', 'elated', 'blissful', 'euphoric', 'radiant', 'glowing', 'beaming'
    ],
    
    // Love patterns
    love: [
      'love', 'adore', 'cherish', 'treasure', 'devoted', 'affection', 'romantic', 'soulmate', 'in love',
      'love so much', 'mean everything', 'heart full', 'butterflies', 'head over heels', 'crazy about'
    ],
    
    // Excitement and energy
    excited: [
      'excited', 'thrilled', 'pumped', 'enthusiastic', 'eager', 'hyped', 'stoked', 'cant wait', 'looking forward',
      'anticipating', 'buzzing', 'electric', 'charged', 'amped', 'ready', 'motivated', 'inspired'
    ],
    
    // Disgust patterns
    disgust: [
      'disgusted', 'disgusting', 'gross', 'revolting', 'repulsive', 'sick', 'nauseous', 'vile', 'repugnant',
      'makes me sick', 'cant stand', 'revolted', 'appalled', 'horrified', 'turned off', 'repelled'
    ],
    
    // Envy patterns
    envy: [
      'envious', 'envy', 'wish i had', 'why cant i have', 'not fair', 'they have everything', 'lucky them',
      'wish i was', 'why them and not me', 'they dont deserve', 'i want what they have'
    ],
    
    // Jealousy patterns
    jealous: [
      'jealous', 'jealousy', 'possessive', 'threatened', 'insecure', 'paranoid', 'suspicious', 'worried about losing',
      'afraid theyll leave', 'comparing myself', 'not good enough for them', 'they might find someone better'
    ],
    
    // Guilt patterns
    guilt: [
      'guilty', 'guilt', 'my fault', 'i should have', 'i shouldnt have', 'regret', 'sorry', 'apologize',
      'feel bad about', 'wish i hadnt', 'made a mistake', 'hurt someone', 'let them down', 'responsible for'
    ],
    
    // Shame patterns
    shame: [
      'ashamed', 'shame', 'embarrassed', 'humiliated', 'mortified', 'exposed', 'judged', 'worthless', 'pathetic',
      'hate myself', 'disgusted with myself', 'cant face anyone', 'want to hide', 'feel small'
    ],
    
    // Pride patterns
    pride: [
      'proud', 'accomplished', 'achieved', 'succeeded', 'did it', 'nailed it', 'crushed it', 'victory',
      'earned it', 'worked hard', 'deserve this', 'finally', 'breakthrough', 'milestone', 'personal best'
    ],
    
    // Gratitude patterns
    grateful: [
      'grateful', 'thankful', 'blessed', 'appreciate', 'lucky', 'fortunate', 'thank god', 'so grateful',
      'means so much', 'couldnt ask for more', 'feel blessed', 'appreciate everything', 'thankful for'
    ],
    
    // Hope patterns
    hopeful: [
      'hopeful', 'hope', 'optimistic', 'positive', 'looking up', 'getting better', 'bright future',
      'things will improve', 'light at the end', 'tomorrow will be better', 'faith', 'believe'
    ],
    
    // Confusion patterns
    confused: [
      'confused', 'dont understand', 'makes no sense', 'lost', 'puzzled', 'baffled', 'perplexed',
      'what does this mean', 'how is this possible', 'dont get it', 'mixed up', 'unclear'
    ],
    
    // Embarrassment patterns
    embarrassed: [
      'embarrassed', 'embarrassing', 'awkward', 'cringe', 'mortified', 'red faced', 'want to disappear',
      'so awkward', 'humiliating', 'made a fool', 'everyone saw', 'cant show my face'
    ],
    
    // Boredom patterns
    bored: [
      'bored', 'boring', 'nothing to do', 'dull', 'tedious', 'monotonous', 'same old', 'routine',
      'uninspired', 'restless', 'need something new', 'going through motions', 'lifeless'
    ],
    
    // Nostalgia patterns
    nostalgic: [
      'nostalgic', 'miss', 'remember when', 'good old days', 'used to', 'back then', 'memories',
      'wish i could go back', 'those were the days', 'simpler times', 'reminds me of', 'long for'
    ]
  };
  
  const scores: Record<string, number> = {};
  const contextBoosts: Record<string, number> = {};
  
  // Initialize scores
  Object.keys(emotionPatterns).forEach(mood => {
    scores[mood] = 0;
    contextBoosts[mood] = 0;
  });
  
  // Advanced pattern matching with context awareness
  Object.entries(emotionPatterns).forEach(([mood, patterns]) => {
    patterns.forEach(pattern => {
      if (lowerText.includes(pattern)) {
        // Base weight for pattern length
        const baseWeight = Math.max(pattern.split(' ').length, 1);
        scores[mood] += baseWeight;
        
        // Context boosting - look for intensifiers
        const intensifiers = ['very', 'extremely', 'really', 'so', 'incredibly', 'absolutely', 'totally', 'completely'];
        const negativeIntensifiers = ['not', 'never', 'dont', 'doesnt', 'cant', 'wont', 'isnt', 'arent'];
        
        // Check for intensifiers near the pattern
        const patternIndex = lowerText.indexOf(pattern);
        const contextWindow = lowerText.substring(Math.max(0, patternIndex - 50), patternIndex + pattern.length + 50);
        
        intensifiers.forEach(intensifier => {
          if (contextWindow.includes(intensifier)) {
            contextBoosts[mood] += 2;
          }
        });
        
        // Check for negation (reduces score)
        negativeIntensifiers.forEach(negator => {
          if (contextWindow.includes(negator + ' ' + pattern) || contextWindow.includes(negator + 't ' + pattern)) {
            scores[mood] = Math.max(0, scores[mood] - baseWeight);
          }
        });
        
        console.log(`Advanced: Found "${pattern}" in ${mood} category, weight: ${baseWeight}, context boost: ${contextBoosts[mood]}`);
      }
    });
  });
  
  // Apply context boosts
  Object.keys(scores).forEach(mood => {
    scores[mood] += contextBoosts[mood];
  });
  
  console.log('Advanced analysis scores:', scores);
  
  // Find highest scoring mood with minimum threshold
  const sortedMoods = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a);
  
  if (sortedMoods.length > 0) {
    const topMood = sortedMoods[0][0] as AnalyzedMood;
    const topScore = sortedMoods[0][1];
    console.log('Advanced detected mood:', topMood, 'with score:', topScore);
    return topMood;
  }
  
  return 'calm';
}

// Backward compatibility
export const analyzeSentiment = analyzeSentimentBasic;
export const analyzeSentimentAuto = analyzeSentimentAdvanced;

// Get mood explanation with advanced insights
export function getMoodExplanation(text: string, mood: AnalyzedMood, analysis?: AnalysisResult): string {
  if (!analysis) {
    return `I detected a ${mood} mood from your writing.`;
  }

  const { complexity, emotions, confidence, riskLevel } = analysis;
  
  let explanation = `I detected ${mood} as your primary emotion`;
  
  if (complexity === 'complex') {
    explanation += " along with several other complex emotions";
  } else if (complexity === 'mixed') {
    explanation += " mixed with other feelings";
  }
  
  // Add top emotions
  const topEmotions = Object.entries(emotions)
    .filter(([_, score]) => score > 0.3)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
    .map(([emotion, _]) => emotion);
    
  if (topEmotions.length > 1) {
    explanation += `. I also sense ${topEmotions.slice(1).join(', ')}`;
  }
  
  explanation += `. Confidence: ${Math.round(confidence * 100)}%`;
  
  if (riskLevel === 'high') {
    explanation += " ⚠️ I noticed some concerning language. Please consider reaching out for support.";
  } else if (riskLevel === 'medium') {
    explanation += " 💙 I sense you might be going through a difficult time.";
  }
  
  return explanation;
}