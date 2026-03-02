<template>
  <div class="swagger-container">
    <iframe 
      :src="swaggerUrl" 
      frameborder="0" 
      class="swagger-iframe"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
const swaggerUrl = 'http://192.168.1.233:8080/swagger'
</script>

<style scoped>
.swagger-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.swagger-iframe {
  width: 100%;
  height: 100%;
}
</style>