"use client";

import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Pet } from "../types";
import { PetAnimation } from "./PetAnimation";
import PetTrainerDuel from "./games/PetTrainerDuel";
import { StarGazingGame } from "./games/StarGazingGame";
import CandyCrushGame from "./games/CandyCrushGame";
import WordscapeGame from "./games/WordscapeGame";
import { BreathingBuddyGame } from "./games/BreathingBuddyGame";

interface PlayScreenProps {
  pet: Pet;
  onBack: () => void;
  onCoinsUpdate: (coins: number) => void;
  coins: number;
}

const playActivities = [
  {
    id: "duel",
    name: "Trainer Duel",
    emoji: "⚔️",
    description: "Race and dodge obstacles in a pet duel!",
    happiness: 30,
    coinReward: 25,
  },
  {
    id: "stargazing",
    name: "Star Gazing",
    emoji: "🔭",
    description: "Connect the stars and find constellations!",
    happiness: 22,
    coinReward: 18,
  },
  {
    id: "candycrush",
    name: "Candy Crush",
    emoji: "🍭",
    description: "Match candies and clear the board!",
    happiness: 28,
    coinReward: 20,
  },
  {
    id: "wordscape",
    name: "Wordscape",
    emoji: "🔤",
    description: "Find hidden words from scrambled letters!",
    happiness: 25,
    coinReward: 15,
  },
  {
    id: "breathing",
    name: "Breathing Buddy",
    emoji: "🌬️",
    description: "Follow calming breaths with your pet.",
    happiness: 35,
    coinReward: 20,
  },
];

export function PlayScreen({ pet, onBack, onCoinsUpdate, coins }: PlayScreenProps) {
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [lastReward, setLastReward] = useState({ happiness: 0, coins: 0 });

  const [floatingRewards, setFloatingRewards] = useState<{ id: number; amount: number }[]>([]);
  const rewardId = useRef(0);

  const handleCoinEarned = (amount: number) => {
    rewardId.current++;
    const id = rewardId.current;
    setFloatingRewards((prev) => [...prev, { id, amount }]);

    setTimeout(() => {
      setFloatingRewards((prev) => prev.filter((r) => r.id !== id));
    }, 1500);
  };

  useEffect(() => {
    if (showReward) {
      const timer = setTimeout(() => {
        setShowReward(false);
        setCurrentActivity(null);
        setIsPlaying(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showReward]);

  const handlePlayActivity = (activity: typeof playActivities[0]) => {
    setCurrentActivity(activity.id);
    setIsPlaying(true);
    setLastReward({ happiness: activity.happiness, coins: activity.coinReward });
  };

  const handleGameWin = (reward?: { happiness: number; coins: number }) => {
    if (!reward) {
      setCurrentActivity(null);
      setIsPlaying(false);
      return;
    }

    onCoinsUpdate(coins + reward.coins);
    setLastReward(reward);
    setShowReward(true);
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
          <div className="relative flex items-center space-x-2 bg-gradient-to-r from-yellow-200 to-yellow-300 px-3 py-1 rounded-full">
            <span>🪙</span>
            <span className="text-sm font-medium">{coins}</span>

            {floatingRewards.map((r) => (
              <motion.span
                key={r.id}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.5 }}
                className="absolute right-0 text-green-600 font-bold"
              >
                +{r.amount}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Pet Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <Card
            className={`p-8 ${pet.color} border-0 shadow-lg rounded-3xl relative overflow-hidden`}
          >
            <div className="relative z-10 flex flex-col items-center">
              <PetAnimation
                pet={pet}
                mood={isPlaying ? "happy" : "calm"}
                size={200}
              />

              {isPlaying && currentActivity && (
                <div className="mt-6">
                  {currentActivity === "duel" && (
                    <PetTrainerDuel
                      petEmoji={pet.emoji}
                      onBack={onBack}
                      onFinish={handleGameWin}
                    />
                  )}
                  {currentActivity === "stargazing" && (
                    <StarGazingGame onWin={() => handleGameWin()} />
                  )}
                  {currentActivity === "candycrush" && (
                    <CandyCrushGame onWin={handleGameWin} />
                  )}
                  {currentActivity === "wordscape" && (
                    <WordscapeGame
                      petEmoji={pet.emoji}
                      onBack={onBack}
                      onWin={handleGameWin}
                      onCoinsUpdate={onCoinsUpdate}
                      coins={coins}
                      onCoinEarned={handleCoinEarned}
                    />
                  )}
                  {currentActivity === "breathing" && (
                    <BreathingBuddyGame onWin={handleGameWin} />
                  )}
                </div>
              )}

              <h3 className="text-xl text-gray-800 mt-4 mb-2">
                {isPlaying
                  ? `Playing ${
                      playActivities.find((a) => a.id === currentActivity)?.name
                    }!`
                  : `${pet.name} is ready to play!`}
              </h3>
              <p className="text-gray-600">
                {isPlaying
                  ? "Having so much fun! 🎉"
                  : "Choose an activity to play together"}
              </p>
            </div>
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
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                className="group"
              >
                <Card className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  
                  <Button
                    onClick={() => handlePlayActivity(activity)}
                    variant="ghost"
                    className="w-full h-full p-0 flex flex-col items-center text-left relative z-10 hover:bg-transparent"
                  >
                    <motion.div 
                      className="text-4xl mb-3"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {activity.emoji}
                    </motion.div>
                    
                    <motion.h4 
                      className="font-medium mb-2 text-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      {activity.name}
                    </motion.h4>
                    
                    <p className="text-sm text-gray-600 mb-3 text-center">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs">
                      <motion.div 
                        className="flex items-center space-x-1"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span>💖</span>
                        <span>+{activity.happiness}</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center space-x-1"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span>🪙</span>
                        <span>+{activity.coinReward}</span>
                      </motion.div>
                    </div>
                  </Button>
                </Card>
              </motion.div>
            ))}
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
