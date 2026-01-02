"use client";

import { motion } from "motion/react";
import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { Pet } from "../types";

type Mood = "happy" | "sad" | "calm" | "angry";

// ---- Import Lottie animations ----
// Dog
import dogHappy from "../assets/animations/dog/happy.json";
import dogSad from "../assets/animations/dog/sad.json";
import dogCalm from "../assets/animations/dog/calm.json";
import dogAngry from "../assets/animations/dog/angry.json";
// Cat
import catHappy from "../assets/animations/cat/happy.json";
import catSad from "../assets/animations/cat/sad.json";
import catCalm from "../assets/animations/cat/calm.json";
import catAngry from "../assets/animations/cat/angry.json";
// Rabbit
import rabbitHappy from "../assets/animations/rabbit/happy.json";
import rabbitSad from "../assets/animations/rabbit/sad.json";
import rabbitCalm from "../assets/animations/rabbit/calm.json";
import rabbitAngry from "../assets/animations/rabbit/angry.json";
// Penguin
import penguinHappy from "../assets/animations/penguin/happy.json";
import penguinSad from "../assets/animations/penguin/sad.json";
import penguinCalm from "../assets/animations/penguin/calm.json";
import penguinAngry from "../assets/animations/penguin/angry.json";

interface PetCompanionProps {
  pet: Pet;
  mood?: Mood;
  lastJournaled?: Date;
}

// ---- Animation Map ----
const petAnimations: Record<Pet["type"], Record<Mood, any>> = {
  dog: { happy: dogHappy, sad: dogSad, calm: dogCalm, angry: dogAngry },
  cat: { happy: catHappy, sad: catSad, calm: catCalm, angry: catAngry },
  rabbit: { happy: rabbitHappy, sad: rabbitSad, calm: rabbitCalm, angry: rabbitAngry },
  penguin: { happy: penguinHappy, sad: penguinSad, calm: penguinCalm, angry: penguinAngry },
};

export function PetCompanion({ pet, mood = "calm" }: PetCompanionProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const animation = petAnimations[pet.type][mood] ?? petAnimations[pet.type]["calm"];

  const getMoodEmoji = () => {
    switch (mood) {
      case "happy": return "✨";
      case "sad": return "🌧️";
      case "calm": return "🌸";
      case "angry": return "🔥";
      default: return "🌸";
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Mood emoji */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-6 text-xl z-10"
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          {getMoodEmoji()}
        </motion.div>
      </motion.div>

      {/* Pet animation (no round background) */}
      <motion.div whileTap={{ scale: 0.95 }} className="relative w-64 h-64">
        <Lottie animationData={animation} loop style={{ width: "100%", height: "100%" }} />
        {isBlinking && <div className="absolute inset-0 bg-black/10 animate-pulse" />}
      </motion.div>

      {/* Pet name + description */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-center">
        <h2 className="text-xl font-medium bg-gradient-to-r from-violet-600 to-teal-600 bg-clip-text text-transparent">
          {pet.name} {pet.emoji}
        </h2>
        <p className="text-sm text-gray-500">{pet.description}</p>
      </motion.div>
    </div>
  );
}
