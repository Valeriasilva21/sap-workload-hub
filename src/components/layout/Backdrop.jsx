/**
 * Fondo fijo con formas difuminadas: le da profundidad al cristal de las tarjetas
 * (se nota la transparencia al hacer scroll). Puramente decorativo.
 */
export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:opacity-40">
      <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-300/30 blur-3xl" />
      <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="absolute -bottom-48 left-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-200/35 blur-3xl" />
    </div>
  )
}
