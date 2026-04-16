<script setup lang="ts">
interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown> | null
}

interface AuditPayload {
  entries: AuditEntry[]
  total: number
  limit: number
  offset: number
}

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Audit log', robots: 'noindex, nofollow' })

const { t, locale } = useAdminT()
const token = inject<Ref<string>>('adminToken')!
const entries = ref<AuditEntry[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 50
const loading = ref(true)
const loaded = ref(false)
const errorMessage = ref<string | null>(null)
const actorFilter = ref<string>('all')
const actionFilter = ref<string>('all')

const filtered = computed(() => entries.value.filter((e) => {
  if (actorFilter.value !== 'all' && e.actor !== actorFilter.value) return false
  if (actionFilter.value !== 'all' && e.action !== actionFilter.value) return false
  return true
}))

const actors = computed(() => Array.from(new Set(entries.value.map(e => e.actor))).sort())
const actions = computed(() => Array.from(new Set(entries.value.map(e => e.action))).sort())

const actorChipOptions = computed(() => {
  const all = { value: 'all', label: t('audit.filterActor'), count: entries.value.length }
  const rest = actors.value.map(a => ({
    value: a,
    label: a,
    count: entries.value.filter(e => e.actor === a).length,
  }))
  return [all, ...rest]
})

const actionChipOptions = computed(() => {
  const all = { value: 'all', label: t('audit.filterAction'), count: entries.value.length }
  const rest = actions.value.map(a => ({
    value: a,
    label: humanizeAction(a),
    count: entries.value.filter(e => e.action === a).length,
  }))
  return [all, ...rest]
})

async function load() {
  loading.value = true
  try {
    const offset = (page.value - 1) * pageSize
    const res = await $fetch<AuditPayload>(`/api/admin/audit?limit=${pageSize}&offset=${offset}`, {
      headers: { 'x-admin-token': token.value },
    })
    entries.value = res.entries
    total.value = res.total
    loaded.value = true
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('common.error')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })
watch(page, () => { void load() })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

/**
 * parseMetadata — safe JSON parse: accepts null, object, or string.
 */
function parseMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return (parsed && typeof parsed === 'object') ? parsed as Record<string, unknown> : {}
    }
    catch {
      return {}
    }
  }
  return {}
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

/**
 * humanize — produce a human-readable one-line summary of an audit entry's
 * metadata, tailored per action. Falls back to a 1-2 key pretty-print.
 */
function humanize(action: string, meta: Record<string, unknown>): string {
  if (action === 'attendance.check') {
    const slot = asString(meta.slotId)
    const present = meta.present === undefined ? '' : (meta.present ? ' ✓' : ' ✗')
    return slot ? `${t('audit.metaSlot')}: ${slot}${present}` : ''
  }
  if (action === 'settings.update') {
    return t('audit.metaSettingUpdate', { key: asString(meta.key), value: asString(meta.value).slice(0, 60) })
  }
  if (action === 'email.test') {
    const lang = asString(meta.language).toUpperCase()
    return t('audit.metaEmailTest', { template: asString(meta.template), language: lang })
  }
  if (action === 'booking.create') {
    const lang = asString(meta.language).toUpperCase()
    const people = asString(meta.numberOfPeople ?? meta.guests)
    return t('audit.metaBookingCreate', {
      firstName: asString(meta.firstName),
      lastName: asString(meta.lastName),
      people,
      language: lang,
    })
  }
  if (action === 'booking.cancel') {
    const reason = asString(meta.reason)
    return reason ? t('audit.metaBookingCancelReason', { reason }) : t('audit.metaBookingCancel')
  }
  if (action === 'booking.edit' || action === 'booking.update') {
    const field = asString(meta.field)
    return field ? t('audit.metaBookingEditField', { field }) : t('audit.metaBookingEdit')
  }
  if (action === 'email.delivered' || action === 'email.bounced' || action === 'email.complained' || action === 'email.opened' || action === 'email.clicked') {
    return asString(meta.recipient ?? meta.to ?? '')
  }
  if (action === 'booking.resend') {
    return asString(meta.recipient ?? meta.email ?? '')
  }
  if (action === 'gallery.update' || action === 'gallery.contact.update') {
    return asString(meta.galleryId ?? meta.id ?? '')
  }
  if (action === 'blast.send') {
    return t('audit.metaBlastSend', { sent: asString(meta.sent ?? 0), failed: asString(meta.failed ?? 0) })
  }

  const entries = Object.entries(meta).slice(0, 2)
  if (entries.length === 0) return ''
  return entries
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' · ')
}

/**
 * humanizeAction — produce a localized label for the action badge.
 * Falls back to the raw action key if no translation exists.
 */
function humanizeAction(action: string): string {
  const key = `audit.actions.${action.replace(/\./g, '_')}`
  const translated = t(key)
  return translated === key ? action : translated
}

function actionTone(a: string): 'emerald' | 'red' | 'orange' | 'gold' | 'muted' | 'blue' {
  if (a.includes('cancel')) return 'red'
  if (a.includes('create')) return 'emerald'
  if (a.includes('email.failed') || a.includes('bounced') || a.includes('complained')) return 'orange'
  if (a.includes('opened') || a.includes('clicked')) return 'blue'
  if (a.includes('purge') || a.includes('blast')) return 'gold'
  return 'muted'
}

function toneClass(tone: ReturnType<typeof actionTone>): string {
  switch (tone) {
    case 'emerald': return 'text-emerald-300'
    case 'red': return 'text-red-300'
    case 'orange': return 'text-orange-300'
    case 'blue': return 'text-sky-300'
    case 'gold': return 'text-gold'
    default: return 'text-white/70'
  }
}

function toneDot(tone: ReturnType<typeof actionTone>): string {
  switch (tone) {
    case 'emerald': return 'bg-emerald-400/70'
    case 'red': return 'bg-red-400/70'
    case 'orange': return 'bg-orange-400/70'
    case 'blue': return 'bg-sky-400/70'
    case 'gold': return 'bg-[var(--color-accent-gold)]'
    default: return 'bg-white/30'
  }
}

const dtFormatter = computed(() => {
  const loc = locale.value === 'es' ? 'es-ES' : 'fr-FR'
  return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long' })
})
const timeFormatter = computed(() => {
  const loc = locale.value === 'es' ? 'es-ES' : 'fr-FR'
  return new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit' })
})

function formatTimestamp(iso: string): { date: string, time: string } {
  const ts = Date.parse(iso)
  if (!Number.isFinite(ts)) return { date: iso, time: '' }
  const d = new Date(ts)
  return { date: dtFormatter.value.format(d), time: timeFormatter.value.format(d) }
}
</script>

<template>
  <div class="relative">
    <div class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60" aria-hidden="true"></div>

    <section class="relative mb-10 md:mb-12 editorial-in">
      <div class="eyebrow mb-4">{{ t('audit.eyebrow') }}</div>
      <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
        {{ t('audit.title') }}
      </h1>
      <p class="mt-2 text-sm text-white/55 italic font-serif">
        {{ t('audit.heroSubtitle') }}
      </p>
      <div class="mt-6 h-px w-16 bg-[var(--color-accent-gold)] opacity-80"></div>
    </section>

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">{{ errorMessage }}</p>

    <section class="relative mb-10 editorial-in" style="animation-delay: 60ms;">
      <div class="eyebrow mb-3">{{ t('audit.filtersTitle') }}</div>
      <div class="flex flex-wrap gap-4">
        <AdminFilterChips v-model="actorFilter" :options="actorChipOptions" />
        <AdminFilterChips v-model="actionFilter" :options="actionChipOptions" />
      </div>
    </section>

    <section class="relative editorial-in" style="animation-delay: 120ms;">
      <div v-if="loading && !loaded" class="py-4">
        <AdminSkeleton variant="row" :count="8" />
      </div>

      <template v-else-if="filtered.length > 0">
        <div class="hidden md:grid grid-cols-[180px_120px_1fr_200px] gap-4 px-2 pb-3 border-b border-white/10">
          <div class="eyebrow text-white/40">{{ t('audit.columnWhen') }}</div>
          <div class="eyebrow text-white/40">{{ t('audit.columnActor') }}</div>
          <div class="eyebrow text-white/40">{{ t('audit.columnAction') }}</div>
          <div class="eyebrow text-white/40">{{ t('audit.columnTarget') }}</div>
        </div>

        <ul class="divide-y divide-white/[0.05]">
          <li
            v-for="(e, i) in filtered"
            :key="e.id"
            class="grid grid-cols-1 md:grid-cols-[180px_120px_1fr_200px] gap-2 md:gap-4 px-2 py-4 hover:bg-white/[0.02] transition-colors editorial-in"
            :style="{ animationDelay: `${Math.min(i * 24, 400)}ms` }"
          >
            <div class="flex items-baseline gap-2 md:block">
              <span class="font-serif italic text-sm text-white/75">
                {{ formatTimestamp(e.timestamp).date }}
              </span>
              <span class="hidden md:inline text-white/20 mx-1">·</span>
              <span class="font-serif italic text-sm text-white/50 tabular-nums">
                {{ formatTimestamp(e.timestamp).time }}
              </span>
            </div>

            <div>
              <span class="inline-block px-2 py-0.5 border border-white/15 text-[10px] text-white/70 font-mono uppercase tracking-[0.18em] rounded-sm">
                {{ e.actor }}
              </span>
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  :class="toneDot(actionTone(e.action))"
                  aria-hidden="true"
                />
                <span
                  class="font-serif text-base"
                  :class="toneClass(actionTone(e.action))"
                  :title="e.action"
                >
                  {{ humanizeAction(e.action) }}
                </span>
              </div>
              <p
                v-if="humanize(e.action, parseMetadata(e.metadata))"
                class="font-serif italic text-sm text-white/45 pl-4"
              >
                {{ humanize(e.action, parseMetadata(e.metadata)) }}
              </p>
            </div>

            <div class="font-mono text-xs text-white/40 tabular-nums self-start">
              <span v-if="e.targetType">{{ e.targetType }}/</span>
              <span v-if="e.targetId">{{ e.targetId.slice(0, 8) }}</span>
            </div>
          </li>
        </ul>
      </template>

      <AdminEmptyState v-else :title="t('audit.emptyState')" :description="t('audit.emptyStateDesc')">
        <template #action>
          <AdminBaseButton variant="primary" as="nuxt-link" to="/admin">
            {{ t('audit.emptyStateCta') }}
          </AdminBaseButton>
        </template>
      </AdminEmptyState>

      <div v-if="filtered.length > 0" class="mt-10 flex items-center justify-between gap-4">
        <span class="text-xs text-white/40 font-mono uppercase tracking-[0.18em] tabular-nums">
          {{ filtered.length }} / {{ entries.length }}
        </span>
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="arrow-nudge-parent text-gold text-sm uppercase tracking-[0.18em] font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-gold"
            :disabled="page <= 1"
            @click="page--"
          >
            <span class="arrow-nudge inline-block mr-1">←</span>
          </button>
          <span class="font-serif italic text-sm text-white/60 tabular-nums">
            {{ t('audit.pageLabel', { page, totalPages }) }}
          </span>
          <button
            type="button"
            class="arrow-nudge-parent text-gold text-sm uppercase tracking-[0.18em] font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-gold"
            :disabled="page >= totalPages"
            @click="page++"
          >
            <span class="arrow-nudge inline-block ml-1">→</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
