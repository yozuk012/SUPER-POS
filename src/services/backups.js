import * as XLSX from 'xlsx';
import { buildBackupWorkbook, buildImportErrorFile } from '@/lib/backupWorkbook';
import { readProductImport, mapProductImportRow } from '@/lib/backupImport';
import { downloadBlob } from '@/lib/download';
import { getBackupMetadata, loadBackupData, uploadBackup, recordBackup, upsertImportedProduct, getBackupBlob } from '@/repositories/backups';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function downloadBackup(filePath, downloadName) {
  const blob = await getBackupBlob(filePath);
  downloadBlob(blob, downloadName || filePath.split('/').pop() || 'backup.xlsx');
}

export async function exportBackup({ storeId, userId, storeName, scope, dateFrom, dateTo }) {
  if (!storeId || !userId) throw new Error('Toko aktif atau pengguna belum tersedia. Silakan pilih toko terlebih dahulu.');
  const [metadata, data] = await Promise.all([
    getBackupMetadata(storeId, userId), loadBackupData(scope, storeId, dateFrom, dateTo),
  ]);
  const { workbook, downloadName, backupType } = buildBackupWorkbook({
    scope, storeId, userName: metadata.userName, storeName: metadata.storeName || storeName, dateFrom, dateTo, data,
  });
  const file = new File([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], `${downloadName}.xlsx`, { type: EXCEL_TYPE });
  const filePath = await uploadBackup(`${storeId}/${backupType}/${downloadName}_${Date.now()}.xlsx`, file);
  await recordBackup({
    store_id: storeId, user_id: userId, backup_type: backupType, file_url: filePath,
    file_size_kb: Math.round(file.size / 1024), file_format: 'xlsx', date_from: dateFrom, date_to: dateTo,
    status: 'completed', completed_at: new Date().toISOString(),
  });
  await downloadBackup(filePath, `${downloadName}.xlsx`);
  return { success: true, message: `Ekspor berhasil! File "${downloadName}.xlsx" siap diunduh.` };
}

export async function importBackup({ storeId, userId, file, scope }) {
  if (!storeId || !userId) throw new Error('Toko aktif atau pengguna belum tersedia.');
  const rows = readProductImport(await file.arrayBuffer(), scope);
  let successCount = 0;
  const errors = [];
  for (const row of rows) {
    try {
      await upsertImportedProduct(mapProductImportRow(row, storeId));
      successCount++;
    } catch (error) {
      errors.push({ SKU: row.SKU || row['SKU / Kode'] || 'N/A', 'Nama Produk': row['Nama Produk'] || '-', 'Penyebab Gagal': error.message });
    }
  }
  const archivePath = await uploadBackup(`${storeId}/IMPORT_ARCHIVES/import_${scope}_${Date.now()}.xlsx`, file);
  let errorLogPath = null;
  if (errors.length) {
    const log = new File([buildImportErrorFile(errors)], `error_log_${Date.now()}.xlsx`, { type: EXCEL_TYPE });
    errorLogPath = await uploadBackup(`${storeId}/IMPORT_LOGS/${log.name}`, log);
  }
  await recordBackup({
    store_id: storeId, user_id: userId, backup_type: `IMPORT_${scope.toUpperCase()}`, file_url: archivePath,
    file_size_kb: Math.round(file.size / 1024), file_format: 'xlsx',
    status: errors.length ? 'completed_with_errors' : 'completed',
    import_summary: { success: successCount, failed: errors.length, total: rows.length },
    error_log_url: errorLogPath, completed_at: new Date().toISOString(),
  });
  return { success: true, successCount, failedCount: errors.length, message: `Impor selesai. ${successCount} sukses, ${errors.length} gagal.` };
}