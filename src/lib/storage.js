/**
 * Dual-driver persistence.
 *
 * The app runs on localStorage out of the box so a live demo can never fail on
 * a network or auth error. If VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are
 * present, the Supabase driver is used transparently — same interface, no
 * feature code changes.
 *
 * Interface: async get/set/remove. All callers must await.
 */

const NS = 'lawlink:v1'

export const drivers = {
  /** 'supabase' when configured, otherwise 'local' */
  mode:
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_SUPABASE_URL &&
    import.meta.env?.VITE_SUPABASE_ANON_KEY
      ? 'supabase'
      : 'local',
  supabaseConfigured: Boolean(
    import.meta !== 'undefined' &&
      import.meta.env?.VITE_SUPABASE_URL &&
      import.meta.env?.VITE_SUPABASE_ANON_KEY,
  ),
}

// ---------------------------------------------------------------- local driver
const memFallback = new Map()

function lsAvailable() {
  try {
    const k = '__ll_probe__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const hasLS = typeof window !== 'undefined' && lsAvailable()

const localDriver = {
  async get(key) {
    if (!hasLS) return memFallback.get(key) ?? null
    try {
      const raw = window.localStorage.getItem(`${NS}:${key}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  async set(key, value) {
    if (!hasLS) {
      memFallback.set(key, value)
      return
    }
    try {
      window.localStorage.setItem(`${NS}:${key}`, JSON.stringify(value))
    } catch {
      memFallback.set(key, value)
    }
  },
  async remove(key) {
    if (!hasLS) return
    try {
      window.localStorage.removeItem(`${NS}:${key}`)
    } catch {
      /* ignore */
    }
  },
  async clearAll() {
    if (!hasLS) return
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(`${NS}:`))
        .forEach((k) => window.localStorage.removeItem(k))
    } catch {
      /* ignore */
    }
  },
}

// -------------------------------------------------------------- supabase driver
// Lazily created so a missing key never breaks the bundle.
let sbClient = null
async function getClient() {
  if (sbClient) return sbClient
  const mod = await import('@supabase/supabase-js')
  sbClient = mod.createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
  return sbClient
}

const supabaseDriver = {
  async get(key) {
    const sb = await getClient()
    const { data, error } = await sb.from('lawlink_kv').select('value').eq('key', key).maybeSingle()
    if (error) throw error
    return data?.value ?? null
  },
  async set(key, value) {
    const sb = await getClient()
    const { error } = await sb
      .from('lawlink_kv')
      .upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) throw error
  },
  async remove(key) {
    const sb = await getClient()
    const { error } = await sb.from('lawlink_kv').delete().eq('key', key)
    if (error) throw error
  },
  async clearAll() {
    // Supabase driver keeps only this device's rows keyed by uid-less local key.
    const sb = await getClient()
    const { error } = await sb.from('lawlink_kv').delete().neq('key', '___never___')
    if (error) throw error
  },
}

// ------------------------------------------------------------------- selection
// Prefer Supabase, but degrade to local silently on any failure so the demo
// keeps running. A one-time notice is surfaced by the store.
let supabaseHealthy = drivers.supabaseConfigured

export async function storeGet(key) {
  if (supabaseHealthy) {
    try {
      return await supabaseDriver.get(key)
    } catch (err) {
      console.warn('[lawlink] supabase read failed, using local storage', err)
      supabaseHealthy = false
    }
  }
  return localDriver.get(key)
}

export async function storeSet(key, value) {
  if (supabaseHealthy) {
    try {
      await supabaseDriver.set(key, value)
      // Mirror locally as a write-through cache for instant hydration.
      localDriver.set(key, value)
      return
    } catch (err) {
      console.warn('[lawlink] supabase write failed, using local storage', err)
      supabaseHealthy = false
    }
  }
  return localDriver.set(key, value)
}

export async function storeRemove(key) {
  if (supabaseHealthy) {
    try {
      await supabaseDriver.remove(key)
    } catch {
      /* ignore */
    }
  }
  return localDriver.remove(key)
}

export async function storeClearAll() {
  try {
    await supabaseDriver.clearAll()
  } catch {
    /* ignore */
  }
  supabaseHealthy = drivers.supabaseConfigured
  return localDriver.clearAll()
}

export const backendLabel = () =>
  supabaseHealthy ? 'Supabase (cloud)' : drivers.supabaseConfigured ? 'Local (cloud unreachable)' : 'Local device'
export const isCloud = () => supabaseHealthy
