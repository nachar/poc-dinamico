<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";

const clientId = import.meta.env.VITE_FUDO_CLIENT_ID;
const clientSecret = import.meta.env.VITE_FUDO_CLIENT_SECRET;

const api = axios.create({
  baseURL: "https://integrations.fu.do/fudo",
  headers: {
    accept: "application/json",
    "accept-language": "en,es;q=0.9,es-ES;q=0.8",
  },
});

const authClient = axios.create({
  baseURL: "https://integrations.fu.do/fudo",
  headers: {
    accept: "application/json",
    "accept-language": "en,es;q=0.9,es-ES;q=0.8",
    "content-type": "application/json",
  },
});

let authToken = null;
let tokenPromise = null;

const fetchToken = async () => {
  if (authToken) return authToken;
  if (tokenPromise) return tokenPromise;

  if (!clientId || !clientSecret) {
    throw new Error("Missing VITE_FUDO_CLIENT_ID or VITE_FUDO_CLIENT_SECRET.");
  }

  tokenPromise = authClient
    .post("/auth", { clientId, clientSecret })
    .then((response) => {
      authToken = response?.data?.token ?? null;
      return authToken;
    })
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
};

api.interceptors.request.use(async (config) => {
  const token = await fetchToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["fudo-external-app-authorization"] = `Bearer ${token}`;
  }
  return config;
});

const products = ref([]);

const fetchProducts = async () => {
  try {
    const { data } = await api.get("/products");
    products.value = data.products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }
};

onMounted(fetchProducts);
</script>

<template>
  <v-app>
    <v-app-bar
      color="deep-orange-darken-4"
      density="comfortable"
      elevation="2"
    >
      <v-app-bar-title>Smoky Grill Burgers</v-app-bar-title>
      <v-spacer />
      <v-chip
        color="orange-darken-2"
        variant="tonal"
      >
        Fresh off the grill
      </v-chip>
    </v-app-bar>

    <v-main>
      <v-container class="py-8">
        <v-row
          class="mb-6"
          align="center"
          justify="space-between"
        >
          <v-col
            cols="12"
            md="7"
          >
            <h1 class="text-h4 text-md-h3">
              Burger Menu
            </h1>
            <div class="text-body-1 text-medium-emphasis">
              Smash-style, bold flavors, no compromises.
            </div>
          </v-col>
          <v-col
            cols="12"
            md="5"
            class="text-md-right"
          >
            <v-btn
              color="deep-orange-lighten-1"
              size="large"
              variant="flat"
            >
              Order Now
            </v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="products.length === 0"
          type="info"
          variant="tonal"
          border="start"
          color="orange-lighten-1"
        >
          Loading the grill. Products will appear here in a moment.
        </v-alert>

        <v-row
          v-else
          dense
        >
          <v-col
            v-for="product in products"
            :key="product.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              color="grey-darken-4"
              elevation="6"
            >
              <v-img
                v-if="product.image"
                :src="product.image"
                height="180"
                cover
              />
              <v-sheet
                v-else
                height="180"
                color="grey-darken-3"
                class="d-flex align-center justify-center"
              >
                <v-icon
                  size="48"
                  color="orange-lighten-2"
                >
                  mdi-hamburger
                </v-icon>
              </v-sheet>

              <v-card-title class="text-h6">
                {{ product.name }}
              </v-card-title>
              <v-card-subtitle class="text-medium-emphasis">
                Signature burger
              </v-card-subtitle>

              <v-card-text class="d-flex align-center justify-space-between">
                <div class="text-h6">
                  {{ product.price?.toFixed?.(2) ?? product.price }}
                </div>
                <v-chip
                  color="orange-darken-2"
                  variant="tonal"
                  size="small"
                >
                  Hot & Fresh
                </v-chip>
              </v-card-text>

              <v-card-actions>
                <v-btn
                  color="orange-darken-2"
                  variant="flat"
                  block
                >
                  Add to tray
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
