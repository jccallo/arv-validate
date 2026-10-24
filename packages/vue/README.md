# arv-validate-vue

> Official reactive [Vue 3](https://vuejs.org/) adapter for [arv-validate](https://www.npmjs.com/package/arv-validate) using the Composition API (`<script setup>`).

[![npm version](https://img.shields.io/npm/v/arv-validate-vue.svg)](https://www.npmjs.com/package/arv-validate-vue)
[![license](https://img.shields.io/npm/l/arv-validate-vue.svg)](https://github.com/jccallo/arv-validate/blob/main/LICENSE)
[![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)

[English](https://github.com/jccallo/arv-validate/blob/main/README.md) | [Español](https://github.com/jccallo/arv-validate/blob/main/README.es.md)

---

## Installation

```bash
npm install arv-validate arv-validate-vue
```

---

## Quick Start

```html
<script setup>
import { useValidator, required, email, minLength, trim } from 'arv-validate-vue'

const v = useValidator(
  {
    username: '',
    email: ''
  },
  {
    username: [required(), minLength(3), trim()],
    email: [required(), email(), trim()]
  }
)

const onSubmit = async () => {
  const isValid = await v.validate()
  if (!isValid) return

  // Clean, sanitized data ready for backend API
  const payload = v.getPayload()
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="form">
    <div class="form-group">
      <label for="username">Username</label>
      <input
        id="username"
        v-model="v.values.username"
        @blur="v.touch('username')"
        :class="{ 'is-invalid': v.hasError('username') }"
      />
      <span v-if="v.hasError('username')" class="error-text">
        {{ v.getError('username') }}
      </span>
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        v-model="v.values.email"
        @blur="v.touch('email')"
        :class="{ 'is-invalid': v.hasError('email') }"
      />
      <span v-if="v.hasError('email')" class="error-text">
        {{ v.getError('email') }}
      </span>
    </div>

    <button type="submit" :disabled="!v.isValid">
      Submit
    </button>
  </form>
</template>
```

---

## Key Features

- 🔄 **Native Vue 3 Reactivity**: Built directly on Vue 3's `reactive` and `computed` primitives.
- ⚡ **Live Real-Time Validation**: Instant feedback as user types or on blur.
- 🧹 **Automatic Cleanup**: Automatically unregisters listeners on `onUnmounted`. No memory leaks.
- 📦 **All-in-One Export**: Re-exports all core rules, transformers, and i18n helpers. Just import from `'arv-validate-vue'`.

---

## Usage Outside Components (e.g. Pinia Stores)

In Vue components (`<script setup>`), cleanup is **100% automatic**. When creating a validator outside of component lifecycles (like in a Pinia store or composable module), call `v.dispose()` to release subscriptions:

```javascript
import { defineStore } from 'pinia'
import { useValidator, required, email } from 'arv-validate-vue'

export const useAuthStore = defineStore('auth', () => {
  const v = useValidator(
    { email: '', password: '' },
    {
      email: [required(), email()],
      password: [required()]
    }
  )

  const logout = () => {
    v.dispose() // Manually cleans up listeners on logout
  }

  return { v, logout }
})
```

---

## API Reference (`useValidator`)

`useValidator(initialData, schema, options)` returns:

| Property | Type | Description |
|---|---|---|
| `v.values` | `Proxy (reactive)` | Two-way reactive values object (`v-model`) |
| `v.isValid` | `boolean` | Is form valid? (reactive in templates and computed) |
| `v.isDirty` | `boolean` | Has any value been modified? (reactive) |
| `v.hasError(field)` | `function` | Does field have an error and has been touched? (reactive) |
| `v.getError(field)` | `function` | Error message string or `null` (reactive) |
| `v.isValidating(field?)` | `function` | Is an async validation rule running? |
| `v.touch(field)` | `function` | Mark field as touched (`@blur`) |
| `v.untouch(field)` | `function` | Unmark field as touched |
| `v.validate()` | `async function` | Touches all fields and runs all validations |
| `v.reset(newValues?)` | `function` | Resets form to clean initial snapshot or updates with new values |
| `v.setValues(patch)` | `function` | Updates multiple fields simultaneously |
| `v.getPayload()` | `function` | Returns sanitized data ready for API |
| `v.dispose()` | `function` | Manual subscription cleanup |

---

## Documentation

- ⚡ **[Full Vue 3 Guide with 9 Examples (English)](https://github.com/jccallo/arv-validate/blob/main/docs/VUE.en.md)**
- ⚡ **[Guía Completa para Vue 3 en Español](https://github.com/jccallo/arv-validate/blob/main/docs/VUE.md)**
- 📋 **[Rules & Transformers Catalog (English)](https://github.com/jccallo/arv-validate/blob/main/docs/RULES.md)**
- 📋 **[Catálogo de Reglas y Transformadores (Español)](https://github.com/jccallo/arv-validate/blob/main/docs/REGLAS.md)**
- 📖 **[Core Agnostic Documentation](https://github.com/jccallo/arv-validate/blob/main/docs/DOCUMENTATION.md)**

---

## License

MIT © [jccallo](https://github.com/jccallo)
