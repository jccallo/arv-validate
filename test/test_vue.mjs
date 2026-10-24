/**
 * @file test_vue.mjs
 * @description Suite exhaustiva de pruebas para arv-validate-vue.
 * Valida la integración reactiva con Vue 3, ciclo de vida, SSR,
 * helpers de UI, validaciones async y prevención de fugas de memoria.
 */

import { reactive, watchEffect, watch, nextTick, createApp, createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import {
  useValidator,
  required,
  email,
  minLength,
  when,
  custom,
  trim,
  toLowerCase,
  toFloat,
  sameAs,
  greaterThan
} from '../packages/vue/index.js'

let passed = 0
let failed = 0
let total = 0

function assert(label, condition) {
  total++
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`    ❌ FALLO: ${label}`)
  }
}

function section(name) {
  console.log(`\n--- ${name} ---`)
}

console.log('🧪 SUITE EXHAUSTIVA DE TESTS — arv-validate-vue (Vue 3)\n')

// ============================================================================
// 1. RE-EXPORTS: Verificación de exports del core
// ============================================================================
section('1. Re-exports del Core')
{
  assert('useValidator es función', typeof useValidator === 'function')
  assert('required re-exportado', typeof required === 'function')
  assert('email re-exportado', typeof email === 'function')
  assert('minLength re-exportado', typeof minLength === 'function')
  assert('when re-exportado', typeof when === 'function')
  assert('custom re-exportado', typeof custom === 'function')
  assert('trim re-exportado', typeof trim === 'function')
  assert('toLowerCase re-exportado', typeof toLowerCase === 'function')
  assert('sameAs re-exportado', typeof sameAs === 'function')
}

// ============================================================================
// 2. REACTIVIDAD DE VALORES (v.values) con Vue watchEffect y watch
// ============================================================================
section('2. Reactividad de v.values')
{
  const v = useValidator(
    { nombre: 'Juan', edad: 25, perfil: { ciudad: 'Lima' }, tags: ['dev'] },
    { nombre: [required()] }
  )

  // A. watchEffect detecta mutación directa
  let trackedNombre = null
  let effectRuns = 0
  const stopEffect = watchEffect(() => {
    effectRuns++
    trackedNombre = v.values.nombre
  })

  assert('watchEffect leyó valor inicial', trackedNombre === 'Juan')
  assert('watchEffect corrió 1 vez inicialmente', effectRuns === 1)

  v.values.nombre = 'Carlos'
  await nextTick()
  assert('watchEffect detectó mutación de v.values.nombre', trackedNombre === 'Carlos')
  assert('watchEffect corrió de nuevo tras mutación', effectRuns === 2)

  // B. watch con getter en objeto anidado
  let watchedCiudad = null
  const stopWatch = watch(
    () => v.values.perfil.ciudad,
    (newVal) => { watchedCiudad = newVal }
  )

  v.values.perfil.ciudad = 'Arequipa'
  await nextTick()
  assert('watch detectó mutación en objeto anidado', watchedCiudad === 'Arequipa')

  // C. Mutación de array
  let watchedTagsCount = 0
  watch(
    () => v.values.tags.length,
    (len) => { watchedTagsCount = len }
  )
  v.values.tags.push('vue')
  await nextTick()
  assert('watch detectó push en array', watchedTagsCount === 2)

  stopEffect()
  stopWatch()
  v.dispose()
}

// ============================================================================
// 3. REACTIVIDAD DE isValid e isDirty (getters booleanos)
// ============================================================================
section('3. isValid e isDirty (booleanos y reactivos)')
{
  const v = useValidator(
    { correo: '' },
    { correo: [required(), email()] }
  )

  assert('isValid es boolean (no objeto)', typeof v.isValid === 'boolean')
  assert('isValid inicial es false', v.isValid === false)
  assert('!v.isValid es true (para :disable en Quasar/Vue)', !v.isValid === true)
  assert('isDirty inicial es false', v.isDirty === false)

  let trackedValid = null
  let trackedDirty = null
  const stop = watchEffect(() => {
    trackedValid = v.isValid
    trackedDirty = v.isDirty
  })

  assert('watchEffect capturó isValid inicial false', trackedValid === false)
  assert('watchEffect capturó isDirty inicial false', trackedDirty === false)

  // Mutación a valor inválido
  v.values.correo = 'invalido'
  await nextTick()
  assert('isDirty pasa a true tras escribir', v.isDirty === true)
  assert('isValid sigue false con email inválido', v.isValid === false)
  assert('watchEffect actualizó isDirty a true', trackedDirty === true)

  // Mutación a valor válido
  v.values.correo = 'usuario@empresa.com'
  await nextTick()
  assert('isValid pasa a true con email válido', v.isValid === true)
  assert('!v.isValid es false cuando es válido', !v.isValid === false)
  assert('watchEffect actualizó isValid a true', trackedValid === true)

  stop()
  v.dispose()
}

// ============================================================================
// 4. HELPERS REACTIVOS DE UI: hasError, getError, touch, untouch
// ============================================================================
section('4. hasError, getError, touch y untouch')
{
  const v = useValidator(
    { password: '' },
    { password: [required('Contraseña obligatoria'), minLength(6, 'Mínimo 6 caracteres')] }
  )

  // Sin tocar: no debe mostrar error en pantalla
  assert('hasError inicial es false (untouched)', v.hasError('password') === false)
  assert('getError inicial es null (untouched)', v.getError('password') === null)

  // Touch (desenfoque / blur)
  v.touch('password')
  await nextTick()
  assert('tras touch, hasError es true', v.hasError('password') === true)
  assert('tras touch, getError retorna mensaje', v.getError('password') === 'Contraseña obligatoria')
  assert('touched.password es true', v.touched.password === true)

  // Escribir 3 caracteres (sigue fallando por minLength)
  v.values.password = '123'
  await nextTick()
  assert('hasError sigue true', v.hasError('password') === true)
  assert('getError muestra minLength', v.getError('password') === 'Mínimo 6 caracteres')

  // Untouch
  v.untouch('password')
  await nextTick()
  assert('tras untouch, hasError es false', v.hasError('password') === false)
  assert('tras untouch, getError es null', v.getError('password') === null)
  assert('touched.password es false', v.touched.password === false)

  // Escribir contraseña válida y volver a tocar
  v.values.password = 'secreto123'
  v.touch('password')
  await nextTick()
  assert('con contraseña válida, hasError es false', v.hasError('password') === false)
  assert('con contraseña válida, getError es null', v.getError('password') === null)

  v.dispose()
}

// ============================================================================
// 5. VALIDACIÓN ASÍNCRONA Y isValidating() (Quasar :loading)
// ============================================================================
section('5. Validación Asíncrona e isValidating')
{
  let resolveCheck = null
  const v = useValidator(
    { usuario: '' },
    {
      usuario: [
        required(),
        custom(() => new Promise((resolve) => {
          resolveCheck = resolve
        }))
      ]
    }
  )

  assert('isValidating inicial es false', v.isValidating('usuario') === false)
  assert('isValidating global inicial es false', v.isValidating() === false)

  // Disparar validación asíncrona mediante escritura
  v.values.usuario = 'admin'
  await nextTick()

  assert('isValidating(campo) es true durante async', v.isValidating('usuario') === true)
  assert('isValidating() global es true durante async', v.isValidating() === true)
  assert('validating.usuario reactivo es true', v.validating.usuario === true)

  // Resolver promesa con rechazo
  resolveCheck('El usuario admin ya existe')
  await new Promise(r => setTimeout(r, 20))
  await nextTick()

  assert('tras resolver, isValidating es false', v.isValidating('usuario') === false)
  assert('tras resolver, error fue registrado', v.state.errors.usuario === 'El usuario admin ya existe')

  v.dispose()
}

// ============================================================================
// 6. reset() con reactividad de Vue
// ============================================================================
section('6. reset() con sincronización reactiva en Vue')
{
  const initial = { nombre: 'Original', tel: '123' }
  const v = useValidator(
    initial,
    { nombre: [required()] }
  )

  // Modificar initialData original externamente no debe afectar a reset()
  initial.nombre = 'MUTADO_EXTERNO'

  // Modificar valores a través del proxy reactivo
  v.values.nombre = 'Modificado'
  v.values.tel = '999'
  await nextTick()

  assert('isDirty es true tras modificar', v.isDirty === true)
  assert('values.nombre modificado', v.values.nombre === 'Modificado')

  let trackedNombre = null
  const stop = watchEffect(() => {
    trackedNombre = v.values.nombre
  })

  // Ejecutar reset()
  v.reset()
  await nextTick()

  assert('reset() restauró valor inicial en v.values.nombre', v.values.nombre === 'Original')
  assert('reset() restauró valor inicial en v.values.tel', v.values.tel === '123')
  assert('watchEffect detectó el reseteo de valor', trackedNombre === 'Original')
  assert('reset() restauró isDirty a false', v.isDirty === false)

  // reset con nuevos valores
  v.reset({ nombre: 'NuevoDefault', tel: '555' })
  await nextTick()
  assert('reset(newValues) actualizó nombre', v.values.nombre === 'NuevoDefault')
  assert('reset(newValues) actualizó tel', v.values.tel === '555')
  assert('watchEffect detectó nuevos valores del reset', trackedNombre === 'NuevoDefault')

  stop()
  v.dispose()
}

// ============================================================================
// 7. setValues() con reactividad de Vue
// ============================================================================
section('7. setValues() reactivo')
{
  const v = useValidator(
    { a: '', perfil: { pais: 'Perú' } },
    { a: [required()] }
  )

  let trackedA = null
  let trackedPais = null
  const stop = watchEffect(() => {
    trackedA = v.values.a
    trackedPais = v.values.perfil.pais
  })

  v.setValues({ a: 'Hola', 'perfil.pais': 'Chile' })
  await nextTick()

  assert('setValues actualizó a', v.values.a === 'Hola')
  assert('setValues actualizó perfil.pais', v.values.perfil.pais === 'Chile')
  assert('watchEffect detectó a tras setValues', trackedA === 'Hola')
  assert('watchEffect detectó perfil.pais tras setValues', trackedPais === 'Chile')
  assert('isDirty es true tras setValues', v.isDirty === true)
  assert('campo a es válido tras setValues', v.state.errors.a === null)

  stop()
  v.dispose()
}

// ============================================================================
// 8. validate() — validación completa del formulario
// ============================================================================
section('8. validate() en Vue')
{
  const v = useValidator(
    { user: '', pass: '' },
    { user: [required()], pass: [required()] }
  )

  assert('inicialmente touched.user es false', v.touched.user === false)
  assert('inicialmente touched.pass es false', v.touched.pass === false)

  const okFalse = await v.validate()
  assert('validate() con vacíos retorna false', okFalse === false)
  assert('validate() enciende touched.user', v.touched.user === true)
  assert('validate() enciende touched.pass', v.touched.pass === true)
  assert('hasError(user) es true', v.hasError('user') === true)
  assert('hasError(pass) es true', v.hasError('pass') === true)

  v.values.user = 'carlos'
  v.values.pass = 'secreto'
  await nextTick()

  const okTrue = await v.validate()
  assert('validate() con datos válidos retorna true', okTrue === true)
  assert('isValid es true', v.isValid === true)
  assert('hasError(user) es false', v.hasError('user') === false)
  assert('hasError(pass) es false', v.hasError('pass') === false)

  v.dispose()
}

// ============================================================================
// 9. getPayload() y getTransformed() en Vue
// ============================================================================
section('9. getPayload() sanitizado')
{
  const v = useValidator(
    { email: '  PEDRO@HOTMAIL.COM  ', precio: '19.99' },
    {
      email: [required(), email(), trim(), toLowerCase()],
      precio: [required(), toFloat()]
    }
  )

  await v.validate()
  const payload = v.getPayload()

  assert('getPayload aplicó trim y toLowerCase', payload.email === 'pedro@hotmail.com')
  assert('getPayload aplicó toFloat', payload.precio === 19.99)
  assert('v.values.email original en pantalla intacto', v.values.email === '  PEDRO@HOTMAIL.COM  ')
  assert('getTransformed es idéntico a getPayload', JSON.stringify(v.getTransformed()) === JSON.stringify(payload))

  // Con customTransformFn
  const customPayload = v.getPayload(p => ({ ...p, enviado: true }))
  assert('customTransformFn agrega campos', customPayload.enviado === true)

  v.dispose()
}

// ============================================================================
// 10. SSR Y RENDER DE TEMPLATES CON QUASAR PATTERNS
// ============================================================================
section('10. SSR y Render de Templates')
{
  const App = {
    setup() {
      const v = useValidator(
        { nombre: '', email: 'invalido' },
        { nombre: [required('Nombre requerido')], email: [email('Email inválido')] }
      )
      v.touch('nombre')
      return { v }
    },
    template: `
      <div id="form">
        <span class="valid">{{ v.isValid }}</span>
        <button id="btn" :disabled="!v.isValid">Enviar</button>
        <span v-if="v.hasError('nombre')" class="error">{{ v.getError('nombre') }}</span>
      </div>
    `
  }

  const app = createSSRApp(App)
  const html = await renderToString(app)

  assert('SSR renderiza isValid como false', html.includes('<span class="valid">false</span>'))
  assert('SSR renderiza :disabled="!v.isValid" como disabled en HTML', html.includes('disabled=""') || html.includes('disabled'))
  assert('SSR renderiza mensaje de error de nombre', html.includes('Nombre requerido'))
}

// ============================================================================
// 11. LIFECYCLE Y DISPOSE (SIN ADVERTENCIAS DE VUE)
// ============================================================================
section('11. Lifecycle y Dispose')
{
  // Ejecutar fuera de setup no debe lanzar errores
  const v = useValidator({ a: '' }, {})
  assert('useValidator fuera de setup no rompe', typeof v.dispose === 'function')

  // dispose() cancela las suscripciones
  v.dispose()
  v.values.a = 'prueba'
  await nextTick()
  assert('tras dispose, values se puede mutar sin romper', v.values.a === 'prueba')
}

// ============================================================================
// 12. ESTRÉS Y CONTROL DE MEMORIA EN VUE
// ============================================================================
section('12. Estrés y memoria (10,000 instancias Vue)')
{
  const startHeap = process.memoryUsage().heapUsed / 1024 / 1024

  for (let i = 0; i < 10000; i++) {
    const inst = useValidator({ x: '' }, { x: [required()] })
    inst.values.x = `val_${i}`
    inst.dispose()
  }

  if (global.gc) {
    global.gc()
    const endHeap = process.memoryUsage().heapUsed / 1024 / 1024
    const diff = endHeap - startHeap
    console.log(`    📊 Variación de heap tras 10,000 instancias Vue (con GC): ${diff.toFixed(2)} MB`)
    assert('Consumo de memoria estable en creación/destrucción masiva (< 5 MB con GC)', diff < 5)
  } else {
    console.log('    ℹ️ global.gc no disponible (correr con --expose-gc para prueba estricta de heap)')
    assert('10,000 instancias creadas y destruidas sin excepción', true)
  }
}

// ============================================================================
// REPORTE FINAL
// ============================================================================
console.log('\n============================================================')
console.log(`  ✅ Pasaron: ${passed} / ${total}`)
if (failed > 0) {
  console.log(`  ❌ Fallaron: ${failed}`)
  console.log('  ⚠️  HAY TESTS QUE FALLARON — REVISAR ARRIBA')
} else {
  console.log('  🎉 ¡TODOS LOS TESTS DE VUE PASARON EXITOSAMENTE!')
}
console.log('============================================================\n')

if (failed > 0) process.exit(1)
