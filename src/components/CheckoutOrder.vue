<script setup>
import { computed, onMounted, ref } from "vue";
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
const isLoading = ref(false);
const loadError = ref("");
const isPlacingOrder = ref(false);
const orderError = ref("");
const orderSuccess = ref(false);

const pickRandomProducts = (list, count) => {
  const pool = Array.isArray(list) ? [...list] : [];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

const fetchProducts = async () => {
  isLoading.value = true;
  loadError.value = "";
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
    loadError.value = "Unable to load products. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

const itemsTotal = computed(() =>
  products.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const createOrder = async () => {
  if (products.value.length === 0) {
    orderError.value = "Add at least one item before placing the order.";
    return null;
  }
  isPlacingOrder.value = true;
  orderError.value = "";
  orderSuccess.value = false;
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
          total: itemsTotal.value,
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
    orderSuccess.value = true;
    return data;
  } catch (error) {
    console.error("Failed to create order:", error);
    orderError.value = "Order failed. Please try again.";
    return null;
  } finally {
    isPlacingOrder.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchProducts()]);
});
</script>

<template>
  <v-container class="py-6">
    <v-row>
      <v-col
        cols="12"
        md="8"
      >
        <v-card>
          <v-card-title>Checkout</v-card-title>
          <v-card-text>
            <v-alert
              v-if="loadError"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ loadError }}
            </v-alert>

            <v-progress-linear
              v-if="isLoading"
              indeterminate
              color="primary"
              class="mb-4"
            />

            <v-alert
              v-else-if="products.length === 0"
              type="info"
              variant="tonal"
            >
              No items in the cart yet.
            </v-alert>

            <v-list
              v-else
              density="compact"
            >
              <template
                v-for="(item, index) in products"
                :key="item.product.id"
              >
                <v-list-item>
                  <v-list-item-title>{{ item.comment }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Product ID: {{ item.product.id }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2">Qty {{ item.quantity }}</div>
                      <div class="text-subtitle-2">
                        ${{ (item.price * item.quantity).toFixed(2) }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="index < products.length - 1" />
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-card>
          <v-card-title>Order Summary</v-card-title>
          <v-card-text>
            <v-alert
              v-if="orderError"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ orderError }}
            </v-alert>

            <v-alert
              v-if="orderSuccess"
              type="success"
              variant="tonal"
              class="mb-4"
            >
              Order created successfully.
            </v-alert>

            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Items</v-list-item-title>
                <template #append>
                  {{ products.length }}
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Subtotal</v-list-item-title>
                <template #append>
                  ${{ itemsTotal.toFixed(2) }}
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Shipping</v-list-item-title>
                <template #append>$0.00</template>
              </v-list-item>
              <v-divider />
              <v-list-item>
                <v-list-item-title>Total</v-list-item-title>
                <template #append>
                  ${{ itemsTotal.toFixed(2) }}
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              block
              :loading="isPlacingOrder"
              :disabled="isLoading || products.length === 0"
              @click="createOrder"
            >
              Place Order
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
