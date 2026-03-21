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
const categories = ref([]);

const fetchProducts = async () => {
  try {
    const { data } = await api.get("/products");
    products.value = data.products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }
};

const fetchProductCategories = async () => {
  try {
    const { data } = await api.get("/product-categories");
    categories.value = data?.categories ?? data ?? [];
  } catch (error) {
    console.error("Failed to fetch product categories:", error);
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
        items: [
          {
            comment: "Arrachera al grill",
            quantity: 1,
            price: 215,
            product: {
              id: 9,
            },
            subitems: [],
          },
          {
            comment: "Capuccino",
            quantity: 1,
            price: 30,
            product: {
              id: 5,
            },
            subitems: [],
          },
          {
            comment: "Cerveza",
            quantity: 2,
            price: 30,
            product: {
              id: 6,
            },
            subitems: [],
          },
        ],
        payment: {
          paymentMethod: {
            id: 3,
          },
          total: 325,
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
  await Promise.all([fetchProducts(), fetchProductCategories()]);
});
</script>

<template>
  <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolor, reiciendis.</p>
</template>

<style scoped>

</style>