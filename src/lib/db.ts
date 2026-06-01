// ============================================================================
// File: src/lib/db.ts
// CORE: RxDB with Dexie (IndexedDB) Adapter & Supabase Replication
// ============================================================================
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { supabase } from './supabase';
import { queryClient } from './queryClient'; // Import the shared brain

if (process.env.NODE_ENV === 'development') {
  import('rxdb/plugins/dev-mode').then(module => addRxPlugin(module.RxDBDevModePlugin));
}

export type StrixDatabase = any;
let dbPromise: Promise<StrixDatabase> | null = null;

const createUniversalSchema = () => ({
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    is_deleted: { type: 'boolean' },
    updated_at: { type: 'string' }
  },
  required: ['id'],
  additionalProperties: true 
});

const TABLE_NAMES = [
  'animals', 'daily_logs', 'tasks', 'feeding_schedules', 'daily_rounds',
  'operational_lists', 'internal_movements', 'external_transfers', 
  'clinical_records', 'clinical_attachments', 'clinical_schedule', 
  'medication_logs', 'isolation_logs', 'incidents', 'first_aid_logs', 
  'safety_drills', 'maintenance_tickets', 'users', 'shifts', 
  'shift_patterns', 'leave_requests', 'timesheets', 'zla_documents', 
  'organisations', 'role_permissions'
] as const;

export const getDB = async () => {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    console.log('[RxCore] Initializing Dexie Storage Adapter...');
    
    const db = await createRxDatabase({
      name: 'strixlog_rxcore',
      storage: getRxStorageDexie(),
      multiInstance: true,
      ignoreDuplicate: true 
    });

    const collectionConstructors: Record<string, any> = {};
    for (const table of TABLE_NAMES) {
      collectionConstructors[table] = {
        schema: createUniversalSchema()
      };
    }

    await db.addCollections(collectionConstructors);
    console.log('[RxCore] Local Vaults Initialized and Sealed.');

    // 1. THE REACTIVITY BRIDGE: Tell TanStack Query to redraw when data arrives
    for (const table of TABLE_NAMES) {
      db[table].$.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: [table] });
      });
    }

    // 2. Launch Native Background Replication
    for (const table of TABLE_NAMES) {
      replicateSupabase({
        replicationIdentifier: `supabase_${table}_replication`,
        collection: db[table],
        supabaseClient: supabase,
        pull: {}, 
        push: {}  
      });
    }
    
    console.log('[RxCore] Supabase Replication Matrix & UI Bridge Online.');
    return db;
  })();

  return dbPromise;
};