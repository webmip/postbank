import { create } from 'zustand';
import { Collection, Request, RequestHistory, SavedRequest, Environment, Variable } from '../types';
import { openDB } from 'idb';

interface AppState {
  collections: Collection[];
  activeRequest: Request | null;
  history: RequestHistory[];
  savedRequests: SavedRequest[];
  environments: Environment[];
  activeEnvironment: Environment | null;
  loadCollections: () => Promise<void>;
  saveCollection: (collection: Collection) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  importPostmanCollection: (json: string) => Promise<void>;
  setActiveRequest: (request: Request | null) => void;
  addToHistory: (request: Omit<Request, 'id'>, response: any) => Promise<void>;
  saveRequest: (name: string, request: Request) => Promise<void>;
  deleteSavedRequest: (id: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  saveEnvironment: (environment: Environment) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (environment: Environment | null) => void;
  replaceVariables: (text: string) => string;
}

const DB_NAME = 'postbank-db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const initializeDB = async () => {
  if (dbInstance) return dbInstance;

  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Collections store
        if (!db.objectStoreNames.contains('collections')) {
          db.createObjectStore('collections', { keyPath: 'id' });
        }

        // History store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('timestamp', 'timestamp');
        }

        // Saved requests store
        if (!db.objectStoreNames.contains('savedRequests')) {
          db.createObjectStore('savedRequests', { keyPath: 'id' });
        }

        // Environments store
        if (!db.objectStoreNames.contains('environments')) {
          db.createObjectStore('environments', { keyPath: 'id' });
        }
      },
    });

    dbInstance = db;
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const validatePostmanCollection = (collection: any): boolean => {
  return collection?.info?.name && Array.isArray(collection.item);
};

const processPostmanRequest = (item: any): Request => {
  const request = item.request;
  return {
    id: crypto.randomUUID(),
    name: item.name,
    method: request.method as Request['method'],
    url: request.url.raw || request.url,
    headers: (request.header || []).reduce((acc: any, h: any) => ({
      ...acc,
      [h.key]: { value: h.value, enabled: true },
    }), {}),
    body: request.body?.raw || '',
  };
};

const processPostmanItems = (items: any[]): Request[] => {
  const requests: Request[] = [];
  
  const processItem = (item: any) => {
    if (item.request) {
      requests.push(processPostmanRequest(item));
    }
    if (Array.isArray(item.item)) {
      item.item.forEach(processItem);
    }
  };
  
  items.forEach(processItem);
  return requests;
};

export const useStore = create<AppState>((set, get) => ({
  collections: [],
  activeRequest: null,
  history: [],
  savedRequests: [],
  environments: [],
  activeEnvironment: null,

  loadCollections: async () => {
    try {
      const db = await initializeDB();
      const tx = db.transaction(['collections', 'history', 'savedRequests', 'environments'], 'readonly');
      
      const [collections, history, savedRequests, environments] = await Promise.all([
        tx.objectStore('collections').getAll(),
        tx.objectStore('history').index('timestamp').getAll(),
        tx.objectStore('savedRequests').getAll(),
        tx.objectStore('environments').getAll(),
      ]);

      const activeEnvId = localStorage.getItem('activeEnvironmentId');
      const activeEnvironment = activeEnvId ? environments.find(env => env.id === activeEnvId) || null : null;

      await tx.done;
      set({ 
        collections, 
        history: history.reverse(), 
        savedRequests, 
        environments, 
        activeEnvironment 
      });
    } catch (error) {
      console.error('Error loading data:', error);
      set({ 
        collections: [], 
        history: [], 
        savedRequests: [], 
        environments: [], 
        activeEnvironment: null 
      });
    }
  },

  saveCollection: async (collection: Collection) => {
    const db = await initializeDB();
    const tx = db.transaction('collections', 'readwrite');
    await tx.store.put(collection);
    const collections = await tx.store.getAll();
    await tx.done;
    set({ collections });
  },

  deleteCollection: async (id: string) => {
    const db = await initializeDB();
    const tx = db.transaction('collections', 'readwrite');
    await tx.store.delete(id);
    const collections = await tx.store.getAll();
    await tx.done;
    set({ collections });
  },

  importPostmanCollection: async (json: string) => {
    try {
      const parsed = JSON.parse(json);
      
      if (!validatePostmanCollection(parsed)) {
        throw new Error('Invalid Postman collection format');
      }

      const collection: Collection = {
        id: crypto.randomUUID(),
        name: parsed.info.name,
        requests: processPostmanItems(parsed.item),
      };

      await get().saveCollection(collection);
    } catch (error) {
      console.error('Error importing collection:', error);
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  },

  setActiveRequest: (request) => set({ activeRequest: request }),

  addToHistory: async (request, response) => {
    const db = await initializeDB();
    const tx = db.transaction('history', 'readwrite');
    const historyItem = {
      timestamp: Date.now(),
      request,
      response
    };
    
    await tx.store.add(historyItem);
    const history = await tx.store.index('timestamp').getAll();
    await tx.done;
    set({ history: history.reverse() });
  },

  saveRequest: async (name: string, request: Request) => {
    const db = await initializeDB();
    const tx = db.transaction('savedRequests', 'readwrite');
    const savedRequest: SavedRequest = {
      id: crypto.randomUUID(),
      name,
      request,
      createdAt: Date.now()
    };
    await tx.store.add(savedRequest);
    const savedRequests = await tx.store.getAll();
    await tx.done;
    set({ savedRequests });
  },

  deleteSavedRequest: async (id: string) => {
    const db = await initializeDB();
    const tx = db.transaction('savedRequests', 'readwrite');
    await tx.store.delete(id);
    const savedRequests = await tx.store.getAll();
    await tx.done;
    set({ savedRequests });
  },

  clearAllData: async () => {
    const db = await initializeDB();
    const tx = db.transaction(
      ['collections', 'history', 'savedRequests', 'environments'],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore('collections').clear(),
      tx.objectStore('history').clear(),
      tx.objectStore('savedRequests').clear(),
      tx.objectStore('environments').clear()
    ]);

    await tx.done;
    localStorage.removeItem('activeEnvironmentId');
    
    set({
      collections: [],
      history: [],
      savedRequests: [],
      environments: [],
      activeEnvironment: null,
      activeRequest: null
    });
  },

  saveEnvironment: async (environment: Environment) => {
    const db = await initializeDB();
    const tx = db.transaction('environments', 'readwrite');
    await tx.store.put(environment);
    const environments = await tx.store.getAll();
    await tx.done;
    set({ environments });
  },

  deleteEnvironment: async (id: string) => {
    const db = await initializeDB();
    const tx = db.transaction('environments', 'readwrite');
    await tx.store.delete(id);
    const environments = await tx.store.getAll();
    await tx.done;
    
    set(state => ({
      environments,
      activeEnvironment: state.activeEnvironment?.id === id ? null : state.activeEnvironment
    }));
    if (localStorage.getItem('activeEnvironmentId') === id) {
      localStorage.removeItem('activeEnvironmentId');
    }
  },

  setActiveEnvironment: (environment) => {
    if (environment) {
      localStorage.setItem('activeEnvironmentId', environment.id);
    } else {
      localStorage.removeItem('activeEnvironmentId');
    }
    set({ activeEnvironment: environment });
  },

  replaceVariables: (text: string) => {
    const { activeEnvironment } = get();
    if (!activeEnvironment || !text) return text;

    let result = text;
    const variablePattern = /\{\{([^}]+)\}\}/g;
    
    result = result.replace(variablePattern, (match, variableName) => {
      const variable = activeEnvironment.variables.find(
        v => v.enabled && v.key === variableName.trim()
      );
      return variable ? variable.value : match;
    });

    return result;
  }
}));