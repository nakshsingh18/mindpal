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
      className={`min-h-screen bg-gradient-to-br ${getMoodColor()} p-6 relative overflow-hidden`}
    >
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {["🌸", "✨", "🌈", "💫", "🦋", "🌟"][Math.floor(Math.random() * 6)]}
          </motion.div>
        ))}
      </div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.h1 
            className="text-3xl mb-2 bg-gradient-to-r from-violet-600 to-teal-600 bg-clip-text text-transparent font-bold"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            MindPal
          </motion.h1>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge variant="secondary" className="bg-white/70 backdrop-blur-sm rounded-full shadow-lg border-0 px-4 py-2">
              Day {userProfile?.streak || 0} Streak 🔥
            </Badge>
          </motion.div>
        </motion.div>

        {/* Pet Companion Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8"
          whileHover={{ scale: 1.02 }}
        >
          <Card className="p-8 bg-white/70 backdrop-blur-md border-0 shadow-2xl rounded-3xl hover:shadow-3xl transition-all duration-300 hover:bg-white/80">
            <PetCompanion pet={pet} mood={mood} />
            
            <motion.p
              key={mood}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6 text-gray-700 font-medium"
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
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onOpenJournal}
              className="w-full h-16 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-lg font-semibold relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <span className="mr-3 text-2xl group-hover:animate-bounce">📝</span>
              <span className="relative z-10">Write in Journal</span>
            </Button>
          </motion.div>
          
          <div className="grid grid-cols-3 gap-3">
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onOpenQuests}
                variant="outline"
                className="h-14 bg-white/80 backdrop-blur-sm border-0 rounded-2xl hover:bg-white/95 transition-all duration-300 shadow-md hover:shadow-lg group"
              >
                <span className="mr-2 text-xl group-hover:animate-pulse">🎯</span>
                <span className="font-medium">Quests</span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onOpenAnalytics && onOpenAnalytics()}
                variant="outline"
                className="h-14 bg-white/80 backdrop-blur-sm border-0 rounded-2xl hover:bg-white/95 transition-all duration-300 shadow-md hover:shadow-lg group"
              >
                <span className="mr-2 text-xl group-hover:animate-spin">📊</span>
                <span className="font-medium">Stats</span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onOpenCustomization}
                variant="outline"
                className="h-14 bg-white/80 backdrop-blur-sm border-0 rounded-2xl hover:bg-white/95 transition-all duration-300 shadow-md hover:shadow-lg group"
              >
                <span className="mr-2 text-xl group-hover:animate-bounce">👗</span>
                <span className="font-medium">Style</span>
              </Button>
            </motion.div>
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