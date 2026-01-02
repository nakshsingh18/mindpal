import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface QuestScreenProps {
  userId: string;
  onBack: () => void;
  onProfileUpdate: (profile: any) => void;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  progress: number;
  total: number;
  reward: number;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

const quests: Quest[] = [
  {
    id: '1',
    title: 'Gratitude Master',
    description: 'Write 3 things you\'re grateful for',
    emoji: '🙏',
    progress: 2,
    total: 3,
    reward: 50,
    completed: false,
    difficulty: 'easy'
  },
  {
    id: '2',
    title: 'Mindful Moments',
    description: 'Complete 5 minutes of breathing exercises',
    emoji: '🧘‍♀️',
    progress: 0,
    total: 1,
    reward: 75,
    completed: false,
    difficulty: 'medium'
  },
  {
    id: '3',
    title: 'Mood Tracker',
    description: 'Log your mood for 7 consecutive days',
    emoji: '📊',
    progress: 3,
    total: 7,
    reward: 150,
    completed: false,
    difficulty: 'hard'
  },
  {
    id: '4',
    title: 'Self-Care Sunday',
    description: 'Complete a self-care activity',
    emoji: '💆‍♀️',
    progress: 1,
    total: 1,
    reward: 100,
    completed: true,
    difficulty: 'medium'
  }
];

export function QuestScreen({ userId, onBack, onProfileUpdate }: QuestScreenProps) {
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [showReward, setShowReward] = useState<string | null>(null);
  const [questProgress, setQuestProgress] = useState<any>(null);
  const [userGems, setUserGems] = useState(0);

  useEffect(() => {
    loadQuestData();
  }, []);

  const loadQuestData = async () => {
    try {
      const [questData, profile] = await Promise.all([
        api.getQuests(userId),
        api.getProfile(userId)
      ]);
      
      setQuestProgress(questData);
      setUserGems(profile.gems || 0);
      
      // Set completed quests
      const completed = Object.entries(questData.quests || {})
        .filter(([_, quest]: [string, any]) => quest.completed)
        .map(([id]) => id);
      setCompletedQuests(completed);
      
    } catch (error) {
      console.error('Error loading quest data:', error);
    }
  };

  const getDifficultyColor = (difficulty: Quest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleCompleteQuest = async (questId: string, reward: number) => {
    try {
      await api.completeQuest(userId, questId, reward);
      
      setCompletedQuests(prev => [...prev, questId]);
      setUserGems(prev => prev + reward);
      setShowReward(questId);
      
      // Update parent component profile
      const updatedProfile = await api.getProfile(userId);
      onProfileUpdate(updatedProfile);
      
      // Hide reward animation after 2 seconds
      setTimeout(() => setShowReward(null), 2000);
      
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 p-6">
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
          <h1 className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Daily Quests
          </h1>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-sm">💎</span>
            <span className="text-sm">{userGems}</span>
          </div>
        </motion.div>

        {/* Quest Cards */}
        <div className="space-y-4">
          {quests.map((quest, index) => {
            const isCompleted = completedQuests.includes(quest.id);
            const progressPercentage = (quest.progress / quest.total) * 100;
            
            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 border-0 shadow-lg rounded-3xl transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 shadow-green-200/50' 
                    : 'bg-white/70 backdrop-blur-sm hover:shadow-xl'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl p-2 rounded-full ${
                        isCompleted ? 'bg-green-200' : 'bg-white/50'
                      }`}>
                        {isCompleted ? '✅' : quest.emoji}
                      </div>
                      <div>
                        <h3 className={`text-lg ${isCompleted ? 'line-through text-gray-600' : ''}`}>
                          {quest.title}
                        </h3>
                        <p className="text-sm text-gray-600">{quest.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant="outline" 
                        className={getDifficultyColor(quest.difficulty)}
                      >
                        {quest.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <span>💎</span>
                        <span>{quest.reward}</span>
                      </div>
                    </div>
                  </div>

                  {!isCompleted && (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{quest.progress}/{quest.total}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>

                      {quest.progress >= quest.total ? (
                        <Button
                          onClick={() => handleCompleteQuest(quest.id, quest.reward)}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl"
                        >
                          Claim Reward! ✨
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl bg-white/50 border-0"
                          disabled
                        >
                          Continue Quest
                        </Button>
                      )}
                    </>
                  )}

                  {/* Reward Animation */}
                  {showReward === quest.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: -20 }}
                      className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-3xl"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: 1 }}
                          className="text-4xl mb-2"
                        >
                          💎
                        </motion.div>
                        <p className="text-lg">+{quest.reward} gems!</p>
                        <div className="flex justify-center gap-2 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, y: 0 }}
                              animate={{ opacity: [0, 1, 0], y: -30 }}
                              transition={{ delay: i * 0.1, duration: 1 }}
                              className="text-yellow-400"
                            >
                              ✨
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Weekly Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-0 shadow-lg rounded-3xl">
            <div className="text-center">
              <h3 className="text-lg mb-2">🌟 Weekly Challenge</h3>
              <p className="text-sm text-gray-600 mb-4">
                Complete all daily quests for 5 days straight
              </p>
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      i < 3 ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i < 3 ? '✓' : i + 1}
                  </div>
                ))}
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                3/5 days complete
              </Badge>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}