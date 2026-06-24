// client/src/hooks/useOffline.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DB_NAME = 'finbuddy_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_expenses';

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing pending expenses...');
      syncPending();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast('You are offline. Expenses will sync when reconnected.', { icon: '📵' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const count = await new Promise(res => {
        const req = store.count();
        req.onsuccess = () => res(req.result);
      });
      setPendingCount(count);
    } catch (e) { }
  };

  // Save expense offline when no internet
  const saveOffline = useCallback(async (expenseData) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = {
        ...expenseData,
        localId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString(),
        synced: false
      };
      await new Promise((res, rej) => {
        const req = store.add(entry);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
      setPendingCount(prev => prev + 1);
      toast.success('Saved offline. Will sync when online!', { icon: '💾' });
      return entry.localId;
    } catch (e) {
      toast.error('Failed to save offline');
      return null;
    }
  }, []);

  // Sync all pending expenses when back online
  const syncPending = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    let synced = 0;
    let failed = 0;

    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const all = await new Promise(res => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result);
      });

      for (const expense of all) {
        try {
          const { localId, savedAt, synced: _, ...expenseData } = expense;
          await api.post('/expenses', expenseData);

          // Remove from IndexedDB after sync
          const delTx = db.transaction(STORE_NAME, 'readwrite');
          delTx.objectStore(STORE_NAME).delete(localId);
          synced++;
        } catch (e) {
          failed++;
        }
      }

      setPendingCount(failed);
      if (synced > 0) toast.success(`✅ Synced ${synced} offline expenses!`);
      if (failed > 0) toast.error(`❌ ${failed} expenses failed to sync`);
    } catch (e) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Get all pending offline expenses
  const getPending = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      return await new Promise(res => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result);
      });
    } catch (e) { return []; }
  }, []);

  return { isOnline, pendingCount, syncing, saveOffline, syncPending, getPending };
};

export default useOffline;