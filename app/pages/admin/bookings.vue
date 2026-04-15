<script setup lang="ts">
interface AdminBookingRow {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  guests: number
  language: string
  status: 'confirmed' | 'cancelled' | 'waitlist'
  confirmToken: string
  slotDate: string
  slotStartTime: string
  routeId: string
  routeNameEu: string
}

definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Admin - Irekiak Bookings',
  robots: 'noindex, nofollow',
})

const STORAGE_KEY = 'irekiak_admin_token'

const token = ref('')
const tokenInput = ref('')
const bookings = ref<AdminBookingRow[]>([])
const loading = ref(false)
const errorMessage = ref<string | null>(null)

onMounted(() => {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    token.value = stored
    void fetchBookings()
  }
})

async function fetchBookings() {
  if (!token.value) return
  loading.value = true
  errorMessage.value = null
  try {
    const data = await $fetch<AdminBookingRow[]>('/api/admin/bookings', {
      headers: { 'x-admin-token': token.value },
    })
    bookings.value = data
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 401) {
      errorMessage.value = 'Invalid admin token.'
      logout(false)
    }
    else if (status === 503) {
      errorMessage.value = 'Admin access is not configured on the server.'
    }
    else {
      errorMessage.value = 'Failed to fetch bookings. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}

function login() {
  const value = tokenInput.value.trim()
  if (!value) return
  token.value = value
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, value)
  }
  tokenInput.value = ''
  void fetchBookings()
}

function logout(clear = true) {
  token.value = ''
  bookings.value = []
  if (clear && typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  catch {
    return iso
  }
}

const statusStyles: Record<AdminBookingRow['status'], string> = {
  confirmed: 'bg-green-500/10 text-green-300 border border-green-400/30',
  cancelled: 'bg-red-500/10 text-red-300 border border-red-400/30',
  waitlist: 'bg-amber-500/10 text-amber-300 border border-amber-400/30',
}
</script>

<template>
  <main class="bg-edition-dark min-h-screen text-white">
    <div class="max-w-7xl mx-auto px-6 py-12">
      <header class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white">
            Admin - Bookings
          </h1>
          <p class="text-sm text-white/60 mt-1">
            Irekiak Gallery Weekend
          </p>
        </div>
        <div
          v-if="token"
          class="flex items-center gap-3"
        >
          <span class="text-sm text-white/70">
            Total: <span class="font-semibold text-white">{{ bookings.length }}</span>
          </span>
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-md bg-[#003153] hover:bg-[#004A7E] text-white border border-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            :disabled="loading"
            @click="fetchBookings"
          >
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-md bg-transparent hover:bg-white/10 text-white border border-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            @click="logout(true)"
          >
            Logout
          </button>
        </div>
      </header>

      <div
        v-if="errorMessage"
        class="mb-6 p-4 rounded-md bg-red-500/10 border border-red-400/30 text-red-200 text-sm"
        role="alert"
      >
        {{ errorMessage }}
      </div>

      <section
        v-if="!token"
        class="max-w-md mx-auto bg-[#003153] border border-white/15 rounded-lg p-8 mt-8"
      >
        <h2 class="text-xl font-semibold text-white mb-2">
          Admin login
        </h2>
        <p class="text-sm text-white/70 mb-6">
          Enter your admin token to access the dashboard.
        </p>
        <form @submit.prevent="login">
          <label
            for="admin-token"
            class="block text-sm font-medium text-white mb-2"
          >
            Admin token
          </label>
          <input
            id="admin-token"
            v-model="tokenInput"
            type="password"
            autocomplete="current-password"
            required
            class="w-full px-4 py-2 rounded-md bg-black/30 border border-white/15 text-white placeholder-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            placeholder="••••••••"
          >
          <button
            type="submit"
            class="mt-4 w-full px-4 py-2 rounded-md bg-white text-[#003153] font-semibold hover:bg-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Log in
          </button>
        </form>
      </section>

      <section
        v-else
        class="rounded-lg border border-white/15 overflow-hidden"
      >
        <div
          v-if="loading && bookings.length === 0"
          class="p-12 text-center text-white/70"
        >
          Loading bookings...
        </div>
        <div
          v-else-if="bookings.length === 0"
          class="p-12 text-center text-white/70"
        >
          No bookings yet.
        </div>
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-sm text-left text-white">
            <caption class="sr-only">
              All Irekiak Gallery Weekend bookings
            </caption>
            <thead class="bg-[#003153] text-white/80 uppercase text-xs tracking-wide">
              <tr>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Created
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Date
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Time
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Route
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15 text-right">
                  Guests
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Name
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Email
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Lang
                </th>
                <th scope="col" class="px-4 py-3 border-b border-white/15">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in bookings"
                :key="row.id"
                class="hover:bg-white/5 transition-colors"
              >
                <td class="px-4 py-3 border-b border-white/15 text-white/70 text-xs">
                  {{ formatDateTime(row.createdAt) }}
                </td>
                <td class="px-4 py-3 border-b border-white/15">
                  {{ row.slotDate }}
                </td>
                <td class="px-4 py-3 border-b border-white/15">
                  {{ row.slotStartTime }}
                </td>
                <td class="px-4 py-3 border-b border-white/15">
                  {{ row.routeNameEu }}
                </td>
                <td class="px-4 py-3 border-b border-white/15 text-right">
                  {{ row.guests }}
                </td>
                <td class="px-4 py-3 border-b border-white/15">
                  {{ row.firstName }} {{ row.lastName }}
                </td>
                <td class="px-4 py-3 border-b border-white/15 text-white/80">
                  <a
                    :href="`mailto:${row.email}`"
                    class="underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
                  >{{ row.email }}</a>
                </td>
                <td class="px-4 py-3 border-b border-white/15 uppercase text-xs">
                  {{ row.language }}
                </td>
                <td class="px-4 py-3 border-b border-white/15">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="statusStyles[row.status]"
                  >
                    {{ row.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>
