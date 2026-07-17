export const businessConfig = {
  whatsapp: {
    number: "595981234567",
    defaultMessage: "Hola, quiero hacer una consulta.",
    /** {product} se reemplaza por el nombre del producto consultado. */
    productInquiryTemplate: "Hola, quiero consultar por {product}.",
  },
  currency: "PYG",
  locale: "es-PY",
  map: {
    /** Centro inicial del mapa de selección de ubicación (Plaza de los Héroes, Villarrica, Guairá). */
    defaultCenter: { lat: -25.75, lng: -56.4333 },
    defaultZoom: 14,
  },
} as const;
