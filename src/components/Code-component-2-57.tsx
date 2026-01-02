import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface AnalyticsScreenProps {
  userId: string;
  onBack: () => void;
}

export function AnalyticsScreen({ userId, onBack }: AnalyticsScreenProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics(userId, selectedPeriod);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😄';
      case 'sad': return '😢';
      case 'stressed': return '😰';
      case 'calm': return '😌';
      default: return '😐';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'bg-yellow-100 text-yellow-800';
      case 'sad': return 'bg-blue-100 text-blue-800';
      case 'stressed': return 'bg-red-100 text-red-800';
      case 'calm': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          📊
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
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
          <h1 className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Your Analytics
          </h1>
          <div className="w-16" />
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 justify-center"
        >
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              variant={selectedPeriod === days ? "default" : "outline"}
              className={`rounded-full ${
                selectedPeriod === days 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            >
              {days} days
            </Button>
          ))}
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-3xl text-center">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl mb-1">{analytics?.totalEntries || 0}</div>
            <div className="text-sm text-gray-600">Journal Entries</div>
          </Card>
          
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-3xl text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl mb-1">{analytics?.averageWordsPerEntry || 0}</div>
            <div className="text-sm text-gray-600">Avg Words</div>
          </Card>
        </motion.div>

        {/* Mood Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
            <h3 className="text-lg mb-4 text-center">Mood Distribution</h3>
            
            {analytics?.moodDistribution && (
              <div className="space-y-3">
                {Object.entries(analytics.moodDistribution).map(([mood, count]: [string, any]) => {
                  const percentage = analytics.totalEntries > 0 
                    ? Math.round((count / analytics.totalEntries) * 100) 
                    : 0;
                  
                  return (
                    <div key={mood} className="flex items-center gap-3">
                      <div className="text-2xl">{getMoodEmoji(mood)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="capitalize text-sm">{mood}</span>
                          <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className={`h-2 rounded-full ${getMoodColor(mood).replace('text-', 'bg-').replace('100', '300')}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {analytics?.mostCommonMood && (
              <div className="mt-4 text-center">
                <Badge className={`${getMoodColor(analytics.mostCommonMood)} border-0`}>
                  Most Common: {getMoodEmoji(analytics.mostCommonMood)} {analytics.mostCommonMood}
                </Badge>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Card className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-0 shadow-lg rounded-3xl">
            <h3 className="text-lg mb-4 text-center">💡 Insights</h3>
            
            <div className="space-y-3">
              {analytics?.insights?.map((insight: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-3 bg-white/50 rounded-2xl text-sm"
                >
                  {insight}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Mood Trend (if available) */}
        {analytics?.moodTrend && analytics.moodTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <h3 className="text-lg mb-4 text-center">📈 Mood Trend</h3>
              
              <div className="space-y-2">
                {analytics.moodTrend.slice(-7).map((day: any, index: number) => {
                  const scoreColor = day.score > 0 ? 'bg-green-300' : day.score < 0 ? 'bg-red-300' : 'bg-gray-300';
                  const barWidth = Math.abs(day.score) * 30 + 10;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="text-xs w-16 text-gray-600">
                        {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 flex items-center">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}px` }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                          className={`h-4 ${scoreColor} rounded-full`}
                        />
                        <span className="ml-2 text-xs text-gray-600">
                          {day.count} {day.count === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}