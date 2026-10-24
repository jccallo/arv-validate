# arv-validate

Motor de validación reactivo en tiempo real, **100% agnóstico** a cualquier framework.

Funciona en Vanilla JS, Vue 3, React, Node.js, o cualquier entorno JavaScript.

## Instalación

```bash
npm install arv-validate
```

## Uso rápido

```javascript
import { createValidator, required, email, minLength } from 'arv-validate'

const v = createValidator(
  { nombre: '', correo: '' },
  {
    nombre: [required('El nombre es obligatorio'), minLength(3, 'Mínimo 3 caracteres')],
    correo: [required('El correo es obligatorio'), email('Correo inválido')]
  }
)

// Validar todo
const isValid = await v.validate()

// Obtener errores
console.log(v.state.errors)

// Payload sanitizado listo para API
const payload = v.getPayload()
```

## Adaptadores por framework

| Framework | Paquete | Instalación |
|-----------|---------|-------------|
| Vanilla JS / Node.js | `arv-validate` | `npm i arv-validate` |
| Vue 3 / Quasar | `arv-validate-vue` | `npm i arv-validate arv-validate-vue` |

## Características

- ⚡ **Validación en vivo** con ES6 Proxies (detecta cambios al instante)
- 🔌 **100% agnóstico**: sin dependencia a ningún framework
- 🧩 **+40 reglas** incluidas (required, email, dni, ruc, date, when, custom, etc.)
- 🔄 **Validación asíncrona** nativa (verificar email en backend, etc.)
- 🧹 **Transformadores**: `trim()`, `toLowerCase()`, `toFloat()`, `toDate()`, etc.
- 🌳 **Objetos anidados** con dot notation (`'apoderado.nroDoc'`)
- 📦 **Zero dependencies**: sin dependencias externas

## Documentación completa

Consulta el [catálogo de reglas](../../README.md) para la lista completa de validadores y transformadores.

## Licencia

MIT
