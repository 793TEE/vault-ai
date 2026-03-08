export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

export async function GET() {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceClient();

    const { data: campaigns, error } = await supabase
      .from('newsletter_campaigns')
      .select('id, subject, preview_text, category, sent_at, subscriber_count')
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (error) {
    console.error('Campaigns route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
