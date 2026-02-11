import { supabase } from '@/lib/supabase';
import {
  BoothKit,
  KitAssignment,
  KitAvailability,
  CreateKitInput,
  UpdateKitInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  KitContentItem,
  KitConflict,
  AutoAssignResult,
  AutoAssignSuggestion,
  KitType,
} from '@/types/booth-kits';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapKit(row: Record<string, unknown>): BoothKit {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    code: row.code as string | null,
    kitType: row.kit_type as BoothKit['kitType'],
    description: row.description as string | null,
    contents: (row.contents as KitContentItem[]) || [],
    dimensions: row.dimensions as string | null,
    weightLbs: row.weight_lbs as number | null,
    status: row.status as BoothKit['status'],
    currentLocation: row.current_location as string | null,
    homeLocation: (row.home_location as string) || 'Warehouse',
    defaultShipDays: (row.default_ship_days as number) || 3,
    defaultReturnDays: (row.default_return_days as number) || 5,
    replacementValue: row.replacement_value as number | null,
    notes: row.notes as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapAssignment(row: Record<string, unknown>): KitAssignment {
  const kit = row.booth_kits as Record<string, unknown> | null;
  const show = row.tradeshows as Record<string, unknown> | null;

  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    kitId: row.kit_id as string,
    tradeshowId: row.tradeshow_id as number,
    status: row.status as KitAssignment['status'],
    assignedBy: row.assigned_by as string | null,
    assignedAt: row.assigned_at as string,
    shipDate: row.ship_date as string | null,
    arrivalDate: row.arrival_date as string | null,
    returnShipDate: row.return_ship_date as string | null,
    returnArrivalDate: row.return_arrival_date as string | null,
    outboundTracking: row.outbound_tracking as string | null,
    outboundCarrier: row.outbound_carrier as string | null,
    returnTracking: row.return_tracking as string | null,
    returnCarrier: row.return_carrier as string | null,
    aiRecommended: row.ai_recommended as boolean,
    aiRecommendationReason: row.ai_recommendation_reason as string | null,
    aiConfidence: row.ai_confidence as number | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    kit: kit
      ? {
          id: kit.id as string,
          name: kit.name as string,
          code: kit.code as string | null,
          kitType: kit.kit_type as KitType,
          status: kit.status as BoothKit['status'],
        }
      : undefined,
    tradeshow: show
      ? {
          id: show.id as number,
          name: show.name as string,
          location: show.location as string | null,
          startDate: show.start_date as string | null,
          endDate: show.end_date as string | null,
        }
      : undefined,
  };
}

function mapAvailability(row: Record<string, unknown>): KitAvailability {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    code: row.code as string | null,
    kitType: row.kit_type as KitType,
    status: row.status as BoothKit['status'],
    currentLocation: row.current_location as string | null,
    defaultShipDays: (row.default_ship_days as number) || 3,
    defaultReturnDays: (row.default_return_days as number) || 5,
    nextAssignmentShowId: row.next_assignment_show_id as number | null,
    nextAssignmentShowName: row.next_assignment_show_name as string | null,
    nextAssignmentDate: row.next_assignment_date as string | null,
    availableFrom: row.available_from as string,
  };
}

// ─── Booth Kits CRUD ─────────────────────────────────────────────────────────

export async function fetchKits(orgId: string): Promise<BoothKit[]> {
  const { data, error } = await supabase
    .from('booth_kits')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapKit);
}

export async function fetchKit(kitId: string): Promise<BoothKit | null> {
  const { data, error } = await supabase
    .from('booth_kits')
    .select('*')
    .eq('id', kitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return mapKit(data);
}

export async function createKit(
  orgId: string,
  userId: string,
  input: CreateKitInput
): Promise<BoothKit> {
  const { data, error } = await supabase
    .from('booth_kits')
    .insert({
      organization_id: orgId,
      name: input.name,
      code: input.code || null,
      kit_type: input.kitType || 'standard',
      description: input.description || null,
      contents: input.contents || [],
      dimensions: input.dimensions || null,
      weight_lbs: input.weightLbs || null,
      home_location: input.homeLocation || 'Warehouse',
      default_ship_days: input.defaultShipDays ?? 3,
      default_return_days: input.defaultReturnDays ?? 5,
      replacement_value: input.replacementValue || null,
      notes: input.notes || null,
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapKit(data);
}

export async function updateKit(
  kitId: string,
  input: UpdateKitInput
): Promise<BoothKit> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.code !== undefined) updates.code = input.code;
  if (input.kitType !== undefined) updates.kit_type = input.kitType;
  if (input.description !== undefined) updates.description = input.description;
  if (input.contents !== undefined) updates.contents = input.contents;
  if (input.dimensions !== undefined) updates.dimensions = input.dimensions;
  if (input.weightLbs !== undefined) updates.weight_lbs = input.weightLbs;
  if (input.status !== undefined) updates.status = input.status;
  if (input.currentLocation !== undefined) updates.current_location = input.currentLocation;
  if (input.homeLocation !== undefined) updates.home_location = input.homeLocation;
  if (input.defaultShipDays !== undefined) updates.default_ship_days = input.defaultShipDays;
  if (input.defaultReturnDays !== undefined) updates.default_return_days = input.defaultReturnDays;
  if (input.replacementValue !== undefined) updates.replacement_value = input.replacementValue;
  if (input.notes !== undefined) updates.notes = input.notes;

  const { data, error } = await supabase
    .from('booth_kits')
    .update(updates)
    .eq('id', kitId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapKit(data);
}

export async function deleteKit(kitId: string): Promise<void> {
  const { error } = await supabase.from('booth_kits').delete().eq('id', kitId);
  if (error) throw new Error(error.message);
}

// ─── Kit Availability ────────────────────────────────────────────────────────

export async function fetchKitAvailability(orgId: string): Promise<KitAvailability[]> {
  const { data, error } = await supabase
    .from('v_kit_availability')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAvailability);
}

// ─── Kit Assignments CRUD ────────────────────────────────────────────────────

export async function fetchAssignments(
  orgId: string,
  filters?: { kitId?: string; tradeshowId?: number; status?: KitAssignment['status'] }
): Promise<KitAssignment[]> {
  let query = supabase
    .from('kit_assignments')
    .select(`
      *,
      booth_kits (id, name, code, kit_type, status),
      tradeshows (id, name, location, start_date, end_date)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.kitId) query = query.eq('kit_id', filters.kitId);
  if (filters?.tradeshowId) query = query.eq('tradeshow_id', filters.tradeshowId);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapAssignment);
}

export async function fetchAssignmentsByShow(tradeshowId: number): Promise<KitAssignment[]> {
  const { data, error } = await supabase
    .from('kit_assignments')
    .select(`
      *,
      booth_kits (id, name, code, kit_type, status)
    `)
    .eq('tradeshow_id', tradeshowId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAssignment);
}

export async function createAssignment(
  orgId: string,
  userId: string,
  input: CreateAssignmentInput
): Promise<KitAssignment> {
  const { data, error } = await supabase
    .from('kit_assignments')
    .insert({
      organization_id: orgId,
      kit_id: input.kitId,
      tradeshow_id: input.tradeshowId,
      assigned_by: userId,
      ship_date: input.shipDate || null,
      arrival_date: input.arrivalDate || null,
      return_ship_date: input.returnShipDate || null,
      return_arrival_date: input.returnArrivalDate || null,
      notes: input.notes || null,
      ai_recommended: input.aiRecommended || false,
      ai_recommendation_reason: input.aiRecommendationReason || null,
      ai_confidence: input.aiConfidence || null,
    })
    .select(`
      *,
      booth_kits (id, name, code, kit_type, status),
      tradeshows (id, name, location, start_date, end_date)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapAssignment(data);
}

export async function updateAssignment(
  assignmentId: string,
  input: UpdateAssignmentInput
): Promise<KitAssignment> {
  const updates: Record<string, unknown> = {};

  if (input.status !== undefined) updates.status = input.status;
  if (input.shipDate !== undefined) updates.ship_date = input.shipDate;
  if (input.arrivalDate !== undefined) updates.arrival_date = input.arrivalDate;
  if (input.returnShipDate !== undefined) updates.return_ship_date = input.returnShipDate;
  if (input.returnArrivalDate !== undefined) updates.return_arrival_date = input.returnArrivalDate;
  if (input.outboundTracking !== undefined) updates.outbound_tracking = input.outboundTracking;
  if (input.outboundCarrier !== undefined) updates.outbound_carrier = input.outboundCarrier;
  if (input.returnTracking !== undefined) updates.return_tracking = input.returnTracking;
  if (input.returnCarrier !== undefined) updates.return_carrier = input.returnCarrier;
  if (input.notes !== undefined) updates.notes = input.notes;

  const { data, error } = await supabase
    .from('kit_assignments')
    .update(updates)
    .eq('id', assignmentId)
    .select(`
      *,
      booth_kits (id, name, code, kit_type, status),
      tradeshows (id, name, location, start_date, end_date)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapAssignment(data);
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('kit_assignments')
    .delete()
    .eq('id', assignmentId);
  if (error) throw new Error(error.message);
}

// ─── Conflict Detection ──────────────────────────────────────────────────────

export async function checkKitAvailability(
  kitId: string,
  startDate: string,
  endDate: string,
  excludeAssignmentId?: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_kit_available', {
    p_kit_id: kitId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_exclude_assignment_id: excludeAssignmentId || null,
  });

  if (error) throw new Error(error.message);
  return data as boolean;
}

export async function getKitConflicts(
  kitId: string,
  startDate: string,
  endDate: string,
  bufferDays: number = 7
): Promise<KitConflict[]> {
  const { data, error } = await supabase.rpc('get_kit_conflicts', {
    p_kit_id: kitId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_buffer_days: bufferDays,
  });

  if (error) throw new Error(error.message);
  
  return (data || []).map((row: Record<string, unknown>) => ({
    assignmentId: row.assignment_id as string,
    tradeshowId: row.tradeshow_id as number,
    tradeshowName: row.tradeshow_name as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    shipDate: row.ship_date as string | null,
    returnArrivalDate: row.return_arrival_date as string | null,
    overlapDays: 0, // Calculate client-side if needed
  }));
}

// ─── Auto-Assignment Algorithm ───────────────────────────────────────────────

export async function autoAssignKits(
  orgId: string,
  options?: {
    tradeshowIds?: number[];
    preferredKitTypes?: KitType[];
    bufferDays?: number;
  }
): Promise<AutoAssignResult> {
  const bufferDays = options?.bufferDays ?? 7;
  
  // 1. Fetch all kits and their availability
  const kits = await fetchKitAvailability(orgId);
  
  // 2. Fetch tradeshows that need assignment
  let showQuery = supabase
    .from('tradeshows')
    .select('id, name, location, start_date, end_date, booth_size')
    .eq('organization_id', orgId)
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true });

  if (options?.tradeshowIds?.length) {
    showQuery = showQuery.in('id', options.tradeshowIds);
  }

  const { data: shows, error: showError } = await showQuery;
  if (showError) throw new Error(showError.message);

  // 3. Fetch existing assignments
  const { data: existingAssignments } = await supabase
    .from('kit_assignments')
    .select('tradeshow_id, kit_id')
    .eq('organization_id', orgId)
    .not('status', 'in', '("cancelled","returned")');

  const assignedShowIds = new Set(
    (existingAssignments || []).map((a) => a.tradeshow_id)
  );

  // 4. Filter shows that don't have assignments yet
  const unassignedShows = (shows || []).filter(
    (show) => !assignedShowIds.has(show.id)
  );

  const suggestions: AutoAssignSuggestion[] = [];
  const unassignable: { tradeshowId: number; tradeshowName: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Track kit availability windows during assignment
  const kitWindows: Map<string, { availableFrom: Date }> = new Map();
  for (const kit of kits) {
    kitWindows.set(kit.id, { availableFrom: new Date(kit.availableFrom) });
  }

  // 5. Process each show
  for (const show of unassignedShows) {
    if (!show.start_date || !show.end_date) {
      unassignable.push({
        tradeshowId: show.id,
        tradeshowName: show.name,
        reason: 'Missing start or end date',
      });
      continue;
    }

    const showStart = new Date(show.start_date);
    const showEnd = new Date(show.end_date);
    const needByDate = new Date(showStart);
    needByDate.setDate(needByDate.getDate() - bufferDays);

    // Find best available kit
    let bestKit: KitAvailability | null = null;
    let bestScore = -1;
    let bestReason = '';
    const alternatives: { kitId: string; kitName: string; reason: string }[] = [];

    for (const kit of kits) {
      const kitWindow = kitWindows.get(kit.id)!;
      const kitAvailableFrom = kitWindow.availableFrom;

      // Check if kit is available by the time we need to ship
      if (kitAvailableFrom > needByDate) {
        alternatives.push({
          kitId: kit.id,
          kitName: kit.name,
          reason: `Not available until ${kitAvailableFrom.toISOString().split('T')[0]}`,
        });
        continue;
      }

      // Score the kit (higher is better)
      let score = 50; // Base score
      let reason = '';

      // Prefer kits that match preferred types
      if (options?.preferredKitTypes?.includes(kit.kitType)) {
        score += 20;
        reason = 'Matches preferred kit type';
      }

      // Prefer flagship for longer shows
      const showDays = Math.ceil((showEnd.getTime() - showStart.getTime()) / (1000 * 60 * 60 * 24));
      if (showDays > 3 && kit.kitType === 'flagship') {
        score += 15;
        reason = 'Flagship kit for multi-day event';
      } else if (showDays <= 2 && kit.kitType === 'compact') {
        score += 10;
        reason = 'Compact kit for short event';
      }

      // Prefer kits that become available sooner (more buffer time)
      const bufferTime = needByDate.getTime() - kitAvailableFrom.getTime();
      const bufferScore = Math.min(10, Math.floor(bufferTime / (1000 * 60 * 60 * 24)));
      score += bufferScore;

      if (score > bestScore) {
        bestScore = score;
        bestKit = kit;
        bestReason = reason || 'Best available match';
      } else if (kit.id !== bestKit?.id) {
        alternatives.push({
          kitId: kit.id,
          kitName: kit.name,
          reason: 'Lower priority score',
        });
      }
    }

    if (bestKit) {
      // Calculate return date for next window calculation
      const returnDate = new Date(showEnd);
      returnDate.setDate(returnDate.getDate() + bufferDays + (bestKit.defaultReturnDays || 5));

      // Update the kit's availability window
      kitWindows.set(bestKit.id, { availableFrom: returnDate });

      // Calculate shipping dates
      const shipDate = new Date(showStart);
      shipDate.setDate(shipDate.getDate() - (bestKit.defaultShipDays || 3));

      suggestions.push({
        tradeshowId: show.id,
        tradeshowName: show.name,
        startDate: show.start_date,
        endDate: show.end_date,
        suggestedKitId: bestKit.id,
        suggestedKitName: bestKit.name,
        suggestedKitType: bestKit.kitType,
        confidence: Math.min(1, bestScore / 100),
        reason: bestReason,
        conflicts: [], // Already checked availability
        alternativeKits: alternatives.slice(0, 3),
      });
    } else {
      unassignable.push({
        tradeshowId: show.id,
        tradeshowName: show.name,
        reason: 'No kits available for the required dates',
      });
    }
  }

  // Add warnings for tight schedules
  for (let i = 0; i < suggestions.length - 1; i++) {
    const current = suggestions[i];
    const next = suggestions[i + 1];
    if (current.suggestedKitId === next.suggestedKitId) {
      const currentEnd = new Date(current.endDate);
      const nextStart = new Date(next.startDate);
      const gap = Math.ceil((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24));
      if (gap < 10) {
        warnings.push(
          `Tight turnaround: ${current.suggestedKitName} has only ${gap} days between "${current.tradeshowName}" and "${next.tradeshowName}"`
        );
      }
    }
  }

  return { suggestions, unassignable, warnings };
}

// ─── Bulk Assignment ─────────────────────────────────────────────────────────

export async function applyAutoAssignments(
  orgId: string,
  userId: string,
  suggestions: AutoAssignSuggestion[]
): Promise<KitAssignment[]> {
  const assignments: KitAssignment[] = [];

  for (const suggestion of suggestions) {
    // Calculate shipping dates
    const startDate = new Date(suggestion.startDate);
    const endDate = new Date(suggestion.endDate);
    
    const shipDate = new Date(startDate);
    shipDate.setDate(shipDate.getDate() - 3); // Default 3 days before
    
    const returnArrival = new Date(endDate);
    returnArrival.setDate(returnArrival.getDate() + 7); // Default 7 days after

    const assignment = await createAssignment(orgId, userId, {
      kitId: suggestion.suggestedKitId,
      tradeshowId: suggestion.tradeshowId,
      shipDate: shipDate.toISOString().split('T')[0],
      returnArrivalDate: returnArrival.toISOString().split('T')[0],
      aiRecommended: true,
      aiRecommendationReason: suggestion.reason,
      aiConfidence: suggestion.confidence,
    });

    assignments.push(assignment);
  }

  return assignments;
}
