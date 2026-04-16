<script setup lang="ts">
import type { TimelineEntry } from '~/components/admin/ActivityFeed.vue'

interface DetailPayload {
  booking: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    numberOfPeople: number
    language: string
    specialNeeds: string | null
    status: 'confirmed' | 'cancelled' | 'waitlist'
    confirmToken: string
    acceptsMarketing: boolean
    createdAt: string
    slotId: string
  }
  slot: { id: string, date: string, startTime: string, endTime: string, language: string, maxParticipants: number, bookedCount: number }
  route: { id: string, nameEu: string, nameEs: string, nameFr: string, nameEn: string, color: string }
  audit: Array<{ id: string, timestamp: string, actor: string, action: string, metadata: unknown }>
  attendance: { bookingId: string, checkedInAt: string, checkedInBy: string, notes: string | null } | null
}

definePageMeta({ layout: 'admin', i18n: false })

const { t, locale, formatLongDate } = useAdminT()
useSeoMeta({ title: () => t('bookings.seoTitleDetail'), robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!
const route = useRoute()
const bookingId = computed(() => String(route.params.id))

const data = ref<DetailPayload | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    data.value = await $fetch<DetailPayload>(`/api/admin/bookings/${bookingId.value}`, {
      headers: { 'x-admin-token': token.value },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('bookings.loadError')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })

async function resend() {
  try {
    await $fetch(`/api/admin/bookings/${bookingId.value}/resend`, {
      method: 'POST', headers: { 'x-admin-token': token.value },
    })
    alert(t('bookings.resendSuccess'))
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? t('bookings.resendFailed'))
  }
}

function statusBadgeLabel(s: 'confirmed' | 'cancelled' | 'waitlist'): string {
  if (s === 'confirmed') return t('bookings.statusConfirmed')
  if (s === 'cancelled') return t('bookings.statusCancelled')
  return t('bookings.statusWaitlist')
}

const shortId = computed(() => bookingId.value.slice(0, 8).toUpperCase())

const routeDisplayName = computed(() => {
  if (!data.value) return ''
  const r = data.value.route
  if (locale.value === 'es') return r.nameEs
  return r.nameFr
})

const createdLongLabel = computed(() => {
  if (!data.value) return ''
  const iso = data.value.booking.createdAt
  const datePart = iso.slice(0, 10)
  const timePart = iso.length >= 16 ? iso.slice(11, 16) : ''
  try {
    const long = formatLongDate(datePart, { day: 'numeric', month: 'long', year: 'numeric' })
    return timePart ? `${long} · ${timePart}` : long
  }
  catch {
    return iso
  }
})

const slotLongLabel = computed(() => {
  if (!data.value) return ''
  try {
    return formatLongDate(data.value.slot.date, { weekday: 'long', day: 'numeric', month: 'long' })
  }
  catch {
    return data.value.slot.date
  }
})

function humanizeActor(actor: string): string {
  if (actor === 'admin') return t('bookings.detailHistoryActorAdmin')
  if (actor === 'visitor') return t('bookings.detailHistoryActorVisitor')
  if (actor === 'system') return t('bookings.detailHistoryActorSystem')
  if (actor === 'cron') return t('bookings.detailHistoryActorCron')
  return actor
}

interface AuditGlyph {
  glyph: string
  tone: TimelineEntry['tone']
  text: string
}

function actionDisplay(action: string): AuditGlyph {
  if (action === 'booking.create') return { glyph: '+', tone: 'emerald', text: t('bookings.detailHistoryActionCreate') }
  if (action === 'booking.cancel') return { glyph: '×', tone: 'orange', text: t('bookings.detailHistoryActionCancel') }
  if (action === 'booking.update' || action.includes('edit')) return { glyph: '~', tone: 'gold', text: t('bookings.detailHistoryActionUpdate') }
  if (action === 'checkin.in' || action === 'attendance.check') return { glyph: '✓', tone: 'emerald', text: t('bookings.detailHistoryActionCheckinIn') }
  if (action === 'checkin.out' || action === 'attendance.uncheck') return { glyph: '↩', tone: 'muted', text: t('bookings.detailHistoryActionCheckinOut') }
  if (action.startsWith('email.failed')) return { glyph: '!', tone: 'orange', text: t('bookings.detailHistoryActionEmailFailed') }
  if (action.startsWith('email')) return { glyph: '✉', tone: 'blue', text: t('bookings.detailHistoryActionEmailSent') }
  return { glyph: '·', tone: 'muted', text: t('bookings.detailHistoryActionGeneric', { action }) }
}

const timelineEntries = computed<TimelineEntry[]>(() => {
  if (!data.value) return []
  return data.value.audit.map((a): TimelineEntry => {
    const disp = actionDisplay(a.action)
    return {
      id: a.id,
      glyph: disp.glyph,
      tone: disp.tone,
      text: disp.text,
      actor: humanizeActor(a.actor),
      timestamp: a.timestamp,
    }
  })
})
</script>

<template>
  <div class="relative max-w-5xl mx-auto">
    <AdminGrain />

    <NuxtLink
      to="/admin/bookings"
      class="relative inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-white/50 hover:text-gold transition-colors mb-6 arrow-nudge-parent"
    >
      <span class="arrow-nudge-back" aria-hidden="true">←</span>
      {{ t('bookings.detailBack') }}
    </NuxtLink>

    <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>

    <template v-if="loading && !data">
      <div class="mb-8">
        <div class="h-3 w-40 bg-white/10 rounded mb-4 animate-pulse"></div>
        <div class="h-10 w-64 bg-white/10 rounded mb-3 animate-pulse"></div>
        <div class="h-px w-24 bg-white/10 animate-pulse"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminSkeleton variant="card" :count="1" />
        <AdminSkeleton variant="card" :count="1" />
      </div>
      <div class="mt-6">
        <AdminSkeleton variant="card" :count="1" />
      </div>
    </template>

    <template v-if="data">
      <AdminHeroSection
        :eyebrow="t('bookings.detailEyebrow', { id: shortId })"
        :title="`${data.booking.firstName} ${data.booking.lastName}`"
        title-size="lg"
        spacing="tight"
      >
        <template #title>
          <span class="inline-flex flex-wrap items-center gap-4">
            <span>{{ data.booking.firstName }} {{ data.booking.lastName }}</span>
            <AdminBadgeStatus :status="data.booking.status" :label="statusBadgeLabel(data.booking.status)" />
          </span>
        </template>
        <template #actions>
          <AdminBaseButton v-if="data.booking.status === 'confirmed'" variant="secondary" type="button" @click="resend">
            {{ t('bookings.detailResend') }}
          </AdminBaseButton>
        </template>
      </AdminHeroSection>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <section
          class="relative border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-6 md:p-7 editorial-in"
          :style="{ animationDelay: '80ms' }"
        >
          <div class="eyebrow mb-5">{{ t('bookings.detailSection') }}</div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm">
            <div class="sm:col-span-2">
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldEmail') }}</dt>
              <dd class="text-white/90 break-all">
                <a :href="`mailto:${data.booking.email}`" class="hover:text-gold transition-colors">{{ data.booking.email }}</a>
              </dd>
            </div>
            <div v-if="data.booking.phone">
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldPhone') }}</dt>
              <dd class="text-white/90 tabular-nums">{{ data.booking.phone }}</dd>
            </div>
            <div>
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldParticipants') }}</dt>
              <dd class="font-serif text-xl text-white tabular-nums" style="font-weight: 400;">{{ data.booking.numberOfPeople }}</dd>
            </div>
            <div>
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldLanguage') }}</dt>
              <dd class="text-white/90 uppercase font-mono text-xs tracking-[0.18em]">{{ data.booking.language }}</dd>
            </div>
            <div>
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldMarketing') }}</dt>
              <dd :class="data.booking.acceptsMarketing ? 'text-gold' : 'text-white/40'">
                {{ data.booking.acceptsMarketing ? '✓' : '—' }}
              </dd>
            </div>
            <div v-if="data.booking.specialNeeds" class="sm:col-span-2">
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldSpecialNeeds') }}</dt>
              <dd class="text-white/85 italic font-serif leading-relaxed">{{ data.booking.specialNeeds }}</dd>
            </div>
            <div class="sm:col-span-2 pt-3 border-t border-white/[0.06]">
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldCreatedAt') }}</dt>
              <dd class="text-white/70 tabular-nums text-sm">{{ createdLongLabel }}</dd>
            </div>
          </dl>
        </section>

        <section
          class="relative border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-6 md:p-7 editorial-in"
          :style="{ animationDelay: '140ms' }"
        >
          <div class="flex items-center justify-between mb-5">
            <div class="eyebrow">{{ t('bookings.detailSlot') }}</div>
            <span
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: data.route.color }"
              aria-hidden="true"
            ></span>
          </div>

          <dl class="space-y-5 text-sm">
            <div>
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldRoute') }}</dt>
              <dd class="font-serif text-lg text-white leading-snug" style="font-weight: 400; letter-spacing: -0.01em;">
                {{ routeDisplayName }}
              </dd>
            </div>
            <div>
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldDate') }}</dt>
              <dd class="font-serif text-base text-white/90" style="font-weight: 400;">
                {{ slotLongLabel }}
              </dd>
              <dd class="text-xs text-white/55 tabular-nums mt-1 font-mono">
                {{ data.slot.startTime }} — {{ data.slot.endTime }}
              </dd>
            </div>
            <div>
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldCapacity') }}</dt>
              <dd class="font-serif text-xl text-white tabular-nums" style="font-weight: 400;">
                {{ data.slot.bookedCount }}<span class="text-white/35"> / {{ data.slot.maxParticipants }}</span>
              </dd>
            </div>
            <div>
              <dt class="eyebrow mb-1.5">{{ t('bookings.detailFieldCheckin') }}</dt>
              <dd>
                <span v-if="data.attendance" class="inline-flex items-center gap-2 text-emerald-300 text-sm">
                  <span aria-hidden="true">✓</span>
                  <span class="tabular-nums font-mono text-xs">{{ data.attendance.checkedInAt }}</span>
                </span>
                <span v-else class="text-white/45 italic font-serif text-sm">{{ t('bookings.detailNotCheckedIn') }}</span>
              </dd>
            </div>
            <div class="pt-3 border-t border-white/[0.06]">
              <AdminBaseButton variant="secondary" as="nuxt-link" :to="`/admin/parcours/${routeSlugFromId(data.route.id)}/slot/${data.slot.id}`">
                {{ t('bookings.detailViewCheckin') }}
              </AdminBaseButton>
            </div>
          </dl>
        </section>
      </div>

      <section
        class="relative border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-6 md:p-7 editorial-in"
        :style="{ animationDelay: '200ms' }"
      >
        <div class="flex items-baseline justify-between gap-4 mb-5">
          <div>
            <div class="eyebrow mb-2">Live</div>
            <h2 class="font-serif text-2xl text-white" style="font-weight: 400; letter-spacing: -0.01em;">
              {{ t('bookings.detailHistory') }}
            </h2>
          </div>
        </div>

        <AdminActivityFeed
          :entries="timelineEntries"
          :empty-label="t('bookings.detailHistoryEmpty')"
          :just-now-label="t('bookings.justNow')"
        />
      </section>
    </template>
  </div>
</template>
