# arv-validate

Motor de validación reactivo en tiempo real, **100% agnóstico** a cualquier framework.  
Zero dependencies.

📖 **[Documentación completa](./docs/DOCUMENTACION.md)**

---

## Instalación

```bash
npm install arv-validate           # Vanilla JS / Node.js
npm install arv-validate-vue       # + Adaptador Vue 3
```

## Ejemplo rápido

```javascript
import { createValidator, required, email, minLength } from 'arv-validate'

const v = createValidator(
  { nombre: '', correo: '' },
  {
    nombre: [required(), minLength(3)],
    correo: [required(), email()]
  }
)

const isValid = await v.validate()
console.log(v.state.errors)
```

## Características

- ⚡ **Validación en vivo** — ES6 Proxies, los errores aparecen/desaparecen al instante
- 🧩 **+40 reglas** incluidas — `required`, `email`, `date`, `when`, `custom`, etc.
- 🔄 **Async nativo** — validación contra backend con protección contra race conditions
- 🧹 **Transformadores** — `getPayload()` devuelve datos sanitizados sin alterar el input
- 🌳 **Objetos anidados** — dot notation: `'apoderado.nroDoc'`
- 🌐 **i18n** — `configureMessages()` para personalizar mensajes
- 📦 **Zero dependencies**

## Paquetes

| Paquete | Descripción |
|---|---|
| [`arv-validate`](./packages/core) | Motor agnóstico |
| [`arv-validate-vue`](./packages/vue) | Adaptador Vue 3 / Quasar |

## Licencia

MIT
