// src/components/TherapistDashboard.tsx
import React, { useEffect, useState } from 'react';
import { fetchTherapistRequestsFor, updateRequestStatus } from '../utils/therapistApi';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { TherapistChat } from './TherapistChat';
import Lottie from 'lottie-react';
import calmAnim from '../assets/animations/penguin/calm.json';
import { Users, Mail, List } from 'lucide-react';

// Small count-up component for livelier stats
function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const diff = Math.max(0, value - start);
    if (diff === 0) {
      setDisplay(value);
      return;
    }
    const stepTime = Math.max(15, Math.floor(duration / diff));
    const iv = setInterval(() => {
      start += 1;
      setDisplay(start);
      if (start >= value) clearInterval(iv);
    }, stepTime);
    return () => clearInterval(iv);
  }, [value, duration]);
  return <div className="text-2xl font-bold">{display}</div>;
}

export const TherapistDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState<{ chatId: string; userId: string; userEmail?: string } | null>(null);
  const navigate = useNavigate();

  const getSenderDisplay = (req: any) => {
    // Prefer joined user username, then full name, then email, then id
    const u = req?.users || req?.user || null;
    if (u) {
      return u.username || u.full_name || u.name || u.email || req.user_id || 'User';
    }
    return req.user_id || 'User';
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        navigate('/');
        return;
      }
      // fetch therapist profile with retries; if none, allow inline creation instead of redirect
      let profileData = null;
      let attempt = 0;
      while (attempt < 3) {
        try {
          const res = await supabase
            .from('therapists')
            .select('*')
            .eq('id', user.id)
            .single();
          if (res.error) {
            // if 404-like (no rows) break and allow creation
            // log and continue to retry briefly
            console.warn('Therapist profile fetch attempt', attempt + 1, 'error:', res.error.message);
          } else if (res.data) {
            profileData = res.data;
            break;
          }
        } catch (err) {
          console.warn('Therapist profile fetch attempt', attempt + 1, 'failed:', err);
        }
        attempt += 1;
        // small delay before retry
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 350));
      }

      if (!profileData) {
        // Do NOT navigate away; show inline profile creation UI in the dashboard.
        console.warn('No therapist profile found after retries; showing inline profile setup');
        setProfile(null);
        setLoading(false);
        await loadRequests(user.id); // still try to load requests (will be empty)
        return;
      }

      setProfile(profileData);
      await loadRequests(user.id);
      setLoading(false);

      // Realtime subscription for new requests for this therapist
      const sub = supabase.channel('therapist-requests')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'therapist_requests', 
          filter: `therapist_id=eq.${user.id}` 
        }, payload => {
          setRequests(prev => [payload.new, ...prev]);
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'therapist_requests', 
          filter: `therapist_id=eq.${user.id}` 
        }, payload => {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(sub);
      };
    })();
  }, [navigate]);

  const loadRequests = async (therapistId: string) => {
    const { data, error } = await fetchTherapistRequestsFor(therapistId);
    console.debug('fetchTherapistRequestsFor response', { data, error });
    if (error) {
      console.error('Error loading requests:', error);
    }
    setRequests(data || []);
  };

  const handleAccept = async (reqId: string) => {
    const { error } = await updateRequestStatus(reqId, 'accepted');
    if (error) {
      alert('Error accepting request: ' + error.message);
      return;
    }
    setRequests(prev => prev.map(r => (r.id === reqId ? { ...r, status: 'accepted' } : r)));
  };

  const handleReject = async (reqId: string) => {
    const { error } = await updateRequestStatus(reqId, 'rejected');
    if (error) {
      alert('Error rejecting request: ' + error.message);
      return;
    }
    setRequests(prev => prev.map(r => (r.id === reqId ? { ...r, status: 'rejected' } : r)));
  };

  const openChatWith = (userId: string) => {
    if (!profile?.id) return;
    const therapistId = profile.id;
    const chatId = `${userId}-${therapistId}`;
    setOpenChat({ chatId, userId });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');

  return (
    <div className="p-6 min-h-screen bg-animated-gradient">
      <div className="max-w-4xl mx-auto">
        {/* Header - calm and compact */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
              <div className="hidden md:block w-20 h-20 -mt-2">
                <Lottie animationData={calmAnim} loop={true} className="float-slow" style={{ width: 80, height: 80 }} />
              </div>
              <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-teal-700 font-semibold shadow">
                {profile?.name ? profile.name.charAt(0) : 'T'}
              </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Therapist Dashboard</h1>
              <div className="text-sm text-teal-700/80">{profile?.name || 'Your name'} • {profile?.specialization || 'General'}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button onClick={onBack} variant="outline" className="!px-3 !py-1">
                Back
              </Button>
            )}
            <Button onClick={handleSignOut} className="bg-red-50 text-red-600 hover:bg-red-100 !border-transparent">
              Sign out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="mp-card p-4">
            <div className="flex items-center gap-3">
              <div className="icon p-2 rounded bg-orange-50 text-orange-600"><Mail size={18} /></div>
              <div>
                <div className="text-sm text-gray-500">Pending</div>
                <div className="mp-stat"><CountUp value={pendingRequests.length} /></div>
              </div>
            </div>
          </Card>
          <Card className="mp-card p-4">
            <div className="flex items-center gap-3">
              <div className="icon p-2 rounded bg-green-50 text-green-600"><Users size={18} /></div>
              <div>
                <div className="text-sm text-gray-500">Active</div>
                <div className="mp-stat"><CountUp value={acceptedRequests.length} /></div>
              </div>
            </div>
          </Card>
          <Card className="mp-card p-4">
            <div className="flex items-center gap-3">
              <div className="icon p-2 rounded bg-sky-50 text-blue-600"><List size={18} /></div>
              <div>
                <div className="text-sm text-gray-500">Total</div>
                <div className="mp-stat"><CountUp value={requests.length} /></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Pending Requests */}
          <Card className="p-4 bg-white">
            <h3 className="font-semibold mb-4 text-lg">Pending Requests</h3>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-sm text-gray-500">No pending requests</div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="mp-request p-4 pulse-in">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-medium">
                        {req.users?.email ? req.users.email.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{getSenderDisplay(req)}</div>
                            <div className="text-xs text-gray-500 mt-1">{new Date(req.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        {req.message && (
                          <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                            {req.message}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <Button
                          onClick={() => { handleAccept(req.id); openChatWith(req.user_id); }}
                          variant="default"
                          size="sm"
                          className="mp-btn-primary !px-3 !py-2 rounded-md"
                        >
                          Accept & Chat
                        </Button>
                        <Button
                          onClick={() => handleReject(req.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 px-3 py-2 rounded-md"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Connections */}
          <Card className="p-4 bg-white">
            <h3 className="font-semibold mb-4 text-lg">Active Connections</h3>
            {acceptedRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💬</div>
                <div className="text-sm text-gray-500">No active connections yet</div>
              </div>
            ) : (
              <div className="space-y-3">
                {acceptedRequests.map(req => (
                  <div key={req.id} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm transition-transform transform hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">{(getSenderDisplay(req)||'U').charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-medium text-gray-800">{req.users?.email || req.user_id}</div>
                          <div className="text-xs text-gray-500">Connected: {new Date(req.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => openChatWith(req.user_id)}
                        variant="default"
                        size="sm"
                        className="!bg-emerald-600 !text-white hover:!bg-emerald-700 !border !border-emerald-600 px-3 py-2 rounded-md shadow-sm"
                      >
                        Open Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Chat Modal */}
      {openChat && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={() => setOpenChat(null)} />
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">{openChat.userId?.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="font-medium text-gray-800">Chat</div>
                  <div className="text-xs text-gray-500">Conversation with user</div>
                </div>
              </div>
              <div>
                <Button variant="ghost" onClick={() => setOpenChat(null)}>Close</Button>
              </div>
            </div>
            <TherapistChat
              chatId={openChat.chatId}
              therapistId={profile.id}
              userId={openChat.userId}
              onClose={() => setOpenChat(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};