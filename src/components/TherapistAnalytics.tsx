import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { AnalyticsScreen } from './AnalyticsScreen';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';

interface TherapistAnalyticsProps {
  onBack: () => void;
  therapistId: string;
  connectedUserIds: string[];
  acceptedConnections?: any[];
}

export const TherapistAnalytics: React.FC<TherapistAnalyticsProps> = ({
  onBack,
  therapistId,
  connectedUserIds,
  acceptedConnections = []
}) => {
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    const fetchConnectedUsersData = async () => {
      console.log('Analytics - Starting fetch, connectedUserIds:', connectedUserIds);
      
      if (connectedUserIds.length === 0) {
        console.log('Analytics - No connected user IDs, setting loading false');
        setLoading(false);
        return;
      }

      try {
        console.log('Analytics - Fetching users for IDs:', connectedUserIds);
        // Fetch user profiles
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, email, full_name')
          .in('id', connectedUserIds);

        console.log('Analytics - Users fetch result:', { users, usersError });
        console.log('Analytics - Full error details:', usersError);

        if (usersError) {
          console.error('Error fetching users:', usersError);
          // Try without the users table - just use the connection data we have
          console.log('Analytics - Falling back to connection data only');
          
          // Fetch journal entries for each connected user
          const fallbackUsers = await Promise.all(
            acceptedConnections.map(async (conn) => {
              const { data: entries, error: entriesError } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', conn.user_id)
                .order('created_at', { ascending: false });

              if (entriesError) {
                console.error(`Error fetching entries for user ${conn.user_id}:`, entriesError);
              }

              const transformedEntries = (entries || []).map(entry => ({
                mood: entry.mood || 'neutral',
                content: entry.entry_text || '',
                date: entry.created_at,
                confidence: entry.sentiment_score || 0.5,
                aiAnalysis: entry.ai_analysis || '',
                fineEmotions: entry.fine_emotions || []
              }));

              return {
                id: conn.user_id,
                name: conn.users?.email || conn.user_id,
                email: conn.users?.email || '',
                username: conn.users?.username || '',
                full_name: conn.users?.full_name || '',
                avatar: (conn.users?.email || conn.user_id || 'U').charAt(0).toUpperCase(),
                journal_entries: transformedEntries
              };
            })
          );
          setConnectedUsers(fallbackUsers);
          if (fallbackUsers.length > 0 && !selectedUserId) {
            setSelectedUserId(fallbackUsers[0].id);
          }
          setLoading(false);
          return;
        }

        console.log('Analytics - Processing', users?.length || 0, 'users');
        
        // Fetch journal entries for each user
        const usersWithEntries = await Promise.all(
          (users || []).map(async (user) => {
            console.log('Analytics - Fetching entries for user:', user.id);
            const { data: entries, error: entriesError } = await supabase
              .from('journal_entries')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (entriesError) {
              console.error(`Error fetching entries for user ${user.id}:`, entriesError);
              return { ...user, journal_entries: [] };
            }

            console.log(`Analytics - Found ${entries?.length || 0} entries for user ${user.id}`);

            // Transform entries to match the expected format
            const transformedEntries = (entries || []).map(entry => ({
              mood: entry.mood || 'neutral',
              content: entry.entry_text || '',
              date: entry.created_at,
              confidence: entry.sentiment_score || 0.5,
              aiAnalysis: entry.ai_analysis || '',
              fineEmotions: entry.fine_emotions || []
            }));

            return {
              ...user,
              journal_entries: transformedEntries,
              name: user.username || user.full_name || user.email,
              avatar: (user.username || user.email || 'U').charAt(0).toUpperCase()
            };
          })
        );

        console.log('Analytics - Final users with entries:', usersWithEntries);
        setConnectedUsers(usersWithEntries);
        if (usersWithEntries.length > 0 && !selectedUserId) {
          setSelectedUserId(usersWithEntries[0].id);
        }
      } catch (error) {
        console.error('Error fetching connected users data:', error);
        setConnectedUsers([]);
      } finally {
        console.log('Analytics - Setting loading to false');
        setLoading(false);
      }
    };

    fetchConnectedUsersData();
  }, [connectedUserIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient analytics...</p>
        </div>
      </div>
    );
  }

  if (connectedUsers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="p-8 bg-white/80 shadow-lg rounded-3xl text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl mb-4">No Connected Patients</h3>
            <p className="text-gray-600 mb-6">
              You don't have any connected patients yet. Accept connection requests to start viewing patient analytics.
            </p>
            <Button
              onClick={onBack}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full px-6"
            >
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const selectedUser = connectedUsers.find(user => user.id === selectedUserId);
  const selectedUserEntries = selectedUser?.journal_entries || [];

  return (
    <AnalyticsScreen
      journalEntries={selectedUserEntries}
      onBack={onBack}
      onCoinsUpdate={() => {}} // Therapists don't get coins
      coins={0}
      petName="Patient"
      userData={selectedUser}
      isTherapist={true}
      connectedUsers={connectedUsers}
    />
  );
};