import { EditorBox } from '@/app/components/JsonEditor/types';

const DB_NAME = 'json-editor-db';
const DB_VERSION = 1;
const STORE_NAME = 'editor-boxes';
const BOXES_KEY = 'json-editor-boxes';

/**
 * Opens or creates the IndexedDB database
 * @returns Promise with IDBDatabase
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * Saves editor boxes to IndexedDB
 * @param boxes Array of editor boxes to save
 * @returns Promise that resolves when save is complete
 */
export const saveBoxes = async (boxes: EditorBox[]): Promise<void> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put(boxes, BOXES_KEY);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error('IndexedDB save error:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.warn('Failed to save boxes to IndexedDB:', error);
    // Don't throw - gracefully degrade if IndexedDB fails
  }
};

/**
 * Loads editor boxes from IndexedDB
 * @returns Promise with array of editor boxes or null if not found
 */
export const loadBoxes = async (): Promise<EditorBox[] | null> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(BOXES_KEY);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        console.error('IndexedDB load error:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.warn('Failed to load boxes from IndexedDB:', error);
    return null;
  }
};

/**
 * Clears editor boxes from IndexedDB
 * @returns Promise that resolves when clear is complete
 */
export const clearBoxes = async (): Promise<void> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(BOXES_KEY);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error('IndexedDB clear error:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.warn('Failed to clear boxes from IndexedDB:', error);
    // Don't throw - gracefully degrade if IndexedDB fails
  }
};

/**
 * Migrates boxes from localStorage to IndexedDB
 * This is called once on first load to migrate existing data
 * @param localStorageKey The localStorage key to migrate from
 * @returns Promise with migrated boxes or null
 */
export const migrateFromLocalStorage = async (
  localStorageKey: string
): Promise<EditorBox[] | null> => {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const stored = localStorage.getItem(localStorageKey);
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);
    const boxes = data.boxes as EditorBox[];
    
    if (boxes && Array.isArray(boxes)) {
      // Save to IndexedDB
      await saveBoxes(boxes);
      console.log('Migrated boxes from localStorage to IndexedDB');
      return boxes;
    }

    return null;
  } catch (error) {
    console.warn('Failed to migrate from localStorage:', error);
    return null;
  }
};

