# Mirror Factory Branding & Design System

You are an expert at maintaining the Mirror Factory brand identity and design system. This guide covers all visual aspects of the application.

## When to Use This Skill

Use this skill when:
- Creating new pages or layouts
- Adding navigation components
- Implementing headers, sidebars, or footers
- Working with typography
- Setting up favicons or metadata
- Ensuring brand consistency across components

---

## Table of Contents

1. [Favicon & App Icons](#favicon--app-icons)
2. [Typography](#typography)
3. [Color System](#color-system)
4. [Header / Navigation Bar](#header--navigation-bar)
5. [Sidebar Navigation](#sidebar-navigation)
6. [Mobile Navigation](#mobile-navigation)
7. [Light / Dark Mode](#light--dark-mode)
8. [Accent Components](#accent-components)
9. [Page Layout Structure](#page-layout-structure)

---

## Favicon & App Icons

### Implementation

Favicons are configured in `app/layout.tsx` via Next.js metadata:

```typescript
export const metadata: Metadata = {
  title: 'Mirror Factory - AI SDK Playground',
  description: 'AI SDK 6 Playground with 24+ models across 7 providers',
  generator: 'Mirror Factory',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}
```

### Adaptive Icons

The favicon automatically adapts to the user's system color scheme:

| File | When Used | Background |
|------|-----------|------------|
| `/icon-light-32x32.png` | Light system theme | Light background |
| `/icon-dark-32x32.png` | Dark system theme | Dark background |
| `/icon.svg` | Fallback / modern browsers | Mint (#87D4C5) |
| `/apple-icon.png` | Apple devices | Mint background |

### Icon Design

The icon uses the "MF" monogram (Mirror Factory initials):

```svg
<!-- public/icon.svg -->
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="37" fill="#87D4C5"/>
  <text x="90" y="110"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="80"
        font-weight="700"
        fill="#0D4D44">MF</text>
</svg>
```

**Icon Colors:**
- Background: `#87D4C5` (mint)
- Text: `#0D4D44` (dark mint/teal for contrast)
- Border radius: 37px (20% of 180)

### Creating New Icon Variants

When creating PNG variants from the SVG:
1. Export at 32x32, 180x180, and 512x512
2. For light theme icon: use dark text on transparent/light background
3. For dark theme icon: use light text on transparent/dark background

---

## Typography

### Font Stack

Three font families are used, configured in `app/layout.tsx`:

```typescript
import { Geist, Geist_Mono, Cormorant_Garamond } from 'next/font/google'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
```

### Font Purposes

| Font | CSS Variable | Used For |
|------|--------------|----------|
| **Geist** | `--font-sans` | Body text, UI elements, paragraphs |
| **Geist Mono** | `--font-mono` | Code blocks, model counts, badges |
| **Cormorant Garamond** | `--font-serif` | Headings (h1, h2, h3), card titles |

### CSS Configuration

Fonts are applied via `app/globals.css`:

```css
@theme inline {
  --font-sans: 'Geist', 'Geist Fallback';
  --font-mono: 'Geist Mono', 'Geist Mono Fallback';
  --font-serif: 'Playfair Display', Georgia, serif;
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }

  /* Serif font for headings and titles */
  h1, h2, h3,
  [data-slot="card-title"] {
    font-family: var(--font-serif), 'Cormorant Garamond', Georgia, serif;
  }
}

/* Utility class for serif font */
.font-serif {
  font-family: var(--font-serif), 'Cormorant Garamond', Georgia, serif;
}
```

### Body Tag Setup

```tsx
<body className={`font-sans antialiased ${cormorant.variable}`}>
```

The `cormorant.variable` adds `--font-serif` CSS variable to the document.

### Typography Usage

```tsx
// Headings - automatically serif via CSS
<h1>Page Title</h1>  // Uses Cormorant Garamond

// Card titles - automatically serif via data-slot
<CardTitle>Card Title</CardTitle>  // Uses Cormorant Garamond

// Body text - default sans
<p>Body text</p>  // Uses Geist

// Code/monospace
<code className="font-mono">code</code>  // Uses Geist Mono

// Explicit serif class
<span className="font-serif">Elegant text</span>
```

---

## Color System

> **Full color documentation**: See `.skills/mint-theming/SKILL.md`

### Core Philosophy

Mirror Factory uses **mint** as its primary accent color in oklch color space.

### Key Variables (Light Mode)

```css
:root {
  --background: oklch(1 0 0);              /* White */
  --foreground: oklch(0.145 0 0);          /* Near black */
  --primary: oklch(0.60 0.12 166);         /* mint-700 */
  --ring: oklch(0.60 0.12 166);            /* Focus rings */
  --card: oklch(1 0 0);                    /* White */
  --muted: oklch(0.97 0 0);                /* Light gray */
  --muted-foreground: oklch(0.556 0 0);    /* Gray text */
  --border: oklch(0.922 0 0);              /* Light border */
}
```

### Key Variables (Dark Mode)

```css
.dark {
  --background: oklch(0.098 0 0);          /* Deep black */
  --foreground: oklch(0.98 0 0);           /* Near white */
  --primary: oklch(0.75 0.12 166);         /* mint-600 */
  --ring: oklch(0.75 0.12 166);            /* Focus rings */
  --card: oklch(0.145 0 0);                /* Dark card */
  --muted: oklch(0.269 0 0);               /* Dark gray */
  --muted-foreground: oklch(0.63 0 0);     /* Zinc-400 */
  --border: oklch(0.269 0 0);              /* Dark border */
}
```

### Mint Palette

```css
--color-mint-50: oklch(0.98 0.03 166);     /* Very light */
--color-mint-200: oklch(0.92 0.05 166);    /* Light */
--color-mint-300: oklch(0.90 0.07 166);    /* Lighter */
--color-mint-500: oklch(0.87 0.12 166);    /* Base */
--color-mint-600: oklch(0.75 0.12 166);    /* Medium - dark mode primary */
--color-mint-700: oklch(0.60 0.12 166);    /* Dark - light mode primary */
--color-mint-900: oklch(0.35 0.10 166);    /* Very dark */
--color-mint-950: oklch(0.15 0.03 166);    /* Almost black */
```

---

## Header / Navigation Bar

### Structure

The header is defined in `app/page.tsx`:

```tsx
<header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6">
  {/* Left side - Logo and tagline */}
  <div className="flex items-center gap-2 md:gap-3">
    <div className="flex items-center gap-2">
      <h1 className="font-bold text-base md:text-lg">Mirror Factory</h1>
    </div>
    <div className="hidden sm:block">
      <p className="hidden text-xs text-muted-foreground md:block">
        Explore all patterns with copy-pastable code
      </p>
    </div>
  </div>

  {/* Right side - Stats and controls */}
  <div className="flex items-center gap-2 md:gap-3">
    <span className="hidden rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary sm:inline-block md:px-3">
      {MODEL_IDS.length} Models
    </span>
    <span className="hidden rounded-full bg-green-600/10 px-2 py-1 font-mono text-xs text-green-600 md:inline-block md:px-3">
      {PATTERN_CATEGORIES.reduce((acc, cat) => acc + cat.patterns.length, 0)} Patterns
    </span>
    <ModeToggle />
  </div>
</header>
```

### Dimensions

| Breakpoint | Height | Horizontal Padding |
|------------|--------|-------------------|
| Mobile (`<md`) | `h-14` (56px) | `px-4` (16px) |
| Desktop (`md+`) | `h-16` (64px) | `px-6` (24px) |

### Header Components

| Element | Mobile | Desktop |
|---------|--------|---------|
| Logo "Mirror Factory" | `text-base` | `text-lg` |
| Tagline | Hidden | `text-xs text-muted-foreground` |
| Model count pill | Hidden on `<sm` | Visible with `font-mono text-xs` |
| Pattern count pill | Hidden on `<md` | Visible with green accent |
| Mode toggle | Always visible | Always visible |

### Key Classes

```tsx
// Header container
"flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6"

// Logo
"font-bold text-base md:text-lg"

// Tagline
"hidden text-xs text-muted-foreground md:block"

// Stat pills (mint)
"hidden rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary sm:inline-block md:px-3"

// Stat pills (green - for pattern count)
"hidden rounded-full bg-green-600/10 px-2 py-1 font-mono text-xs text-green-600 md:inline-block md:px-3"
```

---

## Sidebar Navigation

### Desktop Sidebar

Located in `app/page.tsx`, visible only on `md+` screens:

```tsx
<aside className="hidden w-64 shrink-0 border-r bg-card md:block">
  <ScrollArea className="h-full">
    <SidebarContent
      selectedCategory={selectedCategory}
      selectedPattern={selectedPattern}
      setSelectedCategory={setSelectedCategory}
      setSelectedPattern={setSelectedPattern}
    />
  </ScrollArea>
</aside>
```

### Sidebar Dimensions

- **Width**: `w-64` (256px)
- **Background**: `bg-card`
- **Border**: `border-r`
- **Visibility**: `hidden md:block`

### Sidebar Content Structure

```tsx
function SidebarContent({ ... }) {
  return (
    <div className="space-y-0.5 p-3">
      {PATTERN_CATEGORIES.map((category, idx) => (
        <div key={category.id}>
          {/* Category button */}
          <button
            onClick={() => { ... }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <span>{category.label}</span>
            {category.badge && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-xs text-primary">
                {category.badge}
              </span>
            )}
          </button>

          {/* Nested patterns (when category selected) */}
          {selectedCategory === category.id && (
            <div className="ml-4 mt-0.5 space-y-0 border-l pl-3">
              {category.patterns.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => { ... }}
                  className={`block w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                    selectedPattern === pattern.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {pattern.label}
                </button>
              ))}
            </div>
          )}

          {idx < PATTERN_CATEGORIES.length - 1 && <Separator className="my-1" />}
        </div>
      ))}
    </div>
  );
}
```

### Sidebar States

| State | Classes |
|-------|---------|
| Category selected | `bg-primary/10 text-primary font-medium` |
| Category unselected | `text-muted-foreground hover:bg-accent hover:text-accent-foreground` |
| Pattern selected | `bg-primary/10 text-primary font-medium` |
| Pattern unselected | `text-muted-foreground hover:bg-accent hover:text-accent-foreground` |
| WIP badge | `rounded bg-primary/20 px-1.5 py-0.5 font-mono text-xs text-primary` |

---

## Mobile Navigation

### Mobile Dropdown

For screens `<md`, navigation uses a Select dropdown:

```tsx
{/* Mobile Navigation Dropdown */}
<div className="md:hidden border-b bg-card p-4">
  <Select value={selectedValue} onValueChange={handlePatternChange}>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select a pattern" />
    </SelectTrigger>
    <SelectContent>
      {PATTERN_CATEGORIES.map((category) => (
        <SelectGroup key={category.id}>
          <SelectLabel>{category.label}</SelectLabel>
          {category.patterns.map((pattern) => (
            <SelectItem
              key={`${category.id}-${pattern.id}`}
              value={`${category.id}-${pattern.id}`}
            >
              {pattern.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </SelectContent>
  </Select>
</div>
```

### Mobile vs Desktop

| Feature | Mobile | Desktop |
|---------|--------|---------|
| Navigation | Select dropdown | Sidebar |
| Visibility | `md:hidden` | `hidden md:block` |
| Container | `border-b bg-card p-4` | `w-64 border-r bg-card` |
| Pattern selection | Combined value `category-pattern` | Separate state |

---

## Light / Dark Mode

### Implementation

Dark mode is handled by `next-themes` in `components/theme-provider.tsx`:

```tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Root Layout Setup

```tsx
// app/layout.tsx
<html lang="en" suppressHydrationWarning>
  <body className={`font-sans antialiased ${cormorant.variable}`}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  </body>
</html>
```

### Theme Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| `attribute` | `"class"` | Adds `.dark` class to `<html>` |
| `defaultTheme` | `"system"` | Respects OS preference |
| `enableSystem` | `true` | Enables system theme detection |
| `disableTransitionOnChange` | `true` | Prevents flash on theme change |

### Mode Toggle Component

```tsx
// components/ui/mode-toggle.tsx
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### CSS Variables Approach

The theme uses CSS variables that change based on `.dark` class:

```css
:root {
  --background: oklch(1 0 0);        /* Light */
  --primary: oklch(0.60 0.12 166);   /* mint-700 */
}

.dark {
  --background: oklch(0.098 0 0);    /* Dark */
  --primary: oklch(0.75 0.12 166);   /* mint-600 */
}
```

### Dark Mode CSS Selector

The custom variant in globals.css:

```css
@custom-variant dark (&:is(.dark *));
```

This enables `dark:` prefix in Tailwind classes.

---

## Accent Components

### Mint Pills / Badges

Used for stats, counts, and status indicators:

```tsx
// Model count pill (mint primary)
<span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
  {MODEL_IDS.length} Models
</span>

// Pattern count pill (green accent - exception to mint rule)
<span className="rounded-full bg-green-600/10 px-2 py-1 font-mono text-xs text-green-600">
  {count} Patterns
</span>

// WIP badge
<span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-xs text-primary">
  WIP
</span>
```

### Badge Classes Reference

| Type | Classes |
|------|---------|
| Primary pill | `rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary` |
| Success pill | `rounded-full bg-green-600/10 px-2 py-1 font-mono text-xs text-green-600` |
| WIP badge | `rounded bg-primary/20 px-1.5 py-0.5 font-mono text-xs text-primary` |
| New badge | `rounded bg-primary/20 px-1.5 py-0.5 font-mono text-xs text-primary` |

### Alert Boxes

For informational callouts:

```tsx
// From explainer.tsx
<Alert className="border-primary/30 bg-primary/5">
  <Info className="h-4 w-4 text-primary" />
  <AlertDescription className="ml-2 space-y-3 text-sm leading-relaxed">
    <div>
      <span className="font-serif font-semibold text-primary">{title}:</span>
      <span>{description}</span>
    </div>
  </AlertDescription>
</Alert>
```

---

## Page Layout Structure

### Overall Layout

```tsx
<div className="flex h-screen flex-col bg-background">
  {/* Header */}
  <header className="flex h-14 shrink-0 items-center ... md:h-16">
    ...
  </header>

  {/* Main content area */}
  <div className="flex flex-1 overflow-hidden">
    {/* Desktop Sidebar */}
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <ScrollArea className="h-full">
        ...
      </ScrollArea>
    </aside>

    {/* Main Content */}
    <main className="flex-1 overflow-auto">
      {/* Mobile Navigation (md:hidden) */}
      <div className="md:hidden border-b bg-card p-4">
        ...
      </div>

      {/* Content Container */}
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        {/* Optional controls */}
        <div className="mb-6">
          ...
        </div>

        {/* Page content */}
        {PatternComponent && <PatternComponent />}
      </div>
    </main>
  </div>
</div>
```

### Layout Classes Breakdown

| Element | Classes | Purpose |
|---------|---------|---------|
| Root | `flex h-screen flex-col bg-background` | Full height, column flex |
| Header | `flex h-14 shrink-0 ... md:h-16` | Fixed height header |
| Content wrapper | `flex flex-1 overflow-hidden` | Fill remaining space |
| Sidebar | `hidden w-64 shrink-0 border-r bg-card md:block` | Fixed width, desktop only |
| Main | `flex-1 overflow-auto` | Scrollable content area |
| Content container | `mx-auto max-w-5xl p-4 md:p-8` | Centered, max width |

### Responsive Breakpoints

| Breakpoint | Prefix | Width |
|------------|--------|-------|
| Small | `sm:` | ≥640px |
| Medium | `md:` | ≥768px |
| Large | `lg:` | ≥1024px |

### Key Responsive Behaviors

1. **Header height**: 56px mobile → 64px desktop
2. **Navigation**: Dropdown mobile → Sidebar desktop
3. **Content padding**: 16px mobile → 32px desktop
4. **Stats pills**: Hidden on small, progressively shown

---

## Quick Reference

### Essential Classes

```tsx
// Page container
"flex h-screen flex-col bg-background"

// Header
"flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6"

// Sidebar
"hidden w-64 shrink-0 border-r bg-card md:block"

// Main content
"flex-1 overflow-auto"

// Content wrapper
"mx-auto max-w-5xl p-4 md:p-8"

// Primary pill
"rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary"

// Selected nav item
"bg-primary/10 text-primary font-medium"

// Unselected nav item
"text-muted-foreground hover:bg-accent hover:text-accent-foreground"
```

### Files Reference

| Purpose | File |
|---------|------|
| Root layout & fonts | `app/layout.tsx` |
| Page structure | `app/page.tsx` |
| CSS variables & theme | `app/globals.css` |
| Theme provider | `components/theme-provider.tsx` |
| Mode toggle | `components/ui/mode-toggle.tsx` |
| Color guide | `.skills/mint-theming/SKILL.md` |
| Pattern config | `lib/patterns/config.ts` |

---

## Creating New Pages

When creating new pages, follow this template:

```tsx
'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModeToggle } from '@/components/ui/mode-toggle';

export default function NewPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="font-bold text-base md:text-lg">Mirror Factory</h1>
          <p className="hidden text-xs text-muted-foreground md:block">
            Page description
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ModeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-4 md:p-8">
          {/* Your content here */}
        </div>
      </main>
    </div>
  );
}
```

---

## Checklist for New Components

- [ ] Uses semantic color variables (`text-primary`, `bg-card`, etc.)
- [ ] Responsive classes for mobile/desktop
- [ ] Proper dark mode support (test both themes)
- [ ] Font consistency (serif for headings, sans for body)
- [ ] Correct spacing scale (Tailwind defaults)
- [ ] Accessible focus states (`ring-primary`)
- [ ] Consistent border radius (`rounded-lg`, `rounded-full`)
