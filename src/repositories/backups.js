import { supabase } from '@/lib/supabase';

async function rows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function listBackups(storeId) {
  return rows(supabase.from('backups').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).limit(50));
}

export async function getBackupMetadata(storeId, userId) {
  const [stores, merchants] = await Promise.all([
    rows(supabase.from('stores').select('name').eq('id', storeId)),
    rows(supabase.from('merchants').select('full_name').eq('id', userId)),
  ]);
  return { storeName: stores[0]?.name || '', userName: merchants[0]?.full_name || 'Sistem' };
}

export async function loadBackupData(scope, storeId, dateFrom, dateTo) {
  const scoped = table => supabase.from(table).select('*').eq('store_id', storeId);
  if (scope === 'sales_report') {
    let query = supabase.from('sales').select('*, sale_items(*)').eq('store_id', storeId);
    if (dateFrom) query = query.gte('sale_date', dateFrom);
    if (dateTo) query = query.lte('sale_date', dateTo);
    const [sales, products] = await Promise.all([
      rows(query.order('sale_date', { ascending: false })), rows(scoped('products')),
    ]);
    return { sales, products };
  }
  if (scope === 'expenses') {
    let query = scoped('operational_expenses').order('expense_date', { ascending: false });
    if (dateFrom) query = query.gte('expense_date', dateFrom);
    if (dateTo) query = query.lte('expense_date', dateTo);
    return { expenses: await rows(query) };
  }
  if (!['full_backup', 'master_data', 'inventory'].includes(scope)) throw new Error('Jenis ekspor tidak dikenali.');
  const [products, categories, materials, inventory] = await Promise.all([
    rows(scoped('products')), rows(scoped('categories')), rows(scoped('raw_materials')), rows(scoped('inventory')),
  ]);
  const data = { products, categories, materials, inventory };
  if (scope !== 'inventory') {
    const productIds = products.map(product => product.id);
    data.recipes = productIds.length ? await rows(supabase.from('recipes').select('*').in('product_id', productIds)) : [];
    const recipeIds = data.recipes.map(recipe => recipe.id);
    data.recipeIngredients = recipeIds.length ? await rows(supabase.from('recipe_ingredients').select('*').in('recipe_id', recipeIds)) : [];
  }
  if (scope === 'full_backup') {
    data.sales = await rows(scoped('sales').order('sale_date', { ascending: false }));
    const saleIds = data.sales.map(sale => sale.id);
    data.saleItems = saleIds.length ? await rows(supabase.from('sale_items').select('*').in('sale_id', saleIds)) : [];
    data.expenses = await rows(scoped('operational_expenses'));
  }
  return data;
}

export async function uploadBackup(path, file) {
  const { data, error } = await supabase.storage.from('backups').upload(path, file, { upsert: false });
  if (error) throw error;
  return data.path;
}

export async function recordBackup(record) {
  const { error } = await supabase.from('backups').insert(record);
  if (error) throw error;
}

export async function upsertImportedProduct(product) {
  const { error } = await supabase.from('products').upsert(product, { onConflict: 'sku' });
  if (error) throw error;
}

export async function getBackupBlob(path) {
  const { data, error } = await supabase.storage.from('backups').download(path);
  if (error) throw error;
  return data;
}