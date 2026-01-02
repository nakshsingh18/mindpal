import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import './StarGazingGame.css';

const GAME_AREA_WIDTH = 500;
const GAME_AREA_HEIGHT = 300;

interface Position {
    x: number;
    y: number;
}

// Define the constellation by its star positions and connections
// The connections are indices in the stars array.
const CONSTELLATION = {
    name: "The Dipper",
    stars: [
        { x: 100, y: 50 },
        { x: 200, y: 80 },
        { x: 300, y: 50 },
        { x: 400, y: 80 },
        { x: 450, y: 180 },
        { x: 350, y: 220 },
        { x: 250, y: 190 },
    ],
    connections: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]
    ]
};

interface StarGazingGameProps {
    onWin: () => void;
}

export const StarGazingGame: React.FC<StarGazingGameProps> = ({ onWin }) => {
    const [lines, setLines] = useState<Position[][]>([]);
    const [currentLine, setCurrentLine] = useState<Position[]>([]);
    const [solvedConnections, setSolvedConnections] = useState<string[]>([]);
    const [message, setMessage] = useState("Connect the stars to form the constellation.");

    const gameAreaRef = useRef<HTMLDivElement>(null);

    const checkConnection = (start: Position, end: Position) => {
        const startStarIndex = CONSTELLATION.stars.findIndex(star => Math.abs(star.x - start.x) < 10 && Math.abs(star.y - start.y) < 10);
        const endStarIndex = CONSTELLATION.stars.findIndex(star => Math.abs(star.x - end.x) < 10 && Math.abs(star.y - end.y) < 10);

        if (startStarIndex !== -1 && endStarIndex !== -1) {
            const connectionKey = [startStarIndex, endStarIndex].sort().join('-');
            if (CONSTELLATION.connections.some(conn => conn.sort().join('-') === connectionKey)) {
                if (!solvedConnections.includes(connectionKey)) {
                    setSolvedConnections(prev => [...prev, connectionKey]);
                    setMessage("Good job! Keep going...");
                    return true;
                }
            }
        }
        return false;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = gameAreaRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setCurrentLine([{ x, y }]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (currentLine.length === 0) return;
        const rect = gameAreaRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setCurrentLine(prev => [...prev, { x, y }]);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (currentLine.length > 0) {
            const start = currentLine[0];
            const end = currentLine[currentLine.length - 1];

            if (checkConnection(start, end)) {
                setLines(prev => [...prev, [start, end]]);
            }

            setCurrentLine([]);
        }
    };

    useEffect(() => {
        if (solvedConnections.length === CONSTELLATION.connections.length) {
            setMessage(`Congratulations! You've formed ${CONSTELLATION.name}!`);
            setTimeout(() => {
                onWin();
            }, 2000);
        }
    }, [solvedConnections, onWin]);

    return (
        <div className="stargazing-container">
            <h1 className="title">Star Gazing 🔭✨</h1>
            <p className="description">{message}</p>
            <div
                ref={gameAreaRef}
                className="game-area"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Draw solved lines */}
                {solvedConnections.map((key, index) => {
                    const [startIdx, endIdx] = key.split('-').map(Number);
                    const startPos = CONSTELLATION.stars[startIdx];
                    const endPos = CONSTELLATION.stars[endIdx];

                    return (
                        <svg key={index} className="line-svg">
                            <line
                                x1={startPos.x}
                                y1={startPos.y}
                                x2={endPos.x}
                                y2={endPos.y}
                                className="solved-line"
                            />
                        </svg>
                    );
                })}

                {/* Draw current line being traced */}
                {currentLine.length > 1 && (
                    <svg className="line-svg">
                        {currentLine.slice(0, -1).map((point, index) => (
                            <line
                                key={index}
                                x1={point.x}
                                y1={point.y}
                                x2={currentLine[index + 1].x}
                                y2={currentLine[index + 1].y}
                                className="current-line"
                            />
                        ))}
                    </svg>
                )}

                {/* Stars */}
                {CONSTELLATION.stars.map((star, index) => (
                    <div
                        key={index}
                        className="star"
                        style={{ left: star.x, top: star.y }}
                    />
                ))}
            </div>
        </div>
    );
};