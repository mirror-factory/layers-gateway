# Mint Theming for Hustle Together AI

You are an expert at maintaining the mint color theme in the Hustle Together AI project.

## When to use this skill

Use this skill when:
- Adding new UI components or patterns
- Updating colors or themes
- Reviewing code for color consistency
- Fixing accessibility issues with colors

## Color Philosophy

Hustle Together AI uses **mint** as its primary accent color. This provides:
- A unique, fresh brand identity
- Good contrast in both light and dark modes
- Professional, accessible color combinations

## CRITICAL RULES

### ❌ NEVER Use These Colors for Accents

```typescript
// WRONG - Don't use these for accent colors
text-blue-500
bg-green-600
text-purple-400
border-orange-500
```

### ✅ ALWAYS Use These Instead

```typescript
// CORRECT - Use semantic colors or mint shades
text-primary          // Uses mint via CSS variables
bg-primary
border-primary

// OR use explicit mint classes
text-mint-600
bg-mint-50
border-mint-500
```

## Mint Color Palette

Available in `app/globals.css`:

```css
--color-mint-50: oklch(0.98 0.03 166);    /* Very light mint */
--color-mint-200: oklch(0.92 0.05 166);   /* Light mint */
--color-mint-300: oklch(0.90 0.07 166);   /* Lighter mint */
--color-mint-500: oklch(0.87 0.12 166);   /* Base mint */
--color-mint-600: oklch(0.75 0.12 166);   /* Medium mint */
--color-mint-700: oklch(0.60 0.12 166);   /* Dark mint */
--color-mint-900: oklch(0.35 0.10 166);   /* Very dark mint */
--color-mint-950: oklch(0.15 0.03 166);   /* Almost black mint */
```

## Semantic Color Variables

The global theme uses mint for primary colors:

### Light Mode
```css
:root {
  --primary: oklch(0.60 0.12 166);        /* mint-700 - darker for contrast */
  --ring: oklch(0.60 0.12 166);           /* mint-700 - focus rings */
  --sidebar-primary: oklch(0.60 0.12 166); /* mint-700 */
}
```

### Dark Mode
```css
.dark {
  --primary: oklch(0.75 0.12 166);        /* mint-600 - lighter for dark bg */
  --ring: oklch(0.75 0.12 166);           /* mint-600 - focus rings */
  --sidebar-primary: oklch(0.75 0.12 166); /* mint-600 */
}
```

## Usage Patterns

### 1. Primary Actions and Links

```typescript
// Buttons automatically use primary color
<Button>Action</Button>

// Links
<a className="text-primary hover:text-primary/80">Link</a>
```

### 2. Alerts and Info Boxes

```typescript
// Good - Uses mint
<Alert className="border-mint-500/30 bg-mint-50 dark:bg-mint-950/20">
  <Globe className="h-4 w-4 text-mint-600" />
  <AlertDescription className="text-xs text-mint-700 dark:text-mint-300">
    Information message
  </AlertDescription>
</Alert>

// Bad - Uses blue
<Alert className="border-blue-500/30 bg-blue-50">  {/* ❌ */}
```

### 3. Icons and Indicators

```typescript
// Good - Mint colors
<CheckCircle2 className="h-4 w-4 text-mint-600" />
<Brain className="h-4 w-4 text-mint-600 dark:text-mint-400" />

// Bad - Hardcoded colors
<CheckCircle2 className="h-4 w-4 text-green-500" />  {/* ❌ */}
<Brain className="h-4 w-4 text-blue-600" />  {/* ❌ */}
```

### 4. Backgrounds and Borders

```typescript
// Light backgrounds
className="bg-mint-50 dark:bg-mint-950/20"

// Borders
className="border-mint-300 dark:border-mint-900/50"

// With opacity
className="bg-mint-600/10"
className="border-mint-500/30"
```

### 5. Text Colors

```typescript
// Text that needs good contrast
className="text-mint-700 dark:text-mint-200"

// Muted text with mint tint
className="text-mint-600 dark:text-mint-400"

// Very subtle mint
className="text-mint-700 dark:text-mint-300"
```

## Common Patterns

### Pattern Cards

```typescript
<div className="rounded-lg bg-primary/10 p-2">
  <Icon className="h-5 w-5 text-primary" />
</div>
```

### Provider Badges (Neutral)

```typescript
// Provider badges should be NEUTRAL, not colored
const PROVIDER_COLORS = {
  anthropic: 'bg-muted text-foreground',
  openai: 'bg-muted text-foreground',
  google: 'bg-muted text-foreground',
};
```

### Status Indicators

```typescript
// Success/Active states - use mint
<span className="bg-mint-500/20 text-mint-600">Active</span>

// Error states - use red (exception)
<span className="bg-red-500/20 text-red-600">Error</span>

// Neutral states - use gray
<span className="bg-muted text-muted-foreground">Pending</span>
```

## Accessibility Guidelines

### Contrast Requirements

- **Light mode**: Use darker mint shades (mint-700, mint-900) for text
- **Dark mode**: Use lighter mint shades (mint-200, mint-300, mint-400) for text

### Testing Contrast

```typescript
// Good contrast in light mode
text-mint-700  // On white background ✅

// Good contrast in dark mode
dark:text-mint-200  // On dark background ✅

// Bad - insufficient contrast
text-mint-300  // On white background ❌
```

## Migration Checklist

When updating existing components to mint:

- [ ] Replace all `text-blue-*` with `text-mint-*` or `text-primary`
- [ ] Replace all `bg-blue-*` with `bg-mint-*` or `bg-primary/10`
- [ ] Replace all `border-blue-*` with `border-mint-*`
- [ ] Remove any `text-green-*`, `text-purple-*` accent colors (use neutral or mint)
- [ ] Test in both light and dark modes
- [ ] Verify focus states use mint (`ring-primary`)
- [ ] Check hover states use mint tints

## Common Mistakes to Avoid

### ❌ Mistake 1: Hardcoding Blue
```typescript
// Wrong
<div className="bg-blue-50 text-blue-700">
```

```typescript
// Correct
<div className="bg-mint-50 text-mint-700">
```

### ❌ Mistake 2: Using Multiple Accent Colors
```typescript
// Wrong - mixing accent colors
<CheckCircle className="text-green-500" />
<Brain className="text-purple-500" />
<Globe className="text-blue-500" />
```

```typescript
// Correct - consistent mint
<CheckCircle className="text-mint-600" />
<Brain className="text-mint-600" />
<Globe className="text-mint-600" />
```

### ❌ Mistake 3: Forgetting Dark Mode
```typescript
// Wrong - only light mode
className="text-mint-700"
```

```typescript
// Correct - both modes
className="text-mint-700 dark:text-mint-200"
```

### ❌ Mistake 4: Poor Contrast
```typescript
// Wrong - mint-300 is too light for text
className="text-mint-300"  // Bad contrast
```

```typescript
// Correct - darker shade for better readability
className="text-mint-700 dark:text-mint-200"
```

## Quick Reference

### Most Common Classes

```typescript
// Backgrounds
"bg-mint-50 dark:bg-mint-950/20"      // Very light background
"bg-mint-600/10"                      // Subtle tinted background

// Text
"text-mint-700 dark:text-mint-200"    // High contrast text
"text-mint-600 dark:text-mint-400"    // Medium contrast text

// Borders
"border-mint-300 dark:border-mint-900/50"  // Visible borders
"border-mint-500/30"                       // Subtle borders

// Icons
"text-mint-600"                       // Works in both modes
"text-mint-600 dark:text-mint-400"    // Optimized for both modes
```

## Tools and Helpers

### Finding Hardcoded Colors

```bash
# Search for hardcoded blue/green/purple accents
grep -r "text-blue-" components/
grep -r "bg-green-" components/
grep -r "text-purple-" components/
```

### Global Find and Replace

Use the Edit tool with `replace_all: true` to update multiple instances:

```typescript
// Find all instances of text-blue-600
old_string: "text-blue-600"
new_string: "text-mint-600"
replace_all: true
```

## Remember

1. **Mint is the accent** - Use it for all accent colors, not just some
2. **Semantic first** - Prefer `text-primary` over `text-mint-600` when possible
3. **Test both themes** - Always verify light AND dark modes
4. **Accessibility matters** - Ensure sufficient contrast
5. **Be consistent** - All similar elements should use the same mint shade