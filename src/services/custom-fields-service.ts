import { supabase } from '@/lib/supabase';
import { CustomFieldDefinition, CustomFieldValue, CreateFieldInput, UpdateFieldInput } from '@/types/custom-fields';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapFieldDefinition(row: Record<string, unknown>): CustomFieldDefinition {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    fieldKey: row.field_key as string,
    fieldType: row.field_type as CustomFieldDefinition['fieldType'],
    description: row.description as string | null,
    options: (row.options as string[]) || [],
    isRequired: row.is_required as boolean,
    position: row.position as number,
    section: row.section as string,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapFieldValue(row: Record<string, unknown>): CustomFieldValue {
  const field = row.custom_field_definitions as Record<string, unknown> | null;
  
  return {
    id: row.id as string,
    fieldId: row.field_id as string,
    tradeShowId: row.trade_show_id as number,
    value: row.value as string | null,
    updatedAt: row.updated_at as string,
    field: field ? mapFieldDefinition(field) : undefined,
  };
}

// ─── Field Definitions ───────────────────────────────────────────────────────

export async function fetchFieldDefinitions(orgId: string): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('position')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []).map(mapFieldDefinition);
}

export async function createFieldDefinition(
  orgId: string,
  input: CreateFieldInput
): Promise<CustomFieldDefinition> {
  // Get max position
  const { data: maxPos } = await supabase
    .from('custom_field_definitions')
    .select('position')
    .eq('organization_id', orgId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = (maxPos?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert({
      organization_id: orgId,
      name: input.name,
      field_key: input.fieldKey,
      field_type: input.fieldType,
      description: input.description || null,
      options: input.options || [],
      is_required: input.isRequired ?? false,
      section: input.section || 'custom',
      position,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapFieldDefinition(data);
}

export async function updateFieldDefinition(
  fieldId: string,
  input: UpdateFieldInput
): Promise<CustomFieldDefinition> {
  const updates: Record<string, unknown> = {};
  
  if (input.name !== undefined) updates.name = input.name;
  if (input.fieldType !== undefined) updates.field_type = input.fieldType;
  if (input.description !== undefined) updates.description = input.description;
  if (input.options !== undefined) updates.options = input.options;
  if (input.isRequired !== undefined) updates.is_required = input.isRequired;
  if (input.position !== undefined) updates.position = input.position;
  if (input.section !== undefined) updates.section = input.section;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await supabase
    .from('custom_field_definitions')
    .update(updates)
    .eq('id', fieldId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapFieldDefinition(data);
}

export async function deleteFieldDefinition(fieldId: string): Promise<void> {
  // Soft delete - just mark as inactive
  const { error } = await supabase
    .from('custom_field_definitions')
    .update({ is_active: false })
    .eq('id', fieldId);

  if (error) throw new Error(error.message);
}

// ─── Field Values ────────────────────────────────────────────────────────────

export async function fetchFieldValues(showId: string): Promise<CustomFieldValue[]> {
  const { data, error } = await supabase
    .from('custom_field_values')
    .select(`
      *,
      custom_field_definitions (*)
    `)
    .eq('trade_show_id', showId);

  if (error) throw new Error(error.message);
  return (data || []).map(mapFieldValue);
}

export async function fetchFieldValuesWithDefinitions(
  orgId: string,
  showId: string
): Promise<{ field: CustomFieldDefinition; value: string | null }[]> {
  // Get all field definitions
  const definitions = await fetchFieldDefinitions(orgId);
  
  // Get values for this show
  const values = await fetchFieldValues(showId);
  const valueMap = new Map(values.map(v => [v.fieldId, v.value]));
  
  // Combine
  return definitions.map(field => ({
    field,
    value: valueMap.get(field.id) ?? null,
  }));
}

export async function setFieldValue(
  fieldId: string,
  showId: string,
  value: string | null
): Promise<CustomFieldValue> {
  const { data, error } = await supabase
    .from('custom_field_values')
    .upsert({
      field_id: fieldId,
      trade_show_id: showId,
      value,
    }, {
      onConflict: 'field_id,trade_show_id',
    })
    .select(`
      *,
      custom_field_definitions (*)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapFieldValue(data);
}

export async function setFieldValues(
  showId: string,
  values: { fieldId: string; value: string | null }[]
): Promise<void> {
  const upserts = values.map(v => ({
    field_id: v.fieldId,
    trade_show_id: showId,
    value: v.value,
  }));

  const { error } = await supabase
    .from('custom_field_values')
    .upsert(upserts, {
      onConflict: 'field_id,trade_show_id',
    });

  if (error) throw new Error(error.message);
}

export async function deleteFieldValue(fieldId: string, showId: string): Promise<void> {
  const { error } = await supabase
    .from('custom_field_values')
    .delete()
    .eq('field_id', fieldId)
    .eq('trade_show_id', showId);

  if (error) throw new Error(error.message);
}
