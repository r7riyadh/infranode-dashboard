import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const fetchRequests = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const { data, error } = await supabase
        .from('asset_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(false);

    const requestsChannel = supabase.channel('sync-requests-room');

    requestsChannel
      .on('broadcast', { event: 'sync-requests' }, () => {
        fetchRequests(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asset_requests' }, () => {
        fetchRequests(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
    };
  }, [fetchRequests]);

  const notifyOthers = () => {
    try {
      const channel = supabase.channel('sync-requests-room');
      channel.send({
        type: 'broadcast',
        event: 'sync-requests',
        payload: { ts: Date.now() }
      }).catch(() => {});
    } catch (e) {}
  };

  const getEffectiveUser = () => {
    return user?.username || user?.email || session?.user?.username || session?.user?.email || 'Employee';
  };

  const addRequest = async (requestData) => {
    const requestedBy = getEffectiveUser();
    const tempReq = {
      id: `req-${Date.now()}`,
      ...requestData,
      requested_by: requestedBy,
      status: requestData.status || 'Pending',
      created_at: new Date().toISOString()
    };

    // Instant UI update
    setRequests(prev => [tempReq, ...prev]);

    try {
      const { error } = await supabase.from('asset_requests').insert([{ ...requestData, requested_by: requestedBy }]);
      if (error) console.warn('Supabase insert warning:', error.message);
      else notifyOthers();
    } catch (err) {
      console.warn('Supabase insert error:', err.message);
    } finally {
      fetchRequests();
    }
  };

  const updateRequest = async (id, updates) => {
    // Instant UI update
    setRequests(prev => prev.map(req => req.id === id ? { ...req, ...updates } : req));

    try {
      const { error } = await supabase.from('asset_requests').update(updates).eq('id', id);
      if (error) console.warn('Supabase update warning:', error.message);
      else notifyOthers();
    } catch (err) {
      console.warn('Supabase update error:', err.message);
    } finally {
      fetchRequests();
    }
  };

  const deleteRequest = async (id) => {
    // Instant UI update
    setRequests(prev => prev.filter(req => req.id !== id));

    try {
      const { error } = await supabase.from('asset_requests').delete().eq('id', id);
      if (error) console.warn('Supabase delete warning:', error.message);
      else notifyOthers();
    } catch (err) {
      console.warn('Supabase delete error:', err.message);
    } finally {
      fetchRequests();
    }
  };

  return {
    requests,
    loading,
    addRequest,
    updateRequest,
    deleteRequest,
    refresh: fetchRequests
  };
};

