# arv-validate

> Ultra-fast, zero-dependency, atomic, reactive form validation and data sanitization engine for JavaScript and TypeScript.

[![npm version](https://img.shields.io/npm/v/arv-validate.svg)](https://www.npmjs.com/package/arv-validate)
[![license](https://img.shields.io/npm/l/arv-validate.svg)](https://github.com/jccallo/arv-validate/blob/main/LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](https://www.npmjs.com/package/arv-validate)
[![TypeScript](https://img.shields.io/badge/types-included-blue.svg)](https://www.npmjs.com/package/arv-validate)

[English](https://github.com/jccallo/arv-validate/blob/main/README.md) | [Español](https://github.com/jccallo/arv-validate/blob/main/README.es.md)

`arv-validate` is **100% framework-agnostic**. It runs in Vanilla JS, Vue 3, React, Angular, Svelte, Node.js, Bun, browsers, or Web Workers.

---

## Installation

```bash
npm install arv-validate
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

// 1. Live mutations automatically revalidate in real-time
validator.values.name = 'John Doe'
validator.values.email = 'john@example.com'

// 2. Validate all fields (e.g. before submitting)
const isValid = await validator.validate()

// 3. Inspect errors
console.log(validator.state.errors)

// 4. Get sanitized, typed payload ready for API request
const payload = validator.getPayload()
console.log(payload) // { name: "John Doe", email: "john@example.com" }
```

---

## Key Features

- ⚡ **Real-Time Live Validation**: Deep recursive ES6 Proxy tracks mutations instantly and recalculates only affected fields.
- 🌐 **Built-in i18n**: English by default, Spanish built-in (`setLocale('es')`), and custom dictionary support via `configureMessages()`.
- 🔌 **100% Framework Agnostic**: Zero DOM dependencies. Use anywhere in JavaScript or TypeScript.
- 🧩 **40+ Built-in Rules**: `required`, `email`, `minLength`, `maxLength`, `between`, `date`, `afterDate`, `sameAs`, `when`, `custom`, and more.
- 🔄 **Async Validation & Race-Condition Safe**: Handles promises with built-in stale token invalidation (e.g. username availability check).
- 🧹 **Transformers & Sanitization**: `trim()`, `toLowerCase()`, `toFloat()`, `round()`, `digitsOnly()`, `toDate()` without altering UI input values.
- 🌳 **Nested Objects & Arrays**: Full dot-notation support (`'user.address.zipCode'`) and dynamic arrays (`each()`).
- 📦 **Zero Dependencies**: Pure modern JavaScript (~6 kB gzipped).

---

## Internationalization (i18n)

Switch between languages or provide custom messages:

```javascript
import { setLocale, configureMessages } from 'arv-validate'

// Switch to Spanish
setLocale('es')

// Switch back to English (default)
setLocale('en')

// Override individual messages globally
configureMessages({
  required: 'Field is required',
  email: 'Must be a valid email address'
})
```

---

## Available Adapters

| Framework | Package | Installation |
|---|---|---|
| **Vanilla JS / Node.js** | `arv-validate` | `npm i arv-validate` |
| **Vue 3** | `arv-validate-vue` | `npm i arv-validate-vue` |
| **React** | `@arv-validate/react` | *(Coming soon)* |
| **Angular** | `@arv-validate/angular` | *(Coming soon)* |

---

## API Reference

`createValidator(initialData, schema, options)` returns:

- `v.values`: Reactive live-editing proxy (supports nested dot-notation).
- `v.state`: Flat state snapshot `{ values, errors, touched, validating, isValid, isDirty }`.
- `v.validate()`: Marks all fields as touched, executes synchronous and asynchronous rules, returns `Promise<boolean>`.
- `v.validateField(field)`: Validates a single field immediately.
- `v.touch(field)`: Marks field as touched (`@blur`).
- `v.untouch(field)`: Unmarks field as touched.
- `v.hasError(field)`: Returns `true` if field is touched and has an error.
- `v.getError(field)`: Returns error message or `null`.
- `v.isValidating(field?)`: Returns `true` if an async rule is in-flight.
- `v.getPayload(customFn?)`: Returns sanitized and transformed object for API calls.
- `v.reset(newValues?)`: Resets state to clean initial values or updates with new data.
- `v.setValues(patch)`: Updates multiple fields simultaneously.
- `v.subscribe(callback)`: Registers a state change listener, returns unsubscribe function.

---

## Documentation

- 📖 [Comprehensive Documentation (English)](https://github.com/jccallo/arv-validate/blob/main/docs/DOCUMENTATION.md)
- 📗 [Documentación Completa en Español](https://github.com/jccallo/arv-validate/blob/main/docs/DOCUMENTACION.md)
- 📋 [Rules & Transformers Catalog (English)](https://github.com/jccallo/arv-validate/blob/main/docs/RULES.md)
- 📋 [Catálogo de Reglas y Transformadores (Español)](https://github.com/jccallo/arv-validate/blob/main/docs/REGLAS.md)

---

## License

MIT © [jccallo](https://github.com/jccallo)
