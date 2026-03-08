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

    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, name, source, subscribed_at, status')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch subscribers:', error);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    return NextResponse.json({ subscribers: subscribers || [] });
  } catch (error) {
    console.error('Subscribers route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
