import { supabase } from '@/lib/supabase';
import { ActivityItem, ActivityReaction, ActivityComment, ActivityType } from '@/types/activity';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapActivity(row: Record<string, unknown>): ActivityItem {
  const actor = row.actor as Record<string, unknown> | null;
  const tradeShow = row.trade_shows as Record<string, unknown> | null;
  
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    type: row.type as ActivityType,
    actorId: row.actor_id as string | null,
    tradeShowId: row.trade_show_id as string | null,
    taskId: row.task_id as string | null,
    assetId: row.asset_id as string | null,
    title: row.title as string,
    description: row.description as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
    actor: actor ? {
      id: actor.id as string,
      fullName: actor.full_name as string | null,
      email: actor.email as string,
      avatarUrl: actor.avatar_url as string | null,
    } : undefined,
    tradeShow: tradeShow ? {
      id: tradeShow.id as string,
      name: tradeShow.name as string,
    } : undefined,
    reactionCount: row.reaction_count as number | undefined,
    commentCount: row.comment_count as number | undefined,
  };
}

function mapReaction(row: Record<string, unknown>): ActivityReaction {
  const user = row.user_profiles as Record<string, unknown> | null;
  
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    userId: row.user_id as string,
    emoji: row.emoji as string,
    createdAt: row.created_at as string,
    user: user ? {
      id: user.id as string,
      fullName: user.full_name as string | null,
      avatarUrl: user.avatar_url as string | null,
    } : undefined,
  };
}

function mapComment(row: Record<string, unknown>): ActivityComment {
  const user = row.user_profiles as Record<string, unknown> | null;
  
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    user: user ? {
      id: user.id as string,
      fullName: user.full_name as string | null,
      email: user.email as string,
      avatarUrl: user.avatar_url as string | null,
    } : undefined,
  };
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

export async function fetchActivityFeed(
  orgId: string,
  options?: { limit?: number; offset?: number; showId?: string }
): Promise<ActivityItem[]> {
  let query = supabase
    .from('activity_feed')
    .select(`
      *,
      actor:user_profiles!activity_feed_actor_id_fkey (
        id, full_name, email, avatar_url
      ),
      trade_shows (id, name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (options?.showId) {
    query = query.eq('trade_show_id', options.showId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapActivity);
}

export async function createActivity(
  orgId: string,
  actorId: string,
  type: ActivityType,
  title: string,
  options?: {
    description?: string;
    showId?: string;
    taskId?: string;
    assetId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ActivityItem> {
  const { data, error } = await supabase
    .from('activity_feed')
    .insert({
      organization_id: orgId,
      actor_id: actorId,
      type,
      title,
      description: options?.description || null,
      trade_show_id: options?.showId || null,
      task_id: options?.taskId || null,
      asset_id: options?.assetId || null,
      metadata: options?.metadata || {},
    })
    .select(`
      *,
      actor:user_profiles!activity_feed_actor_id_fkey (
        id, full_name, email, avatar_url
      ),
      trade_shows (id, name)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapActivity(data);
}

// ─── Reactions ───────────────────────────────────────────────────────────────

export async function fetchReactions(activityId: string): Promise<ActivityReaction[]> {
  const { data, error } = await supabase
    .from('activity_reactions')
    .select(`
      *,
      user_profiles (id, full_name, avatar_url)
    `)
    .eq('activity_id', activityId);

  if (error) throw new Error(error.message);
  return (data || []).map(mapReaction);
}

export async function addReaction(
  activityId: string,
  userId: string,
  emoji: string = '👍'
): Promise<ActivityReaction> {
  const { data, error } = await supabase
    .from('activity_reactions')
    .upsert({
      activity_id: activityId,
      user_id: userId,
      emoji,
    }, {
      onConflict: 'activity_id,user_id,emoji',
    })
    .select(`
      *,
      user_profiles (id, full_name, avatar_url)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapReaction(data);
}

export async function removeReaction(activityId: string, userId: string, emoji: string): Promise<void> {
  const { error } = await supabase
    .from('activity_reactions')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw new Error(error.message);
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function fetchComments(activityId: string): Promise<ActivityComment[]> {
  const { data, error } = await supabase
    .from('activity_comments')
    .select(`
      *,
      user_profiles (id, full_name, email, avatar_url)
    `)
    .eq('activity_id', activityId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapComment);
}

export async function addComment(
  activityId: string,
  userId: string,
  content: string
): Promise<ActivityComment> {
  const { data, error } = await supabase
    .from('activity_comments')
    .insert({
      activity_id: activityId,
      user_id: userId,
      content,
    })
    .select(`
      *,
      user_profiles (id, full_name, email, avatar_url)
    `)
    .single();

  if (error) throw new Error(error.message);
  return mapComment(data);
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('activity_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw new Error(error.message);
}
