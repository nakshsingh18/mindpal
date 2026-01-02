import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  analyzeMoods, 
  getMoodEmoji, 
  getMoodColor, 
  categorizeMood,
  type JournalEntry as AnalyticsJournalEntry,
  type MoodAnalytics,
  type MoodReward
} from '../utils/moodAnalytics';

interface AnalyticsScreenProps {
  journalEntries: AnalyticsJournalEntry[];
  onBack: () => void;
  onCoinsUpdate: (coins: number) => void;
  coins: number;
  petName: string;
}

export function AnalyticsScreen({ journalEntries, onBack, onCoinsUpdate, coins, petName }: AnalyticsScreenProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('all');
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);

  // Filter entries based on timeframe
  const getFilteredEntries = () => {
    const now = new Date();
    let cutoffDate: Date;

    switch (selectedTimeframe) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return journalEntries;
    }

    return journalEntries.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  const filteredEntries = getFilteredEntries();
  const analytics: MoodAnalytics = analyzeMoods(filteredEntries);

  const handleClaimReward = (reward: MoodReward) => {
    const rewardId = `${reward.type}-${reward.coinReward}`;
    if (!claimedRewards.includes(rewardId)) {
      setClaimedRewards(prev => [...prev, rewardId]);
      onCoinsUpdate(coins + reward.coinReward);
      
      // Show celebration
      setTimeout(() => {
        const celebration = document.createElement('div');
        celebration.innerHTML = `${reward.emoji} +${reward.coinReward} coins!`;
        celebration.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-yellow-600 pointer-events-none z-50 animate-bounce';
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 3000);
      }, 100);
    }
  };

  const getTrendEmoji = () => {
    switch (analytics.recentTrend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = () => {
    switch (analytics.recentTrend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (journalEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
        <div className="max-w-2xl mx-auto">
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
            <h1 className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Mood Analytics
            </h1>
            <div className="w-16" />
          </motion.div>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl mb-4">No Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Start journaling to see your mood analytics and insights from {petName}!
            </p>
            <Button 
              onClick={onBack}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full px-6"
            >
              Start Journaling ✨
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Mood Analytics
          </h1>
          <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-200 to-yellow-300 px-3 py-1 rounded-full">
            <span>🪙</span>
            <span className="text-sm font-medium">{coins}</span>
          </div>
        </motion.div>

        {/* Timeframe Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
        >
          <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1">
            {[
              { key: 'week', label: 'Past Week' },
              { key: 'month', label: 'Past Month' },
              { key: 'all', label: 'All Time' }
            ].map((option) => (
              <Button
                key={option.key}
                variant={selectedTimeframe === option.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeframe(option.key as any)}
                className={`rounded-xl transition-all ${
                  selectedTimeframe === option.key 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                    : 'hover:bg-white/30'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mood Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Mood Overview</h3>
                <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                  <span>{getTrendEmoji()}</span>
                  <span className="text-sm capitalize">{analytics.recentTrend}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Positive Moods</span>
                    <span className="font-medium text-green-600">{analytics.positivePercentage}%</span>
                  </div>
                  <Progress value={analytics.positivePercentage} className="h-3 bg-gray-200" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Negative Moods</span>
                    <span className="font-medium text-red-600">{analytics.negativePercentage}%</span>
                  </div>
                  <Progress value={analytics.negativePercentage} className="h-3 bg-gray-200" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Neutral Moods</span>
                    <span className="font-medium text-blue-600">{analytics.neutralPercentage}%</span>
                  </div>
                  <Progress value={analytics.neutralPercentage} className="h-3 bg-gray-200" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getMoodEmoji(analytics.dominantMood)}</div>
                  <div>
                    <h4 className="font-medium">Dominant Mood</h4>
                    <p className="text-sm text-gray-600 capitalize">{analytics.dominantMood}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Mood Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <h3 className="text-lg font-medium mb-4">Detailed Breakdown</h3>
              
              <div className="space-y-3">
                {Object.entries(analytics.moodCounts)
                  .filter(([_, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([mood, count]) => (
                    <div key={mood} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getMoodEmoji(mood as any)}</span>
                        <span className="capitalize font-medium">{mood}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getMoodColor(mood as any)}>
                          {count} entries
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {Math.round((count / analytics.totalEntries) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Rewards Section */}
        {analytics.rewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                <span>🏆</span>
                <span>Achievements & Rewards</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.rewards.map((reward, index) => {
                  const rewardId = `${reward.type}-${reward.coinReward}`;
                  const isClaimed = claimedRewards.includes(rewardId);
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`p-4 rounded-2xl border-2 ${
                        isClaimed 
                          ? 'bg-gray-100 border-gray-300' 
                          : 'bg-white border-yellow-300 shadow-lg'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">{reward.emoji}</div>
                        <Button
                          size="sm"
                          disabled={isClaimed}
                          onClick={() => handleClaimReward(reward)}
                          className={`rounded-full ${
                            isClaimed 
                              ? 'bg-gray-300 text-gray-500' 
                              : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                          }`}
                        >
                          {isClaimed ? 'Claimed ✓' : `Claim +${reward.coinReward} 🪙`}
                        </Button>
                      </div>
                      
                      <h4 className="font-medium mb-2">{reward.title}</h4>
                      <p className="text-sm text-gray-600">{reward.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Suggestions */}
        {analytics.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                <span>💡</span>
                <span>Personalized Suggestions from {petName}</span>
              </h3>
              
              <div className="space-y-3">
                {analytics.suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl"
                  >
                    <div className="text-xl">💝</div>
                    <p className="text-gray-700">{suggestion}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Recent Entries History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
            <h3 className="text-lg font-medium mb-4">Complete Journal History</h3>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredEntries.slice().reverse().map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border"
                >
                  <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm mb-2">
                      {entry.content.slice(0, 150)}
                      {entry.content.length > 150 && '...'}
                    </p>
                    {entry.aiAnalysis && (
                      <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-2 py-1 mb-2">
                        🤖 {entry.aiAnalysis.slice(0, 100)}
                        {entry.aiAnalysis.length > 100 && '...'}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleDateString()} at {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <Badge className={getMoodColor(entry.mood) + " text-xs capitalize"}>
                        {entry.mood}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}