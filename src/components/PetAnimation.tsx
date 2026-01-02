"use client";

import Lottie from "lottie-react";
import { Pet } from "../types"; // Your shared Pet type

// ---- Import Lottie animations ----
// Dog
import dogHappy from "../assets/animations/dog/happy.json";
import dogSad from "../assets/animations/dog/sad.json";
import dogCalm from "../assets/animations/dog/calm.json";
import dogAngry from "../assets/animations/dog/angry.json";
import dogHungry from "../assets/animations/dog/hungry.json";
import dogDancing from "../assets/animations/dog/dancing.json";
// Cat
import catHappy from "../assets/animations/cat/happy.json";
import catSad from "../assets/animations/cat/sad.json";
import catCalm from "../assets/animations/cat/calm.json";
import catAngry from "../assets/animations/cat/angry.json";
import catHungry from "../assets/animations/cat/hungry.json";
import catDancing from "../assets/animations/cat/dancing.json";
// Rabbit
import rabbitHappy from "../assets/animations/rabbit/happy.json";
import rabbitSad from "../assets/animations/rabbit/sad.json";
import rabbitCalm from "../assets/animations/rabbit/calm.json";
import rabbitAngry from "../assets/animations/rabbit/angry.json";
import rabbitHungry from "../assets/animations/rabbit/hungry.json";
import rabbitDancing from "../assets/animations/rabbit/dancing.json";
// Penguin
import penguinHappy from "../assets/animations/penguin/happy.json";
import penguinSad from "../assets/animations/penguin/sad.json";
import penguinCalm from "../assets/animations/penguin/calm.json";
import penguinAngry from "../assets/animations/penguin/angry.json";
import penguinHungry from "../assets/animations/penguin/hungry.json";
import penguinDancing from "../assets/animations/penguin/dancing.json";

export type Mood = "happy" | "sad" | "calm" | "angry" | "hungry" | "dancing";

interface PetAnimationProps {
  pet: Pet;
  mood?: Mood;
  size?: number; // in pixels
}

// ---- Animation Map ----
const petAnimations: Record<Pet["type"], Record<Mood, any>> = {
  dog: {
    happy: dogHappy,
    sad: dogSad,
    calm: dogCalm,
    angry: dogAngry,
    hungry: dogHungry,
    dancing: dogDancing,
  },
  cat: {
    happy: catHappy,
    sad: catSad,
    calm: catCalm,
    angry: catAngry,
    hungry: catHungry,
    dancing: catDancing,
  },
  rabbit: {
    happy: rabbitHappy,
    sad: rabbitSad,
    calm: rabbitCalm,
    angry: rabbitAngry,
    hungry: rabbitHungry,
    dancing: rabbitDancing,
  },
  penguin: {
    happy: penguinHappy,
    sad: penguinSad,
    calm: penguinCalm,
    angry: penguinAngry,
    hungry: penguinHungry,
    dancing: penguinDancing,
  },
};

export function PetAnimation({ pet, mood = "calm", size = 180 }: PetAnimationProps) {
  const animationData = petAnimations[pet.type][mood] ?? petAnimations[pet.type]["calm"];

  return (
    <div className="flex items-center justify-center">
      <Lottie animationData={animationData} loop style={{ width: size, height: size }} />
    </div>
  );
}
