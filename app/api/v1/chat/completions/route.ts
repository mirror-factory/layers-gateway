/**
 * Alias for /api/v1/chat
 *
 * This endpoint exists for OpenAI SDK compatibility.
 * The AI SDK's createOpenAI expects /chat/completions, not just /chat.
 *
 * Both endpoints are identical - this just re-exports the parent route.
 */

export { POST, GET } from '../route';
