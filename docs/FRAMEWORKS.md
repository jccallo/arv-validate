# 🌐 Guía Universal de Integración Multi-Framework
## (Vue 3 / Quasar • React • Angular)

Esta guía documenta todo lo necesario para utilizar la suite de validación y transformación reactiva en los **3 frameworks más populares del ecosistema web** sin olvidar ningún detalle.

---

## 💡 Filosofía: Arquitectura Agnóstica y Patrón Adapter

El **95% del código** es **JavaScript Moderno Puro (Vanilla JS)** y **NO requiere instalar ninguna dependencia de npm** (cero dependencias de Yup, Zod, Vuelidate o Formik):

* 🧠 **`core.js`**: Motor reactivo puro (ES6 Proxies, WeakMap, grafo de dependencias $O(1)$, prevención de carreras asíncronas).
* 📐 **`rules.js`**: Reglas matemáticas, lógicas, condicionales y transformadores atómicos (SOLID / SRP).
* 💬 **`messages.js`**: Catálogo centralizado de mensajes e internacionalización (i18n).

Lo **ÚNICO** que cambia entre un framework y otro es el **Adaptador de Vista**: un pequeño archivo o hook de ~25 líneas que conecta el método universal `v.subscribe()` con la reactividad nativa de cada tecnología.

```
                    ┌─────────────────────────┐
                    │       core.js           │
                    │   (Motor Agnóstico)     │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │   Vue 3     │         │    React    │         │   Angular   │
  │ Composable  │         │ Custom Hook │         │ Signals/RxJS│
  │useValidator │         │useValidator │         │  Component  │
  └─────────────┘         └─────────────┘         └─────────────┘
```

---

## 📦 Checklist de Archivos a Copiar según tu Proyecto

Cuando inicies un nuevo proyecto en cualquier tecnología, copia los archivos a una carpeta como `src/validator/`:

| Archivo | Rol | ¿Dónde se usa? |
| :--- | :--- | :--- |
| **`core.js`** | Motor agnóstico central | **100% idéntico** en Vue, React, Angular y Node.js. |
| **`rules.js`** | Reglas y transformadores | **100% idéntico** en Vue, React, Angular y Node.js. |
| **`messages.js`** | Textos y traducciones | **100% idéntico** en Vue, React, Angular y Node.js. |
| **`useValidator.js`** | Adaptador para **Vue 3** | Proyectos Vue 3, Vite, Nuxt 3 o Quasar. |
| **`useValidator.jsx`** / **`.ts`** | Adaptador para **React** | Proyectos React 16.8+, 18, 19, Next.js, Vite. |
| **`Signals / RxJS`** | Adaptador para **Angular** | Proyectos Angular 2+ hasta Angular 19+. |

---

## 🟢 1. Implementación en Vue 3 y Quasar

### A) El Adaptador (`validator/useValidator.js`)
*Ya incluido en este repositorio*. Conecta `core.js` con las funciones reactivas nativas de Vue (`reactive`, `computed`, `onUnmounted`):

```javascript
import { reactive, computed, onUnmounted } from 'vue'
import { createValidator } from './core.js'

export function useValidator(initialData = {}, schema = {}, options = {}) {
  const v = createValidator(initialData, schema, options)

  const vState = reactive({
    errors: { ...v.state.errors },
    touched: { ...v.state.touched },
    validating: { ...v.state.validating },
    isValid: v.state.isValid,
    isDirty: v.state.isDirty
  })

  // Sincronización automática con el motor agnóstico
  const unsubscribe = v.subscribe((newState) => {
    Object.assign(vState.errors, newState.errors)
    Object.assign(vState.touched, newState.touched)
    Object.assign(vState.validating, newState.validating)
    vState.isValid = newState.isValid
    vState.isDirty = newState.isDirty
  })

  // Limpieza automática al destruir el componente (si está dentro de setup)
  if (getCurrentInstance()) {
    onUnmounted(() => unsubscribe())
  }

  return {
    values: reactive(v.values),
    touch: v.touch,
    untouch: v.untouch,
    validate: v.validate,
    reset: v.reset,
    setValues: v.setValues,
    getPayload: v.getPayload,
    hasError: (field) => Boolean(vState.touched[field] && vState.errors[field]),
    getError: (field) => (vState.touched[field] ? vState.errors[field] : null),
    isValidating: (field) => field ? Boolean(vState.validating[field]) : Object.values(vState.validating).some(Boolean),
    get isValid() { return vState.isValid },
    get isDirty() { return vState.isDirty },
    dispose: unsubscribe
  }
}
```

---

### B) Uso en Composition API (`<script setup>`)
```html
<template>
  <q-form @submit.prevent="guardar">
    <!-- Input con Quasar Framework -->
    <q-input
      v-model="v.values.correo"
      label="Correo Electrónico *"
      :error="v.hasError('correo')"
      :error-message="v.getError('correo')"
      :loading="v.isValidating('correo')"
      @blur="v.touch('correo')"
    />

    <q-input
      v-model="v.values.dni"
      label="DNI (8 dígitos) *"
      maxlength="8"
      :error="v.hasError('dni')"
      :error-message="v.getError('dni')"
      @blur="v.touch('dni')"
    />

    <q-btn type="submit" label="Guardar" color="primary" />
    <q-btn flat label="Limpiar" @click="v.reset()" />
  </q-form>
</template>

<script setup>
import { useValidator } from './validator/useValidator.js'
import { required, email, dni, toLowerCase, trim, digitsOnly } from './validator/rules.js'

const v = useValidator(
  {
    correo: '',
    dni: ''
  },
  {
    correo: [required(), email(), toLowerCase(), trim()],
    dni: [required(), dni(), digitsOnly()]
  }
)

const guardar = async () => {
  // 1. Validar todo el formulario al enviar
  const ok = await v.validate()
  if (!ok) return

  // 2. Obtener el payload sanitizado (trims, minúsculas, etc.)
  const payload = v.getPayload()
  console.log('Payload listo para enviar a la API:', payload)
}
</script>
```

---

### C) Uso en Options API Tradicional (`export default { ... }`)
Para componentes heredados o proyectos grandes basados en Options API (como módulos de Intranet):

```javascript
import { useValidator } from './validator/useValidator.js'
import { required, email, dni, toLowerCase, trim } from './validator/rules.js'

export default {
  name: 'SolicitudBeca',

  // Conectar mediante setup()
  setup() {
    const v = useValidator(
      { correo: '', dni: '' },
      {
        correo: [required(), email(), toLowerCase(), trim()],
        dni: [required(), dni()]
      }
    )

    // Al retornarlo, queda disponible tanto en el template como en "this.v"
    return { v }
  },

  data() {
    return {
      cargando: false
    }
  },

  methods: {
    async guardar() {
      // Usar directamente con this.v
      if (await this.v.validate()) {
        const payload = this.v.getPayload()
        await this.$http.post('/api/becas', payload)
      }
    }
  }
}
```

---

## ⚛️ 2. Implementación en React (React 16.8+, 18, 19, Next.js, Vite)

### A) El Adaptador (`useValidator.jsx` o `useValidator.ts`)
Copia este archivo en tu proyecto de React (ej. `src/hooks/useValidator.js`):

```javascript
import { useState, useEffect, useRef, useCallback } from 'react'
import { createValidator } from '../validator/core.js'

export function useValidator(initialData = {}, schema = {}, options = {}) {
  // 1. Instanciar el validador una sola vez en el ciclo de vida del componente
  const vRef = useRef(null)
  if (!vRef.current) {
    vRef.current = createValidator(initialData, schema, options)
  }
  const v = vRef.current

  // 2. Estado local de React para disparar re-renderizados solo cuando cambia el estado
  const [state, setState] = useState({ ...v.state })

  // 3. Suscripción con limpieza garantizada
  useEffect(() => {
    const unsubscribe = v.subscribe((newState) => {
      setState({ ...newState })
    })
    return () => unsubscribe() // Limpieza al desmontar
  }, [v])

  return {
    values: v.values,
    errors: state.errors,
    touched: state.touched,
    validating: state.validating,
    isValid: state.isValid,
    isDirty: state.isDirty,
    touch: v.touch,
    untouch: v.untouch,
    validate: v.validate,
    reset: v.reset,
    setValues: v.setValues,
    getPayload: v.getPayload,
    hasError: useCallback((field) => Boolean(state.touched[field] && state.errors[field]), [state]),
    getError: useCallback((field) => (state.touched[field] ? state.errors[field] : null), [state]),
    isValidating: useCallback((field) => field ? Boolean(state.validating[field]) : Object.values(state.validating).some(Boolean), [state])
  }
}
```

---

### B) Componente Completo en React
```jsx
import React from 'react'
import { useValidator } from './hooks/useValidator'
import { required, email, dni, toLowerCase, trim, digitsOnly } from './validator/rules'

export function FormularioCliente() {
  const v = useValidator(
    { correo: '', dni: '' },
    {
      correo: [required(), email(), toLowerCase(), trim()],
      dni: [required(), dni(), digitsOnly()]
    }
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (await v.validate()) {
      const payload = v.getPayload()
      console.log('Enviando a API:', payload)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* Campo Correo */}
      <div>
        <label>Correo Electrónico:</label>
        <input
          type="text"
          value={v.values.correo}
          onChange={(e) => { v.values.correo = e.target.value }}
          onBlur={() => v.touch('correo')}
          style={{ width: '100%', borderColor: v.hasError('correo') ? 'red' : '#ccc' }}
        />
        {v.hasError('correo') && (
          <span style={{ color: 'red', fontSize: '12px' }}>{v.getError('correo')}</span>
        )}
      </div>

      {/* Campo DNI */}
      <div>
        <label>DNI:</label>
        <input
          type="text"
          maxLength={8}
          value={v.values.dni}
          onChange={(e) => { v.values.dni = e.target.value }}
          onBlur={() => v.touch('dni')}
          style={{ width: '100%', borderColor: v.hasError('dni') ? 'red' : '#ccc' }}
        />
        {v.hasError('dni') && (
          <span style={{ color: 'red', fontSize: '12px' }}>{v.getError('dni')}</span>
        )}
      </div>

      <button type="submit" disabled={!v.isValid}>
        Guardar
      </button>
      <button type="button" onClick={() => v.reset()}>
        Restablecer
      </button>
    </form>
  )
}
```

> **Consejo Clave en React**: Al escribir en el input, muta directamente el proxy `v.values.campo = e.target.value`. Gracias a la arquitectura por Proxy, no se re-formatea el texto en cada tecla y se evita el salto del cursor. Toda la transformación se aplica de forma segura en `v.getPayload()`.

---

## 🅰️ 3. Implementación en Angular (Angular 2+ hasta Angular 19+)

### Opción A: Angular Moderno (Angular 16, 17, 18, 19+ con Signals ⚡)
Angular 16 introdujo **Signals**, lo que permite una integración extremadamente limpia y reactiva:

```typescript
import { Component, signal, computed, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { createValidator } from './validator/core'
import { required, email, dni, toLowerCase, trim } from './validator/rules'

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()">
      <!-- Campo Correo -->
      <div>
        <label>Correo:</label>
        <input
          [(ngModel)]="v.values.correo"
          name="correo"
          (blur)="v.touch('correo')"
        />
        <span *ngIf="hasError('correo')" class="error">
          {{ getError('correo') }}
        </span>
      </div>

      <!-- Campo DNI -->
      <div>
        <label>DNI:</label>
        <input
          [(ngModel)]="v.values.dni"
          name="dni"
          maxlength="8"
          (blur)="v.touch('dni')"
        />
        <span *ngIf="hasError('dni')" class="error">
          {{ getError('dni') }}
        </span>
      </div>

      <button type="submit">Enviar</button>
    </form>
  `,
  styles: [`
    .error { color: #dc3545; font-size: 12px; display: block; }
  `]
})
export class RegistroComponent implements OnDestroy {
  // 1. Instanciamos el validador agnóstico
  v = createValidator(
    { correo: '', dni: '' },
    {
      correo: [required(), email(), toLowerCase(), trim()],
      dni: [required(), dni()]
    }
  )

  // 2. Conectamos el estado agnóstico a un Signal de Angular
  vState = signal(this.v.state)

  // 3. Suscripción reactiva
  private unsub = this.v.subscribe((newState) => {
    this.vState.set({ ...newState })
  })

  // Helpers para el template
  hasError(field: string): boolean {
    const s = this.vState()
    return Boolean(s.touched[field] && s.errors[field])
  }

  getError(field: string): string | null {
    const s = this.vState()
    return s.touched[field] ? s.errors[field] : null
  }

  // 4. Limpieza garantizada al destruir el componente
  ngOnDestroy() {
    this.unsub()
  }

  async onSubmit() {
    if (await this.v.validate()) {
      const payload = this.v.getPayload()
      console.log('Payload listo para HttpClient:', payload)
    }
  }
}
```

---

### Opción B: Angular Clásico (Angular 2 hasta 15 con RxJS 🔄)
Si estás en una versión previa a Signals, se conecta directamente a un `BehaviorSubject` de RxJS para usarlo con el pipe `| async`:

```typescript
import { Component, OnDestroy } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { createValidator } from './validator/core'
import { required, dni } from './validator/rules'

@Component({
  selector: 'app-estudiante',
  template: `
    <ng-container *ngIf="state$ | async as s">
      <div>
        <input [(ngModel)]="v.values.dni" (blur)="v.touch('dni')" />
        <span *ngIf="s.touched['dni'] && s.errors['dni']" class="error">
          {{ s.errors['dni'] }}
        </span>
      </div>
      <button (click)="guardar()">Guardar</button>
    </ng-container>
  `
})
export class EstudianteComponent implements OnDestroy {
  v = createValidator({ dni: '' }, { dni: [required(), dni()] })
  state$ = new BehaviorSubject(this.v.state)
  private unsub = this.v.subscribe((s) => this.state$.next({ ...s }))

  ngOnDestroy() {
    this.unsub() // Cero fugas de memoria
  }

  async guardar() {
    if (await this.v.validate()) {
      const payload = this.v.getPayload()
      // Enviar con this.http.post(...)
    }
  }
}
```

---

## 🛠️ Cheat Sheet: Métodos Universales del Validador

Todos los adaptadores exponen exactamente la misma interfaz para el desarrollador:

| Método / Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `v.values` | `Proxy` | Objeto reactivo bidireccional. Asigna con `v.values.campo = '...'` y soporta dot notation anidada. |
| `v.touch('campo')` | `Function` | Se llama en el evento `@blur` / `onBlur` para marcar el campo como tocado y mostrar su error. |
| `v.untouch('campo')`| `Function` | Oculta el mensaje de error del campo apagando la marca `touched`. |
| `v.hasError('campo')` | `Boolean` | Retorna `true` **únicamente si** el campo fue tocado y tiene un error activo. |
| `v.getError('campo')` | `String \| null`| Retorna el texto del error si fue tocado, o `null` si está limpio. |
| `v.isValidating('campo')` | `Boolean` | Retorna `true` si una regla asíncrona (backend) está consultando en ese momento. |
| `await v.validate()` | `Promise<Boolean>`| Marca **todos** los campos como tocados y valida en paralelo. Retorna `true` si todo es válido. |
| `v.getPayload()` | `Object` | **El paso más importante**: Extrae el clon final con todos los `trim()`, `toFloat()`, `toLowerCase()`, etc., aplicados. |
| `v.reset(nuevosValores?)` | `Function` | Restablece el formulario a sus valores iniciales y borra todos los errores. |
| `v.setValues(patch)` | `Function` | Actualiza múltiples campos a la vez sin perder reactividad. |
| `v.isValid` | `Boolean` | `true` si no hay ningún error pendiente en todo el formulario. |
| `v.isDirty` | `Boolean` | `true` si el usuario ha modificado al menos un campo del formulario. |

---

## 🌟 Las 3 Reglas de Oro

1. **Nunca envíes `v.values` a la API; siempre envía `v.getPayload()`**:
   * `v.values` contiene el texto tal como lo tipea el usuario (sin interferir con el cursor).
   * `v.getPayload()` aplica todas las transformaciones sanitizadas (`toFloat()`, `round()`, `trim()`, `toLowerCase()`, `digitsOnly()`, etc.).
2. **Si creas una nueva regla de negocio, agrégala en `rules.js`**:
   * Al estar desacoplada, quedará inmediatamente disponible para **Vue, React, Angular y Node.js** sin tener que programarla tres veces.
3. **No olvides desuscribirte al desmontar el componente**:
   * Los adaptadores de Vue (`useValidator.js`) y React (`useValidator.jsx`) ya lo hacen automáticamente con `onUnmounted` y `useEffect`.
   * En Angular, simplemente llama a `this.unsub()` dentro del hook `ngOnDestroy()`.
