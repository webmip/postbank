import { create } from 'zustand';
import { Collection, Request, RequestHistory, SavedRequest, Environment, Variable, Cookie, AppState, RequestLog, UserPreferences } from '../types';
import { openDB } from 'idb';
import { validatePostmanCollection, processPostmanItems } from '../utils/collectionExporter';

const DB_NAME = 'postbank-db';
const DB_VERSION = 3;

const DEFAULT_PREFERENCES: UserPreferences = {
  enrichLogWithIP: false
};

let dbInstance: IDBDatabase | null = null;

const initializeDB = async () => {
  if (dbInstance) return dbInstance;

  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('collections')) {
          db.createObjectStore('collections', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('savedRequests')) {
          db.createObjectStore('savedRequests', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('environments')) {
          db.createObjectStore('environments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cookies')) {
          db.createObjectStore('cookies', { keyPath: ['domain', 'name'] });
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

export const useStore = create<AppState>((set, get) => ({
  collections: [],
  activeRequest: null,
  history: [],
  savedRequests: [],
  environments: [],
  activeEnvironment: null,
  cookies: {},
  requestLogs: [],
  preferences: DEFAULT_PREFERENCES,

  loadCollections: async () => {
    try {
      const db = await initializeDB();
      const tx = db.transaction(['collections', 'history', 'savedRequests', 'environments', 'cookies'], 'readonly');
      
      const [collections, history, savedRequests, environments, cookies] = await Promise.all([
        tx.objectStore('collections').getAll(),
        tx.objectStore('history').index('timestamp').getAll(),
        tx.objectStore('savedRequests').getAll(),
        tx.objectStore('environments').getAll(),
        tx.objectStore('cookies').getAll(),
      ]);

      const activeEnvId = localStorage.getItem('activeEnvironmentId');
      const activeEnvironment = activeEnvId ? environments.find(env => env.id === activeEnvId) || null : null;

      const cookiesByDomain = cookies.reduce((acc, cookie) => {
        if (!acc[cookie.domain]) {
          acc[cookie.domain] = [];
        }
        acc[cookie.domain].push(cookie);
        return acc;
      }, {} as Record<string, Cookie[]>);

      // Load preferences from localStorage
      const savedPreferences = localStorage.getItem('preferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : DEFAULT_PREFERENCES;

      await tx.done;
      set({ 
        collections, 
        history: history.reverse(), 
        savedRequests, 
        environments,
        activeEnvironment,
        cookies: cookiesByDomain,
        requestLogs: [],
        preferences
      });
    } catch (error) {
      console.error('Error loading data:', error);
      set({ 
        collections: [], 
        history: [], 
        savedRequests: [], 
        environments: [],
        activeEnvironment: null,
        cookies: {},
        requestLogs: [],
        preferences: DEFAULT_PREFERENCES
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
      ['collections', 'history', 'savedRequests', 'environments', 'cookies'],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore('collections').clear(),
      tx.objectStore('history').clear(),
      tx.objectStore('savedRequests').clear(),
      tx.objectStore('environments').clear(),
      tx.objectStore('cookies').clear()
    ]);

    await tx.done;
    localStorage.removeItem('activeEnvironmentId');
    localStorage.removeItem('preferences');
    
    set({
      collections: [],
      history: [],
      savedRequests: [],
      environments: [],
      activeEnvironment: null,
      cookies: {},
      requestLogs: [],
      preferences: DEFAULT_PREFERENCES
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
  },

  addCookie: (domain: string, cookie: Cookie) => {
    set(state => {
      const newCookies = { ...state.cookies };
      if (!newCookies[domain]) {
        newCookies[domain] = [];
      }
      
      // Update existing cookie or add new one
      const existingIndex = newCookies[domain].findIndex(c => c.name === cookie.name);
      if (existingIndex >= 0) {
        newCookies[domain][existingIndex] = cookie;
      } else {
        newCookies[domain].push(cookie);
      }

      return { cookies: newCookies };
    });
  },

  removeCookie: (domain: string, name: string) => {
    set(state => {
      const newCookies = { ...state.cookies };
      if (newCookies[domain]) {
        newCookies[domain] = newCookies[domain].filter(c => c.name !== name);
        if (newCookies[domain].length === 0) {
          delete newCookies[domain];
        }
      }
      return { cookies: newCookies };
    });
  },

  getCookiesForDomain: (domain: string) => {
    return get().cookies[domain] || [];
  },

  addRequestLog: (log: RequestLog) => {
    set(state => {
      const newLogs = [log, ...state.requestLogs].slice(0, 3); // Keep only last 3 logs
      return { requestLogs: newLogs };
    });
  },

  getRequestLogs: () => {
    return get().requestLogs;
  },

  updatePreferences: (newPreferences: Partial<UserPreferences>) => {
    set(state => {
      const preferences = {
        ...state.preferences,
        ...newPreferences
      };
      localStorage.setItem('preferences', JSON.stringify(preferences));
      return { preferences };
    });
  },

  getPreferences: () => {
    return get().preferences;
  }
}));