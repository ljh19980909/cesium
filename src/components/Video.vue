<template>
    <div class="box">
        <div :id="name" style="width:300px;height: 200px"></div>
    </div>
</template>

<script setup>
import { onMounted } from '@vue/runtime-core';
import DPlayer from 'dplayer'
import Hls from 'hls.js';

const props = defineProps({
    url: { type: String, required: true, default: '111' },
    name: { type: String, required: true, default: 'dplayer' }
})
const switchVideo = () => {
    new DPlayer({
        container: document.getElementById(props.name),
        video: {
            url: props.url, //视频地址
            type: 'customHls',
            customType: {
                customHls: (video, player) => {
                    const hls = new Hls(); //实例化Hls  用于解析m3u8
                    hls.loadSource(video.src);
                    hls.attachMedia(video);
                }
            }
        },
        autoplay: true, //是否自动播放
        theme: '#FADFA3', //主题色
        loop: true, //视频是否循环播放
        lang: 'zh-cn',
        screenshot: false, //是否开启截图
        hotkey: true, //是否开启热键
        preload: 'auto', //视频是否预加载
        volume: 0.7, //默认音量
        mutex: true, //阻止多个播放器同时播放，当前播放器播放时暂停其他播放器
    })
}
onMounted(() => switchVideo())

</script>

<style scoped lang="scss">

</style>