# SAP Workload & Integration Hub

Aplicación web para que el área de **Integraciones SAP** registre su carga semanal y el estado de sus interfaces, y para que el Líder Técnico vea en tiempo real capacidad, avance por etapa y bloqueos.

## Ejecutar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producción en dist/
```

La app arranca con datos demo (5 consultores, 6 proyectos, 17 interfaces, 4 semanas de historial). Todo cambio se guarda en `localStorage`. Para volver a los datos iniciales: **Restaurar datos demo** en la barra lateral.

## Vistas

| Vista | Para quién | Qué hace |
|---|---|---|
| **Dashboard** | Líder | KPIs (capacidad %, integraciones activas, en riesgo/bloqueadas, ocupación promedio 4 semanas), matriz de cargabilidad con semáforo (verde < 85 %, amarillo 85–100 %, rojo > 100 %) y desglose por proyecto, panel de bloqueos con días detenido, interfaces en riesgo por fecha y avance por etapa. |
| **Tablero** | Equipo + líder | Kanban de 5 etapas SAP con drag & drop (o flechas en la tarjeta, útil en móvil), filtros por proyecto / integrante / tecnología / solo bloqueadas, CRUD completo en modal. |
| **Mi Semana** | Consultor | Elegir nombre → añadir asignación (horas o % de capacidad), cambiar etapa con un clic, avance con slider, switch “¿Tienes algún bloqueo?”, **Clonar semana pasada**. |

El selector de semana (arriba a la derecha) aplica a todas las vistas.

## Arquitectura

```
src/
├── data/mockData.js            # Seed realista (fechas relativas a hoy)
├── lib/
│   ├── constants.js            # Etapas, tecnologías, reglas del semáforo
│   ├── date.js                 # Semanas ISO (lunes), rangos, días
│   ├── selectors.js            # Métricas derivadas (carga, KPIs, bloqueos, riesgo)
│   └── usePersistentState.js   # Preferencias de UI
├── services/
│   ├── repository.js           # Persistencia activa (LocalStorage)
│   └── supabaseRepository.js   # Adaptador de referencia para Supabase
├── store/                      # useReducer + Context; acciones CRUD
└── components/
    ├── layout/                 # Sidebar, Topbar, WeekPicker
    ├── ui/                     # Badges, Avatar, barras, Modal, Toggle, ProjectSelect
    ├── dashboard/              # KPIs, matriz, bloqueos, riesgo, pipeline
    ├── kanban/                 # Tablero, filtros, tarjeta, modal de integración
    └── myweek/                 # Vista del consultor
```

### Modelo de datos

- **members** — integrante, rol, capacidad semanal (h).
- **projects** — proyecto/cliente.
- **integrations** — interfaz: proyecto, tecnología (CPI, PI/PO, API, IDoc, ABAP/RFC), etapa, responsable, % avance, fecha comprometida, bloqueo (motivo + fecha desde).
- **allocations** — horas de un integrante en una interfaz para una semana (`weekStart` = lunes). Separar la asignación de la interfaz permite que varias personas colaboren en una misma interfaz y que exista historial semana a semana.

### Reglas de negocio

- Semáforo: `< 85 %` Disponible · `85–100 %` Óptimo · `> 100 %` Sobrecargado (`lib/constants.js → LOAD_THRESHOLDS`).
- En riesgo: fecha comprometida vencida, o vence en ≤ 14 días con avance < 60 %.
- Al activar un bloqueo se registra `blockedSince` = hoy; al desactivarlo se limpia.
- Clonar semana pasada copia las asignaciones de la semana anterior que no estén ya en la semana actual y cuya interfaz no esté completada.

## Tema claro / oscuro

Botón Sol / Luna arriba a la derecha. Por defecto la app abre en **Light Glass**; la preferencia se guarda en el navegador (`hub:theme`). Los colores son variables CSS (`src/index.css`): `white` es el color del cristal (blanco en claro, pizarra profunda en oscuro), `edge` el borde del cristal y `snow` el blanco real para texto sobre botones de color.

## Adjuntos PDF

En el tablero, al editar una integración se pueden adjuntar PDFs (arrastrar y soltar o elegir), verlos en un visor integrado, descargarlos y eliminarlos. Las tarjetas muestran un contador 📎.

- Se guardan en **Base64 en LocalStorage**: solo en el navegador de quien los adjunta. El resto del equipo **no** los ve.
- Máximo 2 MB por archivo y ~5 MB en total por navegador (límite del navegador).
- Si una interfaz se elimina, sus PDFs locales se borran.
- Para compartirlos con todo el equipo, el siguiente paso es Supabase Storage.

## Datos compartidos con Supabase

Sin configuración, la app funciona en **modo demo** (datos en el navegador). Con Supabase, todo el equipo ve y edita los mismos datos, y los cambios aparecen **en vivo** en todas las pantallas.

### Configurar

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. **SQL Editor** → pega [`supabase/schema.sql`](supabase/schema.sql) → **Run**. Crea las tablas, los permisos y el tiempo real. Se puede volver a ejecutar.
3. **Project Settings → API Keys**: copia la *Project URL* y la *publishable key* (`sb_publishable_…`). Nunca uses la *secret key* en la app.
4. **Desarrollo local:** copia `.env.example` como `.env.local`, completa los dos valores y reinicia `npm run dev`.
5. **Sitio publicado:** en GitHub → *Settings → Secrets and variables → Actions → Variables*, crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` y vuelve a ejecutar el workflow *Deploy to GitHub Pages*.

La primera vez la base está vacía: agrega al equipo en **Equipo**, o usa **Restaurar demo** para cargar los datos de ejemplo.

### Cómo funciona

- `src/services/supabaseSync.js` traduce el estado de la app a filas de la base y calcula las diferencias.
- `src/store/useRemoteSync.js` carga los datos al iniciar, guarda los cambios en segundo plano (agrupados cada 400 ms, con reintento automático) y aplica en vivo los cambios de otras personas. Una edición local pendiente nunca es pisada por un cambio remoto de la misma fila.
- Las acciones del store no cambiaron: la sincronización es transparente para los componentes.
- El indicador de la barra lateral muestra *En vivo*, *Guardando…* o *Sin guardar* (con el error y botón para reintentar).

### Seguridad: acceso abierto

Se eligió **acceso sin login**: cualquiera con el link puede ver y modificar los datos, porque la clave publicable va dentro de la página. Las políticas `open_*` de `schema.sql` lo hacen explícito. Para cerrarlo: activar Supabase Auth (por ejemplo login por email), deshabilitar el registro público e invitar al equipo, y reemplazar las políticas `open_*` por políticas `to authenticated`.
