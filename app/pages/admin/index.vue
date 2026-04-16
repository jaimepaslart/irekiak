<script setup lang="ts">
/**
 * Dashboard admin — esthétique éditoriale "invitation de musée".
 * Palette Prussian Blue + accent or, typographie Playfair Display pour les titres,
 * timelines verticales pour créneaux et activité.
 *
 * Data : /api/admin/stats + /api/admin/audit + /api/admin/emails.
 */

import type { TimelineEntry } from '~/components/admin/ActivityFeed.vue'
import type { UpcomingSlot } from '~/components/admin/UpcomingSlots.vue'

interface StatsPayload {
  totals: { bookingsCount: number, cancelledCount: number, guests: number, capacity: number, booked: number, avgFillRate: number }
  byDate: Record<string, number>
  byRoute: Record<string, number>
  byLanguage: Record<string, number>
  fillRate: Array<{ slotId: string, date: string, startTime: string, routeId: string, language: string, booked: number, max: number, rate: number }>
  recentBookings: Array<{ id: string, createdAt: string, firstName: string, lastName: string, guests: number, language: string, status: string, slotDate: string, slotStartTime: string, routeId: string }>
}

interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  targetId: string | null
}

interface EmailEvent {
  id: string
  timestamp: string
  bookingId: string | null
  channel: string
  recipient: string
  eventType: string
}

definePageMeta({ layout: 'admin', i18n: false })

const { t } = useAdminT()
const { year, startDate, endDate } = useEdition()

const dateRangeLabel = computed(() => {
  const startDay = startDate.value.slice(8, 10)
  const endDay = endDate.value.slice(8, 10)
  const month = startDate.value.slice(5, 7)
  return `${startDay}-${endDay}.${month}`
})

useSeoMeta({ title: () => t('dashboard.seoTitle'), robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!
const stats = ref<StatsPayload | null>(null)
const audit = ref<AuditEntry[]>([])
const recentEmails = ref<EmailEvent[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const [s, a, e] = await Promise.all([
      $fetch<StatsPayload>('/api/admin/stats', { headers: { 'x-admin-token': token.value } }),
      $fetch<{ entries: AuditEntry[], total: number }>('/api/admin/audit?limit=8', { headers: { 'x-admin-token': token.value } }),
      $fetch<{ entries: EmailEvent[], total: number }>('/api/admin/emails?limit=200', { headers: { 'x-admin-token': token.value } })
        .catch(() => ({ entries: [] as EmailEvent[], total: 0 })),
    ])
    stats.value = s
    audit.value = a.entries
    recentEmails.value = e.entries
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('dashboard.loadFailed')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })

const todayIso = new Date().toISOString().split('T')[0]!

const upcomingSlots = computed<UpcomingSlot[]>(() => {
  if (!stats.value) return []
  return stats.value.fillRate
    .filter(f => f.date >= todayIso)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 4)
})

interface Concern {
  key: 'lowFill' | 'bounces' | 'waitlist'
  count: number
  label: string
}

const concerns = computed<Concern[]>(() => {
  const list: Concern[] = []
  if (!stats.value) return list

  const upcomingAll = stats.value.fillRate.filter(f => f.date >= todayIso && f.max > 0)
  const lowFillSlots = upcomingAll.filter(f => f.rate < 30).length
  if (lowFillSlots > 0) {
    list.push({
      key: 'lowFill',
      count: lowFillSlots,
      label: t('dashboard.concernLowFill', { count: lowFillSlots }),
    })
  }

  const since = Date.now() - 24 * 60 * 60 * 1000
  const recentBounces = recentEmails.value.filter((e) => {
    if (!(e.eventType.includes('bounced') || e.eventType.includes('complained'))) return false
    const ts = Date.parse(e.timestamp)
    return Number.isFinite(ts) && ts >= since
  }).length
  if (recentBounces > 0) {
    list.push({
      key: 'bounces',
      count: recentBounces,
      label: t('dashboard.concernBounces', { count: recentBounces }),
    })
  }

  const waitlistCount = stats.value.recentBookings.filter(b => b.status === 'waitlist').length
  if (waitlistCount > 0) {
    list.push({
      key: 'waitlist',
      count: waitlistCount,
      label: t('dashboard.concernWaitlist', { count: waitlistCount }),
    })
  }

  return list
})

const languageBreakdown = computed(() => {
  if (!stats.value) return '—'
  const entries = Object.entries(stats.value.byLanguage)
  if (entries.length === 0) return '—'
  return entries.map(([l, n]) => `${l.toUpperCase()} ${n}`).join(' · ')
})

const placesLabel = (booked: number, total: number) =>
  t('dashboard.placesOf', { booked, total })

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!))
}

function lookupBooking(targetId: string | null) {
  if (!targetId || !stats.value) return null
  return stats.value.recentBookings.find(b => b.id === targetId) ?? null
}

function humanizeActor(actor: string): string {
  const key = actor === 'admin' || actor === 'visitor' || actor === 'system' || actor === 'cron' ? actor : null
  if (key) return t(`dashboard.actor.${key}`)
  return actor
}

const humanizedAudit = computed<TimelineEntry[]>(() => {
  return audit.value.slice(0, 8).map((a): TimelineEntry => {
    const booking = lookupBooking(a.targetId)
    const actorLabel = humanizeActor(a.actor)

    if (a.action === 'booking.create') {
      if (booking) {
        const name = escapeHtml(`${booking.firstName} ${booking.lastName}`.trim())
        const key = booking.guests === 1 ? 'dashboard.humanized.bookingCreateOne' : 'dashboard.humanized.bookingCreateMany'
        return {
          id: a.id,
          glyph: '+',
          tone: 'emerald',
          text: t(key, { name, count: booking.guests }),
          actor: actorLabel,
          timestamp: a.timestamp,
          link: `/admin/bookings/${booking.id}`,
        }
      }
      return {
        id: a.id,
        glyph: '+',
        tone: 'emerald',
        text: t('dashboard.humanized.bookingCreateAnonOne', { count: 1 }),
        actor: actorLabel,
        timestamp: a.timestamp,
        link: a.targetId ? `/admin/bookings/${a.targetId}` : undefined,
      }
    }

    if (a.action === 'booking.cancel') {
      return {
        id: a.id,
        glyph: '×',
        tone: 'orange',
        text: t('dashboard.humanized.bookingCancel'),
        actor: actorLabel,
        timestamp: a.timestamp,
        link: a.targetId ? `/admin/bookings/${a.targetId}` : undefined,
      }
    }

    if (a.action === 'booking.update') {
      return {
        id: a.id,
        glyph: '~',
        tone: 'gold',
        text: t('dashboard.humanized.bookingUpdate'),
        actor: actorLabel,
        timestamp: a.timestamp,
        link: a.targetId ? `/admin/bookings/${a.targetId}` : undefined,
      }
    }

    if (a.action === 'checkin.in') {
      return {
        id: a.id,
        glyph: '✓',
        tone: 'emerald',
        text: t('dashboard.humanized.checkinIn'),
        actor: actorLabel,
        timestamp: a.timestamp,
      }
    }

    if (a.action === 'checkin.out') {
      return {
        id: a.id,
        glyph: '↩',
        tone: 'muted',
        text: t('dashboard.humanized.checkinOut'),
        actor: actorLabel,
        timestamp: a.timestamp,
      }
    }

    if (a.action.startsWith('email.test')) {
      return {
        id: a.id,
        glyph: '✉',
        tone: 'blue',
        text: t('dashboard.humanized.emailTest'),
        actor: actorLabel,
        timestamp: a.timestamp,
      }
    }

    if (a.action.startsWith('email.blast') || a.action.startsWith('blast')) {
      return {
        id: a.id,
        glyph: '✉',
        tone: 'blue',
        text: t('dashboard.humanized.emailBlast'),
        actor: actorLabel,
        timestamp: a.timestamp,
        link: '/admin/blast',
      }
    }

    if (a.action.startsWith('settings')) {
      return {
        id: a.id,
        glyph: '⚙',
        tone: 'muted',
        text: t('dashboard.humanized.settingsUpdate'),
        actor: actorLabel,
        timestamp: a.timestamp,
        link: '/admin/settings',
      }
    }

    if (a.action.startsWith('gallery')) {
      return {
        id: a.id,
        glyph: '◉',
        tone: 'gold',
        text: t('dashboard.humanized.galleryUpdate'),
        actor: actorLabel,
        timestamp: a.timestamp,
        link: '/admin/galleries',
      }
    }

    return {
      id: a.id,
      glyph: '·',
      tone: 'muted',
      text: t('dashboard.humanized.generic', { action: a.action }),
      actor: actorLabel,
      timestamp: a.timestamp,
    }
  })
})
</script>

<template>
  <div class="relative max-w-5xl mx-auto">
    <div class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60" aria-hidden="true"></div>

    <section class="relative mb-10 md:mb-14 editorial-in">
      <div class="eyebrow mb-4">
        {{ t('dashboard.editionTag', { year }) }}
      </div>
      <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
        {{ t('dashboard.welcome') }}
      </h1>
      <p class="mt-2 text-sm text-white/55 tabular-nums">
        {{ t('dashboard.editionDates') }} · <span class="italic font-serif">{{ t('dashboard.editionCity') }}</span>
      </p>
      <div class="mt-6 h-px w-24 bg-[var(--color-accent-gold)] opacity-50"></div>
    </section>

    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>

    <section
      v-if="concerns.length > 0"
      class="relative mb-10 border border-orange-400/30 bg-orange-500/[0.06] rounded-sm px-5 py-4 editorial-in"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start gap-4">
        <span class="mt-0.5 w-8 h-8 rounded-full border border-orange-400/40 bg-orange-500/10 flex items-center justify-center text-orange-300 text-sm shrink-0" aria-hidden="true">⚠</span>
        <div class="flex-1 min-w-0">
          <p class="eyebrow mb-2" style="color: rgb(253 186 116);">
            {{ t('dashboard.concernsTitle') }}
          </p>
          <ul class="space-y-1">
            <li v-for="c in concerns" :key="c.key" class="text-sm text-orange-100/90">
              {{ c.label }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <template v-if="loading && !stats">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
        <div class="md:col-span-2"><AdminSkeleton variant="stat" :count="1" /></div>
        <div class="md:col-span-3 grid grid-cols-3 gap-3">
          <AdminSkeleton variant="stat" :count="3" />
        </div>
      </div>
      <section class="mb-12">
        <div class="h-5 w-40 bg-white/10 rounded mb-6 animate-pulse"></div>
        <AdminSkeleton variant="row" :count="4" />
      </section>
      <section class="mb-12">
        <div class="h-5 w-40 bg-white/10 rounded mb-6 animate-pulse"></div>
        <AdminSkeleton variant="row" :count="6" />
      </section>
    </template>

    <template v-if="stats">
      <section class="mb-14 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="md:col-span-2">
          <AdminHeroStatCard
            :eyebrow="t('dashboard.editionTag', { year })"
            :label="t('dashboard.fillRateMain')"
            :value="stats.totals.avgFillRate"
            unit="%"
            :progress="stats.totals.avgFillRate"
            :progress-label="t('dashboard.placesOf', { booked: stats.totals.booked, total: stats.totals.capacity })"
            :caption="t('dashboard.fillRateCaption')"
          />
        </div>
        <div class="md:col-span-3 grid grid-cols-3 gap-3">
          <AdminMiniStatCard
            :eyebrow="t('dashboard.statBookings')"
            :value="stats.totals.bookingsCount"
            :subtitle="t('dashboard.statCancelled', { count: stats.totals.cancelledCount })"
            :delay="80"
          />
          <AdminMiniStatCard
            :eyebrow="t('dashboard.statParticipants')"
            :value="stats.totals.guests"
            :subtitle="t('dashboard.statCapacityOf', { capacity: stats.totals.capacity })"
            :delay="140"
          />
          <AdminMiniStatCard
            :eyebrow="t('dashboard.statLanguages')"
            :value="languageBreakdown"
            :delay="200"
          />
        </div>
      </section>

      <section class="mb-14">
        <header class="flex items-baseline justify-between gap-4 mb-7">
          <div>
            <div class="eyebrow mb-2">{{ dateRangeLabel }}.{{ year }}</div>
            <h2 class="font-serif text-2xl text-white" style="font-weight: 400; letter-spacing: -0.01em;">
              {{ t('dashboard.upcomingSection') }}
            </h2>
          </div>
          <NuxtLink to="/admin/parcours" class="text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors arrow-nudge-parent">
            {{ t('dashboard.viewAll') }}
          </NuxtLink>
        </header>
        <AdminUpcomingSlots
          :slots="upcomingSlots"
          :empty-label="t('dashboard.noUpcomingSlots')"
          :full-label="t('dashboard.badgeFull')"
          :low-fill-label="t('dashboard.badgeLowFill')"
          :places-label="placesLabel"
        />
      </section>

      <section class="mb-12">
        <header class="flex items-baseline justify-between gap-4 mb-7">
          <div>
            <div class="eyebrow mb-2">Live</div>
            <h2 class="font-serif text-2xl text-white" style="font-weight: 400; letter-spacing: -0.01em;">
              {{ t('dashboard.activitySection') }}
            </h2>
          </div>
          <NuxtLink to="/admin/audit" class="text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors arrow-nudge-parent">
            {{ t('dashboard.viewAll') }}
          </NuxtLink>
        </header>
        <AdminActivityFeed
          :entries="humanizedAudit"
          :empty-label="t('dashboard.noActivity')"
          :just-now-label="t('dashboard.justNow')"
        />
      </section>
    </template>
  </div>
</template>
