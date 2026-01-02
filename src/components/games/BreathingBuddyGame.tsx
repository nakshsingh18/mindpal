"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";

interface BreathingBuddyGameProps {
  onWin: (reward?: { happiness: number; coins: number }) => void;
}

export function BreathingBuddyGame({ onWin }: BreathingBuddyGameProps) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [cycle, setCycle] = useState(0);

  // breathing phases
  useEffect(() => {
    const durations = { inhale: 4000, hold: 4000, exhale: 4000 }; // ms
    const timer = setTimeout(() => {
      if (phase === "inhale") setPhase("hold");
      else if (phase === "hold") setPhase("exhale");
      else {
        setPhase("inhale");
        setCycle((c) => c + 1);
      }
    }, durations[phase]);

    return () => clearTimeout(timer);
  }, [phase]);

  // finish after 3 cycles with reward
  useEffect(() => {
    if (cycle >= 3) {
      onWin({ happiness: 35, coins: 20 });
    }
  }, [cycle, onWin]);

  // skip without reward
  const handleSkip = () => {
    onWin(); // no reward passed → PlayScreen just shows exit
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <motion.div
        className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-300 to-purple-400 shadow-lg"
        animate={{
          scale: phase === "inhale" ? 1.3 : phase === "exhale" ? 0.8 : 1.0,
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />
      <h2 className="text-xl font-semibold text-gray-700">
        {phase === "inhale" && "🌬️ Inhale deeply..."}
        {phase === "hold" && "⏸️ Hold your breath..."}
        {phase === "exhale" && "😌 Exhale slowly..."}
      </h2>
      <p className="text-gray-500">Cycle {cycle + 1} of 3</p>

      <Button onClick={handleSkip} variant="outline">
        Skip & Finish (No Reward)
      </Button>
    </div>
  );
}
