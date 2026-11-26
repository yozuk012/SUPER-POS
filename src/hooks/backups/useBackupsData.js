'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { listBackups, getBackupMetadata } from '@/repositories/backups';
import { exportBackup, importBackup, downloadBackup } from '@/services/backups';

export function useBackupsData(storeId, userId) {
  const [backups, setBackups] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const revision = useRef(0);
  const invalidateRequests = useCallback(() => { revision.current++; }, []);

  const fetchBackups = useCallback(async () => {
    const currentRevision = ++revision.current;
    if (!storeId || !userId) {
      setBackups([]);
      setStoreName('');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [history, metadata] = await Promise.all([listBackups(storeId), getBackupMetadata(storeId, userId)]);
      if (currentRevision !== revision.current) return;
      setBackups(history);
      setStoreName(metadata.storeName);
    } catch (error) {
      if (currentRevision === revision.current) setError('Gagal memuat riwayat backup: ' + error.message);
    } finally {
      if (currentRevision === revision.current) setIsLoading(false);
    }
  }, [storeId, userId]);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchBackups(); }, 0);
    return () => { invalidateRequests(); clearTimeout(timer); };
  }, [fetchBackups, invalidateRequests]);

  const handleExport = async (scope, dateFrom = null, dateTo = null) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await exportBackup({ storeId, userId, storeName, scope, dateFrom, dateTo });
      await fetchBackups();
      return result;
    } catch (error) {
      setError('Gagal melakukan ekspor: ' + error.message);
      return { success: false, message: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (file, scope) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await importBackup({ storeId, userId, file, scope });
      await fetchBackups();
      return result;
    } catch (error) {
      setError('Gagal melakukan impor: ' + error.message);
      return { success: false, message: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadBackupFile = async (filePath, downloadName) => {
    try {
      await downloadBackup(filePath, downloadName);
    } catch (error) {
      setError('Gagal mengunduh file: ' + error.message);
    }
  };

  return { backups, storeName, isLoading, isProcessing, error, setError,
    handleExport, handleImport, downloadBackupFile, refreshBackups: fetchBackups };
}
