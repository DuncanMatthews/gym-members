import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'
import { createClient } from './utils/supabase/server';

export async function middleware(request: NextRequest) {
  // First update the session
  const response = await updateSession(request)
  
  const supabase = await createClient();


  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  // Redirect authenticated users visiting the root to dashboard
  if (session?.user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } 
  return response
}

export const config = {
  matcher: '/'
}