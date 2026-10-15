---
id: Avatar
section: components
cssPrefix: pf-v6-c-avatar
---import './Avatar.css'

## Examples

### Basic usage

Avatars can be created using either an `<img>` element with an image source, or a `<div>` element with custom content.

```html
<img
  class="pf-v6-c-avatar"
  alt="Basic avatar with image"
  src="/assets/images/pf-logo-avatar.jpg"
/>
<div
  class="pf-v6-c-avatar"
  role="img"
  aria-label="Basic avatar with custom content"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
  >
    <g>
      <rect width="48" height="48" fill="#147878" />
      <rect x="36" y="42" width="6" height="6" fill="#004D4D" />
      <rect x="6" y="42" width="6" height="6" fill="#004D4D" />
      <rect x="12" y="36" width="24" height="6" fill="#004D4D" />
      <rect x="18" y="30" width="12" height="6" fill="#004D4D" />
      <rect
        width="6"
        height="24"
        transform="matrix(-1 0 0 1 48 12)"
        fill="#004D4D"
      />
      <rect
        width="6"
        height="6"
        transform="matrix(-1 0 0 1 42 30)"
        fill="#004D4D"
      />
      <rect
        width="6"
        height="6"
        transform="matrix(-1 0 0 1 36 24)"
        fill="#004D4D"
      />
      <rect
        width="6"
        height="6"
        transform="matrix(-1 0 0 1 42 18)"
        fill="#004D4D"
      />
      <rect
        width="6"
        height="6"
        transform="matrix(-1 0 0 1 36 12)"
        fill="#004D4D"
      />
      <rect
        width="6"
        height="6"
        transform="matrix(-1 0 0 1 42 6)"
        fill="#004D4D"
      />
      <rect x="18" width="12" height="12" fill="#004D4D" />
      <rect x="6" y="30" width="6" height="6" fill="#004D4D" />
      <rect x="12" y="24" width="6" height="6" fill="#004D4D" />
      <rect x="6" y="18" width="6" height="6" fill="#004D4D" />
      <rect x="12" y="12" width="6" height="6" fill="#004D4D" />
      <rect x="6" y="6" width="6" height="6" fill="#004D4D" />
      <rect y="12" width="6" height="24" fill="#004D4D" />
    </g>
  </svg>
</div>

```

### Color modifiers

Color modifiers add visual interest and automatically include a border. The available colors are: "red", "orangered", "orange", "yellow", "green", "teal", "blue", "purple", and "gray".

```html
<div
  class="pf-v6-c-avatar pf-m-red pf-m-colorful"
  role="img"
  aria-label="Red avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-orangered pf-m-colorful"
  role="img"
  aria-label="Orange-red avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-orange pf-m-colorful"
  role="img"
  aria-label="Orange avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-yellow pf-m-colorful"
  role="img"
  aria-label="Yellow avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-green pf-m-colorful"
  role="img"
  aria-label="Green avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-teal pf-m-colorful"
  role="img"
  aria-label="Teal avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-blue pf-m-colorful"
  role="img"
  aria-label="Blue avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-purple pf-m-colorful"
  role="img"
  aria-label="Purple avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>
<div
  class="pf-v6-c-avatar pf-m-gray pf-m-colorful"
  role="img"
  aria-label="Gray avatar "
>
  <svg
    aria-hidden="true"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 36 36"
  >
    <path
      fill="currentColor"
      d="M17.7,20.1c-3.5,0-6.4-2.9-6.4-6.4s2.9-6.4,6.4-6.4,6.4,2.9,6.4,6.4-2.8,6.4-6.4,6.4Z"
    />
    <path
      fill="currentColor"
      d="M30.6,36c-.4-3.9-1.3-9-2.9-11-1.1-1.4-2.3-2.2-3.5-2.6s-1.8-.6-6.3-.6-6.1.7-6.1.7c-1.2.4-2.4,1.2-3.4,2.6-1.7,1.9-2.6,7.1-3,10.9h25.2Z"
    />
  </svg>
</div>

```

### With initials

Display a user's initials in the avatar. It's recommended to pass only a single initial to ensure the text fits inside of the avatar.

```html
<div
  class="pf-v6-c-avatar pf-m-bordered"
  role="img"
  aria-label="Avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-red pf-m-colorful"
  role="img"
  aria-label="Red avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-orangered pf-m-colorful"
  role="img"
  aria-label="Orange-red avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-orange pf-m-colorful"
  role="img"
  aria-label="Orange avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-yellow pf-m-colorful"
  role="img"
  aria-label="Yellow avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-green pf-m-colorful"
  role="img"
  aria-label="Green avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-teal pf-m-colorful"
  role="img"
  aria-label="Teal avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-blue pf-m-colorful"
  role="img"
  aria-label="Blue avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-purple pf-m-colorful"
  role="img"
  aria-label="Purple avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-gray pf-m-colorful"
  role="img"
  aria-label="Gray avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>

```

### Bordered

Use `.pf-m-bordered` to add a border to non-colorful avatars.

```html
<div
  class="pf-v6-c-avatar pf-m-bordered"
  role="img"
  aria-label="Bordered avatar with chatbot icon"
>
  <svg
    class="pf-v6-svg"
    fill="currentColor"
    viewBox="0 0 32 32"
    aria-hidden="true"
    role="img"
    width="1em"
    height="1em"
  >
    <path
      d="M28 12H17V9h1.75C19.44 9 20 8.44 20 7.75v-4.5C20 2.56 19.44 2 18.75 2h-5.5C12.56 2 12 2.56 12 3.25v4.5c0 .69.56 1.25 1.25 1.25H15v3H4c-1.654 0-3 1.346-3 3v12c0 1.654 1.346 3 3 3h24c1.654 0 3-1.346 3-3V15c0-1.654-1.346-3-3-3ZM14 4h4v3h-4V4Zm15 23a1 1 0 0 1-1 1H4c-.551 0-1-.448-1-1V15c0-.551.449-1 1-1h24c.552 0 1 .449 1 1v12ZM8.75 18v2a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75v-2a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75Zm18 0v2a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1-.75-.75v-2a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75Zm-7.05 4.475a.873.873 0 0 1-.175 1.224c-1.023.77-2.242 1.176-3.525 1.176s-2.502-.406-3.526-1.176a.874.874 0 1 1 1.05-1.398c1.437 1.078 3.513 1.078 4.95 0a.871.871 0 0 1 1.225.174Z"
    />
  </svg>
</div>

```

### Size variations

Avatars support small, medium (default), large, and extra large sizes.

```html
<div
  class="pf-v6-c-avatar pf-m-red pf-m-colorful pf-m-sm"
  role="img"
  aria-label="Small red avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-red pf-m-colorful pf-m-md"
  role="img"
  aria-label="Medium red avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-red pf-m-colorful pf-m-lg"
  role="img"
  aria-label="Large red avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>
<div
  class="pf-v6-c-avatar pf-m-red pf-m-colorful pf-m-xl"
  role="img"
  aria-label="Extra large red avatar with initial C"
>
  <span class="pf-v6-c-avatar__initials" aria-hidden="true">C</span>
</div>

```

## Documentation

### Overview

The avatar component provides a default SVG icon. If an image is used it should be 36px by 36px.

### Accessibility

| Attribute | Applied to | Outcome |
| -- | -- | -- |
| `alt` | `.pf-v6-c-avatar` | The alt attribute describes the appearance and function of the avatar image. **Required for image avatars** |
| `role="img"` | `.pf-v6-c-avatar` | Indicates the element represents an image. **Required for colorful avatars** |
| `aria-label` | `.pf-v6-c-avatar` | Provides an accessible name for the avatar. **Required for colorful avatars** |
| `aria-hidden="true"` | `.pf-v6-c-avatar__initials`, `<svg>` | Hides decorative content from screen readers when the container has `aria-label`. |

### Usage

| Class | Applied to | Outcome |
| -- | -- | -- |
| `.pf-v6-c-avatar` | `<img>`, `<div>` |  Initiates an avatar. **Required** |
| `.pf-v6-c-avatar__initials` | `<span>` | Contains the user's initials in a colorful avatar. |
| `.pf-m-bordered` | `.pf-v6-c-avatar` | Modifies an avatar to have a border. |
| `.pf-m-sm{-on-[breakpoint]}` | `.pf-v6-c-avatar` | Modifies an avatar to be small on an optional [breakpoint](/foundations-and-styles/design-tokens/all-design-tokens). |
| `.pf-m-md{-on-[breakpoint]}` | `.pf-v6-c-avatar` | Modifies an avatar to be medium on an optional [breakpoint](/foundations-and-styles/design-tokens/all-design-tokens). **Note:** This is the default size. |
| `.pf-m-lg{-on-[breakpoint]}` | `.pf-v6-c-avatar` | Modifies an avatar to be large on an optional [breakpoint](/foundations-and-styles/design-tokens/all-design-tokens). |
| `.pf-m-xl{-on-[breakpoint]}` | `.pf-v6-c-avatar` | Modifies an avatar to be extra large on an optional [breakpoint](/foundations-and-styles/design-tokens/all-design-tokens). |
| `.pf-m-colorful` | `.pf-v6-c-avatar` | Modifies an avatar to use colorful styling with a border. |
| `.pf-m-red` | `.pf-v6-c-avatar` |  Modifies avatar for red styling. |
| `.pf-m-orangered` | `.pf-v6-c-avatar` |  Modifies avatar for orangered styling. |
| `.pf-m-orange` | `.pf-v6-c-avatar` |  Modifies avatar for orange styling. |
| `.pf-m-yellow` | `.pf-v6-c-avatar` |  Modifies avatar for yellow styling. |
| `.pf-m-green` | `.pf-v6-c-avatar` |  Modifies avatar for green styling. |
| `.pf-m-teal` | `.pf-v6-c-avatar` |  Modifies avatar for teal styling. |
| `.pf-m-blue` | `.pf-v6-c-avatar` |  Modifies avatar for blue styling. |
| `.pf-m-purple` | `.pf-v6-c-avatar` |  Modifies avatar for purple styling. |
| `.pf-m-gray` | `.pf-v6-c-avatar` |  Modifies avatar for gray styling. |
