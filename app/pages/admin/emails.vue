<script setup lang="ts">
interface Entry {
  id: string
  timestamp: string
  bookingId: string | null
  channel: string
  recipient: string
  eventType: string
}

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Emails', robots: 'noindex, nofollow' })

const { t, locale } = useAdminT()
const token = inject<Ref<string>>('adminToken')!
const entries = ref<Entry[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 50
const loading = ref(true)
const loaded = ref(false)
const errorMessage = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const offset = (page.value - 1) * pageSize
    const res = await $fetch<{ entries: Entry[], total: number }>(`/api/admin/emails?limit=${pageSize}&offset=${offset}`, { headers: { 'x-admin-token': token.value } })
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
const rangeStart = computed(() => total.value === 0 ? 0 : (page.value - 1) * pageSize + 1)
const rangeEnd = computed(() => Math.min(page.value * pageSize, total.value))

type Tone = 'gold' | 'gold-soft' | 'orange' | 'emerald' | 'blue' | 'red' | 'muted'

function eventTone(type: string): Tone {
  if (type.includes('delivered')) return 'gold'
  if (type.includes('sent')) return 'gold-soft'
  if (type.includes('bounced') || type.includes('complained')) return 'orange'
  if (type.includes('delayed')) return 'orange'
  if (type.includes('opened')) return 'emerald'
  if (type.includes('clicked')) return 'blue'
  if (type.includes('failed')) return 'red'
  return 'muted'
}

function toneClass(tone: Tone): string {
  switch (tone) {
    case 'gold': return 'bg-gold-soft border-gold text-gold'
    case 'gold-soft': return 'border-gold-soft text-gold/80'
    case 'orange': return 'border-orange-400/40 text-orange-300 bg-orange-500/5'
    case 'emerald': return 'border-emerald-400/40 text-emerald-300 bg-emerald-500/5'
    case 'blue': return 'border-sky-400/40 text-sky-300 bg-sky-500/5'
    case 'red': return 'border-red-400/40 text-red-300 bg-red-500/5'
    default: return 'border-white/15 text-white/60'
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
      <div class="eyebrow mb-4">{{ t('emails.eyebrow') }}</div>
      <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
        {{ t('emails.title') }}
      </h1>
      <p class="mt-2 text-sm text-white/55 italic font-serif">
        {{ t('emails.heroSubtitle') }}
      </p>
      <div class="mt-6 h-px w-16 bg-[var(--color-accent-gold)] opacity-80"></div>
    </section>

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">{{ errorMessage }}</p>

    <section class="relative editorial-in" style="animation-delay: 60ms;">
      <div v-if="loading && !loaded" class="py-4">
        <AdminSkeleton variant="row" :count="8" />
      </div>

      <template v-else-if="entries.length > 0">
        <div class="hidden md:grid grid-cols-[180px_160px_1fr_140px_140px] gap-4 px-2 pb-3 border-b border-white/10">
          <div class="eyebrow text-white/40">{{ t('emails.columnWhen') }}</div>
          <div class="eyebrow text-white/40">{{ t('emails.columnEvent') }}</div>
          <div class="eyebrow text-white/40">{{ t('emails.columnRecipient') }}</div>
          <div class="eyebrow text-white/40">{{ t('emails.columnChannel') }}</div>
          <div class="eyebrow text-white/40">{{ t('emails.columnBooking') }}</div>
        </div>

        <ul class="divide-y divide-white/[0.05]">
          <li
            v-for="(e, i) in entries"
            :key="e.id"
            class="grid grid-cols-1 md:grid-cols-[180px_160px_1fr_140px_140px] gap-2 md:gap-4 px-2 py-4 hover:bg-white/[0.02] transition-colors editorial-in"
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
              <span
                class="inline-block text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-0.5 border rounded-sm"
                :class="toneClass(eventTone(e.eventType))"
              >
                {{ e.eventType }}
              </span>
            </div>

            <div class="font-serif italic text-sm text-white/75 truncate">
              {{ e.recipient }}
            </div>

            <div class="font-mono text-xs text-white/50 tabular-nums uppercase tracking-wider">
              {{ e.channel }}
            </div>

            <div class="font-mono text-xs tabular-nums">
              <NuxtLink
                v-if="e.bookingId"
                :to="`/admin/bookings/${e.bookingId}`"
                class="text-gold hover:text-[var(--color-accent-gold)] hover:underline arrow-nudge-parent"
              >
                {{ e.bookingId.slice(0, 8) }}<span class="arrow-nudge inline-block ml-1">→</span>
              </NuxtLink>
              <span v-else class="text-white/20">—</span>
            </div>
          </li>
        </ul>
      </template>

      <AdminEmptyState
        v-else
        :title="t('emails.emptyState')"
        :description="`${t('emails.emptyStateDesc')} ${t('emails.webhookInfo')}`"
      >
        <template #action>
          <AdminBaseButton variant="primary" as="a" href="https://resend.com/webhooks">
            {{ t('emails.emptyStateCta') }}
          </AdminBaseButton>
        </template>
      </AdminEmptyState>

      <div v-if="entries.length > 0" class="mt-10 flex items-center justify-between gap-4">
        <span class="text-xs text-white/40 font-mono uppercase tracking-[0.18em] tabular-nums">
          {{ t('emails.pagination', { start: rangeStart, end: rangeEnd, total }) }}
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
