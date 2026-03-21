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

const pickRandomProducts = (list, count) => {
  const pool = Array.isArray(list) ? [...list] : [];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

const fetchProducts = async () => {
  try {
    const { data } = await api.get("/products");
    const selectedProducts = pickRandomProducts(data?.products ?? [], 3);
    products.value = selectedProducts.map((product) => ({
      comment: product.name,
      quantity: 1,
      price: product.price,
      product: {
        id: product.id,
      },
      subitems: [],
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }
};

const createOrder = async () => {
  try {
    const payload = {
      order: {
        comment: "Second demo order with different items",
        customer: {
          email: "luis.perez@example.com",
          phone: "555222333",
          name: "Luis Perez",
        },
        discounts: [
          {
            amount: 10,
          },
        ],
        externalId: "order-demo-products-002",
        items: products.value,
        payment: {
          paymentMethod: {
            id: 3,
          },
          total: products.value.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
        },
        shippingCost: 0,
        type: "delivery",
        typeOptions: {
          expectedTime: "2026-03-15T21:00:00.000Z",
          address: "456 Sample Avenue",
        },
      },
    };

    const { data } = await api.post("/orders", payload, {
      headers: {
        "content-type": "application/json",
      },
    });
    return data;
  } catch (error) {
    console.error("Failed to create order:", error);
    return null;
  }
};

onMounted(async () => {
  await Promise.all([fetchProducts()]);
});
</script>

<template>
  <p>{{ products }}</p>
</template>

<style scoped>

</style>
