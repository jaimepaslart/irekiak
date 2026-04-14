<script setup lang="ts">
import type { TranslatedText } from '#types/common'

interface RouteInfo {
  id: string
  slug: string
  name: TranslatedText
  color: string
}

interface Props {
  confirmToken: string
  route?: RouteInfo
}

const props = defineProps<Props>()

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()

interface BookingDetails {
  booking: {
    id: string
    firstName: string
    lastName: string
    email: string
    numberOfPeople: number
    language: string
  }
  slot: {
    id: string
    date: string
    startTime: string
    endTime: string
    language: string
  }
  route: {
    id: string
    slug: string
    name: TranslatedText
    color: string
  }
}

const { data, pending, error } = await useFetch<BookingDetails>(
  () => `/api/bookings/${props.confirmToken}`,
  { key: `booking-${props.confirmToken}` },
)

const routeName = computed(() => {
  const r = data.value?.route ?? props.route
  return r ? tr(r.name) : ''
})

const routeColor = computed(() => data.value?.route.color ?? props.route?.color)

const shareMailto = computed(() => {
  if (!data.value) return '#'
  const subject = encodeURIComponent(t('booking.shareSubject'))
  const body = encodeURIComponent(
    `${t('booking.shareBody')}\n\n${routeName.value}\n${data.value.slot.date} · ${data.value.slot.startTime}-${data.value.slot.endTime}`,
  )
  return `mailto:?subject=${subject}&body=${body}`
})

function downloadIcs() {
  window.open(`/api/bookings/${props.confirmToken}/ics`, '_blank')
}
</script>

<template>
  <div class="max-w-2xl mx-auto text-center">
    <div v-if="pending" class="py-20 text-white/60">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="error" class="py-20 text-white/60">
      {{ t('booking.errors.notFound') }}
    </div>

    <template v-else-if="data">
      <!-- Animated checkmark -->
      <div
        class="relative mx-auto w-24 h-24 mb-8 flex items-center justify-center"
        style="animation: scale-in 500ms cubic-bezier(0.23, 1, 0.32, 1) forwards"
      >
        <span
          class="absolute inset-0 rounded-full border-2 border-white"
          style="animation: ring-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          aria-hidden="true"
        />
        <svg
          class="w-12 h-12 text-white relative"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline
            points="20 6 9 17 4 12"
            stroke-dasharray="24"
            stroke-dashoffset="24"
            style="animation: draw-check 600ms cubic-bezier(0.65, 0, 0.35, 1) 150ms forwards"
          />
        </svg>
      </div>

      <h1
        class="text-3xl md:text-4xl font-semibold text-white mb-4"
        style="animation: fade-in-up 600ms cubic-bezier(0.23, 1, 0.32, 1) 250ms both"
      >
        {{ t('booking.confirmed') }}
      </h1>

      <p
        class="text-white/70 mb-10"
        style="animation: fade-in-up 600ms cubic-bezier(0.23, 1, 0.32, 1) 350ms both"
      >
        {{ t('booking.emailSentTo', { email: data.booking.email }) }}
      </p>

      <!-- Details card -->
      <div
        class="bg-edition-dark border border-white/15 rounded-sm p-6 md:p-8 text-left mb-8"
        style="animation: scale-in 600ms cubic-bezier(0.23, 1, 0.32, 1) 450ms both"
      >
        <div v-if="routeName" class="mb-6 flex items-center gap-3">
          <span
            v-if="routeColor"
            class="h-1 w-10 rounded-full"
            :style="{ backgroundColor: routeColor }"
          />
          <p class="text-xs font-mono uppercase tracking-wider text-white/40">
            {{ t('booking.route') }}
          </p>
        </div>

        <h2 v-if="routeName" class="text-2xl font-semibold text-white mb-6">
          {{ routeName }}
        </h2>

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div>
            <dt class="text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
              {{ t('booking.date') }}
            </dt>
            <dd class="text-white">{{ data.slot.date }}</dd>
          </div>
          <div>
            <dt class="text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
              {{ t('booking.time') }}
            </dt>
            <dd class="text-white font-mono">
              {{ data.slot.startTime }} &ndash; {{ data.slot.endTime }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
              {{ t('booking.numberOfPeople') }}
            </dt>
            <dd class="text-white">{{ data.booking.numberOfPeople }}</dd>
          </div>
          <div>
            <dt class="text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
              {{ t('booking.language') }}
            </dt>
            <dd class="text-white uppercase font-mono">{{ data.slot.language }}</dd>
          </div>
        </dl>
      </div>

      <!-- Action buttons -->
      <div
        class="flex flex-col sm:flex-row gap-3 justify-center mb-10"
        style="animation: fade-in-up 600ms cubic-bezier(0.23, 1, 0.32, 1) 600ms both"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border border-white/30 text-white scale-press transition-all duration-200 hover:bg-white/10 hover:border-white/50"
          @click="downloadIcs"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {{ t('booking.addToCalendar') }}
        </button>

        <a
          :href="shareMailto"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border border-white/30 text-white scale-press transition-all duration-200 hover:bg-white/10 hover:border-white/50"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {{ t('booking.share') }}
        </a>
      </div>

      <!-- Back CTA -->
      <NuxtLink
        :to="localePath('/visites')"
        class="group inline-flex items-center gap-2 px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)] scale-press transition-all duration-200 hover:bg-white/90"
      >
        <span class="arrow-nudge-back">&larr;</span>
        {{ t('booking.backToTours') }}
      </NuxtLink>
    </template>
  </div>
</template>
