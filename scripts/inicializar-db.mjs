// scripts/inicializar-db.mjs
// ============================================================================
// Crea en Firebase (Firestore) las colecciones del modelo del dbdiagram.
//
// Firestore es NoSQL: una coleccion "existe" recien cuando tiene un documento.
// Este script se loguea con tu usuario (las reglas exigen request.auth != null)
// y crea un documento de ejemplo en cada coleccion que este vacia, para que
// veas la estructura completa en Firebase Console.
//
// COMO USARLO (desde la carpeta del proyecto):
//   node scripts/inicializar-db.mjs
// Te pide el email y la contrasena con los que entras a la app.
// ============================================================================

import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const API_KEY = 'AIzaSyBEQh4luB5lAWurMyLyCkL3HZo7Mose4vk'
const PROYECTO = 'gestion-de-sevicios'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROYECTO}/databases/(default)/documents`

// ----------------------------------------------------------------------------
// Colecciones del dbdiagram y un documento de ejemplo para cada una.
// (Las subcolecciones seguimientos/archivos/historial se crean solas dentro
//  de cada reclamo cuando la app guarda el primero.)
// ----------------------------------------------------------------------------
const COLECCIONES = {
  propiedades: {
    direccion: { stringValue: 'Ejemplo - Av. Siempre Viva 742' },
    barrio: { stringValue: 'Centro' },
    piso: { stringValue: '' },
    unidad: { stringValue: '' },
    tipoInmueble: { stringValue: 'Departamento' },
    propietarioNombre: { stringValue: 'Ejemplo - Maria Gonzalez' },
    propietarioTelefono: { stringValue: '351 000 0000' },
    propietarioEmail: { stringValue: 'ejemplo@mail.com' },
    observaciones: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    activa: { booleanValue: true },
    fechaRegistro: { timestampValue: new Date().toISOString() },
  },
  inquilinos: {
    nombre: { stringValue: 'Ejemplo - Juan Perez' },
    telefono: { stringValue: '351 000 0001' },
    email: { stringValue: 'inquilino@mail.com' },
    observaciones: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
  },
  ocupaciones: {
    propiedadId: { stringValue: '(ID de una propiedad)' },
    inquilinoId: { stringValue: '(ID de un inquilino)' },
    fechaInicio: { stringValue: '2026-01-01' },
    fechaFin: { stringValue: '' },
    esEjemplo: { booleanValue: true },
  },
  reclamos: {
    codigo: { stringValue: 'EJEMPLO-000' },
    propiedadId: { stringValue: '(ID de una propiedad)' },
    inquilinoId: { stringValue: '(ID de un inquilino)' },
    categoria: { stringValue: 'Plomeria' },
    descripcion: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    riesgoInmediato: { booleanValue: false },
    prioridad: { stringValue: 'importante' },
    estado: { stringValue: 'recibido' },
    origen: { stringValue: 'MEZI Propiedades' },
    verificado: { booleanValue: false },
    esEjemplo: { booleanValue: true },
  },
  proveedores: {
    nombre: { stringValue: 'Ejemplo - Plomeria Rapidita' },
    especialidad: { stringValue: 'Plomeria' },
    telefono: { stringValue: '351 000 0002' },
    whatsapp: { stringValue: '351 000 0002' },
    email: { stringValue: 'proveedor@mail.com' },
    zonaTrabajo: { stringValue: 'Zona centro' },
    observaciones: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    activo: { booleanValue: true },
  },
  asignaciones_proveedores: {
    reclamoId: { stringValue: '(ID de un reclamo)' },
    proveedorId: { stringValue: '(ID de un proveedor)' },
    estadoTrabajo: { stringValue: 'pendiente' },
    descripcionTrabajo: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    costoTrabajo: { doubleValue: 0 },
    observaciones: { stringValue: '' },
    esEjemplo: { booleanValue: true },
  },
  presupuestos: {
    reclamoId: { stringValue: '(ID de un reclamo)' },
    proveedorId: { stringValue: '(ID de un proveedor)' },
    fechaPresupuesto: { stringValue: '' },
    descripcion: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    importe: { doubleValue: 0 },
    moneda: { stringValue: 'ARS' },
    estado: { stringValue: 'pendiente' },
    observaciones: { stringValue: '' },
    esEjemplo: { booleanValue: true },
  },
  autorizaciones: {
    reclamoId: { stringValue: '(ID de un reclamo)' },
    presupuestoId: { stringValue: '(ID de un presupuesto)' },
    estado: { stringValue: 'pendiente' },
    medioContacto: { stringValue: '' },
    importeAutorizado: { doubleValue: 0 },
    observaciones: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    esEjemplo: { booleanValue: true },
  },
  eventos_calendario: {
    reclamoId: { stringValue: '(ID de un reclamo)' },
    proveedorId: { stringValue: '(ID de un proveedor)' },
    titulo: { stringValue: 'Ejemplo - Visita de plomeria' },
    descripcion: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    tipoEvento: { stringValue: 'Visita' },
    fechaInicio: { stringValue: '2026-01-15' },
    prioridad: { stringValue: 'importante' },
    estado: { stringValue: 'pendiente' },
    responsable: { stringValue: '' },
    recordatorio: { booleanValue: true },
    esEjemplo: { booleanValue: true },
  },
  notas_prioritarias: {
    reclamoId: { stringValue: '(ID de un reclamo)' },
    titulo: { stringValue: 'Ejemplo - Reclamo urgente sin proveedor' },
    contenido: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    prioridad: { stringValue: 'importante' },
    fechaLimite: { stringValue: '' },
    estado: { stringValue: 'pendiente' },
    ordenVisual: { integerValue: 0 },
    esEjemplo: { booleanValue: true },
  },
  notificaciones: {
    reclamoId: { stringValue: '(ID de un reclamo)' },
    tipo: { stringValue: 'resumen' },
    canal: { stringValue: 'email' },
    destinatario: { stringValue: 'ejemplo@mail.com' },
    asunto: { stringValue: 'Ejemplo - Resumen semanal' },
    mensaje: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    estadoEnvio: { stringValue: 'pendiente' },
    referenciaExterna: { stringValue: '' },
    esEjemplo: { booleanValue: true },
  },
  sugerencias_ia: {
    reclamoId: { stringValue: '(ID de un reclamo)' },
    tipoSugerencia: { stringValue: 'proveedor' },
    textoEntrada: { stringValue: 'Documento de ejemplo del modelo dbdiagram' },
    respuestaGenerada: { stringValue: '' },
    estadoRevision: { stringValue: 'pendiente' },
    aprobadoPor: { stringValue: '' },
    esEjemplo: { booleanValue: true },
  },
}

// ----------------------------------------------------------------------------
// 1) Pedir credenciales y loguearse con la API de Firebase Auth
// ----------------------------------------------------------------------------
const rl = readline.createInterface({ input: stdin, output: stdout })
console.log('Inicializar base de datos MEZI Propiedades (modelo dbdiagram)')
console.log('Usa el mismo email y contrasena con los que entras a la app.\n')
const email = await rl.question('Email: ')
const password = await rl.question('Contrasena: ')
rl.close()

let idToken = ''
try {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  const datos = await resp.json()
  if (!resp.ok) {
    console.error('\nNo se pudo iniciar sesion: ' + (datos.error?.message || 'error desconocido'))
    process.exit(1)
  }
  idToken = datos.idToken
  console.log('\nSesion iniciada como ' + email)
} catch (e) {
  console.error('\nError de conexion: ' + e.message)
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer ' + idToken,
}

// ----------------------------------------------------------------------------
// 2) Crear un documento de ejemplo en cada coleccion vacia
// ----------------------------------------------------------------------------
console.log('')
let creadas = 0
let yaExistian = 0

for (const [nombre, campos] of Object.entries(COLECCIONES)) {
  try {
    // Ver si la coleccion ya tiene documentos
    const lista = await fetch(`${BASE}/${nombre}?pageSize=1`, { headers })
    const datosLista = await lista.json()
    const tieneDocs = Array.isArray(datosLista.documents) && datosLista.documents.length > 0

    if (tieneDocs) {
      console.log('  [ya tiene datos] ' + nombre)
      yaExistian++
      continue
    }

    // Crear el documento de ejemplo con ID fijo (POST + documentId)
    const resp = await fetch(`${BASE}/${nombre}?documentId=ejemplo-modelo&key=${API_KEY}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields: campos }),
    })
    if (resp.ok) {
      console.log('  [creada]         ' + nombre)
      creadas++
    } else {
      const err = await resp.json()
      console.log('  [ERROR]          ' + nombre + ' -> ' + (err.error?.message || resp.status))
    }
  } catch (e) {
    console.log('  [ERROR]          ' + nombre + ' -> ' + e.message)
  }
}

console.log('')
console.log('Listo. Colecciones creadas ahora: ' + creadas)
console.log('Colecciones que ya tenian datos: ' + yaExistian)
console.log('')
console.log('Los documentos de ejemplo tienen esEjemplo: true.')
console.log('Podes borrarlos desde Firebase Console cuando quieras:')
console.log('  Firestore Database -> coleccion -> documento ejemplo-modelo -> eliminar.')
