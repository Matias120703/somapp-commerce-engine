import { createClient } from "@/lib/supabase/client";
import type { CheckoutFormValues } from "@/lib/checkout";
import type { CartLineItem } from "@/store/cart-store";

/**
 * Única vía de escritura pública hacia `orders`/`order_items`/`customers`
 * (Sprint 5.6) -- a diferencia del resto de `services/storefront/*`, usa
 * el cliente de **browser** (`lib/supabase/client.ts`), no el de servidor:
 * esto se invoca desde un click en un Client Component ya hidratado
 * (`OrderConfirmationDetails`, dentro de Checkout), no durante el render
 * de una página. Mismo criterio que ya usa `services/products.ts` del
 * panel para sus escrituras.
 *
 * Toda la escritura real vive en la función de Postgres `create_order`
 * (`supabase/migrations/..._create_order_function.sql`) -- acá solo se
 * arma el payload y se invoca. Ver esa migración para la garantía de
 * atomicidad (una función de Postgres es una única transacción implícita).
 */

export type CreateOrderResult = {
  orderId: string;
  orderNumber: number;
};

export async function createOrder(
  values: CheckoutFormValues,
  items: CartLineItem[],
  subtotal: number,
  whatsappMessage: string
): Promise<CreateOrderResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("create_order", {
    p_first_name: values.firstName,
    p_last_name: values.lastName,
    p_phone: values.phone,
    p_email: values.email || null,
    p_delivery_method: values.deliveryMethod,
    p_payment_method: values.paymentMethod,
    p_department: values.deliveryMethod === "delivery" ? values.department : null,
    p_city: values.deliveryMethod === "delivery" ? values.city : null,
    p_neighborhood: values.deliveryMethod === "delivery" ? values.neighborhood : null,
    p_address: values.deliveryMethod === "delivery" ? values.address : null,
    p_reference: values.deliveryMethod === "delivery" ? values.reference || null : null,
    p_latitude: values.deliveryMethod === "delivery" ? values.latitude : null,
    p_longitude: values.deliveryMethod === "delivery" ? values.longitude : null,
    p_notes: values.notes || null,
    // `total` = `subtotal` hoy: no existe cálculo real de envío todavía
    // (siteConfig.checkoutPage.summary.shippingPlaceholder, "se calcula
    // en el próximo paso") -- `orders.shipping_cost` queda null, lista
    // para cuando ese cálculo exista, sin que este sprint lo invente.
    p_subtotal: subtotal,
    p_total: subtotal,
    p_whatsapp_message: whatsappMessage,
    p_items: items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    })),
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return { orderId: row.order_id, orderNumber: Number(row.order_number) };
}
