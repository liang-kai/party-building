<template>
  <div>
    <button @click="count++">Count: {{count}}</button>
  </div>
</template>
<script setup>
    import { ref } from 'vue'
    const count = ref(0)
</script>
