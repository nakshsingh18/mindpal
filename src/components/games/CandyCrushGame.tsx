import { useState, useEffect } from "react";

const width = 8;
const candyColors = ["🍬", "🍭", "🍫", "🍪", "🍩", "🍎"];

interface CandyCrushProps {
  onWin: (reward?: { happiness: number; coins: number }) => void;
}

export default function CandyCrushGame({ onWin }: CandyCrushProps) {
  const [board, setBoard] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Initialize board
  useEffect(() => {
    const randomBoard = Array.from({ length: width * width }, () =>
      candyColors[Math.floor(Math.random() * candyColors.length)]
    );
    setBoard(randomBoard);
  }, []);

  // Check for matches of 3 (row or column)
  const checkForRowOfThree = () => {
    for (let i = 0; i < width * width; i++) {
      const rowOfThree = [i, i + 1, i + 2];
      const decidedCandy = board[i];

      // prevent wrapping across row
      if (i % width > width - 3) continue;

      if (
        decidedCandy &&
        rowOfThree.every((index) => board[index] === decidedCandy)
      ) {
        rowOfThree.forEach((index) => (board[index] = ""));
        setScore((s) => s + 30);
        return true;
      }
    }
  };

  const checkForColumnOfThree = () => {
    for (let i = 0; i < width * (width - 2); i++) {
      const columnOfThree = [i, i + width, i + width * 2];
      const decidedCandy = board[i];

      if (
        decidedCandy &&
        columnOfThree.every((index) => board[index] === decidedCandy)
      ) {
        columnOfThree.forEach((index) => (board[index] = ""));
        setScore((s) => s + 30);
        return true;
      }
    }
  };

  // Gravity
  const moveIntoSquareBelow = () => {
    for (let i = 0; i <= width * (width - 2); i++) {
      if (board[i + width] === "") {
        board[i + width] = board[i];
        board[i] = "";
      }
    }
    const firstRow = Array.from({ length: width }, (_, i) => i);
    firstRow.forEach((i) => {
      if (board[i] === "") {
        board[i] = candyColors[Math.floor(Math.random() * candyColors.length)];
      }
    });
  };

  // Game loop
  useEffect(() => {
    const timer = setInterval(() => {
      checkForRowOfThree();
      checkForColumnOfThree();
      moveIntoSquareBelow();
      setBoard([...board]);
    }, 100);
    return () => clearInterval(timer);
  }, [board]);

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIdx(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIdx: number) => {
    if (draggedIdx === null) return;

    const validMoves = [
      draggedIdx - 1, // left
      draggedIdx + 1, // right
      draggedIdx - width, // up
      draggedIdx + width, // down
    ];

    if (!validMoves.includes(targetIdx)) {
      setDraggedIdx(null); // ❌ not adjacent, ignore
      return;
    }

    const newBoard = [...board];

    // Swap only adjacent
    const temp = newBoard[targetIdx];
    newBoard[targetIdx] = newBoard[draggedIdx];
    newBoard[draggedIdx] = temp;

    setBoard(newBoard);
    setDraggedIdx(null);

    // Example win condition: score ≥ 300
    if (score >= 300) {
      onWin({ happiness: 25, coins: 20 });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-xl font-bold mb-2">Candy Crush 🍭</h1>
      <div className="grid grid-cols-8 gap-1">
        {board.map((candy, index) => (
          <div
            key={index}
            className="w-12 h-12 flex items-center justify-center bg-pink-100 border rounded text-2xl select-none focus:outline-none"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
          >
            {candy}
          </div>
        ))}
      </div>
      <p className="mt-4 font-medium">Score: {score}</p>
    </div>
  );
}
