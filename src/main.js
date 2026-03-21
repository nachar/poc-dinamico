import { createApp } from "vue";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import "./style.css";
import App from "./App.vue";
import router from "./router";

const vuetify = createVuetify({
  theme: {
    defaultTheme: "dark",
  },
});

createApp(App).use(router).use(vuetify).mount("#app");
