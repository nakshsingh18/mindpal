import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';

interface GratitudePracticeActivityProps {
  onComplete: () => void;
  onBack: () => void;
}

export function GratitudePracticeActivity({ onComplete, onBack }: GratitudePracticeActivityProps) {
  const [entries, setEntries] = useState(['', '', '']);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleEntryChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = value;
    setEntries(newEntries);
  };

  const canComplete = entries.filter(entry => entry.trim().length > 0).length >= 3;

  const handleComplete = () => {
    if (canComplete) {
      setIsCompleted(true);
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="ghost">← Back</Button>
          <h1 className="text-xl font-medium">Gratitude Practice</h1>
          <div className="w-16" />
        </div>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🙏</div>
            <h2 className="text-lg font-medium mb-2">What are you grateful for today?</h2>
            <p className="text-sm text-gray-600">Write at least 3 things you're thankful for</p>
          </div>

          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {index + 1}. I'm grateful for...
                </label>
                <Textarea
                  value={entry}
                  onChange={(e) => handleEntryChange(index, e.target.value)}
                  placeholder="Something you appreciate in your life"
                  className="min-h-[80px] border-0 bg-white/70 rounded-2xl resize-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Completed: {entries.filter(e => e.trim().length > 0).length}/3
            </p>
            
            {!isCompleted ? (
              <Button
                onClick={handleComplete}
                disabled={!canComplete}
                style={{ backgroundColor: canComplete ? '#000000' : '#d1d5db', color: canComplete ? '#ffffff' : '#6b7280' }}
                className={`w-full h-12 rounded-2xl font-medium ${
                  canComplete 
                    ? 'hover:!bg-gray-800' 
                    : 'cursor-not-allowed'
                }`}
              >
                Complete Gratitude Practice
              </Button>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-4"
              >
                <div className="text-4xl">🙏✨</div>
                <p className="text-green-600 font-medium">Beautiful! Gratitude fills the heart with joy.</p>
              </motion.div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}