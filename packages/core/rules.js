/**
 * @file rules.js
 * @description Catálogo completo de reglas de validación universales y agnósticas.
 * Arquitectura Clean Code & SOLID:
 * - Single Responsibility Principle (SRP): Cada regla valida un único aspecto atómico.
 * - Composición: Bloques de construcción puros que se combinan para validaciones complejas.
 * - Rendimiento: Pre-cálculo de límites, Sets O(1) y caché de formateadores Intl.
 */

import { getNestedValue } from './core.js'
import { defaultMessages } from './messages.js'

// ============================================================================
// HELPER ATÓMICO: Detección universal de valores en blanco / ausentes (SRP)
// ============================================================================

/**
 * Determina si un valor está ausente o en blanco.
 * Considera en blanco: null, undefined y cadenas con solo espacios ("   ").
 * Preserva: 0, false, instancias de Date y texto con contenido.
 * @param {*} val - Valor a verificar
 * @returns {boolean} true si está ausente o en blanco
 */
export function isBlank(val) {
  if (val === null || val === undefined) return true
  if (typeof val === 'string' && val.trim() === '') return true
  return false
}

// ============================================================================
// HELPER INTERNO: Parser de fechas robusto (soporta ISO, local y objetos Date)
// ============================================================================

/**
 * Parsea un valor a Date nativo validando el calendario gregoriano real.
 * @param {*} val - Valor de entrada
 * @returns {Date|null} Objeto Date válido o null si es inválido
 */
function parseDateHelper(val) {
  if (!val) return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val

  const str = String(val).trim()
  if (!str) return null

  // Si es un ISO estándar con zona horaria (ej: '2026-10-19T20:30:00.000Z' o con offset +/-HH:MM)
  if (/T.*(Z|[+-]\d{2}:?\d{2})$/i.test(str)) {
    const parsed = new Date(str)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  // Separar fecha y hora opcional (separados por espacio o T)
  const [datePart, timePart] = str.split(/[ T]+/)
  let y, m, d
  let hr = 0, min = 0, sec = 0

  if (timePart) {
    const timeParts = timePart.split(':').map(Number)
    if (!isNaN(timeParts[0])) hr = timeParts[0]
    if (!isNaN(timeParts[1])) min = timeParts[1]
    if (!isNaN(timeParts[2])) sec = timeParts[2]
  }

  // YYYY-MM-DD o YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(datePart)) {
    const parts = datePart.split(/[-/]/).map(Number)
    y = parts[0]
    m = parts[1]
    d = parts[2]
  }
  // DD/MM/YYYY o DD-MM-YYYY
  else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(datePart)) {
    const parts = datePart.split(/[-/]/).map(Number)
    d = parts[0]
    m = parts[1]
    y = parts[2]
  } else {
    const parsed = new Date(str)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  if (m < 1 || m > 12 || d < 1 || d > 31 || hr < 0 || hr > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) return null

  const dateObj = new Date(y, m - 1, d, hr, min, sec)
  const isReal = (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  )
  return isReal ? dateObj : null
}

// ============================================================================
// 1. OBLIGATORIEDAD Y CONDICIONALES (SRP & Clean Code)
// ============================================================================

/**
 * Exige presencia de valor (no nulo, no indefinido, no cadena vacía ni espacios).
 * @param {string} [msg] - Mensaje de error personalizado opcional
 * @returns {Function} Regla: (val) => true | string
 */
export const required = (msg) => {
  const defaultMsg = msg || defaultMessages.required
  return (val) => isBlank(val) ? defaultMsg : true
}

/**
 * Ejecuta un conjunto de reglas ÚNICAMENTE si la condición se cumple.
 * Soporta dot notation para campos condicionales anidados ('apoderado.esExtranjero').
 * Si la condición es falsa, ignora todas las reglas internas y retorna true inmediatamente.
 * Patrón Higher-Order Rule puro (Clean Code & SRP).
 * @param {string|Function} conditionFnOrField - Nombre del campo booleano, ruta dot notation o función (allValues) => boolean
 * @param {Array<Function>|Function} rules - Regla o lista de reglas a evaluar si la condición es verdadera
 * @returns {Function} Regla condicional
 */
export const when = (conditionFnOrField, rules = []) => {
  const fn = (val, allValues = {}) => {
    const isApplicable = typeof conditionFnOrField === 'function'
      ? conditionFnOrField(allValues)
      : Boolean(allValues[conditionFnOrField] !== undefined ? allValues[conditionFnOrField] : getNestedValue(allValues, conditionFnOrField))

    if (!isApplicable) return true

    const ruleList = Array.isArray(rules) ? rules : [rules]

    for (let i = 0; i < ruleList.length; i++) {
      const rule = ruleList[i]
      if (!rule || rule.isTransform) continue

      const res = rule(val, allValues)
      if (res instanceof Promise || (res && typeof res.then === 'function')) {
        return res.then(asyncRes => {
          if (asyncRes !== true) return typeof asyncRes === 'string' ? asyncRes : defaultMessages.custom
          const remaining = ruleList.slice(i + 1)
          return when(() => true, remaining)(val, allValues)
        })
      }
      if (res !== true) {
        return typeof res === 'string' ? res : defaultMessages.custom
      }
    }

    return true
  }
  if (typeof conditionFnOrField === 'string') {
    fn.dependsOn = conditionFnOrField
  } else if (typeof conditionFnOrField === 'function') {
    fn.hasDynamicDeps = true
  }
  return fn
}

// ============================================================================
// 2. TIPOS DE DATOS PRIMITIVOS Y ATÓMICOS (SRP & Clean Code)
// ============================================================================

export const isString = (msg) => {
  const defaultMsg = msg || defaultMessages.isString
  return (val) => (val === null || val === undefined) ? true : typeof val === 'string' || defaultMsg
}

export const isNumber = (msg) => {
  const defaultMsg = msg || defaultMessages.isNumber
  return (val) => isBlank(val) ? true : (typeof val === 'number' && !isNaN(val)) || defaultMsg
}

export const isBoolean = (msg) => {
  const defaultMsg = msg || defaultMessages.isBoolean
  return (val) => isBlank(val) ? true : (typeof val === 'boolean' || val === true || val === false) || defaultMsg
}

export const isArray = (msg) => {
  const defaultMsg = msg || defaultMessages.isArray
  return (val) => (val === null || val === undefined) ? true : Array.isArray(val) || defaultMsg
}

export const isObject = (msg) => {
  const defaultMsg = msg || defaultMessages.isObject
  return (val) => (val === null || val === undefined) ? true : (typeof val === 'object' && val !== null && !Array.isArray(val)) || defaultMsg
}

export const isFile = (msg) => {
  const defaultMsg = msg || defaultMessages.isFile
  return (val) => {
    if (isBlank(val)) return true
    const file = Array.isArray(val) ? val[0] : val
    if (!file) return true
    const isNative = (typeof File !== 'undefined' && file instanceof File) || (typeof Blob !== 'undefined' && file instanceof Blob)
    const isFileLike = file && typeof file === 'object' && 'name' in file && 'size' in file
    return (isNative || isFileLike) || defaultMsg
  }
}

// ============================================================================
// 3. LONGITUD DE TEXTO Y CARACTERES
// ============================================================================

export const minLength = (min, msg) => {
  const defaultMsg = msg || defaultMessages.minLength(min)
  return (val) => {
    if (isBlank(val)) return true
    return String(val).trim().length >= min || defaultMsg
  }
}

export const maxLength = (max, msg) => {
  const defaultMsg = msg || defaultMessages.maxLength(max)
  return (val) => {
    if (isBlank(val)) return true
    return String(val).trim().length <= max || defaultMsg
  }
}

export const betweenLength = (min, max, msg) => {
  const defaultMsg = msg || defaultMessages.betweenLength(min, max)
  return (val) => {
    if (isBlank(val)) return true
    const len = String(val).trim().length
    return (len >= min && len <= max) || defaultMsg
  }
}

// ============================================================================
// 4. NÚMEROS Y RANGOS
// ============================================================================

export const numeric = (msg) => {
  const defaultMsg = msg || defaultMessages.numeric
  return (val) => {
    if (isBlank(val)) return true
    return !isNaN(Number(val)) || defaultMsg
  }
}

export const integer = (msg) => {
  const defaultMsg = msg || defaultMessages.integer
  return (val) => {
    if (isBlank(val)) return true
    return Number.isInteger(Number(val)) || defaultMsg
  }
}

export const minValue = (min, msg) => {
  const defaultMsg = msg || defaultMessages.minValue(min)
  return (val) => {
    if (isBlank(val)) return true
    return Number(val) >= min || defaultMsg
  }
}

export const maxValue = (max, msg) => {
  const defaultMsg = msg || defaultMessages.maxValue(max)
  return (val) => {
    if (isBlank(val)) return true
    return Number(val) <= max || defaultMsg
  }
}

export const between = (min, max, msg) => {
  const defaultMsg = msg || defaultMessages.between(min, max)
  return (val) => {
    if (isBlank(val)) return true
    const n = Number(val)
    return (n >= min && n <= max) || defaultMsg
  }
}

/** Helper interno para extraer y comparar dos números soportando dot-notation */
function getComparableNumber(val, allValues, targetFieldOrNum) {
  if (isBlank(val)) return null
  const numA = Number(val)
  if (isNaN(numA)) return null

  let rawTarget = targetFieldOrNum
  if (typeof targetFieldOrNum === 'string') {
    rawTarget = allValues[targetFieldOrNum] !== undefined
      ? allValues[targetFieldOrNum]
      : getNestedValue(allValues, targetFieldOrNum)
  }
  if (isBlank(rawTarget)) return null
  const numB = Number(rawTarget)
  if (isNaN(numB)) return null

  return { numA, numB }
}

export const greaterThan = (targetField, msg) => {
  const defaultMsg = msg || defaultMessages.greaterThan(targetField)
  const fn = (val, allValues = {}) => {
    const comp = getComparableNumber(val, allValues, targetField)
    if (!comp) return true
    return comp.numA > comp.numB || defaultMsg
  }
  if (typeof targetField === 'string') fn.dependsOn = targetField
  return fn
}

export const greaterThanOrEqual = (targetField, msg) => {
  const defaultMsg = msg || defaultMessages.greaterThanOrEqual(targetField)
  const fn = (val, allValues = {}) => {
    const comp = getComparableNumber(val, allValues, targetField)
    if (!comp) return true
    return comp.numA >= comp.numB || defaultMsg
  }
  if (typeof targetField === 'string') fn.dependsOn = targetField
  return fn
}

export const lessThan = (targetField, msg) => {
  const defaultMsg = msg || defaultMessages.lessThan(targetField)
  const fn = (val, allValues = {}) => {
    const comp = getComparableNumber(val, allValues, targetField)
    if (!comp) return true
    return comp.numA < comp.numB || defaultMsg
  }
  if (typeof targetField === 'string') fn.dependsOn = targetField
  return fn
}

export const lessThanOrEqual = (targetField, msg) => {
  const defaultMsg = msg || defaultMessages.lessThanOrEqual(targetField)
  const fn = (val, allValues = {}) => {
    const comp = getComparableNumber(val, allValues, targetField)
    if (!comp) return true
    return comp.numA <= comp.numB || defaultMsg
  }
  if (typeof targetField === 'string') fn.dependsOn = targetField
  return fn
}

// ============================================================================
// 5. FECHAS Y HORAS
// ============================================================================

export const date = (msg) => {
  const defaultMsg = msg || defaultMessages.date
  return (val) => {
    if (!val) return true
    return parseDateHelper(val) !== null || defaultMsg
  }
}

export const afterDate = (targetFieldOrDate, msg) => {
  const defaultMsg = msg || defaultMessages.afterDate
  const fn = (val, allValues = {}) => {
    if (!val) return true
    const current = parseDateHelper(val)
    if (!current) return defaultMessages.invalidDate

    const rawTarget = typeof targetFieldOrDate === 'function'
      ? targetFieldOrDate(allValues)
      : (allValues[targetFieldOrDate] !== undefined ? allValues[targetFieldOrDate] : (getNestedValue(allValues, targetFieldOrDate) || targetFieldOrDate))

    if (!rawTarget) return true
    const target = parseDateHelper(rawTarget)
    if (!target) return true

    return current.getTime() > target.getTime() || defaultMsg
  }
  if (typeof targetFieldOrDate === 'string' && !targetFieldOrDate.includes('-') && !targetFieldOrDate.includes('/')) {
    fn.dependsOn = targetFieldOrDate
  } else if (typeof targetFieldOrDate === 'function') {
    fn.hasDynamicDeps = true
  }
  return fn
}

export const beforeDate = (targetFieldOrDate, msg) => {
  const defaultMsg = msg || defaultMessages.beforeDate
  const fn = (val, allValues = {}) => {
    if (!val) return true
    const current = parseDateHelper(val)
    if (!current) return defaultMessages.invalidDate

    const rawTarget = typeof targetFieldOrDate === 'function'
      ? targetFieldOrDate(allValues)
      : (allValues[targetFieldOrDate] !== undefined ? allValues[targetFieldOrDate] : (getNestedValue(allValues, targetFieldOrDate) || targetFieldOrDate))

    if (!rawTarget) return true
    const target = parseDateHelper(rawTarget)
    if (!target) return true

    return current.getTime() < target.getTime() || defaultMsg
  }
  if (typeof targetFieldOrDate === 'string' && !targetFieldOrDate.includes('-') && !targetFieldOrDate.includes('/')) {
    fn.dependsOn = targetFieldOrDate
  } else if (typeof targetFieldOrDate === 'function') {
    fn.hasDynamicDeps = true
  }
  return fn
}

/** Helper interno puro para calcular edad exacta en años */
function calculateAge(val) {
  if (!val) return null
  const birth = parseDateHelper(val)
  if (!birth) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export const minAge = (years, msg) => {
  const defaultMsg = msg || defaultMessages.minAge(years)
  return (val) => {
    if (!val) return true
    const age = calculateAge(val)
    if (age === null) return defaultMessages.invalidBirthDate
    return age >= years || defaultMsg
  }
}

export const maxAge = (years, msg) => {
  const defaultMsg = msg || defaultMessages.maxAge(years)
  return (val) => {
    if (!val) return true
    const age = calculateAge(val)
    if (age === null) return defaultMessages.invalidBirthDate
    return age <= years || defaultMsg
  }
}

export const betweenAge = (minYears, maxYears, msg) => {
  const defaultMsg = msg || defaultMessages.betweenAge(minYears, maxYears)
  return (val) => {
    if (!val) return true
    const age = calculateAge(val)
    if (age === null) return defaultMessages.invalidBirthDate
    return (age >= minYears && age <= maxYears) || defaultMsg
  }
}

export const time = (msg) => {
  const defaultMsg = msg || defaultMessages.time
  return (val) => {
    if (!val) return true
    return /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(String(val).trim()) || defaultMsg
  }
}

// ============================================================================
// 6. CONTACTO, DOCUMENTOS Y COMUNICACIÓN
// ============================================================================

export const email = (msg) => {
  const defaultMsg = msg || defaultMessages.email
  return (val) => {
    if (!val) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim()) || defaultMsg
  }
}

export const mobile = (msg) => {
  const defaultMsg = msg || defaultMessages.mobile
  return (val) => {
    if (!val) return true
    return /^9\d{8}$/.test(String(val).trim()) || defaultMsg
  }
}

export const phone = (msg) => {
  const defaultMsg = msg || defaultMessages.phone
  return (val) => {
    if (!val) return true
    return /^(?:0\d{1,2}-?)?\d{6,9}$/.test(String(val).trim().replace(/\s+/g, '')) || defaultMsg
  }
}

export const url = (msg) => {
  const defaultMsg = msg || defaultMessages.url
  return (val) => {
    if (!val) return true
    try {
      const u = new URL(val)
      return Boolean(u.protocol === 'http:' || u.protocol === 'https:') || defaultMsg
    } catch (_) {
      return defaultMsg
    }
  }
}

export const alpha = (msg) => {
  const defaultMsg = msg || defaultMessages.alpha
  return (val) => {
    if (!val) return true
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(String(val).trim()) || defaultMsg
  }
}

export const alphaNum = (msg) => {
  const defaultMsg = msg || defaultMessages.alphaNum
  return (val) => {
    if (!val) return true
    return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(String(val).trim()) || defaultMsg
  }
}

export const dni = (msg) => {
  const defaultMsg = msg || defaultMessages.dni
  return (val) => {
    if (!val) return true
    return /^\d{8}$/.test(String(val).trim()) || defaultMsg
  }
}

export const ruc = (msg) => {
  const defaultMsg = msg || defaultMessages.ruc
  return (val) => {
    if (!val) return true
    return /^\d{11}$/.test(String(val).trim()) || defaultMsg
  }
}

export const cci = (msg) => {
  const defaultMsg = msg || defaultMessages.cci
  return (val) => {
    if (isBlank(val)) return true
    return /^\d{20}$/.test(String(val).trim()) || defaultMsg
  }
}

// ============================================================================
// 7. ARRAYS Y SELECCIÓN MÚLTIPLE (QSelect multiple, Checkboxes)
// ============================================================================

export const minItems = (min, msg) => {
  const defaultMsg = msg || defaultMessages.minItems(min)
  return (val) => {
    if (!val) return defaultMsg
    return (Array.isArray(val) && val.length >= min) || defaultMsg
  }
}

export const maxItems = (max, msg) => {
  const defaultMsg = msg || defaultMessages.maxItems(max)
  return (val) => {
    if (!val) return true
    return (Array.isArray(val) && val.length <= max) || defaultMsg
  }
}

export const oneOf = (allowedList = [], msg) => {
  const allowedSet = new Set(allowedList)
  const defaultMsg = msg || defaultMessages.oneOf
  return (val) => {
    if (isBlank(val)) return true
    return allowedSet.has(val) || defaultMsg
  }
}

export const each = (schemaOrRules, msg) => {
  return (val, allValues = {}) => {
    if (isBlank(val) || !Array.isArray(val)) return true

    // Caso A: Array de Objetos (sub-esquema)
    if (typeof schemaOrRules === 'object' && schemaOrRules !== null && !Array.isArray(schemaOrRules)) {
      for (let i = 0; i < val.length; i++) {
        const item = val[i] || {}
        for (const field in schemaOrRules) {
          const rules = Array.isArray(schemaOrRules[field]) ? schemaOrRules[field] : [schemaOrRules[field]]
          const fieldValue = item[field]
          for (const rule of rules) {
            if (typeof rule !== 'function' || rule.isTransform) continue
            const res = rule(fieldValue, item)
            if (res !== true) {
              return msg || defaultMessages.each(i, typeof res === 'string' ? res : 'Valor no válido')
            }
          }
        }
      }
      return true
    }

    // Caso B: Array de Primitivos (lista de reglas)
    const rules = Array.isArray(schemaOrRules) ? schemaOrRules : [schemaOrRules]
    for (let i = 0; i < val.length; i++) {
      const item = val[i]
      for (const rule of rules) {
        if (typeof rule !== 'function' || rule.isTransform) continue
        const res = rule(item, allValues)
        if (res !== true) {
          return msg || defaultMessages.each(i, typeof res === 'string' ? res : 'Valor no válido')
        }
      }
    }

    return true
  }
}

// ============================================================================
// 8. ARCHIVOS Y ADJUNTOS
// ============================================================================

export const fileMaxSize = (maxMB, msg) => {
  const maxBytes = maxMB * 1024 * 1024
  const defaultMsg = msg || defaultMessages.fileMaxSize(maxMB)
  return (file) => {
    if (!file) return true
    const sizeBytes = file.size || (file[0] && file[0].size) || 0
    return sizeBytes <= maxBytes || defaultMsg
  }
}

export const fileTypes = (allowedExts = [], msg) => {
  const cleanAllowed = new Set(allowedExts.map(e => String(e).toLowerCase().replace('.', '')))
  const defaultMsg = msg || defaultMessages.fileTypes
  return (file) => {
    if (!file) return true
    const fileName = file.name || (file[0] && file[0].name) || ''
    if (!fileName) return true
    const ext = fileName.split('.').pop().toLowerCase()
    return cleanAllowed.has(ext) || defaultMsg
  }
}

// ============================================================================
// 9. SEGURIDAD Y VALIDACIONES CRUZADAS
// ============================================================================

export const sameAs = (targetFieldOrGetter, msg) => {
  const defaultMsg = msg || defaultMessages.sameAs
  const fn = (val, allValues = {}) => {
    const targetVal = typeof targetFieldOrGetter === 'function'
      ? targetFieldOrGetter(allValues)
      : (allValues[targetFieldOrGetter] !== undefined ? allValues[targetFieldOrGetter] : getNestedValue(allValues, targetFieldOrGetter))
    return val === targetVal || defaultMsg
  }
  if (typeof targetFieldOrGetter === 'string') {
    fn.dependsOn = targetFieldOrGetter
  } else if (typeof targetFieldOrGetter === 'function') {
    fn.hasDynamicDeps = true
  }
  return fn
}

export const strongPassword = (msg) => {
  const defaultMsg = msg || defaultMessages.strongPassword
  return (val) => {
    if (!val) return true
    const s = String(val)
    const hasUpper = /[A-Z]/.test(s)
    const hasLower = /[a-z]/.test(s)
    const hasNumber = /[0-9]/.test(s)
    const hasSpecial = /[^A-Za-z0-9]/.test(s)
    const hasLen = s.length >= 8
    return (hasUpper && hasLower && hasNumber && hasSpecial && hasLen) || defaultMsg
  }
}

export const pattern = (regex, msg) => {
  const defaultMsg = msg || defaultMessages.pattern
  return (val) => {
    if (!val) return true
    return regex.test(String(val)) || defaultMsg
  }
}

export const custom = (fn, defaultMsg) => {
  const fallbackMsg = defaultMsg || defaultMessages.custom
  return (val, allValues) => {
    const res = fn(val, allValues)
    if (res instanceof Promise || (res && typeof res.then === 'function')) {
      return res.then(asyncRes => {
        if (asyncRes === true) return true
        if (typeof asyncRes === 'string') return asyncRes
        return fallbackMsg
      })
    }
    if (res === true) return true
    if (typeof res === 'string') return res
    return fallbackMsg
  }
}

// ============================================================================
// 10. TRANSFORMADORES Y SANITIZACIÓN DE DATOS (SRP & Clean Code)
// ============================================================================

export const DEFAULT_TIMEZONE = 'America/Lima'

// Caché de instancias Intl.DateTimeFormat para máximo rendimiento en transformaciones masivas
const dateTimeFormatterCache = new Map()

function getDateTimeFormatter(timeZone, includeTime) {
  const cacheKey = `${timeZone}_${includeTime}`
  let formatter = dateTimeFormatterCache.get(cacheKey)
  if (!formatter) {
    const options = {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false
    }
    if (includeTime) {
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.second = '2-digit'
    }
    formatter = new Intl.DateTimeFormat('sv-SE', options)
    dateTimeFormatterCache.set(cacheKey, formatter)
  }
  return formatter
}

/**
 * Helper interno para formatear fechas en cualquier zona horaria IANA de forma segura
 */
function formatDateWithTimezone(val, timeZone = DEFAULT_TIMEZONE, includeTime = false) {
  if (!val) return val

  // Si es un string de fecha pura sin hora y se solicita solo fecha (toDate),
  // se preserva el día de calendario exacto sin desfases de medianoche:
  if (typeof val === 'string' && !includeTime) {
    const trimmed = val.trim()
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0')
      const month = dmyMatch[2].padStart(2, '0')
      const year = dmyMatch[3]
      return `${year}-${month}-${day}`
    }
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (ymdMatch) {
      const year = ymdMatch[1]
      const month = ymdMatch[2].padStart(2, '0')
      const day = ymdMatch[3].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  const d = parseDateHelper(val)
  if (!d) return val

  try {
    const formatter = getDateTimeFormatter(timeZone, includeTime)
    return formatter.format(d).replace('T', ' ')
  } catch (_) {
    return includeTime ? d.toISOString().replace('T', ' ').substring(0, 19) : d.toISOString().substring(0, 10)
  }
}

/**
 * Primitiva universal de transformación.
 */
export const transform = (fn) => ({ isTransform: true, fn })

// Atajos atómicos y seguros contra nulos (SRP & Clean Code)
export const trim = () => transform(val => typeof val === 'string' ? val.trim() : val)
export const toLowerCase = () => transform(val => typeof val === 'string' ? val.toLowerCase() : val)
export const toUpperCase = () => transform(val => typeof val === 'string' ? val.toUpperCase() : val)
export const toFloat = () => transform(val => {
  if (isBlank(val)) return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
})
export const round = (decimals = 2) => transform(val => {
  if (isBlank(val)) return null
  const num = parseFloat(val)
  if (isNaN(num)) return null
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals)
})
export const truncate = (decimals = 0) => transform(val => {
  if (isBlank(val)) return null
  const num = parseFloat(val)
  if (isNaN(num)) return null
  if (decimals === 0) return Math.trunc(num)
  const factor = Math.pow(10, decimals)
  return Math.trunc(num * factor) / factor
})
export const toInteger = () => truncate(0)
export const digitsOnly = () => transform(val => isBlank(val) ? null : String(val).replace(/\D/g, ''))
export const toBooleanFlag = () => transform(val => (val === true || val === 1 || val === '1' || val === 'true') ? 1 : 0)
export const toDate = (timeZone = DEFAULT_TIMEZONE) => transform(val => formatDateWithTimezone(val, timeZone, false))
export const toDateTime = (timeZone = DEFAULT_TIMEZONE) => transform(val => formatDateWithTimezone(val, timeZone, true))
export const toISOString = () => transform(val => {
  const d = parseDateHelper(val)
  return d ? d.toISOString() : val
})

