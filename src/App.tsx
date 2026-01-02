import { useState, useEffect } from "react";
import { PetSelection } from "./components/PetSelection";
import { PetCompanion } from "./components/PetCompanion";
import { JournalScreen } from "./components/JournalScreen";
import { QuestsAndCoins } from "./components/QuestsAndCoins";
import { CustomizationScreen } from "./components/CustomizationScreen";
import { PlayScreen } from "./components/PlayScreen";
import { FeedScreen } from "./components/FeedScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { analyzeMoods } from "./utils/moodAnalytics";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { motion } from "framer-motion";
import MindPalLeaderboard from "./components/mindpal_leaderboard";
import { Pet, User } from './types';
import { supabase } from "./utils/supabase/client";
import { GuestModeReminder } from "./components/GuestModeReminder";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TherapistDashboard } from './components/TherapistDashboard';
import { TherapistScreen } from './components/TherapistScreen';
import { HomeDashboard } from './components/HomeDashboard';
import { UnifiedAuthScreen } from './components/UnifiedAuthScreen';
import './styles/globals.css';



interface JournalEntry {
  mood:
    | "happy"
    | "sad"
    | "calm"
    | "anxious"
    | "excited"
    | "angry"
    | "irritated"
    | "frustrated"
    | "content"
    | "energetic";
  content: string;
  date: Date;
  confidence?: number;
  aiAnalysis?: string;
}

type Screen =
  | "pet-selection"
  | "home"
  | "journal"
  | "quests"
  | "customization"
  | "play"
  | "feed"
  | "subscription"
  | "analytics"
  | "leaderboard"
  | "therapy"
  | "therapist-login";
type PetMood = "happy" | "sad" | "calm" | "angry";

// Extending the User type locally to include additional fields
type AppUser = User & { 
  is_anonymous?: boolean;
  selected_pet?: Pet | null;
  coins?: number;
  journal_entries?: JournalEntry[];
  pet_mood?: PetMood;
  is_Premium?: boolean;
};

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT USER DASHBOARD */}
        <Route path="/" element={<AppDashboard />} />

        {/* THERAPIST PAGES */}
        <Route path="/therapist/dashboard" element={<TherapistDashboard onBack={() => {}} />} />
        <Route path="/therapists" element={<TherapistScreen onBack={() => window.history.back()} />} />

      </Routes>
    </BrowserRouter>
  );
}

function AppDashboard() {

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication logic
  useEffect(() => {
    // Initialize auth state and fetch user data from users + journal_entries tables.
    const handleSession = async (session: any) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Log auth session info for debugging
        console.log('Auth session user ID:', session.user.id);
        console.log('Auth user email:', session.user.email);

        // Fetch user from the users table
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user from users table:', {
            code: userError.code,
            message: userError.message,
          });
          // Log if it's a permission issue (likely RLS)
          if (userError.message?.includes('403') || userError.message?.includes('permission')) {
            console.warn('⚠️ RLS Permission Denied: auth.uid() may not equal users.id');
          }
        } else {
          console.log('User row fetched successfully:', userRow);
          console.log('All user row columns:', Object.keys(userRow || {}));
        }

        // If user doesn't exist in users table, create a row with defaults
        let finalUser = userRow;
        if (!finalUser) {
          const newUser = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || 'Guest',
            pet_id: null,
            coins: 100,
            streak_count: 0,
            created_at: new Date(),
          };

          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user row:', insertError);
            finalUser = newUser; // Use defaults in memory if insert fails
          } else {
            finalUser = inserted;
          }
        }

        // Determine if user is a therapist by checking therapists table or auth metadata
        let userRole = 'user';
        
        // 1) Check session.user.user_metadata.role (set at signup)
        const metaRole = (session?.user?.user_metadata as any)?.role;
        if (metaRole === 'therapist') {
          console.log('User metadata indicates therapist role');
          userRole = 'therapist';
          
          // Ensure a therapist profile exists; if not, attempt to create a minimal profile
          try {
            const { data: existing, error: existErr } = await supabase
              .from('therapists')
              .select('id')
              .eq('id', session.user.id)
              .single();
            if (!existing) {
              console.log('No therapist profile found; creating minimal profile');
              const nameFromMeta = (session?.user?.user_metadata as any)?.full_name || session.user.email || 'Therapist';
              const { error: insertErr } = await supabase.from('therapists').insert({
                id: session.user.id,
                name: nameFromMeta,
                specialization: null,
                experience: null,
                description: null,
                avatar: null,
                languages: [],
                response_time: null,
                price: null,
                rating: 5,
              });
              if (insertErr) {
                console.warn('Could not auto-create therapist profile (RLS or other):', insertErr.message);
              } else {
                console.log('Minimal therapist profile created');
                
                // Also create profiles entry
                try {
                  await supabase.from('profiles').insert({
                    id: session.user.id,
                    username: nameFromMeta,
                    name: nameFromMeta,
                    user_type: 'therapist',
                    is_online: false,
                    is_premium: false,
                    rating: 5,
                  });
                } catch (profileErr) {
                  console.warn('Could not create profiles table entry:', profileErr);
                }
              }
            }
          } catch (err) {
            console.warn('Error while ensuring therapist profile exists:', err);
          }
        } else {
          // 2) Check therapists table as a fallback
          try {
            const { data: therapistProfile, error: therapistError } = await supabase
              .from('therapists')
              .select('id')
              .eq('id', session.user.id)
              .single();
            if (therapistError) {
              console.warn('therapists select returned error:', {
                code: (therapistError as any).code,
                message: therapistError.message,
              });
            }
            if (therapistProfile) {
              console.log('Found therapist profile, determined user is a therapist');
              userRole = 'therapist';
            }
          } catch (e) {
            console.warn('Error checking therapists table for role (exception):', e);
          }
        }
        
        // Set the role in finalUser for later use
        finalUser = { ...finalUser, user_type: userRole };

        // Fetch journal entries for this user
        const { data: journalRows, error: journalError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (journalError) {
          console.error('Error fetching journal entries:', journalError);
        }

        // Convert journal_entries DB rows to JournalEntry format expected by the app
        const journalEntries: JournalEntry[] = (journalRows || []).map((row: any) => ({
          mood: row.mood || 'calm',
          content: row.entry_text || '',
          date: new Date(row.created_at),
          confidence: row.sentiment_score,
        }));

        const userData: AppUser = {
          id: session.user.id,
          email: session.user.email,
          is_anonymous: session.user.is_anonymous,
          name: session.user.user_metadata?.full_name || 'Guest',
          username: finalUser?.username || session.user.user_metadata?.username || 'Guest',
          user_type: finalUser?.user_type || 'user',
          is_Premium: finalUser?.is_premium || false,
          selected_pet: finalUser?.selected_pet,
          coins: finalUser?.coins || 100,
          journal_entries: journalEntries,
          pet_mood: finalUser?.pet_mood || 'calm',
        };

        console.log('Setting user with type:', userData.user_type, 'Full userData:', userData);
        setUser(userData);
        // Pre-load journal entries into local state
        setJournalEntries(journalEntries);
      } catch (err) {
        console.error('Error handling session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    (async () => {
      try {
        // If there's already a session stored (user previously signed in), fetch and handle it
        const { data: sessionData } = await supabase.auth.getSession();
        const existingSession = (sessionData as any)?.session;
        if (existingSession) await handleSession(existingSession);
      } catch (e) {
        console.debug('Error fetching session:', e);
      }

      // Subscribe to auth state changes
      const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await handleSession(session);
      });

      return () => {
        try {
          subscription.subscription.unsubscribe();
        } catch (e) {
          // ignore
        }
      };
    })();
  }, []);
  
  const [openGroup, setOpenGroup] =
  useState<null | "tracking" | "pet" | "explore">(null);
  
  const toggleGroup = (g: "tracking" | "pet" | "explore") =>
  setOpenGroup(prev => (prev === g ? null : g));

  const [currentScreen, setCurrentScreen] =
    useState<Screen>("home");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(
    user?.selected_pet || null
  );
  const [coins, setCoins] = useState(user?.coins || 100);
  const [journalEntries, setJournalEntries] = useState<
    JournalEntry[]
  >(user?.journal_entries || []);
  const [petMood, setPetMood] = useState<PetMood>(user?.pet_mood as PetMood || "calm");
  const [lastJournaled, setLastJournaled] =
    useState<Date | null>(null);
  const [showWelcomeAnimation, setShowWelcomeAnimation] =
    useState(false);
  const [showRiskNudge, setShowRiskNudge] = useState(false);
  const [is_Premium, setis_Premium] = useState(user?.is_Premium || false);
  const [showPremiumModal, setShowPremiumModal] =
    useState(false);
  const [showMoodReward, setShowMoodReward] = useState(false);
  const [currentMoodReward, setCurrentMoodReward] =
    useState<any>(null);
  const [showPremiumSuccess, setShowPremiumSuccess] =
    useState(false);
    
  // Load data from user profile on user change
  useEffect(() => {
    if (user) {
      setSelectedPet(user.selected_pet || null);
      setCoins(user.coins || 100);
      setJournalEntries(user.journal_entries || []);
      setPetMood((user.pet_mood as PetMood) || "calm");
      setis_Premium(user.is_Premium || false);

      if (user.user_type === 'therapist') {
        return; // Therapist will be handled by the main return logic
      }

      if (user.selected_pet) {
        setCurrentScreen("home");
      } else {
        setCurrentScreen("pet-selection");
      }
    } else {
        setCurrentScreen("pet-selection");
    }
  }, [user]);

  // Save data to Supabase (users table or journal_entries table)
  const saveData = async (data: any) => {
    if (!user) {
      console.debug('saveData skipped: no user', data);
      return { error: 'no-user' };
    }
    if (user.is_anonymous) {
      console.debug('saveData skipped: anonymous user', data);
      return { error: 'anonymous' };
    }

    try {
      // Extract fields that go to the users table
      const userFields: any = {};
      if ('coins' in data) userFields.coins = data.coins;
      // Note: pet_id should be an integer ID from the pets table.
      // selectedPet here is a Pet object, not a DB id, so we skip it for now.
      // TODO: Implement proper pet ID mapping after setting up pets table
      // if ('selected_pet' in data && data.selected_pet?.id) userFields.pet_id = data.selected_pet.id;
      if ('pet_mood' in data) userFields.pet_mood = data.pet_mood;
      if ('is_premium' in data) userFields.is_premium = data.is_premium;

      // Update users table if there are user fields to save
      if (Object.keys(userFields).length > 0) {
        console.debug('Saving to users table:', { userId: user.id, fields: userFields });
        
        const { data: updated, error: userError } = await supabase
          .from('users')
          .update(userFields)
          .eq('id', user.id)
          .select()
          .single();

        if (userError) {
            console.error('Error saving to users table:', userError);
            if (userError.message?.includes('permission') || userError.message?.includes('policy')) {
              console.warn('⚠️ RLS POLICY BLOCKED UPDATE: Ensure auth.uid() matches users.id');
            }

            // Fallback: some deployments store profile fields in `profiles` table
            // (e.g., `is_premium` and `coins` may live on `profiles`). Try updating `profiles`.
            try {
              if (Object.keys(userFields).length > 0) {
                console.debug('Attempting fallback update to profiles table for fields:', userFields);
                const { data: profUpdated, error: profErr } = await supabase
                  .from('profiles')
                  .update(userFields)
                  .eq('id', user.id)
                  .select()
                  .single();

                if (profErr) {
                  console.error('Profiles table fallback update failed:', profErr);
                  return { error: userError };
                }

                console.debug('Profiles table updated via fallback:', profUpdated);
                return { success: true };
              }
            } catch (fallbackErr) {
              console.error('Fallback update to profiles table threw error:', fallbackErr);
              return { error: userError };
            }

            return { error: userError };
          }

        console.debug('User data saved successfully:', updated);
      }

      return { success: true };
    } catch (err) {
      console.error('Unexpected saveData error:', err);
      return { error: err };
    }
  };

  useEffect(() => {
    // TODO: Implement pet saving after setting up proper pet ID mapping
    // For now, selectedPet is stored in-memory and displayed in UI
    // if(selectedPet){
    //   saveData({ selected_pet: selectedPet });
    // }
  }, [selectedPet]);

  useEffect(() => {
    void saveData({ coins: coins });
  }, [coins]);

  useEffect(() => {
    // Note: journal entries are saved via handleJournalSubmit which inserts to DB
    // This useEffect is kept for other potential changes but journal_entries field
    // is not saved here since journals are stored in normalized journal_entries table
  }, [journalEntries]);
    
  useEffect(() => {
    saveData({ is_premium: is_Premium });
  }, [is_Premium]);

  useEffect(() => {
    saveData({ pet_mood: petMood });
  }, [petMood]);

  // Check for risk patterns and show nudges
  useEffect(() => {
    if (journalEntries.length >= 3) {
      const recentEntries = journalEntries.slice(-3);
      const negativeEntries = recentEntries.filter(
        (entry) =>
          entry.mood === "sad" || entry.mood === "anxious",
      );

      if (negativeEntries.length >= 2) {
        setTimeout(() => setShowRiskNudge(true), 2000);
      }
    }
  }, [journalEntries]);

  const updatePetMood = (journalMood: string) => {
    const moodMapping: { [key: string]: PetMood } = {
      happy: "happy",
      excited: "happy",
      energetic: "happy",
      content: "calm",
      calm: "calm",
      sad: "sad",
      anxious: "sad",
      angry: "sad",
      irritated: "sad",
      frustrated: "sad",
    };
    const newPetMood = moodMapping[journalMood] || "calm";
    setPetMood(newPetMood);
  };

  const handlePetSelected = (pet: Pet) => {
    setSelectedPet(pet);
    setShowWelcomeAnimation(true);
    setTimeout(() => {
      setCurrentScreen("home");
      setShowWelcomeAnimation(false);
    }, 2000);
  };

  const handleJournalSubmit = (entry: JournalEntry) => {
    setLastJournaled(entry.date);
    updatePetMood(entry.mood);

    // Insert journal entry into journal_entries table
    (async () => {
      try {
        const { data: inserted, error: insertError } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user?.id,
            entry_text: entry.content,
            mood: entry.mood,
            sentiment_score: entry.confidence || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting journal entry:', insertError);
          // Fallback: try to append journal entry to `profiles`.`journal_entries` (JSONB)
          try {
            const { data: profileRow, error: profileErr } = await supabase
              .from('profiles')
              .select('journal_entries')
              .eq('id', user.id)
              .single();

            if (profileErr) {
              console.error('Could not load profiles row for fallback journal save:', profileErr);
              return;
            }

            const existing = Array.isArray(profileRow?.journal_entries) ? profileRow.journal_entries : [];
            const fallbackEntry = {
              mood: entry.mood,
              content: entry.content,
              date: new Date().toISOString(),
              confidence: entry.confidence || null,
            };

            const updatedEntries = [...existing, fallbackEntry];

            const { error: profUpdateErr } = await supabase
              .from('profiles')
              .update({ journal_entries: updatedEntries })
              .eq('id', user.id);

            if (profUpdateErr) {
              console.error('Failed to save journal entry to profiles journal_entries:', profUpdateErr);
              return;
            }

            console.debug('Journal entry saved to profiles.journal_entries as fallback');
          } catch (fbErr) {
            console.error('Fallback journal save threw error:', fbErr);
          }
          return;
        }

        console.debug('Journal entry saved:', inserted);

        // Add the new entry to local state (update after DB insert succeeds)
        const newEntries = [...journalEntries, entry];
        setJournalEntries(newEntries);

        // Reward for journaling: add 25 coins
        const newCoins = coins + 25;
        setCoins(newCoins);
        await saveData({ coins: newCoins }).catch((e) => console.error('saveData error (coins):', e));

        // Check for mood-based rewards
        const analytics = analyzeMoods(newEntries);
        const unclaimedRewards = analytics.rewards.filter(
          (reward) => {
            // Simple check - in a real app you'd track claimed rewards properly
            return (
              reward.type === "positive_streak" ||
              reward.type === "consistency_bonus"
            );
          },
        );

        if (unclaimedRewards.length > 0) {
          setCurrentMoodReward(unclaimedRewards[0]);
          setTimeout(() => setShowMoodReward(true), 1000);
        }

        setCurrentScreen("home");

        // Show confetti animation
        setTimeout(() => {
          const confetti = document.createElement("div");
          confetti.innerHTML = "🎉✨🎊";
          confetti.className =
            "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl pointer-events-none z-50";
          document.body.appendChild(confetti);
          setTimeout(() => confetti.remove(), 2000);
        }, 500);
      } catch (err) {
        console.error('Error submitting journal:', err);
      }
    })();
  };

  const getStreakCount = () => {
    if (journalEntries.length === 0) return 0;
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const hasEntry = journalEntries.some((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.toDateString() === checkDate.toDateString()
        );
      });

      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  const handlePremiumFeature = (feature: string) => {
    if (!is_Premium) {
      setShowPremiumModal(true);
      return;
    }

    // Handle premium features
    if (feature === "play") {
      setCurrentScreen("play");
      return;
    }
    if (feature === "feed") {
      setCurrentScreen("feed");
      return;
    }
  };

  const resetToPetSelection = async () => {
     if(user && !user.is_anonymous) {
        await supabase.from('profiles').update({ selected_pet: null }).eq('id', user.id);
     }
    setCurrentScreen("pet-selection");
    setSelectedPet(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setUser(null);
    setCurrentScreen('pet-selection');
  };

  const handleGoToSignUp = () => {
    // Show the unified auth screen by clearing current user
    setUser(null);
  };

  const handleSubscribe = async () => {
    // Demo subscription handler — toggles premium locally and persists to users table
    try {
      setis_Premium(true);
      await saveData({ is_premium: true });
      setShowPremiumModal(false);
      setShowPremiumSuccess(true);
      setTimeout(() => setShowPremiumSuccess(false), 2500);
    } catch (err) {
      console.error('Error in handleSubscribe:', err);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 to-teal-100">
            <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
     )
  }

  if (!user) {
    return <UnifiedAuthScreen />;
  }
  
  // Check if user is therapist - log for debugging
  console.log('User type check:', user.user_type, 'Full user:', user);
  
  if (user.user_type === 'therapist') {
    console.log('Rendering therapist dashboard');
    return <TherapistDashboard onBack={() => {}} />;
  }
  if (showWelcomeAnimation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated confetti */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 360, 720],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 0.5,
              }}
            >
              {
                ["🎉", "✨", "🎊", "🌟", "💫"][
                  Math.floor(Math.random() * 5)
                ]
              }
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div
            className={`p-12 rounded-full ${selectedPet?.color} mb-6 shadow-2xl`}
          >
            <div className="text-8xl">{selectedPet?.emoji}</div>
          </div>
          <h2 className="text-3xl mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
            Welcome to MindPal!
          </h2>
          <p className="text-xl text-gray-700">
            {selectedPet?.name} is excited to be your wellness
            companion! 🌟
          </p>
        </motion.div>
      </div>
    );
  }

  if (currentScreen === "pet-selection" || !selectedPet) {
    return <PetSelection onPetSelected={handlePetSelected} />;
  }

  if (currentScreen === "journal") {
    return (
      <JournalScreen
        onJournalSubmit={handleJournalSubmit}
        onBack={() => setCurrentScreen("home")}
        petName={selectedPet?.name || ""}
      />
    );
  }

  if (currentScreen === "quests") {
    return (
      <QuestsAndCoins
        coins={coins}
        onCoinsUpdate={setCoins}
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  if (currentScreen === "customization") {
    return (
      <CustomizationScreen
        pet={selectedPet!}
        coins={coins}
        onCoinsUpdate={setCoins}
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  if (currentScreen === "play") {
    return (
      <PlayScreen
        pet={selectedPet!}
        coins={coins}
        onCoinsUpdate={setCoins}
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  if (currentScreen === "feed") {
    return (
      <FeedScreen
        pet={selectedPet!}
        coins={coins}
        onCoinsUpdate={setCoins}
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  if (currentScreen === "analytics") {
    return (
      <AnalyticsScreen
        journalEntries={journalEntries}
        coins={coins}
        onCoinsUpdate={setCoins}
        onBack={() => setCurrentScreen("home")}
        petName={selectedPet?.name || "Your Pet"}
      />
    );
  }
  
    if (currentScreen === "therapy") {
    return (
      <TherapistScreen
        onBack={() => setCurrentScreen("home")}
        userData={user}
        journalEntries={journalEntries}
        coins={coins}
        onCoinsUpdate={setCoins}
      />
    );
  }


  if (currentScreen === "leaderboard") {
  return (
    <MindPalLeaderboard
      league="Gold League"
      timeRemaining="3 days"
      players={[
        { id: 1, name: "Prisha", country: "🇮🇹", xp: 73, streak: 7, avatar: "P", delta: +1 },
        { id: 2, name: "Ibrahim", country: "🇺🇸", xp: 72, streak: 11, avatar: "🦖", delta: -1 },
        { id: 3, name: "Andreana N.", country: "🇺🇸", xp: 70, streak: 9, avatar: "A", delta: 0 },
        { id: 4, name: "Liam", country: "🇨🇦", xp: 68, streak: 5, avatar: "L", delta: +2 },]}
        onNavigate={(screen) => setCurrentScreen(screen as Screen)}
        />
      );
    }


  // Home Dashboard 
  return (
    <div className="min-h-screen p-6 relative overflow-hidden bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-16 left-8 text-6xl animate-pulse">
          🌸
        </div>
        <div className="absolute top-32 right-16 text-5xl animate-bounce delay-1000">
          ✨
        </div>
        <div className="absolute bottom-40 left-12 text-7xl animate-pulse delay-2000">
          🌈
        </div>
        <div className="absolute bottom-16 right-8 text-4xl animate-bounce delay-500">
          💫
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* GUEST MODE REMINDER */}
        {user?.is_anonymous && (
          <GuestModeReminder onSignUpClick={handleGoToSignUp} />
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-gray-800 mb-2 font-medium">
              Hello, {user?.username}! 👋
            </h1>
            <p className="text-gray-600">
              How are you feeling today?
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Add button to go back to pet selection */}
            <Button
              onClick={resetToPetSelection}
              variant="outline"
              size="sm"
              className="rounded-full px-3 py-1 text-xs"
            >
              🔄 Change Pet
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="rounded-full px-3 py-1 text-xs"
            >
              Logout
            </Button>

            {is_Premium && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-pink-200 to-purple-300 px-3 py-1 rounded-full">
                <span>👑</span>
                <span className="text-sm font-medium">
                  Premium
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-200 to-purple-300 px-3 py-1 rounded-full">
              <span>🔥</span>
              <span className="text-sm font-medium">
                {getStreakCount()} day streak
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-200 to-yellow-300 px-3 py-1 rounded-full">
              <span>🪙</span>
              <span className="text-sm font-medium">
                {coins}
              </span>
            </div>
          </div>
        </div>

        {/* Pet Companion */}
        {selectedPet && (
            <div className="mb-8">
            <PetCompanion
                pet={selectedPet!}
                mood={petMood}
                lastJournaled={lastJournaled || undefined}
            />
            </div>
        )}

        {/* Current Mood Display */}
        {journalEntries.length > 0 && (
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-sm border-0 shadow-lg rounded-2xl mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {petMood === "happy" && "😊"}
                  {petMood === "sad" && "😢"}
                  {petMood === "calm" && "😌"}
                  {petMood === "angry" && "😡"}

                </div>
                <div>
                  <h3 className="font-medium text-gray-800 flex items-center space-x-1">
                    <span>Current Mood</span>
                    <span className="text-purple-600">🤖</span>
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {petMood}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                <div>AI-detected from</div>
                <div>your journal writing</div>
              </div>
            </div>
          </Card>
        )}

       {/* Action Buttons — Grouped + Expandable */}
<div className="space-y-6 mb-8">


  {/* === GROUP: TRACKING === */}
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="rounded-2xl overflow-hidden shadow-lg"
  >
    {/* Header (click to open/close) */}
    <button
      onClick={() => toggleGroup("tracking")}
      className="w-full h-18 md:h-20 bg-gradient-to-r from-blue-400 to-blue-500 text-white
                 flex items-center justify-between px-6 md:px-6 py-4 md:py-5 mt-4 rounded-2xl"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <span className="text-2xl">📈</span>
        <div className="text-left">
          <div className="text-lg md:text-xl font-semibold">Tracking</div>
          <div className="text-xs md:text-sm opacity-90">Journal & daily quests</div>
        </div>
      </div>
      <span className="text-xl md:text-2xl">{openGroup === "tracking" ? "▴" : "▾"}</span>
    </button>

    {/* Expanded Content */}
    <motion.div
      initial={false}
      animate={{ height: openGroup === "tracking" ? "auto" : 0, opacity: openGroup === "tracking" ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white"
      style={{ overflow: "hidden" }}
    >
      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setCurrentScreen("journal")}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 text-white
                       shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 relative"
          >
            <span className="text-2xl">📔</span>
            <span className="text-lg font-medium">Write Journal</span>
            {!is_Premium && journalEntries.length > 0 && (
              <span className="absolute top-2 right-3 text-[10px] px-2 py-0.5 rounded-full bg-white/20">🤖 AI</span>
            )}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setCurrentScreen("quests")}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white
                       shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🎯</span>
            <span className="text-lg font-medium">Daily Quests</span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  </motion.div>

  {/* === GROUP: PET === */}
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="rounded-2xl overflow-hidden shadow-lg"
  >
    <button
      onClick={() => toggleGroup("pet")}
      className="w-full h-18 md:h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-white
                 flex items-center justify-between px-6 md:px-6 py-4 md:py-5 mt-4 rounded-2xl "
    >
      <div className="flex items-center gap-3 md:gap-4">
        <span className="text-2xl">🐾</span>
        <div className="text-left">
          <div className="text-lg md:text-xl font-semibold">Pet</div>
          <div className="text-xs md:text-sm opacity-90">Customize, play, feed</div>
        </div>
      </div>
      <span className="text-xl md:text-2xl">{openGroup === "pet" ? "▴" : "▾"}</span>
    </button>

    <motion.div
      initial={false}
      animate={{ height: openGroup === "pet" ? "auto" : 0, opacity: openGroup === "pet" ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white"
      style={{ overflow: "hidden" }}
    >
      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setCurrentScreen("customization")}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 text-white
                       shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🛍️</span>
            <span className="text-lg font-medium">Customize</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handlePremiumFeature("play")}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white
                       shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 relative"
          >
            <span className="text-2xl">🎮</span>
            <span className="text-lg font-medium">Play</span>
            {!is_Premium && (
              <span className="absolute top-2 right-3 text-[10px] px-2 py-0.5 rounded-full bg-white/25">👑 PRO</span>
            )}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handlePremiumFeature("feed")}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 text-white
                       shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 relative"
          >
            <span className="text-2xl">🍽️</span>
            <span className="text-lg font-medium">Feed</span>
            {!is_Premium && (
              <span className="absolute top-2 right-3 text-[10px] px-2 py-0.5 rounded-full bg-white/25">👑 PRO</span>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  </motion.div>

  {/* === GROUP: EXPLORE === */}
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="rounded-2xl overflow-hidden shadow-lg"
  >
    <button
      onClick={() => toggleGroup("explore")}
      className="w-full h-18 md:h-20 bg-gradient-to-r from-indigo-400 to-purple-500 text-white
           flex items-center justify-between px-6 md:px-6 py-4 md:py-5 mt-4 rounded-2xl"

    >
      <div className="flex items-center gap-3 md:gap-4">
        <span className="text-2xl">🧭</span>
        <div className="text-left">
          <div className="text-lg md:text-xl font-semibold">Explore</div>
          <div className="text-xs md:text-sm opacity-90">Leaderboard & premium</div>
        </div>
      </div>
      <span className="text-xl md:text-2xl">{openGroup === "explore" ? "▴" : "▾"}</span>
    </button>

    <motion.div
      initial={false}
      animate={{ height: openGroup === "explore" ? "auto" : 0, opacity: openGroup === "explore" ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white"
      style={{ overflow: "hidden" }}
    >
      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setCurrentScreen("leaderboard")}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-500 text-white
                       shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🏆</span>
            <span className="text-lg font-medium">Leaderboard</span>
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
                onClick={() => setCurrentScreen("therapy")}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white
                            shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
            >
                <span className="text-2xl">🧠</span>
                <span className="text-lg font-medium">Therapy</span>
            </Button>
        </motion.div>

        {!is_Premium ? (
          <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowPremiumModal(true)}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 text-white
                         shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
            >
              <span className="text-2xl">👑</span>
              <span className="text-lg font-medium">Get Premium</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => {
                alert("👑 Premium Active!\nManage subscription in the real app.");
              }}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-400 to-fuchsia-500 text-white
                         shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
            >
              <span className="text-2xl">👑</span>
              <span className="text-lg font-medium">Premium Active</span>
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  </motion.div>

</div>

        {/* Analytics Button */}
        {journalEntries.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => setCurrentScreen("analytics")}
              className="w-full h-16 bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 text-white rounded-2xl shadow-lg flex items-center justify-center space-x-3 font-medium"
            >
              <span className="text-3xl">📊</span>
              <div className="text-left">
                <div className="text-lg">
                  View Mood Analytics
                </div>
                <div className="text-sm opacity-90">
                  Complete history & insights
                </div>
              </div>
            </Button>
          </motion.div>
        )}

        {/* Recent Journal Entries */}
        {journalEntries.length > 0 && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-800 font-medium">
                Recent Journal Entries
              </h3>
              {journalEntries.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full px-3 py-1"
                  onClick={() => {
                    // Could implement a full journal history view here
                    alert(
                      `You have ${journalEntries.length} total journal entries! 📖`,
                    );
                  }}
                >
                  View All ({journalEntries.length})
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {journalEntries
                .slice(-3)
                .reverse()
                .map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white"
                  >
                    <div className="text-2xl">
                      {entry.mood === "happy" && "😊"}
                      {entry.mood === "excited" && "🤗"}
                      {entry.mood === "energetic" && "⚡"}
                      {entry.mood === "content" && "😌"}
                      {entry.mood === "calm" && "🕯️"}
                      {entry.mood === "sad" && "😢"}
                      {entry.mood === "anxious" && "😰"}
                      {entry.mood === "angry" && "😡"}
                      {entry.mood === "irritated" && "😤"}
                      {entry.mood === "frustrated" && "😓"}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 text-sm mb-1">
                        {entry.content.slice(0, 100)}
                        {entry.content.length > 100 && "..."}
                      </p>
                      {entry.aiAnalysis && (
                        <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-2 py-1 mb-2">
                          🤖 {entry.aiAnalysis.slice(0, 80)}
                          {entry.aiAnalysis.length > 80 &&
                            "..."}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {new Date(
                            entry.date,
                          ).toLocaleDateString()}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                          🤖 {entry.mood}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>

            {journalEntries.length === 1 && (
              <div className="text-center mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="text-2xl mb-2">🌱</div>
                <p className="text-sm text-gray-600">
                  Great start! Keep journaling to track your
                  emotional journey with {selectedPet?.name}.
                </p>
              </div>
            )}
          </Card>
        )}

        

        {/* Risk Nudge Modal */}
        {showRiskNudge && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50 }}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🫂</div>
                <h3 className="text-xl mb-4 text-gray-800 font-medium">
                  {selectedPet?.name} Notices You Might Need
                  Extra Care
                </h3>
                <p className="text-gray-600 mb-6">
                  It's okay to have difficult days. Would you
                  like to try a calming breathing exercise
                  together?
                </p>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-2xl py-3 font-medium"
                    onClick={() => {
                      setShowRiskNudge(false);
                      // Could implement breathing exercise here
                    }}
                  >
                    Try Breathing Exercise 🧘‍♀️
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-3 font-medium"
                    onClick={() => setShowRiskNudge(false)}
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Premium Subscription Modal */}
        {showPremiumModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPremiumModal(false);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 pb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl"
                >
                  👑
                </motion.div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPremiumModal(false)}
                  className="rounded-full h-8 w-8 p-0 hover:bg-gray-100"
                >
                  ✕
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="px-6 overflow-y-auto flex-1">
                <div className="text-center mb-6">
                  <h3 className="text-2xl mb-4 text-gray-800 font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Upgrade to MindPal Premium
                  </h3>
                  <p className="text-gray-600">
                    Unlock advanced features for a deeper bond
                    with {selectedPet?.name}!
                  </p>
                </div>

                <div className="space-y-4 mb-6 text-left">
                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <div className="text-2xl">🎮</div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Interactive Play Activities
                      </h4>
                      <p className="text-sm text-gray-600">
                        Play fetch, dance, solve puzzles and go
                        on adventures together!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
                    <div className="text-2xl">🍽️</div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Pet Feeding System
                      </h4>
                      <p className="text-sm text-gray-600">
                        Feed your pet delicious meals and watch
                        their happiness grow!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <div className="text-2xl">🧠</div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Advanced AI Insights
                      </h4>
                      <p className="text-sm text-gray-600">
                        Deeper emotional analysis and
                        personalized wellness recommendations!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                    <div className="text-2xl">🔮</div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Therapy Add-ons
                      </h4>
                      <p className="text-sm text-gray-600">
                        Guided meditation, breathing exercises,
                        and therapeutic activities!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                    <div className="text-2xl">✨</div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Enhanced Personalization
                      </h4>
                      <p className="text-sm text-gray-600">
                        Exclusive pet customizations,
                        environments, and premium content!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mb-6">
                  <div className="text-3xl mb-2">🎉</div>
                  <h4 className="font-medium text-gray-800 mb-1">
                    Special Demo Price!
                  </h4>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg line-through text-gray-500">
                      $9.99/month
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      FREE
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    This is a demo - enjoy all features!
                  </p>
                </div>
              </div>

              {/* Fixed footer with buttons */}
              <div className="p-6 pt-4 border-t border-gray-100">
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white rounded-2xl py-4 font-medium text-lg shadow-lg"
                    onClick={handleSubscribe}
                  >
                    🚀 Activate Premium Features (Demo)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-3 font-medium"
                    onClick={() => setShowPremiumModal(false)}
                  >
                    Maybe Later
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  This is a prototype demo. In the real app,
                  this would connect to payment processing! 💜
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Mood Reward Modal */}
        {showMoodReward && currentMoodReward && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 1, repeat: 2 }}
                className="text-6xl mb-4"
              >
                {currentMoodReward.emoji}
              </motion.div>

              <h3 className="text-xl mb-4 text-gray-800 font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {currentMoodReward.title}
              </h3>

              <p className="text-gray-600 mb-6">
                {currentMoodReward.description}
              </p>

              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 mb-6">
                <div className="text-3xl mb-2">🪙</div>
                <h4 className="font-medium text-gray-800 mb-1">
                  Bonus Reward!
                </h4>
                <p className="text-2xl font-bold text-orange-600">
                  +{currentMoodReward.coinReward} Coins
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-3 font-medium"
                  onClick={() => {
                    setCoins(
                      (prev: number) =>
                        prev + currentMoodReward.coinReward,
                    );
                    setShowMoodReward(false);
                    setCurrentMoodReward(null);
                  }}
                >
                  Claim Reward! 🎉
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl py-3 font-medium"
                  onClick={() => {
                    setShowMoodReward(false);
                    setCurrentMoodReward(null);
                  }}
                >
                  Maybe Later
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Keep up the great work with your emotional
                wellness journey! 💜
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Premium Success Modal */}
        {showPremiumSuccess && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{ duration: 2, repeat: 1 }}
                className="text-6xl mb-4"
              >
                👑
              </motion.div>

              <h3 className="text-2xl mb-4 text-gray-800 font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome to Premium!
              </h3>

              <p className="text-gray-600 mb-6">
                🎉 You now have access to all premium features!{" "}
                {selectedPet?.name} is excited to play and
                explore with you.
              </p>

              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 mb-6">
                <div className="text-3xl mb-2">🪙</div>
                <h4 className="font-medium text-gray-800 mb-1">
                  Welcome Bonus!
                </h4>
                <p className="text-2xl font-bold text-orange-600">
                  +200 Coins
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  For joining premium!
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-3 font-medium"
                  onClick={() => setShowPremiumSuccess(false)}
                >
                  Start Exploring! 🚀
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl py-3 font-medium"
                  onClick={() => {
                    setShowPremiumSuccess(false);
                    handlePremiumFeature("play");
                  }}
                >
                  Play with {selectedPet?.name} Now! 🎮
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Try the new Play and Feed features from the main
                menu! 💜
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <AppRouter />;
}