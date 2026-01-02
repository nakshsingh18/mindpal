// src/components/TherapistScreen.tsx
import React from 'react';
import { TherapistList } from './TherapistList';
import { Button } from './ui/button';

interface Props {
  onBack: () => void;
  userData?: any;
  journalEntries?: any[];
  coins?: number;
  onCoinsUpdate?: (coins: number) => void;
}

export const TherapistScreen: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold">Connect with a Therapist</h1>
          <Button onClick={onBack} variant="outline">
            ← Back to Home
          </Button>
        </div>
        <div className="max-w-6xl mx-auto">
          <TherapistList />
        </div>
      </div>
    </div>
  );
};