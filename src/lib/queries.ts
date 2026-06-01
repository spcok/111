// ============================================================================
// File: src/lib/queries.ts
// ============================================================================
import { getDB } from './db';

// Explicitly type the allowed table names mapped in RxDB
export type TableName = 'animals' | 'daily_logs' | 'tasks' | 'feeding_schedules' | 'daily_rounds' | 'operational_lists' | 'internal_movements' | 'external_transfers' | 'clinical_records' | 'clinical_attachments' | 'clinical_schedule' | 'medication_logs' | 'isolation_logs' | 'incidents' | 'first_aid_logs' | 'safety_drills' | 'maintenance_tickets' | 'users' | 'shifts' | 'shift_patterns' | 'leave_requests' | 'timesheets' | 'zla_documents' | 'organisations' | 'role_permissions';

/**
 * Universal Offline-First Read Pipeline for RxDB.
 */
export const fetchLocalTable = async <T>(tableName: TableName): Promise<T[]> => {
  try {
    const db = await getDB();
    const vault = db[tableName];
    
    if (!vault) {
      console.error(`[ReadPipeline] Vault not found for table: ${tableName}`);
      return [];
    }
    
    const docs = await vault.find().exec();
    const records = docs.map((d: any) => d.toJSON());
    
    // Filter out soft-deleted records globally at the foundation level
    return records.filter((record: any) => !record.is_deleted) as T[];
  } catch (err) {
    console.error(`[ReadPipeline] Extraction failed on ${tableName}:`, err);
    return [];
  }
};

/**
 * Helper to generate standardized TanStack Query options
 */
export const getTableQueryOptions = <T>(tableName: TableName) => ({
  queryKey: [tableName],
  queryFn: () => fetchLocalTable<T>(tableName),
  staleTime: 1000 * 60 * 15, // 15 minutes
});