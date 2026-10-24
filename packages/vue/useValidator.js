/**
 * @file useValidator.js
 * @description Adaptador reactivo para Vue 3 / Quasar con soporte síncrono y asíncrono.
 * Envuelve el validador agnóstico para que se sincronice automáticamente con el motor de Vue.
 */

import { reactive, onUnmounted, getCurrentInstance } from 'vue'
import { createValidator, cloneDeepSafe, setNestedValue } from 'arv-validate'

export function useValidator(initialData = {}, schema = {}, options = {}) {
  const defaultValues = cloneDeepSafe(initialData)
  const v = createValidator(defaultValues, schema, options)

  // Proxy reactivo nativo de Vue sobre los valores del formulario
  const reactiveValues = reactive(v.values)

  // Reactividad nativa de Vue para reflejar cambios en la UI
  const vState = reactive({
    errors: { ...v.state.errors },
    touched: { ...v.state.touched },
    validating: { ...v.state.validating },
    isValid: v.state.isValid,
    isDirty: v.state.isDirty
  })

  // Sincronizar automáticamente el validador puro con el estado reactivo de Vue
  const unsubscribe = v.subscribe((newState) => {
    Object.assign(vState.errors, newState.errors)
    Object.assign(vState.touched, newState.touched)
    Object.assign(vState.validating, newState.validating)
    vState.isValid = newState.isValid
    vState.isDirty = newState.isDirty
  })

  // Limpiar suscripción cuando se destruya el componente Vue (solo si está dentro de setup)
  if (getCurrentInstance()) {
    onUnmounted(() => {
      try {
        unsubscribe()
      } catch (e) {
        // Ignorar si falla la desuscripción
      }
    })
  }

  // Restaura el formulario a su estado original o a nuevos valores, notificando a Vue
  const reset = (newValues) => {
    const target = newValues || defaultValues
    for (const key in reactiveValues) {
      if (!(key in target)) {
        delete reactiveValues[key]
      }
    }
    for (const key in target) {
      setNestedValue(reactiveValues, key, cloneDeepSafe(target[key]))
    }
    v.reset(target)
  }

  // Actualiza varios campos a la vez asegurando reactividad en Vue
  const setValues = (patch = {}) => {
    for (const key in patch) {
      setNestedValue(reactiveValues, key, patch[key])
    }
  }

  return {
    values: reactiveValues,
    touch: v.touch,
    untouch: v.untouch,
    validate: v.validate, // Retorna una Promesa: await v.validate()
    validateField: v.validateField,
    reset,
    setValues,
    getPayload: v.getPayload,
    getTransformed: v.getPayload,

    // Helpers reactivos para la UI
    hasError: (field) => Boolean(vState.touched[field] && vState.errors[field]),
    getError: (field) => (vState.touched[field] ? vState.errors[field] : null),
    isValidating: (field) => {
      if (field) return Boolean(vState.validating[field])
      return Object.values(vState.validating).some(Boolean)
    },

    // Estado reactivo directo
    errors: vState.errors,
    touched: vState.touched,
    validating: vState.validating,
    get isValid() {
      return vState.isValid
    },
    get isDirty() {
      return vState.isDirty
    },
    state: vState,

    // Limpieza manual de la suscripción (útil fuera de setup, ej: Pinia)
    dispose: unsubscribe,

    // Acceso al validador agnóstico original
    core: v
  }
}
