import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'activity-log-entries';

const INITIAL_LOGS = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    user: 'admin',
    action: 'User Login',
    details: 'Admin logged into Administrator session',
    category: 'auth'
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    user: 'admin',
    action: 'Telemetry Sync',
    details: 'Infrastructure node telemetry status checked',
    category: 'system'
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    user: 'meaw',
    action: 'Asset Updated',
    details: 'Updated status for Dell PowerEdge R750 to Active',
    category: 'inventory'
  }
];

const cleanUserString = (rawUser) => {
  if (!rawUser) return 'admin';
  const val = String(rawUser).trim();
  return val.includes('@') ? val.split('@')[0] : val;
};

const cleanDetailsString = (rawDetails) => {
  if (!rawDetails) return '';
  let str = String(rawDetails);
  str = str.replace(/^Operator\s+/i, '');
  str = str.replace(/@enterprise\.demo/gi, '');
  return str;
};

const getActiveUserUsername = () => {
  try {
    const activeStr = localStorage.getItem('active-user-session');
    if (activeStr) {
      const activeUser = JSON.parse(activeStr);
      return cleanUserString(activeUser.username || activeUser.email || 'Employee');
    }
  } catch (err) {}
  return 'Employee';
};

// Setup real-time listener for activity logs across sessions
if (typeof window !== 'undefined' && !window.__activityChannel) {
  window.__activityChannel = supabase.channel('sync-activity-room');
  window.__activityChannel.on('broadcast', { event: 'activity-log-entry' }, (payload) => {
    if (payload?.payload?.entry) {
      const newEntry = payload.payload.entry;
      const currentLogs = getActivityLogs();
      if (!currentLogs.some(l => l.id === newEntry.id)) {
        const updated = [newEntry, ...currentLogs];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('activity-log-updated', { detail: newEntry }));
      }
    }
  }).subscribe();
}

export const getActivityLogs = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const rawList = data ? JSON.parse(data) : INITIAL_LOGS;
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
    }
    return rawList.map(log => ({
      ...log,
      user: cleanUserString(log.user),
      details: cleanDetailsString(log.details)
    }));
  } catch (err) {
    console.error('Error fetching activity logs', err);
    return INITIAL_LOGS.map(log => ({
      ...log,
      user: cleanUserString(log.user),
      details: cleanDetailsString(log.details)
    }));
  }
};

export const logActivityEvent = (action, details, user, category = 'general') => {
  const logs = getActivityLogs();
  const effectiveUser = cleanUserString(user || getActiveUserUsername());
  const cleanDetails = cleanDetailsString(details);

  const newEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: new Date().toISOString().split('T')[0],
    user: effectiveUser,
    action,
    details: cleanDetails,
    category
  };

  const updated = [newEntry, ...logs];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('activity-log-updated', { detail: newEntry }));

  // Broadcast to all other open sessions
  if (window.__activityChannel) {
    window.__activityChannel.send({
      type: 'broadcast',
      event: 'activity-log-entry',
      payload: { entry: newEntry }
    }).catch(() => {});
  }

  return newEntry;
};

export const clearActivityLogs = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('activity-log-updated'));
};

// Aliases for backwards compatibility
export const getAuditLogs = getActivityLogs;
export const logAuditEvent = logActivityEvent;
export const clearAuditLogs = clearActivityLogs;

