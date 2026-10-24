/**
 * @file test.mjs
 * @description Suite completa de pruebas automatizadas: Síncronas y Asíncronas (Backend).
 * Ejecución: `node validator/test.mjs`
 */

import { createValidator } from '../packages/core/core.js'
import {
  required,
  when,
  date,
  afterDate,
  minAge,
  time,
  mobile,
  url,
  alpha,
  minItems,
  oneOf,
  strongPassword,
  sameAs,
  fileMaxSize,
  fileTypes,
  custom,
  dni,
  ruc,
  cci,
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  maxAge,
  betweenAge,
  each,
  // Tipos de datos primitivos (SRP)
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isFile,
  // Transformadores y sanitización
  transform,
  trim,
  toLowerCase,
  toUpperCase,
  toFloat,
  round,
  truncate,
  toInteger,
  digitsOnly,
  toBooleanFlag,
  toDate,
  toDateTime,
  toISOString
} from '../packages/core/rules.js'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

console.log('🧪 Iniciando prueba exhaustiva del Validador Agnóstico (Síncrono y Asíncrono)...\n')

async function ejecutarTests() {
  // ============================================================================
  // 1. PRUEBA DE FECHAS Y HORAS
  // ============================================================================
  console.log('--- 1. Pruebas de Fechas y Horas ---')

  const vFechas = createValidator(
    {
      fechaValida: '2026-10-19',
      fechaFalsa: '2026-02-30',
      fechaInicio: '2026-10-20',
      fechaFin: '2026-10-18',
      hora: '25:70',
      horaNormal: '08:30',
      horaConSegundos: '14:30:45',
      horaSegundosMal: '14:30:60',
      nacimientoMayor: '2000-01-01',
      nacimientoMenor: '2020-01-01'
    },
    {
      fechaValida: [date()],
      fechaFalsa: [date('Fecha inexistente')],
      fechaFin: [afterDate('fechaInicio', 'Fin debe ser posterior a Inicio')],
      hora: [time('Hora inválida')],
      horaNormal: [time()],
      horaConSegundos: [time()],
      horaSegundosMal: [time('Segundos inválidos')],
      nacimientoMayor: [minAge(18, 'Debe ser mayor de edad')],
      nacimientoMenor: [minAge(18, 'Debe ser mayor de edad')]
    }
  )

  await vFechas.validate()
  console.log('  ✅ fechaValida ok?:', !vFechas.hasError('fechaValida'))
  console.log('  ❌ fechaFalsa detectada?:', vFechas.hasError('fechaFalsa'), '->', vFechas.getError('fechaFalsa'))
  console.log('  ❌ fechaFin anterior a fechaInicio?:', vFechas.hasError('fechaFin'), '->', vFechas.getError('fechaFin'))
  console.log('  ❌ hora 25:70 detectada?:', vFechas.hasError('hora'), '->', vFechas.getError('hora'))
  console.log('  ✅ horaNormal 08:30 ok?:', !vFechas.hasError('horaNormal'))
  console.log('  ✅ horaConSegundos 14:30:45 ok?:', !vFechas.hasError('horaConSegundos'))
  console.log('  ❌ horaSegundosMal 14:30:60 detectada?:', vFechas.hasError('horaSegundosMal'), '->', vFechas.getError('horaSegundosMal'))
  console.log('  ✅ nacimientoMayor ok?:', !vFechas.hasError('nacimientoMayor'))
  console.log('  ❌ nacimientoMenor detectado?:', vFechas.hasError('nacimientoMenor'), '->', vFechas.getError('nacimientoMenor'))

  // Probar corrección en vivo de fechaFin
  vFechas.values.fechaFin = '2026-10-25'
  await sleep(10)
  console.log('  ⚡ Tras corregir fechaFin en vivo, ¿error resuelto?:', !vFechas.hasError('fechaFin'))

  // ============================================================================
  // 2. PRUEBA DE REGLA CONDICIONAL PURA (when) - SRP & Clean Code
  // ============================================================================
  console.log('\n--- 2. Pruebas de Regla Condicional (when) ---')

  const vFactura = createValidator(
    {
      tipoComprobante: 'B', // Boleta
      ruc: ''
    },
    {
      tipoComprobante: [required()],
      ruc: [
        when(all => all.tipoComprobante === 'F', [
          required('El RUC es obligatorio para Factura'),
          ruc('El RUC debe tener 11 dígitos')
        ])
      ]
    }
  )

  await vFactura.validate()
  console.log('  ✅ Si es Boleta, ¿RUC tiene error?:', vFactura.hasError('ruc'), '(esperado: false)')

  // Cambiamos a Factura en vivo con campo vacío
  vFactura.values.tipoComprobante = 'F'
  await vFactura.validate()
  console.log('  ❌ Si cambia a Factura, ¿RUC exige valor?:', vFactura.hasError('ruc'), '->', vFactura.getError('ruc'))

  // Ingresamos RUC incompleto
  vFactura.values.ruc = '123'
  await sleep(10)
  console.log('  ❌ Si RUC tiene 3 dígitos, ¿falla formato ruc()?:', vFactura.hasError('ruc'), '->', vFactura.getError('ruc'))

  // Regresamos a Boleta con el RUC incompleto aún escrito (prueba de cortocircuito limpio)
  vFactura.values.tipoComprobante = 'B'
  await sleep(10)
  console.log('  ✅ Si cambia a Boleta, ¿ignora RUC incompleto y queda válido?:', !vFactura.hasError('ruc'), '(esperado: true)')

  // Volvemos a Factura y colocamos RUC válido
  vFactura.values.tipoComprobante = 'F'
  vFactura.values.ruc = '20601234567'
  await sleep(10)
  console.log('  ⚡ Con Factura y RUC de 11 dígitos, ¿válido?:', !vFactura.hasError('ruc'), '(esperado: true)')

  // ============================================================================
  // 3. PRUEBA DE TEXTOS, CONTACTO Y ARRAYS
  // ============================================================================
  console.log('\n--- 3. Pruebas de Textos, Contacto y Arrays ---')

  const vTextos = createValidator(
    {
      celular: '12345',
      web: 'no-es-url',
      nombres: 'Juan Pérez 123',
      cursos: [],
      rol: 'HACKER'
    },
    {
      celular: [mobile()],
      web: [url()],
      nombres: [alpha('Solo letras en nombres')],
      cursos: [minItems(1, 'Seleccione al menos un curso')],
      rol: [oneOf(['ADMIN', 'DOCENTE', 'ALUMNO'], 'Rol desconocido')]
    }
  )

  await vTextos.validate()
  console.log('  ❌ celular inválido detectado?:', vTextos.hasError('celular'))
  console.log('  ❌ url inválida detectada?:', vTextos.hasError('web'))
  console.log('  ❌ nombres con números detectado?:', vTextos.hasError('nombres'))
  console.log('  ❌ array cursos vacío detectado?:', vTextos.hasError('cursos'))
  console.log('  ❌ rol no permitido detectado?:', vTextos.hasError('rol'))

  // ============================================================================
  // 4. PRUEBA DE VALIDACIÓN ASÍNCRONA (CONSULTA A BACKEND / API)
  // ============================================================================
  console.log('\n--- 4. Prueba Asíncrona (Simulando API Backend) ---')

  // Simulador de API backend que tarda 50ms en responder
  const apiCheckDniDuplicado = async (dni) => {
    await sleep(50)
    // Supongamos que el DNI '44556677' ya existe en la base de datos de SieWeb
    return dni === '44556677'
  }

  const vAsync = createValidator(
    {
      dni: '44556677' // DNI duplicado
    },
    {
      dni: [
        required('DNI obligatorio'),
        custom(async (val) => {
          const existe = await apiCheckDniDuplicado(val)
          return !existe || 'El DNI ya pertenece a otro alumno registrado'
        })
      ]
    }
  )

  console.log('  Consultando API con DNI duplicado...')
  const okDniDuplicado = await vAsync.validate()
  console.log('  ❌ DNI duplicado rechazado?:', !okDniDuplicado)
  console.log('  Mensaje devuelto por el backend:', vAsync.getError('dni'))

  // Ahora cambiamos en vivo a un DNI nuevo disponible
  console.log('\n  Escribiendo en vivo DNI nuevo y disponible (esperando API)...')
  vAsync.values.dni = '99887766'
  console.log('  ¿Está validando con el backend? (v.isValidating("dni")):', vAsync.isValidating('dni'), '(esperado: true)')
  
  await sleep(80) // Esperamos a que la API responda
  console.log('  ¿Sigue validando?:', vAsync.isValidating('dni'), '(esperado: false, terminó)')
  // ============================================================================
  // 5. PRUEBA DE TIPOS PRIMITIVOS ATÓMICOS (Clean Code & SRP)
  // ============================================================================
  console.log('\n--- 5. Pruebas de Tipos de Datos Primitivos (SRP) ---')

  const vTipos = createValidator(
    {
      texto: 12345, // Error: debe ser string
      numero: 'no-es-numero', // Error
      booleano: 'true', // Error: string en vez de booleano
      lista: 'no-es-lista', // Error
      objeto: ['no', 'es', 'objeto'], // Error: array en vez de objeto plano
      archivo: { name: 'foto.png', size: 1024 } // Válido file-like
    },
    {
      texto: [isString('Debe ser texto')],
      numero: [isNumber('Debe ser número estricto')],
      booleano: [isBoolean('Debe ser booleano')],
      lista: [isArray('Debe ser array')],
      objeto: [isObject('Debe ser objeto plano')],
      archivo: [isFile('Debe ser archivo')]
    }
  )

  await vTipos.validate()
  console.log('  ❌ texto con número detectado?:', vTipos.hasError('texto'))
  console.log('  ❌ número con string detectado?:', vTipos.hasError('numero'))
  console.log('  ❌ booleano con string detectado?:', vTipos.hasError('booleano'))
  console.log('  ❌ lista con string detectada?:', vTipos.hasError('lista'))
  console.log('  ❌ objeto con array detectado?:', vTipos.hasError('objeto'))
  console.log('  ✅ archivo file-like válido?:', !vTipos.hasError('archivo'))

  // ============================================================================
  // 6. PRUEBA DE TRANSFORMADORES Y SANITIZACIÓN CON TIMEZONE
  // ============================================================================
  console.log('\n--- 6. Pruebas de Transformadores y Sanitización (v.getPayload()) ---')

  const vPayload = createValidator(
    {
      correo: '  PEDRO.PICA@GMAIL.COM  ',
      codigo: '  adm-2026  ',
      monto: ' 249.90 ',
      tasaCambio: '3.7548',
      promedio: '16.789',
      ahorroTruncado: '16.789',
      cuotas: '12 meses',
      esAfectoIgv: true,
      esActivo: '1',
      esInactivo: false,
      fechaNac: '19/10/2026',
      fechaCitaUtc: '2026-10-19T20:30:00.000Z',
      fechaCitaTokyo: '2026-10-19T20:30:00.000Z',
      customSlug: 'Mi Título de Prueba'
    },
    {
      correo: [required(), toLowerCase(), trim()],
      codigo: [required(), toUpperCase(), trim()],
      monto: [required(), toFloat()],
      tasaCambio: [toFloat()],
      promedio: [round(2)],
      ahorroTruncado: [truncate(2)],
      cuotas: [required(), truncate()],
      esAfectoIgv: [toBooleanFlag()],
      esActivo: [toBooleanFlag()],
      esInactivo: [toBooleanFlag()],
      fechaNac: [required(), date(), toDate()], // Timezone default: America/Lima
      fechaCitaUtc: [toDateTime('America/Lima')],  // 20:30 UTC -> 15:30 en Lima (-5h)
      fechaCitaTokyo: [toDateTime('Asia/Tokyo')],  // 20:30 UTC -> 05:30 (+9h) al día siguiente en Tokyo
      customSlug: [transform(val => String(val).toLowerCase().replace(/\s+/g, '-'))]
    }
  )

  const esValido = await vPayload.validate()
  console.log('  ✅ ¿Formulario con transformadores es válido?:', esValido)

  // Comprobar que los valores en pantalla (v.values) NO se alteraron (evita saltos de cursor)
  console.log('  ⚡ v.values.correo (en pantalla intacto):', JSON.stringify(vPayload.values.correo))
  if (vPayload.values.correo !== '  PEDRO.PICA@GMAIL.COM  ') {
    throw new Error('v.values no debe alterarse directamente para no romper la experiencia de usuario (UX)')
  }

  // Comprobar que getPayload() sanitiza y transforma todo según las reglas
  const payload = vPayload.getPayload()
  console.log('\n  📦 Payload sanitizado resultante (listo para axios/fetch):')
  console.log(JSON.stringify(payload, null, 2))

  if (payload.correo !== 'pedro.pica@gmail.com') throw new Error(`correo falló: ${payload.correo}`)
  if (payload.codigo !== 'ADM-2026') throw new Error(`codigo falló: ${payload.codigo}`)
  if (payload.monto !== 249.9) throw new Error(`monto toFloat() falló: ${payload.monto}`)
  if (payload.tasaCambio !== 3.7548) throw new Error(`tasaCambio toFloat() falló: ${payload.tasaCambio}`)
  if (payload.promedio !== 16.79) throw new Error(`promedio round(2) falló: ${payload.promedio}`)
  if (payload.ahorroTruncado !== 16.78) throw new Error(`ahorroTruncado truncate(2) falló: ${payload.ahorroTruncado}`)
  if (payload.cuotas !== 12) throw new Error(`cuotas truncate() falló: ${payload.cuotas}`)
  if (payload.esAfectoIgv !== 1) throw new Error(`esAfectoIgv falló: ${payload.esAfectoIgv}`)
  if (payload.esActivo !== 1) throw new Error(`esActivo falló: ${payload.esActivo}`)
  if (payload.esInactivo !== 0) throw new Error(`esInactivo falló: ${payload.esInactivo}`)
  if (payload.fechaNac !== '2026-10-19') throw new Error(`fechaNac falló: ${payload.fechaNac}`)
  if (payload.fechaCitaUtc !== '2026-10-19 15:30:00') throw new Error(`fechaCitaUtc (America/Lima) falló: ${payload.fechaCitaUtc}`)
  if (payload.fechaCitaTokyo !== '2026-10-20 05:30:00') throw new Error(`fechaCitaTokyo (Asia/Tokyo) falló: ${payload.fechaCitaTokyo}`)
  if (payload.customSlug !== 'mi-título-de-prueba') throw new Error(`customSlug falló: ${payload.customSlug}`)

  console.log('\n  ✅ Todas las aserciones de transformación y zonas horarias pasaron con éxito!')

  // ============================================================================
  // 7. PRUEBA DE OBJETOS ANIDADOS Y NOTACIÓN DE PUNTO (dot.notation)
  // ============================================================================
  console.log('\n--- 7. Pruebas de Objetos Anidados (Dot Notation) ---')

  const vAnidado = createValidator(
    {
      alumno: 'JUAN PÉREZ',
      apoderado: {
        nombres: 'Carlos Vásquez',
        nroDoc: '123' // DNI inválido (3 dígitos)
      }
    },
    {
      alumno: [required()],
      'apoderado.nombres': [required()],
      'apoderado.nroDoc': [required(), dni('DNI debe tener 8 dígitos')]
    }
  )

  await vAnidado.validate()
  console.log('  ❌ Error en apoderado.nroDoc detectado?:', vAnidado.hasError('apoderado.nroDoc'), '->', vAnidado.getError('apoderado.nroDoc'))

  // Escribimos en vivo en el objeto anidado:
  vAnidado.values.apoderado.nroDoc = '44556677'
  await sleep(10)
  console.log('  ⚡ Tras actualizar DNI anidado en vivo, ¿error resuelto?:', !vAnidado.hasError('apoderado.nroDoc'))

  const payloadAnidado = vAnidado.getPayload()
  if (payloadAnidado.apoderado.nroDoc !== '44556677') throw new Error('Payload anidado falló')
  console.log('  ✅ Payload anidado generado correctamente:', payloadAnidado.apoderado)

  // ============================================================================
  // 8. PRUEBAS DE VALIDACIONES CRUZADAS CON DOT NOTATION Y ARCHIVOS
  // ============================================================================
  console.log('\n--- 8. Pruebas de Validaciones Cruzadas Anidadas y Archivos ---')

  const vCruzado = createValidator(
    {
      seguridad: {
        password: 'Password@123',
        confirmar: 'Password@999'
      },
      empresa: {
        esFactura: true,
        rucDoc: '102030'
      },
      archivoPdf: { name: 'comprobante.pdf', size: 1024 * 1024 }, // 1 MB
      archivoPesado: { name: 'video.mp4', size: 10 * 1024 * 1024 } // 10 MB
    },
    {
      'seguridad.password': [required(), strongPassword()],
      'seguridad.confirmar': [required(), sameAs('seguridad.password', 'Las claves no coinciden')],
      'empresa.rucDoc': [when('empresa.esFactura', [ruc('RUC debe tener 11 dígitos')])],
      archivoPdf: [fileTypes(['pdf', 'jpg']), fileMaxSize(2)],
      archivoPesado: [fileMaxSize(5, 'Máximo 5 MB'), fileTypes(['pdf', 'png'], 'Extensión no permitida')]
    }
  )

  await vCruzado.validate()
  console.log('  ❌ sameAs anidado detectó contraseñas distintas?:', vCruzado.hasError('seguridad.confirmar'))
  console.log('  ❌ when anidado exigió RUC para factura?:', vCruzado.hasError('empresa.rucDoc'))
  console.log('  ✅ archivoPdf 1MB válido?:', !vCruzado.hasError('archivoPdf'))
  console.log('  ❌ archivoPesado 10MB detectó exceso de peso?:', vCruzado.hasError('archivoPesado'))

  // Corregir confirmación de clave en vivo
  vCruzado.values.seguridad.confirmar = 'Password@123'
  await sleep(10)
  console.log('  ⚡ Tras igualar clave anidada en vivo, ¿error resuelto?:', !vCruzado.hasError('seguridad.confirmar'))

  // ============================================================================
  // 9. PRUEBAS DE MÉTODOS AVANZADOS (greaterThan, lessThan, maxAge, betweenAge, cci, each, digitsOnly)
  // ============================================================================
  console.log('\n--- 9. Pruebas de Reglas Avanzadas y Arrays de Objetos ---')

  const vAvanzado = createValidator(
    {
      montoMin: 100,
      montoMax: 50, // Inválido: menor que min
      fechaInicial: '2019-05-10', // ~7 años
      fechaSecundaria: '2010-01-01', // ~16 años
      nroCuentaCci: '1234567890123456789', // Inválido: 19 dígitos
      telefonoFormateado: '+51 (01) 987-654-321',
      familiares: [
        { nombres: 'Hermano 1', edad: '15' },
        { nombres: '', edad: '20' } // Inválido: nombres vacío
      ]
    },
    {
      montoMax: [required(), greaterThan('montoMin')],
      fechaInicial: [date(), maxAge(5)], // Inválido: tiene 7 años y el máx es 5
      fechaSecundaria: [date(), betweenAge(12, 17)], // Válido: tiene 16 años
      nroCuentaCci: [required(), cci()],
      telefonoFormateado: [digitsOnly()],
      familiares: [
        each({
          nombres: [required()],
          edad: [truncate()]
        })
      ]
    }
  )

  await vAvanzado.validate()
  console.log('  ❌ greaterThan detectó montoMax <= montoMin?:', vAvanzado.hasError('montoMax'))
  console.log('  ❌ maxAge detectó edad superior a 5 años?:', vAvanzado.hasError('fechaInicial'))
  console.log('  ✅ betweenAge validó edad entre 12 y 17 años?:', !vAvanzado.hasError('fechaSecundaria'))
  console.log('  ❌ cci detectó 19 dígitos (esperaba 20)?:', vAvanzado.hasError('nroCuentaCci'))
  console.log('  ❌ each detectó campo requerido vacío en elemento 2?:', vAvanzado.hasError('familiares'))

  // Corregir datos en vivo
  vAvanzado.values.montoMax = 200
  vAvanzado.values.nroCuentaCci = '12345678901234567890' // 20 dígitos
  vAvanzado.values.familiares[1].nombres = 'Hermano 2'
  await sleep(10)

  console.log('  ⚡ Tras corregir montoMax en vivo, ¿error resuelto?:', !vAvanzado.hasError('montoMax'))
  console.log('  ⚡ Tras corregir CCI en vivo, ¿error resuelto?:', !vAvanzado.hasError('nroCuentaCci'))
  console.log('  ⚡ Tras corregir familiares en vivo, ¿error resuelto?:', !vAvanzado.hasError('familiares'))

  const payloadAvanzado = vAvanzado.getPayload()
  if (payloadAvanzado.telefonoFormateado !== '5101987654321') {
    throw new Error(`digitsOnly falló: ${payloadAvanzado.telefonoFormateado}`)
  }
  console.log('  ✅ digitsOnly sanitizó teléfono a dígitos puros:', payloadAvanzado.telefonoFormateado)

  console.log('\n🎉 ¡100% DE PRUEBAS COMPLETADAS! MOTOR ATÓMICO, COMPONIBLE, SOLID Y DE ALTO RENDIMIENTO OPERATIVO.')
}

ejecutarTests().catch(err => {
  console.error('Error en pruebas:', err)
  process.exit(1)
})
