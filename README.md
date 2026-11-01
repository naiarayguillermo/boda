# Boda de Naïara & Guillermo · 22 de Mayo de 2027

Invitación web de boda con estética nórdica/vikinga moderna, elegante y 100% optimizada para dispositivos móviles (Mobile-First) para **Naïara & Guillermo**.

- **Fecha:** Sábado, 22 de Mayo de 2027
- **Horarios:** Ceremonia a las 12:00h · Banquete y fiesta a las 14:00h
- **Lugar:** [Asejar Viveros · La Hoya, Elche (Alicante)](https://maps.app.goo.gl/aNG3K9HyFQzcdcWY9)
- **Confirmación:** Por favor, confirmar antes del 31 de Diciembre de 2026
- **Tecnologías:** HTML5, CSS3 y JavaScript nativo (Vanilla), con un pequeño script Python de construcción para GitHub Pages.

## Estructura del proyecto

El código fuente vive en `src/` y la web publicada se genera en `dist/`:

```text
src/
├── pages/
│   ├── home.html
│   ├── asistencia.html
│   └── dashboard.html
├── css/
├── js/
└── assets/
scripts/
└── build.py
```

El build convierte las páginas en estas URLs:

```text
/                 → dist/index.html
/asistencia/      → dist/asistencia/index.html
/dashboard/       → dist/dashboard/index.html
```

`dist/` está ignorada por Git porque se genera automáticamente durante el despliegue.

---

## Servidor Local

Para previsualizar y probar la invitación en tu navegador antes de subirla o desplegarla:

```bash
python3 scripts/build.py
python3 -m http.server 8080 --directory dist
```

Una vez ejecutado el comando, abre en tu navegador:
**[http://localhost:8080](http://localhost:8080)**

---

## Páginas del Proyecto

1. **`src/pages/home.html` (Invitación Principal)**:
   - Portada con cuenta atrás adaptativa hacia el 22/05/2027.
   - Historia de los clanes.
   - **Ubicación en Asejar Viveros**: mapa embebido, coordenadas GPS (`38°14'35.1"N 0°46'18.8"W`), botones directos con iconos SVG para Google Maps, Apple Maps y botón para copiar la dirección.
   - Cronograma de la jornada.
   - **Atavío de Gala**: Estructura preparada para integrar fotos y sugerencias de vestimenta y peinados (Hombre, Mujer, Niño).
   - **Descanso**: Hoteles recomendados en Elche cercanos a la finca.
   - Botón final hacia `/asistencia/`.

2. **`src/pages/asistencia.html` (Formulario de Confirmación)**:
   - **Nombre y apellidos**.
   - **¿Podrás asistir?** (Sí / No).
   - **Doble confirmación con resumen**: Para los que marcan que SÍ van, antes de enviar se abre una ventana modal con el desglose exacto (titular, acompañantes y alergias) para verificar que todo esté bien antes de confirmar definitivamente.
   - **Dedicatoria para los que no asisten**: Si marcan que NO pueden asistir, se abre un espacio para dejar un mensaje con sus mejores deseos para los novios.
   - **Acompañantes**: Selector segmentado moderno para indicar si es *Pareja / Adulto* o *Niño / Niña*.
   - **Alergias o intolerancias**: Checkbox que despliega campo de especificación.

3. **`src/pages/dashboard.html` (Panel de Control & Edición en Vivo)**:
   - **Edición completa de registros**: Botón **Editar** en cada fila que permite modificar nombre, asistencia, añadir/quitar/cambiar acompañantes y alergias. Los cambios se sincronizan en tiempo real con Firebase Firestore.
   - **Descarga en PDF**: Botón para exportar el listado completo y resumido en un archivo **PDF** maquetado y listo para imprimir o enviar al catering/finca.
   - Resumen en tiempo real: Total confirmaciones, total personas que asisten, desglose de adultos, niños, no asistentes y personas con alergias.
   - Filtros rápidos (*Todos*, *Asisten*, *No Asisten*, *Con Alergias*) y barra de búsqueda en vivo.

---

## Conexión con Firebase

Tanto `src/pages/asistencia.html` como `src/pages/dashboard.html` están preparados para conectarse directamente a **Cloud Firestore**:

1. Abre **[`src/js/firebase-config.js`](src/js/firebase-config.js)**.
2. Añade tus credenciales de Firebase:
   ```javascript
   const FIREBASE_CONFIG = {
     apiKey: "TU_API_KEY",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };

   const ENABLE_FIREBASE = true; // Activa Firebase
   const REQUIRE_AUTH = true;    // Activa la pantalla de login para el dashboard
   ```

   El panel muestra un campo de **usuario** (`naiarayguillermo`) y contraseña. Firebase Auth
   sigue resolviendo internamente ese usuario contra `naiarayguillermo@boda.es`; el acceso se
   limita además al UID configurado. La contraseña se crea y gestiona en Firebase Console:
   nunca debe guardarse en el repositorio. Un `.env` tampoco protege secretos en GitHub Pages,
   porque cualquier variable enviada al navegador queda expuesta.
3. Reglas de Firestore recomendadas:
   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /confirmaciones_boda/{document=**} {
         allow create: if true;
         allow read: if true; // O restringido a tu usuario autenticado
         allow update, delete: if false;
       }
     }
   }
   ```
*(Mientras `ENABLE_FIREBASE = false`, las confirmaciones se guardan localmente en tu navegador para que puedas probar el formulario y el dashboard al instante).*

---

## Despliegue en GitHub Pages

1. Sube los cambios al repositorio:
   ```bash
   git add .
   git commit -m "Web de boda Naïara & Guillermo: Asistencia simplificada y Dashboard"
   git push -u origin main
   ```
2. En GitHub:
   - Ve a **Settings** > **Pages**.
   - En **Source**, selecciona **GitHub Actions**.
   - El workflow `.github/workflows/deploy-pages.yml` construirá `dist/` y publicará la web.
3. Tu web estará disponible en:
   - Web principal: `https://naiarayguillermo.github.io/boda/`
   - Formulario: `https://naiarayguillermo.github.io/boda/asistencia/`
   - Dashboard: `https://naiarayguillermo.github.io/boda/dashboard/`
