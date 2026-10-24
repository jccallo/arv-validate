# Documentación Completa — arv-validate

> Motor de validación y sanitización de formularios reactivo, atómico y de alto rendimiento.  
> Diseñado bajo principios **Clean Code**, **SOLID (SRP)** y arquitectura **100% agnóstica**, con adaptadores oficiales para los frameworks modernos.

[English](./DOCUMENTATION.md) | [Español](./DOCUMENTACION.md)

---

## 📑 Tabla de Contenidos

1. [Visión General y Filosofía](#1-visión-general-y-filosofía)
2. [Instalación](#2-instalación)
3. [Ecosistema y Frameworks](#3-ecosistema-y-frameworks)
4. [Conceptos Clave de Arquitectura](#4-conceptos-clave-de-arquitectura)
5. [Ejemplos Prácticos de Uso](#5-ejemplos-prácticos-de-uso)
   - [Ejemplo 1: Formulario Básico Síncrono](#ejemplo-1-formulario-básico-síncrono)
   - [Ejemplo 2: Objetos Anidados y Dot Notation](#ejemplo-2-objetos-anidados-y-dot-notation)
   - [Ejemplo 3: Validación Condicional con `when`](#ejemplo-3-validación-condicional-con-when)
   - [Ejemplo 4: Validación Asíncrona (Consultas a API Backend)](#ejemplo-4-validación-asíncrona-consultas-a-api-backend)
   - [Ejemplo 5: Arrays y Tablas Dinámicas con `each`](#ejemplo-5-arrays-y-tablas-dinámicas-con-each)
   - [Ejemplo 6: Validaciones Cruzadas entre Campos (`sameAs`, `greaterThan`)](#ejemplo-6-validaciones-cruzadas-entre-campos-sameas-greaterthan)
   - [Ejemplo 7: Fechas, Horas y Límites de Edad](#ejemplo-7-fechas-horas-y-límites-de-edad)
   - [Ejemplo 8: Transformación y Sanitización para la API (`getPayload`)](#ejemplo-8-transformación-y-sanitización-para-la-api-getpayload)
   - [Ejemplo 9: Creación de Reglas Personalizadas](#ejemplo-9-creación-de-reglas-personalizadas)
   - [Ejemplo 10: Mensajes de Error Globales y Localización](#ejemplo-10-mensajes-de-error-globales-y-localización)
   - [Ejemplo 11: Validación Manual bajo Demanda (`live: false`)](#ejemplo-11-validación-manual-bajo-demanda-live-false)
   - [Ejemplo 12: Suscripciones y Reactividad Personalizada](#ejemplo-12-suscripciones-y-reactividad-personalizada)
6. [Referencia de la API del Validador](#6-referencia-de-la-api-del-validador)
7. [Catálogo de Reglas y Transformadores](#7-catálogo-de-reglas-y-transformadores)

---

## 1. Visión General y Filosofía

`arv-validate` resuelve los problemas habituales de validación en aplicaciones modernas:
* **Desacoplamiento Real**: El motor central no depende de la UI, del navegador ni de librerías externas. Puede ejecutarse en Node.js, Bun, workers, navegadores y cualquier framework.
* **Principio de Responsabilidad Única (SRP)**: Cada regla evalúa una sola condición (ej: `required` solo valida presencia, `email` solo valida formato, `isNumber` solo valida tipo numérico). Las reglas se componen en arrays legibles.
* **Separación entre Estado Visual y Payload**: La interfaz de usuario muestra exactamente lo que el usuario escribe sin saltos de cursor ni parpadeos, mientras que `getPayload()` entrega datos limpios, parseados y listos para enviar a la base de datos o API.
* **Rendimiento O(1)**: Pre-compilación del esquema en la inicialización y mapa de dependencias indexado para revalidar en tiempo real solo los campos necesarios.
* **Seguridad contra Condiciones de Carrera**: Sistema interno de tokens incrementales que cancela respuestas asíncronas lentas si el usuario continuó escribiendo.

---

## 2. Instalación

### Motor Agnóstico (Core)
```bash
npm install arv-validate
```

### Para proyectos Vue 3
```bash
npm install arv-validate-vue
```

---

## 3. Ecosistema y Frameworks

`arv-validate` ofrece integración especializada para frameworks modernos mediante paquetes dedicados:

| Framework | Paquete | Documentación | Estado |
|---|---|---|---|
| **Vue 3** | `arv-validate-vue` | 👉 **[Guía Completa para Vue 3 con Ejemplos](./VUE.md)** | ✅ Disponible y Estable |
| **React** | `@arv-validate/react` | *En desarrollo — enlace próximamente* | 🚧 Próximamente |
| **Angular** | `@arv-validate/angular` | *En desarrollo — enlace próximamente* | 🚧 Próximamente |

---

## 4. Conceptos Clave de Arquitectura

```
                        ┌─────────────────────────────────────┐
                        │      createValidator(data, schema)  │
                        └──────────────────┬──────────────────┘
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             ▼                             ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
   │    v.values       │         │     v.state       │         │   v.getPayload()  │
   │  Proxy reactivo   │         │ Estado de control │         │ Payload limpio y  │
   │  escritura en vivo│         │ errors, touched,  │         │ tipado para Axios/│
   │  y dot-notation   │         │ validating, isValid│        │ Fetch (API)       │
   └───────────────────┘         └───────────────────┘         └───────────────────┘
```

1. **`values`**: Proxy recursivo profundo. Cualquier modificación directa (`v.values.nombre = 'Ana'`) revalida el campo en tiempo real, marca `isDirty = true` y notifica a los suscriptores.
2. **`touched`**: Rastrea qué campos han sido visitados por el usuario (`blur` o submit).
3. **`hasError(campo)`**: Solo retorna `true` si el campo está en error **y** fue tocado. Evita mostrar errores rojos antes de que el usuario empiece a interactuar.
4. **`getError(campo)`**: Retorna el mensaje de error correspondiente si fue tocado, o `null`.
5. **`isValid`**: Booleano instantáneo. `true` cuando no existen errores pendientes ni validaciones asíncronas en curso.
6. **`getPayload()`**: Retorna una copia limpia aplicando todos los transformadores (`trim`, `toLowerCase`, `toFloat`, etc.).

---

## 5. Ejemplos Prácticos de Uso

### Ejemplo 1: Formulario Básico Síncrono

```javascript
import { createValidator, required, email, minLength, trim } from 'arv-validate'

const validador = createValidator(
  {
    nombre: '',
    correo: ''
  },
  {
    nombre: [required('El nombre es obligatorio'), minLength(3, 'Mínimo 3 caracteres'), trim()],
    correo: [required('El correo es obligatorio'), email('Correo inválido'), trim()]
  }
)

// 1. Estado inicial
console.log(validador.state.isValid) // false
console.log(validador.hasError('nombre')) // false (aún no fue tocado)

// 2. Simular desenfoque (blur) con campo vacío
validador.touch('nombre')
console.log(validador.hasError('nombre')) // true
console.log(validador.getError('nombre')) // "El nombre es obligatorio"

// 3. Escribir valor válido
validador.values.nombre = 'Carlos'
validador.values.correo = 'carlos@empresa.com'

// 4. Validar formulario completo al enviar
const esValido = await validador.validate()
console.log(esValido) // true
console.log(validador.getPayload()) // { nombre: "Carlos", correo: "carlos@empresa.com" }
```

---

### Ejemplo 2: Objetos Anidados y Dot Notation

Soporta rutas separadas por puntos de cualquier nivel de profundidad:

```javascript
import { createValidator, required, email, minLength } from 'arv-validate'

const validador = createValidator(
  {
    usuario: {
      perfil: {
        nombre: '',
        contacto: { email: '' }
      }
    }
  },
  {
    'usuario.perfil.nombre': [required('El nombre es obligatorio'), minLength(2)],
    'usuario.perfil.contacto.email': [required('El correo es obligatorio'), email()]
  }
)

// Escribir a través del proxy anidado
validador.values.usuario.perfil.nombre = 'Lucía'
validador.values.usuario.perfil.contacto.email = 'lucia@gmail.com'

await validador.validate()
console.log(validador.state.isValid) // true
console.log(validador.getPayload())
/*
{
  usuario: {
    perfil: {
      nombre: 'Lucía',
      contacto: { email: 'lucia@gmail.com' }
    }
  }
}
*/
```

---

### Ejemplo 3: Validación Condicional con `when`

Permite activar reglas solo si una condición sobre el formulario se cumple. Si la condición es falsa, el campo queda automáticamente limpio de errores.

```javascript
import { createValidator, required, when, ruc } from 'arv-validate'

const validador = createValidator(
  {
    tipoComprobante: 'BOLETA', // o 'FACTURA'
    rucEmpresa: ''
  },
  {
    tipoComprobante: [required()],
    rucEmpresa: [
      when(all => all.tipoComprobante === 'FACTURA', [
        required('El RUC es obligatorio para emitir factura'),
        ruc('El RUC debe tener 11 dígitos')
      ])
    ]
  }
)

// Caso A: Con Boleta, el RUC no es exigido
await validador.validate()
console.log(validador.state.isValid) // true

// Caso B: Cambiar a Factura activa las reglas condicionales
validador.values.tipoComprobante = 'FACTURA'
await validador.validate()
console.log(validador.state.isValid) // false
console.log(validador.getError('rucEmpresa')) // "El RUC es obligatorio para emitir factura"

// Caso C: Completar RUC válido
validador.values.rucEmpresa = '20123456789'
await validador.validate()
console.log(validador.state.isValid) // true
```

---

### Ejemplo 4: Validación Asíncrona (Consultas a API Backend)

Maneja promesas con control automático de estado de carga (`isValidating`) y prevención de race conditions:

```javascript
import { createValidator, required, email, custom } from 'arv-validate'

// Regla asíncrona que consulta un endpoint
const verificarEmailDisponible = custom(async (valor) => {
  const respuesta = await fetch(`/api/usuarios/verificar?email=${encodeURIComponent(valor)}`)
  const data = await respuesta.json()
  return data.disponible ? true : 'Este correo ya pertenece a otra cuenta'
})

const validador = createValidator(
  { email: '' },
  { email: [required(), email(), verificarEmailDisponible] }
)

// Al escribir en vivo:
validador.values.email = 'nuevo@empresa.com'

// Comprobar si el campo está consultando al servidor
console.log(validador.isValidating('email')) // true (mientras la promesa está pendiente)

// Esperar a que termine
await validador.validate()
console.log(validador.isValidating('email')) // false
```

---

### Ejemplo 5: Arrays y Tablas Dinámicas con `each`

Validación de listas dinámicas de objetos o de primitivos:

```javascript
import { createValidator, required, each, mobile, minItems } from 'arv-validate'

const validador = createValidator(
  {
    familiares: [
      { parentesco: '', celular: '' }
    ]
  },
  {
    familiares: [
      minItems(1, 'Debe registrar al menos un familiar'),
      each({
        parentesco: [required('El parentesco es obligatorio')],
        celular: [required(), mobile('Número de celular inválido (9 dígitos)')]
      })
    ]
  }
)

// Agregar una fila
validador.values.familiares.push({ parentesco: 'Padre', celular: '987654321' })

await validador.validate()
console.log(validador.state.isValid) // false (la primera fila aún está vacía)
console.log(validador.state.errors.familiares) // "Fila 1: El parentesco es obligatorio"
```

---

### Ejemplo 6: Validaciones Cruzadas entre Campos (`sameAs`, `greaterThan`)

El motor indexa las dependencias para que cuando un campo fuente cambia, los campos dependientes se revaliden automáticamente:

```javascript
import { createValidator, required, minLength, sameAs, greaterThan } from 'arv-validate'

const validador = createValidator(
  {
    password: '',
    confirmPassword: '',
    precioMinimo: 100,
    precioMaximo: 50
  },
  {
    password: [required(), minLength(6)],
    confirmPassword: [
      required('Confirme su contraseña'),
      sameAs('password', 'Las contraseñas no coinciden')
    ],
    precioMaximo: [
      required(),
      greaterThan('precioMinimo', 'El precio máximo debe ser superior al precio mínimo')
    ]
  }
)

await validador.validate()
console.log(validador.getError('confirmPassword')) // "Las contraseñas no coinciden"
console.log(validador.getError('precioMaximo')) // "El precio máximo debe ser superior..."

// Al corregir el precio máximo:
validador.values.precioMaximo = 250
console.log(validador.state.errors.precioMaximo) // null (revalidado automáticamente)
```

---

### Ejemplo 7: Fechas, Horas y Límites de Edad

Valida fechas de calendario gregoriano real (incluyendo años bisiestos y días máximos por mes):

```javascript
import { createValidator, required, date, afterDate, minAge, time } from 'arv-validate'

const validador = createValidator(
  {
    fechaInicio: '2026-10-20',
    fechaFin: '2026-10-15', // Error: anterior a fechaInicio
    fechaNacimiento: '2015-05-10',
    horaAtencion: '14:30'
  },
  {
    fechaInicio: [required(), date('Fecha inválida')],
    fechaFin: [
      required(),
      date(),
      afterDate('fechaInicio', 'La fecha de fin debe ser posterior a la de inicio')
    ],
    fechaNacimiento: [
      required(),
      date(),
      minAge(18, 'Debe ser mayor de edad (mínimo 18 años)')
    ],
    horaAtencion: [required(), time('Hora inválida en formato HH:mm')]
  }
)

await validador.validate()
console.log(validador.getError('fechaFin')) // "La fecha de fin debe ser posterior a la de inicio"
console.log(validador.getError('fechaNacimiento')) // "Debe ser mayor de edad (mínimo 18 años)"
```

---

### Ejemplo 8: Transformación y Sanitización para la API (`getPayload`)

Los transformadores preparan el payload sin tocar la entrada visual del usuario:

```javascript
import {
  createValidator,
  required,
  email,
  trim,
  toLowerCase,
  toFloat,
  round,
  digitsOnly,
  toDate
} from 'arv-validate'

const validador = createValidator(
  {
    correo: '  PEDRO.PICA@GMAIL.COM  ',
    monto: '  1499.856  ',
    telefono: '(+51) 987-654-321',
    fechaRegistro: '2026-10-23'
  },
  {
    correo: [required(), email(), trim(), toLowerCase()],
    monto: [required(), toFloat(), round(2)],
    telefono: [required(), digitsOnly()],
    fechaRegistro: [required(), toDate()]
  }
)

await validador.validate()

// En pantalla el usuario sigue viendo su formato original:
console.log(validador.values.correo) // "  PEDRO.PICA@GMAIL.COM  "
console.log(validador.values.telefono) // "(+51) 987-654-321"

// El payload resultante listo para el backend:
const payload = validador.getPayload()
console.log(payload)
/*
{
  correo: "pedro.pica@gmail.com",
  monto: 1499.86,
  telefono: "51987654321",
  fechaRegistro: "2026-10-23"
}
*/
```

---

### Ejemplo 9: Creación de Reglas Personalizadas

Una regla de validación es simplemente una función que recibe el valor actual y opcionalmente todos los valores del formulario:

```javascript
import { createValidator, required } from 'arv-validate'

// Regla síncrona simple
const esPar = (msg = 'El número debe ser par') => {
  return (val) => {
    if (val === null || val === undefined || val === '') return true // Regla SRP: vacío se valida con required
    return Number(val) % 2 === 0 || msg
  }
}

// Regla con dependencias cruzadas
const debeCoincidirConDominio = (dominioEsperado, msg) => {
  const regla = (email) => {
    if (!email) return true
    return email.endsWith(`@${dominioEsperado}`) || msg || `El correo debe pertenecer a @${dominioEsperado}`
  }
  return regla
}

const validador = createValidator(
  {
    cuotas: 3,
    emailCorporativo: 'contacto@gmail.com'
  },
  {
    cuotas: [required(), esPar('Las cuotas deben ser en números pares')],
    emailCorporativo: [required(), debeCoincidirConDominio('miempresa.com')]
  }
)

await validador.validate()
console.log(validador.getError('cuotas')) // "Las cuotas deben ser en números pares"
console.log(validador.getError('emailCorporativo')) // "El correo debe pertenecer a @miempresa.com"
```

---

### Ejemplo 10: Mensajes de Error Globales y Localización

Puedes redefinir los mensajes por defecto a nivel global en tu aplicación:

```javascript
import { configureMessages } from 'arv-validate'

configureMessages({
  required: 'Requerido',
  email: 'Formato de correo no válido',
  minLength: (min) => `Debe ingresar al menos ${min} caracteres`,
  date: 'Fecha no válida'
})
```

---

### Ejemplo 11: Validación Manual bajo Demanda (`live: false`)

Para asistentes de múltiples pasos (wizards) o formularios donde solo se desea validar al presionar "Siguiente":

```javascript
import { createValidator, required, email } from 'arv-validate'

const validador = createValidator(
  { paso1: '', paso2: '' },
  { paso1: [required()], paso2: [required(), email()] },
  { live: false } // No valida mientras se escribe
)

validador.values.paso1 = 'completado'
// En live: false, el error no se calcula al escribir

// Validar manualmente solo el paso actual al avanzar
const paso1Valido = await validador.validateField('paso1')
if (paso1Valido) {
  console.log('Avanzar al paso 2')
}
```

---

### Ejemplo 12: Suscripciones y Reactividad Personalizada

Para sincronizar el validador con cualquier sistema de estado, interfaz vanilla o consola:

```javascript
import { createValidator, required } from 'arv-validate'

const v = createValidator({ busqueda: '' }, { busqueda: [required()] })

// Suscribirse a cambios de estado
const desuscribir = v.subscribe((estado) => {
  console.log('Estado actualizado:', {
    esValido: estado.isValid,
    errores: estado.errors,
    modificado: estado.isDirty
  })
})

v.values.busqueda = 'JavaScript' // Notifica automáticamente

// Detener suscripción cuando ya no sea necesaria
desuscribir()
```

---

## 6. Referencia de la API del Validador

### Función constructora
```javascript
const v = createValidator(initialData = {}, schema = {}, options = {})
```

**Opciones:**
* `live` *(boolean, por defecto `true`)*: Valida en tiempo real ante cualquier cambio del proxy.

### Propiedades y Métodos de la Instancia

| Miembro | Tipo | Descripción |
|---|---|---|
| `v.values` | `Proxy` | Objeto de lectura/escritura reactivo en tiempo real con soporte dot-notation. |
| `v.state` | `Object` | Estado plano: `{ values, errors, touched, validating, isValid, isDirty }`. |
| `v.validate()` | `() => Promise<boolean>` | Marca todos los campos como `touched` y ejecuta todas las validaciones síncronas y asíncronas. Retorna `true` si todo es válido. |
| `v.validateField(campo)` | `(campo: string) => Promise<boolean>` | Valida inmediatamente un campo individual por su nombre o ruta punto. |
| `v.touch(campo)` | `(campo: string) => void` | Marca el campo como visitado y calcula su estado de error. |
| `v.untouch(campo)` | `(campo: string) => void` | Desmarca el campo como visitado (oculta errores visuales). |
| `v.hasError(campo)` | `(campo: string) => boolean` | Retorna `true` únicamente si el campo fue tocado y tiene error. |
| `v.getError(campo)` | `(campo: string) => string \| null` | Retorna el mensaje de error si fue tocado, de lo contrario `null`. |
| `v.isValidating(campo?)` | `(campo?: string) => boolean` | Retorna `true` si el campo (o todo el formulario) tiene una regla asíncrona consultando al backend. |
| `v.reset(newValues?)` | `(newValues?: object) => void` | Restaura el formulario a su snapshot inicial limpio (inmune a mutaciones externas) o a nuevos datos. |
| `v.setValues(patch)` | `(patch: object) => void` | Actualiza múltiples propiedades a la vez (soporta dot notation). |
| `v.getPayload(customFn?)` | `(fn?: Function) => object` | Retorna una copia limpia y tipada aplicando los transformadores del esquema para enviar a la API. |
| `v.subscribe(callback)` | `(cb: Function) => () => void` | Registra un oyente que se invoca ante cualquier cambio del estado. Retorna función de desuscripción. |

---

## 7. Catálogo de Reglas y Transformadores

Consulta la documentación técnica detallada de cada una de las más de 40 reglas y transformadores nativos disponibles:

👉 **[Ver Catálogo Completo de Reglas y Transformadores (REGLAS.md)](./REGLAS.md)**
