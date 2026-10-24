// ============================================================================
// Tipos del motor de validación arv-validate
// ============================================================================

/** Resultado de una regla: true si pasa, string con mensaje de error si falla */
export type ValidationResult = true | string

/** Función de regla de validación */
export type ValidationRule = {
  (value: any, allValues?: Record<string, any>): ValidationResult | Promise<ValidationResult>
  dependsOn?: string
  hasDynamicDeps?: boolean
}

/** Objeto transformador */
export interface TransformDescriptor {
  isTransform: true
  fn: (value: any, allValues?: Record<string, any>) => any
}

/** Esquema de validación: campo → reglas y/o transformadores */
export type ValidationSchema = Record<string, (ValidationRule | TransformDescriptor)[]>

/** Estado interno del validador */
export interface ValidatorState {
  values: Record<string, any>
  errors: Record<string, string | null>
  touched: Record<string, boolean>
  validating: Record<string, boolean>
  isValid: boolean
  isDirty: boolean
}

/** Opciones del validador */
export interface ValidatorOptions {
  /** Habilitar validación en vivo con Proxies (default: true) */
  live?: boolean
}

/** Instancia del validador */
export interface ValidatorInstance {
  /** Proxy reactivo para leer/escribir valores */
  values: Record<string, any>
  /** Estado interno (errors, touched, validating, isValid, isDirty) */
  state: ValidatorState
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
  /** true si hay validación async en curso (campo específico o global) */
  isValidating(field?: string): boolean
  /** Suscripción a cambios de estado */
  subscribe(callback: (state: ValidatorState) => void): () => void
}

// ============================================================================
// core.js — Motor principal
// ============================================================================

/** Obtiene valor de propiedad anidada con dot notation */
export function getNestedValue(obj: Record<string, any>, path: string): any

/** Establece valor de propiedad anidada con dot notation */
export function setNestedValue(obj: Record<string, any>, path: string, value: any): void

/** Clonado profundo seguro (preserva Date, File, Blob) */
export function cloneDeepSafe<T>(val: T): T

/** Crea un Proxy recursivo profundo para interceptar cambios */
export function createDeepProxy(
  target: Record<string, any>,
  path: string,
  onSet: (fullPath: string, value: any) => void,
  proxyMap?: WeakMap<object, any>
): Record<string, any>

/** Crea una instancia del validador */
export function createValidator(
  initialData?: Record<string, any>,
  schema?: ValidationSchema,
  options?: ValidatorOptions
): ValidatorInstance

// ============================================================================
// rules.js — Reglas de validación
// ============================================================================

/** Verifica si un valor está ausente o en blanco */
export function isBlank(val: any): boolean

// Obligatoriedad y condicionales
export function required(msg?: string): ValidationRule
export function when(
  conditionFnOrField: string | ((allValues: Record<string, any>) => boolean),
  rules?: ValidationRule | ValidationRule[]
): ValidationRule

// Tipos de datos
export function isString(msg?: string): ValidationRule
export function isNumber(msg?: string): ValidationRule
export function isBoolean(msg?: string): ValidationRule
export function isArray(msg?: string): ValidationRule
export function isObject(msg?: string): ValidationRule
export function isFile(msg?: string): ValidationRule

// Longitud de texto
export function minLength(min: number, msg?: string): ValidationRule
export function maxLength(max: number, msg?: string): ValidationRule
export function betweenLength(min: number, max: number, msg?: string): ValidationRule

// Números y rangos
export function numeric(msg?: string): ValidationRule
export function integer(msg?: string): ValidationRule
export function minValue(min: number, msg?: string): ValidationRule
export function maxValue(max: number, msg?: string): ValidationRule
export function between(min: number, max: number, msg?: string): ValidationRule
export function greaterThan(targetField: string | number, msg?: string): ValidationRule
export function greaterThanOrEqual(targetField: string | number, msg?: string): ValidationRule
export function lessThan(targetField: string | number, msg?: string): ValidationRule
export function lessThanOrEqual(targetField: string | number, msg?: string): ValidationRule

// Fechas y horas
export function date(msg?: string): ValidationRule
export function afterDate(targetFieldOrDate: string | ((allValues: Record<string, any>) => any), msg?: string): ValidationRule
export function beforeDate(targetFieldOrDate: string | ((allValues: Record<string, any>) => any), msg?: string): ValidationRule
export function minAge(years: number, msg?: string): ValidationRule
export function maxAge(years: number, msg?: string): ValidationRule
export function betweenAge(minYears: number, maxYears: number, msg?: string): ValidationRule
export function time(msg?: string): ValidationRule

// Contacto y documentos
export function email(msg?: string): ValidationRule
export function mobile(msg?: string): ValidationRule
export function phone(msg?: string): ValidationRule
export function url(msg?: string): ValidationRule
export function alpha(msg?: string): ValidationRule
export function alphaNum(msg?: string): ValidationRule
export function dni(msg?: string): ValidationRule
export function ruc(msg?: string): ValidationRule
export function cci(msg?: string): ValidationRule

// Arrays y selección múltiple
export function minItems(min: number, msg?: string): ValidationRule
export function maxItems(max: number, msg?: string): ValidationRule
export function oneOf(allowedList: any[], msg?: string): ValidationRule
export function each(
  schemaOrRules: Record<string, ValidationRule | ValidationRule[]> | ValidationRule | ValidationRule[],
  msg?: string
): ValidationRule

// Archivos
export function fileMaxSize(maxMB: number, msg?: string): ValidationRule
export function fileTypes(allowedExts: string[], msg?: string): ValidationRule

// Seguridad y validaciones cruzadas
export function sameAs(
  targetFieldOrGetter: string | ((allValues: Record<string, any>) => any),
  msg?: string
): ValidationRule
export function strongPassword(msg?: string): ValidationRule
export function pattern(regex: RegExp, msg?: string): ValidationRule
export function custom(
  fn: (value: any, allValues?: Record<string, any>) => ValidationResult | Promise<ValidationResult>,
  msg?: string
): ValidationRule

// Transformadores
export const DEFAULT_TIMEZONE: string

export function transform(fn: (value: any, allValues?: Record<string, any>) => any): TransformDescriptor
export function trim(): TransformDescriptor
export function toLowerCase(): TransformDescriptor
export function toUpperCase(): TransformDescriptor
export function toFloat(): TransformDescriptor
export function round(decimals?: number): TransformDescriptor
export function truncate(decimals?: number): TransformDescriptor
export function toInteger(): TransformDescriptor
export function digitsOnly(): TransformDescriptor
export function toBooleanFlag(): TransformDescriptor
export function toDate(timeZone?: string): TransformDescriptor
export function toDateTime(timeZone?: string): TransformDescriptor
export function toISOString(): TransformDescriptor

// ============================================================================
// messages.js — Mensajes por defecto
// ============================================================================

export interface DefaultMessages {
  required: string
  isString: string
  isNumber: string
  isBoolean: string
  isArray: string
  isObject: string
  isFile: string
  minLength: (min: number) => string
  maxLength: (max: number) => string
  betweenLength: (min: number, max: number) => string
  numeric: string
  integer: string
  minValue: (min: number) => string
  maxValue: (max: number) => string
  between: (min: number, max: number) => string
  date: string
  afterDate: string
  beforeDate: string
  invalidDate: string
  invalidBirthDate: string
  minAge: (years: number) => string
  time: string
  email: string
  mobile: string
  phone: string
  url: string
  alpha: string
  alphaNum: string
  dni: string
  ruc: string
  minItems: (min: number) => string
  maxItems: (max: number) => string
  oneOf: string
  fileMaxSize: (maxMB: number) => string
  fileTypes: string
  sameAs: string
  greaterThan: (field: string) => string
  greaterThanOrEqual: (field: string) => string
  lessThan: (field: string) => string
  lessThanOrEqual: (field: string) => string
  strongPassword: string
  pattern: string
  custom: string
  cci: string
  maxAge: (years: number) => string
  betweenAge: (min: number, max: number) => string
  each: (index: number, err: string) => string
  [key: string]: string | ((...args: any[]) => string)
}

export const defaultMessages: DefaultMessages

/** Personalizar o traducir los mensajes por defecto */
export function configureMessages(customMessages: Partial<DefaultMessages>): void
