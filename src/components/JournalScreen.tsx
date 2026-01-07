import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { analyzeSentimentAdvanced, getMoodExplanation, type AnalysisResult } from '../utils/sentimentAnalysis';

interface JournalEntry {
  mood:
    | "happy"
    | "sad"
    | "calm"
    | "anxious"
    | "excited"
    | "angry"
    | "irritated"
    | "frustrated"
    | "content"
    | "energetic";
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

type AnalyzedMood = "happy" | "sad" | "calm" | "anxious" | "excited" | "angry" | "irritated" | "frustrated" | "content" | "energetic";

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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setJournalText(prev => prev + finalTranscript + ' ');
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const startVoiceRecording = () => {
    if (recognition) {
      setIsRecording(true);
      setIsListening(true);
      recognition.start();
    }
  };

  const stopVoiceRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  };

  const analyzeMoodFromText = async (text: string) => {
    if (text.trim().length < 10) {
      setDetectedMood(null);
      setAnalysisResult(null);
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Use advanced HF-powered analysis
      const result = await analyzeSentimentAdvanced(text);
      setDetectedMood(result.mood);
      setAnalysisResult(result);
      
      console.log('Advanced analysis result:', result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJournalText(text);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout for analysis
    debounceRef.current = setTimeout(() => {
      analyzeMoodFromText(text);
    }, 2000); // 2 second delay
  };

  const handleSubmit = async () => {
    if (!journalText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get final analysis if not already done
      let finalAnalysis = analysisResult;
      if (!finalAnalysis) {
        finalAnalysis = await analyzeSentimentAdvanced(journalText);
      }
      
      const entry: JournalEntry = {
        mood: finalAnalysis.mood,
        content: journalText.trim(),
        date: new Date(),
        aiAnalysis: getMoodExplanation(journalText, finalAnalysis.mood, finalAnalysis),
        confidence: finalAnalysis.confidence
      };

      console.log('Submitting advanced journal entry:', entry);
      onJournalSubmit(entry);
      
      // Clear form
      setJournalText('');
      setDetectedMood(null);
      setAnalysisResult(null);
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Advanced AI Mood Detection */}
        {detectedMood && analysisResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 mb-6 bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <div className="text-center">
                <h3 className="text-lg mb-3">🧠 Advanced AI Analysis</h3>
                
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
                    <p className="text-sm text-gray-600">
                      Confidence: {Math.round(analysisResult.confidence * 100)}% • 
                      Complexity: {analysisResult.complexity}
                    </p>
                  </div>
                </div>
                
                {/* Multiple Emotions Display */}
                {Object.keys(analysisResult.emotions).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Detected Emotions:</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {Object.entries(analysisResult.emotions)
                        .filter(([_, score]) => score > 0.2)
                        .sort(([_, a], [__, b]) => b - a)
                        .slice(0, 5)
                        .map(([emotion, score]) => (
                          <span key={emotion} className="text-xs bg-white/70 px-2 py-1 rounded-full">
                            {emotion} ({Math.round(score * 100)}%)
                          </span>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-700 bg-white/50 rounded-xl p-3">
                  {analysisResult.explanation}
                </p>
                
                {/* AI Suggestions */}
                {analysisResult.suggestions.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-800 mb-2">💡 Suggestions for you:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Risk Assessment */}
                {analysisResult.riskLevel !== 'low' && (
                  <div className={`mt-3 p-3 rounded border-l-4 text-sm ${
                    analysisResult.riskLevel === 'high' 
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  }`}>
                    <strong>⚠️ {analysisResult.riskLevel === 'high' ? 'High' : 'Medium'} Risk Detected</strong>
                    {analysisResult.triggers.length > 0 && (
                      <p>Concerning language: {analysisResult.triggers.join(', ')}</p>
                    )}
                  </div>
                )}
                
                {/* Trigger Words */}
                {analysisResult.triggers.length > 0 && analysisResult.riskLevel === 'low' && (
                  <div className="mt-3 p-3 rounded border-l-4 border-blue-400 bg-blue-50 text-blue-700 text-sm">
                    <strong>Noted keywords:</strong> {analysisResult.triggers.join(', ')}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
        
        {/* Pet Mood Reflection */}
        {detectedMood && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <Card className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-3xl">
              <div className="text-center">
                <h3 className="text-md mb-2">🐾 {petName}'s Mood</h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">{moodEmojis[detectedMood]}</span>
                  <p className="text-sm text-gray-700">
                    {petName} is feeling {detectedMood} because you are {detectedMood}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        
        {/* Analysis Loading */}
        {isAnalyzing && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-2xl mb-2"
              >
                🧠
              </motion.div>
              <p className="text-sm text-gray-600">Analyzing with advanced AI models...</p>
            </div>
          </Card>
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
              placeholder="Write about your day, feelings, thoughts, or anything that comes to mind... Or use voice button below! ✨"
              className="min-h-[200px] border-0 bg-white/50 rounded-2xl resize-none focus:ring-2 focus:ring-purple-300 transition-all"
            />
            
            {/* Voice Recording Status */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center justify-center space-x-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <span>🎙️ Listening...</span>
              </motion.div>
            )}
            
            {/* Character count and submit */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-500">
                  {journalText.length} characters
                </p>
                <Button
                  type="button"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`text-xs px-4 py-2 rounded-lg font-medium shadow-md transition-all ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {isRecording ? '🛑 Stop' : '🎤 Voice'}
                </Button>
              </div>
              
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
            {petName} is learning about your emotions through advanced AI analysis 🧠💕
          </p>
          {journalText.length > 0 && journalText.length < 10 && (
            <p className="text-xs text-gray-500 mt-2">
              Write a bit more for advanced mood detection ✍️
            </p>
          )}
          {analysisResult && analysisResult.riskLevel !== 'low' && (
            <p className="text-xs text-blue-600 mt-2 font-medium">
              💙 Remember: You're not alone. Support is available if you need it.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}