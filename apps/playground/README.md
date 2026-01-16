# Layers Playground

Interactive AI playground demonstrating real-world Layers API integration.

## Overview

This standalone Next.js application showcases how to integrate with the Layers API using the full middleware stack:

- **Authentication** - API key validation
- **Rate Limiting** - Tier-based request throttling
- **Credit Tracking** - Usage metering and billing
- **Gateway Routing** - Multi-provider AI model access

## Features

- **Model Selection** - Choose from 50+ AI models across 7 providers
- **Real-time Streaming** - Token-by-token response streaming
- **Code Export** - Generate TypeScript, Python, or cURL examples
- **Usage Tracking** - Monitor token usage and credit costs
- **Settings Panel** - Adjust temperature, max tokens, and more

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Layers API key (get one at [layers.dev](https://layers.dev))

### Installation

```bash
# From the monorepo root
pnpm install

# Start the playground
pnpm dev --filter=@layers/playground
```

### Environment Variables

Create a `.env.local` file:

```bash
# Copy the example
cp .env.example .env.local

# Edit with your API key
LAYERS_API_URL=http://localhost:3006  # or https://api.layers.dev
LAYERS_API_KEY=your_api_key_here
```

### Development

```bash
# Run in development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture

```
apps/playground/
├── app/
│   ├── api/chat/route.ts    # Proxy to Layers API
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main playground page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── model-selector.tsx   # Model picker with grouping
│   ├── prompt-editor.tsx    # Message input with system prompt
│   ├── response-display.tsx # Chat message display
│   ├── settings-panel.tsx   # Parameter controls
│   └── code-export.tsx      # Code generation
├── hooks/
│   ├── use-layers-chat.ts   # Chat state management
│   └── use-toast.ts         # Toast notifications
└── lib/
    ├── layers-client.ts     # API client with streaming
    ├── models.ts            # Model registry reference
    └── utils.ts             # Utility functions
```

## API Integration

The playground proxies requests through `/api/chat` to the Layers API:

```typescript
// Client sends message
const { stream } = await chatStream({
  model: 'anthropic/claude-sonnet-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});

// Playground API proxies to Layers
POST /api/chat → https://api.layers.dev/api/v1/chat

// Full middleware runs on Layers side
Auth → Rate-Limit → Credits → Gateway → Response
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
