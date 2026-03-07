import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// Referral code interface
interface ReferralCode {
  id: string;
  code: string;
  discount_percent: number;
  discount_months: number;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

// GET - List all referral codes
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceClient();

    // Check if referral_codes table exists, if not return default codes
    const { data: codes, error } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist, return empty array
      console.log('Referral codes table not found, returning empty');
      return NextResponse.json({
        codes: [],
        message: 'Referral codes table not set up yet',
      });
    }

    return NextResponse.json({ codes: codes || [] });
  } catch (error: any) {
    console.error('Admin referral codes GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new referral code
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { code, discount_percent, discount_months, max_uses, expires_at } = body;

    if (!code || !discount_percent || !discount_months) {
      return NextResponse.json({
        error: 'Code, discount percent, and discount months required'
      }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Create or update referral code
    const { data: referralCode, error } = await supabase
      .from('referral_codes')
      .insert({
        code: code.toUpperCase(),
        discount_percent,
        discount_months,
        max_uses: max_uses || null,
        current_uses: 0,
        active: true,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Referral code creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, code: referralCode });
  } catch (error: any) {
    console.error('Admin referral code POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update referral code
export async function PATCH(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: referralCode, error } = await supabase
      .from('referral_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Referral code update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, code: referralCode });
  } catch (error: any) {
    console.error('Admin referral code PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete referral code
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { error } = await supabase
      .from('referral_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Referral code deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin referral code DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
