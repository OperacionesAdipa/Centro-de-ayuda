# Centro de Ayuda ADIPA

Sitio web del centro de ayuda de ADIPA que lee el contenido directamente desde Zendesk y filtra automáticamente por país del visitante.

## Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Zendesk API** como fuente de contenido
- **Vercel** para el despliegue y detección de país por IP

---

## Paso 1 — Obtener el API Token de Zendesk

1. Inicia sesión en `https://adipa.zendesk.com`
2. Ve a **Admin Center → Apps e integraciones → APIs → API de Zendesk**
3. Activa el **acceso a API con token**
4. Haz clic en **Agregar token de API**, ponle un nombre (ej: "Centro de Ayuda Web") y copia el token

---

## Paso 2 — Configurar variables de entorno

Copia el archivo de ejemplo:
```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus datos:
```env
ZENDESK_SUBDOMAIN=adipa
ZENDESK_EMAIL=tu-email@adipa.cl
ZENDESK_API_TOKEN=el-token-que-copiaste
ZENDESK_LOCALE=es-419
```

---

## Paso 3 — Etiquetar artículos por país en Zendesk

Para que el filtrado por país funcione, los artículos deben tener etiquetas en Zendesk:

| Etiqueta | Significa |
|---|---|
| `pais_chile` | Solo visible para Chile |
| `pais_mexico` | Solo visible para México |
| `pais_colombia` | Solo visible para Colombia |
| `pais_argentina` | Solo visible para Argentina |
| `pais_todos` | Visible para todos |
| *(sin etiqueta)* | Visible para todos (por defecto) |

Para agregar etiquetas: edita el artículo en Zendesk → campo "Etiquetas" → escribe la etiqueta y guarda.

También puedes etiquetar artículos como `faq` para que aparezcan en la sección de Preguntas Frecuentes.

---

## Paso 4 — Probar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`

---

## Paso 5 — Desplegar en Vercel

1. Sube el proyecto a un repositorio en GitHub
2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa el repositorio
3. En **Environment Variables** agrega las 4 variables del paso 2
4. Haz clic en **Deploy**

La detección de país funciona automáticamente en Vercel mediante el header `x-vercel-ip-country`.

---

## Estructura de URLs

```
/                                    → Home
/categoria/[id]-[slug]               → Página de categoría
/articulo/[id]-[slug]                → Artículo individual
/api/search?q=...                    → Búsqueda
/api/geo                             → Detección de país
```

---

## Cómo funciona el filtrado por país

1. El visitante entra al sitio
2. Vercel detecta su país por IP y lo envía en el header `x-vercel-ip-country`
3. El sitio consulta `/api/geo` y guarda el país en `localStorage`
4. Los artículos se filtran según las etiquetas de país
5. El usuario puede cambiar manualmente el país desde el selector en el navbar
6. La selección manual queda guardada en `localStorage` para futuras visitas

---

## Actualización de contenido

El sitio usa **revalidación automática cada 5 minutos** (`revalidate = 300`). Cuando publiques o edites un artículo en Zendesk, en máximo 5 minutos se verá reflejado en el sitio sin necesidad de redesplegar.
