import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const LOCAL_ASSETS_KEY = 'custom-local-assets-list';
const ASSET_CREATORS_KEY = 'asset-creators-map';

export const cleanUsername = (str) => {
  if (!str) return 'admin';
  const val = String(str).trim();
  if (val.includes('@')) {
    return val.split('@')[0];
  }
  return val;
};

const decodeCreatedByFromNotes = (rawNotes) => {
  if (!rawNotes || typeof rawNotes !== 'string') return { cleanNotes: '', creator: null };
  const match = rawNotes.match(/\[CB:([^\]]+)\]/);
  const creator = match ? cleanUsername(match[1]) : null;
  const cleanNotes = rawNotes.replace(/\n?\[CB:[^\]]+\]/g, '').trim();
  return { cleanNotes, creator };
};

const encodeCreatedByInNotes = (userNotes, creator) => {
  const cleanCreator = cleanUsername(creator);
  const baseNotes = (userNotes || '').replace(/\n?\[CB:[^\]]+\]/g, '').trim();
  return baseNotes ? `${baseNotes}\n[CB:${cleanCreator}]` : `[CB:${cleanCreator}]`;
};

const getActiveUserUsername = () => {
  try {
    const activeStr = localStorage.getItem('active-user-session');
    if (activeStr) {
      const activeUser = JSON.parse(activeStr);
      return cleanUsername(activeUser.username || activeUser.email);
    }
  } catch (err) {}
  return 'meaw';
};

export const useAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getLocalAssets = () => {
    try {
      const stored = localStorage.getItem(LOCAL_ASSETS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalAssets = (localList) => {
    try {
      localStorage.setItem(LOCAL_ASSETS_KEY, JSON.stringify(localList));
    } catch (e) {
      console.error('Error saving local assets', e);
    }
  };

  const getCreatorMap = () => {
    try {
      const stored = localStorage.getItem(ASSET_CREATORS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  };

  const saveAssetCreator = (idOrTag, creator) => {
    if (!idOrTag || !creator) return;
    try {
      const map = getCreatorMap();
      map[idOrTag] = cleanUsername(creator);
      localStorage.setItem(ASSET_CREATORS_KEY, JSON.stringify(map));
    } catch (e) {}
  };

  const processAsset = (asset) => {
    const { cleanNotes, creator: notesCreator } = decodeCreatedByFromNotes(asset.notes);
    const creatorMap = getCreatorMap();
    const rawCreator = notesCreator || asset.created_by || creatorMap[asset.id] || creatorMap[asset.asset_tag] || 'meaw';
    const resolvedCreator = cleanUsername(rawCreator);

    let processed = { 
      ...asset, 
      notes: cleanNotes,
      created_by: resolvedCreator 
    };

    if (processed.end_of_life && processed.status !== 'Decommissioned') {
      const eolDate = new Date(processed.end_of_life);
      const today = new Date();
      
      const timeDiff = eolDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysLeft < 0) {
        processed.status = 'Critical';
      } else if (daysLeft <= 14) {
        processed.status = 'Warning';
      }
    }
    return processed;
  };

  const fetchAssets = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      let loadedAssets = [];
      let isSupabaseOnline = false;

      try {
        const { data, error: err } = await supabase
          .from('assets')
          .select('*')
          .neq('name', '__OPERATORS_CONFIG__')
          .order('created_at', { ascending: false });
        
        if (!err && data) {
          loadedAssets = data.filter(item => item.name !== '__OPERATORS_CONFIG__');
          isSupabaseOnline = true;
          // Sync local cache with the latest server records
          saveLocalAssets(loadedAssets);
        }
      } catch (err) {
        console.warn('Supabase fetch assets failed, using local fallback:', err);
      }

      if (!isSupabaseOnline) {
        // Fallback to local storage if Supabase is offline
        loadedAssets = getLocalAssets();
      }

      setAssets(loadedAssets.map(processAsset));
    } catch (err) {
      setError(err);
      console.error('Error fetching assets:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets(false);

    // Dedicated channel for real-time asset syncing across sessions
    const assetsChannel = supabase.channel('sync-assets-room');

    assetsChannel
      .on('broadcast', { event: 'sync-assets' }, () => {
        fetchAssets(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        fetchAssets(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
    };
  }, [fetchAssets]);

  const notifyOthers = () => {
    try {
      const channel = supabase.channel('sync-assets-room');
      channel.send({
        type: 'broadcast',
        event: 'sync-assets',
        payload: { ts: Date.now() }
      }).catch(() => {});
    } catch (e) {}
  };

  const cleanAssetPayload = (raw) => {
    const { id, created_by, ...payload } = raw;
    const currentActiveUser = getActiveUserUsername();
    const creatorToSave = (raw.created_by && raw.created_by !== 'admin') 
      ? cleanUsername(raw.created_by) 
      : currentActiveUser;

    const finalNotes = encodeCreatedByInNotes(payload.notes, creatorToSave);

    return {
      ...payload,
      purchase_date: (typeof payload.purchase_date === 'string' && payload.purchase_date.trim() !== '') ? payload.purchase_date : null,
      end_of_life: (typeof payload.end_of_life === 'string' && payload.end_of_life.trim() !== '') ? payload.end_of_life : null,
      notes: finalNotes
    };
  };

  const addAsset = async (assetData) => {
    const tempId = `asset-${Date.now()}`;

    if (assetData.created_by) {
      saveAssetCreator(tempId, assetData.created_by);
      if (assetData.asset_tag) saveAssetCreator(assetData.asset_tag, assetData.created_by);
    }

    const tempAsset = processAsset({
      id: tempId,
      ...assetData,
      created_at: new Date().toISOString()
    });

    // 1. Save to local storage & state instantly (Optimistic Update)
    const currentLocal = getLocalAssets();
    saveLocalAssets([tempAsset, ...currentLocal]);
    setAssets(prev => [tempAsset, ...prev]);

    // 2. Try Supabase insert and swap the temporary local ID with the actual database ID
    try {
      const supabasePayload = cleanAssetPayload(assetData);
      const { data, error: insertErr } = await supabase
        .from('assets')
        .insert([supabasePayload])
        .select()
        .single();

      if (insertErr) {
        console.error('Supabase asset insert failed:', insertErr.message, insertErr.details);
      }

      if (!insertErr && data) {
        if (assetData.created_by) {
          saveAssetCreator(data.id, assetData.created_by);
        }
        const dbAsset = processAsset(data);
        
        // Remove temp asset and replace with dbAsset in local storage
        const refreshedLocal = getLocalAssets().filter(a => String(a.id) !== tempId);
        saveLocalAssets([dbAsset, ...refreshedLocal]);

        // Update state to swap the temporary asset with the database asset
        setAssets(prev => prev.map(a => String(a.id) === tempId ? dbAsset : a));
        notifyOthers();
        return dbAsset;
      }
    } catch (err) {
      console.warn('Supabase asset insert background error:', err);
    }

    notifyOthers();
    return tempAsset;
  };

  const updateAsset = async (id, assetData) => {
    // 1. Update local storage & state instantly
    const currentLocal = getLocalAssets();
    const updatedLocal = currentLocal.map(a => String(a.id) === String(id) ? processAsset({ ...a, ...assetData }) : a);
    saveLocalAssets(updatedLocal);

    setAssets(prev => prev.map(a => String(a.id) === String(id) ? processAsset({ ...a, ...assetData }) : a));

    // 2. Try Supabase update in background
    try {
      const supabasePayload = cleanAssetPayload(assetData);
      const { error } = await supabase.from('assets').update(supabasePayload).eq('id', id);
      if (error) console.error('Supabase asset update failed:', error.message);
      notifyOthers();
    } catch (err) {
      console.warn('Supabase asset update background error:', err);
    }
  };

  const deleteAsset = async (id) => {
    // 1. Delete from local storage & state instantly
    const currentLocal = getLocalAssets();
    saveLocalAssets(currentLocal.filter(a => String(a.id) !== String(id)));

    setAssets(prev => prev.filter(a => String(a.id) !== String(id)));

    // 2. Try Supabase delete in background
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) console.error('Supabase asset delete failed:', error.message);
      notifyOthers();
    } catch (err) {
      console.warn('Supabase asset delete background error:', err);
    }
  };

  return { assets, loading, error, fetchAssets, addAsset, updateAsset, deleteAsset };
};
