/**
 * @file core.js
 * @description Motor de validación reactivo 100% agnóstico a cualquier framework.
 * Arquitectura Clean Code & SOLID:
 * - SRP: Funciones atómicas, puras y desacopladas.
 * - Open/Closed: Extensible mediante reglas puras sin modificar el motor central.
 * - Optimización: Pre-compilación de esquema (separación de validadores y transformadores)
 *   y protección contra condiciones de carrera en peticiones asíncronas.
 */

/**
 * Obtiene el valor de una propiedad anidada mediante dot notation ('apoderado.nroDoc').
 * Función pura, segura contra referencias nulas o indefinidas.
 * @param {Object} obj - Objeto raíz
 * @param {string} path - Ruta separada por puntos (ej: 'usuario.perfil.edad')
 * @returns {*} El valor encontrado o undefined
 */
export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path]
  const keys = path.split('.')
  let curr = obj
  for (const k of keys) {
    if (curr === null || curr === undefined) return undefined
    curr = curr[k]
  }
  return curr
}

/**
 * Establece el valor de una propiedad anidada mediante dot notation ('apoderado.nroDoc').
 * Crea automáticamente los objetos intermedios si no existen.
 * @param {Object} obj - Objeto destino
 * @param {string} path - Ruta separada por puntos
 * @param {*} value - Valor a asignar
 */
export function setNestedValue(obj, path, value) {
  if (!path) return
  if (Object.prototype.hasOwnProperty.call(obj, path) || !path.includes('.')) {
    obj[path] = value
    return
  }
  const keys = path.split('.')
  let curr = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (curr[k] === null || curr[k] === undefined || typeof curr[k] !== 'object') {
      curr[k] = {}
    }
    curr = curr[k]
  }
  curr[keys[keys.length - 1]] = value
}

/**
 * Realiza un clonado profundo preservando instancias de Date, File, Blob y Arrays.
 * Evita la mutación accidental de objetos anidados y del estado original.
 * @param {*} val - Valor u objeto a clonar
 * @returns {*} Copia profunda segura
 */
export function cloneDeepSafe(val, seen = new Set()) {
  if (val === null || typeof val !== 'object') return val
  if (val instanceof Date) return new Date(val.getTime())
  if (typeof File !== 'undefined' && val instanceof File) return val
  if (typeof Blob !== 'undefined' && val instanceof Blob) return val
  if (seen.has(val)) return val
  seen.add(val)
  if (Array.isArray(val)) return val.map(item => cloneDeepSafe(item, seen))
  const res = {}
  for (const k of Object.keys(val)) {
    res[k] = cloneDeepSafe(val[k], seen)
  }
  return res
}

/**
 * Genera un Proxy recursivo profundo para interceptar modificaciones en vivo,
 * soportando dot notation de manera transparente.
 * @param {Object} target - Objeto a interceptar
 * @param {string} path - Ruta acumulada
 * @param {Function} onSet - Callback invocado al mutar una propiedad: (fullPath, value) => void
 * @returns {Proxy} Objeto envuelto en Proxy reactivo
 */
export function createDeepProxy(target, path = '', onSet, proxyMap = new WeakMap()) {
  if (proxyMap.has(target)) {
    return proxyMap.get(target)
  }

  const proxy = new Proxy(target, {
    get(obj, prop) {
      if (typeof prop === 'symbol' || prop === 'toJSON') return obj[prop]
      const val = obj[prop]
      if (
        val !== null &&
        typeof val === 'object' &&
        !(val instanceof Date) &&
        (typeof File === 'undefined' || !(val instanceof File)) &&
        (typeof Blob === 'undefined' || !(val instanceof Blob))
      ) {
        const subPath = path ? `${path}.${String(prop)}` : String(prop)
        return createDeepProxy(val, subPath, onSet, proxyMap)
      }
      return val
    },
    set(obj, prop, value) {
      obj[prop] = value
      const fullProp = path ? `${path}.${String(prop)}` : String(prop)
      onSet(fullProp, value)
      return true
    }
  })

  proxyMap.set(target, proxy)
  return proxy
}

export function createValidator(initialData = {}, schema = {}, options = {}) {
  const { live = true } = options

  // Snapshot inmutable de los datos iniciales para que reset()
  // no se contamine si el consumidor muta initialData externamente.
  const defaultValues = cloneDeepSafe(initialData)

  // Estado central en JavaScript plano con clonación profunda segura
  const state = {
    values: cloneDeepSafe(defaultValues),
    errors: {},
    touched: {},
    validating: {}, // Control de qué campos están ejecutando validación asíncrona (backend)
    isValid: true,
    isDirty: false
  }

  // Tokens para prevenir condiciones de carrera en peticiones asíncronas
  const fieldTokens = {}

  // Pre-compilación del esquema: separa reglas de validación de transformadores una sola vez.
  // Evita re-filtrar arrays en cada pulsación de tecla y en cada llamada a getPayload().
  const compiledRules = {}
  const compiledTransformers = {}
  const dependencyMap = {}
  const dynamicDepFields = new Set()

  for (const field in schema) {
    const list = Array.isArray(schema[field]) ? schema[field] : [schema[field]]
    compiledRules[field] = []
    compiledTransformers[field] = []

    for (const item of list) {
      if (!item) continue
      if (item.isTransform && typeof item.fn === 'function') {
        compiledTransformers[field].push(item.fn)
      } else if (typeof item === 'function') {
        compiledRules[field].push(item)
        if (typeof item.dependsOn === 'string') {
          if (!dependencyMap[item.dependsOn]) {
            dependencyMap[item.dependsOn] = new Set()
          }
          dependencyMap[item.dependsOn].add(field)
        } else if (item.hasDynamicDeps) {
          dynamicDepFields.add(field)
        }
      }
    }

    state.errors[field] = null
    state.touched[field] = false
    state.validating[field] = false
    fieldTokens[field] = 0
  }

  const subscribers = new Set()

  const notify = () => {
    subscribers.forEach(cb => {
      try {
        cb(state)
      } catch (err) {
        console.error('[Validator Error]', err)
      }
    })
  }

  /**
   * Recalcula si todo el formulario es válido (sin errores pendientes ni validaciones activas).
   */
  const checkGlobalValidity = () => {
    const noErrors = Object.values(state.errors).every(err => err === null)
    const notPending = Object.values(state.validating).every(v => v === false)
    state.isValid = noErrors && notPending
    return state.isValid
  }

  /**
   * Valida un campo específico. Soporta reglas síncronas y asíncronas, y dot notation ('apoderado.nroDoc').
   */
  const validateField = async (field) => {
    const rules = compiledRules[field] || []
    const val = getNestedValue(state.values, field)
    const currentToken = ++fieldTokens[field]

    for (const rule of rules) {
      try {
        const result = rule(val, state.values)

        // Caso A: Regla Asíncrona (Promesa / async)
        if (result instanceof Promise || (result && typeof result.then === 'function')) {
          state.validating[field] = true
          notify()

          const asyncRes = await result

          // Verificar si el usuario ya escribió algo nuevo mientras esperaba
          if (currentToken !== fieldTokens[field]) {
            return false
          }

          if (asyncRes !== true) {
            state.errors[field] = typeof asyncRes === 'string' ? asyncRes : 'Valor no válido'
            state.validating[field] = false
            checkGlobalValidity()
            notify()
            return false
          }
        }
        // Caso B: Regla Síncrona inmediata
        else if (result !== true) {
          state.errors[field] = typeof result === 'string' ? result : 'Valor no válido'
          state.validating[field] = false
          checkGlobalValidity()
          notify()
          return false
        }
      } catch (err) {
        if (currentToken === fieldTokens[field]) {
          state.errors[field] = err.message || 'Error durante la validación'
          state.validating[field] = false
          checkGlobalValidity()
          notify()
          return false
        }
      }
    }

    // Si pasó todas las reglas y sigue siendo la versión más reciente
    if (currentToken === fieldTokens[field]) {
      state.errors[field] = null
      state.validating[field] = false
      checkGlobalValidity()
      notify()
      return true
    }

    return false
  }

  /**
   * Acción de desenfoque (blur):
   * Enciende el error SOLO de este campo si estuviera inválido.
   */
  const touch = (field) => {
    if (!(field in schema)) return
    state.touched[field] = true
    validateField(field)
    notify()
  }

  /**
   * Desactiva el indicador de error de un campo.
   */
  const untouch = (field) => {
    if (!(field in schema)) return
    state.touched[field] = false
    notify()
  }

  /**
   * Acción de envío (submit):
   * Enciende TODOS los campos del formulario y espera que terminen todas las validaciones (síncronas y asíncronas).
   * @returns {Promise<boolean>} true si todo el formulario es válido
   */
  const validate = async () => {
    for (const field in schema) {
      state.touched[field] = true
    }
    notify()

    // Ejecuta la validación de todos los campos en paralelo
    const validations = Object.keys(schema).map(field => validateField(field))
    await Promise.all(validations)

    checkGlobalValidity()
    notify()
    return state.isValid
  }

  /**
   * Restaura el formulario a su estado original o a nuevos valores iniciales.
   */
  const reset = (newValues = defaultValues) => {
    for (const key in state.values) {
      delete state.values[key]
    }
    Object.assign(state.values, cloneDeepSafe(newValues))
    state.isDirty = false

    for (const field in schema) {
      state.errors[field] = null
      state.touched[field] = false
      state.validating[field] = false
      ++fieldTokens[field]
    }

    // Validación silenciosa inicial
    for (const field in schema) {
      validateField(field)
    }

    notify()
  }

  /**
   * Actualiza varios campos a la vez sin perder reactividad (soporta dot notation).
   */
  const setValues = (patch = {}) => {
    for (const key in patch) {
      setNestedValue(state.values, key, patch[key])
      if (live) validateField(key)
    }
    state.isDirty = true
    notify()
  }

  // Proxy recursivo profundo que intercepta asignaciones en tiempo real: v.values.apoderado.nroDoc = '...'
  const valuesProxy = createDeepProxy(state.values, '', (prop) => {
    state.isDirty = true

    if (live) {
      // 1. Valida el campo modificado en vivo
      validateField(prop)

      // Si prop es una ruta anidada (ej: 'familiares.0.nombres'), revalida ancestros presentes en schema
      if (prop.includes('.')) {
        let parent = prop
        while (parent.includes('.')) {
          parent = parent.substring(0, parent.lastIndexOf('.'))
          if (parent in schema) {
            validateField(parent)
          }
        }
      }

      // 2. Revalida en O(1) solo los campos que explícitamente dependen de este campo
      const deps = dependencyMap[prop]
      if (deps) {
        for (const depField of deps) {
          if (state.touched[depField]) {
            validateField(depField)
          }
        }
      }

      // 3. Revalida campos con dependencias dinámicas (si los hubiera)
      if (dynamicDepFields.size > 0) {
        for (const dynField of dynamicDepFields) {
          if (dynField !== prop && state.touched[dynField]) {
            validateField(dynField)
          }
        }
      }
    }
  })

  // Validación silenciosa de inicio para saber si isValid inicialmente
  for (const field in schema) {
    validateField(field)
  }

  /**
   * Retorna una copia limpia y sanitizada de los valores aplicando los transformadores
   * pre-compilados del esquema (o una función transformadora personalizada opcional).
   * Mantiene v.values intacto para que la interfaz de usuario no sufra parpadeos ni saltos de cursor.
   * Soporta objetos anidados transparentemente.
   * @param {Function} [customTransformFn] Función opcional para post-procesar el payload completo
   * @returns {Object} Payload limpio y tipado para enviar al backend/API
   */
  const getPayload = (customTransformFn = null) => {
    const payload = cloneDeepSafe(state.values)

    for (const field in compiledTransformers) {
      const transformers = compiledTransformers[field]
      if (transformers.length > 0) {
        let currentVal = getNestedValue(payload, field)
        for (const fn of transformers) {
          currentVal = fn(currentVal, payload)
        }
        setNestedValue(payload, field, currentVal)
      }
    }

    if (typeof customTransformFn === 'function') {
      return customTransformFn(payload)
    }

    return payload
  }

  return {
    values: valuesProxy,
    state,
    touch,
    untouch,
    validate,
    validateField,
    reset,
    setValues,
    getPayload,
    getTransformed: getPayload,

    /**
     * Helper: ¿Debe mostrarse error en este campo?
     * Solo true si ya fue tocado (desenfocado o tras submit) y tiene error.
     */
    hasError: (field) => Boolean(state.touched[field] && state.errors[field]),

    /**
     * Helper: Retorna el mensaje de error si fue tocado, de lo contrario null.
     */
    getError: (field) => (state.touched[field] ? state.errors[field] : null),

    /**
     * Helper: ¿El campo (o todo el formulario) está consultando al backend?
     * Ideal para pasar a :loading="v.isValidating('dni')" en Quasar.
     */
    isValidating: (field) => {
      if (field) return Boolean(state.validating[field])
      return Object.values(state.validating).some(Boolean)
    },

    /**
     * Suscripción agnóstica para cualquier vista/framework.
     */
    subscribe(callback) {
      subscribers.add(callback)
      callback(state)
      return () => subscribers.delete(callback)
    }
  }
}
