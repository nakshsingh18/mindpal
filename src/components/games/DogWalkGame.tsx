"use client";

import { useState, useEffect } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { Button } from "../ui/button";

interface DogWalkGameProps {
  onWin: (reward?: { happiness: number; coins: number }) => void;
}

export default function DogWalkGame({ onWin }: DogWalkGameProps) {
  const [steps, setSteps] = useState(0);
  const [isWalking, setIsWalking] = useState(false);

  // these names must match your .riv file
  const STATE_MACHINE = "statemachine";
  const INPUT_NAME = "Scale-X";

  const { rive, RiveComponent } = useRive({
    src: "/walking_cycle_dog.riv",   // file must be in /public
    stateMachines: STATE_MACHINE,
    autoplay: true,
  });

  const walkInput = useStateMachineInput(rive, STATE_MACHINE, INPUT_NAME);

  // count steps while walking and drive the input
  useEffect(() => {
    if (!isWalking) return;
    const timer = setInterval(() => {
      setSteps((s) => s + 1);
      if (walkInput) {
        const v = (walkInput.value as number) ?? 0;
        walkInput.value = v + 1;
      }
    }, 800);
    return () => clearInterval(timer);
  }, [isWalking, walkInput]);

  // reward after 20 steps
  useEffect(() => {
    if (steps >= 20) {
      setIsWalking(false);
      onWin({ happiness: 30, coins: 25 });
    }
  }, [steps, onWin]);

  const handleStart = () => setIsWalking(true);

  const handleSkip = () => {
    setIsWalking(false);
    onWin(); // no reward
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-40 h-40 border border-gray-200 flex items-center justify-center rounded-lg bg-white">
        <RiveComponent className="w-full h-full" />
      </div>

      <h2 className="text-xl font-semibold text-gray-700">
        {isWalking ? "🚶 Walking with your dog..." : "Tap Start to begin the walk!"}
      </h2>
      <p className="text-gray-500">{steps} steps taken</p>

      <div className="flex space-x-4">
        <Button onClick={handleStart} className="bg-green-500 hover:bg-green-600 text-white">
          Start Walk 🐾
        </Button>
        <Button onClick={handleSkip} variant="outline">
          Skip & Finish (No Reward)
        </Button>
      </div>
    </div>
  );
}
