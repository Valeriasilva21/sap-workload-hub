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

## Migrar a Supabase / PostgreSQL

1. Ejecuta `supabase/schema.sql` (tablas, vista `member_week_load`, trigger de bloqueo, RLS).
2. `npm i @supabase/supabase-js` y define `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Carga el estado inicial con `loadAll(client)` de `services/supabaseRepository.js` en `StoreProvider` y, en cada acción, llama al writer correspondiente (`upsertIntegration`, `upsertAllocations`, …). Los selectores y componentes no cambian.
4. Opcional: suscripción Realtime a `integrations` y `allocations` para que el dashboard del líder se actualice sin recargar.
