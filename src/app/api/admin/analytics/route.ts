import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getServiceClient } from '@/lib/admin/auth';

// GET - Get platform analytics
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const supabase = getServiceClient();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Revenue calculations (based on subscription plans)
    const { data: activeWorkspaces } = await supabase
      .from('workspaces')
      .select('subscription_plan, subscription_status')
      .eq('subscription_status', 'active');

    const planPricing: Record<string, number> = {
      starter: 97,
      growth: 197,
      scale: 497,
    };

    let mrr = 0;
    let arr = 0;
    const planBreakdown = { starter: 0, growth: 0, scale: 0 };

    activeWorkspaces?.forEach((ws) => {
      if (ws.subscription_plan && planPricing[ws.subscription_plan]) {
        const monthlyRevenue = planPricing[ws.subscription_plan];
        mrr += monthlyRevenue;
        arr += monthlyRevenue * 12;
        planBreakdown[ws.subscription_plan as keyof typeof planBreakdown]++;
      }
    });

    // User growth
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: newUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', daysAgo.toISOString());

    // Workspace stats
    const { count: totalWorkspaces } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true });

    const { count: activeSubscriptions } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const { count: trialingWorkspaces } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'trialing');

    // Lead stats
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    const { count: newLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', daysAgo.toISOString());

    // Conversation stats
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const { count: recentConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', daysAgo.toISOString());

    // Message usage
    const { data: allWorkspaces } = await supabase
      .from('workspaces')
      .select('messages_used, messages_limit');

    let totalMessagesUsed = 0;
    let totalMessagesLimit = 0;

    allWorkspaces?.forEach((ws) => {
      totalMessagesUsed += ws.messages_used || 0;
      totalMessagesLimit += ws.messages_limit || 0;
    });

    // Daily stats for charts (last 30 days)
    const dailyStats = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { count: dailyUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      const { count: dailyLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        users: dailyUsers || 0,
        leads: dailyLeads || 0,
      });
    }

    // Top workspaces by activity
    const { data: topWorkspaces } = await supabase
      .from('workspaces')
      .select(`
        id,
        name,
        messages_used,
        messages_limit,
        subscription_plan,
        users!workspaces_owner_id_fkey (
          email,
          full_name
        )
      `)
      .order('messages_used', { ascending: false })
      .limit(10);

    return NextResponse.json({
      revenue: {
        mrr,
        arr,
        planBreakdown,
      },
      users: {
        total: totalUsers || 0,
        new: newUsers || 0,
        growth: totalUsers ? ((newUsers || 0) / totalUsers * 100).toFixed(1) : '0',
      },
      workspaces: {
        total: totalWorkspaces || 0,
        active: activeSubscriptions || 0,
        trialing: trialingWorkspaces || 0,
      },
      leads: {
        total: totalLeads || 0,
        new: newLeads || 0,
      },
      conversations: {
        total: totalConversations || 0,
        recent: recentConversations || 0,
      },
      messages: {
        used: totalMessagesUsed,
        limit: totalMessagesLimit,
        usage: totalMessagesLimit ? ((totalMessagesUsed / totalMessagesLimit) * 100).toFixed(1) : '0',
      },
      dailyStats,
      topWorkspaces: topWorkspaces || [],
    });
  } catch (error: any) {
    console.error('Admin analytics GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
