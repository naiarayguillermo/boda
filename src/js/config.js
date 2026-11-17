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
  placeGeneral: "El Roal de los Bolos",
  epicTagline: "Destinados por las Nornas, unidos bajo el firmamento de los Dioses",
  epicSubtitle: "La saga de dos clanes que se funden en un solo destino",

  // Ubicación Principal
  venue: {
    name: "El Roal de los Bolos",
    subtitle: "El Roal de los Bolos",
    address: "El Roal de los Bolos",
    coordinates: "38°13'10.9\"N 0°37'47.6\"W",
    lat: 38.2196953,
    lng: -0.6298823,
    mapsShortUrl: "https://maps.app.goo.gl/hiYfxqboXUqrsnhM8",
    appleMapsUrl: "https://maps.apple.com/?q=38.2196953,-0.6298823",
    embedMapUrl: "https://maps.google.com/maps?q=38.2196953,-0.6298823&hl=es&z=15&output=embed",
    description: "Un enclave natural rodeado de palmeras, vegetación mediterránea y espacios al aire libre donde celebraremos tanto la ceremonia como el gran banquete."
  },

  // 1. Ceremonia (12:00h)
  ceremony: {
    title: "El Juramento de Amor",
    subtitle: "Ceremonia Civil & Bendición de los Clanes",
    time: "12:00 Horas",
    placeName: "El Roal de los Bolos",
    address: "El Roal de los Bolos",
    mapsUrl: "https://maps.app.goo.gl/hiYfxqboXUqrsnhM8",
    description: "Bajo los cielos de Elche y rodeados de nuestro clan, intercambiaremos los anillos de juramento y sellaremos nuestra alianza eterna."
  },

  // 2. Banquete y Fiesta (14:00h)
  banquet: {
    title: "El Gran Festín en el Valhalla",
    subtitle: "Banquete & Fiesta de Celebración",
    time: "14:00 Horas",
    placeName: "El Roal de los Bolos",
    address: "El Roal de los Bolos",
    mapsUrl: "https://maps.app.goo.gl/hiYfxqboXUqrsnhM8",
    description: "Alzad vuestro elixir con hidromiel y buen vino. Viandas selectas, música y fiesta para celebrar el inicio de nuestra saga."
  },

  // Cronograma / Timeline
  timeline: [
    {
      time: "12:00h",
      rune: "ᛉ",
      title: "La ceremonia",
      desc: "El momento en que sellaremos nuestra unión rodeados de nuestros clanes."
    },
    {
      time: "14:30h",
      rune: "ᚷ",
      title: "Gran festín por nuestra unión",
      desc: "Compartiremos mesa, brindis y un gran banquete para celebrar nuestro destino."
    },
    {
      time: "16:30h",
      rune: "ᛋ",
      title: "Celebración y más sorpresas",
      desc: "La fiesta continuará con música, alegría y algunas sorpresas para todos."
    },
    {
      time: "01:00h",
      rune: "ᛟ",
      title: "Reservado en el centro de Elche",
      desc: "Cerraremos la noche con quienes hayan confirmado su asistencia al reservado."
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

  // Confirmación (Asistencia antes de que termine enero de 2027)
  rsvp: {
    deadlineText: "Por favor, confirmad vuestra asistencia antes del 31 de Enero de 2027",
    buttonText: "Confirmar Asistencia",
    url: "asistencia/"
  }
};

if (typeof window !== "undefined") {
  window.WEDDING_CONFIG = WEDDING_CONFIG;
}
