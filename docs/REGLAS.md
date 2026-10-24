# Catálogo Completo de Reglas y Transformadores

> Documentación técnica exhaustiva del módulo [`arv-validate/rules`](../packages/core/rules.js).  
> Cada regla es una función pura que retorna `true` si el valor es válido, o un `string` con el mensaje de error si no lo es.

---

## 📑 Tabla de Contenidos
1. [Obligatoriedad y Condicionales](#1-obligatoriedad-y-condicionales) (2)
2. [Tipos de Datos Primitivos y Atómicos](#2-tipos-de-datos-primitivos-y-atómicos) (6)
3. [Longitud de Texto y Caracteres](#3-longitud-de-texto-y-caracteres) (3)
4. [Números y Rangos](#4-números-y-rangos) (5)
5. [Fechas y Horas](#5-fechas-y-horas) (5)
6. [Contacto, Comunicación y Documentos](#6-contacto-comunicación-y-documentos) (8)
7. [Arrays y Selección Múltiple](#7-arrays-y-selección-múltiple) (3)
8. [Archivos y Adjuntos](#8-archivos-y-adjuntos) (2)
9. [Seguridad y Reglas Personalizadas](#9-seguridad-y-reglas-personalizadas) (4)
10. [Transformadores y Sanitización de Datos](#10-transformadores-y-sanitización-de-datos) (10)

---

## 1. Obligatoriedad y Condicionales

### `required(msg)`
* **Qué hace:** Valida la **presencia pura** del valor (Principio SRP). Verifica que el campo no sea `null`, `undefined`, cadena vacía `""` ni cadena compuesta solo por espacios en blanco. No asume ni inspecciona estructuras complejas (para colecciones se usan `minItems` o `minKeys`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error personalizado.  
    *Por defecto:* `'Este campo es obligatorio'`
* **Ejemplo:**
  ```javascript
  nombres: [required('Por favor ingrese sus nombres')]
  ```

---

### `when(conditionFnOrField, rules)`
* **Qué hace:** Ejecuta un grupo de reglas (anidadas) **únicamente si** la condición se cumple. Si la condición es falsa, **ignora por completo** todas las reglas internas (retorna `true`), evitando que datos residuales en el campo generen errores falsos en pantalla (Clean Code & SRP).
* **Parámetros:**
  * `conditionFnOrField` *(string | Function)*: Campo booleano o función `(allValues) => boolean`.
  * `rules` *(Array<Function> | Function)*: Regla o lista de reglas a ejecutar si la condición se cumple.
* **Ejemplos:**
  ```javascript
  // Ejemplo 1: Obligatoriedad simple condicional
  motivoRechazo: [
    when('rechazado', [required('Debe indicar el motivo del rechazo')])
  ]

  // Ejemplo 2: Composición avanzada (obligatorio + formato RUC solo si es factura)
  numeroRuc: [
    when(all => all.tipoComprobante === 'FACTURA', [
      required('El RUC es obligatorio para factura'),
      ruc('El RUC debe tener 11 dígitos')
    ])
  ]
  ```

---

## 2. Tipos de Datos Primitivos y Atómicos

> **Nota:** Estas reglas son atómicas (SRP). Si el campo está vacío (`null`, `undefined`, `""`), retornan `true` para no forzar obligatoriedad (la obligatoriedad debe combinarse con `required()`).

### `isString(msg)`
* **Qué hace:** Exige que el tipo del valor sea estrictamente una cadena de texto (`typeof val === 'string'`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe ser un texto'`
* **Ejemplo:**
  ```javascript
  descripcion: [isString()]
  ```

---

### `isNumber(msg)`
* **Qué hace:** Exige que el valor sea un número nativo de JavaScript (`typeof val === 'number' && !isNaN(val)`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe ser un número válido'`
* **Ejemplo:**
  ```javascript
  temperatura: [isNumber('La temperatura debe ser un valor numérico')]
  ```

---

### `isBoolean(msg)`
* **Qué hace:** Exige que el valor sea estrictamente booleano (`typeof val === 'boolean'`, o los literales `true`/`false`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe ser un valor booleano'`
* **Ejemplo:**
  ```javascript
  aceptaTerminos: [required(), isBoolean()]
  ```

---

### `isArray(msg)`
* **Qué hace:** Exige que el valor sea una estructura de lista nativa (`Array.isArray(val)`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe ser una lista'`
* **Ejemplo:**
  ```javascript
  etiquetas: [isArray('Las etiquetas deben enviarse en una lista')]
  ```

---

### `isObject(msg)`
* **Qué hace:** Exige que el valor sea un objeto no nulo y que no sea un Array (`typeof val === 'object' && val !== null && !Array.isArray(val)`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe ser un objeto válido'`
* **Ejemplo:**
  ```javascript
  configuracion: [isObject()]
  ```

---

### `isFile(msg)`
* **Qué hace:** Exige que el valor sea una instancia válida de `File` o `Blob`, o una estructura file-like que contenga las propiedades `name` y `size` (soporta valores directos o un arreglo cuyo primer elemento sea un archivo).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe seleccionar un archivo válido'`
* **Ejemplo:**
  ```javascript
  fotoPerfil: [required(), isFile('Adjunte una imagen válida')]
  ```

---

## 3. Longitud de Texto y Caracteres

### `minLength(min, msg)`
* **Qué hace:** Verifica que la cantidad de caracteres (tras aplicar `.trim()`) sea mayor o igual al mínimo requerido.
* **Parámetros:**
  * `min` *(number)*: Cantidad mínima de caracteres.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `Mínimo ${min} caracteres` ``
* **Ejemplo:**
  ```javascript
  observaciones: [minLength(10, 'Ingrese una descripción de al menos 10 caracteres')]
  ```

---

### `maxLength(max, msg)`
* **Qué hace:** Verifica que la cantidad de caracteres (tras aplicar `.trim()`) no supere el límite máximo permitido.
* **Parámetros:**
  * `max` *(number)*: Cantidad máxima de caracteres.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `Máximo ${max} caracteres` ``
* **Ejemplo:**
  ```javascript
  codigoPostal: [maxLength(5)]
  ```

---

### `betweenLength(min, max, msg)`
* **Qué hace:** Verifica que la longitud del texto se encuentre dentro de un rango cerrado `[min, max]`.
* **Parámetros:**
  * `min` *(number)*: Límite inferior.
  * `max` *(number)*: Límite superior.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `Debe tener entre ${min} y ${max} caracteres` ``
* **Ejemplo:**
  ```javascript
  claveSecreta: [betweenLength(6, 12)]
  ```

---

## 4. Números y Rangos

### `numeric(msg)`
* **Qué hace:** Verifica si el valor puede ser interpretado como un número válido (acepta números o strings con formato numérico decimal o entero).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe ser un número'`
* **Ejemplo:**
  ```javascript
  precio: [required(), numeric('El precio debe ser un número')]
  ```

---

### `integer(msg)`
* **Qué hace:** Verifica que el valor numérico sea un número entero (sin decimales).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Debe ser un número entero'`
* **Ejemplo:**
  ```javascript
  cantidadAlumnos: [required(), integer('La cantidad debe ser un entero')]
  ```

---

### `minValue(min, msg)`
* **Qué hace:** Verifica que el valor numérico sea mayor o igual a `min`.
* **Parámetros:**
  * `min` *(number)*: Valor mínimo permitido.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `El valor mínimo es ${min}` ``
* **Ejemplo:**
  ```javascript
  monto: [numeric(), minValue(0.01, 'El monto mínimo es 0.01')]
  ```

---

### `maxValue(max, msg)`
* **Qué hace:** Verifica que el valor numérico sea menor o igual a `max`.
* **Parámetros:**
  * `max` *(number)*: Valor máximo permitido.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `El valor máximo es ${max}` ``
* **Ejemplo:**
  ```javascript
  porcentaje: [numeric(), maxValue(100, 'El porcentaje no puede superar 100')]
  ```

---

### `between(min, max, msg)`
* **Qué hace:** Verifica que el valor numérico esté comprendido dentro del intervalo `[min, max]`.
* **Parámetros:**
  * `min` *(number)*: Valor inferior.
  * `max` *(number)*: Valor superior.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `El valor debe estar entre ${min} y ${max}` ``
* **Ejemplo:**
  ```javascript
  calificacion: [between(0, 20, 'La nota debe estar entre 0 y 20')]
  ```

---

### `greaterThan(otherField, msg)`
* **Qué hace:** Verifica que el valor numérico sea estrictamente mayor que el valor de otro campo (soporta notación de punto `'apoderado.ingreso'`).
* **Ejemplo:**
  ```javascript
  montoMaximo: [required(), greaterThan('montoMinimo')]
  ```

---

### `greaterThanOrEqual(otherField, msg)`
* **Qué hace:** Verifica que el valor numérico sea mayor o igual que el valor de otro campo.
* **Ejemplo:**
  ```javascript
  notaFinal: [greaterThanOrEqual('notaMinimaAprobatoria')]
  ```

---

### `lessThan(otherField, msg)`
* **Qué hace:** Verifica que el valor numérico sea estrictamente menor que el valor de otro campo.
* **Ejemplo:**
  ```javascript
  costoBeca: [lessThan('costoPension')]
  ```

---

### `lessThanOrEqual(otherField, msg)`
* **Qué hace:** Verifica que el valor numérico sea menor o igual que el valor de otro campo.
* **Ejemplo:**
  ```javascript
  gastoTotal: [lessThanOrEqual('ingresoFamiliar')]
  ```

---

## 5. Fechas y Horas

> **Nota:** El motor interno incluye un parser robusto que analiza strings en formatos `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, ISO 8601 con zona horaria e instancias nativas de `Date`, validando calendarios reales (descarta días inválidos como 30 de febrero o 31 de abril).

### `date(msg)`
* **Qué hace:** Comprueba que la fecha sea válida en el calendario real. Soporta strings (`DD/MM/YYYY`, `YYYY-MM-DD`, ISO 8601 con hora y zona horaria) y objetos nativos `new Date()`.
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Fecha no válida en el calendario'`
* **Ejemplo:**
  ```javascript
  fechaNacimiento: [required(), date()]
  ```

---

### `afterDate(targetFieldOrDate, msg)`
* **Qué hace:** Comprueba que la fecha sea estrictamente posterior a otra fecha o al valor de otro campo del formulario.
* **Parámetros:**
  * `targetFieldOrDate` *(string | Date | Function)*: Nombre de otro campo en el formulario, función selectora o fecha fija.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'La fecha debe ser posterior'`
* **Ejemplo:**
  ```javascript
  fechaFin: [afterDate('fechaInicio', 'La fecha final debe ser posterior al inicio')]
  ```

---

### `beforeDate(targetFieldOrDate, msg)`
* **Qué hace:** Comprueba que la fecha sea estrictamente anterior a otra fecha o al valor de otro campo del formulario.
* **Parámetros:**
  * `targetFieldOrDate` *(string | Date | Function)*: Nombre de otro campo en el formulario, función selectora o fecha fija.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'La fecha debe ser anterior'`
* **Ejemplo:**
  ```javascript
  fechaInicio: [beforeDate('fechaFin', 'La fecha de inicio debe ser anterior al fin')]
  ```

---

### `minAge(years, msg)`
* **Qué hace:** Calcula con exactitud la edad en años a partir de una fecha de nacimiento (considerando mes y día cumplido) y valida que sea mayor o igual a `years`.
* **Parámetros:**
  * `years` *(number)*: Edad mínima requerida.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `Debe tener al menos ${years} años` ``
* **Ejemplo:**
  ```javascript
  fechaNacimiento: [required(), date(), minAge(18, 'Debe ser mayor de edad')]
  ```

---

### `maxAge(years, msg)`
* **Qué hace:** Valida que la edad calculada a partir de la fecha de nacimiento no supere los `years` indicados.
* **Ejemplo:**
  ```javascript
  fechaNacimiento: [required(), date(), maxAge(5, 'Máximo 5 años')] // Nivel inicial
  ```

---

### `betweenAge(min, max, msg)`
* **Qué hace:** Valida que la edad calculada se encuentre dentro del rango `[min, max]`.
* **Ejemplo:**
  ```javascript
  fechaNacimiento: [required(), date(), betweenAge(12, 17)] // Nivel secundaria
  ```

---

### `time(msg)`
* **Qué hace:** Valida que el texto cumpla con el formato horario de 24 horas `HH:mm` (ej. `08:30`) o `HH:mm:ss` con segundos opcionales (ej. `14:30:45`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Formato de hora inválido (HH:mm o HH:mm:ss)'`
* **Ejemplo:**
  ```javascript
  horaEntrada: [required(), time()]
  ```

---

## 6. Contacto, Comunicación y Documentos

### `email(msg)`
* **Qué hace:** Valida la estructura estándar de una dirección de correo electrónico (`usuario@dominio.ext`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Correo electrónico no válido'`
* **Ejemplo:**
  ```javascript
  correo: [required(), email()]
  ```

---

### `mobile(msg)`
* **Qué hace:** Valida números de celular (estándar Perú: exactamente 9 dígitos iniciando con el dígito `9`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Número de celular inválido (9 dígitos iniciando en 9)'`
* **Ejemplo:**
  ```javascript
  celular: [required(), mobile()]
  ```

---

### `phone(msg)`
* **Qué hace:** Valida teléfonos fijos o celulares (6 a 9 dígitos), permitiendo prefijos de código de área (ej. `01-1234567`, `044 123456`, `987654321`).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Número de teléfono inválido'`
* **Ejemplo:**
  ```javascript
  telefonoCasa: [phone()]
  ```

---

### `url(msg)`
* **Qué hace:** Valida que el texto sea una dirección web válida con protocolo `http:` o `https:`.
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'URL no válida'`
* **Ejemplo:**
  ```javascript
  sitioWeb: [url('Ingrese un enlace web válido')]
  ```

---

### `alpha(msg)`
* **Qué hace:** Permite exclusivamente caracteres alfabéticos (letras en mayúsculas/minúsculas, tildes `áéíóúÁÉÍÓÚ`, letra `ñÑ` y espacios).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Solo se permiten letras'`
* **Ejemplo:**
  ```javascript
  nombres: [required(), alpha('El nombre solo debe contener letras')]
  ```

---

### `alphaNum(msg)`
* **Qué hace:** Permite caracteres alfanuméricos (letras con tildes, números del 0 al 9 y espacios).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Solo se permiten letras y números'`
* **Ejemplo:**
  ```javascript
  codigoReferencia: [alphaNum()]
  ```

---

### `dni(msg)`
* **Qué hace:** Valida un Documento Nacional de Identidad de Perú (exactamente 8 dígitos numéricos).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'El DNI debe tener 8 dígitos numéricos'`
* **Ejemplo:**
  ```javascript
  nroDni: [required(), dni()]
  ```

---

### `ruc(msg)`
* **Qué hace:** Valida un Registro Único de Contribuyente de Perú / SUNAT (exactamente 11 dígitos numéricos).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'El RUC debe tener 11 dígitos numéricos'`
* **Ejemplo:**
  ```javascript
  nroRuc: [required(), ruc()]
  ```

---

### `cci(msg)`
* **Qué hace:** Valida un Código de Cuenta Interbancario de Perú (exactamente 20 dígitos numéricos).
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'El CCI debe tener exactamente 20 dígitos numéricos'`
* **Ejemplo:**
  ```javascript
  cuentaCci: [required(), cci()]
  ```

---

## 7. Arrays y Selección Múltiple

### `minItems(min, msg)`
* **Qué hace:** Exige que un arreglo contenga al menos una cantidad `min` de elementos seleccionados (ideal para `<q-select multiple>` o grupos de checkboxes). Ya valida internamente que sea un array y no esté vacío.
* **Parámetros:**
  * `min` *(number)*: Cantidad mínima de opciones requeridas.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `Seleccione al menos ${min} opción(es)` ``
* **Ejemplo:**
  ```javascript
  intereses: [minItems(2, 'Seleccione al menos 2 intereses')]
  ```

---

### `maxItems(max, msg)`
* **Qué hace:** Exige que un arreglo no contenga más de `max` elementos seleccionados.
* **Parámetros:**
  * `max` *(number)*: Cantidad máxima de opciones permitidas.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `Seleccione máximo ${max} opción(es)` ``
* **Ejemplo:**
  ```javascript
  cursosElectivos: [maxItems(3, 'Solo puede matricularse en 3 electivos')]
  ```

---

### `oneOf(allowedList, msg)`
* **Qué hace:** Valida que el valor seleccionado coincida obligatoriamente con uno de los valores definidos en una lista de opciones permitidas.
* **Parámetros:**
  * `allowedList` *(Array)*: Lista de valores válidos.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Opción no permitida'`
* **Ejemplo:**
  ```javascript
  sexo: [required(), oneOf(['M', 'F'], 'Seleccione Masculino o Femenino')]
  ```

---

### `each(schemaOrRules, msg)`
* **Qué hace:** Aplica un sub-esquema de validación a **cada elemento** dentro de un arreglo. Es compatible con arreglos de objetos (tablas dinámicas) y con arreglos de primitivos.
* **Parámetros:**
  * `schemaOrRules` *(Object | Array | Function)*: Objeto con reglas por campo o arreglo de reglas.
  * `msg` *(string, opcional)*: Mensaje de error personalizado.
* **Ejemplo con Array de Objetos (Tabla dinámica):**
  ```javascript
  hermanos: [
    minItems(1, 'Agregue al menos un hermano'),
    each({
      nombres: [required(), trim()],
      edad: [required(), truncate()]
    })
  ]
  ```
* **Ejemplo con Array de Primitivos:**
  ```javascript
  correosNotificacion: [
    each([required(), email()])
  ]
  ```

---

## 8. Archivos y Adjuntos

### `fileMaxSize(maxMB, msg)`
* **Qué hace:** Verifica que el tamaño del archivo adjunto no exceda el límite especificado en Megabytes (soporta objetos directos o arreglos con archivos).
* **Parámetros:**
  * `maxMB` *(number)*: Límite de tamaño en Megabytes.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `` `El archivo no debe superar ${maxMB} MB` ``
* **Ejemplo:**
  ```javascript
  adjunto: [fileMaxSize(5, 'El archivo no puede pesar más de 5MB')]
  ```

---

### `fileTypes(allowedExts, msg)`
* **Qué hace:** Valida que la extensión del archivo coincida con la lista de extensiones permitidas (evaluación insensible a mayúsculas/minúsculas).
* **Parámetros:**
  * `allowedExts` *(Array<string>)*: Lista de extensiones (ej. `['pdf', 'jpg', 'png']`).
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Tipo de archivo no permitido'`
* **Ejemplo:**
  ```javascript
  comprobante: [fileTypes(['pdf', 'png', 'jpg'], 'Solo se admiten documentos PDF o imágenes')]
  ```

---

## 9. Seguridad y Reglas Personalizadas

### `sameAs(targetFieldOrGetter, msg)`
* **Qué hace:** Valida que el valor actual sea estrictamente idéntico (`===`) al valor de otro campo del formulario o al resultado de una función selectora (útil para confirmación de contraseñas o correos).
* **Parámetros:**
  * `targetFieldOrGetter` *(string | Function)*: Nombre del campo a comparar o función `getter(allValues)`.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Los campos no coinciden'`
* **Ejemplo:**
  ```javascript
  confirmPassword: [required(), sameAs('password', 'Las contraseñas no coinciden')]
  ```

---

### `strongPassword(msg)`
* **Qué hace:** Exige los requisitos estándar de seguridad para contraseñas: mínimo 8 caracteres, al menos una letra mayúscula, una letra minúscula, un número y un carácter especial o símbolo.
* **Parámetros:**
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo'`
* **Ejemplo:**
  ```javascript
  nuevaClave: [required(), strongPassword()]
  ```

---

### `pattern(regex, msg)`
* **Qué hace:** Comprueba el valor contra una expresión regular personalizada (`RegExp`).
* **Parámetros:**
  * `regex` *(RegExp)*: Expresión regular a evaluar.
  * `msg` *(string, opcional)*: Mensaje de error.  
    *Por defecto:* `'Formato inválido'`
* **Ejemplo:**
  ```javascript
  placaAuto: [pattern(/^[A-Z]{3}-\d{3}$/, 'Formato de placa inválido (ej. ABC-123)')]
  ```

---

### `custom(fn, defaultMsg)`
* **Qué hace:** Permite definir cualquier validación personalizada síncrona o asíncrona (`Promise`). Puede consultar al backend por API (ej. disponibilidad de usuario o DNI existente).
* **Parámetros:**
  * `fn` *(Function: (val, allValues) => boolean | string | Promise<boolean|string>)*: Función de validación. Retorna `true` si es válido, o un string/false con el error.
  * `defaultMsg` *(string, opcional)*: Mensaje utilizado si la función retorna `false`.  
    *Por defecto:* `'Valor no válido'`
* **Ejemplo:**
  ```javascript
  username: [
    required(),
    custom(async (val) => {
      const existe = await api.verificarUsuario(val)
      return !existe || 'El nombre de usuario ya está en uso'
    })
  ]
  ```

---

## 10. Transformadores y Sanitización de Datos

> **Filosofía Clean Code:**  
> Los transformadores se declaran junto a las reglas en el esquema del formulario. Durante la escritura del usuario son ignorados para no alterar la reactividad ni provocar saltos de cursor.  
> Al enviar el formulario, `v.getPayload()` (o `v.getTransformed()`) ejecuta la cadena de transformadores para entregar un objeto sanitizado y tipado listo para Axios / HTTP.

### Constante `DEFAULT_TIMEZONE`
* **Valor:** `'America/Lima'`
* **Descripción:** Zona horaria IANA por defecto utilizada para el formateo de fechas y horas en los transformadores `toDate` y `toDateTime`.

---

### `transform(fn)`
* **Qué hace:** Primitiva base para crear cualquier transformación o sanitización personalizada.
* **Parámetros:**
  * `fn` *(Function: (val) => any)*: Función pura que recibe el valor original y retorna el valor transformado.
* **Ejemplo:**
  ```javascript
  slug: [transform(val => String(val).toLowerCase().replace(/\s+/g, '-'))]
  ```

---

### `trim()`
* **Qué hace:** Elimina espacios en blanco redundantes al inicio y final de una cadena de texto (`val.trim()`). Si el valor no es texto, lo mantiene intacto.
* **Ejemplo:**
  ```javascript
  nombre: [required(), trim()] // "  Juan  " -> "Juan"
  ```

---

### `toLowerCase()`
* **Qué hace:** Convierte una cadena de texto a minúsculas (`val.toLowerCase()`). Ideal para emails o identificadores.
* **Ejemplo:**
  ```javascript
  email: [required(), email(), toLowerCase(), trim()] // "  USUARIO@GMAIL.COM " -> "usuario@gmail.com"
  ```

---

### `toUpperCase()`
* **Qué hace:** Convierte una cadena de texto a mayúsculas (`val.toUpperCase()`). Ideal para códigos de serie, placas o siglas.
* **Ejemplo:**
  ```javascript
  codigo: [required(), toUpperCase(), trim()] // " abc-123 " -> "ABC-123"
  ```

---

### `toFloat()`
* **Qué hace:** Convierte el valor a un número de punto flotante puro (`parseFloat(val)`). **No altera ni redondea los decimales** (respetando SRP y el Principio de Menor Sorpresa). Si el valor es vacío o inválido, retorna `null`. Soporta cadenas con texto al final (ej: `"75.45 kg"` -> `75.45`).
* **Ejemplo:**
  ```javascript
  tasaCambio: [required(), toFloat()] // "3.7548" -> 3.7548
  ```

---

### `round(decimals = 2)`
* **Qué hace:** Bloque atómico dedicado exclusivamente al **redondeo matemático** al valor más cercano según la cantidad de decimales especificada, corrigiendo imprecisiones de coma flotante binaria de JavaScript.
* **Parámetros:**
  * `decimals` *(number, opcional)*: Cantidad de decimales a redondear. Por defecto: `2`.
* **Ejemplo:**
  ```javascript
  precio: [required(), round(2)] // "19.994" -> 19.99, "19.996" -> 20.0
  promedio: [required(), round(0)] // "16.8" -> 17 (al entero más cercano)
  ```

---

### `truncate(decimals = 0)`
* **Qué hace:** Bloque atómico que **trunca y corta los decimales en seco** sin redondear hacia arriba. Si `decimals` es `0` (o se omite), actúa como conversor a entero (`Math.trunc`). Cuenta con el alias `toInteger()`.
* **Parámetros:**
  * `decimals` *(number, opcional)*: Cantidad de decimales a conservar. Por defecto: `0`.
* **Ejemplo:**
  ```javascript
  cuotas: [required(), truncate()] // "12 meses" -> 12 (entero puro)
  ahorro: [required(), truncate(2)] // "16.789" -> 16.78 (corta a 2 decimales sin redondear)
  ```

---

### `digitsOnly()`
* **Qué hace:** Elimina cualquier caracter no numérico de la cadena (`val.replace(/\D/g, '')`), dejando exclusivamente dígitos. Ideal para normalizar teléfonos copiados con formato o números de cuenta con espacios.
* **Ejemplo:**
  ```javascript
  celular: [mobile(), digitsOnly()] // "+51 987-654-321" -> "51987654321"
  ```

---

### `toBooleanFlag()`
* **Qué hace:** Convierte valores booleanos o truthy (`true`, `1`, `'1'`, `'true'`) al entero `1`, y en cualquier otro caso al entero `0`. Ideal para bases de datos relacionales (ej. Firebird / PostgreSQL) que almacenan flags como `SMALLINT`.
* **Ejemplo:**
  ```javascript
  esActivo: [toBooleanFlag()] // true -> 1, false -> 0
  ```

---

### `toDate(timeZone = DEFAULT_TIMEZONE)`
* **Qué hace:** Convierte cualquier entrada de fecha (ISO, timestamp, `DD/MM/YYYY`, `Date`) en una fecha limpia formato `YYYY-MM-DD` preservando el día de calendario exacto en la zona horaria especificada.
* **Parámetros:**
  * `timeZone` *(string, opcional)*: Zona horaria IANA. Por defecto: `'America/Lima'`.
* **Ejemplo:**
  ```javascript
  fechaNac: [required(), date(), toDate()] // "19/10/2026" -> "2026-10-19"
  ```

---

### `toDateTime(timeZone = DEFAULT_TIMEZONE)`
* **Qué hace:** Convierte una fecha y hora al formato estándar SQL `YYYY-MM-DD HH:mm:ss`, ajustando con precisión la hora en la zona horaria IANA indicada.
* **Parámetros:**
  * `timeZone` *(string, opcional)*: Zona horaria IANA. Por defecto: `'America/Lima'`.
* **Ejemplo:**
  ```javascript
  citaUtc: [toDateTime('America/Lima')] // "2026-10-19T20:30:00.000Z" -> "2026-10-19 15:30:00"
  ```

---

### `toISOString()`
* **Qué hace:** Convierte cualquier valor de fecha compatible a una cadena ISO 8601 estándar UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
* **Ejemplo:**
  ```javascript
  creadoEn: [toISOString()]
  ```

---

## 🚀 Resumen Rápido de Uso

```javascript
import { 
  useValidator, 
  required, 
  email, 
  minLength, 
  trim, 
  toLowerCase, 
  toDate 
} from 'src/validator' // o './validator'

const v = useValidator(
  {
    correo: '  JUAN@GMAIL.COM  ',
    password: '',
    fechaNac: '19/10/1995'
  },
  {
    correo: [required(), email(), toLowerCase(), trim()],
    password: [required(), minLength(8)],
    fechaNac: [required(), toDate()]
  }
)

const guardar = async () => {
  const ok = await v.validate()
  if (!ok) return

  // v.getPayload() entrega los datos limpios y transformados:
  const payload = v.getPayload()
  // { correo: "juan@gmail.com", password: "...", fechaNac: "1995-10-19" }
  await api.post('/usuario', payload)
}
```
