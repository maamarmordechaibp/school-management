import { supabase } from '@/lib/customSupabaseClient';

export const logActivity = async (action, details, entityType = null, entityId = null) => {
  try {
    await supabase.from('activity_logs').insert([{
      action,
      details,
      entity_type: entityType,
      entity_id: entityId
    }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};