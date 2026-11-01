/**
 * ===================================================================
 * CONFIGURACIÓN DE LA BODA - NAÏARA & GUILLERMO
 * ===================================================================
 */

const WEDDING_CONFIG = {
  // Nombres de los contrayentes
  brideName: "Naïara",
  groomName: "Guillermo",
  monogram: "Naïara & Guillermo",
  runicMonogram: "ᚾ · ᚷ",

  // Fecha y hora: Sábado 22 de Mayo de 2027 a las 12:00h
  weddingDate: {
    year: 2027,
    month: 5,      // Mayo
    day: 22,       // Sábado 22 de Mayo de 2027
    hours: 12,     // 12:00h (Ceremonia)
    minutes: 0,
    timezone: "Europe/Madrid"
  },
  
  // Textos visibles
  dateDisplayText: "22 de Mayo de 2027",
  timeDisplayText: "12:00 Horas",
  placeGeneral: "Asejar Viveros · La Hoya, Elche (Alicante)",
  epicTagline: "Destinados por las Nornas, unidos bajo el firmamento de los Dioses",
  epicSubtitle: "La saga de dos clanes que se funden en un solo destino",

  // Ubicación Principal
  venue: {
    name: "Asejar Viveros",
    subtitle: "El Oasis de los Dioses · La Hoya, Elche (Alicante)",
    address: "Partida de La Hoya, Polígono 72, Parcela 83, 03294 La Hoya, Elche (Alicante)",
    coordinates: "38°14'35.1\"N 0°46'18.8\"W",
    lat: 38.2430805,
    lng: -0.7718989,
    mapsShortUrl: "https://maps.app.goo.gl/aNG3K9HyFQzcdcWY9",
    appleMapsUrl: "https://maps.apple.com/?q=38.2430805,-0.7718989",
    embedMapUrl: "https://maps.google.com/maps?q=38.2430805,-0.7718989&hl=es&z=15&output=embed",
    description: "Un enclave natural rodeado de palmeras, vegetación mediterránea y espacios al aire libre donde celebraremos tanto el juramento sagrado como el gran banquete."
  },

  // 1. Ceremonia (12:00h)
  ceremony: {
    title: "El Juramento de Sangre y Amor",
    subtitle: "Ceremonia Civil & Bendición de los Clanes",
    time: "12:00 Horas",
    placeName: "Asejar Viveros · Zona de la Arboleda",
    address: "Partida de La Hoya, 03294 Elche (Alicante)",
    mapsUrl: "https://maps.app.goo.gl/aNG3K9HyFQzcdcWY9",
    description: "Bajo los cielos de Elche y rodeados de nuestro clan, intercambiaremos los anillos de juramento y sellaremos nuestra alianza eterna."
  },

  // 2. Banquete y Fiesta (14:00h)
  banquet: {
    title: "El Gran Festín en el Valhalla",
    subtitle: "Banquete & Fiesta de Celebración",
    time: "14:00 Horas",
    placeName: "Asejar Viveros · Jardines Principales",
    address: "Partida de La Hoya, 03294 Elche (Alicante)",
    mapsUrl: "https://maps.app.goo.gl/aNG3K9HyFQzcdcWY9",
    description: "Alzad vuestros cuernos con hidromiel y buen vino. Viandas selectas, música y fiesta para celebrar el inicio de nuestra saga."
  },

  // Cronograma / Timeline
  timeline: [
    {
      time: "11:30",
      rune: "ᛉ",
      title: "Llegada de los Clanes",
      desc: "Bienvenida de invitados en los jardines de Asejar Viveros con bebidas refrescantes."
    },
    {
      time: "12:00",
      rune: "ᚷ",
      title: "El Juramento Sagrado",
      desc: "Ceremonia de unión, votos de los novios y bendición de los anillos."
    },
    {
      time: "13:00",
      rune: "ᛋ",
      title: "El Brindis de los Skalds",
      desc: "Cóctel nupcial con aperitivos y música en vivo."
    },
    {
      time: "14:00",
      rune: "ᛟ",
      title: "El Gran Festín",
      desc: "Banquete principal, viandas y momentos especiales entre clanes."
    },
    {
      time: "17:00",
      rune: "ᛏ",
      title: "El Fuego y la Danza",
      desc: "Apertura de la barra libre, sorpresas y fiesta."
    }
  ],

  // Alojamiento / Descanso
  stay: {
    title: "Aposentos & Descanso",
    subtitle: "Hoteles recomendados en Elche",
    description: "Recomendaciones de hoteles cercanos en Elche para descansar tras la celebración. Próximamente indicaremos las tarifas especiales y teléfonos de reserva:",
    hotels: [
      { name: "Hotel Huerto del Cura (Elche)", note: "A 10 min de la finca" },
      { name: "Hotel Jardín Milenio (Elche)", note: "A 10 min de la finca" }
    ]
  },

  // Confirmación (Asistencia antes de que termine 2026)
  rsvp: {
    deadlineText: "Por favor, confirmad vuestra asistencia antes del 31 de Diciembre de 2026",
    buttonText: "Confirmar Asistencia",
    url: "asistencia.html"
  }
};

if (typeof window !== "undefined") {
  window.WEDDING_CONFIG = WEDDING_CONFIG;
}
