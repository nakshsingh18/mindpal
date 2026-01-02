import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Pet {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

interface PlayScreenProps {
  pet: Pet;
  onBack: () => void;
  onCoinsUpdate: (coins: number) => void;
  coins: number;
}

const playActivities = [
  {
    id: 'fetch',
    name: 'Play Fetch',
    emoji: '🎾',
    description: 'Throw a ball and watch your pet chase it!',
    happiness: 15,
    coinReward: 10
  },
  {
    id: 'dance',
    name: 'Dance Party',
    emoji: '🕺',
    description: 'Dance together to upbeat music!',
    happiness: 20,
    coinReward: 15
  },
  {
    id: 'puzzle',
    name: 'Puzzle Game',
    emoji: '🧩',
    description: 'Solve puzzles together to exercise your minds!',
    happiness: 18,
    coinReward: 12
  },
  {
    id: 'adventure',
    name: 'Mini Adventure',
    emoji: '🗺️',
    description: 'Go on a virtual adventure together!',
    happiness: 25,
    coinReward: 20
  }
];

export function PlayScreen({ pet, onBack, onCoinsUpdate, coins }: PlayScreenProps) {
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [petAnimation, setPetAnimation] = useState('idle');
  const [showReward, setShowReward] = useState(false);
  const [lastReward, setLastReward] = useState({ happiness: 0, coins: 0 });

  const handlePlayActivity = (activity: typeof playActivities[0]) => {
    setCurrentActivity(activity.id);
    setIsPlaying(true);
    setPetAnimation('playing');

    // Simulate play activity
    setTimeout(() => {
      setIsPlaying(false);
      setPetAnimation('happy');
      setLastReward({ happiness: activity.happiness, coins: activity.coinReward });
      onCoinsUpdate(coins + activity.coinReward);
      setShowReward(true);
      
      setTimeout(() => {
        setShowReward(false);
        setCurrentActivity(null);
        setPetAnimation('idle');
      }, 3000);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100 p-6">
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
          <h1 className="text-2xl bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Play with {pet.name}
          </h1>
          <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-200 to-yellow-300 px-3 py-1 rounded-full">
            <span>🪙</span>
            <span className="text-sm font-medium">{coins}</span>
          </div>
        </motion.div>

        {/* Pet Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <Card className={`p-8 ${pet.color} border-0 shadow-lg rounded-3xl relative overflow-hidden`}>
            <div className="relative z-10">
              <motion.div
                className="text-8xl mb-4"
                animate={{
                  scale: petAnimation === 'playing' ? [1, 1.2, 1] : petAnimation === 'happy' ? [1, 1.1, 1] : 1,
                  rotate: petAnimation === 'playing' ? [0, 10, -10, 0] : 0,
                }}
                transition={{
                  duration: petAnimation === 'playing' ? 0.5 : 1,
                  repeat: petAnimation === 'playing' ? Infinity : petAnimation === 'happy' ? 3 : 0,
                }}
              >
                {pet.emoji}
              </motion.div>
              
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-4xl animate-bounce">
                    {playActivities.find(a => a.id === currentActivity)?.emoji}
                  </div>
                </motion.div>
              )}
              
              <h3 className="text-xl text-gray-800 mb-2">
                {isPlaying ? `Playing ${playActivities.find(a => a.id === currentActivity)?.name}!` : 
                 `${pet.name} is ready to play!`}
              </h3>
              <p className="text-gray-600">
                {isPlaying ? 'Having so much fun! 🎉' : 'Choose an activity to play together'}
              </p>
            </div>
            
            {/* Floating particles during play */}
            {isPlaying && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    {['✨', '💫', '⭐', '🌟', '💖'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Play Activities */}
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {playActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all cursor-pointer">
                  <Button
                    onClick={() => handlePlayActivity(activity)}
                    variant="ghost"
                    className="w-full h-full p-0 flex flex-col items-center text-left"
                  >
                    <div className="text-4xl mb-3">{activity.emoji}</div>
                    <h4 className="font-medium mb-2">{activity.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <span>💖</span>
                        <span>+{activity.happiness}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🪙</span>
                        <span>+{activity.coinReward}</span>
                      </div>
                    </div>
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Loading Screen */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-4xl mb-4"
              >
                🎮
              </motion.div>
              <h3 className="text-lg mb-2">Playing together...</h3>
              <p className="text-gray-600">Your bond is getting stronger! 💕</p>
            </Card>
          </motion.div>
        )}

        {/* Reward Modal */}
        {showReward && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl mb-4 text-gray-800">Great Job!</h3>
              <p className="text-gray-600 mb-6">
                {pet.name} had an amazing time playing with you!
              </p>
              <div className="flex justify-center space-x-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl mb-1">💖</div>
                  <div className="text-sm text-gray-600">Happiness</div>
                  <div className="font-medium">+{lastReward.happiness}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">🪙</div>
                  <div className="text-sm text-gray-600">Coins</div>
                  <div className="font-medium">+{lastReward.coins}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}