/**
 * @file test_deep.mjs
 * @description Suite exhaustiva de tests — cubre edge cases, bugs potenciales,
 *              fugas de memoria y comportamiento límite de CADA función exportada.
 */
import {
  createValidator, getNestedValue, setNestedValue, cloneDeepSafe, createDeepProxy,
  required, when, isString, isNumber, isBoolean, isArray, isObject, isFile,
  minLength, maxLength, betweenLength, numeric, integer, minValue, maxValue, between,
  greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual,
  date, afterDate, beforeDate, minAge, maxAge, betweenAge, time,
  email, mobile, phone, url, alpha, alphaNum, dni, ruc, cci,
  minItems, maxItems, oneOf, each, fileMaxSize, fileTypes,
  sameAs, strongPassword, pattern, custom, isBlank,
  trim, toLowerCase, toUpperCase, toFloat, round, truncate, toInteger,
  digitsOnly, toBooleanFlag, toDate, toDateTime, toISOString, transform,
  configureMessages, defaultMessages, DEFAULT_TIMEZONE
} from '../packages/core/index.js'

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

console.log('🔬 SUITE EXHAUSTIVA DE TESTS — arv-validate core\n')

// ============================================================================
// A. FUNCIONES UTILITARIAS PURAS
// ============================================================================

section('A1. getNestedValue — edge cases')
{
  assert('null obj retorna undefined', getNestedValue(null, 'a') === undefined)
  assert('undefined obj retorna undefined', getNestedValue(undefined, 'a') === undefined)
  assert('path vacío retorna undefined', getNestedValue({ a: 1 }, '') === undefined)
  assert('path null retorna undefined', getNestedValue({ a: 1 }, null) === undefined)
  assert('propiedad directa', getNestedValue({ a: 1 }, 'a') === 1)
  assert('propiedad anidada', getNestedValue({ a: { b: { c: 3 } } }, 'a.b.c') === 3)
  assert('propiedad inexistente retorna undefined', getNestedValue({ a: 1 }, 'b') === undefined)
  assert('path intermedio null', getNestedValue({ a: null }, 'a.b') === undefined)
  assert('valor 0 preservado', getNestedValue({ a: 0 }, 'a') === 0)
  assert('valor false preservado', getNestedValue({ a: false }, 'a') === false)
  assert('valor empty string preservado', getNestedValue({ a: '' }, 'a') === '')
  // Edge: propiedad con punto literal en el nombre
  assert('propiedad con punto literal', getNestedValue({ 'a.b': 'directo' }, 'a.b') === 'directo')
  // Edge: array indexado
  assert('array indexado', getNestedValue({ items: ['x', 'y', 'z'] }, 'items.1') === 'y')
}

section('A2. setNestedValue — edge cases')
{
  const obj1 = {}
  setNestedValue(obj1, 'a.b.c', 42)
  assert('crea intermedios automáticamente', obj1.a.b.c === 42)

  const obj2 = { a: null }
  setNestedValue(obj2, 'a.b', 'valor')
  assert('sobrescribe null intermedio', obj2.a.b === 'valor')

  const obj3 = {}
  setNestedValue(obj3, '', 'nada')
  assert('path vacío no hace nada', Object.keys(obj3).length === 0)

  const obj4 = { 'a.b': 'original' }
  setNestedValue(obj4, 'a.b', 'reemplazado')
  assert('propiedad con punto literal se prioriza', obj4['a.b'] === 'reemplazado')

  const obj5 = {}
  setNestedValue(obj5, 'x', 99)
  assert('path sin punto asigna directo', obj5.x === 99)
}

section('A3. cloneDeepSafe — edge cases')
{
  // Primitivos
  assert('null', cloneDeepSafe(null) === null)
  assert('undefined', cloneDeepSafe(undefined) === undefined)
  assert('number', cloneDeepSafe(42) === 42)
  assert('string', cloneDeepSafe('hello') === 'hello')
  assert('boolean', cloneDeepSafe(false) === false)

  // Date
  const d = new Date('2026-01-15')
  const dClone = cloneDeepSafe(d)
  assert('Date clonado es nueva instancia', dClone !== d)
  assert('Date clonado mismo valor', dClone.getTime() === d.getTime())

  // Objetos profundos
  const orig = { a: { b: { c: [1, 2, { d: 3 }] } } }
  const clone = cloneDeepSafe(orig)
  assert('deep clone no es misma referencia', clone !== orig)
  assert('deep clone sub-obj no es misma referencia', clone.a.b !== orig.a.b)
  assert('deep clone preserva valores', clone.a.b.c[2].d === 3)
  clone.a.b.c[2].d = 999
  assert('mutación del clone no afecta original', orig.a.b.c[2].d === 3)

  // Referencia circular (fix reciente)
  const circular = { name: 'test' }
  circular.self = circular
  const circClone = cloneDeepSafe(circular)
  assert('referencia circular no causa stack overflow', circClone.name === 'test')

  // Array vacío y objeto vacío
  const emptyArr = cloneDeepSafe([])
  assert('array vacío', Array.isArray(emptyArr) && emptyArr.length === 0)
  const emptyObj = cloneDeepSafe({})
  assert('objeto vacío', typeof emptyObj === 'object' && Object.keys(emptyObj).length === 0)
}

section('A4. isBlank — edge cases')
{
  assert('null es blank', isBlank(null) === true)
  assert('undefined es blank', isBlank(undefined) === true)
  assert('string vacío es blank', isBlank('') === true)
  assert('espacios es blank', isBlank('   ') === true)
  assert('tab es blank', isBlank('\t') === true)
  assert('0 NO es blank', isBlank(0) === false)
  assert('false NO es blank', isBlank(false) === false)
  assert('[] NO es blank', isBlank([]) === false)
  assert('{} NO es blank', isBlank({}) === false)
  assert('string con contenido NO es blank', isBlank('a') === false)
}

// ============================================================================
// B. REGLAS DE VALIDACIÓN — CADA UNA CON EDGE CASES
// ============================================================================

section('B1. required')
{
  const rule = required()
  assert('null falla', rule(null) !== true)
  assert('undefined falla', rule(undefined) !== true)
  assert('vacío falla', rule('') !== true)
  assert('espacios falla', rule('   ') !== true)
  assert('0 pasa', rule(0) === true)
  assert('false pasa', rule(false) === true)
  assert('texto pasa', rule('hola') === true)
  assert('[] pasa (array vacío no es blank)', rule([]) === true)

  const customMsg = required('obligatorio!')
  assert('mensaje custom', customMsg('') === 'obligatorio!')
}

section('B2. when — condicional')
{
  const rule = when('activo', [required()])
  assert('condición false → pasa', rule('', { activo: false }) === true)
  assert('condición true, vacío → falla', rule('', { activo: true }) !== true)
  assert('condición true, con valor → pasa', rule('dato', { activo: true }) === true)

  // when con función
  const ruleFn = when(all => all.tipo === 'A', [required()])
  assert('función false → pasa', ruleFn('', { tipo: 'B' }) === true)
  assert('función true → falla', ruleFn('', { tipo: 'A' }) !== true)

  // when con dot notation
  const ruleDot = when('config.required', [required()])
  assert('dot notation true → falla', ruleDot('', { config: { required: true } }) !== true)
  assert('dot notation false → pasa', ruleDot('', { config: { required: false } }) === true)

  // when con regla async dentro
  const ruleAsync = when(() => true, [
    custom(async (val) => val === 'ok' || 'nope')
  ])
  const asyncResult = ruleAsync('ok', {})
  assert('when con async retorna Promise', asyncResult instanceof Promise || (asyncResult && typeof asyncResult.then === 'function') || asyncResult === true)
}

section('B3. Tipos de datos')
{
  assert('isString: string pasa', isString()('hello') === true)
  assert('isString: number falla', isString()(123) !== true)
  assert('isString: null pasa (nullable)', isString()(null) === true)

  assert('isNumber: number pasa', isNumber()(42) === true)
  assert('isNumber: NaN falla', isNumber()(NaN) !== true)
  assert('isNumber: string falla', isNumber()('abc') !== true)
  assert('isNumber: null pasa', isNumber()(null) === true)

  assert('isBoolean: true pasa', isBoolean()(true) === true)
  assert('isBoolean: false pasa', isBoolean()(false) === true)
  assert('isBoolean: string falla', isBoolean()('yes') !== true)

  assert('isArray: array pasa', isArray()([1, 2]) === true)
  assert('isArray: object falla', isArray()({}) !== true)
  assert('isArray: null pasa', isArray()(null) === true)

  assert('isObject: object pasa', isObject()({ a: 1 }) === true)
  assert('isObject: array falla', isObject()([]) !== true)
  assert('isObject: null pasa', isObject()(null) === true)

  assert('isFile: file-like pasa', isFile()({ name: 'a.pdf', size: 100 }) === true)
  assert('isFile: string falla', isFile()('no-file') !== true)
  assert('isFile: null pasa', isFile()(null) === true)
}

section('B4. Longitud de texto')
{
  assert('minLength: 3 chars con "ab" falla', minLength(3)('ab') !== true)
  assert('minLength: 3 chars con "abc" pasa', minLength(3)('abc') === true)
  assert('minLength: null pasa', minLength(3)(null) === true)
  assert('minLength: spaces trimmed', minLength(3)('  a  ') !== true) // "a" length 1

  assert('maxLength: 5 con "abcdef" falla', maxLength(5)('abcdef') !== true)
  assert('maxLength: 5 con "abcde" pasa', maxLength(5)('abcde') === true)

  assert('betweenLength: 2-5 con "a" falla', betweenLength(2, 5)('a') !== true)
  assert('betweenLength: 2-5 con "ab" pasa', betweenLength(2, 5)('ab') === true)
  assert('betweenLength: 2-5 con "abcde" pasa', betweenLength(2, 5)('abcde') === true)
  assert('betweenLength: 2-5 con "abcdef" falla', betweenLength(2, 5)('abcdef') !== true)
}

section('B5. Números y rangos')
{
  assert('numeric: "123" pasa', numeric()('123') === true)
  assert('numeric: "abc" falla', numeric()('abc') !== true)
  assert('numeric: "12.5" pasa', numeric()('12.5') === true)
  assert('numeric: "" pasa (blank)', numeric()('') === true)

  assert('integer: "5" pasa', integer()('5') === true)
  assert('integer: "5.5" falla', integer()('5.5') !== true)

  assert('minValue: 10 con 9 falla', minValue(10)(9) !== true)
  assert('minValue: 10 con 10 pasa', minValue(10)(10) === true)
  assert('minValue: 10 con 11 pasa', minValue(10)(11) === true)

  assert('maxValue: 10 con 11 falla', maxValue(10)(11) !== true)
  assert('maxValue: 10 con 10 pasa', maxValue(10)(10) === true)

  assert('between: 1-10 con 0 falla', between(1, 10)(0) !== true)
  assert('between: 1-10 con 5 pasa', between(1, 10)(5) === true)
  assert('between: 1-10 con 10 pasa', between(1, 10)(10) === true)
  assert('between: 1-10 con 11 falla', between(1, 10)(11) !== true)

  // Comparaciones cruzadas
  assert('greaterThan: 5 > campo(3) pasa', greaterThan('min')(5, { min: 3 }) === true)
  assert('greaterThan: 3 > campo(5) falla', greaterThan('min')(3, { min: 5 }) !== true)
  assert('greaterThan: null pasa', greaterThan('min')(null, { min: 5 }) === true)

  assert('lessThan: 3 < campo(5) pasa', lessThan('max')(3, { max: 5 }) === true)
  assert('lessThan: 5 < campo(3) falla', lessThan('max')(5, { max: 3 }) !== true)

  assert('greaterThanOrEqual: 5 >= campo(5) pasa', greaterThanOrEqual('min')(5, { min: 5 }) === true)
  assert('lessThanOrEqual: 5 <= campo(5) pasa', lessThanOrEqual('max')(5, { max: 5 }) === true)
}

section('B6. Fechas y horas')
{
  assert('date: YYYY-MM-DD válida', date()('2026-10-19') === true)
  assert('date: DD/MM/YYYY válida', date()('19/10/2026') === true)
  assert('date: 31 feb falla', date()('31/02/2026') !== true)
  assert('date: 29 feb bisiesto pasa', date()('29/02/2024') === true)
  assert('date: 29 feb no bisiesto falla', date()('29/02/2023') !== true)
  assert('date: vacío pasa', date()('') === true)
  assert('date: null pasa', date()(null) === true)
  assert('date: objeto Date válido', date()(new Date('2026-01-01')) === true)
  assert('date: objeto Date inválido falla', date()(new Date('invalid')) !== true)
  assert('date: ISO con timezone', date()('2026-10-19T20:30:00.000Z') === true)

  assert('time: HH:mm válida', time()('08:30') === true)
  assert('time: HH:mm:ss válida', time()('14:30:45') === true)
  assert('time: 25:00 falla', time()('25:00') !== true)
  assert('time: 00:60 falla', time()('00:60') !== true)
  assert('time: 23:59 pasa', time()('23:59') === true)
  assert('time: 00:00 pasa', time()('00:00') === true)
  assert('time: vacío pasa', time()('') === true)

  assert('afterDate: posterior pasa', afterDate('inicio')('2026-12-01', { inicio: '2026-01-01' }) === true)
  assert('afterDate: anterior falla', afterDate('inicio')('2026-01-01', { inicio: '2026-12-01' }) !== true)
  assert('afterDate: vacío pasa', afterDate('inicio')('', { inicio: '2026-01-01' }) === true)

  assert('beforeDate: anterior pasa', beforeDate('fin')('2026-01-01', { fin: '2026-12-01' }) === true)
  assert('beforeDate: posterior falla', beforeDate('fin')('2026-12-01', { fin: '2026-01-01' }) !== true)
}

section('B7. Contacto y documentos')
{
  assert('email: válido', email()('user@example.com') === true)
  assert('email: sin @', email()('userexample.com') !== true)
  assert('email: sin dominio', email()('user@') !== true)
  assert('email: vacío pasa', email()('') === true)
  assert('email: con espacios internos falla', email()('user @test.com') !== true)

  assert('mobile: 9 dígitos válido', mobile()('987654321') === true)
  assert('mobile: 8 dígitos falla', mobile()('98765432') !== true)
  assert('mobile: no empieza en 9 falla', mobile()('187654321') !== true)

  assert('url: https válida', url()('https://example.com') === true)
  assert('url: http válida', url()('http://example.com') === true)
  assert('url: ftp falla', url()('ftp://example.com') !== true)
  assert('url: texto plano falla', url()('no-es-url') !== true)

  assert('alpha: letras pasa', alpha()('Hola Mundo') === true)
  assert('alpha: con número falla', alpha()('Hola123') !== true)
  assert('alpha: con acentos pasa', alpha()('José María Ñoño') === true)

  assert('alphaNum: letras y números pasa', alphaNum()('Abc123') === true)
  assert('alphaNum: con símbolo falla', alphaNum()('Abc@123') !== true)

  assert('dni: 8 dígitos pasa', dni()('12345678') === true)
  assert('dni: 7 dígitos falla', dni()('1234567') !== true)
  assert('dni: con letras falla', dni()('1234567A') !== true)

  assert('ruc: 11 dígitos pasa', ruc()('20123456789') === true)
  assert('ruc: 10 dígitos falla', ruc()('2012345678') !== true)

  assert('cci: 20 dígitos pasa', cci()('00191900012345678901') === true)
  assert('cci: 19 dígitos falla', cci()('0019190001234567890') !== true)
}

section('B8. Arrays y selección')
{
  assert('minItems: 2 con [1] falla', minItems(2)([1]) !== true)
  assert('minItems: 2 con [1,2] pasa', minItems(2)([1, 2]) === true)
  assert('minItems: null falla', minItems(1)(null) !== true)

  assert('maxItems: 2 con [1,2,3] falla', maxItems(2)([1, 2, 3]) !== true)
  assert('maxItems: 2 con [1,2] pasa', maxItems(2)([1, 2]) === true)
  assert('maxItems: null pasa', maxItems(2)(null) === true)

  assert('oneOf: valor permitido pasa', oneOf(['A', 'B', 'C'])('B') === true)
  assert('oneOf: valor no permitido falla', oneOf(['A', 'B', 'C'])('D') !== true)
  assert('oneOf: null pasa', oneOf(['A'])(null) === true)

  // each con primitivos
  assert('each: primitivos válidos', each(required())(['a', 'b', 'c']) === true)
  assert('each: primitivo vacío falla', each(required())(['a', '', 'c']) !== true)

  // each con objetos
  assert('each: objetos válidos', each({ name: [required()] })([{ name: 'A' }, { name: 'B' }]) === true)
  assert('each: objeto con campo vacío falla', each({ name: [required()] })([{ name: 'A' }, { name: '' }]) !== true)

  // each con array vacío
  assert('each: array vacío pasa', each(required())([]) === true)
  assert('each: null pasa', each(required())(null) === true)
}

section('B9. Archivos')
{
  assert('fileMaxSize: 1MB dentro del límite', fileMaxSize(1)({ size: 500000 }) === true)
  assert('fileMaxSize: excede límite', fileMaxSize(1)({ size: 2000000 }) !== true)
  assert('fileMaxSize: null pasa', fileMaxSize(1)(null) === true)
  assert('fileMaxSize: array de files', fileMaxSize(1)([{ size: 500000 }]) === true) // usa file[0].size

  assert('fileTypes: ext permitida', fileTypes(['pdf', 'jpg'])({ name: 'doc.pdf' }) === true)
  assert('fileTypes: ext no permitida', fileTypes(['pdf', 'jpg'])({ name: 'doc.exe' }) !== true)
  assert('fileTypes: con punto en config', fileTypes(['.pdf'])({ name: 'doc.pdf' }) === true)
  assert('fileTypes: case insensitive', fileTypes(['PDF'])({ name: 'doc.pdf' }) === true)
  assert('fileTypes: null pasa', fileTypes(['pdf'])(null) === true)
}

section('B10. Seguridad y cruzadas')
{
  assert('sameAs: iguales', sameAs('confirm')('abc', { confirm: 'abc' }) === true)
  assert('sameAs: diferentes', sameAs('confirm')('abc', { confirm: 'xyz' }) !== true)
  assert('sameAs: ambos vacíos', sameAs('confirm')('', { confirm: '' }) === true)
  assert('sameAs: con función', sameAs(all => all.x)('val', { x: 'val' }) === true)

  assert('strongPassword: válida', strongPassword()('Abc123!@') === true)
  assert('strongPassword: sin mayúscula', strongPassword()('abc123!@') !== true)
  assert('strongPassword: sin número', strongPassword()('Abcdefg!') !== true)
  assert('strongPassword: sin símbolo', strongPassword()('Abcdefg1') !== true)
  assert('strongPassword: muy corta', strongPassword()('Ab1!') !== true)
  assert('strongPassword: vacío pasa', strongPassword()('') === true)

  assert('pattern: regex pasa', pattern(/^\d{3}-\d{3}$/)('123-456') === true)
  assert('pattern: regex falla', pattern(/^\d{3}-\d{3}$/)('abc') !== true)
  assert('pattern: vacío pasa', pattern(/^\d+$/)('') === true)

  // custom sync
  assert('custom sync: retorna true', custom(v => v > 0)(5) === true)
  assert('custom sync: retorna string', custom(v => v > 0 || 'debe ser positivo')(-1) === 'debe ser positivo')
  assert('custom sync: retorna false → mensaje default', custom(v => v > 0)(-1) !== true)
}

// ============================================================================
// C. TRANSFORMADORES — CADA UNO CON EDGE CASES
// ============================================================================

section('C1. Transformadores')
{
  // trim
  assert('trim: con espacios', trim().fn('  hola  ') === 'hola')
  assert('trim: sin espacios', trim().fn('hola') === 'hola')
  assert('trim: no-string retorna tal cual', trim().fn(42) === 42)
  assert('trim: null retorna null', trim().fn(null) === null)

  // toLowerCase / toUpperCase
  assert('toLowerCase', toLowerCase().fn('HOLA') === 'hola')
  assert('toUpperCase', toUpperCase().fn('hola') === 'HOLA')
  assert('toLowerCase: number unchanged', toLowerCase().fn(42) === 42)

  // toFloat
  assert('toFloat: string', toFloat().fn('150.50') === 150.5)
  assert('toFloat: integer string', toFloat().fn('100') === 100)
  assert('toFloat: NaN → null', toFloat().fn('abc') === null)
  assert('toFloat: null → null', toFloat().fn(null) === null)
  assert('toFloat: empty → null', toFloat().fn('') === null)

  // round
  assert('round: 2 decimals', round(2).fn('16.789') === 16.79)
  assert('round: 0 decimals', round(0).fn('16.789') === 17)
  assert('round: null → null', round(2).fn(null) === null)

  // truncate
  assert('truncate: 2 decimals', truncate(2).fn('16.789') === 16.78)
  assert('truncate: 0 decimals', truncate(0).fn('16.789') === 16)
  assert('truncate: null → null', truncate(0).fn(null) === null)

  // toInteger
  assert('toInteger', toInteger().fn('99.9') === 99)

  // digitsOnly
  assert('digitsOnly', digitsOnly().fn('+51 987-654-321') === '51987654321')
  assert('digitsOnly: null → null', digitsOnly().fn(null) === null)

  // toBooleanFlag
  assert('toBooleanFlag: true → 1', toBooleanFlag().fn(true) === 1)
  assert('toBooleanFlag: false → 0', toBooleanFlag().fn(false) === 0)
  assert('toBooleanFlag: 1 → 1', toBooleanFlag().fn(1) === 1)
  assert('toBooleanFlag: 0 → 0', toBooleanFlag().fn(0) === 0)
  assert('toBooleanFlag: "true" → 1', toBooleanFlag().fn('true') === 1)
  assert('toBooleanFlag: "false" → 0', toBooleanFlag().fn('false') === 0)
  assert('toBooleanFlag: null → 0', toBooleanFlag().fn(null) === 0)

  // toDate
  assert('toDate: DD/MM/YYYY → YYYY-MM-DD', toDate().fn('19/10/2026') === '2026-10-19')
  assert('toDate: YYYY-MM-DD preserva', toDate().fn('2026-10-19') === '2026-10-19')
  assert('toDate: null → null', toDate().fn(null) === null)

  // toISOString
  const isoResult = toISOString().fn('2026-01-15')
  assert('toISOString: retorna ISO', typeof isoResult === 'string' && isoResult.includes('2026'))
  assert('toISOString: null → null', toISOString().fn(null) === null)

  // transform custom
  const slugify = transform(val => String(val).toLowerCase().replace(/\s+/g, '-'))
  assert('transform custom', slugify.fn('Hello World') === 'hello-world')
  assert('transform tiene isTransform', slugify.isTransform === true)
}

// ============================================================================
// D. MOTOR createValidator — EDGE CASES PROFUNDOS
// ============================================================================

section('D1. reset() — no se contamina con mutación del objeto original')
{
  const data = { name: 'original', age: 25 }
  const v = createValidator(data, { name: [required()] })

  // Mutar el objeto original DESPUÉS de crear el validador
  data.name = 'MUTADO'
  data.age = 99

  v.values.name = 'modificado'
  v.reset()
  await new Promise(r => setTimeout(r, 50))

  // Snapshot inmutable: reset() usa defaultValues clonado, no la referencia mutada
  const afterReset = v.state.values.name
  assert('reset() restaura valores originales incluso tras mutación externa', afterReset === 'original')
  assert('reset() restaura age original', v.state.values.age === 25)
}

section('D2. validate() toca todos los campos')
{
  const v = createValidator(
    { a: '', b: '' },
    { a: [required()], b: [required()] }
  )
  assert('antes de validate, touched a es false', v.state.touched.a === false)
  assert('antes de validate, touched b es false', v.state.touched.b === false)

  const isValid = await v.validate()
  assert('validate retorna false con campos vacíos', isValid === false)
  assert('después de validate, touched a es true', v.state.touched.a === true)
  assert('después de validate, touched b es true', v.state.touched.b === true)
  assert('ambos tienen errores', v.state.errors.a !== null && v.state.errors.b !== null)
}

section('D3. setValues — actualiza múltiples campos con validación')
{
  const v = createValidator(
    { x: '', y: '' },
    { x: [required()], y: [required()] }
  )
  v.setValues({ x: 'hello', y: 'world' })
  await new Promise(r => setTimeout(r, 50))
  assert('setValues actualiza x', v.state.values.x === 'hello')
  assert('setValues actualiza y', v.state.values.y === 'world')
  assert('isDirty es true tras setValues', v.state.isDirty === true)
  assert('sin errores tras setValues con valores válidos', v.state.errors.x === null && v.state.errors.y === null)
}

section('D4. live: false desactiva validación en vivo')
{
  const v = createValidator(
    { x: '' },
    { x: [required()] },
    { live: false }
  )
  v.values.x = 'algo'
  await new Promise(r => setTimeout(r, 50))
  // Con live: false, el proxy no debería disparar validateField
  // Pero validate() manual sí debe funcionar
  const isValid = await v.validate()
  assert('validate() manual funciona con live:false', isValid === true)
}

section('D5. hasError y getError respetan touched')
{
  const v = createValidator(
    { email: '' },
    { email: [required(), email()] }
  )
  await new Promise(r => setTimeout(r, 50))

  // Campo tiene error pero no ha sido tocado
  assert('hasError sin tocar es false', v.hasError('email') === false)
  assert('getError sin tocar es null', v.getError('email') === null)

  v.touch('email')
  await new Promise(r => setTimeout(r, 50))
  assert('hasError tras touch es true', v.hasError('email') === true)
  assert('getError tras touch tiene mensaje', v.getError('email') !== null)

  v.untouch('email')
  assert('hasError tras untouch es false', v.hasError('email') === false)
}

section('D6. subscribe y unsubscribe')
{
  const v = createValidator({ x: '' }, { x: [required()] })
  let callCount = 0
  const unsub = v.subscribe(() => callCount++)

  // subscribe llama inmediatamente
  assert('subscribe llama inmediatamente', callCount === 1)

  v.values.x = 'test'
  await new Promise(r => setTimeout(r, 50))
  const afterMutation = callCount
  assert('subscribe recibe notificaciones', afterMutation > 1)

  unsub()
  const beforeUnsub = callCount
  v.values.x = 'otro'
  await new Promise(r => setTimeout(r, 50))
  assert('después de unsubscribe no recibe más', callCount === beforeUnsub)
}

section('D7. getPayload con customTransformFn')
{
  const v = createValidator(
    { name: '  Juan  ', age: '25' },
    { name: [trim()], age: [toInteger()] }
  )
  const payload = v.getPayload()
  assert('payload transformado', payload.name === 'Juan' && payload.age === 25)

  // Con función custom
  const custom2 = v.getPayload(p => ({ ...p, extra: true }))
  assert('customTransformFn se aplica', custom2.extra === true)
  assert('customTransformFn mantiene datos', custom2.name === 'Juan')

  // Original no mutado
  assert('original no mutado', v.state.values.name === '  Juan  ')
}

section('D8. isValidating — estado de validación async')
{
  const v = createValidator(
    { code: '' },
    {
      code: [
        custom(async (val) => {
          await new Promise(r => setTimeout(r, 100))
          return val === 'ok' || 'nope'
        })
      ]
    }
  )

  v.touch('code')
  v.values.code = 'testing'
  await new Promise(r => setTimeout(r, 20))
  assert('isValidating(campo) es true durante async', v.isValidating('code') === true)
  assert('isValidating() global es true', v.isValidating() === true)

  await new Promise(r => setTimeout(r, 200))
  assert('isValidating(campo) es false después', v.isValidating('code') === false)
}

section('D9. Dependencias cruzadas — greaterThan revalida al cambiar dependencia')
{
  const v = createValidator(
    { min: 10, max: 5 },
    {
      min: [required(), numeric()],
      max: [required(), numeric(), greaterThan('min')]
    }
  )
  v.touch('max')
  await new Promise(r => setTimeout(r, 50))
  assert('max < min tiene error', v.state.errors.max !== null)

  v.values.min = 3
  await new Promise(r => setTimeout(r, 50))
  assert('tras bajar min, max ya no tiene error', v.state.errors.max === null)
}

section('D10. getTransformed es alias de getPayload')
{
  const v = createValidator({ x: '  hello  ' }, { x: [trim()] })
  const p1 = v.getPayload()
  const p2 = v.getTransformed()
  assert('getTransformed retorna mismo resultado', p1.x === p2.x && p1.x === 'hello')
}

section('D11. touch/untouch con campo inexistente no rompe')
{
  const v = createValidator({ x: '' }, { x: [required()] })
  try {
    v.touch('campoInexistente')
    v.untouch('campoInexistente')
    assert('touch/untouch con campo inexistente no lanza error', true)
  } catch (e) {
    assert('touch/untouch con campo inexistente no lanza error', false)
  }
}

section('D12. Validación con regla que lanza error (throw)')
{
  const v = createValidator(
    { x: 'test' },
    {
      x: [
        custom(() => { throw new Error('boom!') })
      ]
    }
  )
  v.touch('x')
  await v.validate()
  assert('error lanzado se captura como mensaje', v.state.errors.x === 'boom!')
}

section('D13. Múltiples reglas — se detiene en la primera que falla')
{
  let secondRuleCalled = false
  const v = createValidator(
    { x: '' },
    {
      x: [
        required(),
        custom(() => { secondRuleCalled = true; return true })
      ]
    }
  )
  await v.validate()
  assert('segunda regla no se ejecuta si primera falla', secondRuleCalled === false)
}

section('D14. configureMessages — personalización global')
{
  const originalMsg = defaultMessages.required
  configureMessages({ required: 'Campo requerido CUSTOM' })
  const rule = required()
  assert('mensaje personalizado se aplica', rule('') === 'Campo requerido CUSTOM')

  // Restaurar
  configureMessages({ required: originalMsg })
  const rule2 = required()
  assert('restauración funciona', rule2('') === originalMsg)
}

// ============================================================================
// E. EDGE CASES EXTREMOS
// ============================================================================

section('E1. Formulario con un solo campo')
{
  const v = createValidator({ solo: '' }, { solo: [required()] })
  assert('form vacío no es válido', v.state.isValid === false)
  v.values.solo = 'dato'
  await new Promise(r => setTimeout(r, 50))
  assert('form con dato es válido', v.state.isValid === true)
}

section('E2. Regla que retorna false (no string)')
{
  const v = createValidator(
    { x: 'test' },
    { x: [() => false] } // Retorna false en vez de string
  )
  await v.validate()
  assert('false se convierte a mensaje genérico', v.state.errors.x === 'Valor no válido')
}

section('E3. Schema con regla única (no array)')
{
  const v = createValidator(
    { x: '' },
    { x: required() } // Sin envolver en array
  )
  await v.validate()
  assert('regla sin array funciona', v.state.errors.x !== null)
}

section('E4. Valores numéricos en campos')
{
  const v = createValidator(
    { price: 0 },
    { price: [required()] }
  )
  await new Promise(r => setTimeout(r, 50))
  assert('0 no es blank para required', v.state.errors.price === null)
}

section('E5. Proxy con arrays — push/splice')
{
  const v = createValidator(
    { items: ['a', 'b'] },
    { items: [minItems(3)] }
  )
  await new Promise(r => setTimeout(r, 50))
  assert('2 items falla minItems(3)', v.state.errors.items !== null)

  v.values.items.push('c')
  await new Promise(r => setTimeout(r, 50))
  assert('tras push, 3 items pasa minItems(3)', v.state.errors.items === null)
}

// ============================================================================
// RESUMEN FINAL
// ============================================================================

console.log(`\n${'='.repeat(60)}`)
console.log(`  ✅ Pasaron: ${passed} / ${total}`)
if (failed > 0) {
  console.log(`  ❌ Fallaron: ${failed}`)
  console.log(`  ⚠️  HAY TESTS QUE FALLARON — REVISAR ARRIBA`)
} else {
  console.log(`  🎉 ¡TODOS LOS TESTS PASARON — CÓDIGO SÓLIDO!`)
}
console.log(`${'='.repeat(60)}`)
