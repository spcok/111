// ============================================================================
// File: src/services/baseService.ts
// ============================================================================
import { getDB } from '../lib/db';
import { queryClient } from '../lib/queryClient';
import type { TableName } from '../lib/queries';

export interface UpsertAction {
  table: TableName;
  payload: any;
  queryKey?: any[];
}

export const baseService = {
  async upsert(action: UpsertAction): Promise<void> {
    const db = await getDB();
    const vault = db[action.table];
    if (!vault) throw new Error(`Vault not found: ${action.table}`);

    const payload = {
      ...action.payload,
      id: action.payload.id || crypto.randomUUID(),
      updated_at: new Date().toISOString()
    };

    // 1. Write directly to the local offline vault. 
    // RxDB's replication plugin will detect this and background-sync it to Supabase.
    await vault.upsert(payload);

    // 2. Trigger UI Refresh
    if (action.queryKey) {
      queryClient.invalidateQueries({ queryKey: action.queryKey });
    }
  },

  async softDelete(action: UpsertAction): Promise<void> {
    const db = await getDB();
    const vault = db[action.table];
    if (!vault) throw new Error(`Vault not found: ${action.table}`);

    const payload = {
      ...action.payload,
      is_deleted: true,
      updated_at: new Date().toISOString()
    };

    // Update the local record as deleted. RxDB handles the cloud sync.
    await vault.upsert(payload);

    if (action.queryKey) {
      queryClient.invalidateQueries({ queryKey: action.queryKey });
    }
  }
};