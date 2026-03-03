# Form Accessibility Guide

This document tracks form-related accessibility issues, how they were resolved, and how to prevent them in future development.

## Issues Identified

### 1. Missing `id` or `name` attributes
**Problem**: Form field elements (`<input>`, `<select>`, `<textarea>`) lacked unique `id` or `name` attributes.
- **Impact**: Browsers cannot correctly identify fields for autofill. Assistive technologies (screen readers) may have difficulty navigating the form.
- **Warning**: "A form field element has neither an id nor a name attribute."

### 2. Unassociated `<label>` elements
**Problem**: Labels were not programmatically linked to their corresponding form fields.
- **Impact**: Clicking the label does not focus the input. Screen readers won't announce the label when the field is focused.
- **Warning**: "A <label> isn't associated with a form field."

---

## How to Fix

### Pattern A: Using `id` and `htmlFor`
Ensure the label has an `htmlFor` attribute that matches the `id` of the input.

```tsx
<label htmlFor="user-email">Email Address</label>
<input id="user-email" name="email" type="email" />
```

### Pattern B: Nesting (Alternative)
The label can wrap the input, which provides implicit association.

```tsx
<label>
  Email Address
  <input name="email" type="email" />
</label>
```

---

## Prevention & Best Practices

To avoid these issues in the `QuestMasters` codebase:

### 1. Use the `FormField` Component
Always wrap inputs in the `FormField` helper. It now automatically handles the `htmlFor` mapping.

```tsx
// DO THIS:
<FormField label="Username" id="username-field">
  <input id="username-field" name="username" ... />
</FormField>
```

### 2. Leverage specialized components
Use the pre-built fields whenever possible. They are already wired for accessibility:
- `NumberField`
- `SelectField`
- `TextAreaField`
- `TagInput`

### 3. Generate Unique IDs with `useId`
When creating reusable components or multiple instances of the same form, use React's `useId` hook to guarantee unique IDs across the DOM.

```tsx
import { useId } from "react";

function MyComponent() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Field</label>
      <input id={id} name="my-field" />
    </>
  );
}
```

### 4. Provide Descriptive `name` Attributes
Even if not strictly required for logic (e.g., when handles by state), the `name` attribute is critical for browser autofill and accessibility. Match the key in your state or DTO.
