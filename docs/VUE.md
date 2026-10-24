# Guía Completa de Validación en Vue 3 (`arv-validate-vue`)

> Adaptador reactivo oficial de **`arv-validate`** para **Vue 3** (Composition API con `<script setup>`).  
> Proporciona reactividad bidireccional inmediata, validación síncrona/asíncrona en vivo y soporte completo para TypeScript.

[English](./VUE.en.md) | [Español](./VUE.md)

---

## 📑 Tabla de Contenidos

1. [Instalación](#1-instalación)
2. [Conceptos Básicos y Flujo de Trabajo](#2-conceptos-básicos-y-flujo-de-trabajo)
3. [Ejemplo 1: Formulario Básico de Registro](#ejemplo-1-formulario-básico-de-registro)
4. [Ejemplo 2: Objetos Anidados (Dot Notation)](#ejemplo-2-objetos-anidados-dot-notation)
5. [Ejemplo 3: Validación Condicional con `when`](#ejemplo-3-validación-condicional-con-when)
6. [Ejemplo 4: Validación Asíncrona con API Backend (Loading State)](#ejemplo-4-validación-asíncrona-con-api-backend-loading-state)
7. [Ejemplo 5: Arrays Dinámicos de Elementos con `each`](#ejemplo-5-arrays-dinámicos-de-elementos-con-each)
8. [Ejemplo 6: Confirmación de Contraseñas (`sameAs`)](#ejemplo-6-confirmación-de-contraseñas-sameas)
9. [Ejemplo 7: Sanitización de Datos para la API con `getPayload()`](#ejemplo-7-sanitización-de-datos-para-la-api-con-getpayload)
10. [Ejemplo 8: Uso en Stores de Pinia y `dispose()`](#ejemplo-8-uso-en-stores-de-pinia-y-dispose)
11. [Ejemplo 9: Componente de Input Reutilizable (`AppInput.vue`)](#ejemplo-9-componente-de-input-reutilizable-appinputvue)
12. [Referencia de la API de `useValidator`](#12-referencia-de-la-api-de-usevalidator)

---

## 1. Instalación

```bash
npm install arv-validate-vue
```

> **Nota:** `arv-validate-vue` re-exporta todas las reglas y transformadores del core. Solo necesitas importar desde `'arv-validate-vue'`.

---

## 2. Conceptos Básicos y Flujo de Trabajo

El composable `useValidator` conecta el motor de validación con el sistema de reactividad de Vue 3:

1. **`v.values`**: Es un objeto reactivo bidireccional. Puedes enlazarlo directamente con `v-model="v.values.campo"`.
2. **`v.touch(campo)`**: Marca un campo como desenfocado (`@blur`). La interfaz solo muestra el error cuando el usuario ya interactuó con el campo o tras enviar el formulario.
3. **`v.hasError(campo)`**: Retorna `true` únicamente si el campo ya fue tocado y tiene un error. Ideal para mostrar clases de borde rojo o mensajes.
4. **`v.getError(campo)`**: Retorna el mensaje de error correspondiente o `null`.
5. **`v.isValid`**: Booleano reactivo. `true` si todo el formulario es válido. Perfecto para `:disabled="!v.isValid"`.
6. **`v.getPayload()`**: Retorna una copia limpia y sanitizada lista para enviar por HTTP con `fetch` o `axios`.

---

## Ejemplo 1: Formulario Básico de Registro

Formulario estándar con validación de obligatoriedad, longitud mínima, formato de correo y botón de envío deshabilitado mientras sea inválido.

```html
<template>
  <form @submit.prevent="handleSubmit" class="formulario">
    <h2>Crear Cuenta</h2>

    <!-- Campo Nombre -->
    <div class="campo">
      <label for="nombre">Nombre Completo</label>
      <input
        id="nombre"
        type="text"
        v-model="v.values.nombre"
        :class="{ 'input-error': v.hasError('nombre') }"
        placeholder="Juan Pérez"
        @blur="v.touch('nombre')"
      />
      <span v-if="v.hasError('nombre')" class="mensaje-error">
        {{ v.getError('nombre') }}
      </span>
    </div>

    <!-- Campo Correo -->
    <div class="campo">
      <label for="correo">Correo Electrónico</label>
      <input
        id="correo"
        type="email"
        v-model="v.values.correo"
        :class="{ 'input-error': v.hasError('correo') }"
        placeholder="juan@ejemplo.com"
        @blur="v.touch('correo')"
      />
      <span v-if="v.hasError('correo')" class="mensaje-error">
        {{ v.getError('correo') }}
      </span>
    </div>

    <!-- Botón Enviar -->
    <button type="submit" :disabled="!v.isValid">
      Registrarse
    </button>
  </form>
</template>

<script setup>
import { useValidator, required, email, minLength, trim } from 'arv-validate-vue'

const v = useValidator(
  {
    nombre: '',
    correo: ''
  },
  {
    nombre: [required('El nombre es obligatorio'), minLength(3, 'Mínimo 3 caracteres'), trim()],
    correo: [required('El correo es obligatorio'), email('Ingresa un correo electrónico válido'), trim()]
  }
)

const handleSubmit = async () => {
  const esValido = await v.validate()
  if (!esValido) return

  const payload = v.getPayload()
  console.log('Enviando datos limpios al backend:', payload)
  // await api.post('/usuarios', payload)
}
</script>
```

---

## Ejemplo 2: Objetos Anidados (Dot Notation)

Soporte nativo para formularios estructurados como `contacto.direccion.ciudad` sin tener que aplanar el estado.

```html
<template>
  <form @submit.prevent="guardarPerfil">
    <!-- Información de Usuario -->
    <input
      type="text"
      v-model="v.values.usuario.nombres"
      placeholder="Nombres"
      @blur="v.touch('usuario.nombres')"
    />
    <span v-if="v.hasError('usuario.nombres')">{{ v.getError('usuario.nombres') }}</span>

    <!-- Dirección Anidada -->
    <input
      type="text"
      v-model="v.values.direccion.calle"
      placeholder="Calle y Número"
      @blur="v.touch('direccion.calle')"
    />
    <span v-if="v.hasError('direccion.calle')">{{ v.getError('direccion.calle') }}</span>

    <input
      type="text"
      v-model="v.values.direccion.ciudad"
      placeholder="Ciudad"
      @blur="v.touch('direccion.ciudad')"
    />
    <span v-if="v.hasError('direccion.ciudad')">{{ v.getError('direccion.ciudad') }}</span>

    <button type="submit" :disabled="!v.isValid">Guardar</button>
  </form>
</template>

<script setup>
import { useValidator, required, minLength } from 'arv-validate-vue'

const v = useValidator(
  {
    usuario: {
      nombres: ''
    },
    direccion: {
      calle: '',
      ciudad: ''
    }
  },
  {
    'usuario.nombres': [required('Los nombres son obligatorios'), minLength(2)],
    'direccion.calle': [required('La calle es obligatoria')],
    'direccion.ciudad': [required('La ciudad es obligatoria')]
  }
)

const guardarPerfil = async () => {
  if (!(await v.validate())) return
  const payload = v.getPayload()
  console.log('Payload anidado sanitizado:', payload)
}
</script>
```

---

## Ejemplo 3: Validación Condicional con `when`

Muestra y exige campos únicamente cuando una condición se cumple (por ejemplo, exigir RUC y Razón Social solo si el tipo de comprobante es Factura).

```html
<template>
  <form @submit.prevent="emitirComprobante">
    <label>Tipo de Comprobante</label>
    <select v-model="v.values.tipoComprobante">
      <option value="BOLETA">Boleta</option>
      <option value="FACTURA">Factura</option>
    </select>

    <!-- Campos condicionales para Factura -->
    <div v-if="v.values.tipoComprobante === 'FACTURA'">
      <input
        type="text"
        v-model="v.values.numeroRuc"
        placeholder="Número de RUC (11 dígitos)"
        @blur="v.touch('numeroRuc')"
      />
      <span v-if="v.hasError('numeroRuc')">{{ v.getError('numeroRuc') }}</span>

      <input
        type="text"
        v-model="v.values.razonSocial"
        placeholder="Razón Social"
        @blur="v.touch('razonSocial')"
      />
      <span v-if="v.hasError('razonSocial')">{{ v.getError('razonSocial') }}</span>
    </div>

    <button type="submit" :disabled="!v.isValid">Emitir</button>
  </form>
</template>

<script setup>
import { useValidator, required, when, ruc, minLength } from 'arv-validate-vue'

const v = useValidator(
  {
    tipoComprobante: 'BOLETA',
    numeroRuc: '',
    razonSocial: ''
  },
  {
    tipoComprobante: [required()],
    numeroRuc: [
      when(all => all.tipoComprobante === 'FACTURA', [
        required('El RUC es obligatorio para Factura'),
        ruc('El RUC debe tener 11 dígitos válidos')
      ])
    ],
    razonSocial: [
      when(all => all.tipoComprobante === 'FACTURA', [
        required('La razón social es obligatoria'),
        minLength(3)
      ])
    ]
  }
)

const emitirComprobante = async () => {
  if (await v.validate()) {
    console.log('Comprobante emitido:', v.getPayload())
  }
}
</script>
```

---

## Ejemplo 4: Validación Asíncrona con API Backend (Loading State)

Validación en vivo contra el servidor para verificar disponibilidad de nombre de usuario o correo. El helper `v.isValidating('campo')` permite mostrar un indicador de carga.

```html
<template>
  <form @submit.prevent="guardarUsuario">
    <div class="campo">
      <label for="username">Nombre de Usuario</label>
      <div class="input-contenedor">
        <input
          id="username"
          type="text"
          v-model="v.values.username"
          placeholder="usuario123"
          @blur="v.touch('username')"
        />
        <!-- Indicador de carga asíncrona -->
        <span v-if="v.isValidating('username')" class="spinner">
          Consultando disponibilidad...
        </span>
      </div>

      <span v-if="v.hasError('username')" class="mensaje-error">
        {{ v.getError('username') }}
      </span>
      <span v-else-if="v.values.username && !v.isValidating('username') && !v.getError('username')" class="mensaje-exito">
        ✓ Usuario disponible
      </span>
    </div>

    <button type="submit" :disabled="!v.isValid || v.isValidating()">
      Guardar
    </button>
  </form>
</template>

<script setup>
import { useValidator, required, minLength, custom } from 'arv-validate-vue'

// Simulación de API backend con debounce o latencia
const verificarDisponibilidadApi = async (username) => {
  await new Promise(resolve => setTimeout(resolve, 600))
  const usuariosOcupados = ['admin', 'root', 'carlos', 'soporte']
  if (usuariosOcupados.includes(username.toLowerCase())) {
    return 'El nombre de usuario ya se encuentra registrado'
  }
  return true
}

const v = useValidator(
  {
    username: ''
  },
  {
    username: [
      required('El nombre de usuario es obligatorio'),
      minLength(4, 'Mínimo 4 caracteres'),
      custom(verificarDisponibilidadApi)
    ]
  }
)

const guardarUsuario = async () => {
  if (await v.validate()) {
    console.log('Usuario registrado:', v.getPayload())
  }
}
</script>
```

---

## Ejemplo 5: Arrays Dinámicos de Elementos con `each`

Validación de listas dinámicas de registros (por ejemplo, una lista de teléfonos o productos).

```html
<template>
  <form @submit.prevent="guardarTelefonos">
    <h3>Teléfonos de Contacto</h3>

    <div v-for="(item, index) in v.values.contactos" :key="index" class="fila-contacto">
      <input
        type="text"
        v-model="item.numero"
        placeholder="Número de celular (9 dígitos)"
        @blur="v.touch('contactos')"
      />
      <button type="button" @click="removerFila(index)">Eliminar</button>
    </div>

    <button type="button" @click="agregarFila">+ Agregar Teléfono</button>

    <div v-if="v.hasError('contactos')" class="mensaje-error">
      {{ v.getError('contactos') }}
    </div>

    <button type="submit" :disabled="!v.isValid">Guardar Todo</button>
  </form>
</template>

<script setup>
import { useValidator, required, each, mobile, minItems } from 'arv-validate-vue'

const v = useValidator(
  {
    contactos: [
      { numero: '' }
    ]
  },
  {
    contactos: [
      minItems(1, 'Debe registrar al menos un teléfono'),
      each({
        numero: [required('El número es obligatorio'), mobile('Debe ser un número móvil válido de 9 dígitos')]
      })
    ]
  }
)

const agregarFila = () => {
  v.values.contactos.push({ numero: '' })
}

const removerFila = (index) => {
  v.values.contactos.splice(index, 1)
  v.validateField('contactos')
}

const guardarTelefonos = async () => {
  if (await v.validate()) {
    console.log('Contactos:', v.getPayload())
  }
}
</script>
```

---

## Ejemplo 6: Confirmación de Contraseñas (`sameAs`)

Validación cruzada automática en tiempo real. Cuando la contraseña principal cambia, la regla de confirmación se revalida automáticamente.

```html
<template>
  <form @submit.prevent="cambiarClave">
    <div class="campo">
      <label>Nueva Contraseña</label>
      <input
        type="password"
        v-model="v.values.clave"
        @blur="v.touch('clave')"
      />
      <span v-if="v.hasError('clave')">{{ v.getError('clave') }}</span>
    </div>

    <div class="campo">
      <label>Confirmar Nueva Contraseña</label>
      <input
        type="password"
        v-model="v.values.confirmarClave"
        @blur="v.touch('confirmarClave')"
      />
      <span v-if="v.hasError('confirmarClave')">{{ v.getError('confirmarClave') }}</span>
    </div>

    <button type="submit" :disabled="!v.isValid">Actualizar Contraseña</button>
  </form>
</template>

<script setup>
import { useValidator, required, minLength, sameAs } from 'arv-validate-vue'

const v = useValidator(
  {
    clave: '',
    confirmarClave: ''
  },
  {
    clave: [required('Ingresa la contraseña'), minLength(6, 'Mínimo 6 caracteres')],
    confirmarClave: [
      required('Confirma tu contraseña'),
      sameAs('clave', 'Las contraseñas no coinciden')
    ]
  }
)

const cambiarClave = async () => {
  if (await v.validate()) {
    console.log('Clave actualizada correctamente')
  }
}
</script>
```

---

## Ejemplo 7: Sanitización de Datos para la API con `getPayload()`

Los transformadores limpian y convierten tipos de datos (strings en minúsculas, números formateados, fechas ISO) en el payload devuelto por `v.getPayload()`, sin alterar la entrada del usuario en la pantalla ni provocar saltos de cursor.

```javascript
import { useValidator, required, email, trim, toLowerCase, toFloat, toDate } from 'arv-validate-vue'

const v = useValidator(
  {
    correo: '  PEDRO@HOTMAIL.COM  ',
    monto: '1250.50',
    fechaPago: '2026-10-25'
  },
  {
    correo: [required(), email(), trim(), toLowerCase()],
    monto: [required(), toFloat()],
    fechaPago: [required(), toDate()]
  }
)

// Lo que el usuario ve en pantalla:
console.log(v.values.correo) // "  PEDRO@HOTMAIL.COM  "

// Lo que envías al backend al guardar:
const payload = v.getPayload()
console.log(payload)
/*
Resultado listo para API:
{
  correo: "pedro@hotmail.com",
  monto: 1250.5,
  fechaPago: "2026-10-25"
}
*/
```

---

## Ejemplo 8: Uso en Stores de Pinia y `dispose()`

Si gestionas formularios compartidos a nivel global dentro de un Store de Pinia (fuera del ciclo de vida de un componente), puedes usar `v.dispose()` para liberar las suscripciones al cerrar sesión o destruir el estado:

```javascript
import { defineStore } from 'pinia'
import { useValidator, required, email } from 'arv-validate-vue'

export const useCheckoutStore = defineStore('checkout', () => {
  const v = useValidator(
    {
      titular: '',
      correo: ''
    },
    {
      titular: [required('El titular es obligatorio')],
      correo: [required(), email()]
    }
  )

  // Acción para limpiar y liberar recursos manualmente
  const resetearCheckout = () => {
    v.reset() // Restaura los valores iniciales
    v.dispose() // Desuscribe listeners reactivos si destruyes el store
  }

  return {
    v,
    resetearCheckout
  }
})
```

---

## Ejemplo 9: Componente de Input Reutilizable (`AppInput.vue`)

Creación de un componente de input genérico que aprovecha los helpers `hasError` y `getError`.

### `components/AppInput.vue`
```html
<template>
  <div class="input-group" :class="{ 'has-error': validator.hasError(name) }">
    <label v-if="label" :for="name">{{ label }}</label>
    <input
      :id="name"
      :type="type"
      v-model="validator.values[name]"
      :placeholder="placeholder"
      @blur="validator.touch(name)"
    />
    <span v-if="validator.hasError(name)" class="error-msg">
      {{ validator.getError(name) }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  validator: { type: Object, required: true },
  name: { type: String, required: true },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' }
})
</script>
```

### Uso en cualquier vista:
```html
<template>
  <form @submit.prevent="guardar">
    <AppInput :validator="v" name="nombre" label="Nombre" placeholder="Tu nombre" />
    <AppInput :validator="v" name="correo" label="Correo" type="email" placeholder="tu@email.com" />
    <button type="submit" :disabled="!v.isValid">Guardar</button>
  </form>
</template>

<script setup>
import { useValidator, required, email } from 'arv-validate-vue'
import AppInput from './components/AppInput.vue'

const v = useValidator(
  { nombre: '', correo: '' },
  {
    nombre: [required('Nombre requerido')],
    correo: [required('Correo requerido'), email('Correo inválido')]
  }
)

const guardar = async () => {
  if (await v.validate()) {
    console.log('Enviando:', v.getPayload())
  }
}
</script>
```

---

## 12. Referencia de la API de `useValidator`

```javascript
const v = useValidator(initialData, schema, options)
```

| Propiedad / Método | Tipo | Descripción |
|---|---|---|
| `v.values` | `Proxy (reactive)` | Proxy reactivo bidireccional vinculado al formulario (`v-model`). |
| `v.isValid` | `boolean` | `true` si todo el formulario es válido (reactivo en templates y watch). |
| `v.isDirty` | `boolean` | `true` si algún valor ha sido modificado por el usuario. |
| `v.hasError(campo)` | `(campo: string) => boolean` | Retorna `true` solo si el campo fue tocado y tiene error. |
| `v.getError(campo)` | `(campo: string) => string \| null` | Mensaje de error del campo si fue tocado; de lo contrario `null`. |
| `v.isValidating(campo?)` | `(campo?: string) => boolean` | `true` si hay una validación asíncrona (backend) en curso. |
| `v.touch(campo)` | `(campo: string) => void` | Marca un campo como tocado y valida su estado. |
| `v.untouch(campo)` | `(campo: string) => void` | Desmarca el campo como tocado (oculta el error visual). |
| `v.validate()` | `() => Promise<boolean>` | Toca todos los campos y ejecuta todas las validaciones síncronas/asíncronas. |
| `v.validateField(campo)` | `(campo: string) => Promise<boolean>` | Valida un campo específico inmediatamente. |
| `v.reset(newValues?)` | `(newValues?: object) => void` | Restaura el formulario a su estado inicial limpio o a nuevos datos. |
| `v.setValues(patch)` | `(patch: object) => void` | Actualiza múltiples campos a la vez de forma reactiva. |
| `v.getPayload(customFn?)` | `(fn?: Function) => object` | Retorna copia limpia y tipada con transformadores aplicados para el backend. |
| `v.dispose()` | `() => void` | Cancela suscripciones reactivas (para stores de Pinia o servicios fuera de componentes). |
| `v.core` | `ValidatorInstance` | Instancia subyacente pura de `arv-validate`. |
