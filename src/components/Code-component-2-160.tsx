import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, CheckCircle2, Clock, Coins } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  type: 'daily' | 'weekly';
  emoji: string;
}

interface QuestsAndCoinsProps {
  coins: number;
  onCoinsUpdate: (coins: number) => void;
  onBack: () => void;
}

export function QuestsAndCoins({ coins, onCoinsUpdate, onBack }: QuestsAndCoinsProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  useEffect(() => {
    // Initialize quests
    const dailyQuests: Quest[] = [
      {
        id: 'journal',
        title: 'Daily Journal',
        description: 'Write in your journal about your day',
        reward: 25,
        completed: false,
        type: 'daily',
        emoji: '📔'
      },
      {
        id: 'mindfulness',
        title: 'Mindful Moment',
        description: 'Take 5 minutes for mindfulness',
        reward: 15,
        completed: false,
        type: 'daily',
        emoji: '🧘‍♀️'
      },
      {
        id: 'gratitude',
        title: 'Gratitude Practice',
        description: 'List 3 things you\'re grateful for',
        reward: 20,
        completed: false,
        type: 'daily',
        emoji: '🙏'
      },
      {
        id: 'exercise',
        title: 'Move Your Body',
        description: 'Do any physical activity for 10 minutes',
        reward: 30,
        completed: false,
        type: 'daily',
        emoji: '🏃‍♀️'
      },
      {
        id: 'hydration',
        title: 'Stay Hydrated',
        description: 'Drink 8 glasses of water',
        reward: 10,
        completed: false,
        type: 'daily',
        emoji: '💧'
      }
    ];

    // Load completed quests from localStorage
    const savedCompleted = localStorage.getItem('mindpal-completed-quests');
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('mindpal-quests-date');
    
    if (savedCompleted && savedDate === today) {
      const completed = JSON.parse(savedCompleted);
      setCompletedToday(completed);
      
      const updatedQuests = dailyQuests.map(quest => ({
        ...quest,
        completed: completed.includes(quest.id)
      }));
      setQuests(updatedQuests);
    } else {
      // Reset for new day
      setQuests(dailyQuests);
      setCompletedToday([]);
      localStorage.setItem('mindpal-quests-date', today);
      localStorage.setItem('mindpal-completed-quests', JSON.stringify([]));
    }
  }, []);

  const completeQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    // Update quest status
    setQuests(prev => prev.map(q => 
      q.id === questId ? { ...q, completed: true } : q
    ));

    // Update completed list
    const newCompleted = [...completedToday, questId];
    setCompletedToday(newCompleted);
    
    // Update coins
    onCoinsUpdate(coins + quest.reward);

    // Save to localStorage
    localStorage.setItem('mindpal-completed-quests', JSON.stringify(newCompleted));

    // Show celebration animation
    setTimeout(() => {
      const celebration = document.createElement('div');
      celebration.innerHTML = `+${quest.reward} 🪙`;
      celebration.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-yellow-500 pointer-events-none z-50 animate-bounce';
      document.body.appendChild(celebration);
      setTimeout(() => celebration.remove(), 2000);
    }, 100);
  };

  const completedQuests = quests.filter(q => q.completed).length;
  const totalRewards = quests.filter(q => q.completed).reduce((sum, q) => sum + q.reward, 0);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-200 to-yellow-300 px-4 py-2 rounded-full">
            <Coins className="w-5 h-5" />
            <span className="font-medium">{coins}</span>
          </div>
        </div>

        {/* Title and Progress */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-6xl mb-4"
          >
            🎯
          </motion.div>
          <h1 className="text-3xl font-medium text-gray-800 mb-2">Daily Quests</h1>
          <p className="text-gray-600 mb-4">
            Complete activities to earn coins and boost your well-being!
          </p>
          
          {/* Progress Summary */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{completedQuests}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{quests.length - completedQuests}</div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">+{totalRewards}</div>
                <div className="text-sm text-gray-600">Coins Earned</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 border-0 shadow-lg rounded-2xl transition-all duration-300 ${
                quest.completed 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-200' 
                  : 'bg-white/80 backdrop-blur-sm hover:shadow-xl hover:scale-105'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{quest.emoji}</div>
                    <div>
                      <h3 className="font-medium text-gray-800">{quest.title}</h3>
                      <p className="text-sm text-gray-600">{quest.description}</p>
                    </div>
                  </div>
                  
                  {quest.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Coins className="w-4 h-4" />
                    <span className="font-medium">+{quest.reward}</span>
                  </div>
                  
                  {!quest.completed && (
                    <Button
                      onClick={() => completeQuest(quest.id)}
                      className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-full px-6 py-2 font-medium"
                    >
                      Complete
                    </Button>
                  )}
                  
                  {quest.completed && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Motivational Message */}
        {completedQuests === quests.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-0 shadow-lg rounded-2xl p-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-medium text-gray-800 mb-2">
                Amazing Work!
              </h2>
              <p className="text-gray-600">
                You've completed all your daily quests! Your pet is so proud of you! 🌟
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}