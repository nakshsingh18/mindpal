import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface MindfulMomentActivityProps {
  onComplete: () => void;
  onBack: () => void;
  petType?: string;
}

export function MindfulMomentActivity({ onComplete, onBack, petType = 'dog' }: MindfulMomentActivityProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsCompleted(true);
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const getGifEmbed = (petType: string, activity: 'meditation' | 'exercise') => {
    const gifs = {
      meditation: {
        rabbit: '<div class="tenor-gif-embed" data-postid="14764092" data-share-method="host" data-aspect-ratio="1.24514" data-width="100%"><a href="https://tenor.com/view/cony-rabbit-good-morning-love-line-friends-lovely-gif-14764092">Cony Rabbit Good Morning GIF</a>from <a href="https://tenor.com/search/cony+rabbit-gifs">Cony Rabbit GIFs</a></div>',
        penguin: '<div class="tenor-gif-embed" data-postid="5354131378470056847" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/zen-zone-focus-breathe-breathe-in-gif-5354131378470056847">Zen Zone Sticker</a>from <a href="https://tenor.com/search/zen-stickers">Zen Stickers</a></div>',
        dog: '<div class="tenor-gif-embed" data-postid="17946091524579428150" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/xf2023-xfactor-xfactoritalia-reggie-music-gif-17946091524579428150">Xf2023 Xfactor Sticker</a>from <a href="https://tenor.com/search/xf2023-stickers">Xf2023 Stickers</a></div>',
        cat: '<div class="tenor-gif-embed" data-postid="6207397327246573973" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/mochi-mochimons-cat-kawaii-cute-cat-gif-6207397327246573973">Mochi Mochimons GIF</a>from <a href="https://tenor.com/search/mochi-gifs">Mochi GIFs</a></div>'
      },
      exercise: {
        penguin: '<div class="tenor-gif-embed" data-postid="16485249507307627415" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/cardio-workout-work-out-exercise-gym-gif-16485249507307627415">Cardio Workout GIF</a>from <a href="https://tenor.com/search/cardio-gifs">Cardio GIFs</a></div>',
        dog: '<div class="tenor-gif-embed" data-postid="23440227" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/puglie-pug-puglie-pug-dog-puppy-gif-23440227">Puglie Puglie Pug Sticker</a>from <a href="https://tenor.com/search/puglie-stickers">Puglie Stickers</a></div>',
        cat: '<div class="tenor-gif-embed" data-postid="17108435" data-share-method="host" data-aspect-ratio="1" data-width="100%"><a href="https://tenor.com/view/fit-cat-exercise-workout-cute-gif-17108435">Fit Cat GIF</a>from <a href="https://tenor.com/search/fit-gifs">Fit GIFs</a></div>',
        rabbit: '<div class="tenor-gif-embed" data-postid="15762491" data-share-method="host" data-aspect-ratio="1.10727" data-width="100%"><a href="https://tenor.com/view/%E4%BD%95%E3%81%97%E3%81%A6%E3%82%8B%E3%81%AE-%E3%81%8A%E3%81%97%E3%82%8A-%E3%83%8F%E3%83%AD%E3%83%BC-what-is-going-on-butt-gif-15762491">何してるの おしり Sticker</a>from <a href="https://tenor.com/search/%E4%BD%95%E3%81%97%E3%81%A6%E3%82%8B%E3%81%AE-stickers">何してるの Stickers</a></div>'
      }
    };
    return gifs[activity][petType as keyof typeof gifs[typeof activity]] || '';
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://tenor.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="ghost">← Back</Button>
          <h1 className="text-xl font-medium">Mindful Moment</h1>
          <div className="w-16" />
        </div>

        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
          {/* Pet-specific Meditation GIF */}
          <div className="mb-6 w-32 h-32 mx-auto">
            <div dangerouslySetInnerHTML={{ __html: getGifEmbed(petType, 'meditation') }} />
          </div>

          <div className="text-6xl font-mono mb-4 text-blue-600">
            {formatTime(timeLeft)}
          </div>

          <p className="text-gray-600 mb-6">
            Take deep breaths and focus on the present moment
          </p>

          {!isCompleted ? (
            <Button
              onClick={() => setIsActive(!isActive)}
              style={{ backgroundColor: isActive ? '#dc2626' : '#000000', color: '#ffffff' }}
              className={`w-full h-12 rounded-2xl font-medium ${
                isActive 
                  ? 'hover:!bg-red-700' 
                  : 'hover:!bg-gray-800'
              }`}
            >
              {isActive ? 'Pause' : 'Start Meditation'}
            </Button>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <div className="text-4xl">🧘♀️✨</div>
              <p className="text-green-600 font-medium">Great job! You completed 5 minutes of mindfulness.</p>
              <Button
                onClick={handleComplete}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="w-full h-12 hover:!bg-green-600 rounded-2xl"
              >
                Complete Quest
              </Button>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}