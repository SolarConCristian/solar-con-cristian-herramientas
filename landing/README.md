# Solar con Cristian · Landing

Landing page de **Solar con Cristian** (energía solar en Puerto Rico: medición neta, autoconsumo y off-grid).
Sitio estático: HTML + CSS + JavaScript, sin proceso de compilación.

## Qué incluye
- Contacto primero: WhatsApp y formulario en el inicio, el menú, una barra fija y bloques repetidos.
- Simulador: se sube la factura de LUMA (PDF o foto; se lee en el navegador, no se envía a ningún servidor), se calcula con el historial de 12 meses y se recomienda el sistema por marca (Tesla, Enphase, EG4) con una simulación de un día.
- Secciones animadas con scroll (tablet 3D, "un día con tu sistema", placa solar por dentro).

## Publicar (GitHub Pages)
1. Sube esta carpeta a un repositorio.
2. En **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`.
3. Cuando tengas la dirección final, edita en `index.html` las líneas `og:image` / `twitter:image` para usar la URL completa (por ejemplo `https://tu-dominio.com/assets/og.jpg`) y agrega `<link rel="canonical" href="https://tu-dominio.com/">`.

## Medir anuncios
- Pega el código de tu Meta Pixel / Google tag / TikTok pixel en el `<head>` de `index.html` (hay un comentario marcando el sitio). Cada clic de WhatsApp o del formulario envía un evento (`assets/cta.js`).
- Enlaza los anuncios con `?utm_campaign=nombre-del-anuncio`: el mensaje de WhatsApp termina con "(Anuncio: nombre-del-anuncio)".

## Datos que se editan
- WhatsApp: `17873901302` (en `index.html`, `assets/sim.js` y `assets/cta.js`).
- Formulario: `https://forms.gle/PQHGJS21RnGeX22AA`.
- Supuestos del cálculo: `assets/sim.js` (kWh por kWp al mes, vatios de los paneles, tarifa estimada).

## Créditos y avisos
- Fotos de fondo: Unsplash (licencia Unsplash).
- Tipografías Geist y Geist Mono (Google Fonts, SIL OFL); logo en Michroma (SIL OFL, `assets/fonts/Michroma.OFL.txt`).
- Fotos de producto y marcas Tesla, Enphase y EG4: © de sus fabricantes, usadas para identificar los equipos que se instalan.
- Los cálculos del simulador son estimados preliminares; cada propuesta se diseña de forma individual.
