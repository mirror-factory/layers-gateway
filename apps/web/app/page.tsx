export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Layers API</h1>
      <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
        Unified AI gateway with authentication, credit management, and usage tracking.
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>API Endpoints</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li><code>GET /api/v1/chat</code> - Health check</li>
          <li><code>POST /api/v1/chat</code> - Chat completions (OpenAI-compatible)</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Authentication</h2>
        <p>
          All requests require an API key in the Authorization header:
        </p>
        <pre style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`curl -X POST https://api.layers.dev/api/v1/chat \\
  -H "Authorization: Bearer lyr_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
        </pre>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Supported Models</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li><strong>Anthropic:</strong> claude-haiku-4.5, claude-sonnet-4.5, claude-opus-4.5</li>
          <li><strong>OpenAI:</strong> gpt-4o, gpt-4o-mini, gpt-5-chat, gpt-5-codex</li>
          <li><strong>Google:</strong> gemini-2.5-flash, gemini-2.5-pro, gemini-3-flash</li>
          <li><strong>Perplexity:</strong> sonar, sonar-pro, sonar-reasoning-pro</li>
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Documentation</h2>
        <p>
          Full API documentation: <a href="https://preview.hustletogether.com/docs" style={{ color: '#0070f3' }}>
            preview.hustletogether.com/docs
          </a>
        </p>
      </section>
    </main>
  );
}
