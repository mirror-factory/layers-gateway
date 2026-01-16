'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  Plus,
  Trash2,
  Loader2,
  Hash,
  BarChart3,
  Grid3X3,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { createEmbeddings, cosineSimilarity, type EmbeddingData, type EmbeddingUsage } from '@/lib/layers-client';
import { cn, formatNumber } from '@/lib/utils';

// Popular embedding models
const EMBEDDING_MODELS = [
  { id: 'openai/text-embedding-3-small', name: 'OpenAI text-embedding-3-small', dimensions: 1536 },
  { id: 'openai/text-embedding-3-large', name: 'OpenAI text-embedding-3-large', dimensions: 3072 },
  { id: 'openai/text-embedding-ada-002', name: 'OpenAI text-embedding-ada-002', dimensions: 1536 },
  { id: 'cohere/embed-english-v3.0', name: 'Cohere embed-english-v3.0', dimensions: 1024 },
  { id: 'cohere/embed-multilingual-v3.0', name: 'Cohere embed-multilingual-v3.0', dimensions: 1024 },
  { id: 'voyage/voyage-large-2', name: 'Voyage voyage-large-2', dimensions: 1536 },
  { id: 'voyage/voyage-code-2', name: 'Voyage voyage-code-2', dimensions: 1536 },
];

interface TextEntry {
  id: string;
  text: string;
  embedding?: number[];
  label?: string;
}

interface EmbeddingResult {
  entries: TextEntry[];
  usage?: EmbeddingUsage;
  model?: string;
}

export function EmbeddingsPanel() {
  const [model, setModel] = useState(EMBEDDING_MODELS[0].id);
  const [customDimensions, setCustomDimensions] = useState<number | undefined>(undefined);
  const [entries, setEntries] = useState<TextEntry[]>([
    { id: '1', text: '', label: 'Text 1' },
    { id: '2', text: '', label: 'Text 2' },
  ]);
  const [result, setResult] = useState<EmbeddingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Add a new text entry
  const addEntry = useCallback(() => {
    const newId = `${Date.now()}`;
    setEntries((prev) => [
      ...prev,
      { id: newId, text: '', label: `Text ${prev.length + 1}` },
    ]);
  }, []);

  // Update an entry
  const updateEntry = useCallback((id: string, updates: Partial<TextEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  // Remove an entry
  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Generate embeddings
  const generateEmbeddings = useCallback(async () => {
    const validEntries = entries.filter((e) => e.text.trim());
    if (validEntries.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const texts = validEntries.map((e) => e.text.trim());
      const response = await createEmbeddings({
        model,
        input: texts,
        dimensions: customDimensions,
      });

      // Map embeddings back to entries
      const entriesWithEmbeddings = validEntries.map((entry, index) => ({
        ...entry,
        embedding: response.data[index]?.embedding,
      }));

      setResult({
        entries: entriesWithEmbeddings,
        usage: response.usage,
        model: response.model,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate embeddings');
    } finally {
      setIsLoading(false);
    }
  }, [entries, model, customDimensions]);

  // Calculate similarity matrix
  const similarityMatrix = useMemo(() => {
    if (!result || result.entries.length < 2) return null;

    const matrix: number[][] = [];
    for (let i = 0; i < result.entries.length; i++) {
      const row: number[] = [];
      const embeddingI = result.entries[i].embedding;
      for (let j = 0; j < result.entries.length; j++) {
        const embeddingJ = result.entries[j].embedding;
        if (embeddingI && embeddingJ) {
          row.push(cosineSimilarity(embeddingI, embeddingJ));
        } else {
          row.push(0);
        }
      }
      matrix.push(row);
    }
    return matrix;
  }, [result]);

  // Copy embedding to clipboard
  const copyEmbedding = useCallback(async (embedding: number[], index: number) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(embedding));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }, []);

  // Get color for similarity value (green = similar, red = different)
  const getSimilarityColor = (value: number, isDiagonal: boolean) => {
    if (isDiagonal) return 'bg-muted';
    if (value >= 0.9) return 'bg-green-500/30 text-green-700 dark:text-green-300';
    if (value >= 0.7) return 'bg-green-500/20 text-green-600 dark:text-green-400';
    if (value >= 0.5) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
    if (value >= 0.3) return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
    return 'bg-red-500/20 text-red-600 dark:text-red-400';
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-1">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Embedding Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMBEDDING_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {m.dimensions}d
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Dimensions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">Custom Dimensions</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Some models support custom output dimensions. Leave empty for default.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                placeholder="Default"
                value={customDimensions || ''}
                onChange={(e) =>
                  setCustomDimensions(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="h-8 text-xs"
              />
            </div>

            <Separator />

            {/* Text Entries */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Texts to Embed</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addEntry}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Text
                </Button>
              </div>

              {entries.map((entry, index) => (
                <Card key={entry.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={entry.label || ''}
                      onChange={(e) => updateEntry(entry.id, { label: e.target.value })}
                      placeholder={`Text ${index + 1}`}
                      className="h-6 text-xs font-medium w-32"
                    />
                    {entries.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeEntry(entry.id)}
                        className="h-6 w-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Enter text to embed..."
                    value={entry.text}
                    onChange={(e) => updateEntry(entry.id, { text: e.target.value })}
                    className="text-xs min-h-[60px] resize-none"
                  />
                </Card>
              ))}
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateEmbeddings}
              disabled={isLoading || entries.every((e) => !e.text.trim())}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Embeddings
                </>
              )}
            </Button>

            {/* Error */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="py-3">
                  <p className="text-xs text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {result && (
              <>
                <Separator />

                {/* Usage */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>{formatNumber(result.usage?.total_tokens || 0)} tokens</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{result.model}</span>
                </div>

                {/* Similarity Matrix */}
                {similarityMatrix && result.entries.length > 1 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        Similarity Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="overflow-x-auto">
                        <table className="text-[10px] w-full">
                          <thead>
                            <tr>
                              <th className="p-1 text-left"></th>
                              {result.entries.map((e, i) => (
                                <th key={i} className="p-1 text-center font-medium truncate max-w-[60px]">
                                  {e.label || `T${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.entries.map((rowEntry, i) => (
                              <tr key={i}>
                                <td className="p-1 font-medium truncate max-w-[60px]">
                                  {rowEntry.label || `T${i + 1}`}
                                </td>
                                {similarityMatrix[i].map((value, j) => (
                                  <td
                                    key={j}
                                    className={cn(
                                      'p-1 text-center rounded',
                                      getSimilarityColor(value, i === j)
                                    )}
                                  >
                                    {i === j ? '1.00' : value.toFixed(2)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-green-500/30" />
                          <span>Similar (&gt;0.7)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-yellow-500/20" />
                          <span>Moderate</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-red-500/20" />
                          <span>Different</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Embedding Vectors */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Embedding Vectors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-4 space-y-3">
                    {result.entries.map((entry, index) => (
                      <div key={entry.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{entry.label || `Text ${index + 1}`}</span>
                          {entry.embedding && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px]">
                                {entry.embedding.length}d
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5"
                                onClick={() => entry.embedding && copyEmbedding(entry.embedding, index)}
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {entry.embedding && (
                          <>
                            {/* Mini bar visualization of first 50 dimensions */}
                            <div className="flex items-end h-8 gap-px bg-muted/50 rounded p-1">
                              {entry.embedding.slice(0, 50).map((val, i) => {
                                // Normalize to 0-1 range (embeddings are typically -1 to 1)
                                const normalized = (val + 1) / 2;
                                return (
                                  <div
                                    key={i}
                                    className="flex-1 bg-primary/70 rounded-sm"
                                    style={{ height: `${Math.max(2, normalized * 100)}%` }}
                                  />
                                );
                              })}
                            </div>
                            <p className="text-[9px] text-muted-foreground">
                              First 50 of {entry.embedding.length} dimensions
                            </p>

                            {/* Numeric preview */}
                            <div className="text-[9px] font-mono text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto">
                              [{entry.embedding.slice(0, 8).map((v) => v.toFixed(4)).join(', ')}...]
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
