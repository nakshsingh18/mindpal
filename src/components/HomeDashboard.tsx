import { motion } from 'motion/react';
import { PetCompanion } from './PetCompanion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface Pet {
  id: string;
  name: string;
  image: string;
  personality: string;
}

interface HomeDashboardProps {
  pet: Pet;
  mood: 'happy' | 'sad' | 'stressed' | 'calm';
  userProfile: any;
  onOpenJournal: () => void;
  onOpenQuests: () => void;
  onOpenCustomization: () => void;
  onOpenAnalytics?: () => void;
}

export function HomeDashboard({ 
  pet, 
  mood, 
  userProfile,
  onOpenJournal, 
  onOpenQuests, 
  onOpenCustomization,
  onOpenAnalytics
}: HomeDashboardProps) {
  const getMoodMessage = () => {
    switch (mood) {
      case 'happy':
        return "Your companion is dancing with joy! ✨";
      case 'sad':
        return "Your companion wants to comfort you 🤗";
      case 'stressed':
        return "Your companion is worried. Maybe try some breathing exercises? 🌸";
      case 'calm':
        return "Your companion is feeling peaceful and zen 🧘‍♀️";
      default:
        return "Your companion is ready for the day! 🌟";
    }
  };

  const getMoodColor = () => {
    switch (mood) {
      case 'happy': return 'from-yellow-200 to-orange-200';
      case 'sad': return 'from-blue-200 to-indigo-200';
      case 'stressed': return 'from-red-200 to-pink-200';
      case 'calm': return 'from-green-200 to-teal-200';
      default: return 'from-purple-200 to-pink-200';
    }
  };

  return (
    <motion.div 
      key={mood}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen bg-gradient-to-br ${getMoodColor()} p-6`}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl mb-2 bg-gradient-to-r from-violet-600 to-teal-600 bg-clip-text text-transparent">
            MindPal
          </h1>
          <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm rounded-full">
            Day {userProfile?.streak || 0} Streak 🔥
          </Badge>
        </motion.div>

        {/* Pet Companion Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8"
        >
          <Card className="p-8 bg-white/60 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
            <PetCompanion pet={pet} mood={mood} />
            
            <motion.p
              key={mood}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6 text-gray-700"
            >
              {getMoodMessage()}
            </motion.p>
          </Card>
        </motion.div>

        {/* Daily Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <Card className="p-4 bg-white/50 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Daily Wellness</span>
              <span className="text-sm text-gray-600">{userProfile?.totalEntries > 0 ? '1/3' : '0/3'} complete</span>
            </div>
            <Progress value={userProfile?.totalEntries > 0 ? 33 : 0} className="h-2 mb-2" />
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                Morning Check-in
              </Badge>
              <Badge variant="outline" className={userProfile?.totalEntries > 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}>
                {userProfile?.totalEntries > 0 ? '✅' : ''} Journaling
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                Evening Reflection
              </Badge>
            </div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Button
            onClick={onOpenJournal}
            className="w-full h-14 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span className="mr-2 text-lg">📝</span>
            Write in Journal
          </Button>
          
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={onOpenQuests}
              variant="outline"
              className="h-12 bg-white/70 backdrop-blur-sm border-0 rounded-2xl hover:bg-white/90 transition-all duration-300"
            >
              <span className="mr-2">🎯</span>
              Quests
            </Button>
            
            <Button
              onClick={() => onOpenAnalytics && onOpenAnalytics()}
              variant="outline"
              className="h-12 bg-white/70 backdrop-blur-sm border-0 rounded-2xl hover:bg-white/90 transition-all duration-300"
            >
              <span className="mr-2">📊</span>
              Stats
            </Button>
            
            <Button
              onClick={onOpenCustomization}
              variant="outline"
              className="h-12 bg-white/70 backdrop-blur-sm border-0 rounded-2xl hover:bg-white/90 transition-all duration-300"
            >
              <span className="mr-2">👗</span>
              Style
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          <Card className="p-3 bg-white/40 backdrop-blur-sm border-0 rounded-2xl text-center">
            <div className="text-lg">🏆</div>
            <div className="text-xs text-gray-600">Level {userProfile?.level || 1}</div>
          </Card>
          
          <Card className="p-3 bg-white/40 backdrop-blur-sm border-0 rounded-2xl text-center">
            <div className="text-lg">💎</div>
            <div className="text-xs text-gray-600">{userProfile?.gems || 0} gems</div>
          </Card>
          
          <Card className="p-3 bg-white/40 backdrop-blur-sm border-0 rounded-2xl text-center">
            <div className="text-lg">📚</div>
            <div className="text-xs text-gray-600">{userProfile?.totalEntries || 0} entries</div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}