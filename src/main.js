import {
    createApp
} from "vue";
import App from "./App.vue";
import router from "./router";
import "@/style/reset.scss";

import store from "./store";


/* element-plus */
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";

const app = createApp(App);
app
    .use(store)
    .use(ElementPlus, {
        locale: zhCn,
    })
    .use(router)
    .mount("#app");