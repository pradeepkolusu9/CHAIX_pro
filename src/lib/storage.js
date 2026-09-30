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

const SB_URL = import.meta.env?.VITE_SUPABASE_URL
const SB_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY

export const drivers = {
  /** 'supabase' when configured, otherwise 'local' */
  mode: SB_URL && SB_KEY ? 'supabase' : 'local',
  supabaseConfigured: Boolean(SB_URL && SB_KEY),
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

function lsSetSync(key, value) {
  if (!hasLS) {
    memFallback.set(key, value)
    return
  }
  try {
    window.localStorage.setItem(`${NS}:${key}`, JSON.stringify(value))
  } catch {
    memFallback.set(key, value)
  }
}

const DEVICE_KEY = 'deviceId'

/** Per-device id, generated once. Keys the cloud row so devices never share or wipe each other's data. */
let cachedDeviceId = null
function deviceId() {
  if (cachedDeviceId) return cachedDeviceId
  let id = null
  try {
    id = hasLS ? window.localStorage.getItem(`${NS}:${DEVICE_KEY}`) : null
  } catch {
    /* ignore */
  }
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    try {
      if (hasLS) window.localStorage.setItem(`${NS}:${DEVICE_KEY}`, id)
    } catch {
      /* ignore */
    }
  }
  cachedDeviceId = id
  return id
}
const cloudKey = (key) => `${key}:${deviceId()}`

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
    lsSetSync(key, value)
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
    memFallback.clear()
    if (!hasLS) return
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(`${NS}:`) && k !== `${NS}:${DEVICE_KEY}`)
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
  sbClient = mod.createClient(SB_URL, SB_KEY)
  return sbClient
}

const supabaseDriver = {
  async get(key) {
    const sb = await getClient()
    const { data, error } = await sb.from('lawlink_kv').select('value').eq('key', cloudKey(key)).maybeSingle()
    if (error) throw error
    return data?.value ?? null
  },
  async set(key, value) {
    const sb = await getClient()
    const { error } = await sb
      .from('lawlink_kv')
      .upsert({ key: cloudKey(key), value, updated_at: new Date().toISOString() })
    if (error) throw error
  },
  async remove(key) {
    const sb = await getClient()
    const { error } = await sb.from('lawlink_kv').delete().eq('key', cloudKey(key))
    if (error) throw error
  },
}

// ------------------------------------------------------------------- selection
// Prefer Supabase, but degrade to local silently on any failure so the demo
// keeps running. After a failure the cloud is retried once CLOUD_RETRY_MS passes.
const CLOUD_RETRY_MS = 60_000
let cloudRetryAt = 0
const cloudUp = () => drivers.supabaseConfigured && Date.now() >= cloudRetryAt
const cloudFailed = () => {
  cloudRetryAt = Date.now() + CLOUD_RETRY_MS
}
const stampOf = (v) => (v && typeof v.updatedAt === 'number' ? v.updatedAt : 0)

export async function storeGet(key) {
  const local = await localDriver.get(key)
  if (cloudUp()) {
    try {
      const cloud = await supabaseDriver.get(key)
      // Cloud missing or older than the local copy (e.g. last write never reached it): keep local.
      if (cloud && stampOf(cloud) >= stampOf(local)) return cloud
    } catch (err) {
      console.warn('[lawlink] supabase read failed, using local storage', err)
      cloudFailed()
    }
  }
  return local
}

const stamped = (value) => (value && typeof value === 'object' ? { ...value, updatedAt: Date.now() } : value)

/** Synchronous local-only write, for pagehide / visibilitychange where async work may never finish. */
export function storeSetLocalSync(key, value) {
  lsSetSync(key, stamped(value))
}

export async function storeSet(key, value) {
  const v = stamped(value)
  // Write-through cache first: the local copy is always current.
  lsSetSync(key, v)
  if (cloudUp()) {
    try {
      await supabaseDriver.set(key, v)
    } catch (err) {
      console.warn('[lawlink] supabase write failed, using local storage', err)
      cloudFailed()
    }
  }
}

export async function storeRemove(key) {
  if (cloudUp()) {
    try {
      await supabaseDriver.remove(key)
    } catch {
      /* ignore */
    }
  }
  return localDriver.remove(key)
}

export async function storeClearAll() {
  if (drivers.mode === 'supabase') {
    try {
      await supabaseDriver.remove('app') // this device's row only
    } catch {
      /* ignore */
    }
    cloudRetryAt = 0
  }
  return localDriver.clearAll()
}

export const backendLabel = () =>
  cloudUp() ? 'Supabase (cloud)' : drivers.supabaseConfigured ? 'Local (cloud unreachable)' : 'Local device'
export const isCloud = () => cloudUp()
