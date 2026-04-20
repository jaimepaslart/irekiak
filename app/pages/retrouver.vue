<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('lookup')
useScrollReveal()

const email = ref('')
const touched = ref(false)
const submitting = ref(false)
const sent = ref(false)
const errorMessage = ref<string | null>(null)
const successRef = ref<HTMLElement | null>(null)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailError = computed<string | null>(() => {
  if (!touched.value) return null
  const trimmed = email.value.trim()
  if (!trimmed) return t('booking.errors.required')
  if (!emailPattern.test(trimmed)) return t('lookup.errors.invalidEmail')
  return null
})

async function onSubmit() {
  touched.value = true
  errorMessage.value = null
  if (emailError.value) return

  submitting.value = true
  try {
    await $fetch('/api/bookings/lookup', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase() },
    })
    sent.value = true
    await nextTick()
    successRef.value?.focus()
  }
  catch (err) {
    const e = err as { statusCode?: number, statusMessage?: string }
    if (e?.statusCode === 429) {
      errorMessage.value = t('lookup.errors.tooMany')
    }
    else {
      errorMessage.value = t('lookup.errors.generic')
    }
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto px-6 md:px-12 py-24 pt-28">
    <div class="reveal-on-scroll mb-10">
      <p class="text-xs uppercase tracking-[0.22em] text-[var(--color-gold)] font-mono mb-4">
        {{ t('lookup.eyebrow') }}
      </p>
      <h1 class="mb-6">{{ t('lookup.title') }}</h1>
      <p class="text-white/65 text-base leading-relaxed">
        {{ t('lookup.description') }}
      </p>
    </div>

    <div v-if="sent" class="reveal-on-scroll">
      <div
        ref="successRef"
        class="border border-white/15 bg-white/[0.03] p-8 rounded-sm outline-none"
        tabindex="-1"
        role="status"
        aria-live="polite"
      >
        <p class="text-xs uppercase tracking-[0.22em] text-[var(--color-gold)] font-mono mb-3">
          {{ t('lookup.sentEyebrow') }}
        </p>
        <p class="text-white/80 leading-relaxed">
          {{ t('lookup.sent') }}
        </p>
      </div>
      <NuxtLink
        :to="localePath('/')"
        class="inline-block mt-8 text-xs uppercase tracking-[0.22em] text-white/50 font-mono hover:text-white/90 transition-colors"
      >
        ← {{ t('nav.home') }}
      </NuxtLink>
    </div>

    <form v-else class="reveal-on-scroll space-y-6" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="lookup-email" class="block text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
          {{ t('lookup.emailLabel') }}
        </label>
        <input
          id="lookup-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          autofocus
          class="w-full px-4 py-3 text-sm bg-white/10 border border-white/15 rounded-sm
                 text-white placeholder-white/40
                 focus:outline-none focus:border-white/40 transition-colors"
          :aria-invalid="!!emailError"
          aria-describedby="lookup-privacy-note"
          :placeholder="t('lookup.emailPlaceholder')"
          @blur="touched = true"
        >
        <p v-if="emailError" class="mt-2 text-xs text-red-300/80">{{ emailError }}</p>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-300/85" role="alert" aria-live="polite">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="submitting"
        class="px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)]
               transition-all duration-300 hover:bg-white/90
               disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ submitting ? t('lookup.submitting') : t('lookup.submit') }}
      </button>

      <p id="lookup-privacy-note" class="pt-4 text-xs text-white/40 leading-relaxed">
        {{ t('lookup.privacyNote') }}
      </p>
    </form>
  </div>
</template>
