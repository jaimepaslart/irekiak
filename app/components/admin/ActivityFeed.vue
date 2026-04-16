<script setup lang="ts">
export interface TimelineEntry {
  id: string
  glyph: string
  tone: 'emerald' | 'blue' | 'orange' | 'gold' | 'muted'
  text: string
  actor: string
  timestamp: string
  link?: string
}

interface Props {
  entries: TimelineEntry[]
  emptyLabel: string
  justNowLabel: string
}

defineProps<Props>()

const { locale } = useAdminT()

const rtf = computed(() => {
  const loc = locale.value === 'es' ? 'es-ES' : 'fr-FR'
  return new Intl.RelativeTimeFormat(loc, { numeric: 'auto' })
})

function relative(iso: string, justNow: string): string {
  const ts = Date.parse(iso)
  if (!Number.isFinite(ts)) return iso
  const diffSec = Math.round((ts - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 45) return justNow
  if (abs < 3600) return rtf.value.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.value.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 604800) return rtf.value.format(Math.round(diffSec / 86400), 'day')
  return rtf.value.format(Math.round(diffSec / 604800), 'week')
}

function toneBg(tone: TimelineEntry['tone']) {
  switch (tone) {
    case 'emerald': return 'bg-emerald-500/12 border-emerald-400/40 text-emerald-300'
    case 'blue': return 'bg-sky-500/12 border-sky-400/40 text-sky-300'
    case 'orange': return 'bg-orange-500/12 border-orange-400/40 text-orange-300'
    case 'gold': return 'bg-gold-soft border-gold-soft text-gold'
    default: return 'bg-white/5 border-white/15 text-white/60'
  }
}
</script>

<template>
  <div v-if="entries.length === 0" class="py-10 text-center">
    <p class="text-sm text-white/40 italic font-serif">{{ emptyLabel }}</p>
  </div>
  <ol v-else class="divide-y divide-white/5">
    <li
      v-for="(e, i) in entries"
      :key="e.id"
      class="editorial-in"
      :style="{ animationDelay: `${i * 40}ms` }"
    >
      <component
        :is="e.link ? 'NuxtLink' : 'div'"
        :to="e.link"
        class="flex items-start gap-4 py-3.5 px-1 focus-gold rounded-sm group"
        :class="e.link ? 'hover:bg-white/[0.03] transition-colors cursor-pointer -mx-1 px-1' : ''"
      >
        <span
          class="mt-0.5 w-8 h-8 shrink-0 rounded-full border flex items-center justify-center text-sm font-mono"
          :class="toneBg(e.tone)"
          aria-hidden="true"
        >
          {{ e.glyph }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm text-white/85 leading-snug">
            <span v-html="e.text"></span>
            <span v-if="e.link" class="arrow-nudge ml-1 text-white/30">→</span>
          </p>
          <div class="mt-1 flex items-center gap-2 text-[11px] text-white/40">
            <span class="uppercase tracking-[0.14em] font-mono">{{ e.actor }}</span>
            <span class="text-white/20">·</span>
            <time :datetime="e.timestamp" class="tabular-nums italic font-serif">
              {{ relative(e.timestamp, justNowLabel) }}
            </time>
          </div>
        </div>
      </component>
    </li>
  </ol>
</template>
