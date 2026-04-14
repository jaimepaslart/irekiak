<script setup lang="ts">
const { t } = useI18n()

usePageSeo('contact')
useScrollReveal()
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 md:px-12 py-24 pt-28">
    <h1 class="mb-12 reveal-on-scroll">{{ t('nav.contact') }}</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
      <!-- Contact info -->
      <div class="reveal-on-scroll space-y-8">
        <div>
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">Email</p>
          <a href="mailto:irekiak@irekiak.eus" class="text-white text-lg hover:text-white/80 transition-colors">
            irekiak@irekiak.eus
          </a>
        </div>

        <div>
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">Instagram</p>
          <a href="https://www.instagram.com/irekiak.gallery.weekend" target="_blank" rel="noopener noreferrer"
            class="text-white hover:text-white/80 transition-colors">
            @irekiak.gallery.weekend
          </a>
        </div>

        <div>
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">Helbidea</p>
          <p class="text-white/70">Kale berria 5</p>
          <p class="text-white/70">20001 Donostia / San Sebastián</p>
        </div>
      </div>

      <!-- Form -->
      <div class="reveal-on-scroll">
        <form class="space-y-6" @submit.prevent>
          <div>
            <label for="name" class="block text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
              {{ t('contact.name') }}
            </label>
            <input
              id="name"
              type="text"
              required
              aria-required="true"
              class="w-full px-4 py-2.5 text-sm bg-white/10 border border-white/15 rounded-sm
                     text-white placeholder-white/40
                     focus:outline-none focus:border-white/40 transition-colors"
              :placeholder="t('contact.name')"
            >
          </div>

          <div>
            <label for="email" class="block text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
              {{ t('contact.email') }}
            </label>
            <input
              id="email"
              type="email"
              required
              aria-required="true"
              class="w-full px-4 py-2.5 text-sm bg-white/10 border border-white/15 rounded-sm
                     text-white placeholder-white/40
                     focus:outline-none focus:border-white/40 transition-colors"
              :placeholder="t('contact.email')"
            >
          </div>

          <div>
            <label for="message" class="block text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
              {{ t('contact.message') }}
            </label>
            <textarea
              id="message"
              rows="5"
              required
              aria-required="true"
              class="w-full px-4 py-2.5 text-sm bg-white/10 border border-white/15 rounded-sm
                     text-white placeholder-white/40 resize-y
                     focus:outline-none focus:border-white/40 transition-colors"
              :placeholder="t('contact.message')"
            />
          </div>

          <button
            type="submit"
            class="px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)]
                   transition-all duration-300 hover:bg-white/90"
          >
            {{ t('contact.send') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
