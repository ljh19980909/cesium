<template>
  <div id="cesium-map"></div>
</template>

<script setup>
import * as Cesium from "cesium";
import { onMounted } from "vue";

let viewer = null;
const init = () => {
  Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZGJkNGY4ZS1jOTJlLTQ4MDYtOGMzMi04YWY2NWZiMzM5MDEiLCJpZCI6MTE4MDEzLCJpYXQiOjE2NzA4MTE5NTF9.wm0bMFEShu-MDLGJm0hB-6YxFYobCyWqKwhtkVS1ve4";

  viewer = new Cesium.Viewer("cesium-map", {
    animation: false, // 如果设置为false，将不会创建 左下角动画 小部件
    baseLayerPicker: false, // 如果设置为false，将不会创建 右上角图层 按钮
    fullscreenButton: false, // 如果设置为false，将不会创建 右下角全屏 按钮
    vrButton: false, // 设置为false，将不会创建 右下角vrButton 按钮
    geocoder: false, // 如果设置为false，将不会创建 右上角查询(放大镜) 按钮
    homeButton: false, // 如果设置为false，将不会创建 右上角主页(房子) 按钮
    infoBox: false, // 是否显示点击要素之后显示的信息
    sceneModePicker: false, // 如果设置为false，将不会创建 右上角投影方式控件(显示二三维切换按钮)
    selectionIndicator: false, // 是否显示选取指示器组件 (绿色的类似锁定图标)
    timeline: false, // 如果设置为false，则不会创建 正下方时间轴小部件
    navigationHelpButton: false, // 如果设置为false，则不会创建右上角帮助(问号)按钮
    scene3DOnly: true, // 为 true 时，每个几何实例将仅以3D渲染以节省GPU内存
    shouldAnimate: false, // 可选如果默认情况下时钟应尝试延长仿真时间，则为 true ，否则为 false 。

    fullscreenElement: document.body,
    skyBox: false, // 可选用来渲染星星的天空盒
    sceneMode: 3, // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
    requestRenderMode: false,
    showRenderLoopErrors: true, // 如果为true，则在发生渲染循环错误时，此小部件将自动向包含错误的用户显示HTML面板
  });

  // 隐藏版权
  viewer._cesiumWidget._creditContainer.style.display = "none";
  // 开启切片缓存
  Cesium.ResourceCache.enabled = true;

  // 将 viewer 缓存在 window中
  window.viewer = viewer;
};

onMounted(() => init());
</script>

<style scoped lang="scss">
#cesium-map {
  width: 100%;
  height: 100%;
}
</style>
