import { supabase } from '@/lib/supabase';

export async function listOwnerStores(userId, { activeOnly = false, newestFirst = false } = {}) {
  if (!userId) return [];
  let query = supabase.from('stores').select('*').eq('user_id', userId);
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query.order(newestFirst ? 'created_at' : 'id', { ascending: !newestFirst });
  if (error) throw error;
  return (data || []).map(store => ({ ...store, status: store.status || (store.is_active ? 'active' : 'inactive') }));
}

export async function getOwnerStore(userId, storeId) {
  if (!userId || !storeId) return null;
  const { data, error } = await supabase.from('stores').select('*')
    .eq('user_id', userId).eq('id', storeId).maybeSingle();
  if (error) throw error;
  return data;
}