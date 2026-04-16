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

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Galeries', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

const galleries = ref<Row[]>([])
const errorMessage = ref<string | null>(null)
const editing = ref<string | null>(null)
const form = reactive<Contact>({
  email: '', name: '', phone: '', preferredLanguage: 'es', notifyOnBooking: true, receiveDailyDigest: true,
})
const saving = ref(false)

async function load() {
  try {
    galleries.value = await $fetch<Row[]>('/api/admin/galleries', { headers: { 'x-admin-token': token.value } })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('galleries.loadFailed')
  }
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
    editing.value = null
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? t('galleries.saveFailed'))
  }
  finally { saving.value = false }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('galleries.title')" :subtitle="t('galleries.subtitle')" />
    <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <div class="space-y-3">
      <div v-for="g in galleries" :key="g.id" class="bg-edition-dark border border-white/10 rounded-sm p-4">
        <div v-if="editing !== g.id" class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold">{{ g.name }}</h2>
            <div class="text-sm text-white/70 mt-1">
              <span v-if="g.contact"><strong>{{ g.contact.email }}</strong> · {{ g.contact.preferredLanguage.toUpperCase() }}</span>
              <span v-else class="text-white/40">{{ t('galleries.noContact') }}</span>
            </div>
            <div v-if="g.contact" class="text-xs text-white/40 mt-1 space-x-3 font-mono">
              <span>notifyOnBooking: {{ g.contact.notifyOnBooking ? '✓' : '✗' }}</span>
              <span>receiveDailyDigest: {{ g.contact.receiveDailyDigest ? '✓' : '✗' }}</span>
            </div>
          </div>
          <AdminBaseButton variant="secondary" @click="startEdit(g)">
            {{ t('galleries.editButton') }}
          </AdminBaseButton>
        </div>

        <form v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm" @submit.prevent="save">
          <h3 class="sm:col-span-2 text-base font-semibold">{{ g.name }}</h3>
          <label>
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('galleries.fieldEmail') }}</span>
            <input v-model="form.email" type="email" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          </label>
          <label>
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('galleries.fieldContactName') }}</span>
            <input v-model="form.name" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          </label>
          <label>
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('galleries.fieldPhone') }}</span>
            <input v-model="form.phone" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          </label>
          <label>
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('galleries.fieldLanguage') }}</span>
            <select v-model="form.preferredLanguage" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
              <option value="eu">Euskara</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
          <label class="flex items-center gap-2">
            <input v-model="form.notifyOnBooking" type="checkbox" class="accent-white">
            {{ t('galleries.notifyOnBooking') }}
          </label>
          <label class="flex items-center gap-2">
            <input v-model="form.receiveDailyDigest" type="checkbox" class="accent-white">
            {{ t('galleries.receiveDailyDigest') }}
          </label>
          <div class="sm:col-span-2 flex gap-3 justify-end mt-2">
            <AdminBaseButton variant="ghost" :disabled="saving" @click="editing = null">
              {{ t('galleries.cancelEdit') }}
            </AdminBaseButton>
            <AdminBaseButton variant="primary" type="submit" :loading="saving" :disabled="saving">
              {{ saving ? t('galleries.saving') : t('galleries.saveChanges') }}
            </AdminBaseButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
