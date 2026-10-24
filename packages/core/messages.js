/**
 * @file messages.js
 * @description Centralized catalog of validation error messages with i18n support.
 * Architecture: Clean Code & SOLID:
 * - Single Responsibility Principle (SRP): Pure management of text and localization.
 * - Extensible: Allows global message customization or locale switching (en/es).
 */

export const enMessages = {
  // 1. Presence and conditionals
  required: 'This field is required',

  // 2. Primitive data types
  isString: 'Must be a string',
  isNumber: 'Must be a valid number',
  isBoolean: 'Must be a boolean value',
  isArray: 'Must be an array',
  isObject: 'Must be a valid object',
  isFile: 'Must be a valid file',

  // 3. String length and characters
  minLength: (min) => `Minimum ${min} characters`,
  maxLength: (max) => `Maximum ${max} characters`,
  betweenLength: (min, max) => `Must be between ${min} and ${max} characters`,

  // 4. Numbers and ranges
  numeric: 'Must be a number',
  integer: 'Must be an integer',
  minValue: (min) => `Minimum value is ${min}`,
  maxValue: (max) => `Maximum value is ${max}`,
  between: (min, max) => `Value must be between ${min} and ${max}`,

  // 5. Dates and times
  date: 'Invalid calendar date',
  afterDate: 'Date must be after',
  beforeDate: 'Date must be before',
  invalidDate: 'Invalid date',
  invalidBirthDate: 'Invalid date of birth',
  minAge: (years) => `Must be at least ${years} years old`,
  maxAge: (years) => `Must be at most ${years} years old`,
  betweenAge: (min, max) => `Age must be between ${min} and ${max} years`,
  time: 'Invalid time format (HH:mm or HH:mm:ss)',

  // 6. Contact, communication, documents
  email: 'Invalid email address',
  mobile: 'Invalid mobile phone number',
  phone: 'Invalid phone number',
  url: 'Invalid URL',
  alpha: 'Only letters are allowed',
  alphaNum: 'Only letters and numbers are allowed',
  dni: 'DNI must have 8 numeric digits',
  ruc: 'RUC must have 11 numeric digits',
  cci: 'CCI must have exactly 20 numeric digits',

  // 7. Arrays and collections
  minItems: (min) => `Select at least ${min} option(s)`,
  maxItems: (max) => `Select at most ${max} option(s)`,
  oneOf: 'Option not allowed',
  each: (index, err) => `Item ${index + 1}: ${err}`,

  // 8. Files and attachments
  fileMaxSize: (maxMB) => `File must not exceed ${maxMB} MB`,
  fileTypes: 'File type not allowed',

  // 9. Security and cross validation
  sameAs: 'Fields do not match',
  greaterThan: (field) => `Must be greater than ${field}`,
  greaterThanOrEqual: (field) => `Must be greater than or equal to ${field}`,
  lessThan: (field) => `Must be less than ${field}`,
  lessThanOrEqual: (field) => `Must be less than or equal to ${field}`,
  strongPassword: 'Minimum 8 characters, with uppercase, lowercase, number, and symbol',
  pattern: 'Invalid format',
  custom: 'Invalid value'
}

export const esMessages = {
  // 1. Presencia y condicionales
  required: 'Este campo es obligatorio',

  // 2. Tipos de datos primitivos
  isString: 'Debe ser un texto',
  isNumber: 'Debe ser un número válido',
  isBoolean: 'Debe ser un valor booleano',
  isArray: 'Debe ser una lista',
  isObject: 'Debe ser un objeto válido',
  isFile: 'Debe seleccionar un archivo válido',

  // 3. Longitud de texto y caracteres
  minLength: (min) => `Mínimo ${min} caracteres`,
  maxLength: (max) => `Máximo ${max} caracteres`,
  betweenLength: (min, max) => `Debe tener entre ${min} y ${max} caracteres`,

  // 4. Números y rangos
  numeric: 'Debe ser un número',
  integer: 'Debe ser un número entero',
  minValue: (min) => `El valor mínimo es ${min}`,
  maxValue: (max) => `El valor máximo es ${max}`,
  between: (min, max) => `El valor debe estar entre ${min} y ${max}`,

  // 5. Fechas y horas
  date: 'Fecha no válida en el calendario',
  afterDate: 'La fecha debe ser posterior',
  beforeDate: 'La fecha debe ser anterior',
  invalidDate: 'Fecha no válida',
  invalidBirthDate: 'Fecha de nacimiento no válida',
  minAge: (years) => `Debe tener al menos ${years} años`,
  maxAge: (years) => `Debe tener como máximo ${years} años`,
  betweenAge: (min, max) => `La edad debe estar entre ${min} y ${max} años`,
  time: 'Formato de hora inválido (HH:mm o HH:mm:ss)',

  // 6. Contacto, comunicación y documentos
  email: 'Correo electrónico no válido',
  mobile: 'Número de celular inválido (9 dígitos iniciando en 9)',
  phone: 'Número de teléfono inválido',
  url: 'URL no válida',
  alpha: 'Solo se permiten letras',
  alphaNum: 'Solo se permiten letras y números',
  dni: 'El DNI debe tener 8 dígitos numéricos',
  ruc: 'El RUC debe tener 11 dígitos numéricos',
  cci: 'El CCI debe tener exactamente 20 dígitos numéricos',

  // 7. Arrays y selección múltiple
  minItems: (min) => `Seleccione al menos ${min} opción(es)`,
  maxItems: (max) => `Seleccione máximo ${max} opción(es)`,
  oneOf: 'Opción no permitida',
  each: (index, err) => `Error en elemento ${index + 1}: ${err}`,

  // 8. Archivos y adjuntos
  fileMaxSize: (maxMB) => `El archivo no debe superar ${maxMB} MB`,
  fileTypes: 'Tipo de archivo no permitido',

  // 9. Seguridad y validaciones cruzadas
  sameAs: 'Los campos no coinciden',
  greaterThan: (field) => `Debe ser mayor que ${field}`,
  greaterThanOrEqual: (field) => `Debe ser mayor o igual que ${field}`,
  lessThan: (field) => `Debe ser menor que ${field}`,
  lessThanOrEqual: (field) => `Debe ser menor o igual que ${field}`,
  strongPassword: 'Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
  pattern: 'Formato inválido',
  custom: 'Valor no válido'
}

// Aliases cortos para importación rápida
export const en = enMessages
export const es = esMessages

// Idioma por defecto: Inglés
export const defaultMessages = { ...enMessages }

/**
 * Permite personalizar o traducir los mensajes por defecto de toda la aplicación.
 * @param {Object} customMessages - Diccionario parcial de mensajes a sobreescribir
 */
export function configureMessages(customMessages = {}) {
  Object.assign(defaultMessages, customMessages)
}

/**
 * Cambia el idioma activo de las validaciones ('en' | 'es').
 * @param {'en' | 'es'} locale - Idioma deseado
 */
export function setLocale(locale = 'en') {
  if (locale === 'es') {
    Object.assign(defaultMessages, esMessages)
  } else {
    Object.assign(defaultMessages, enMessages)
  }
}
