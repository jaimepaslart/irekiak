<script setup lang="ts">
interface Contact {
  email: string
  name?: string
  phone?: string
  preferredLanguage: 'eu' | 'es' | 'fr' | 'en'
  notifyOnBooking: boolean
  receiveDailyDigest: boolean
}
interface Row {
  id: string
  name: string
  contact: Contact | null
}

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Galeries', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const { year } = useEdition()
const token = inject<Ref<string>>('adminToken')!

const galleries = ref<Row[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const editing = ref<string | null>(null)
const drawerOpen = ref(false)
const form = reactive<Contact>({
  email: '', name: '', phone: '', preferredLanguage: 'es', notifyOnBooking: true, receiveDailyDigest: true,
})
const saving = ref(false)

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const

async function load() {
  loading.value = true
  try {
    galleries.value = await $fetch<Row[]>('/api/admin/galleries', { headers: { 'x-admin-token': token.value } })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('galleries.loadFailed')
  }
  finally { loading.value = false }
}
onMounted(() => { void load() })

function startEdit(row: Row) {
  editing.value = row.id
  Object.assign(form, {
    email: row.contact?.email ?? '',
    name: row.contact?.name ?? '',
    phone: row.contact?.phone ?? '',
    preferredLanguage: row.contact?.preferredLanguage ?? 'es',
    notifyOnBooking: row.contact?.notifyOnBooking ?? true,
    receiveDailyDigest: row.contact?.receiveDailyDigest ?? true,
  })
  drawerOpen.value = true
}

function cancelEdit() {
  drawerOpen.value = false
  editing.value = null
}

async function save() {
  if (!editing.value) return
  saving.value = true
  try {
    await $fetch('/api/admin/galleries', {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: {
        galleryId: editing.value,
        email: form.email || null,
        name: form.name || null,
        phone: form.phone || null,
        preferredLanguage: form.preferredLanguage,
        notifyOnBooking: form.notifyOnBooking,
        receiveDailyDigest: form.receiveDailyDigest,
      },
    })
    drawerOpen.value = false
    editing.value = null
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? t('galleries.saveFailed'))
  }
  finally { saving.value = false }
}

const editingGalleryName = computed(() => {
  if (!editing.value) return ''
  return galleries.value.find(g => g.id === editing.value)?.name ?? ''
})

const galleriesCount = computed(() => galleries.value.length)
</script>

<template>
  <div class="relative max-w-5xl mx-auto">
    <div class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60" aria-hidden="true"></div>

    <section class="relative mb-10 md:mb-14 editorial-in">
      <div class="eyebrow mb-4">
        {{ t('galleries.eyebrow') }}
      </div>
      <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
        {{ t('galleries.title') }}
      </h1>
      <p class="mt-2 text-sm text-white/55">
        <span class="italic font-serif">{{ t('galleries.heroSubtitle') }}</span>
      </p>
      <div class="mt-6 h-px w-24 bg-[var(--color-accent-gold)] opacity-50"></div>
    </section>

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">
      {{ errorMessage }}
    </p>

    <div v-if="loading && galleries.length === 0" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <AdminSkeleton variant="card" :count="8" />
    </div>

    <AdminEmptyState
      v-else-if="!loading && galleries.length === 0"
      icon="🖼"
      :title="t('galleries.emptyState')"
      :description="t('galleries.emptyStateDesc')"
    >
      <template #action>
        <AdminBaseButton variant="primary" type="button" :loading="loading" @click="load">
          {{ t('galleries.emptyStateCta') }}
        </AdminBaseButton>
      </template>
    </AdminEmptyState>

    <section v-else class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <article
        v-for="(g, i) in galleries"
        :key="g.id"
        class="group relative flex flex-col border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-6 md:p-7 editorial-in transition-[border-color] duration-300 hover:border-white/20"
        :style="{ animationDelay: `${i * 70}ms` }"
      >
        <span
          class="absolute inset-y-0 left-0 w-[2px] bg-[var(--color-accent-gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        ></span>

        <div class="eyebrow mb-4">
          {{ t('galleries.cardEyebrow', { num: ROMAN[i] ?? String(i + 1) }) }}
        </div>

        <h2 class="font-serif text-xl text-white leading-tight mb-3" style="font-weight: 400; letter-spacing: -0.01em;">
          {{ g.name }}
        </h2>

        <div v-if="g.contact" class="space-y-2 mb-5 flex-1">
          <p class="font-serif italic text-sm text-white/70 truncate">
            {{ g.contact.email }}
          </p>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-wider tabular-nums text-white/45">
            <span v-if="g.contact.phone">{{ g.contact.phone }}</span>
            <span v-if="g.contact.phone" class="text-gold/70">·</span>
            <span>{{ g.contact.preferredLanguage.toUpperCase() }}</span>
            <span v-if="g.contact.name" class="text-gold/70">·</span>
            <span v-if="g.contact.name" class="text-white/55 normal-case tracking-normal font-serif italic">{{ g.contact.name }}</span>
          </div>
        </div>

        <p v-else class="font-serif italic text-sm text-white/40 mb-5 flex-1">
          {{ t('galleries.noContact') }}
        </p>

        <div class="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
          <div class="flex flex-col gap-1 text-[11px] flex-1 min-w-0">
            <span class="flex items-center gap-2" :class="g.contact?.notifyOnBooking ? 'text-gold' : 'text-white/30'">
              <span class="inline-block w-2 h-2 rounded-full shrink-0" :class="g.contact?.notifyOnBooking ? 'bg-[var(--color-accent-gold)]' : 'bg-white/20'" aria-hidden="true"></span>
              <span class="font-mono uppercase tracking-wider truncate">{{ t('galleries.notifyOnBooking') }}</span>
            </span>
            <span class="flex items-center gap-2" :class="g.contact?.receiveDailyDigest ? 'text-gold' : 'text-white/30'">
              <span class="inline-block w-2 h-2 rounded-full shrink-0" :class="g.contact?.receiveDailyDigest ? 'bg-[var(--color-accent-gold)]' : 'bg-white/20'" aria-hidden="true"></span>
              <span class="font-mono uppercase tracking-wider truncate">{{ t('galleries.receiveDailyDigest') }}</span>
            </span>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 text-xs text-white/60 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors arrow-nudge-parent focus-gold"
            @click="startEdit(g)"
          >
            {{ t('galleries.editButton') }}
            <span class="arrow-nudge text-gold" aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    </section>

    <p v-if="galleriesCount > 0" class="mt-10 text-[10px] uppercase tracking-[0.22em] text-white/20 font-mono text-center">
      Irekiak {{ year }} · {{ galleriesCount }} {{ t('nav.galleries').toLowerCase() }}
    </p>

    <AdminDrawer v-model="drawerOpen" :title="t('galleries.editDrawerTitle')">
      <div class="editorial-in">
        <div class="eyebrow mb-3">
          {{ t('galleries.editDrawerTitle') }}
        </div>
        <h3 class="font-serif text-2xl text-white" style="font-weight: 400; letter-spacing: -0.01em;">
          {{ editingGalleryName }}
        </h3>
        <p class="font-serif italic text-sm text-white/55 mt-2">
          {{ t('galleries.editDrawerSubtitle') }}
        </p>
        <div class="mt-5 mb-6 h-px w-16 bg-[var(--color-accent-gold)] opacity-50"></div>

        <form class="space-y-5" @submit.prevent="save">
          <label class="block">
            <span class="eyebrow block mb-2 text-white/50">{{ t('galleries.fieldEmail') }}</span>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04]"
            >
          </label>

          <label class="block">
            <span class="eyebrow block mb-2 text-white/50">{{ t('galleries.fieldContactName') }}</span>
            <input
              v-model="form.name"
              type="text"
              autocomplete="name"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04]"
            >
          </label>

          <label class="block">
            <span class="eyebrow block mb-2 text-white/50">{{ t('galleries.fieldPhone') }}</span>
            <input
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04]"
            >
          </label>

          <label class="block">
            <span class="eyebrow block mb-2 text-white/50">{{ t('galleries.fieldLanguage') }}</span>
            <select
              v-model="form.preferredLanguage"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04]"
            >
              <option value="eu">Euskara</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>

          <div class="pt-2 space-y-4 border-t border-white/5">
            <label class="flex items-start gap-3 cursor-pointer pt-4">
              <span class="relative inline-flex items-center shrink-0 mt-0.5">
                <input v-model="form.notifyOnBooking" type="checkbox" class="sr-only peer">
                <span class="w-10 h-5 bg-white/10 peer-checked:bg-[var(--color-accent-gold)] rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent-gold)]"></span>
                <span class="absolute left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></span>
              </span>
              <span class="flex-1">
                <span class="block font-serif text-white" style="font-weight: 400;">{{ t('galleries.notifyOnBooking') }}</span>
              </span>
            </label>

            <label class="flex items-start gap-3 cursor-pointer">
              <span class="relative inline-flex items-center shrink-0 mt-0.5">
                <input v-model="form.receiveDailyDigest" type="checkbox" class="sr-only peer">
                <span class="w-10 h-5 bg-white/10 peer-checked:bg-[var(--color-accent-gold)] rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent-gold)]"></span>
                <span class="absolute left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></span>
              </span>
              <span class="flex-1">
                <span class="block font-serif text-white" style="font-weight: 400;">{{ t('galleries.receiveDailyDigest') }}</span>
              </span>
            </label>
          </div>

          <button type="submit" class="sr-only" :disabled="saving">
            {{ t('galleries.saveChanges') }}
          </button>
        </form>
      </div>

      <template #actions>
        <button
          type="button"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-4 py-3 text-xs text-white/60 hover:text-white font-mono uppercase tracking-[0.18em] transition-colors disabled:opacity-50 focus-gold"
          @click="cancelEdit"
        >
          {{ t('galleries.cancelEdit') }}
        </button>
        <button
          type="button"
          :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-3 bg-[var(--color-accent-gold)] text-[var(--color-edition)] text-xs uppercase tracking-[0.18em] font-medium rounded-sm hover:bg-[var(--color-accent-gold)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-gold"
          @click="save"
        >
          <span
            v-if="saving"
            class="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          {{ saving ? t('galleries.saving') : t('galleries.saveChanges') }}
        </button>
      </template>
    </AdminDrawer>
  </div>
</template>
