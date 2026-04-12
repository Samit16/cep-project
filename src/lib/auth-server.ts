import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export function createServerSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Result type for the auth check
export interface AuthResult {
  user: any;
  profile: any;
  error?: string;
  status?: number;
}

// Parses the bearer token from the request header
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Try cookie fallback for server actions/routes that might pass it
  const sbCookie = request.cookies.get('sb-uevmyvwbmxqreyukbvkq-auth-token');
  if (sbCookie) {
    return sbCookie.value;
  }
  return null;
}

// Verifies token with Supabase and returns user & profile
export async function authenticateSupabase(request: NextRequest): Promise<AuthResult> {
  const token = extractToken(request);
  if (!token) {
    return { user: null, profile: null, error: 'Missing or invalid Authorization header', status: 401 };
  }

  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, profile: null, error: 'Invalid or expired token', status: 401 };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, member_id, is_first_login, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, profile: null, error: 'User profile not found', status: 401 };
  }

  if (!profile.is_active) {
    return { user: null, profile: null, error: 'Account is deactivated', status: 403 };
  }

  // Inject full context into a single user object format identical to Fastify's implementation
  const supabaseUser = {
    id: user.id,
    email: user.email,
    role: profile.role,
    member_id: profile.member_id,
    is_first_login: profile.is_first_login,
  };

  return { user: supabaseUser, profile };
}

// Verifies token with Supabase, gets profile, and checks roles
export async function requireRole(request: NextRequest, allowedRoles: string | string[]): Promise<AuthResult> {
  const authResult = await authenticateSupabase(request);

  if (authResult.error) {
    return authResult; // Error is already formatted
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(authResult.user.role)) {
    return { user: null, profile: null, error: 'Forbidden: insufficient role', status: 403 };
  }

  return authResult;
}
