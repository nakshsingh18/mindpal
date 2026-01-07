import React, { useState, useEffect } from 'react';
import { fetchTherapists, sendConnectionRequest } from '../utils/therapistApi';
import { supabase } from '../utils/supabase/client';
import { Card } from './ui/card';
import { Button } from './ui/button';

export const TherapistList: React.FC = () => {
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchTherapists();
        // supabase client returns { data, error }
        const data = res?.data;
        const error = (res as any)?.error;
        console.debug('fetchTherapists response', { data, error });
        if (error) {
          console.error('Error fetching therapists:', error);
          // show empty list but stop loading
          setTherapists([]);
        } else {
          setTherapists(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching therapists:', err);
        setTherapists([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRequest = async (therapistId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in first.');
      return;
    }
    
    setSendingRequest(therapistId);
    
    try {
      const res = await sendConnectionRequest({
        user_id: user.id,
        therapist_id: therapistId,
        message: message.trim() || 'I would like to connect with you for therapy sessions.',
      });

      console.debug('sendConnectionRequest response', res);

      const error = (res as any)?.error;
      if (error) {
        alert('Error sending request: ' + error.message);
      } else {
        alert('Connection request sent successfully! The therapist will review your request.');
        setSentRequests(prev => new Set([...prev, therapistId]));
        setMessage('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to send request. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  };

  if (loading) return <div className="p-6">Loading therapists...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Available Therapists</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Personal Message (Optional)
        </label>
        <textarea
          className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Tell the therapist why you'd like to connect and what you're hoping to work on..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1">{message.length}/500 characters</div>
      </div>

      {therapists.length === 0 ? (
        <div className="p-6 text-gray-600">No therapists available right now. Please check back later.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {therapists.map(t => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-sm text-gray-600">{t.specialization}</p>
                  <p className="text-xs text-gray-500">
                    {t.experience} • {t.languages?.join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm">⭐ {Number(t.rating || 5).toFixed(1)}</div>
                  <div className="text-sm text-gray-500">{t.response_time}</div>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-700">{t.description}</p>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-lg font-semibold text-purple-600">₹{t.price || 0}/session</div>
                <Button
                  onClick={() => handleRequest(t.id)}
                  disabled={sendingRequest === t.id || sentRequests.has(t.id)}
                  className={`rounded-full px-6 py-2 transition-all duration-200 ${
                    sentRequests.has(t.id)
                      ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                  }`}
                >
                  {sendingRequest === t.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : sentRequests.has(t.id) ? (
                    <div className="flex items-center gap-2">
                      ✓ Request Sent
                    </div>
                  ) : (
                    'Send Request'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};