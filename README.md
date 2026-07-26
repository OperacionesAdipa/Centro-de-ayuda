# Centro de Ayuda ADIPA
 
Centro de ayuda para estudiantes de ADIPA, plataforma de educación online en Latinoamérica. Permite a los estudiantes encontrar respuestas a sus preguntas y a los agentes gestionar el contenido con asistencia de IA.
 
**URL de producción:** https://centro-de-ayuda-eta.vercel.app  
**Repositorio:** OperacionesAdipa/Centro-de-ayuda
 
---
 
## Stack tecnológico
 
| Tecnología | Uso |
|---|---|
| Next.js 14.2.5 (App Router) | Frontend y API routes |
| TypeScript | Lenguaje principal |
| Supabase (PostgreSQL) | Base de datos y almacenamiento de imágenes |
| Anthropic Claude API (claude-sonnet-4-6) | Generación y actualización de artículos con IA |
| Vimeo API | Obtención de transcripciones y capturas de pantalla |
| Browserless | Screenshots de páginas web |
| Sharp | Procesamiento de imágenes |
| TipTap | Editor de texto enriquecido |
| Vercel | Despliegue |
 
---
 
## Variables de entorno
 
Configurar en Vercel → Settings → Environment Variables:
 
```env
NEXT_PUBLIC_SUPABASE_URL=https://ckfhugtrgfvipkcpmwbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__XMG0uxPTJU2yjOtqsMqdg_7ROOILuY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...
VIMEO_TOKEN=...  (requiere permisos: Public, Private, Video Files, Edit, Upload)
BROWSERLESS_API_KEY=...
```
 
> **Nota:** La `ANTHROPIC_API_KEY` actual es de cuenta personal. Cambiar a cuenta empresa antes del lanzamiento oficial.
 
---
 
## Estructura del proyecto
 
```
src/
  app/
    acceso/page.tsx              ← Login portal agentes
    agentes/
      page.tsx                   ← Dashboard con filtros y acciones masivas
      nuevo/page.tsx             ← Crear artículo
      editar/[id]/page.tsx       ← Editor con TipTap, versiones, anotador de imágenes
      ia/page.tsx                ← Centro IA (4 modos)
    articulo/[slug]/page.tsx     ← Vista pública de artículo
    categoria/[slug]/page.tsx    ← Vista de categoría
    videotutoriales/page.tsx     ← Página de videotutoriales
    api/
      agent/                     ← API del portal de agentes
        login/route.ts
        verify/route.ts
        articles/route.ts
        articles/[id]/route.ts
        articles/[id]/versions/route.ts
        categories/route.ts
        sections/route.ts
        urls/route.ts
        urls/[id]/articles/route.ts
        vimeo/route.ts
        vimeo/[id]/articles/route.ts
        regenerate/route.ts       ← Actualiza artículos desde URL con IA
        regenerate-vimeo/route.ts ← Actualiza artículos desde video
        generate/route.ts         ← Genera artículos nuevos desde URL
        generate-from-video/route.ts ← Genera artículos con capturas de Vimeo
        suggest-questions/route.ts
        suggest-from-video/route.ts
        upload-image/route.ts     ← Sube imágenes anotadas
      geo/route.ts               ← Detecta país por IP
      search/route.ts            ← Buscador público
      tutorial-request/route.ts  ← Solicitudes de tutorial
  components/
    AgentNav.tsx                 ← Navegación del portal de agentes
    ArticleAnnotator.tsx         ← Anotador de imágenes con canvas
    ArticleClient.tsx            ← Vista pública de artículo (cliente)
    ArticlePreviewPanel.tsx      ← Panel de vista previa al vincular artículos
    ArticleSidebar.tsx           ← Barra lateral con categorías y buscador
    CategorySectionSelector.tsx  ← Selector con opción crear nueva categoría/sección
    ConditionalFooter.tsx        ← Footer oculto en rutas /agentes y /acceso
    ConditionalNav.tsx           ← Navbar oculto en rutas /agentes y /acceso
    FaqSection.tsx               ← Sección FAQ con acordeón
    Footer.tsx                   ← Footer público
    HelpSection.tsx              ← Sección "¿Necesitas un tutorial?"
    ImageAnnotator.tsx           ← Herramienta de anotación de imágenes
    Navbar.tsx                   ← Navegación pública
    RecentlyViewed.tsx           ← Artículos vistos recientemente
    RichEditor.tsx               ← Editor TipTap con anotación de imágenes
    SearchBar.tsx                ← Buscador con filtros
    VideoTutorials.tsx           ← Carrusel de videotutoriales
    ia/
      ActualizarArticulos.tsx    ← Actualizar artículos desde URL
      ActualizarVideos.tsx       ← Actualizar artículos desde video Vimeo
      GenerarArticulos.tsx       ← Generar artículos nuevos desde URL
      GenerarDesdeVideo.tsx      ← Generar artículos con capturas de Vimeo
  lib/
    supabase.ts                  ← Clientes Supabase (público y admin)
    supabaseQueries.ts           ← Queries reutilizables
    countryUtils.ts              ← Utilidades de país (email, WhatsApp, etc.)
    useCountry.ts                ← Hook de detección de país
```
 
---
 
## Base de datos (Supabase)
 
### Tablas principales
 
| Tabla | Descripción |
|---|---|
| `articles` | Artículos del centro de ayuda |
| `categories` | Categorías de artículos |
| `sections` | Secciones dentro de categorías |
| `article_versions` | Historial de versiones de artículos |
| `source_urls` | URLs de referencia para artículos |
| `article_source_urls` | Relación artículo ↔ URL |
| `vimeo_videos` | Videos de Vimeo con transcripciones |
| `article_vimeo_videos` | Relación artículo ↔ video |
| `agent_sessions` | Sesiones del portal de agentes |
 
### Storage
 
- **Bucket `article-images`** — imágenes de artículos y capturas de pantalla de videos (público)
### Columnas importantes en `articles`
 
| Columna | Descripción |
|---|---|
| `status` | `published`, `draft`, `pending_review` |
| `label_names` | Array con etiquetas: `pais_chile`, `pais_mexico`, `pais_colombia`, `pais_todos`, `faq` |
| `needs_images` | `true` si el artículo necesita imágenes (solo artículos desde URL) |
| `source_urls` | Array de URLs de referencia |
| `promoted` | `true` si es artículo destacado |
 
---
 
## Portal de agentes
 
**URL:** `/acceso`  
**Credenciales:** operaciones@adipa.cl / Adipa123
 
### Funcionalidades
 
- **Dashboard** — listado de artículos con filtros por estado, categoría y búsqueda. Acciones masivas: eliminar, cambiar estado, mover categoría.
- **Editor** — TipTap con historial de versiones, vista previa estudiante, anotador de imágenes (clic en imagen → dibujar recuadro de resaltado).
- **Centro IA** — 4 modos de generación:
  1. Actualizar artículos desde URL
  2. Generar artículos nuevos desde URL
  3. Actualizar artículos desde video Vimeo
  4. Generar artículos nuevos desde video Vimeo (con capturas automáticas)
---
 
## Sistema de capturas de video
 
1. Se obtiene la transcripción VTT del video desde Vimeo API
2. Claude identifica los timestamps donde ocurre algo visual importante
3. Vimeo API `/videos/{id}/pictures` genera un thumbnail en ese frame exacto
4. La imagen se recorta (13% superior) con Sharp para eliminar la barra del navegador
5. Se sube a Supabase Storage
6. Se inserta en el artículo correspondiente
---
 
## Filtrado por país
 
Los artículos se filtran automáticamente según el país del estudiante:
- Detección automática por IP via `/api/geo`
- Selector manual en la navbar
- Etiquetas: `pais_chile`, `pais_mexico`, `pais_colombia`, `pais_todos`
### Datos de contacto por país
 
| País | Email | WhatsApp |
|---|---|---|
| Chile | sac@adipa.cl | +56957253424 |
| México | sac@adipa.mx | +5216221458968 |
| Colombia | sac@adipa.co | +573144718655 |
 
---
 
## Despliegue
 
El proyecto se despliega automáticamente en Vercel al hacer push a la rama `main`.
 
### Pendientes antes del lanzamiento oficial
 
- [ ] Migración a cuenta empresa Vercel + dominio `ayuda.adipa.cl`
- [ ] Actualizar `baseUrl` en `src/app/sitemap.ts`
- [ ] Agregar URL canónica en meta tags de artículos
- [ ] Cambiar `ANTHROPIC_API_KEY` a cuenta empresa
- [ ] Implementar multilenguaje con DeepL
---
 
## Migración desde Zendesk
 
El proyecto migró completamente desde Zendesk a Supabase:
- 129 artículos migrados
- 260 imágenes migradas a Supabase Storage
- 129 versiones originales guardadas en `article_versions`
- Zendesk eliminado completamente del proyecto
 
