// Permanently deletes the calling user's account: Storage photos, then the
// auth.users record. Postgres rows (profiles / entries / photos) go with it via
// `on delete cascade`. Needs the service role, so it can't run on the client.
//
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by
// the Edge Functions runtime — nothing to configure.
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'entry-photos';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Storage `list` is one level deep, so walk `${uid}/${entryId}/…` recursively.
// Folder entries come back with `id === null`.
async function collectPaths(
  admin: ReturnType<typeof createClient>,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(prefix, { limit: pageSize, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const full = `${prefix}/${item.name}`;
      if (item.id === null) paths.push(...(await collectPaths(admin, full)));
      else paths.push(full);
    }
    if (data.length < pageSize) break;
  }
  return paths;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;

  // Identify the caller from their own JWT — never trust a uid from the body.
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Not signed in' }, 401);
  const uid = userData.user.id;

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  try {
    const paths = await collectPaths(admin, uid);
    // `remove` takes a bounded batch; chunk to stay well under any limit.
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await admin.storage.from(BUCKET).remove(paths.slice(i, i + 100));
      if (error) throw error;
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) throw deleteError;
  } catch (e) {
    console.error('delete-account failed', uid, e);
    return json({ error: 'Could not delete account' }, 500);
  }

  return json({ ok: true });
});
