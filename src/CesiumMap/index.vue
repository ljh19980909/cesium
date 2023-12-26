<template>
  <div id="cesium-map"></div>
</template>

<script setup>
import { Viewer } from "cesium";

console.log(Viewer, "Viewer");
</script>

<style scoped lang="scss">
#cesium-map {
  width: 100%;
  height: 100%;
}
</style>
