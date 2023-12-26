<template>
  <div class="frame">
    <section class="left-area"> 
    </section>
    <section class="right-area"> 
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
.frame {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 96px 20px 0 20px;
  box-sizing: border-box;
  overflow: hidden;
  perspective: 1000px; 
  .left-area,
  .right-area {
    position: absolute;
    z-index: 9;
    background: red;
    width: 30%;
    height: calc(100% - 96px - 45px);  // 后面那个减多少得自己调整
    border: 1px solid red; 
  }
  .left-area {
    transform: rotateY(-160deg);   // 这两个 相加必须得是 360
    left: 0;
    .area-wrap {
      transform: rotateY(160deg);
    }
  }
  .right-area {
    transform: rotateY(-200deg);   // 这两个 相加必须得是 360
    right: 0;
    .area-wrap {
      transform: rotateY(200deg);
    }
  }
}
</style>