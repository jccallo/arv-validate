# Complete Guide to Form Validation in Vue 3 (`arv-validate-vue`)

> Official reactive adapter of **`arv-validate`** for **Vue 3** (Composition API with `<script setup>`).  
> Delivers instantaneous two-way reactivity, live synchronous/asynchronous validation, and first-class TypeScript support.

[English](./VUE.en.md) | [Español](./VUE.md)

---

## 📑 Table of Contents

1. [Installation](#1-installation)
2. [Core Concepts & Workflow](#2-core-concepts--workflow)
3. [Example 1: Basic Registration Form](#example-1-basic-registration-form)
4. [Example 2: Nested Objects (Dot Notation)](#example-2-nested-objects-dot-notation)
5. [Example 3: Conditional Validation with `when`](#example-3-conditional-validation-with-when)
6. [Example 4: Async Validation with Backend API (Loading States)](#example-4-async-validation-with-backend-api-loading-states)
7. [Example 5: Dynamic Arrays with `each`](#example-5-dynamic-arrays-with-each)
8. [Example 6: Password Confirmation (`sameAs`)](#example-6-password-confirmation-sameas)
9. [Example 7: Data Sanitization for API with `getPayload()`](#example-7-data-sanitization-for-api-with-getpayload)
10. [Example 8: Using with Pinia Stores and `dispose()`](#example-8-using-with-pinia-stores-and-dispose)
11. [Example 9: Reusable Input Component (`AppInput.vue`)](#example-9-reusable-input-component-appinputvue)
12. [`useValidator` API Reference](#12-usevalidator-api-reference)

---

## 1. Installation

```bash
npm install arv-validate-vue
```

> **Note:** `arv-validate-vue` re-exports all core validation rules, transformers, and helpers. You only need to import from `'arv-validate-vue'`.

---

## 2. Core Concepts & Workflow

The `useValidator` composable connects the validation engine directly to Vue 3's reactivity system:

1. **`v.values`**: A two-way reactive object. Bind directly with `v-model="v.values.field"`.
2. **`v.touch(field)`**: Marks a field as touched on `@blur`. Errors are only shown once the user interacts with the input or on form submission.
3. **`v.hasError(field)`**: Returns `true` only if the field was touched and has an active validation error. Perfect for `:class="{ 'is-invalid': v.hasError(field) }"`.
4. **`v.getError(field)`**: Returns the current error message or `null`.
5. **`v.isValid`**: A reactive boolean. Evaluates to `true` when the form is valid. Ideal for `:disabled="!v.isValid"`.
6. **`v.getPayload()`**: Returns a clean, sanitized object applying all transformers for API requests (`fetch`, `axios`).

---

## Example 1: Basic Registration Form

```html
<script setup>
import { ref } from 'vue'
import { useValidator, required, email, minLength, trim } from 'arv-validate-vue'

const isSubmitting = ref(false)

const v = useValidator(
  {
    fullName: '',
    email: '',
    password: ''
  },
  {
    fullName: [required('Name is required'), minLength(3, 'At least 3 characters'), trim()],
    email: [required('Email is required'), email('Invalid email address'), trim()],
    password: [required('Password is required'), minLength(6, 'Minimum 6 characters')]
  }
)

const handleSubmit = async () => {
  const isValid = await v.validate()
  if (!isValid) return

  isSubmitting.value = true
  try {
    const payload = v.getPayload()
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    alert('Account created successfully!')
    v.reset()
  } catch (err) {
    alert('Error submitting form')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="form">
    <h2>Create Account</h2>

    <!-- Full Name -->
    <div class="form-group">
      <label for="fullName">Full Name</label>
      <input
        id="fullName"
        v-model="v.values.fullName"
        @blur="v.touch('fullName')"
        :class="{ 'has-error': v.hasError('fullName') }"
        placeholder="e.g. John Doe"
      />
      <span v-if="v.hasError('fullName')" class="error-msg">
        {{ v.getError('fullName') }}
      </span>
    </div>

    <!-- Email -->
    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        v-model="v.values.email"
        @blur="v.touch('email')"
        :class="{ 'has-error': v.hasError('email') }"
        placeholder="john@example.com"
      />
      <span v-if="v.hasError('email')" class="error-msg">
        {{ v.getError('email') }}
      </span>
    </div>

    <!-- Password -->
    <div class="form-group">
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        v-model="v.values.password"
        @blur="v.touch('password')"
        :class="{ 'has-error': v.hasError('password') }"
        placeholder="••••••"
      />
      <span v-if="v.hasError('password')" class="error-msg">
        {{ v.getError('password') }}
      </span>
    </div>

    <button type="submit" :disabled="!v.isValid || isSubmitting">
      {{ isSubmitting ? 'Submitting...' : 'Register' }}
    </button>
  </form>
</template>
```

---

## Example 2: Nested Objects (Dot Notation)

```html
<script setup>
import { useValidator, required, email, minLength } from 'arv-validate-vue'

const v = useValidator(
  {
    client: {
      profile: { firstName: '' },
      contact: { email: '' }
    }
  },
  {
    'client.profile.firstName': [required('First name is required'), minLength(2)],
    'client.contact.email': [required('Email is required'), email()]
  }
)

const onSave = async () => {
  if (await v.validate()) {
    console.log('Sending payload:', v.getPayload())
  }
}
</script>

<template>
  <form @submit.prevent="onSave">
    <div>
      <label>First Name</label>
      <input
        v-model="v.values.client.profile.firstName"
        @blur="v.touch('client.profile.firstName')"
      />
      <span v-if="v.hasError('client.profile.firstName')">
        {{ v.getError('client.profile.firstName') }}
      </span>
    </div>

    <div>
      <label>Email</label>
      <input
        v-model="v.values.client.contact.email"
        @blur="v.touch('client.contact.email')"
      />
      <span v-if="v.hasError('client.contact.email')">
        {{ v.getError('client.contact.email') }}
      </span>
    </div>

    <button type="submit" :disabled="!v.isValid">Save Client</button>
  </form>
</template>
```

---

## Example 3: Conditional Validation with `when`

```html
<script setup>
import { useValidator, required, when, length } from 'arv-validate-vue'

const v = useValidator(
  {
    billingType: 'RECEIPT', // 'RECEIPT' or 'INVOICE'
    taxId: ''
  },
  {
    billingType: [required()],
    taxId: [
      when(all => all.billingType === 'INVOICE', [
        required('Tax ID is required for invoice billing'),
        length(11, 'Tax ID must be 11 digits')
      ])
    ]
  }
)
</script>

<template>
  <form>
    <div>
      <label>Billing Type</label>
      <select v-model="v.values.billingType">
        <option value="RECEIPT">Simple Receipt</option>
        <option value="INVOICE">Tax Invoice</option>
      </select>
    </div>

    <div v-if="v.values.billingType === 'INVOICE'">
      <label>Tax ID (11 digits)</label>
      <input
        v-model="v.values.taxId"
        @blur="v.touch('taxId')"
        :class="{ 'has-error': v.hasError('taxId') }"
      />
      <span v-if="v.hasError('taxId')">{{ v.getError('taxId') }}</span>
    </div>

    <button :disabled="!v.isValid">Confirm</button>
  </form>
</template>
```

---

## Example 4: Async Validation with Backend API (Loading States)

```html
<script setup>
import { useValidator, required, email, custom } from 'arv-validate-vue'

const checkEmailAvailable = custom(async (value) => {
  const res = await fetch(`/api/users/check?email=${encodeURIComponent(value)}`)
  const data = await res.json()
  return data.available ? true : 'Email is already in use'
})

const v = useValidator(
  { email: '' },
  { email: [required(), email(), checkEmailAvailable] }
)
</script>

<template>
  <div>
    <label>Corporate Email</label>
    <input v-model="v.values.email" @blur="v.touch('email')" />
    
    <!-- Spinner while checking backend -->
    <span v-if="v.isValidating('email')" class="loading">Checking availability...</span>
    <span v-else-if="v.hasError('email')" class="error">{{ v.getError('email') }}</span>
  </div>
</template>
```

---

## Example 5: Dynamic Arrays with `each`

```html
<script setup>
import { useValidator, required, each, mobile, minItems } from 'arv-validate-vue'

const v = useValidator(
  {
    contacts: [
      { name: '', phone: '' }
    ]
  },
  {
    contacts: [
      minItems(1, 'Please add at least one contact'),
      each({
        name: [required('Contact name is required')],
        phone: [required(), mobile('Invalid mobile number')]
      })
    ]
  }
)

const addRow = () => {
  v.values.contacts.push({ name: '', phone: '' })
}

const removeRow = (index) => {
  v.values.contacts.splice(index, 1)
}
</script>

<template>
  <div>
    <h3>Emergency Contacts</h3>
    <div v-for="(item, idx) in v.values.contacts" :key="idx" class="contact-row">
      <input v-model="item.name" placeholder="Name" />
      <input v-model="item.phone" placeholder="Phone" />
      <button type="button" @click="removeRow(idx)" :disabled="v.values.contacts.length <= 1">
        Remove
      </button>
    </div>

    <button type="button" @click="addRow">+ Add Contact</button>

    <div v-if="v.hasError('contacts')" class="error">
      {{ v.getError('contacts') }}
    </div>
  </div>
</template>
```

---

## Example 6: Password Confirmation (`sameAs`)

```html
<script setup>
import { useValidator, required, minLength, sameAs } from 'arv-validate-vue'

const v = useValidator(
  { password: '', confirmPassword: '' },
  {
    password: [required(), minLength(8, 'At least 8 characters')],
    confirmPassword: [
      required('Please confirm your password'),
      sameAs('password', 'Passwords do not match')
    ]
  }
)
</script>

<template>
  <form>
    <div>
      <label>Password</label>
      <input type="password" v-model="v.values.password" @blur="v.touch('password')" />
      <span v-if="v.hasError('password')">{{ v.getError('password') }}</span>
    </div>

    <div>
      <label>Confirm Password</label>
      <input type="password" v-model="v.values.confirmPassword" @blur="v.touch('confirmPassword')" />
      <span v-if="v.hasError('confirmPassword')">{{ v.getError('confirmPassword') }}</span>
    </div>

    <button :disabled="!v.isValid">Change Password</button>
  </form>
</template>
```

---

## Example 7: Data Sanitization for API with `getPayload()`

```html
<script setup>
import { useValidator, required, email, trim, toLowerCase, toFloat, digitsOnly } from 'arv-validate-vue'

const v = useValidator(
  {
    email: '',
    phone: '',
    salary: ''
  },
  {
    email: [required(), email(), trim(), toLowerCase()],
    phone: [required(), digitsOnly()],
    salary: [required(), toFloat()]
  }
)

const submit = async () => {
  if (await v.validate()) {
    // Visual inputs keep raw formatting on screen;
    // getPayload() returns clean numbers, trimmed emails, and digit-only phone
    const payload = v.getPayload()
    console.log('Clean payload:', payload)
  }
}
</script>
```

---

## Example 8: Using with Pinia Stores and `dispose()`

Inside Vue components (`<script setup>`), cleanup is 100% automated on component unmount. When used inside a global Pinia store, use `v.dispose()` to clear subscriptions when the user logs out:

```javascript
import { defineStore } from 'pinia'
import { useValidator, required, email } from 'arv-validate-vue'

export const useUserStore = defineStore('user', () => {
  const v = useValidator(
    { email: '', role: 'USER' },
    { email: [required(), email()] }
  )

  const clearSession = () => {
    v.dispose() // Manually detach listeners
  }

  return { v, clearSession }
})
```

---

## Example 9: Reusable Input Component (`AppInput.vue`)

Create clean, maintainable form components by wrapping `useValidator`:

```html
<!-- AppInput.vue -->
<script setup>
defineProps({
  label: String,
  modelValue: String,
  error: String,
  hasError: Boolean,
  type: { type: String, default: 'text' }
})

defineEmits(['update:modelValue', 'blur'])
</script>

<template>
  <div class="app-input-group" :class="{ 'has-error': hasError }">
    <label v-if="label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />
    <span v-if="hasError" class="app-input-error">{{ error }}</span>
  </div>
</template>
```

Usage in parent form:

```html
<AppInput
  v-model="v.values.email"
  @blur="v.touch('email')"
  :has-error="v.hasError('email')"
  :error="v.getError('email')"
  label="Email Address"
/>
```

---

## 12. `useValidator` API Reference

| Member | Type | Description |
|---|---|---|
| `v.values` | `Proxy (reactive)` | Two-way reactive form state (`v-model`). |
| `v.isValid` | `boolean` | True if form has no errors and no active async tasks. |
| `v.isDirty` | `boolean` | True if any value was modified from initial snapshot. |
| `v.hasError(field)` | `function` | True if field has an error and was touched. |
| `v.getError(field)` | `function` | Error message string or null. |
| `v.isValidating(field?)` | `function` | True if async backend validation is running. |
| `v.touch(field)` | `function` | Marks field as touched (`@blur`). |
| `v.untouch(field)` | `function` | Unmarks field as touched. |
| `v.validate()` | `async function` | Touches all fields and validates form. |
| `v.validateField(field)` | `async function` | Validates a single field immediately. |
| `v.reset(newValues?)` | `function` | Restores initial snapshot or replaces with new values. |
| `v.setValues(patch)` | `function` | Updates multiple fields simultaneously. |
| `v.getPayload(customFn?)` | `function` | Returns sanitized data for backend API. |
| `v.dispose()` | `function` | Manual subscription cleanup. |

---

## License

MIT © [Julio Cesar Callo](https://github.com/jccallo)
