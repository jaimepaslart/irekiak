<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Blast email', robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!

const scopeType = ref<'all' | 'date' | 'slot'>('all')
const scopeDate = ref<'2026-05-30' | '2026-05-31'>('2026-05-30')
const scopeSlotId = ref('')
const subject = ref('')
const body = ref('')
const sending = ref(false)
const result = ref<{ ok: boolean, recipients: number, sent: number, failed: number } | null>(null)
const errorMessage = ref<string | null>(null)

async function send() {
  if (!confirm(`Envoyer "${subject.value}" à la cible sélectionnée ?`)) return
  sending.value = true
  errorMessage.value = null
  result.value = null
  try {
    const scope = scopeType.value === 'all'
      ? { type: 'all' }
      : scopeType.value === 'date'
        ? { type: 'date', date: scopeDate.value }
        : { type: 'slot', slotId: scopeSlotId.value }
    result.value = await $fetch('/api/admin/blast', {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: { scope, subject: subject.value, body: body.value },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed'
  }
  finally { sending.value = false }
}
</script>

<template>
  <div>
    <h1 class="m-0 text-2xl mb-2">Blast email</h1>
    <p class="text-sm text-white/50 mb-8">Message urgent envoyé à tous les confirmés d'une date/slot.</p>

    <form class="max-w-2xl bg-edition-dark border border-white/10 rounded-sm p-6 space-y-5" @submit.prevent="send">
      <div>
        <label class="text-xs uppercase tracking-wider text-white/40 block mb-2">Cible</label>
        <div class="flex gap-3 mb-3">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="scopeType" type="radio" value="all" class="accent-white">
            Tous les confirmés
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="scopeType" type="radio" value="date" class="accent-white">
            Par date
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="scopeType" type="radio" value="slot" class="accent-white">
            Par créneau
          </label>
        </div>
        <select v-if="scopeType === 'date'" v-model="scopeDate" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white text-sm">
          <option value="2026-05-30">2026-05-30 (samedi)</option>
          <option value="2026-05-31">2026-05-31 (dimanche)</option>
        </select>
        <input v-if="scopeType === 'slot'" v-model="scopeSlotId" placeholder="slot-sat-1130-ac-eu" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white text-sm w-full">
      </div>

      <label class="block">
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Sujet *</span>
        <input v-model="subject" type="text" required maxlength="200" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
      </label>

      <label class="block">
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Message *</span>
        <textarea v-model="body" rows="10" required maxlength="5000" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white font-mono text-sm" placeholder="Bonjour,&#10;&#10;En raison des intempéries…" />
        <p class="text-xs text-white/40 mt-1">Les sauts de ligne simples sont convertis en &lt;br&gt;, les doubles en paragraphes.</p>
      </label>

      <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>
      <div v-if="result" class="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-4 text-sm">
        ✓ {{ result.sent }}/{{ result.recipients }} envoyés · {{ result.failed }} échecs
      </div>

      <div class="flex gap-3 justify-end">
        <button type="submit" class="px-6 py-2 text-sm font-medium bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90 disabled:opacity-50" :disabled="sending || !subject || !body">
          {{ sending ? '…' : 'Envoyer' }}
        </button>
      </div>
    </form>
  </div>
</template>
