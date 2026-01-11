# @layers/ui

React component library for the Layers platform, built on shadcn/ui patterns with Radix UI and Tailwind CSS.

## Installation

```bash
pnpm add @layers/ui
```

## Setup

Add the Layers UI Tailwind preset to your `tailwind.config.js`:

```javascript
module.exports = {
  presets: [require('@layers/ui/tailwind.preset')],
  content: [
    // ... your content paths
    './node_modules/@layers/ui/**/*.{js,ts,jsx,tsx}',
  ],
};
```

Import the global styles in your app:

```tsx
import '@layers/ui/globals.css';
```

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@layers/ui';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Layers</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Get started with your AI-powered workspace.</p>
        <Button className="mt-4">Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### Primitives

Base-level components:

- `Button` - Primary interaction button with variants
- `Input` - Text input with error state support

### Patterns

Compound components:

- `Card` - Container with header, content, and footer sections

### Layouts

Page-level layouts (coming soon):

- `PageLayout` - Standard page wrapper
- `SidebarLayout` - Layout with sidebar navigation
- `DashboardLayout` - Full dashboard layout

## Component API

### Button

```tsx
<Button
  variant="default" // default | destructive | outline | secondary | ghost | link
  size="default"    // default | sm | lg | icon
  loading={false}   // Shows loading spinner
  asChild={false}   // Render as child component
>
  Click me
</Button>
```

### Input

```tsx
<Input
  type="email"
  placeholder="Enter email"
  error={hasError}
  errorMessage="Invalid email"
/>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

## Storybook

Run Storybook to explore components:

```bash
pnpm storybook
```

## Customization

All components use CSS variables for theming. Override in your CSS:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... etc */
}
```

## See Also

- [shadcn/ui](https://ui.shadcn.com) - Component patterns
- [Radix UI](https://www.radix-ui.com) - Primitive components
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

*@layers/ui • Mirror Factory • v0.1.0*
