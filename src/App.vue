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
  <p>{{ products }}</p>
</template>
