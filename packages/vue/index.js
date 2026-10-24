/**
 * @file index.js
 * @description Punto de entrada para arv-validate-vue.
 * Re-exporta el composable y todo el core para conveniencia.
 */

export { useValidator } from './useValidator.js'

// Re-exportar todo el core para que el usuario no necesite instalar arv-validate aparte
// cuando solo usa Vue. Ejemplo: import { useValidator, required, email } from 'arv-validate-vue'
export * from 'arv-validate'
