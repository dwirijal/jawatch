import { NextResponse } from 'next/server';
import { createCommunityCommentId } from '@/lib/community';
import type { CommunityCommentDraft, CommunityLikeDraft } from '@/lib/store';
import {
  getUnitCommunitySnapshot,
  getTitleCommunitySnapshot,
  getViewerCommunitySummary,
  saveUnitCommentForUser,
  toggleUnitLikeForUser,
} from '@/lib/server/community-activity';
import { createSupabaseServerClient } from '@/platform/supabase/server';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeLikeDraft(value: unknown): CommunityLikeDraft | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const titleId = asString((value as { titleId?: unknown }).titleId);
  const titleLabel = asString((value as { titleLabel?: unknown }).titleLabel);
  const unitId = asString((value as { unitId?: unknown }).unitId);
  const unitLabel = asString((value as { unitLabel?: unknown }).unitLabel);
  const unitHref = asString((value as { unitHref?: unknown }).unitHref);
  const mediaType = asString((value as { mediaType?: unknown }).mediaType) as CommunityLikeDraft['mediaType'] | null;

  if (!titleId || !titleLabel || !unitId || !unitLabel || !unitHref || !mediaType) {
    return null;
  }

  return {
    titleId,
    titleLabel,
    unitId,
    unitLabel,
    unitHref,
    mediaType,
  };
}

function normalizeCommentDraft(value: unknown): ({
  id: string;
  titleId: string;
  titleLabel: string;
  unitId: string;
  unitLabel: string;
  unitHref: string;
  mediaType: CommunityCommentDraft['mediaType'];
  authorName: string;
  content: string;
  parentId: string | null;
  timestamp: number;
}) | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const titleId = asString((value as { titleId?: unknown }).titleId);
  const titleLabel = asString((value as { titleLabel?: unknown }).titleLabel);
  const unitId = asString((value as { unitId?: unknown }).unitId);
  const unitLabel = asString((value as { unitLabel?: unknown }).unitLabel);
  const unitHref = asString((value as { unitHref?: unknown }).unitHref);
  const mediaType = asString((value as { mediaType?: unknown }).mediaType) as CommunityCommentDraft['mediaType'] | null;
  const authorName = asString((value as { authorName?: unknown }).authorName);
  const content = asString((value as { content?: unknown }).content);
  const rawParentId = (value as { parentId?: unknown }).parentId;
  const parentId = rawParentId == null ? null : asString(rawParentId);
  const id = asString((value as { id?: unknown }).id) ?? createCommunityCommentId();

  if (!titleId || !titleLabel || !unitId || !unitLabel || !unitHref || !mediaType || !authorName || !content) {
    return null;
  }

  return {
    id,
    titleId,
    titleLabel,
    unitId,
    unitLabel,
    unitHref,
    mediaType,
    authorName,
    content,
    parentId,
    timestamp: Date.now(),
  };
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { supabase, user: null };
  }

  return { supabase, user: data.user };
}

export async function GET(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope');

  if (scope === 'unit') {
    const titleId = asString(url.searchParams.get('titleId'));
    const unitId = asString(url.searchParams.get('unitId'));

    if (!titleId || !unitId) {
      return NextResponse.json({ message: 'Missing community identifiers' }, { status: 400 });
    }

    return NextResponse.json(await getUnitCommunitySnapshot(supabase, user.id, titleId, unitId));
  }

  if (scope === 'title') {
    const titleId = asString(url.searchParams.get('titleId'));
    const rawUnitIds = asString(url.searchParams.get('unitIds'));
    const unitIds = rawUnitIds ? rawUnitIds.split(',').map((item) => item.trim()).filter(Boolean) : [];

    if (!titleId) {
      return NextResponse.json({ message: 'Missing titleId' }, { status: 400 });
    }

    return NextResponse.json(await getTitleCommunitySnapshot(supabase, titleId, unitIds));
  }

  if (scope === 'vault') {
    return NextResponse.json(await getViewerCommunitySummary(supabase, user.id));
  }

  return NextResponse.json({ message: 'Unsupported scope' }, { status: 400 });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = asString((body as { action?: unknown }).action);

  if (action === 'toggle-like') {
    const draft = normalizeLikeDraft((body as { draft?: unknown }).draft);
    if (!draft) {
      return NextResponse.json({ message: 'Invalid like draft' }, { status: 400 });
    }

    await toggleUnitLikeForUser(supabase, user.id, draft);
    return NextResponse.json(await getUnitCommunitySnapshot(supabase, user.id, draft.titleId, draft.unitId));
  }

  if (action === 'comment') {
    const draft = normalizeCommentDraft((body as { draft?: unknown }).draft);
    if (!draft) {
      return NextResponse.json({ message: 'Invalid comment draft' }, { status: 400 });
    }

    await saveUnitCommentForUser(supabase, user.id, draft);
    return NextResponse.json(await getUnitCommunitySnapshot(supabase, user.id, draft.titleId, draft.unitId));
  }

  return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
}
