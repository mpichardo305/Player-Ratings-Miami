import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useGroupName(groupId: string) {
  const [groupName, setGroupName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGroupName = async () => {
      if (!groupId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('groups')
          .select('name')
          .eq('id', groupId)
          .single();
          
        if (error) {
          throw new Error(error.message);
        }
        
        setGroupName(data?.name || '');
      } catch (err) {
        console.error('Error in fetchGroupName:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch group name'));
      } finally {
        setLoading(false);
      }
    };

    fetchGroupName();
  }, [groupId]);

  return { groupName, loading, error };
}