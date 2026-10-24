# Full Documentation — arv-validate

> Atomic, reactive, high-performance form validation and data sanitization engine.  
> Designed following **Clean Code**, **SOLID (SRP)**, and a **100% framework-agnostic** architecture, with official adapters for modern front-end frameworks.

[English](./DOCUMENTATION.md) | [Español](./DOCUMENTACION.md)

---

## 📑 Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Installation](#2-installation)
3. [Ecosystem & Framework Adapters](#3-ecosystem--framework-adapters)
4. [Core Architectural Concepts](#4-core-architectural-concepts)
5. [Practical Examples](#5-practical-examples)
   - [Example 1: Basic Synchronous Form](#example-1-basic-synchronous-form)
   - [Example 2: Nested Objects & Dot Notation](#example-2-nested-objects--dot-notation)
   - [Example 3: Conditional Validation with `when`](#example-3-conditional-validation-with-when)
   - [Example 4: Asynchronous Validation (Backend API Queries)](#example-4-asynchronous-validation-backend-api-queries)
   - [Example 5: Dynamic Arrays with `each`](#example-5-dynamic-arrays-with-each)
   - [Example 6: Cross-Field Validation (`sameAs`, `greaterThan`)](#example-6-cross-field-validation-sameas-greaterthan)
   - [Example 7: Dates, Times, and Age Limits](#example-7-dates-times-and-age-limits)
   - [Example 8: Transformation & Data Sanitization for APIs (`getPayload`)](#example-8-transformation--data-sanitization-for-apis-getpayload)
   - [Example 9: Creating Custom Validation Rules](#example-9-creating-custom-validation-rules)
   - [Example 10: Internationalization (i18n) & Global Messages](#example-10-internationalization-i18n--global-messages)
   - [Example 11: Manual On-Demand Validation (`live: false`)](#example-11-manual-on-demand-validation-live-false)
   - [Example 12: Custom Subscriptions & State Sync](#example-12-custom-subscriptions--state-sync)
6. [Validator API Reference](#6-validator-api-reference)
7. [Rules & Transformers Reference](#7-rules--transformers-reference)

---

## 1. Overview & Philosophy

`arv-validate` solves common form validation issues in modern web development:
* **True Decoupling**: The core validation engine has zero UI, DOM, or framework dependencies. It runs seamlessly in Node.js, Bun, Web Workers, browsers, or inside any view framework.
* **Single Responsibility Principle (SRP)**: Each rule checks exactly one condition (e.g., `required` only verifies presence, `email` only checks email format, `isNumber` only checks numeric types). Rules are composed into clean, readable arrays.
* **Separation of Visual UI and Clean API Payload**: Your UI displays the exact raw text the user typed without annoying cursor jumps or formatting fights, while `getPayload()` produces a pristine, sanitized, and typed object ready to send to your API.
* **O(1) Evaluation Performance**: Schema pre-compilation at initialization with an indexed dependency graph ensures only affected fields re-validate on mutation.
* **Race Condition Prevention**: An internal incremental token counter automatically discards delayed or out-of-order asynchronous responses when the user keeps typing.

---

## 2. Installation

### Core Agnostic Engine
```bash
npm install arv-validate
```

### For Vue 3 Projects
```bash
npm install arv-validate-vue
```

---

## 3. Ecosystem & Framework Adapters

| Framework | Package | Guide | Status |
|---|---|---|---|
| **Vue 3** | `arv-validate-vue` | 👉 **[Comprehensive Vue 3 Guide](./VUE.en.md)** | ✅ Available & Stable |
| **React** | `@arv-validate/react` | *Coming soon* | 🚧 In Development |
| **Angular** | `@arv-validate/angular` | *Coming soon* | 🚧 In Development |

---

## 4. Core Architectural Concepts

```
                        ┌─────────────────────────────────────┐
                        │      createValidator(data, schema)  │
                        └──────────────────┬──────────────────┘
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             ▼                             ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
   │    v.values       │         │     v.state       │         │   v.getPayload()  │
   │ Deep live proxy   │         │ Control state     │         │ Sanitized, typed  │
   │ read/write with   │         │ errors, touched,  │         │ payload for API   │
   │ dot-notation      │         │ validating, isValid│        │ (Axios/Fetch)     │
   └───────────────────┘         └───────────────────┘         └───────────────────┘
```

1. **`values`**: Deep recursive ES6 Proxy. Direct mutations (e.g., `v.values.name = 'Alice'`) revalidate the field in real-time, mark `isDirty = true`, and notify listeners.
2. **`touched`**: Tracks which fields have been interacted with (`blur` event or form submission).
3. **`hasError(field)`**: Returns `true` only if the field has an active error **and** has been touched. Prevents premature red borders before the user has touched the field.
4. **`getError(field)`**: Returns the current error message if touched, or `null`.
5. **`isValid`**: Instant boolean. Returns `true` when there are zero pending errors and no ongoing async rules.
6. **`getPayload()`**: Returns a clean payload applying all transformers (`trim`, `toLowerCase`, `toFloat`, etc.).

---

## 5. Practical Examples

### Example 1: Basic Synchronous Form

```javascript
import { createValidator, required, email, minLength, trim } from 'arv-validate'

const validator = createValidator(
  {
    name: '',
    email: ''
  },
  {
    name: [required('Name is required'), minLength(3, 'At least 3 characters'), trim()],
    email: [required('Email is required'), email('Invalid email format'), trim()]
  }
)

// 1. Initial state
console.log(validator.state.isValid) // false
console.log(validator.hasError('name')) // false (not touched yet)

// 2. Simulate blur on empty field
validator.touch('name')
console.log(validator.hasError('name')) // true
console.log(validator.getError('name')) // "Name is required"

// 3. Type valid value
validator.values.name = 'Carlos'
validator.values.email = 'carlos@example.com'

// 4. Validate complete form on submit
const isValid = await validator.validate()
console.log(isValid) // true
console.log(validator.getPayload()) // { name: "Carlos", email: "carlos@example.com" }
```

---

### Example 2: Nested Objects & Dot Notation

Full deep nested path support with standard dot notation:

```javascript
import { createValidator, required, email, minLength } from 'arv-validate'

const validator = createValidator(
  {
    user: {
      profile: {
        name: '',
        contact: { email: '' }
      }
    }
  },
  {
    'user.profile.name': [required('Name is required'), minLength(2)],
    'user.profile.contact.email': [required('Email is required'), email()]
  }
)

// Mutate through nested proxy
validator.values.user.profile.name = 'Lucia'
validator.values.user.profile.contact.email = 'lucia@example.com'

await validator.validate()
console.log(validator.state.isValid) // true
console.log(validator.getPayload())
/*
{
  user: {
    profile: {
      name: 'Lucia',
      contact: { email: 'lucia@example.com' }
    }
  }
}
*/
```

---

### Example 3: Conditional Validation with `when`

Enables or disables validation rules based on current form state. When the condition evaluates to `false`, errors on that field are cleared immediately.

```javascript
import { createValidator, required, when, length } from 'arv-validate'

const validator = createValidator(
  {
    accountType: 'PERSONAL', // or 'COMPANY'
    taxId: ''
  },
  {
    accountType: [required()],
    taxId: [
      when(all => all.accountType === 'COMPANY', [
        required('Tax ID is required for company accounts'),
        length(11, 'Tax ID must be 11 digits')
      ])
    ]
  }
)

// Scenario A: Personal account, taxId is optional
await validator.validate()
console.log(validator.state.isValid) // true

// Scenario B: Switching to Company triggers the conditional rules
validator.values.accountType = 'COMPANY'
await validator.validate()
console.log(validator.state.isValid) // false
console.log(validator.getError('taxId')) // "Tax ID is required for company accounts"

// Scenario C: Provide valid 11-digit tax ID
validator.values.taxId = '20123456789'
await validator.validate()
console.log(validator.state.isValid) // true
```

---

### Example 4: Asynchronous Validation (Backend API Queries)

Handles asynchronous operations with loading state (`isValidating`) and race-condition safety:

```javascript
import { createValidator, required, email, custom } from 'arv-validate'

// Asynchronous custom rule checking username availability
const checkEmailAvailability = custom(async (value) => {
  const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(value)}`)
  const data = await response.json()
  return data.available ? true : 'This email is already registered'
})

const validator = createValidator(
  { email: '' },
  { email: [required(), email(), checkEmailAvailability] }
)

// Live typing:
validator.values.email = 'newuser@example.com'

// Check if async query is in flight
console.log(validator.isValidating('email')) // true (while fetch is pending)

// Wait for completion
await validator.validate()
console.log(validator.isValidating('email')) // false
```

---

### Example 5: Dynamic Arrays with `each`

Validate dynamic lists of primitives or objects:

```javascript
import { createValidator, required, each, mobile, minItems } from 'arv-validate'

const validator = createValidator(
  {
    contacts: [
      { relation: '', phone: '' }
    ]
  },
  {
    contacts: [
      minItems(1, 'Please add at least one emergency contact'),
      each({
        relation: [required('Relation is required')],
        phone: [required(), mobile('Invalid mobile number')]
      })
    ]
  }
)

// Add a row dynamically
validator.values.contacts.push({ relation: 'Parent', phone: '987654321' })

await validator.validate()
console.log(validator.state.isValid) // false (first row is still incomplete)
console.log(validator.state.errors.contacts) // "Row 1: Relation is required"
```

---

### Example 6: Cross-Field Validation (`sameAs`, `greaterThan`)

The engine indexes cross-field dependencies so that modifying the referenced field automatically triggers re-validation:

```javascript
import { createValidator, required, minLength, sameAs, greaterThan } from 'arv-validate'

const validator = createValidator(
  {
    password: '',
    confirmPassword: '',
    minPrice: 100,
    maxPrice: 50
  },
  {
    password: [required(), minLength(6)],
    confirmPassword: [
      required('Please confirm your password'),
      sameAs('password', 'Passwords do not match')
    ],
    maxPrice: [
      required(),
      greaterThan('minPrice', 'Max price must be greater than min price')
    ]
  }
)

await validator.validate()
console.log(validator.getError('confirmPassword')) // "Passwords do not match"
console.log(validator.getError('maxPrice')) // "Max price must be greater than min price"

// Correcting maxPrice:
validator.values.maxPrice = 250
console.log(validator.state.errors.maxPrice) // null (automatically re-evaluated)
```

---

### Example 7: Dates, Times, and Age Limits

Real Gregorian calendar validation (leap years, month days, chronological comparisons):

```javascript
import { createValidator, required, date, afterDate, minAge, time } from 'arv-validate'

const validator = createValidator(
  {
    startDate: '2026-10-20',
    endDate: '2026-10-15', // Error: earlier than startDate
    birthDate: '2015-05-10',
    appointmentTime: '14:30'
  },
  {
    startDate: [required(), date('Invalid date')],
    endDate: [
      required(),
      date(),
      afterDate('startDate', 'End date must be after start date')
    ],
    birthDate: [
      required(),
      date(),
      minAge(18, 'You must be at least 18 years old')
    ],
    appointmentTime: [required(), time('Invalid time format (HH:mm)')]
  }
)

await validator.validate()
console.log(validator.getError('endDate')) // "End date must be after start date"
console.log(validator.getError('birthDate')) // "You must be at least 18 years old"
```

---

### Example 8: Transformation & Data Sanitization for APIs (`getPayload`)

Transformers prepare clean payloads without modifying on-screen inputs:

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

const validator = createValidator(
  {
    email: '  ALICE.SMITH@EXAMPLE.COM  ',
    amount: '  1499.856  ',
    phone: '(+1) 555-123-4567',
    registrationDate: '2026-10-23'
  },
  {
    email: [required(), email(), trim(), toLowerCase()],
    amount: [required(), toFloat(), round(2)],
    phone: [required(), digitsOnly()],
    registrationDate: [required(), toDate()]
  }
)

await validator.validate()

// Visual input remains untouched for optimal user typing experience:
console.log(validator.values.email) // "  ALICE.SMITH@EXAMPLE.COM  "
console.log(validator.values.phone) // "(+1) 555-123-4567"

// Payload prepared for backend API:
const payload = validator.getPayload()
console.log(payload)
/*
{
  email: "alice.smith@example.com",
  amount: 1499.86,
  phone: "15551234567",
  registrationDate: "2026-10-23"
}
*/
```

---

### Example 9: Creating Custom Validation Rules

A validation rule is simply a function that returns `true` or an error string:

```javascript
import { createValidator, required } from 'arv-validate'

// Simple custom rule
const isEven = (msg = 'Number must be even') => {
  return (value) => {
    if (value === null || value === undefined || value === '') return true // SRP: presence checked by required
    return Number(value) % 2 === 0 || msg
  }
}

// Rule with argument configuration
const allowedEmailDomain = (expectedDomain, msg) => {
  return (email) => {
    if (!email) return true
    return email.endsWith(`@${expectedDomain}`) || msg || `Email must belong to @${expectedDomain}`
  }
}

const validator = createValidator(
  {
    installments: 3,
    corporateEmail: 'user@gmail.com'
  },
  {
    installments: [required(), isEven('Installments must be an even number')],
    corporateEmail: [required(), allowedEmailDomain('mycompany.com')]
  }
)

await validator.validate()
console.log(validator.getError('installments')) // "Installments must be an even number"
console.log(validator.getError('corporateEmail')) // "Email must belong to @mycompany.com"
```

---

### Example 10: Internationalization (i18n) & Global Messages

Switch languages dynamically or provide global overrides:

```javascript
import { setLocale, configureMessages } from 'arv-validate'

// 1. Switch built-in locale to Spanish
setLocale('es')

// 2. Switch back to English (default)
setLocale('en')

// 3. Customize individual message strings or formatters globally
configureMessages({
  required: 'This field cannot be empty',
  email: 'Please provide a valid email',
  minLength: (min) => `Requires at least ${min} characters`
})
```

---

### Example 11: Manual On-Demand Validation (`live: false`)

Useful for multi-step wizards where real-time typing validation should be disabled:

```javascript
import { createValidator, required, email } from 'arv-validate'

const validator = createValidator(
  { step1: '', step2: '' },
  { step1: [required()], step2: [required(), email()] },
  { live: false } // Disable live validation on typing
)

validator.values.step1 = 'done'

// Validate only current step when user clicks "Next"
const isStep1Valid = await validator.validateField('step1')
if (isStep1Valid) {
  console.log('Proceed to step 2')
}
```

---

### Example 12: Custom Subscriptions & State Sync

Synchronize the validator state with any custom store, state management, or UI:

```javascript
import { createValidator, required } from 'arv-validate'

const v = createValidator({ search: '' }, { search: [required()] })

// Subscribe to state changes
const unsubscribe = v.subscribe((state) => {
  console.log('State updated:', {
    isValid: state.isValid,
    errors: state.errors,
    isDirty: state.isDirty
  })
})

v.values.search = 'JavaScript' // Automatically triggers listener

// Unsubscribe when done
unsubscribe()
```

---

## 6. Validator API Reference

### Constructor
```javascript
const v = createValidator(initialData = {}, schema = {}, options = {})
```

**Options:**
* `live` *(boolean, default `true`)*: Validates on live proxy mutations.

### Instance Members

| Member | Type | Description |
|---|---|---|
| `v.values` | `Proxy` | Live reactive read/write object supporting dot-notation. |
| `v.state` | `Object` | Flat state snapshot: `{ values, errors, touched, validating, isValid, isDirty }`. |
| `v.validate()` | `() => Promise<boolean>` | Marks all fields as `touched` and executes all validations. Returns `true` if valid. |
| `v.validateField(field)` | `(field: string) => Promise<boolean>` | Immediately validates a single field by key or dot-path. |
| `v.touch(field)` | `(field: string) => void` | Marks field as touched (`@blur`) and evaluates error state. |
| `v.untouch(field)` | `(field: string) => void` | Unmarks field as touched (hides error message). |
| `v.hasError(field)` | `(field: string) => boolean` | Returns `true` only if field has an error and has been touched. |
| `v.getError(field)` | `(field: string) => string \| null` | Returns error message string if touched, or `null`. |
| `v.isValidating(field?)` | `(field?: string) => boolean` | Returns `true` if an async rule is in-flight for this field (or any field). |
| `v.reset(newValues?)` | `(newValues?: object) => void` | Resets to clean initial state snapshot (mutation-proof) or new data. |
| `v.setValues(patch)` | `(patch: object) => void` | Patches multiple fields simultaneously (supports dot-notation). |
| `v.getPayload(customFn?)` | `(fn?: Function) => object` | Returns sanitized data object applying all schema transformers. |
| `v.subscribe(callback)` | `(cb: Function) => () => void` | Registers state change listener. Returns unsubscribe function. |

---

## 7. Rules & Transformers Reference

👉 **[View Full Catalog of Rules & Transformers (English)](./RULES.md)** | **[Ver Catálogo en Español (REGLAS.md)](./REGLAS.md)**

---

## License

MIT © [jccallo](https://github.com/jccallo)
