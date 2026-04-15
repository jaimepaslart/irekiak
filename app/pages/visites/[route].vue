<script setup lang="ts">
import { tourRoutes } from '@data/tours'
import { galleries } from '@data/galleries'

interface AvailabilitySlot {
  id: string
  routeId: string
  date: string
  startTime: string
  endTime: string
  language: 'eu' | 'es' | 'fr' | 'en'
  maxParticipants: number
  remaining: number
}

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()
const routeParam = useRoute()

type Step = 'date' | 'slot' | 'form' | 'done'

const tourRoute = computed(() =>
  tourRoutes.find(r => r.slug === routeParam.params.route),
)

const routeGalleries = computed(() =>
  tourRoute.value
    ? galleries.filter(g => tourRoute.value!.galleryIds.includes(g.id))
    : [],
)

const currentStep = ref<Step>('date')
const selectedDate = ref<string | null>(null)
const selectedSlotId = ref<string | null>(null)
const confirmToken = ref<string | null>(null)

// Load availability for this route (all dates).
const { data: allAvailability, pending: availabilityPending } = await useFetch<AvailabilitySlot[]>(
  () => `/api/bookings/availability?routeId=${tourRoute.value?.id ?? ''}`,
  {
    key: `avail-${String(routeParam.params.route)}`,
    lazy: true,
    default: (): AvailabilitySlot[] => [],
    watch: [tourRoute],
  },
)

const availableDates = computed<string[]>(() => {
  const dates = new Set<string>()
  for (const slot of allAvailability.value ?? []) {
    if (slot.remaining > 0) dates.add(slot.date)
  }
  return Array.from(dates).sort()
})

const dateRange = computed(() => {
  const sorted = [...availableDates.value].sort()
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
})

const availableSlotsForDate = computed<AvailabilitySlot[]>(() => {
  if (!selectedDate.value) return []
  return (allAvailability.value ?? []).filter(s => s.date === selectedDate.value)
})

const selectedSlot = computed<AvailabilitySlot | undefined>(() =>
  (allAvailability.value ?? []).find(s => s.id === selectedSlotId.value),
)

function goToSlotStep() {
  if (selectedDate.value) currentStep.value = 'slot'
}

function goToFormStep() {
  if (selectedSlotId.value) currentStep.value = 'form'
}

function goBack() {
  if (currentStep.value === 'slot') currentStep.value = 'date'
  else if (currentStep.value === 'form') currentStep.value = 'slot'
}

function onBookingSuccess(payload: { bookingId: string, confirmToken: string }) {
  confirmToken.value = payload.confirmToken
  currentStep.value = 'done'
}

usePageSeo('tours')
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-6 md:px-12 py-24 pt-28">
    <template v-if="tourRoute">
      <!-- Back link -->
      <NuxtLink
        :to="localePath('/visites')"
        class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8"
      >
        &larr; {{ t('nav.tours') }}
      </NuxtLink>

      <!-- Hero: color bar + route name (stays on all steps) -->
      <div class="mb-10">
        <div class="h-1 w-24 rounded-full mb-6" :style="{ backgroundColor: tourRoute.color }" />
        <h1 class="mb-4">{{ tr(tourRoute.name) }}</h1>
        <p class="text-lg text-white/70 max-w-2xl">
          {{ tr(tourRoute.description) }}
        </p>
        <div class="flex gap-4 text-sm text-white/40 font-mono mt-4">
          <span>{{ tr(tourRoute.duration) }}</span>
          <span>&middot;</span>
          <span>{{ tr(tourRoute.distance) }}</span>
        </div>
      </div>

      <!-- Galleries on this route (hidden after booking is confirmed) -->
      <section v-if="currentStep !== 'done'" class="mb-16">
        <h2 class="text-2xl font-semibold text-white mb-6">
          {{ t('tours.galleries') }}
        </h2>

        <div class="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
          <NuxtLink
            v-for="gallery in routeGalleries"
            :key="gallery.id"
            :to="localePath(`/galleries/${gallery.slug}`)"
            class="flex-shrink-0 w-64 border border-white/15 rounded-sm overflow-hidden
                   transition-all duration-300 hover:border-white/30 snap-start"
          >
            <NuxtImg
              :src="gallery.image"
              :alt="gallery.name"
              width="256"
              height="160"
              class="w-full h-40 object-cover"
              format="webp"
              quality="80"
            />
            <div class="p-4">
              <p class="font-semibold text-white mb-1">{{ gallery.name }}</p>
              <p class="text-xs text-white/40">{{ gallery.address }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Booking flow -->
      <section class="bg-edition-dark p-6 md:p-10 rounded-sm">
        <!-- Step indicator / back button -->
        <div class="flex items-center justify-between mb-8">
          <button
            v-if="currentStep !== 'date' && currentStep !== 'done'"
            type="button"
            class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
            @click="goBack"
          >
            &larr; {{ t('common.back') }}
          </button>
          <span v-else />

          <ol
            v-if="currentStep !== 'done'"
            class="flex items-center gap-3 text-xs font-mono uppercase tracking-wider"
          >
            <li :class="currentStep === 'date' ? 'text-white' : 'text-white/40'">
              1. {{ t('booking.stepDate') }}
            </li>
            <li class="text-white/20">/</li>
            <li :class="currentStep === 'slot' ? 'text-white' : 'text-white/40'">
              2. {{ t('booking.stepSlot') }}
            </li>
            <li class="text-white/20">/</li>
            <li :class="currentStep === 'form' ? 'text-white' : 'text-white/40'">
              3. {{ t('booking.stepInfo') }}
            </li>
          </ol>
        </div>

        <Transition name="fade" mode="out-in">
          <!-- Step 1: Calendar -->
          <div v-if="currentStep === 'date'" key="date">
            <h2 class="text-2xl font-semibold text-white mb-2">
              {{ t('booking.selectDate') }}
            </h2>
            <p class="text-sm text-white/60 mb-8">{{ t('booking.selectDateHint') }}</p>

            <div v-if="availabilityPending" class="py-10 text-white/50 text-center">
              {{ t('common.loading') }}
            </div>

            <template v-else>
              <BookingCalendar
                v-model="selectedDate"
                :available-dates="availableDates"
                :min-date="dateRange.min"
                :max-date="dateRange.max"
              />

              <div class="mt-8 flex justify-end">
                <button
                  type="button"
                  :disabled="!selectedDate"
                  class="px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)] transition-all duration-200 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  @click="goToSlotStep"
                >
                  {{ t('common.continue') }} &rarr;
                </button>
              </div>
            </template>
          </div>

          <!-- Step 2: Slot picker -->
          <div v-else-if="currentStep === 'slot'" key="slot">
            <h2 class="text-2xl font-semibold text-white mb-2">
              {{ t('booking.selectSlot') }}
            </h2>
            <p class="text-sm text-white/60 mb-8">
              {{ selectedDate }}
            </p>

            <BookingTimeSlotPicker
              v-model="selectedSlotId"
              :slots="availableSlotsForDate"
            />

            <div class="mt-8 flex justify-end">
              <button
                type="button"
                :disabled="!selectedSlotId"
                class="px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)] transition-all duration-200 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="goToFormStep"
              >
                {{ t('common.continue') }} &rarr;
              </button>
            </div>
          </div>

          <!-- Step 3: Form -->
          <div v-else-if="currentStep === 'form'" key="form">
            <h2 class="text-2xl font-semibold text-white mb-2">
              {{ t('booking.fillInfo') }}
            </h2>
            <p v-if="selectedSlot" class="text-sm text-white/60 mb-8 font-mono">
              {{ selectedSlot.date }}
              &middot; {{ selectedSlot.startTime }}&ndash;{{ selectedSlot.endTime }}
              &middot; {{ selectedSlot.language.toUpperCase() }}
            </p>

            <BookingForm
              v-if="selectedSlotId"
              :tour-slot-id="selectedSlotId"
              :route-name="tr(tourRoute.name)"
              :route-color="tourRoute.color"
              @success="onBookingSuccess"
            />
          </div>

          <!-- Step 4: Confirmation -->
          <div v-else-if="currentStep === 'done' && confirmToken" key="done">
            <BookingConfirmation
              :confirm-token="confirmToken"
              :route="{
                id: tourRoute.id,
                slug: tourRoute.slug,
                name: tourRoute.name,
                color: tourRoute.color,
              }"
            />
          </div>
        </Transition>
      </section>
    </template>

    <!-- Route not found -->
    <template v-else>
      <div class="text-center py-20">
        <p class="text-white/50">{{ t('tours.notFound') }}</p>
        <NuxtLink
          :to="localePath('/visites')"
          class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mt-6"
        >
          &larr; {{ t('nav.tours') }}
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
