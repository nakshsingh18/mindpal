"use client";

import { useState } from "react";

interface WordscapeGameProps {
  petEmoji: string;
  onBack: () => void;
  onWin: (reward?: { happiness: number; coins: number }) => void;
  onCoinsUpdate: (coins: number) => void;
  coins: number;
  onCoinEarned: (amount: number) => void;
}

const LEVELS = [
  ["CAT", "ACT"],
  ["DOG", "GOD"],
  ["TREE", "TEAR", "RATE"],
  ["MOON", "ROOM", "NORM"],
  ["STAR", "RATS", "ARTS"],
  ["FIRE", "RIFE", "RIDE"],
  ["LOVE", "VOLE", "EVOL"],
  ["COIN", "ICON", "CON"],
  ["BOOK", "COOK", "LOOK"],
  ["LAMP", "PALM", "AMP"],
  ["GAME", "MEGA", "AGE"],
  ["CODE", "DECO", "DOC"],
  ["WORD", "DROW", "ROW"],
  ["NOTE", "TONE", "ONE"],
  ["MIND", "DIME", "DIN"],
  ["COLD", "DOC", "OLD"],
  ["WARM", "ARM", "RAW"],
  ["PLAY", "YAP", "PAL"],
  ["KING", "GIN", "INK"],
  ["QUEEN", "NEE", "EON"],
];

export default function WordscapeGame({
  petEmoji,
  onBack,
  onWin,
  onCoinsUpdate,
  coins,
  onCoinEarned,
}: WordscapeGameProps) {
  const [level, setLevel] = useState(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");

  const words = LEVELS[level];
  const letters = Array.from(new Set(words.join("")));

  const handleSubmit = () => {
    const guess = currentInput.toUpperCase();
    if (words.includes(guess) && !foundWords.includes(guess)) {
      setFoundWords([...foundWords, guess]);
      setCurrentInput("");

      const reward = 5;
      onCoinsUpdate(coins + reward);
      onCoinEarned(reward);

      if (foundWords.length + 1 === words.length) {
        if (level + 1 < LEVELS.length) {
          setLevel(level + 1);
          setFoundWords([]);
        } else {
          onWin({ happiness: 30, coins: 50 });
        }
      }
    } else {
      setCurrentInput("");
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-xl text-center space-y-6">
      <h2 className="text-xl font-bold">Wordscape – Level {level + 1}</h2>

      {/* Words with hints */}
      <div className="flex flex-col items-center space-y-2 mb-4">
        {words.map((word, i) => {
          const revealed = word[0];
          return (
            <div key={i} className="flex space-x-1">
              {word.split("").map((ch, idx) => (
                <span
                  key={idx}
                  className="w-8 h-8 flex items-center justify-center border-b-2 border-gray-400 text-lg font-semibold"
                >
                  {foundWords.includes(word) ? ch : idx === 0 ? revealed : ""}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Letters */}
      <div className="flex justify-center space-x-2 mb-4">
        {letters.map((l, i) => (
          <button
            key={i}
            onClick={() => setCurrentInput(currentInput + l)}
            className="px-4 py-2 bg-white rounded-full shadow hover:bg-gray-100"
          >
            {l}
          </button>
        ))}
      </div>

      {/* Current guess */}
      <div className="mb-4">
        <p className="text-lg font-mono">{currentInput || "..."}</p>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-500 text-black rounded-lg"
        >
          Submit
        </button>
        <button
          onClick={() => setCurrentInput("")}
          className="px-4 py-2 bg-gray-400 text-black rounded-lg"
        >
          Clear
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-red-500 text-black rounded-lg"
        >
          Quit
        </button>
      </div>
    </div>
  );
}
