import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface StayHydratedActivityProps {
  onComplete: () => void;
  onBack: () => void;
  petName: string;
}

export function StayHydratedActivity({ onComplete, onBack, petName }: StayHydratedActivityProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = () => {
    setIsCompleted(true);
    setTimeout(() => {
      onComplete();
    }, 3000); // Show trust message for 3 seconds
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-teal-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="ghost">← Back</Button>
          <h1 className="text-xl font-medium">Stay Hydrated</h1>
          <div className="w-16" />
        </div>

        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
          <div className="text-6xl mb-4">💧</div>
          
          {!isCompleted ? (
            <>
              <h2 className="text-xl font-medium mb-4">Drink 8 Glasses of Water</h2>
              <p className="text-gray-600 mb-6">
                Have you had your 8 glasses of water today? We trust you to be honest!
              </p>
              <Button
                onClick={handleComplete}
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
                className="w-full h-12 hover:!bg-gray-800 rounded-2xl font-medium"
              >
                I've Had My Water! 💧
              </Button>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <div className="text-4xl">💧✨</div>
              <div className="bg-blue-50 p-4 rounded-2xl">
                <p className="text-blue-800 font-medium">
                  "{petName} trusts you on this one - you better not break the trust!"
                </p>
              </div>
              <p className="text-green-600 font-medium">Great job staying hydrated!</p>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}