<script setup lang="ts">
interface Props {
  tourSlotId: string
  routeName?: string
  routeColor?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  success: [payload: { bookingId: string, confirmToken: string }]
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

type BookingLanguage = 'eu' | 'es' | 'fr' | 'en'

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  numberOfPeople: number
  language: BookingLanguage
  specialNeeds: string
  acceptsPrivacyPolicy: boolean
  acceptsMarketing: boolean
}

const form = reactive<FormState>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  numberOfPeople: 1,
  language: locale.value === 'es' ? 'es' : 'eu',
  specialNeeds: '',
  acceptsPrivacyPolicy: false,
  acceptsMarketing: false,
})

const errors = reactive<Record<string, string>>({})
const touched = reactive<Record<string, boolean>>({})
const submitting = ref(false)
const serverError = ref<string | null>(null)

function markTouched(field: string) {
  touched[field] = true
}

function validate(): boolean {
  for (const k of Object.keys(errors)) delete errors[k]

  if (!form.firstName.trim()) errors.firstName = t('booking.errors.required')
  if (!form.lastName.trim()) errors.lastName = t('booking.errors.required')
  if (!form.email.trim()) {
    errors.email = t('booking.errors.required')
  }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = t('booking.errors.invalidEmail')
  }
  if (form.numberOfPeople < 1 || form.numberOfPeople > 4) {
    errors.numberOfPeople = t('booking.errors.invalidPeople')
  }
  if (!form.acceptsPrivacyPolicy) errors.acceptsPrivacyPolicy = t('booking.errors.acceptPrivacy') || t('booking.errors.acceptTerms')

  return Object.keys(errors).length === 0
}

const isFirstNameValid = computed(() => touched.firstName && form.firstName.trim().length > 0)
const isLastNameValid = computed(() => touched.lastName && form.lastName.trim().length > 0)
const isEmailValid = computed(() => {
  if (!touched.email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
})

async function onSubmit() {
  serverError.value = null
  // Mark everything touched for full-form validation display
  touched.firstName = true
  touched.lastName = true
  touched.email = true
  touched.acceptsPrivacyPolicy = true

  if (!validate()) return

  submitting.value = true
  try {
    const payload = {
      tourSlotId: props.tourSlotId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      numberOfPeople: Number(form.numberOfPeople),
      language: form.language,
      specialNeeds: form.specialNeeds.trim() || undefined,
      acceptsPrivacyPolicy: true as const,
      acceptsMarketing: form.acceptsMarketing,
    }

    const res = await $fetch<{ bookingId: string, confirmToken: string, status: string }>(
      '/api/bookings',
      {
        method: 'POST',
        body: payload,
      },
    )

    emit('success', {
      bookingId: res.bookingId,
      confirmToken: res.confirmToken,
    })
  }
  catch (err) {
    const e = err as { statusCode?: number, statusMessage?: string, data?: { remaining?: number } }
    if (e?.statusCode === 409) {
      const remaining = e.data?.remaining ?? 0
      serverError.value = t('booking.errors.slotFull', { remaining })
    }
    else if (e?.statusCode === 404) {
      serverError.value = t('booking.errors.slotNotFound')
    }
    else {
      serverError.value = e?.statusMessage || t('booking.errors.generic')
    }
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="grid grid-cols-1 sm:grid-cols-2 gap-6" novalidate @submit.prevent="onSubmit">
    <!-- Route context -->
    <div v-if="routeName" class="sm:col-span-2 flex items-center gap-3 form-appear" style="--d: 0ms">
      <span
        v-if="routeColor"
        class="h-1 w-10 rounded-full"
        :style="{ backgroundColor: routeColor }"
      />
      <p class="text-sm text-white/60 font-mono uppercase tracking-wider">{{ routeName }}</p>
    </div>

    <!-- First name (floating label) -->
    <div class="form-field form-appear" :class="{ 'has-value': !!form.firstName }" style="--d: 60ms">
      <label for="firstName" class="form-label">{{ t('booking.firstName') }} *</label>
      <input
        id="firstName"
        v-model="form.firstName"
        type="text"
        required
        autocomplete="given-name"
        class="form-input"
        :aria-invalid="!!errors.firstName"
        @blur="markTouched('firstName')"
      >
      <span v-if="isFirstNameValid" class="form-icon form-icon-valid" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
      <p v-if="errors.firstName" class="form-error">{{ errors.firstName }}</p>
    </div>

    <!-- Last name -->
    <div class="form-field form-appear" :class="{ 'has-value': !!form.lastName }" style="--d: 120ms">
      <label for="lastName" class="form-label">{{ t('booking.lastName') }} *</label>
      <input
        id="lastName"
        v-model="form.lastName"
        type="text"
        required
        autocomplete="family-name"
        class="form-input"
        :aria-invalid="!!errors.lastName"
        @blur="markTouched('lastName')"
      >
      <span v-if="isLastNameValid" class="form-icon form-icon-valid" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
      <p v-if="errors.lastName" class="form-error">{{ errors.lastName }}</p>
    </div>

    <!-- Email -->
    <div class="form-field sm:col-span-2 form-appear" :class="{ 'has-value': !!form.email }" style="--d: 180ms">
      <label for="email" class="form-label">{{ t('booking.email') }} *</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        required
        autocomplete="email"
        class="form-input"
        :aria-invalid="!!errors.email"
        @blur="markTouched('email')"
      >
      <span v-if="isEmailValid" class="form-icon form-icon-valid" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
      <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
    </div>

    <!-- Phone -->
    <div class="form-field form-appear" :class="{ 'has-value': !!form.phone }" style="--d: 240ms">
      <label for="phone" class="form-label">{{ t('booking.phone') }}</label>
      <input
        id="phone"
        v-model="form.phone"
        type="tel"
        autocomplete="tel"
        class="form-input"
      >
    </div>

    <!-- Number of people -->
    <div class="form-field form-field-select has-value form-appear" style="--d: 300ms">
      <label for="numberOfPeople" class="form-label">{{ t('booking.numberOfPeople') }} *</label>
      <select
        id="numberOfPeople"
        v-model.number="form.numberOfPeople"
        required
        class="form-input appearance-none cursor-pointer pr-10"
      >
        <option v-for="n in 4" :key="n" :value="n" class="bg-[var(--color-edition)] text-white">
          {{ n }}
        </option>
      </select>
      <span class="form-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
      <p v-if="errors.numberOfPeople" class="form-error">{{ errors.numberOfPeople }}</p>
    </div>

    <!-- Language -->
    <div class="form-field form-field-select sm:col-span-2 has-value form-appear" style="--d: 360ms">
      <label for="language" class="form-label">{{ t('booking.language') }} *</label>
      <select
        id="language"
        v-model="form.language"
        required
        class="form-input appearance-none cursor-pointer pr-10"
      >
        <option value="eu" class="bg-[var(--color-edition)] text-white">Euskara</option>
        <option value="es" class="bg-[var(--color-edition)] text-white">Español</option>
      </select>
      <span class="form-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>

    <!-- Special needs -->
    <div class="form-field sm:col-span-2 form-appear" :class="{ 'has-value': !!form.specialNeeds }" style="--d: 420ms">
      <label for="specialNeeds" class="form-label">{{ t('booking.specialNeeds') }}</label>
      <textarea
        id="specialNeeds"
        v-model="form.specialNeeds"
        rows="3"
        maxlength="1000"
        class="form-input form-textarea"
      />
    </div>

    <!-- Consent: privacy policy (required) -->
    <div class="sm:col-span-2 form-appear" style="--d: 480ms">
      <label class="flex items-start gap-3 cursor-pointer text-sm text-white/80 group/check">
        <span class="relative mt-[3px] shrink-0">
          <input
            v-model="form.acceptsPrivacyPolicy"
            type="checkbox"
            required
            class="peer sr-only"
            :aria-invalid="!!errors.acceptsPrivacyPolicy"
          >
          <span
            class="block w-[18px] h-[18px] border border-white/30 rounded-sm transition-all duration-200
                   peer-checked:bg-white peer-checked:border-white
                   peer-focus-visible:ring-2 peer-focus-visible:ring-white/60
                   group-hover/check:border-white/60"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="absolute inset-0 m-auto w-3 h-3 text-[var(--color-edition)] opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span class="leading-relaxed">
          {{ t('booking.acceptPrivacy') || "J'accepte la" }}
          <NuxtLink :to="localePath('/privacy')" class="underline hover:text-white" target="_blank">
            {{ t('booking.privacyPolicy') || 'politique de confidentialité' }}
          </NuxtLink>
          *
        </span>
      </label>
      <p v-if="errors.acceptsPrivacyPolicy" class="form-error ml-7">{{ errors.acceptsPrivacyPolicy }}</p>
    </div>

    <!-- Consent: marketing (optional, unchecked by default) -->
    <div class="sm:col-span-2 form-appear" style="--d: 520ms">
      <label class="flex items-start gap-3 cursor-pointer text-sm text-white/60 group/check">
        <span class="relative mt-[3px] shrink-0">
          <input
            v-model="form.acceptsMarketing"
            type="checkbox"
            class="peer sr-only"
          >
          <span
            class="block w-[18px] h-[18px] border border-white/30 rounded-sm transition-all duration-200
                   peer-checked:bg-white peer-checked:border-white
                   peer-focus-visible:ring-2 peer-focus-visible:ring-white/60
                   group-hover/check:border-white/60"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="absolute inset-0 m-auto w-3 h-3 text-[var(--color-edition)] opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span class="leading-relaxed">
          {{ t('booking.acceptMarketing') || 'Je souhaite être informé·e des prochaines éditions Irekiak (optionnel)' }}
        </span>
      </label>
    </div>

    <!-- Server error -->
    <div v-if="serverError" class="sm:col-span-2">
      <p class="text-sm text-red-200 border border-red-400/30 bg-red-500/10 rounded-sm px-4 py-3 flex items-start gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ serverError }}</span>
      </p>
    </div>

    <!-- Submit -->
    <div class="sm:col-span-2 form-appear" style="--d: 540ms">
      <button
        type="submit"
        :disabled="submitting"
        class="group w-full px-8 py-3.5 text-sm font-medium tracking-wide bg-white text-[var(--color-edition)] transition-all duration-300 hover:bg-white/95 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 scale-press hover:shadow-[0_10px_30px_-12px_rgba(255,255,255,0.6)]"
      >
        <span
          v-if="submitting"
          class="w-4 h-4 rounded-full border-2 border-[var(--color-edition)]/25 border-t-[var(--color-edition)] animate-spin"
          aria-hidden="true"
        />
        <span class="uppercase tracking-[0.15em] text-xs">
          {{ submitting ? t('booking.submitting') : t('booking.confirm') }}
        </span>
        <span v-if="!submitting" class="arrow-nudge">&rarr;</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
/* Appearance animation on field entry */
.form-appear {
  opacity: 0;
  transform: translateY(8px);
  animation: form-appear-anim 500ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: var(--d, 0ms);
}

@keyframes form-appear-anim {
  to { opacity: 1; transform: translateY(0); }
}

/* Floating label field */
.form-field {
  position: relative;
}

.form-label {
  position: absolute;
  top: 14px;
  left: 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  pointer-events: none;
  transform-origin: left center;
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
              color 200ms cubic-bezier(0.23, 1, 0.32, 1);
  font-family: var(--font-mono, monospace);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 11px;
  background-color: transparent;
  padding: 0 4px;
}

.form-input {
  width: 100%;
  padding: 22px 14px 10px 14px;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  color: #ffffff;
  outline: none;
  transition: border-color 250ms cubic-bezier(0.23, 1, 0.32, 1),
              background-color 250ms cubic-bezier(0.23, 1, 0.32, 1),
              box-shadow 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-input:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.form-input:focus,
.form-field.has-value .form-input {
  border-color: rgba(255, 255, 255, 0.45);
  background-color: rgba(255, 255, 255, 0.08);
}

.form-input:focus {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.06);
}

.form-field:focus-within .form-label,
.form-field.has-value .form-label {
  transform: translateY(-10px) scale(0.85);
  color: rgba(255, 255, 255, 0.85);
}

.form-textarea {
  padding-top: 24px;
  resize: vertical;
  min-height: 96px;
}

.form-error {
  margin-top: 6px;
  font-size: 11px;
  color: rgb(252, 165, 165);
  font-family: var(--font-mono, monospace);
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-error::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background-color: currentColor;
}

.form-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.form-icon-valid {
  color: rgba(255, 255, 255, 0.7);
}

.form-chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.form-field-select:focus-within .form-chevron {
  transform: translateY(-50%) rotate(180deg);
  color: rgba(255, 255, 255, 0.9);
}

@media (prefers-reduced-motion: reduce) {
  .form-appear {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
