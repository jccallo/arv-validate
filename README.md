# arv-validate

> Ultra-fast, zero-dependency, atomic, reactive form validation and sanitization engine for modern JavaScript and TypeScript.

[![npm version](https://img.shields.io/npm/v/arv-validate.svg)](https://www.npmjs.com/package/arv-validate)
[![license](https://img.shields.io/npm/l/arv-validate.svg)](https://github.com/jccallo/arv-validate/blob/main/LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](https://www.npmjs.com/package/arv-validate)
[![TypeScript](https://img.shields.io/badge/types-included-blue.svg)](https://www.npmjs.com/package/arv-validate)

[English](https://github.com/jccallo/arv-validate/blob/main/README.md) | [Español](https://github.com/jccallo/arv-validate/blob/main/README.es.md)

📖 **[Full Documentation](./docs/DOCUMENTATION.md)** | 📗 **[Documentación en Español](./docs/DOCUMENTACION.md)**

---

## Highlights

- ⚡ **Real-time Live Validation** — Powered by ES6 Proxies. Errors appear and disappear instantaneously without UI lag.
- 🌐 **Built-in i18n (Internationalization)** — English by default, Spanish included (`setLocale('es')`), plus full custom message configuration.
- 🧩 **40+ Built-in Rules** — `required`, `email`, `date`, `when`, `sameAs`, `minAge`, `custom`, and more. Single Responsibility Principle (SRP).
- 🔄 **Async & Race-Condition Safe** — Built-in incremental token system discards stale API responses when typing fast.
- 🧹 **Pure Data Sanitization (`getPayload`)** — Format inputs visually on screen while getting clean, parsed, typed payloads for your API (Axios/Fetch).
- 🌳 **Deep Nested Objects & Arrays** — Full dot notation support (`'user.profile.name'`, `each()`).
- 📦 **Zero Dependencies** — Lightweight, tree-shakeable, and 100% framework-agnostic. Runs in Node.js, Bun, browsers, and workers.

---

## Installation

```bash
# Core engine (Agnostic / Vanilla JS / Node.js)
npm install arv-validate

# Vue 3 official adapter (Composition API)
npm install arv-validate-vue
```

---

## Quick Start

```javascript
import { createValidator, required, email, minLength, trim } from 'arv-validate'

const validator = createValidator(
  {
    name: '',
    email: ''
  },
  {
    name: [required(), minLength(3), trim()],
    email: [required(), email(), trim()]
  }
)

// 1. Live state binding
validator.values.name = 'Alice'
validator.values.email = 'alice@example.com'

// 2. Validate all fields (e.g., on form submit)
const isValid = await validator.validate()

if (isValid) {
  // Clean, sanitized data ready for backend API
  const payload = validator.getPayload()
  console.log('Sending payload:', payload)
} else {
  console.log('Validation errors:', validator.state.errors)
}
```

---

## Internationalization (i18n)

`arv-validate` supports multi-language error messages out of the box.

```javascript
import { setLocale, configureMessages } from 'arv-validate'

// Switch to Spanish
setLocale('es')

// Switch to English (default)
setLocale('en')

// Or customize individual messages globally
configureMessages({
  required: 'This field is required',
  email: 'Please enter a valid email address'
})
```

---

## Packages & Framework Adapters

| Package | Version | Description | Documentation |
|---|---|---|---|
| [`arv-validate`](./packages/core) | [![npm](https://img.shields.io/npm/v/arv-validate.svg)](https://www.npmjs.com/package/arv-validate) | Framework-agnostic core engine | [Core Docs](./packages/core/README.md) |
| [`arv-validate-vue`](./packages/vue) | [![npm](https://img.shields.io/npm/v/arv-validate-vue.svg)](https://www.npmjs.com/package/arv-validate-vue) | Official Vue 3 Composition API adapter | [Vue Guide](./docs/VUE.en.md) |
| `@arv-validate/react` | *Coming soon* | Official React hook adapter | *In progress* |
| `@arv-validate/angular` | *Coming soon* | Official Angular signal adapter | *In progress* |

---

## Vue 3 Example

```html
<script setup>
import { useValidator, required, email, minLength } from 'arv-validate-vue'

const v = useValidator(
  { username: '', email: '' },
  {
    username: [required(), minLength(3)],
    email: [required(), email()]
  }
)

const onSubmit = async () => {
  const isValid = await v.validate()
  if (!isValid) return
  await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(v.getPayload())
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="v.values.username" @blur="v.touch('username')" />
    <span v-if="v.hasError('username')">{{ v.getError('username') }}</span>

    <input v-model="v.values.email" @blur="v.touch('email')" />
    <span v-if="v.hasError('email')">{{ v.getError('email') }}</span>

    <button type="submit" :disabled="!v.isValid">Submit</button>
  </form>
</template>
```

---

## Documentation

- 📖 **[Full Agnostic Documentation (English)](./docs/DOCUMENTATION.md)**
- 📗 **[Documentación Completa en Español](./docs/DOCUMENTACION.md)**
- ⚡ **[Vue 3 Comprehensive Guide (English)](./docs/VUE.en.md)**
- ⚡ **[Guía para Vue 3 en Español](./docs/VUE.md)**
- 📋 **[Rules & Transformers Catalog (English)](./docs/RULES.md)**
- 📋 **[Catálogo de Reglas y Transformadores (Español)](./docs/REGLAS.md)**

---

## License

MIT © [jccallo](https://github.com/jccallo)
