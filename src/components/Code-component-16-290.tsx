import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface Pet {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

interface FeedScreenProps {
  pet: Pet;
  onBack: () => void;
  onCoinsUpdate: (coins: number) => void;
  coins: number;
}

const foodItems = [
  {
    id: 'apple',
    name: 'Fresh Apple',
    emoji: '🍎',
    description: 'Crispy and nutritious!',
    cost: 5,
    happiness: 10,
    health: 15
  },
  {
    id: 'fish',
    name: 'Premium Fish',
    emoji: '🐟',
    description: 'Rich in omega-3!',
    cost: 15,
    happiness: 20,
    health: 25
  },
  {
    id: 'cake',
    name: 'Birthday Cake',
    emoji: '🎂',
    description: 'Special treat for celebrations!',
    cost: 25,
    happiness: 35,
    health: 10
  },
  {
    id: 'smoothie',
    name: 'Vitamin Smoothie',
    emoji: '🥤',
    description: 'Packed with nutrients!',
    cost: 12,
    happiness: 15,
    health: 30
  },
  {
    id: 'cookie',
    name: 'Heart Cookie',
    emoji: '🍪',
    description: 'Made with love!',
    cost: 8,
    happiness: 18,
    health: 8
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    emoji: '🥗',
    description: 'Fresh and healthy!',
    cost: 10,
    happiness: 12,
    health: 35
  }
];

export function FeedScreen({ pet, onBack, onCoinsUpdate, coins }: FeedScreenProps) {
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedingFood, setFeedingFood] = useState<string | null>(null);
  const [petSatisfaction, setPetSatisfaction] = useState(75); // Out of 100
  const [showReward, setShowReward] = useState(false);
  const [lastReward, setLastReward] = useState({ happiness: 0, health: 0 });

  const handleFeedPet = (food: typeof foodItems[0]) => {
    if (coins < food.cost) {
      alert('Not enough coins! 🪙');
      return;
    }

    setIsFeeding(true);
    setFeedingFood(food.id);
    onCoinsUpdate(coins - food.cost);

    // Simulate feeding
    setTimeout(() => {
      setIsFeeding(false);
      setPetSatisfaction(Math.min(100, petSatisfaction + food.happiness));
      setLastReward({ happiness: food.happiness, health: food.health });
      setShowReward(true);
      
      setTimeout(() => {
        setShowReward(false);
        setFeedingFood(null);
      }, 3000);
    }, 3000);
  };

  const getSatisfactionColor = () => {
    if (petSatisfaction >= 80) return 'text-green-600 bg-green-100';
    if (petSatisfaction >= 60) return 'text-yellow-600 bg-yellow-100';
    if (petSatisfaction >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSatisfactionEmoji = () => {
    if (petSatisfaction >= 80) return '😋';
    if (petSatisfaction >= 60) return '😊';
    if (petSatisfaction >= 40) return '😐';
    return '🥺';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 p-6">
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
          <h1 className="text-2xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Feed {pet.name}
          </h1>
          <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-200 to-yellow-300 px-3 py-1 rounded-full">
            <span>🪙</span>
            <span className="text-sm font-medium">{coins}</span>
          </div>
        </motion.div>

        {/* Pet Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className={`p-6 ${pet.color} border-0 shadow-lg rounded-3xl relative overflow-hidden`}>
            <div className="text-center relative z-10">
              <motion.div
                className="text-8xl mb-4"
                animate={{
                  scale: isFeeding ? [1, 1.1, 1] : 1,
                  rotate: isFeeding ? [0, 5, -5, 0] : 0,
                }}
                transition={{
                  duration: 0.8,
                  repeat: isFeeding ? Infinity : 0,
                }}
              >
                {isFeeding ? '😋' : getSatisfactionEmoji()}
              </motion.div>
              
              {isFeeding && feedingFood && (
                <motion.div
                  initial={{ scale: 0, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="text-4xl animate-bounce">
                    {foodItems.find(f => f.id === feedingFood)?.emoji}
                  </div>
                </motion.div>
              )}
              
              <h3 className="text-xl text-gray-800 mb-4">
                {isFeeding ? `${pet.name} is enjoying the meal!` : `${pet.name}'s Hunger Status`}
              </h3>
              
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Badge className={`px-3 py-1 ${getSatisfactionColor()}`}>
                  Satisfaction: {petSatisfaction}%
                </Badge>
              </div>
              
              {/* Satisfaction Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full"
                  style={{ width: `${petSatisfaction}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${petSatisfaction}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              
              <p className="text-gray-600">
                {isFeeding ? 'Nom nom nom! 🍽️' : 
                 petSatisfaction >= 80 ? 'I\'m so full and happy!' :
                 petSatisfaction >= 60 ? 'I could eat a little more!' :
                 petSatisfaction >= 40 ? 'I\'m getting hungry...' :
                 'I\'m really hungry! 🥺'}
              </p>
            </div>
            
            {/* Eating particles */}
            {isFeeding && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: Math.random() * 1.5,
                    }}
                  >
                    {['✨', '💫', '🌟', '💖', '🍽️'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Food Menu */}
        {!isFeeding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-medium mb-4 text-center text-gray-800">
              🍽️ Food Menu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foodItems.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all">
                    <Button
                      onClick={() => handleFeedPet(food)}
                      variant="ghost"
                      disabled={coins < food.cost}
                      className="w-full h-full p-0 flex flex-col items-center text-left disabled:opacity-50"
                    >
                      <div className="text-4xl mb-3">{food.emoji}</div>
                      <h4 className="font-medium mb-2">{food.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 text-center">{food.description}</p>
                      <div className="flex items-center justify-between w-full text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <span>💖</span>
                            <span>+{food.happiness}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>🏥</span>
                            <span>+{food.health}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 font-medium">
                          <span>🪙</span>
                          <span>{food.cost}</span>
                        </div>
                      </div>
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Feeding Animation */}
        {isFeeding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-4xl mb-4"
              >
                🍽️
              </motion.div>
              <h3 className="text-lg mb-2">Feeding {pet.name}...</h3>
              <p className="text-gray-600">Watch those happy munching sounds! 😋</p>
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
              <div className="text-6xl mb-4">😋</div>
              <h3 className="text-2xl mb-4 text-gray-800">Delicious!</h3>
              <p className="text-gray-600 mb-6">
                {pet.name} loved that meal and feels much better!
              </p>
              <div className="flex justify-center space-x-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl mb-1">💖</div>
                  <div className="text-sm text-gray-600">Happiness</div>
                  <div className="font-medium">+{lastReward.happiness}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-1">🏥</div>
                  <div className="text-sm text-gray-600">Health</div>
                  <div className="font-medium">+{lastReward.health}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}