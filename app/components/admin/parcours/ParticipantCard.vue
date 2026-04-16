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
}

const props = withDefaults(defineProps<Props>(), { saving: false })
const emit = defineEmits<{ toggle: [bookingId: string, present: boolean] }>()

const { t } = useAdminT()

const peopleLabel = computed(() =>
  props.participant.numberOfPeople > 1 ? t('parcours.personPlural') : t('parcours.personSingular'),
)

function handleClick(e: MouseEvent): void {
  const target = e.target as HTMLElement
  if (target.closest('a[href^="tel:"]')) return
  emit('toggle', props.participant.id, !props.participant.attended)
}
</script>

<template>
  <button
    type="button"
    class="w-full text-left flex items-center gap-4 p-4 rounded-md transition-colors cursor-pointer disabled:opacity-60"
    :class="participant.attended
      ? 'bg-emerald-500/15 border border-emerald-400/40'
      : 'bg-white/5 border border-white/10 hover:border-white/30'"
    :disabled="saving"
    :aria-pressed="participant.attended"
    :aria-label="t('checkin.togglePresentAria')"
    @click="handleClick"
  >
    <span
      class="flex-shrink-0 inline-flex items-center justify-center rounded-md border-2 transition-colors"
      :class="participant.attended ? 'bg-emerald-400 border-emerald-400' : 'border-white/40'"
      :style="{ width: '60px', height: '60px' }"
      role="checkbox"
      :aria-checked="participant.attended"
    >
      <Transition name="tick">
        <svg
          v-if="participant.attended"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-[var(--color-edition)]"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </Transition>
    </span>

    <div class="flex-1 min-w-0">
      <div class="text-2xl font-semibold leading-tight truncate">
        {{ participant.firstName }} {{ participant.lastName }}
      </div>
      <div class="text-sm text-white/60 mt-1">
        {{ participant.numberOfPeople }} {{ peopleLabel }}
        <span class="mx-1.5 text-white/30">·</span>
        <span class="font-mono uppercase">{{ participant.language }}</span>
      </div>
      <a
        v-if="participant.phone"
        :href="`tel:${participant.phone}`"
        class="inline-block mt-1 text-sm text-white/80 hover:text-white underline underline-offset-2"
        @click.stop
      >
        {{ participant.phone }}
      </a>
      <div
        v-if="participant.specialNeeds"
        class="mt-2 inline-block text-xs px-2 py-1 rounded-sm bg-orange-500/15 border border-orange-400/30 text-orange-200"
      >
        {{ t('parcours.specialNeeds') }} · {{ participant.specialNeeds }}
      </div>
    </div>
  </button>
</template>

<style scoped>
.tick-enter-active { transition: transform 200ms ease, opacity 200ms ease; }
.tick-enter-from { transform: scale(0.5); opacity: 0; }
.tick-enter-to { transform: scale(1); opacity: 1; }
</style>
