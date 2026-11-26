import { supabase } from '@/lib/supabase';

export async function getCategoriesByStoreIds(storeIds) {
	if (!Array.isArray(storeIds) || storeIds.length === 0) return [];

	const { data, error } = await supabase
		.from('categories')
		.select('id, name, store_id')
		.in('store_id', storeIds)
		.order('name', { ascending: true });

	if (error) throw error;
	return data || [];
}
