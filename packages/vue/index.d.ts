import type {
  ValidationSchema,
  ValidatorOptions,
  ValidatorInstance
} from 'arv-validate'

/** Instancia del validador adaptada para Vue 3 */
export interface VueValidatorInstance {
  /** Proxy reactivo para leer/escribir valores */
  values: Record<string, any>
  /** Marca un campo como tocado y lo valida */
  touch(field: string): void
  /** Desmarca un campo como tocado */
  untouch(field: string): void
  /** Valida todos los campos del formulario */
  validate(): Promise<boolean>
  /** Valida un campo específico */
  validateField(field: string): Promise<boolean>
  /** Restaura al estado inicial o a nuevos valores */
  reset(newValues?: Record<string, any>): void
  /** Actualiza múltiples campos a la vez */
  setValues(patch: Record<string, any>): void
  /** Devuelve copia sanitizada con transformadores aplicados */
  getPayload<T = Record<string, any>>(customTransformFn?: (payload: Record<string, any>) => T): T
  /** Alias de getPayload */
  getTransformed<T = Record<string, any>>(customTransformFn?: (payload: Record<string, any>) => T): T
  /** true si el campo fue tocado y tiene error */
  hasError(field: string): boolean
  /** Mensaje de error si fue tocado, null si no */
  getError(field: string): string | null
  /** true si hay validación async en curso */
  isValidating(field?: string): boolean
  /** Objeto reactivo de errores por campo */
  errors: Record<string, string | null>
  /** Objeto reactivo de campos tocados */
  touched: Record<string, boolean>
  /** Objeto reactivo de campos en validación async */
  validating: Record<string, boolean>
  /** true si todo el formulario es válido (reactivo en templates y watch) */
  readonly isValid: boolean
  /** true si algún valor fue modificado (reactivo en templates y watch) */
  readonly isDirty: boolean
  /** Estado reactivo completo */
  state: {
    errors: Record<string, string | null>
    touched: Record<string, boolean>
    validating: Record<string, boolean>
    isValid: boolean
    isDirty: boolean
  }
  /** Cancela la suscripción reactiva al validador (útil si se usa fuera de setup) */
  dispose(): void
  /** Acceso al validador agnóstico original */
  core: ValidatorInstance
}

/** Composable de validación para Vue 3 / Quasar */
export function useValidator(
  initialData?: Record<string, any>,
  schema?: ValidationSchema,
  options?: ValidatorOptions
): VueValidatorInstance

// Re-exportar todo el core
export * from 'arv-validate'
