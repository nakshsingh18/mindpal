import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GuestModeReminderProps {
  onSignUpClick: () => void;
}

export function GuestModeReminder({ onSignUpClick }: GuestModeReminderProps) {
  return (
    <Card className="mb-6 bg-yellow-50 border-yellow-300 p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-3">👋</span>
          <div>
            <h3 className="font-bold text-yellow-900">You're in Guest Mode!</h3>
            <p className="text-sm text-yellow-800">
              Create an account to save your pet and journal progress permanently.
            </p>
          </div>
        </div>
        <Button
          onClick={onSignUpClick}
          className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold"
        >
          Sign Up
        </Button>
      </div>
    </Card>
  );
}

