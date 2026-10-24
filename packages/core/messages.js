/**
 * @file messages.js
 * @description Catálogo centralizado de mensajes de validación por defecto.
 * Arquitectura Clean Code & SOLID:
 * - Single Responsibility Principle (SRP): Gestión exclusiva de textos y redacción.
 * - Cero Hardcodeo: Separa la semántica humana de los algoritmos de validación.
 * - Extensible: Permite modificar o configurar mensajes globalmente.
 */

export const defaultMessages = {
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

  // 7. Arrays y selección múltiple
  minItems: (min) => `Seleccione al menos ${min} opción(es)`,
  maxItems: (max) => `Seleccione máximo ${max} opción(es)`,
  oneOf: 'Opción no permitida',

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
  custom: 'Valor no válido',

  // 10. Bancarios y edad extendida
  cci: 'El CCI debe tener exactamente 20 dígitos numéricos',
  maxAge: (years) => `Debe tener como máximo ${years} años`,
  betweenAge: (min, max) => `La edad debe estar entre ${min} y ${max} años`,
  each: (index, err) => `Error en elemento ${index + 1}: ${err}`
}

/**
 * Permite personalizar o traducir los mensajes por defecto de toda la aplicación.
 * @param {Object} customMessages - Diccionario parcial de mensajes a sobreescribir
 */
export function configureMessages(customMessages = {}) {
  Object.assign(defaultMessages, customMessages)
}
