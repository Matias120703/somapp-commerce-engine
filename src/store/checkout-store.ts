import { create } from "zustand";

import { initialCheckoutFormValues, type CheckoutFormValues } from "@/lib/checkout";

type CheckoutState = {
  values: CheckoutFormValues;
  setField: <K extends keyof CheckoutFormValues>(
    field: K,
    value: CheckoutFormValues[K]
  ) => void;
  /** Setea lat/lng en una sola actualización (LocationPicker, Sprint 3.7). */
  setLocation: (latitude: number, longitude: number) => void;
};

/**
 * Única fuente de verdad del formulario de checkout. Existe para que los
 * datos ingresados en /checkout sobrevivan la navegación a
 * /checkout/confirmacion (rutas distintas, sin persistencia todavía):
 * sin este store, el useState local de CheckoutForm se perdería al
 * desmontarse. Mismo patrón que store/cart-store.ts.
 */
export const useCheckoutStore = create<CheckoutState>((set) => ({
  values: initialCheckoutFormValues,

  setField: (field, value) =>
    set((state) => ({ values: { ...state.values, [field]: value } })),

  setLocation: (latitude, longitude) =>
    set((state) => ({ values: { ...state.values, latitude, longitude } })),
}));
