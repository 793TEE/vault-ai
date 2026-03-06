import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Protected routes
  const protectedPaths = ['/dashboard', '/settings', '/leads', '/conversations', '/appointments', '/analytics'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // For now, allow all routes - auth will be checked in page components
  // This avoids complex cookie handling in middleware

  // Redirect logged-in users away from auth pages handled in page components

  return response;
}
