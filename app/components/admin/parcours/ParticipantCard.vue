<script setup lang="ts">
interface Participant {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  numberOfPeople: number
  language: string
  specialNeeds: string | null
  attended: boolean
  attendanceNotes: string | null
}

interface Props {
  participant: Participant
  saving?: boolean
  index?: number
}

const props = withDefaults(defineProps<Props>(), { saving: false, index: 0 })
const emit = defineEmits<{ toggle: [bookingId: string, present: boolean] }>()

const { t } = useAdminT()

const peopleLabel = computed(() =>
  props.participant.numberOfPeople > 1 ? t('parcours.personPlural') : t('parcours.personSingular'),
)

const initials = computed(() => {
  const f = props.participant.firstName?.[0] ?? ''
  const l = props.participant.lastName?.[0] ?? ''
  return (f + l).toUpperCase() || '·'
})

function handleClick(e: MouseEvent): void {
  const target = e.target as HTMLElement
  if (target.closest('a[href^="tel:"]')) return
  emit('toggle', props.participant.id, !props.participant.attended)
}
</script>

<template>
  <button
    type="button"
    class="w-full text-left flex items-center gap-5 p-6 rounded-sm border transition-colors cursor-pointer disabled:opacity-60 focus-gold editorial-in"
    :class="participant.attended
      ? 'bg-gold-soft border-gold-soft'
      : 'bg-[var(--color-edition-dark)] border-white/10 hover:border-white/25'"
    :style="{ animationDelay: `${index * 60}ms` }"
    :disabled="saving"
    :aria-pressed="participant.attended"
    :aria-label="t('checkin.togglePresentAria')"
    @click="handleClick"
  >
    <span
      class="flex-shrink-0 inline-flex items-center justify-center rounded-full font-serif text-xl transition-colors"
      :class="participant.attended
        ? 'bg-[var(--color-accent-gold)] text-[var(--color-edition)]'
        : 'bg-white/5 text-white/70 border border-white/10'"
      :style="{ width: '56px', height: '56px', fontWeight: 500, letterSpacing: '0.02em' }"
      aria-hidden="true"
    >
      {{ initials }}
    </span>

    <div class="flex-1 min-w-0">
      <div class="font-serif text-2xl text-white leading-tight truncate" style="font-weight: 500; letter-spacing: -0.01em;">
        {{ participant.firstName }} {{ participant.lastName }}
      </div>
      <div class="text-sm text-white/55 mt-1 tabular-nums">
        {{ participant.numberOfPeople }} {{ peopleLabel }}
        <span class="mx-1.5 text-gold/70">·</span>
        <span class="font-mono uppercase tracking-wider text-xs">{{ participant.language }}</span>
        <template v-if="participant.phone">
          <span class="mx-1.5 text-gold/70">·</span>
          <a
            :href="`tel:${participant.phone}`"
            class="text-white/80 hover:text-gold underline underline-offset-2"
            @click.stop
          >
            {{ participant.phone }}
          </a>
        </template>
      </div>
      <div
        v-if="participant.specialNeeds"
        class="mt-3 inline-block text-[11px] uppercase tracking-[0.14em] font-mono px-2 py-1 rounded-sm border border-gold-soft text-gold bg-gold-soft"
      >
        {{ t('parcours.specialNeeds') }} · <span class="normal-case tracking-normal font-serif italic">{{ participant.specialNeeds }}</span>
      </div>
    </div>

    <span
      class="flex-shrink-0 inline-flex items-center justify-center rounded-sm border-2 transition-colors"
      :class="participant.attended
        ? 'bg-transparent border-[var(--color-accent-gold)]'
        : 'bg-transparent border-white/30'"
      :style="{ width: '60px', height: '60px' }"
      role="checkbox"
      :aria-checked="participant.attended"
    >
      <Transition name="tick">
        <svg
          v-if="participant.attended"
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-[var(--color-accent-gold)]"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </Transition>
    </span>
  </button>
</template>

<style scoped>
.tick-enter-active { transition: transform 220ms cubic-bezier(0.65, 0, 0.35, 1), opacity 220ms ease; }
.tick-enter-from { transform: scale(0.5); opacity: 0; }
.tick-enter-to { transform: scale(1); opacity: 1; }
</style>
