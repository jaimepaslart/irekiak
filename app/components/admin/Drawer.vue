<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close(): void {
  emit('update:modelValue', false)
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(() => props.modelValue, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="drawer-fade">
        <div
          v-if="modelValue"
          class="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
          @click="close"
        />
      </Transition>
      <Transition name="drawer-slide">
        <aside
          v-if="modelValue"
          class="fixed right-0 top-0 bottom-0 z-[1101] w-full max-w-md bg-[var(--color-edition-dark)] border-l border-white/10 flex flex-col"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 class="text-base font-semibold text-white">
              {{ title }}
            </h2>
            <button
              type="button"
              class="text-white/60 hover:text-white text-xl leading-none p-1 -m-1"
              aria-label="Close drawer"
              @click="close"
            >
              ✕
            </button>
          </header>
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <slot />
          </div>
          <footer
            v-if="$slots.actions"
            class="border-t border-white/10 px-6 py-4 flex items-center justify-end gap-2"
          >
            <slot name="actions" />
          </footer>
        </aside>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 200ms ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
