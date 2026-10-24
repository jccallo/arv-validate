# Complete Catalog of Rules & Transformers

> Exhaustive technical documentation for the [`arv-validate`](../packages/core/rules.js) rules module.  
> Every rule is a pure function that returns `true` if the value is valid, or an error `string` if it is not.

[English](./RULES.md) | [Español](./REGLAS.md)

---

## 📑 Table of Contents

1. [Presence & Conditionals](#1-presence--conditionals) (2)
2. [Atomic & Primitive Data Types](#2-atomic--primitive-data-types) (6)
3. [Text Length & Character Limits](#3-text-length--character-limits) (3)
4. [Numbers & Ranges](#4-numbers--ranges) (9)
5. [Dates & Times](#5-dates--times) (7)
6. [Contact, Identity & Document Formats](#6-contact-identity--document-formats) (9)
7. [Arrays & Multiple Selection](#7-arrays--multiple-selection) (4)
8. [Files & Attachments](#8-files--attachments) (2)
9. [Security, Cross-Field & Custom Rules](#9-security-cross-field--custom-rules) (4)
10. [Data Transformers & Sanitization (`getPayload`)](#10-data-transformers--sanitization-getpayload) (12)

---

## 1. Presence & Conditionals

### `required(msg)`
* **What it does:** Validates the **pure presence** of the value (Single Responsibility Principle). Ensures the field is not `null`, `undefined`, an empty string `""`, or a string containing only whitespace. Does not assume complex nested structures (use `minItems` for arrays or `minKeys` for objects).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'This field is required'`
* **Example:**
  ```javascript
  fullName: [required('Please enter your full name')]
  ```

---

### `when(conditionFnOrField, rules)`
* **What it does:** Executes a group of nested rules **only if** the condition evaluates to `true`. If the condition is false, it completely ignores the enclosed rules (returns `true`), preventing stale data from causing visual errors.
* **Parameters:**
  * `conditionFnOrField` *(string | Function)*: Name of a boolean field or predicate function `(allValues) => boolean`.
  * `rules` *(Array<Function> | Function)*: Single rule or list of rules to execute if the condition is satisfied.
* **Examples:**
  ```javascript
  // Example 1: Simple field condition
  rejectionReason: [
    when('isRejected', [required('Please specify why this was rejected')])
  ]

  // Example 2: Predicate function with multiple rules
  taxId: [
    when(all => all.accountType === 'COMPANY', [
      required('Tax ID is required for corporate accounts'),
      length(11, 'Tax ID must be 11 digits')
    ])
  ]
  ```

---

## 2. Atomic & Primitive Data Types

> **Note:** These rules are atomic (SRP). If the value is empty (`null`, `undefined`, `""`), they return `true` so they don't force presence. Combine with `required()` when the field is mandatory.

### `isString(msg)`
* **What it does:** Ensures the value is strictly of type string (`typeof val === 'string'`).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be a string'`
* **Example:**
  ```javascript
  description: [isString()]
  ```

---

### `isNumber(msg)`
* **What it does:** Ensures the value is a valid native JavaScript number (`typeof val === 'number' && !isNaN(val)'`).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be a valid number'`
* **Example:**
  ```javascript
  temperature: [isNumber('Temperature must be a numeric value')]
  ```

---

### `isBoolean(msg)`
* **What it does:** Ensures the value is strictly boolean (`typeof val === 'boolean'`, or literals `true`/`false`).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be a boolean value'`
* **Example:**
  ```javascript
  acceptTerms: [required(), isBoolean()]
  ```

---

### `isArray(msg)`
* **What it does:** Ensures the value is a native array (`Array.isArray(val)`).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be an array'`
* **Example:**
  ```javascript
  tags: [isArray('Tags must be supplied as a list')]
  ```

---

### `isObject(msg)`
* **What it does:** Ensures the value is a non-null object and not an Array (`typeof val === 'object' && val !== null && !Array.isArray(val)`).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be a valid object'`
* **Example:**
  ```javascript
  settings: [isObject()]
  ```

---

### `isFile(msg)`
* **What it does:** Ensures the value is an instance of `File` or `Blob`, or a file-like object containing `name` and `size` properties.
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be a valid file'`
* **Example:**
  ```javascript
  avatar: [required(), isFile('Please attach a valid file')]
  ```

---

## 3. Text Length & Character Limits

### `minLength(min, msg)`
* **What it does:** Checks that character length (after applying `.trim()`) is greater than or equal to `min`.
* **Parameters:**
  * `min` *(number)*: Minimum allowed characters.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Must have at least ${min} characters` ``
* **Example:**
  ```javascript
  notes: [minLength(10, 'Please write at least 10 characters')]
  ```

---

### `maxLength(max, msg)`
* **What it does:** Checks that character length (after `.trim()`) does not exceed `max`.
* **Parameters:**
  * `max` *(number)*: Maximum allowed characters.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Cannot exceed ${max} characters` ``
* **Example:**
  ```javascript
  zipCode: [maxLength(5)]
  ```

---

### `betweenLength(min, max, msg)`
* **What it does:** Checks that character length is within the closed interval `[min, max]`.
* **Parameters:**
  * `min` *(number)*: Minimum characters.
  * `max` *(number)*: Maximum characters.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Must have between ${min} and ${max} characters` ``
* **Example:**
  ```javascript
  pinCode: [betweenLength(4, 6)]
  ```

---

## 4. Numbers & Ranges

### `numeric(msg)`
* **What it does:** Checks if the value can be parsed into a valid number (accepts numbers or strings representing integers/decimals).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be a number'`
* **Example:**
  ```javascript
  price: [required(), numeric('Price must be a valid number')]
  ```

---

### `integer(msg)`
* **What it does:** Checks that the number is an integer without decimal fractions.
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Must be an integer'`
* **Example:**
  ```javascript
  quantity: [required(), integer('Quantity must be a whole number')]
  ```

---

### `minValue(min, msg)`
* **What it does:** Checks that the numeric value is greater than or equal to `min`.
* **Parameters:**
  * `min` *(number)*: Minimum value.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Minimum value is ${min}` ``
* **Example:**
  ```javascript
  amount: [numeric(), minValue(0.01, 'Minimum amount is 0.01')]
  ```

---

### `maxValue(max, msg)`
* **What it does:** Checks that the numeric value is less than or equal to `max`.
* **Parameters:**
  * `max` *(number)*: Maximum value.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Maximum value is ${max}` ``
* **Example:**
  ```javascript
  discount: [numeric(), maxValue(100, 'Discount cannot exceed 100%')]
  ```

---

### `between(min, max, msg)`
* **What it does:** Checks that the numeric value falls inside the range `[min, max]`.
* **Parameters:**
  * `min` *(number)*: Minimum value.
  * `max` *(number)*: Maximum value.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Must be between ${min} and ${max}` ``
* **Example:**
  ```javascript
  score: [between(0, 100, 'Score must be between 0 and 100')]
  ```

---

### `greaterThan(otherField, msg)`
* **What it does:** Checks that the numeric value is strictly greater than the value of another field (supports dot-notation).
* **Example:**
  ```javascript
  maxPrice: [required(), greaterThan('minPrice', 'Max price must exceed min price')]
  ```

---

### `greaterThanOrEqual(otherField, msg)`
* **What it does:** Checks that the numeric value is greater than or equal to another field.
* **Example:**
  ```javascript
  targetScore: [greaterThanOrEqual('passingScore')]
  ```

---

### `lessThan(otherField, msg)`
* **What it does:** Checks that the numeric value is strictly less than another field.
* **Example:**
  ```javascript
  discountPrice: [lessThan('regularPrice')]
  ```

---

### `lessThanOrEqual(otherField, msg)`
* **What it does:** Checks that the numeric value is less than or equal to another field.
* **Example:**
  ```javascript
  expense: [lessThanOrEqual('budget')]
  ```

---

## 5. Dates & Times

> **Note:** The internal calendar parser handles `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, ISO 8601 strings with timezone offset, and native `Date` objects. It accurately validates real Gregorian calendar boundaries (e.g. rejects Feb 30 or April 31).

### `date(msg)`
* **What it does:** Validates that the input represents a valid calendar date.
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Invalid date'`
* **Example:**
  ```javascript
  birthDate: [required(), date()]
  ```

---

### `afterDate(targetFieldOrDate, msg)`
* **What it does:** Checks that the date is strictly after another date or another field in the form.
* **Parameters:**
  * `targetFieldOrDate` *(string | Date | Function)*: Target field name, getter function, or fixed Date object.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Date must be after the start date'`
* **Example:**
  ```javascript
  endDate: [afterDate('startDate', 'End date must be after start date')]
  ```

---

### `beforeDate(targetFieldOrDate, msg)`
* **What it does:** Checks that the date is strictly before another date or another field.
* **Parameters:**
  * `targetFieldOrDate` *(string | Date | Function)*: Target field name, getter function, or fixed Date object.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Date must be before the end date'`
* **Example:**
  ```javascript
  startDate: [beforeDate('endDate', 'Start date must be before end date')]
  ```

---

### `minAge(years, msg)`
* **What it does:** Accurately calculates age from a birth date (taking into account month and day) and checks that it is at least `years` old.
* **Parameters:**
  * `years` *(number)*: Minimum required age.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Must be at least ${years} years old` ``
* **Example:**
  ```javascript
  birthDate: [required(), date(), minAge(18, 'You must be at least 18 years old')]
  ```

---

### `maxAge(years, msg)`
* **What it does:** Checks that the calculated age does not exceed `years`.
* **Example:**
  ```javascript
  childAge: [required(), date(), maxAge(5, 'Maximum age is 5 years old')]
  ```

---

### `betweenAge(min, max, msg)`
* **What it does:** Checks that the calculated age falls inside `[min, max]`.
* **Example:**
  ```javascript
  studentAge: [required(), date(), betweenAge(12, 18)]
  ```

---

### `time(msg)`
* **What it does:** Checks that the string is a valid 24-hour time format `HH:mm` (e.g. `08:30`) or `HH:mm:ss` (e.g. `14:30:45`).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Invalid time format (HH:mm or HH:mm:ss)'`
* **Example:**
  ```javascript
  checkInTime: [required(), time()]
  ```

---

## 6. Contact, Identity & Document Formats

### `email(msg)`
* **What it does:** Validates standard email address syntax (`user@domain.ext`).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Invalid email address'`
* **Example:**
  ```javascript
  email: [required(), email()]
  ```

---

### `mobile(msg)`
* **What it does:** Validates standard 9-digit mobile phone numbers starting with digit `9`.
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Invalid mobile phone number (9 digits starting with 9)'`
* **Example:**
  ```javascript
  cellphone: [required(), mobile()]
  ```

---

### `phone(msg)`
* **What it does:** Validates landline or mobile phone numbers (6 to 9 digits), permitting optional area code separators.
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Invalid phone number'`
* **Example:**
  ```javascript
  homePhone: [phone()]
  ```

---

### `url(msg)`
* **What it does:** Validates web URLs with `http:` or `https:` protocols.
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Invalid URL'`
* **Example:**
  ```javascript
  website: [url('Please enter a valid website link')]
  ```

---

### `alpha(msg)`
* **What it does:** Allows alphabetic characters exclusively (uppercase, lowercase, accents, and whitespace).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Only letters are allowed'`
* **Example:**
  ```javascript
  firstName: [required(), alpha('Names must contain only letters')]
  ```

---

### `alphaNum(msg)`
* **What it does:** Allows alphanumeric characters (letters, numbers 0-9, and spaces).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Only letters and numbers are allowed'`
* **Example:**
  ```javascript
  referenceCode: [alphaNum()]
  ```

---

### `dni(msg)`
* **What it does:** Validates an 8-digit National Identity Document (DNI).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'DNI must have 8 numeric digits'`
* **Example:**
  ```javascript
  documentNumber: [required(), dni()]
  ```

---

### `ruc(msg)`
* **What it does:** Validates an 11-digit Taxpayer Identification Number (RUC).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'RUC must have 11 numeric digits'`
* **Example:**
  ```javascript
  companyTaxId: [required(), ruc()]
  ```

---

### `cci(msg)`
* **What it does:** Validates a 20-digit Interbank Account Code (CCI).
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'CCI must have exactly 20 digits'`
* **Example:**
  ```javascript
  bankAccountCci: [required(), cci()]
  ```

---

## 7. Arrays & Multiple Selection

### `minItems(min, msg)`
* **What it does:** Requires an array to contain at least `min` items.
* **Parameters:**
  * `min` *(number)*: Minimum item count.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Select at least ${min} option(s)` ``
* **Example:**
  ```javascript
  interests: [minItems(2, 'Please choose at least 2 interests')]
  ```

---

### `maxItems(max, msg)`
* **What it does:** Requires an array to contain at most `max` items.
* **Parameters:**
  * `max` *(number)*: Maximum item count.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `Select at most ${max} option(s)` ``
* **Example:**
  ```javascript
  electives: [maxItems(3, 'You can only choose 3 electives')]
  ```

---

### `oneOf(allowedList, msg)`
* **What it does:** Ensures the selected value matches one of the items in an allowed list.
* **Parameters:**
  * `allowedList` *(Array)*: Array of valid values.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Option not allowed'`
* **Example:**
  ```javascript
  gender: [required(), oneOf(['M', 'F', 'O'], 'Please select a valid option')]
  ```

---

### `each(schemaOrRules, msg)`
* **What it does:** Applies a validation sub-schema or rule list to **every element** in an array. Supports arrays of objects (dynamic tables) or arrays of primitives.
* **Parameters:**
  * `schemaOrRules` *(Object | Array | Function)*: Schema map for object items, or rules array for primitive items.
  * `msg` *(string, optional)*: Custom error message.
* **Example with Array of Objects:**
  ```javascript
  familyMembers: [
    minItems(1, 'Add at least one family member'),
    each({
      name: [required(), trim()],
      age: [required(), integer()]
    })
  ]
  ```
* **Example with Array of Primitives:**
  ```javascript
  notificationEmails: [
    each([required(), email()])
  ]
  ```

---

## 8. Files & Attachments

### `fileMaxSize(maxMB, msg)`
* **What it does:** Ensures that an attached file does not exceed the specified size limit in Megabytes.
* **Parameters:**
  * `maxMB` *(number)*: Size limit in MB.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `` `File size must not exceed ${maxMB} MB` ``
* **Example:**
  ```javascript
  attachment: [fileMaxSize(5, 'File cannot exceed 5MB')]
  ```

---

### `fileTypes(allowedExts, msg)`
* **What it does:** Verifies that the file extension matches the list of allowed extensions (case-insensitive).
* **Parameters:**
  * `allowedExts` *(Array<string>)*: Allowed extensions (e.g. `['pdf', 'png', 'jpg']`).
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'File type not allowed'`
* **Example:**
  ```javascript
  receiptFile: [fileTypes(['pdf', 'jpg', 'png'], 'Only PDF or image files are allowed')]
  ```

---

## 9. Security, Cross-Field & Custom Rules

### `sameAs(targetFieldOrGetter, msg)`
* **What it does:** Validates that the current value is strictly identical (`===`) to another field or the result of a getter function.
* **Parameters:**
  * `targetFieldOrGetter` *(string | Function)*: Field name to compare against or getter `(allValues) => any`.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Fields do not match'`
* **Example:**
  ```javascript
  confirmPassword: [required(), sameAs('password', 'Passwords do not match')]
  ```

---

### `strongPassword(msg)`
* **What it does:** Enforces password security: minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character or symbol.
* **Parameters:**
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Minimum 8 characters, one uppercase, one lowercase, one number, and one symbol'`
* **Example:**
  ```javascript
  newPassword: [required(), strongPassword()]
  ```

---

### `pattern(regex, msg)`
* **What it does:** Evaluates the value against a custom regular expression (`RegExp`).
* **Parameters:**
  * `regex` *(RegExp)*: Regular expression.
  * `msg` *(string, optional)*: Custom error message.  
    *Default:* `'Invalid format'`
* **Example:**
  ```javascript
  licensePlate: [pattern(/^[A-Z]{3}-\d{3}$/, 'Invalid plate format (e.g. ABC-123)')]
  ```

---

### `custom(fn, defaultMsg)`
* **What it does:** Enables custom synchronous or asynchronous (`Promise`) validation logic. Seamlessly handles async backend checks (e.g. checking if an email is already taken).
* **Parameters:**
  * `fn` *(Function: (val, allValues) => boolean | string | Promise<boolean|string>)*: Custom validation function. Returns `true` if valid, or error string/`false`.
  * `defaultMsg` *(string, optional)*: Fallback message if `false` is returned.  
    *Default:* `'Invalid value'`
* **Example:**
  ```javascript
  username: [
    required(),
    custom(async (val) => {
      const exists = await api.checkUsername(val)
      return !exists || 'Username is already taken'
    })
  ]
  ```

---

## 10. Data Transformers & Sanitization (`getPayload`)

> **Clean Code Philosophy:**  
> Transformers are declared alongside validation rules in the schema. During live user typing, transformers are ignored to preserve cursor positions and raw input feel.  
> When submitting the form, `v.getPayload()` (or `v.getTransformed()`) executes the transformer pipeline to produce clean, parsed, and typed objects ready for HTTP APIs (Axios/Fetch).

### Constant `DEFAULT_TIMEZONE`
* **Value:** `'America/Lima'`
* **Description:** Default IANA timezone used for date/time formatting in `toDate` and `toDateTime`.

---

### `transform(fn)`
* **What it does:** Base primitive for creating any custom transformation.
* **Parameters:**
  * `fn` *(Function: (val) => any)*: Pure function receiving original value and returning sanitized value.
* **Example:**
  ```javascript
  slug: [transform(val => String(val).toLowerCase().replace(/\s+/g, '-'))]
  ```

---

### `trim()`
* **What it does:** Removes leading and trailing whitespace from string values (`val.trim()`).
* **Example:**
  ```javascript
  username: [required(), trim()] // "  alice  " -> "alice"
  ```

---

### `toLowerCase()`
* **What it does:** Converts string to lowercase (`val.toLowerCase()`). Ideal for emails and identifiers.
* **Example:**
  ```javascript
  email: [required(), email(), toLowerCase(), trim()] // "  ALICE@EXAMPLE.COM " -> "alice@example.com"
  ```

---

### `toUpperCase()`
* **What it does:** Converts string to uppercase (`val.toUpperCase()`). Ideal for promo codes, plates, or serials.
* **Example:**
  ```javascript
  coupon: [required(), toUpperCase(), trim()] // " save50 " -> "SAVE50"
  ```

---

### `toFloat()`
* **What it does:** Converts value to a floating-point number (`parseFloat(val)`). Does not round or alter decimal precision (respects SRP). Returns `null` if empty or invalid. Supports suffix text (e.g. `"75.45 kg"` -> `75.45`).
* **Example:**
  ```javascript
  exchangeRate: [required(), toFloat()] // "3.7548" -> 3.7548
  ```

---

### `round(decimals = 2)`
* **What it does:** Dedicated mathematical rounding block to the specified decimal places, resolving binary floating-point inaccuracies.
* **Parameters:**
  * `decimals` *(number, optional)*: Decimal places. Default: `2`.
* **Example:**
  ```javascript
  price: [required(), round(2)] // "19.994" -> 19.99, "19.996" -> 20.0
  average: [required(), round(0)] // "16.8" -> 17
  ```

---

### `truncate(decimals = 0)`
* **What it does:** Cuts off decimal digits without rounding up. If `decimals` is `0`, converts to integer (`Math.trunc`). Alias: `toInteger()`.
* **Parameters:**
  * `decimals` *(number, optional)*: Decimals to keep. Default: `0`.
* **Example:**
  ```javascript
  installments: [required(), truncate()] // "12 months" -> 12
  savings: [required(), truncate(2)] // "16.789" -> 16.78
  ```

---

### `digitsOnly()`
* **What it does:** Removes all non-digit characters (`val.replace(/\D/g, '')`), leaving pure digits. Ideal for formatted phone numbers or account numbers.
* **Example:**
  ```javascript
  phone: [mobile(), digitsOnly()] // "+1 (555) 123-4567" -> "15551234567"
  ```

---

### `toBooleanFlag()`
* **What it does:** Converts truthy or boolean values (`true`, `1`, `'1'`, `'true'`) to integer `1`, and all other values to `0`. Ideal for SQL relational databases storing flags as `SMALLINT`.
* **Example:**
  ```javascript
  isActive: [toBooleanFlag()] // true -> 1, false -> 0
  ```

---

### `toDate(timeZone = DEFAULT_TIMEZONE)`
* **What it does:** Converts any supported date input into clean `YYYY-MM-DD` format according to the given IANA timezone.
* **Parameters:**
  * `timeZone` *(string, optional)*: IANA timezone. Default: `'America/Lima'`.
* **Example:**
  ```javascript
  birthDate: [required(), date(), toDate()] // "19/10/2026" -> "2026-10-19"
  ```

---

### `toDateTime(timeZone = DEFAULT_TIMEZONE)`
* **What it does:** Converts date-time into standard SQL `YYYY-MM-DD HH:mm:ss` format adjusted to the given timezone.
* **Parameters:**
  * `timeZone` *(string, optional)*: IANA timezone. Default: `'America/Lima'`.
* **Example:**
  ```javascript
  appointment: [toDateTime('America/Lima')] // "2026-10-19T20:30:00.000Z" -> "2026-10-19 15:30:00"
  ```

---

### `toISOString()`
* **What it does:** Converts any supported date into UTC ISO 8601 string format (`YYYY-MM-DDTHH:mm:ss.sssZ`).
* **Example:**
  ```javascript
  createdAt: [toISOString()]
  ```

---

## 🚀 Quick Usage Example

```javascript
import { 
  createValidator, 
  required, 
  email, 
  minLength, 
  trim, 
  toLowerCase, 
  toDate 
} from 'arv-validate'

const validator = createValidator(
  {
    email: '  USER@EXAMPLE.COM  ',
    password: '',
    birthDate: '19/10/1995'
  },
  {
    email: [required(), email(), toLowerCase(), trim()],
    password: [required(), minLength(8)],
    birthDate: [required(), toDate()]
  }
)

const save = async () => {
  const isValid = await validator.validate()
  if (!isValid) return

  // validator.getPayload() yields clean, sanitized data:
  const payload = validator.getPayload()
  // { email: "user@example.com", password: "...", birthDate: "1995-10-19" }
  await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

---

## License

MIT © [jccallo](https://github.com/jccallo)
