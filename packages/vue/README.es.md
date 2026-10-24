# arv-validate-vue

Adaptador reactivo de [arv-validate](https://www.npmjs.com/package/arv-validate) para **Vue 3** (Composition API con `<script setup>`).

[English](./README.md) | [Español](./README.es.md)

## Instalación

```bash
npm install arv-validate arv-validate-vue
```

## Uso rápido

```html
<script setup>
import { useValidator, required, email, minLength } from 'arv-validate-vue'

const v = useValidator(
  { nombre: '', correo: '' },
  {
    nombre: [required('El nombre es obligatorio'), minLength(3, 'Mínimo 3 caracteres')],
    correo: [required('El correo es obligatorio'), email('Correo inválido')]
  }
)

const onSubmit = async () => {
  const ok = await v.validate()
  if (!ok) return
  const payload = v.getPayload()
  await fetch('/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div class="campo">
      <label>Nombre</label>
      <input
        v-model="v.values.nombre"
        @blur="v.touch('nombre')"
        :class="{ error: v.hasError('nombre') }"
      />
      <span v-if="v.hasError('nombre')" class="error-msg">{{ v.getError('nombre') }}</span>
    </div>

    <div class="campo">
      <label>Correo</label>
      <input
        v-model="v.values.correo"
        @blur="v.touch('correo')"
        :class="{ error: v.hasError('correo') }"
      />
      <span v-if="v.hasError('correo')" class="error-msg">{{ v.getError('correo') }}</span>
    </div>

    <button type="submit" :disabled="!v.isValid">Enviar</button>
  </form>
</template>
```

## Características

- 🔄 **Reactividad nativa** de Vue 3 (`reactive`, `computed`)
- ⚡ **Validación en vivo** mientras el usuario escribe
- 🧹 **Limpieza automática** al desmontar el componente (`onUnmounted`)
- 📦 Re-exporta todo `arv-validate` — un solo import para todo

## Uso fuera de componentes (ej: Pinia)

En componentes Vue (`<script setup>`), la limpieza es **100% automática**. Si creas un validador fuera de un componente (ej. en un Store de Pinia), puedes usar `v.dispose()` para liberar memoria cuando ya no lo necesites:

```javascript
import { defineStore } from 'pinia'
import { useValidator, required } from 'arv-validate-vue'

export const useAuthStore = defineStore('auth', () => {
  const v = useValidator({ email: '' }, { email: [required()] })

  const logout = () => {
    v.dispose() // Limpia listeners manualmente al cerrar sesión
  }

  return { v, logout }
})
```

## API de useValidator

El composable `useValidator(initialData, schema, options)` retorna:

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `v.values` | `Proxy (reactive)` | Valores reactivos bidireccionales (`v-model`) |
| `v.isValid` | `boolean` | ¿Formulario válido? (reactivo en templates y watch) |
| `v.isDirty` | `boolean` | ¿Algo fue modificado? (reactivo) |
| `v.hasError(campo)` | `function` | ¿Campo tiene error? (reactivo) |
| `v.getError(campo)` | `function` | Mensaje de error del campo (reactivo) |
| `v.isValidating(campo?)` | `function` | ¿Validación asíncrona (backend) en curso? |
| `v.touch(campo)` | `function` | Marcar campo como tocado |
| `v.untouch(campo)` | `function` | Desmarcar campo como tocado |
| `v.validate()` | `async function` | Validar todo el formulario |
| `v.reset(newValues?)` | `function` | Restaurar al estado inicial o nuevos valores |
| `v.setValues(patch)` | `function` | Actualizar múltiples campos a la vez |
| `v.getPayload()` | `function` | Datos sanitizados para API |
| `v.dispose()` | `function` | Limpieza manual de la suscripción (fuera de setup) |

## Documentación Completa

- ⚡ **[Guía Detallada para Vue 3 (Español)](../../docs/VUE.md)**
- ⚡ **[Vue 3 Comprehensive Guide (English)](../../docs/VUE.en.md)**

## Licencia

MIT © [Julio Cesar Callo](https://github.com/jccallo)
