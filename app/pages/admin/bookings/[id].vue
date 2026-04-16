<script setup lang="ts">
interface DetailPayload {
  booking: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    numberOfPeople: number
    language: string
    specialNeeds: string | null
    status: 'confirmed' | 'cancelled' | 'waitlist'
    confirmToken: string
    acceptsMarketing: boolean
    createdAt: string
    slotId: string
  }
  slot: { id: string, date: string, startTime: string, endTime: string, language: string, maxParticipants: number, bookedCount: number }
  route: { id: string, nameEu: string, nameEs: string, nameFr: string, nameEn: string, color: string }
  audit: Array<{ id: string, timestamp: string, actor: string, action: string, metadata: unknown }>
  attendance: { bookingId: string, checkedInAt: string, checkedInBy: string, notes: string | null } | null
}

definePageMeta({ layout: 'admin' })

const { t } = useAdminT()
useSeoMeta({ title: () => t('bookings.seoTitleDetail'), robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!
const route = useRoute()
const bookingId = computed(() => String(route.params.id))

const data = ref<DetailPayload | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const editing = ref(false)
const saving = ref(false)

interface EditForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  numberOfPeople: number
  specialNeeds: string
}
const form = reactive<EditForm>({
  firstName: '', lastName: '', email: '', phone: '', numberOfPeople: 1, specialNeeds: '',
})

async function load() {
  loading.value = true
  try {
    data.value = await $fetch<DetailPayload>(`/api/admin/bookings/${bookingId.value}`, {
      headers: { 'x-admin-token': token.value },
    })
    Object.assign(form, {
      firstName: data.value.booking.firstName,
      lastName: data.value.booking.lastName,
      email: data.value.booking.email,
      phone: data.value.booking.phone ?? '',
      numberOfPeople: data.value.booking.numberOfPeople,
      specialNeeds: data.value.booking.specialNeeds ?? '',
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('bookings.loadError')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })

async function save() {
  if (!data.value) return
  saving.value = true
  try {
    const body: Record<string, unknown> = {}
    const b = data.value.booking
    if (form.firstName !== b.firstName) body.firstName = form.firstName
    if (form.lastName !== b.lastName) body.lastName = form.lastName
    if (form.email !== b.email) body.email = form.email
    if ((form.phone || null) !== b.phone) body.phone = form.phone || null
    if (form.numberOfPeople !== b.numberOfPeople) body.numberOfPeople = form.numberOfPeople
    if ((form.specialNeeds || null) !== b.specialNeeds) body.specialNeeds = form.specialNeeds || null

    if (Object.keys(body).length === 0) {
      editing.value = false
      return
    }

    await $fetch(`/api/admin/bookings/${bookingId.value}/edit`, {
      method: 'PATCH',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body,
    })
    editing.value = false
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? t('bookings.saveError'))
  }
  finally { saving.value = false }
}

async function resend() {
  try {
    await $fetch(`/api/admin/bookings/${bookingId.value}/resend`, {
      method: 'POST', headers: { 'x-admin-token': token.value },
    })
    alert(t('bookings.resendSuccess'))
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? t('bookings.resendFailed'))
  }
}

async function cancel() {
  if (!confirm(t('bookings.confirmCancel'))) return
  try {
    await $fetch(`/api/admin/bookings/${bookingId.value}/cancel`, {
      method: 'POST', headers: { 'x-admin-token': token.value },
    })
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? t('bookings.cancelError'))
  }
}

function statusBadgeLabel(s: 'confirmed' | 'cancelled' | 'waitlist'): string {
  if (s === 'confirmed') return t('bookings.statusConfirmed')
  if (s === 'cancelled') return t('bookings.statusCancelled')
  return t('bookings.statusWaitlist')
}

function actionColor(a: string): string {
  if (a.includes('cancel')) return 'text-red-300'
  if (a.includes('create')) return 'text-emerald-300'
  if (a.includes('email.failed')) return 'text-orange-300'
  if (a.includes('edit')) return 'text-blue-300'
  return 'text-white/70'
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6">
      {{ t('bookings.detailBack') }}
    </NuxtLink>

    <p v-if="loading" class="text-white/40">{{ t('common.loading') }}</p>
    <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>

    <template v-if="data">
      <AdminPageHeader
        :title="`${data.booking.firstName} ${data.booking.lastName}`"
        :subtitle="data.booking.id"
      >
        <template #actions>
          <AdminBadgeStatus :status="data.booking.status" :label="statusBadgeLabel(data.booking.status)" />
          <AdminBaseButton v-if="!editing && data.booking.status === 'confirmed'" variant="secondary" type="button" @click="editing = true">
            {{ t('bookings.detailEdit') }}
          </AdminBaseButton>
          <AdminBaseButton v-if="data.booking.status === 'confirmed'" variant="secondary" type="button" @click="resend">
            {{ t('bookings.detailResend') }}
          </AdminBaseButton>
          <AdminBaseButton v-if="data.booking.status === 'confirmed'" variant="danger" type="button" @click="cancel">
            {{ t('bookings.detailCancel') }}
          </AdminBaseButton>
        </template>
      </AdminPageHeader>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section class="lg:col-span-2 bg-edition-dark border border-white/10 rounded-sm p-6">
          <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
            <span class="w-1 h-4 rounded-full" :style="{ backgroundColor: data.route.color }" />
            {{ t('bookings.detailSection') }}
          </h2>

          <dl v-if="!editing" class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldEmail') }}</dt>
              <dd class="text-white break-all"><a :href="`mailto:${data.booking.email}`" class="hover:underline">{{ data.booking.email }}</a></dd>
            </div>
            <div v-if="data.booking.phone">
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldPhone') }}</dt>
              <dd class="text-white">{{ data.booking.phone }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldParticipants') }}</dt>
              <dd class="text-white">{{ data.booking.numberOfPeople }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldLanguage') }}</dt>
              <dd class="text-white uppercase font-mono">{{ data.booking.language }}</dd>
            </div>
            <div v-if="data.booking.specialNeeds" class="sm:col-span-2">
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldSpecialNeeds') }}</dt>
              <dd class="text-white/90">{{ data.booking.specialNeeds }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldMarketing') }}</dt>
              <dd class="text-white">{{ data.booking.acceptsMarketing ? '✓' : '—' }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldCreatedAt') }}</dt>
              <dd class="text-white/70 font-mono text-xs">{{ data.booking.createdAt }}</dd>
            </div>
          </dl>

          <form v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm" @submit.prevent="save">
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('bookings.fieldFirstName') }}</span>
              <input v-model="form.firstName" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('bookings.fieldLastName') }}</span>
              <input v-model="form.lastName" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('bookings.fieldEmail') }}</span>
              <input v-model="form.email" type="email" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('bookings.fieldPhone') }}</span>
              <input v-model="form.phone" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('bookings.editParticipantsLabel') }}</span>
              <input v-model.number="form.numberOfPeople" type="number" min="1" max="4" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">{{ t('bookings.fieldSpecialNeeds') }}</span>
              <textarea v-model="form.specialNeeds" rows="3" maxlength="1000" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white" />
            </label>
            <div class="sm:col-span-2 flex gap-3 justify-end mt-2">
              <AdminBaseButton variant="ghost" type="button" :disabled="saving" @click="editing = false">
                {{ t('common.cancel') }}
              </AdminBaseButton>
              <AdminBaseButton variant="primary" type="submit" :disabled="saving" :loading="saving">
                {{ saving ? t('bookings.detailSaving') : t('common.save') }}
              </AdminBaseButton>
            </div>
          </form>
        </section>

        <section class="bg-edition-dark border border-white/10 rounded-sm p-6">
          <h2 class="text-base font-semibold mb-4">{{ t('bookings.detailSlot') }}</h2>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldRoute') }}</dt>
              <dd class="text-white">{{ data.route.nameEu }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldDate') }}</dt>
              <dd class="text-white font-mono">{{ data.slot.date }} · {{ data.slot.startTime }}—{{ data.slot.endTime }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldCapacity') }}</dt>
              <dd class="text-white">{{ data.slot.bookedCount }} / {{ data.slot.maxParticipants }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('bookings.detailFieldCheckin') }}</dt>
              <dd>
                <span v-if="data.attendance" class="text-emerald-300">✓ {{ data.attendance.checkedInAt }}</span>
                <span v-else class="text-white/40">{{ t('bookings.detailNotCheckedIn') }}</span>
              </dd>
            </div>
            <div class="pt-2">
              <AdminBaseButton variant="secondary" as="nuxt-link" :to="`/admin/checkin/${data.slot.id}`">
                {{ t('bookings.detailViewCheckin') }}
              </AdminBaseButton>
            </div>
          </dl>
        </section>
      </div>

      <section class="mt-6 bg-edition-dark border border-white/10 rounded-sm p-6">
        <h2 class="text-base font-semibold mb-4">{{ t('bookings.detailHistory') }}</h2>
        <div v-if="data.audit.length === 0" class="text-sm text-white/40">{{ t('bookings.detailNoEvents') }}</div>
        <ol v-else class="space-y-2">
          <li v-for="e in data.audit" :key="e.id" class="flex items-start gap-3 text-sm border-b border-white/5 pb-2 last:border-0">
            <span class="text-xs text-white/40 font-mono shrink-0 w-36">{{ e.timestamp }}</span>
            <span class="text-xs uppercase tracking-wider font-mono text-white/50 shrink-0 w-16">{{ e.actor }}</span>
            <span class="font-mono text-xs shrink-0 w-48" :class="actionColor(e.action)">{{ e.action }}</span>
            <span v-if="e.metadata" class="text-xs text-white/40 font-mono truncate flex-1">{{ JSON.stringify(e.metadata) }}</span>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
