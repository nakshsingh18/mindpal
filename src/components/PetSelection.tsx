import { useState } from "react";
import { motion } from "framer-motion";
import { Pet } from "../types";
import { Button } from "./ui/button";

interface PetSelectionProps {
  onPetSelected: (pet: Pet) => void;
}

export function PetSelection({ onPetSelected }: PetSelectionProps) {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Define pets with all required properties including 'type' and 'description'
  const pets: Pet[] = [
    {
      name: "Buddy",
      emoji: "🐶",
      color: "bg-amber-100",
      type: "dog",
      description: "Your loyal companion for every journey"
    },
    {
      name: "Whiskers",
      emoji: "🐱",
      color: "bg-purple-100",
      type: "cat",
      description: "Independent and caring friend"
    },
    {
      name: "Waddles",
      emoji: "🐧",
      color: "bg-blue-100",
      type: "penguin",
      description: "Cool and calm in any situation"
    },
    {
      name: "Hoppy",
      emoji: "🐰",
      color: "bg-pink-100",
      type: "rabbit",
      description: "Energetic and full of life"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
          Choose Your Wellness Companion
        </h1>
        <p className="text-gray-600 text-lg">
          Select a pet that will support your emotional journey
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-8">
        {pets.map((pet, index) => (
          <motion.div
            key={pet.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => setSelectedPet(pet)}
              className={`w-full p-8 rounded-3xl shadow-lg transition-all duration-200 ${
                selectedPet?.name === pet.name
                  ? "ring-4 ring-purple-500 bg-white scale-105"
                  : "bg-white/80 hover:bg-white"
              }`}
            >
              <div className={`text-8xl mb-4 p-8 rounded-full ${pet.color} inline-block`}>
                {pet.emoji}
              </div>
              <h3 className="text-2xl font-medium mb-2 text-gray-800">
                {pet.name}
              </h3>
              <p className="text-gray-600">{pet.description}</p>
            </button>
          </motion.div>
        ))}
      </div>

      {selectedPet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={() => onPetSelected(selectedPet)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-12 py-6 text-lg font-medium shadow-xl"
          >
            Continue with {selectedPet.name} ✨
          </Button>
        </motion.div>
      )}
    </div>
  );
}