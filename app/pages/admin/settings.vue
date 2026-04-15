<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Settings', robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!

const settings = reactive({
  'bookings.accept': '1',
  'emergency.message': '',
  'notifications.enabled': '1',
})
const saving = ref<Record<string, boolean>>({})
const errorMessage = ref<string | null>(null)

async function load() {
  try {
    const res = await $fetch<typeof settings>('/api/admin/settings', { headers: { 'x-admin-token': token.value } })
    Object.assign(settings, res)
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed'
  }
}
onMounted(() => { void load() })

async function save(key: keyof typeof settings, value: string) {
  saving.value[key] = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: { key, value },
    })
    settings[key] = value
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? 'Save failed')
  }
  finally { saving.value[key] = false }
}

async function exportMarketing() {
  const res = await fetch('/api/admin/bookings', { headers: { 'x-admin-token': token.value } })
  const list = await res.json() as Array<{ email: string, firstName: string, lastName: string, language: string, status: string }>
  // Note: acceptsMarketing isn't in admin/bookings response; we export all confirmed emails for now
  const confirmed = list.filter(b => b.status !== 'cancelled')
  const csv = ['email,first_name,last_name,language', ...confirmed.map(b => `"${b.email}","${b.firstName}","${b.lastName}","${b.language}"`)].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `irekiak-marketing-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <h1 class="m-0 text-2xl mb-2">Settings</h1>
    <p class="text-sm text-white/50 mb-8">Contrôles globaux</p>
    <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <div class="max-w-2xl space-y-6">
      <!-- Accept bookings -->
      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">Accepter les réservations</h2>
            <p class="text-sm text-white/60 mt-1">Si désactivé, POST /api/bookings renvoie 503.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              :checked="settings['bookings.accept'] === '1'"
              type="checkbox"
              class="sr-only peer"
              :disabled="saving['bookings.accept']"
              @change="save('bookings.accept', ($event.target as HTMLInputElement).checked ? '1' : '0')"
            >
            <div class="w-11 h-6 bg-white/10 peer-checked:bg-emerald-500 rounded-full transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>

      <!-- Notifications enabled -->
      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">Notifications email</h2>
            <p class="text-sm text-white/60 mt-1">Pause l'émission de tous les emails (confirmation, galerie, blast, rappel).</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              :checked="settings['notifications.enabled'] === '1'"
              type="checkbox"
              class="sr-only peer"
              :disabled="saving['notifications.enabled']"
              @change="save('notifications.enabled', ($event.target as HTMLInputElement).checked ? '1' : '0')"
            >
            <div class="w-11 h-6 bg-white/10 peer-checked:bg-emerald-500 rounded-full transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>

      <!-- Emergency message -->
      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <h2 class="text-base font-semibold mb-1">Message d'urgence</h2>
        <p class="text-sm text-white/60 mb-3">Banner affiché sur /visites si non vide. Laisser vide en temps normal.</p>
        <textarea
          v-model="settings['emergency.message']"
          rows="3"
          maxlength="500"
          class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white"
          placeholder="Ex: Visites guidées reportées au 06.06 en raison des intempéries."
        />
        <button type="button" class="mt-3 px-4 py-2 text-sm bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90" :disabled="saving['emergency.message']" @click="save('emergency.message', settings['emergency.message'])">
          {{ saving['emergency.message'] ? '…' : 'Enregistrer' }}
        </button>
      </div>

      <!-- Marketing export -->
      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <h2 class="text-base font-semibold mb-1">Export contacts</h2>
        <p class="text-sm text-white/60 mb-3">CSV des emails des visiteurs confirmés (tous, pour mailing édition 2027).</p>
        <button type="button" class="px-4 py-2 text-sm border border-white/20 rounded-sm hover:bg-white/10" @click="exportMarketing">↓ Export CSV</button>
      </div>

      <!-- Quick links -->
      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <h2 class="text-base font-semibold mb-3">Actions rapides</h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink to="/admin/galleries" class="text-sm px-4 py-2 border border-white/20 rounded-sm hover:bg-white/10">Contacts galeries</NuxtLink>
          <NuxtLink to="/admin/blast" class="text-sm px-4 py-2 border border-white/20 rounded-sm hover:bg-white/10">Blast email</NuxtLink>
          <NuxtLink to="/admin/checkin" class="text-sm px-4 py-2 border border-white/20 rounded-sm hover:bg-white/10">Check-in overview</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
