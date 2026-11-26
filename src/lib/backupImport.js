import * as XLSX from 'xlsx';

export function readProductImport(buffer, scope = 'master_data') {
  if (scope !== 'master_data') throw new Error('Jenis impor belum didukung.');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('produk')) || workbook.SheetNames[0];
  const rows = sheetName ? XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) : [];
  if (rows.length === 0) throw new Error('File Excel kosong atau format salah.');
  return rows;
}

export function mapProductImportRow(row, storeId) {
  const name = row['Nama Produk'];
  const sku = row.SKU ?? row['SKU / Kode'];
  if (!name || !sku) throw new Error('Nama produk atau SKU kosong');
  const yes = ['ya', 'aktif', 'true', '1'];
  return {
    store_id: storeId,
    name,
    sku,
    base_price: Number(row['Harga Jual (Rp)'] ?? row['Harga Base'] ?? 0) || 0,
    hpp: Number(row['HPP (Rp)'] ?? 0) || 0,
    unit: row.Satuan || 'pcs',
    online_markup_pct: yes.includes(String(row['Jual Online?'] ?? '').trim().toLowerCase()) ? 25 : 0,
    is_active: yes.includes(String(row['Status Aktif'] ?? '').trim().toLowerCase()),
  };
}