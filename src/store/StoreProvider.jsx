import { useEffect, useMemo, useReducer, useRef } from 'react'
import { StoreContext } from './context'
import { buildSeed, SEED_VERSION } from '../data/mockData'
import { repository } from '../services/repository'
import { todayISO } from '../lib/date'
import { MEMBER_COLOR_KEYS, PROJECT_COLOR_KEYS } from '../lib/constants'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { useRemoteSync } from './useRemoteSync'

const uid = (prefix) =>
  `${prefix}_${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 10)}`
const now = () => new Date().toISOString()

/** Reglas de negocio aplicadas a cada escritura de una integración. */
function normalizeIntegration(i) {
  const progress = Math.max(0, Math.min(100, Math.round(Number(i.progress) || 0)))
  if (!i.blocked) return { ...i, progress, blocked: false, blockReason: '', blockedSince: null }
  return { ...i, progress, blockedSince: i.blockedSince ?? todayISO() }
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return action.state
    case 'LOADED':
      return { ...state, ...action.data, loading: false }
    case 'REMOTE_UPSERT': {
      const list = state[action.key]
      const exists = list.some((x) => x.id === action.item.id)
      return {
        ...state,
        [action.key]: exists ? list.map((x) => (x.id === action.item.id ? action.item : x)) : [...list, action.item],
      }
    }
    case 'REMOTE_DELETE':
      return { ...state, [action.key]: state[action.key].filter((x) => x.id !== action.id) }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.project] }
    case 'ADD_INTEGRATION':
      return { ...state, integrations: [...state.integrations, normalizeIntegration(action.integration)] }
    case 'UPDATE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.map((i) =>
          i.id === action.id ? normalizeIntegration({ ...i, ...action.changes, updatedAt: now() }) : i,
        ),
      }
    case 'DELETE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.filter((i) => i.id !== action.id),
        allocations: state.allocations.filter((a) => a.integrationId !== action.id),
      }
    case 'ADD_ALLOCATIONS':
      return { ...state, allocations: [...state.allocations, ...action.allocations] }
    case 'UPDATE_ALLOCATION':
      return {
        ...state,
        allocations: state.allocations.map((a) => (a.id === action.id ? { ...a, ...action.changes } : a)),
      }
    case 'DELETE_ALLOCATION':
      return { ...state, allocations: state.allocations.filter((a) => a.id !== action.id) }
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.member] }
    case 'UPDATE_MEMBER':
      return { ...state, members: state.members.map((m) => (m.id === action.id ? { ...m, ...action.changes } : m)) }
    case 'DELETE_MEMBER':
      // Se borran sus horas registradas y sus interfaces quedan "Sin asignar"
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.id),
        allocations: state.allocations.filter((a) => a.memberId !== action.id),
        integrations: state.integrations.map((i) => (i.ownerId === action.id ? { ...i, ownerId: '' } : i)),
      }
    case 'CLEAR_WORK':
      // Empezar desde cero: conserva el equipo, borra proyectos, interfaces y horas
      return { ...state, projects: [], integrations: [], allocations: [] }
    default:
      return state
  }
}

const EMPTY_REMOTE_STATE = { version: SEED_VERSION, members: [], projects: [], integrations: [], allocations: [], loading: true }

function init() {
  // Con Supabase configurado, los datos vienen de la base (ver useRemoteSync)
  if (isSupabaseConfigured) return EMPTY_REMOTE_STATE
  const saved = repository.load()
  return saved?.version === SEED_VERSION ? saved : buildSeed()
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const stateRef = useRef(state)
  stateRef.current = state

  // Modo demo: persistencia en este navegador. Modo Supabase: sincronización con la base.
  useEffect(() => {
    if (!isSupabaseConfigured) repository.save(state)
  }, [state])
  const sync = useRemoteSync(state, dispatch)

  const actions = useMemo(
    () => ({
      addProject({ name, code }) {
        const { projects } = stateRef.current
        const project = {
          id: uid('p'),
          name,
          code:
            code ||
            name
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 4)
              .toUpperCase(),
          color: PROJECT_COLOR_KEYS[projects.length % PROJECT_COLOR_KEYS.length],
        }
        dispatch({ type: 'ADD_PROJECT', project })
        return project
      },
      addIntegration(data) {
        const integration = {
          id: uid('i'),
          systems: '',
          progress: 0,
          dueDate: null,
          blocked: false,
          blockReason: '',
          blockedSince: null,
          ...data,
          createdAt: now(),
          updatedAt: now(),
        }
        dispatch({ type: 'ADD_INTEGRATION', integration })
        return integration
      },
      updateIntegration: (id, changes) => dispatch({ type: 'UPDATE_INTEGRATION', id, changes }),
      moveStage: (id, stage) => dispatch({ type: 'UPDATE_INTEGRATION', id, changes: { stage } }),
      deleteIntegration: (id) => dispatch({ type: 'DELETE_INTEGRATION', id }),
      addAllocation(data) {
        const allocation = { id: uid('a'), ...data, hours: Number(data.hours) || 0, createdAt: now() }
        dispatch({ type: 'ADD_ALLOCATIONS', allocations: [allocation] })
        return allocation
      },
      cloneAllocations(list, toWeek) {
        const allocations = list.map((a) => ({
          id: uid('a'),
          memberId: a.memberId,
          integrationId: a.integrationId,
          weekStart: toWeek,
          hours: a.hours,
          createdAt: now(),
        }))
        dispatch({ type: 'ADD_ALLOCATIONS', allocations })
        return allocations.length
      },
      updateAllocation: (id, changes) => dispatch({ type: 'UPDATE_ALLOCATION', id, changes }),
      deleteAllocation: (id) => dispatch({ type: 'DELETE_ALLOCATION', id }),
      addMember(data) {
        const { members } = stateRef.current
        const used = new Set(members.map((m) => m.color))
        const color = data.color || MEMBER_COLOR_KEYS.find((c) => !used.has(c)) || MEMBER_COLOR_KEYS[members.length % MEMBER_COLOR_KEYS.length]
        const member = { id: uid('m'), active: true, capacity: 40, role: '', ...data, color, createdAt: now() }
        dispatch({ type: 'ADD_MEMBER', member })
        return member
      },
      updateMember: (id, changes) => dispatch({ type: 'UPDATE_MEMBER', id, changes }),
      deleteMember: (id) => dispatch({ type: 'DELETE_MEMBER', id }),
      clearWorkData: () => dispatch({ type: 'CLEAR_WORK' }),
      resetDemo() {
        if (!isSupabaseConfigured) repository.clear()
        dispatch({ type: 'RESET', state: buildSeed() })
      },
    }),
    [],
  )

  const value = useMemo(() => ({ state, actions, sync }), [state, actions, sync])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
