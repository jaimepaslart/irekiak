<script setup lang="ts">
// Overlay de grain éditorial répété sur toutes les pages admin.
// Le parent doit avoir `position: relative` pour que l'overlay se positionne correctement.
</script>

<template>
  <div
    class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60"
    aria-hidden="true"
  ></div>
</template>
