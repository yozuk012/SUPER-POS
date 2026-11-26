// Satu subscription dimiliki AuthProvider; callback auth tidak menunggu query database.
export function observeAuthSession(client, onChange) {
  let active = true;
  let revision = 0;
  let merchantUserId = null;
  let merchantPromise;

  const applySession = async (session) => {
    const currentRevision = ++revision;
    const user = session?.user || null;
    try {
      if (!user) {
        merchantUserId = null;
        merchantPromise = null;
        if (active) onChange({ user: null, merchant: null, loading: false, error: null });
        return null;
      }
      if (merchantUserId !== user.id || !merchantPromise) {
        merchantUserId = user.id;
        merchantPromise = Promise.resolve(client.from('merchants').select('*').eq('id', user.id).maybeSingle());
      }
      const { data, error } = await merchantPromise;
      if (error) merchantPromise = null;
      if (active && currentRevision === revision) {
        onChange({ user, merchant: data || null, loading: false, error: error?.message || null });
      }
      return data || null;
    } catch (error) {
      merchantPromise = null;
      if (active && currentRevision === revision) {
        onChange({ user, merchant: null, loading: false, error: error.message });
      }
      return null;
    }
  };

  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => { if (active) void applySession(session); });
  });
  client.auth.getSession().then(({ data, error }) => {
    if (!active || revision !== 0) return;
    if (error) throw error;
    return applySession(data.session);
  }).catch((error) => {
    if (active && revision === 0) onChange({ user: null, merchant: null, loading: false, error: error.message });
  });

  return {
    unsubscribe() {
      active = false;
      revision++;
      subscription.unsubscribe();
    },
    refreshMerchant() {
      if (!active) return Promise.resolve(null);
      const refreshRevision = revision;
      merchantPromise = null;
      return client.auth.getSession().then(({ data, error }) => {
        if (error) throw error;
        if (!active || refreshRevision !== revision) return null;
        return applySession(data.session);
      });
    },
  };
}

export async function signOutSession(client, storage) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
  storage?.removeItem('active_store_id');
}