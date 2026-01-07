import { useState } from 'react';
import { supabase } from '../utils/supabase/client';

export function DatabaseTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDatabase = async () => {
    setLoading(true);
    setResult('Testing database connection...\n');
    
    try {
      // Test 1: Check auth
      const { data: { user } } = await supabase.auth.getUser();
      setResult(prev => prev + `✅ Auth user: ${user?.id || 'Not logged in'}\n`);
      
      if (!user) {
        setResult(prev => prev + '❌ Please log in first\n');
        setLoading(false);
        return;
      }

      // Test 2: Test users table
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (userError) {
          setResult(prev => prev + `❌ Users table error: ${userError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Users table: ${userData ? 'Found' : 'Not found'}\n`);
        }
      } catch (err) {
        setResult(prev => prev + `❌ Users table exception: ${err}\n`);
      }

      // Test 3: Test profiles table
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) {
          setResult(prev => prev + `❌ Profiles table error: ${profileError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Profiles table: ${profileData ? 'Found' : 'Not found'}\n`);
        }
      } catch (err) {
        setResult(prev => prev + `❌ Profiles table exception: ${err}\n`);
      }

      // Test 4: Test journal_entries table
      try {
        const { data: journalData, error: journalError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
        
        if (journalError) {
          setResult(prev => prev + `❌ Journal entries error: ${journalError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Journal entries: ${journalData?.length || 0} found\n`);
        }
      } catch (err) {
        setResult(prev => prev + `❌ Journal entries exception: ${err}\n`);
      }

      // Test 5: Try inserting a test journal entry
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            entry_text: 'Test entry from database test',
            mood: 'calm',
            sentiment_score: 0.5
          })
          .select()
          .single();
        
        if (insertError) {
          setResult(prev => prev + `❌ Insert test error: ${insertError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Insert test: Success (ID: ${insertData.id})\n`);
          
          // Clean up test entry
          await supabase.from('journal_entries').delete().eq('id', insertData.id);
          setResult(prev => prev + `✅ Cleanup: Test entry deleted\n`);
        }
      } catch (err) {
        setResult(prev => prev + `❌ Insert test exception: ${err}\n`);
      }

    } catch (err) {
      setResult(prev => prev + `❌ General error: ${err}\n`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Database Connection Test</h2>
      
      <button
        onClick={testDatabase}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Database'}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm whitespace-pre-wrap font-mono">
          {result}
        </pre>
      )}
    </div>
  );
}