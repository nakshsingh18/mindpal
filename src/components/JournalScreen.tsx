import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { analyzeSentiment, analyzeSentimentAuto, getMoodExplanation, type AnalyzedMood } from '../utils/sentimentAnalysis';
import { supabase } from '../utils/supabase/client';

interface JournalEntry {
  mood: AnalyzedMood;
  content: string;
  date: Date;
  confidence?: number;
  aiAnalysis?: string;
}

interface JournalScreenProps {
  onJournalSubmit: (entry: JournalEntry) => void;
  onBack: () => void;
  petName: string;
}

const moodEmojis: { [key in AnalyzedMood]: string } = {
  happy: '😊',
  excited: '🤗',
  energetic: '⚡',
  content: '😌',
  calm: '🕯️',
  sad: '😢',
  anxious: '😰',
  angry: '😡',
  irritated: '😤',
  frustrated: '😓'
};

export function JournalScreen({ onJournalSubmit, onBack, petName }: JournalScreenProps) {
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedMood, setDetectedMood] = useState<AnalyzedMood | null>(null);
    const [moodExplanation, setMoodExplanation] = useState<string>('');
    const [confidence, setConfidence] = useState<number | null>(null);
    const [triggers, setTriggers] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<any | null>(null);
    const [supportsSpeech, setSupportsSpeech] = useState<boolean>(true);

  const analyzeMoodFromText = (text: string) => {
    if (text.trim().length < 10) {
      setDetectedMood(null);
      setMoodExplanation('');
      return;
    }
    // Immediate local analysis for snappy feedback
    const mood = analyzeSentiment(text);
    const explanation = getMoodExplanation(text, mood);
    setDetectedMood(mood);
    setMoodExplanation(explanation);

    // Async: try HF-enhanced analysis (if key present) then update state
    analyzeSentimentAuto(text).then(res => {
      if (!res) return;
      setDetectedMood(res.mood);
      setMoodExplanation(getMoodExplanation(text, res.mood));
      setConfidence(Math.round((res.confidence || 0) * 100) / 100);
      setTriggers(res.triggers || []);
    }).catch(() => {
      // ignore HF errors; keep local result
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJournalText(text);
    
    // Debounce mood analysis
    const timeoutId = setTimeout(() => analyzeMoodFromText(text), 800);
    // clear previous timer
    return () => clearTimeout(timeoutId);
  };

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      setSupportsSpeech(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (finalTranscript) {
        setJournalText((t) => (t ? t + ' ' + finalTranscript : finalTranscript));
        analyzeMoodFromText((journalText ? journalText + ' ' : '') + finalTranscript);
      }
      setInterimTranscript(interim);
    };

    recog.onerror = (e: any) => {
      console.warn('SpeechRecognition error', e);
      setIsRecording(false);
    };

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      setSupportsSpeech(false);
      return;
    }
    const recog = recognitionRef.current;
    if (isRecording) {
      try { recog.stop(); } catch (e) {}
      setIsRecording(false);
      setInterimTranscript('');
    } else {
      try {
        await recog.start();
        setIsRecording(true);
      } catch (e) {
        console.warn('Could not start speech recognition', e);
        setIsRecording(false);
        setSupportsSpeech(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!journalText.trim()) return;
    
    setIsSubmitting(true);
    
    // Analyze sentiment one final time (prefer HF if available)
    analyzeSentimentAuto(journalText).then(res => {
      const finalMood = res?.mood ?? analyzeSentiment(journalText);
      const finalExplanation = getMoodExplanation(journalText, finalMood);
      const entry: JournalEntry = {
        mood: finalMood,
        content: journalText.trim(),
        date: new Date(),
        aiAnalysis: finalExplanation,
        confidence: res?.confidence
      };

      // Simulate processing time for AI analysis
      setTimeout(() => {
        onJournalSubmit(entry);
        setIsSubmitting(false);
      }, 800);
    }).catch(() => {
      const finalMood = analyzeSentiment(journalText);
      const finalExplanation = getMoodExplanation(journalText, finalMood);
      const entry: JournalEntry = {
        mood: finalMood,
        content: journalText.trim(),
        date: new Date(),
        aiAnalysis: finalExplanation
      };
      setTimeout(() => {
        onJournalSubmit(entry);
        setIsSubmitting(false);
      }, 800);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/70"
          >
            ← Back
          </Button>
          <h1 className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Daily Journal
          </h1>
          <div className="w-16" /> {/* Spacer */}
        </motion.div>

        {/* AI Mood Detection */}
        {detectedMood && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 mb-6 bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <div className="text-center">
                <h3 className="text-lg mb-3">🤖 AI Mood Detection</h3>
                
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <motion.div
                    key={detectedMood}
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-4xl"
                  >
                    {moodEmojis[detectedMood]}
                  </motion.div>
                  <div className="text-left">
                    <p className="font-medium capitalize text-gray-800">{detectedMood}</p>
                    <p className="text-sm text-gray-600">Detected from your writing{confidence ? ` • ${(confidence * 100).toFixed(0)}%` : ''}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 bg-white/50 rounded-xl p-3">
                  {moodExplanation}
                </p>
                {triggers.length > 0 && (
                  <div className="mt-3 p-3 rounded border-l-4 border-red-400 bg-red-50 text-red-700 text-sm">
                    <strong>Trigger words detected:</strong> {triggers.join(', ')}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Journal Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
            <h3 className="text-lg mb-4">What's on your mind?</h3>
            
            <Textarea
              value={journalText}
              onChange={handleTextChange}
              placeholder="Write about your day, feelings, thoughts, or anything that comes to mind... I'll analyze your mood automatically! ✨"
              className="min-h-[200px] border-0 bg-white/50 rounded-2xl resize-none focus:ring-2 focus:ring-purple-300 transition-all"
            />
            
            {/* Audio journaling controls */}
            <div className="mt-3 mb-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleRecording}
                style={{
                  backgroundColor: isRecording ? '#dc2626' : '#0f172a',
                  color: '#ffffff'
                }}
                className={`rounded-full px-4 py-2 transition-colors duration-150 inline-flex items-center justify-center ${isRecording ? 'hover:bg-red-700' : 'hover:bg-slate-800'}`}
              >
                {isRecording ? 'Stop Recording ⏹️' : 'Speak 🎤'}
              </button>
              {!supportsSpeech && (
                <div className="text-sm text-gray-500">Speech recognition not available in this browser.</div>
              )}
              {interimTranscript && (
                <div className="text-sm italic text-gray-600">Listening: {interimTranscript}</div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">
                {journalText.length} characters
              </p>
              
              <Button
                onClick={handleSubmit}
                disabled={!journalText.trim() || isSubmitting}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-6 transition-all duration-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      🤖
                    </motion.div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Save Entry ✨'
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Encouraging message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-600">
            {petName} is learning about your emotions through AI sentiment analysis 🧠💕
          </p>
          {journalText.length > 0 && journalText.length < 10 && (
            <p className="text-xs text-gray-500 mt-2">
              Write a bit more for mood detection to work ✍️
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}