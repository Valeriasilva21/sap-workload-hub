// Datos de prueba realistas del ecosistema SAP. Las fechas se calculan
// relativas a "hoy" para que la demo siempre se vea viva al abrirla.

import { addDays, addWeeks, currentWeekISO, todayISO } from '../lib/date'

export const SEED_VERSION = 1

export function buildSeed() {
  const today = todayISO()
  const week = currentWeekISO()
  const ago = (n) => addDays(today, -n)
  const inDays = (n) => addDays(today, n)
  const now = new Date().toISOString()

  const members = [
    { id: 'm1', name: 'Valentina Rojas', role: 'Arquitecta de Integración', level: 'architect', capacity: 40, color: 'indigo' },
    { id: 'm2', name: 'Matías Fuentes', role: 'Senior CPI Developer', level: 'senior', capacity: 40, color: 'sky' },
    { id: 'm3', name: 'Camila Herrera', role: 'Desarrolladora PI/PO & ABAP', level: 'semisenior', capacity: 40, color: 'violet' },
    { id: 'm4', name: 'Diego Muñoz', role: 'Consultor CPI / API Management', level: 'senior', capacity: 40, color: 'emerald' },
    { id: 'm5', name: 'Javiera Soto', role: 'Desarrolladora ABAP / IDoc', level: 'junior', capacity: 30, color: 'orange' },
  ]

  const projects = [
    { id: 'p1', code: 'MIG-CPI', name: 'Migración PI/PO → Integration Suite', color: 'blue' },
    { id: 'p2', code: 'FIN-BNK', name: 'Tesorería S/4HANA – Bancos', color: 'teal' },
    { id: 'p3', code: 'O2C-SFDC', name: 'Salesforce ↔ S/4HANA Order-to-Cash', color: 'violet' },
    { id: 'p4', code: 'HCM-SF', name: 'SuccessFactors → Payroll', color: 'amber' },
    { id: 'p5', code: 'P2P-ARB', name: 'SAP Ariba Procurement', color: 'rose' },
    { id: 'p6', code: 'LOG-EDI', name: 'EDI Logística', color: 'cyan' },
  ]

  const I = (id, projectId, name, technology, systems, stage, ownerId, progress, dueIn, block) => ({
    id,
    projectId,
    name,
    technology,
    systems,
    stage,
    ownerId,
    progress,
    dueDate: inDays(dueIn),
    blocked: Boolean(block),
    blockReason: block?.[0] ?? '',
    blockedSince: block ? ago(block[1]) : null,
    createdAt: now,
    updatedAt: now,
  })

  const integrations = [
    I('i1', 'p1', 'MATMAS05 Maestro de Materiales → WMS', 'CPI', 'S/4HANA → Manhattan WMS', 'build', 'm2', 55, 21),
    I('i2', 'p1', 'Migración ICO Facturas Proveedores (INVOIC02)', 'PO', 'PI/PO 7.5 → Integration Suite', 'design', 'm1', 30, 35),
    I('i3', 'p2', 'Pagos H2H Santander (ISO 20022 pain.001)', 'CPI', 'S/4HANA FI → SFTP Banco', 'test', 'm2', 70, 5, [
      'Falta conectividad VPN con proveedor bancario',
      6,
    ]),
    I('i4', 'p2', 'Extractos MT940 → FEBAN (conciliación)', 'CPI', 'SWIFT → S/4HANA Bank Statement', 'build', 'm2', 40, 18),
    I('i5', 'p3', 'Sync Cuentas Salesforce → Business Partner', 'API', 'Salesforce → API_BUSINESS_PARTNER', 'build', 'm4', 65, 12),
    I('i6', 'p3', 'Pedidos SF → A_SalesOrder (OData V2)', 'API', 'Salesforce → S/4HANA SD', 'design', 'm4', 25, 30),
    I('i7', 'p3', 'Estado de pedido → Salesforce Platform Events', 'API', 'S/4HANA Event Mesh → Salesforce', 'backlog', 'm4', 0, 60),
    I('i8', 'p4', 'Replicación Employee Central → Payroll (PTP)', 'CPI', 'SuccessFactors EC → SAP HCM', 'test', 'm5', 80, 8),
    I('i9', 'p5', 'Pedidos de compra → Ariba cXML OrderRequest', 'CPI', 'S/4HANA MM → Ariba Network', 'deploy', 'm2', 95, 2),
    I('i10', 'p6', 'IDoc ORDERS05 entrante (EDI clientes)', 'IDoc', 'VAN EDIFACT → S/4HANA SD', 'build', 'm3', 45, 10, [
      'Partner profile WE20 y puerto RFC pendientes de BASIS',
      3,
    ]),
    I('i11', 'p6', 'DESADV salida a operador logístico', 'IDoc', 'S/4HANA LE → 3PL (AS2)', 'design', 'm3', 20, 40),
    I('i12', 'p1', 'Proxy ABAP Documentos Tributarios → SII', 'ABAP', 'S/4HANA → PI/PO → SII', 'test', 'm3', 50, 6),
    I('i13', 'p2', 'Conciliación Open Banking (REST)', 'API', 'Fintech API → S/4HANA Cash Mgmt', 'backlog', 'm1', 5, 75),
    I('i14', 'p4', 'Marcaciones reloj control → Time Tracking', 'CPI', 'Reloj biométrico → SuccessFactors', 'deploy', 'm5', 90, 1),
    I('i15', 'p5', 'Facturas Ariba (cXML Invoice) → MIRO', 'CPI', 'Ariba Network → S/4HANA MM', 'test', 'm4', 55, 9, [
      'Certificado SSL vencido en ambiente QAS',
      2,
    ]),
    I('i16', 'p3', 'Condiciones de precio BAPI → Salesforce CPQ', 'ABAP', 'S/4HANA (BAPI_PRICES) → SF CPQ', 'backlog', 'm3', 0, 50),
    I('i17', 'p4', 'Finiquitos → Previred (archivo plano)', 'PO', 'SAP HCM → SFTP Previred', 'deploy', 'm5', 100, -4),
  ]

  // [miembro, integración, horas de la semana actual]
  const base = [
    ['m1', 'i2', 10], ['m1', 'i6', 8], ['m1', 'i11', 6], ['m1', 'i13', 6],
    ['m2', 'i1', 16], ['m2', 'i3', 12], ['m2', 'i4', 10], ['m2', 'i9', 6],
    ['m3', 'i12', 14], ['m3', 'i10', 12], ['m3', 'i2', 6], ['m3', 'i11', 6],
    ['m4', 'i5', 14], ['m4', 'i6', 6], ['m4', 'i15', 8],
    ['m5', 'i8', 12], ['m5', 'i14', 8], ['m5', 'i10', 10],
  ]
  const backlogIds = new Set(integrations.filter((i) => i.stage === 'backlog').map((i) => i.id))

  const allocations = []
  for (let w = 0; w < 4; w++) {
    const weekStart = addWeeks(week, -w)
    base.forEach(([memberId, integrationId, hours], idx) => {
      if (w > 0 && backlogIds.has(integrationId)) return
      // Variación determinista para semanas anteriores (historial realista)
      const delta = w === 0 ? 0 : ((idx * 7 + w * 3) % 5) - 2
      allocations.push({
        id: `a${w}_${idx}`,
        memberId,
        integrationId,
        weekStart,
        hours: Math.max(2, hours + delta * 2),
        createdAt: now,
      })
    })
    if (w > 0) {
      allocations.push({ id: `a${w}_x`, memberId: 'm5', integrationId: 'i17', weekStart, hours: 8, createdAt: now })
    }
  }

  return { version: SEED_VERSION, members, projects, integrations, allocations, comments: [] }
}
