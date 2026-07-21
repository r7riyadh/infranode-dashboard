import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'operator-accounts-list';
const SYSTEM_CONFIG_NAME = '__OPERATORS_CONFIG__';

const INITIAL_OPERATORS = [
  { id: 'op-1', username: 'meaw', password: 'meaw', role: 'employee', createdAt: '2026-07-20' }
];

export const getOperators = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OPERATORS));
      return INITIAL_OPERATORS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading operators', err);
    return INITIAL_OPERATORS;
  }
};

export const fetchOperatorsFromDB = async () => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('name', SYSTEM_CONFIG_NAME);

    if (!error && data && data.length > 0) {
      const dbNotes = data[0].notes;
      if (dbNotes) {
        const match = dbNotes.match(/\[OP_LIST:(.*?)\]/s) || [null, dbNotes];
        const parsed = JSON.parse(match[1] || dbNotes);
        if (Array.isArray(parsed)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('operators-updated'));
          return parsed;
        }
      }
    } else {
      await saveOperatorsToDB(INITIAL_OPERATORS);
    }
  } catch (err) {
    console.warn('Supabase operators fetch error:', err);
  }
  return getOperators();
};

const saveOperatorsToDB = async (operatorsList) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(operatorsList));
  window.dispatchEvent(new CustomEvent('operators-updated'));
  notifyOperatorSync(operatorsList);

  try {
    const payloadNotes = `[OP_LIST:${JSON.stringify(operatorsList)}]`;
    const { data } = await supabase.from('assets').select('id').eq('name', SYSTEM_CONFIG_NAME);
    
    if (data && data.length > 0) {
      await supabase.from('assets').update({ notes: payloadNotes }).eq('id', data[0].id);
    } else {
      await supabase.from('assets').insert([{
        name: SYSTEM_CONFIG_NAME,
        category: 'System',
        status: 'Active',
        asset_tag: 'TAG-SYS-OPS',
        location: 'System Core',
        assigned_to: 'Master Admin',
        notes: payloadNotes
      }]);
    }
  } catch (err) {
    console.warn('Supabase operators save error:', err);
  }
};

if (typeof window !== 'undefined' && !window.__operatorChannelInitialized) {
  window.__operatorChannelInitialized = true;
  fetchOperatorsFromDB();
  const channel = supabase.channel('sync-operators-room');
  channel.on('broadcast', { event: 'sync-operators' }, (payload) => {
    if (payload?.payload?.operators && Array.isArray(payload.payload.operators)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.payload.operators));
        window.dispatchEvent(new CustomEvent('operators-updated'));
      } catch (e) {}
    }
  }).subscribe();
}

const notifyOperatorSync = (operatorsList) => {
  try {
    const channel = supabase.channel('sync-operators-room');
    channel.send({
      type: 'broadcast',
      event: 'sync-operators',
      payload: { operators: operatorsList || getOperators() }
    }).catch(() => {});
  } catch (e) {}
};

export const addOperator = async (username, password, role = 'employee') => {
  const list = getOperators();
  const cleanName = username.trim();
  const cleanPass = password.trim();

  if (cleanName.toLowerCase() === 'admin') {
    throw new Error('"admin" username is reserved for Master Administrator');
  }
  if (list.some(op => op.username.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error('Operator username already exists');
  }

  const newOp = {
    id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    username: cleanName,
    password: cleanPass,
    role,
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updated = [...list, newOp];
  await saveOperatorsToDB(updated);
  return newOp;
};

export const deleteOperator = async (idOrUsername) => {
  const list = getOperators();
  const updated = list.filter(
    op => String(op.id) !== String(idOrUsername) && String(op.username).toLowerCase() !== String(idOrUsername).toLowerCase()
  );
  await saveOperatorsToDB(updated);
  return updated;
};

export const verifyCredentials = (username, password) => {
  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (cleanUser === 'admin' && cleanPass === 'admin') {
    return {
      username: 'admin',
      email: 'admin',
      role: 'admin'
    };
  }

  const list = getOperators();
  const match = list.find(
    op => op.username.toLowerCase() === cleanUser.toLowerCase() && op.password === cleanPass
  );

  if (match) {
    return {
      username: match.username,
      email: match.username,
      role: match.role || 'employee'
    };
  }

  return null;
};
