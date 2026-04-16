<script setup lang="ts">
interface GalleryRef {
  id: string
  name: { eu: string, es: string, fr: string, en: string }
  color: string
}

interface VerifyResponse {
  ok: boolean
  route: {
    id: string
    slug: string
    name: { eu: string, es: string, fr: string, en: string }
    galleries: GalleryRef[]
  }
}

interface SlotData {
  id: string
  date: string
  startTime: string
  endTime: string
  language: string
  capacity: number
  booked: number
  attendedCount: number
}

interface SlotsResponse {
  slots: SlotData[]
}

definePageMeta({ layout: 'galeriste', i18n: false })
useSeoMeta({ title: 'Irekiak · Espace galeriste', robots: 'noindex, nofollow' })

const route = useRoute()
const router = useRouter()
const routeSlug = computed(() => String(route.params.route ?? ''))

const { t, locale } = useAdminT()
const { token, setToken, clearToken, authedFetch } = useGaleriste(routeSlug.value)

const routeMeta = useState<VerifyResponse['route'] | null>(
  `galeriste-meta-${routeSlug.value}`,
  () => null,
)
const slots = ref<SlotData[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const accessDenied = ref(false)

onMounted(() => {
  void initialize()
})

async function initialize(): Promise<void> {
  const queryKey = route.query.key
  if (typeof queryKey === 'string' && queryKey.length > 0) {
    setToken(queryKey)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('key')
      window.history.replaceState({}, '', url.toString())
    }
  }

  if (!token.value) {
    accessDenied.value = true
    loading.value = false
    return
  }

  await loadAll()
}

async function loadAll(): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    const verify = await authedFetch<VerifyResponse>(
      `/api/galeristes/${routeSlug.value}/verify`,
    )
    routeMeta.value = verify.route

    const slotsRes = await authedFetch<SlotsResponse>(
      `/api/galeristes/${routeSlug.value}/slots`,
    )
    slots.value = slotsRes.slots ?? []
  }
  catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode
    if (code === 401 || code === 403) {
      clearToken()
      routeMeta.value = null
      accessDenied.value = true
    }
    else {
      errorMessage.value = t('galeriste.loading')
    }
  }
  finally {
    loading.value = false
  }
}

const galleriesLabel = computed(() => {
  if (!routeMeta.value) return ''
  return routeMeta.value.galleries
    .map(g => g.name[locale.value] || g.name.fr || g.name.eu)
    .join(' · ')
})

function isUpcoming(slot: SlotData): boolean {
  const slotEnd = new Date(`${slot.date}T${slot.endTime}:00`)
  return slotEnd.getTime() >= Date.now()
}

const sortedSlots = computed(() =>
  [...slots.value].sort((a, b) => {
    const ka = `${a.date}T${a.startTime}`
    const kb = `${b.date}T${b.startTime}`
    return ka.localeCompare(kb)
  }),
)

const nextSlot = computed<SlotData | null>(() => {
  return sortedSlots.value.find(isUpcoming) ?? null
})

const otherSlots = computed<SlotData[]>(() => {
  if (!nextSlot.value) return sortedSlots.value
  return sortedSlots.value.filter(s => s.id !== nextSlot.value!.id)
})

function backHome(): void {
  void router.replace('/')
}
</script>

<template>
  <div>
    <div v-if="accessDenied" class="text-center py-16">
      <div class="text-5xl text-white/20 mb-6">🔒</div>
      <h2 class="text-xl font-light mb-3">{{ t('galeriste.invalidLink') }}</h2>
      <p class="text-sm text-white/50 max-w-sm mx-auto mb-6">{{ t('galeriste.invalidLinkDesc') }}</p>
      <AdminBaseButton variant="secondary" @click="backHome">
        ← Irekiak
      </AdminBaseButton>
    </div>

    <template v-else>
      <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

      <template v-if="loading && !routeMeta">
        <div class="space-y-4">
          <AdminSkeleton variant="card" :count="6" />
        </div>
      </template>

      <template v-else>
        <div v-if="routeMeta" class="mb-8">
          <p class="text-sm text-white/60">{{ t('galeriste.welcome') }}</p>
          <h2 class="text-2xl font-light mt-1">
            {{ routeMeta.name[locale] || routeMeta.name.fr || routeMeta.name.eu }}
          </h2>
          <p v-if="galleriesLabel" class="text-sm text-white/50 mt-2">
            <span class="uppercase tracking-wider text-[10px] font-mono mr-2">{{ t('galeriste.yourGalleries') }}</span>
            {{ galleriesLabel }}
          </p>
        </div>

        <AdminEmptyState
          v-if="slots.length === 0"
          :title="t('galeriste.noSlotsYet')"
          :description="t('galeriste.noSlotsDesc')"
          icon="📋"
        />

        <template v-else>
          <section v-if="nextSlot" class="mb-8">
            <h3 class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">
              {{ t('galeriste.nextSlot') }}
            </h3>
            <GaleristeSlotCard
              :slot-data="nextSlot"
              :route-slug="routeSlug"
              is-primary
            />
          </section>

          <section v-if="otherSlots.length > 0">
            <h3 class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">
              {{ t('galeriste.allSlots') }}
            </h3>
            <div class="space-y-3">
              <GaleristeSlotCard
                v-for="s in otherSlots"
                :key="s.id"
                :slot-data="s"
                :route-slug="routeSlug"
              />
            </div>
          </section>
        </template>
      </template>
    </template>
  </div>
</template>
