import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Calendar,
  Brain,
  Award,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import {
  analyzeMoods,
  JournalEntry,
  MoodAnalytics,
  MoodReward,
  getMoodEmoji,
  getMoodColor,
} from "../utils/moodAnalytics";
import { getApiStatus, testSentimentAnalysis, isApiConfigured } from "../utils/sentimentAnalysis";

interface AnalyticsScreenProps {
  journalEntries: JournalEntry[];
  onBack: () => void;
  onCoinsUpdate: (coins: number) => void;
  coins: number;
  petName: string;
  userData?: any;
  isTherapist?: boolean;
  connectedUsers?: any[];
}

const ConfidenceTooltip = ({ confidence }: { confidence: number }) => {
  return (
    <div className="relative flex flex-col items-center group">
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div
          className="h-1 bg-purple-500 rounded-full"
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <div className="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex">
        <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg rounded-md">
          AI Confidence: {Math.round(confidence * 100)}%
        </span>
        <div className="w-3 h-3 -mt-2 rotate-45 bg-black" />
      </div>
    </div>
  );
};

const MoodCard = ({ analytics, journalEntries, selectedTimeframe }: { 
  analytics: MoodAnalytics; 
  journalEntries: JournalEntry[]; 
  selectedTimeframe: string;
}) => {
  const getTimeframeText = () => {
    switch(selectedTimeframe) {
      case "week": return "this week";
      case "month": return "this month";
      default: return "overall";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl shadow-2xl"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 translate-y-10" />
      </div>

      <div className="relative p-8 text-white">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">Mood Insights</h3>
            <p className="text-purple-200 text-sm">Your emotional journey {getTimeframeText()}</p>
          </div>
          <div className="text-right">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl mb-2"
            >
              {getMoodEmoji(analytics.dominantMood)}
            </motion.div>
            <p className="text-purple-200 text-xs capitalize">{analytics.dominantMood}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="text-3xl font-bold mb-1 text-green-300">
              {analytics.positivePercentage}%
            </div>
            <div className="text-purple-200 text-sm">Positive</div>
            <div className="w-full h-1 bg-purple-500 rounded-full mt-2">
              <motion.div 
                className="h-1 bg-green-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analytics.positivePercentage}%` }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className="text-3xl font-bold mb-1 text-blue-300">
              {analytics.neutralPercentage}%
            </div>
            <div className="text-purple-200 text-sm">Neutral</div>
            <div className="w-full h-1 bg-purple-500 rounded-full mt-2">
              <motion.div 
                className="h-1 bg-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analytics.neutralPercentage}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <div className="text-3xl font-bold mb-1 text-orange-300">
              {analytics.negativePercentage}%
            </div>
            <div className="text-purple-200 text-sm">Challenging</div>
            <div className="w-full h-1 bg-purple-500 rounded-full mt-2">
              <motion.div 
                className="h-1 bg-orange-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analytics.negativePercentage}%` }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </div>
          </motion.div>
        </div>

        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-white font-bold text-lg">{analytics.totalEntries}</p>
            <p className="text-purple-200 text-xs">
              {analytics.totalEntries === 1 ? 'Entry' : 'Entries'}
            </p>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 opacity-20">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white rounded-full" />
            <div className="w-2 h-2 bg-white rounded-full" />
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const UserSelector = ({ connectedUsers, selectedUser, onUserSelect }: {
  connectedUsers: any[];
  selectedUser: string;
  onUserSelect: (userId: string) => void;
}) => {
  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-600" />
        Select User to Analyze
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {connectedUsers.map((user) => (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => onUserSelect(user.id)}
              variant={selectedUser === user.id ? "default" : "ghost"}
              className={`w-full p-4 rounded-xl transition-all duration-200 ${
                selectedUser === user.id
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                  : "hover:bg-purple-50 border-2 border-transparent hover:border-purple-200"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{user.avatar || "👤"}</div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs opacity-75">
                  {user.journal_entries?.length || 0} entries
                </div>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

export function AnalyticsScreen({
  journalEntries,
  onBack,
  onCoinsUpdate,
  coins,
  petName,
  userData,
  isTherapist = false,
  connectedUsers = []
}: AnalyticsScreenProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "all">("all");
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(isTherapist ? connectedUsers[0]?.id || "" : "");
  const [showInteractiveGraphs, setShowInteractiveGraphs] = useState(false);

  const getCurrentEntries = () => {
    if (isTherapist && selectedUser) {
      const user = connectedUsers.find(u => u.id === selectedUser);
      return user?.journal_entries || [];
    }
    return journalEntries;
  };

  const getFilteredEntries = () => {
    const entries = getCurrentEntries();
    const now = new Date();
    if (selectedTimeframe === "all") return entries;
    const days = selectedTimeframe === "week" ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return entries.filter((entry) => new Date(entry.date) >= cutoffDate);
  };

  const filteredEntries = getFilteredEntries();
  const analytics: MoodAnalytics = analyzeMoods(filteredEntries);

  const handleClaimReward = (reward: MoodReward) => {
    if (isTherapist) return; // Therapists can't claim rewards
    
    const rewardId = `${reward.type}-${reward.coinReward}`;
    if (!claimedRewards.includes(rewardId)) {
      setClaimedRewards((prev) => [...prev, rewardId]);
      onCoinsUpdate(coins + reward.coinReward);

      const celebration = document.createElement("div");
      celebration.innerHTML = `${reward.emoji} +${reward.coinReward} coins!`;
      celebration.className =
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-yellow-600 pointer-events-none z-50 animate-bounce";
      document.body.appendChild(celebration);
      setTimeout(() => celebration.remove(), 3000);
    }
  };

  if (!isTherapist && journalEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="p-8 bg-white/80 shadow-lg rounded-3xl text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl mb-4">No Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Start journaling to see your mood analytics and insights from {petName}!
            </p>
            <Button
              onClick={onBack}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-6"
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
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {isTherapist ? "Patient Analytics" : "Mood Analytics"}
          </h1>
          
          <div className="flex items-center space-x-2">
            {!isTherapist && (
              <div className="flex items-center space-x-2 bg-yellow-200 px-3 py-1 rounded-full shadow">
                <span>🪙</span>
                <span className="text-sm font-medium">{coins}</span>
              </div>
            )}
          </div>
        </div>

        {/* User Selector for Therapists */}
        {isTherapist && connectedUsers.length > 0 && (
          <UserSelector
            connectedUsers={connectedUsers}
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
          />
        )}

        {/* Timeframe Filter */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white/50 rounded-2xl p-1 shadow-inner backdrop-blur-sm">
            {[
              { key: "week", label: "Past Week" },
              { key: "month", label: "Past Month" },
              { key: "all", label: "All Time" },
            ].map((option) => (
              <Button
                key={option.key}
                variant={selectedTimeframe === option.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTimeframe(option.key as any)}
                className={`rounded-xl transition-all duration-200 ${
                  selectedTimeframe === option.key
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                    : "hover:bg-white/30"
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Mood Card */}
        <div className="mb-8">
          <MoodCard 
            analytics={analytics} 
            journalEntries={filteredEntries} 
            selectedTimeframe={selectedTimeframe}
          />
        </div>

        {/* Interactive Graphs Toggle */}
        <div className="mb-6 text-center">
          <Button
            onClick={() => setShowInteractiveGraphs(!showInteractiveGraphs)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showInteractiveGraphs ? "Hide" : "Show"} Interactive Graphs
          </Button>
        </div>

        {/* Interactive Pie Chart */}
        <AnimatePresence>
          {showInteractiveGraphs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="p-6 bg-white/80 rounded-3xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Mood Distribution Chart
                </h3>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {/* Pie Chart */}
                  <div className="relative w-64 h-64">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {Object.entries(analytics.moodCounts)
                        .filter(([, count]) => count > 0)
                        .sort(([,a], [,b]) => b - a)
                        .reduce((acc, [mood, count], index) => {
                          const percentage = (count / analytics.totalEntries) * 100;
                          const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                          const color = colors[index % colors.length];
                          const startAngle = acc.currentAngle;
                          const endAngle = startAngle + (percentage * 3.6);
                          const largeArcFlag = percentage > 50 ? 1 : 0;
                          
                          const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                          const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                          const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                          const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                          
                          const pathData = [
                            `M 50 50`,
                            `L ${x1} ${y1}`,
                            `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            'Z'
                          ].join(' ');
                          
                          acc.paths.push(
                            <motion.path
                              key={mood}
                              d={pathData}
                              fill={color}
                              stroke="white"
                              strokeWidth="0.5"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.2, duration: 0.6 }}
                              className="hover:opacity-80 cursor-pointer"
                            />
                          );
                          
                          acc.currentAngle = endAngle;
                          return acc;
                        }, { paths: [], currentAngle: 0 }).paths
                      }
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                        <div>
                          <div className="text-lg font-bold text-purple-600">{analytics.totalEntries}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="space-y-3">
                    {Object.entries(analytics.moodCounts)
                      .filter(([, count]) => count > 0)
                      .sort(([,a], [,b]) => b - a)
                      .map(([mood, count], index) => {
                        const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                        const color = colors[index % colors.length];
                        const percentage = Math.round((count / analytics.totalEntries) * 100);
                        
                        return (
                          <motion.div
                            key={mood}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-2xl">{getMoodEmoji(mood)}</span>
                            <div className="flex-1">
                              <div className="font-medium capitalize">{mood}</div>
                              <div className="text-sm text-gray-500">{count} entries ({percentage}%)</div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Breakdown */}
        <div className="mb-8">
          <Card className="p-6 bg-white/80 rounded-3xl backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-4">Detailed Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(analytics.moodCounts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([mood, count]) => (
                  <motion.div
                    key={mood}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getMoodEmoji(mood)}</span>
                      <span className="capitalize font-medium">{mood}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getMoodColor(mood)}>
                        {count} {count > 1 ? "entries" : "entry"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {Math.round((count / analytics.totalEntries) * 100)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </Card>
        </div>

        {/* Fine-Grained Emotions */}
        {analytics.topFineEmotions?.length > 0 && (
          <Card className="p-6 bg-white/80 rounded-3xl mb-8 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-4">Top Fine-Grained Emotions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {analytics.topFineEmotions.map((emotion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 hover:shadow-md transition-shadow duration-200"
                >
                  <span className="text-2xl mb-1">{getMoodEmoji(emotion.label)}</span>
                  <span className="capitalize font-medium text-sm">{emotion.label}</span>
                  <span className="text-xs text-gray-600">
                    {Math.round(emotion.score * 100)}%
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Rewards - Only for non-therapists */}
        {!isTherapist && analytics.rewards.length > 0 && (
          <div className="mb-8">
            <Card className="p-6 bg-yellow-50 rounded-3xl">
              <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span>Achievements & Rewards</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.rewards.map((reward, index) => {
                  const rewardId = `${reward.type}-${reward.coinReward}`;
                  const isClaimed = claimedRewards.includes(rewardId);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isClaimed
                          ? "bg-gray-100 border-gray-300"
                          : "bg-white border-yellow-300 shadow-lg hover:shadow-xl"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">{reward.emoji}</div>
                        <Button
                          size="sm"
                          disabled={isClaimed}
                          onClick={() => handleClaimReward(reward)}
                          className={`rounded-full transition-all duration-200 ${
                            isClaimed
                              ? "bg-gray-300 text-gray-500"
                              : "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-lg"
                          }`}
                        >
                          {isClaimed
                            ? "Claimed ✓"
                            : `Claim +${reward.coinReward} 🪙`}
                        </Button>
                      </div>
                      <h4 className="font-medium mb-2">{reward.title}</h4>
                      <p className="text-sm text-gray-600">
                        {reward.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Journal History */}
        <Card className="p-6 bg-white/80 rounded-3xl backdrop-blur-sm">
          <h3 className="text-lg font-medium mb-4">
            Journal History ({selectedTimeframe})
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-3 -mr-2 pr-2">
            {filteredEntries
              .slice()
              .reverse()
              .map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-4 p-3 rounded-xl bg-gray-50 border hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="text-2xl pt-1">
                    {getMoodEmoji(entry.mood)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm mb-2">
                      {entry.content.slice(0, 150)}
                      {entry.content.length > 150 && "..."}
                    </p>
                    {entry.aiAnalysis && (
                      <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-2 py-1 mb-2">
                        🤖 {entry.aiAnalysis}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        {entry.sarcastic && (
                          <Badge variant="destructive" className="text-xs">
                            Sarcastic
                          </Badge>
                        )}
                        <Badge
                          className={`${getMoodColor(entry.mood)} text-xs capitalize`}
                        >
                          {entry.mood}
                        </Badge>
                      </div>
                    </div>
                    {entry.confidence !== undefined && (
                      <div className="mt-2">
                        <ConfidenceTooltip confidence={entry.confidence} />
                      </div>
                    )}
                    {entry.fineEmotions && entry.fineEmotions.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        Fine emotions:{" "}
                        {entry.fineEmotions
                          .slice(0, 3)
                          .map(
                            (fe) =>
                              `${fe.label} (${Math.round(fe.score * 100)}%)`
                          )
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}