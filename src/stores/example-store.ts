import { defineStore, acceptHMRUpdate } from 'pinia';

export const useCounterStore = defineStore('counter', {
  // Simple counter state for demo scaffolding.
  state: () => ({
    counter: 0,
  }),

  // Derived values for display.
  getters: {
    doubleCount: (state) => state.counter * 2,
  },

  // Mutations that update the state.
  actions: {
    increment() {
      this.counter++;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot));
}
