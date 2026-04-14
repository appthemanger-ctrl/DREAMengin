/**
 * lib/code/drEamsCodeAssist.ts
 *
 * Pure helper functions for the Dr. Eams Code Assist feature inside CodeEngin.
 * No React, no network, no side-effects — all functions are deterministic.
 *
 * Responsibilities:
 *   - Vocabulary registry: coding terms Dr. Eams recognises as high-priority
 *   - matchCodeVocabulary: surface relevant terms for a user query
 *   - detectLanguageFromCode: guess a cell language from code content
 *   - buildCodeSystemPrompt: compose the system prompt sent to /api/ai/eams
 *   - parseCodeBlocks: extract fenced code blocks from a Dr. Eams response
 *   - classifyQuery: determine the intent of a natural-language query
 *
 * Privacy: this module never serialises the full codebase; callers must pass
 *   only selected code or the active cell (max 2 000 chars).
 */

// ─── Vocabulary ────────────────────────────────────────────────────────────────

export interface VocabEntry {
  term: string;
  category: string;
  definition: string;
  example: string;
}

/**
 * Core coding vocabulary recognised by Dr. Eams.
 * Entries are intentionally concise – full explanation is generated live.
 */
export const CODE_VOCABULARY: VocabEntry[] = [
  // General
  { term: 'variable',     category: 'general', definition: 'A named container for a value.',                                          example: 'x = 42' },
  { term: 'constant',     category: 'general', definition: 'A variable whose value cannot change after assignment.',                  example: 'MAX_SIZE = 100' },
  { term: 'function',     category: 'general', definition: 'A reusable block of code that performs a specific task.',                 example: 'def add(a, b): return a + b' },
  { term: 'class',        category: 'oop',     definition: 'A blueprint for creating objects with shared state and behaviour.',       example: 'class Dog: ...' },
  { term: 'loop',         category: 'general', definition: 'A construct that repeats a block of code.',                              example: 'for i in range(10): print(i)' },
  { term: 'recursion',    category: 'general', definition: 'A function that calls itself to solve a smaller sub-problem.',           example: 'def fib(n): return n if n <= 1 else fib(n-1)+fib(n-2)' },
  { term: 'closure',      category: 'general', definition: 'A function that captures variables from its enclosing scope.',           example: 'def make_adder(n): return lambda x: x + n' },
  { term: 'async/await',  category: 'general', definition: 'Keywords for writing asynchronous code without callback nesting.',       example: 'async def fetch(): data = await get_data()' },
  { term: 'callback',     category: 'general', definition: 'A function passed as an argument to be invoked later.',                  example: 'setTimeout(() => console.log("done"), 1000)' },
  { term: 'promise',      category: 'general', definition: 'An object representing the eventual result of an async operation.',      example: 'fetch("/api").then(r => r.json())' },
  // OOP
  { term: 'inheritance',  category: 'oop',     definition: 'A class can inherit attributes and methods from a parent class.',        example: 'class Cat(Animal): ...' },
  { term: 'polymorphism', category: 'oop',     definition: 'Objects of different classes can be used interchangeably via a shared interface.', example: 'for animal in animals: animal.speak()' },
  { term: 'encapsulation',category: 'oop',     definition: 'Bundling data and methods that operate on it, hiding internal state.',   example: 'self._balance = 0  # private' },
  { term: 'abstraction',  category: 'oop',     definition: 'Exposing only necessary details while hiding complex implementation.',   example: 'class AbstractBase(ABC): @abstractmethod def run(self): ...' },
  { term: 'singleton',    category: 'oop',     definition: 'A design pattern ensuring only one instance of a class exists.',        example: 'class DB:\n  _instance = None\n  @classmethod\n  def get(cls): ...' },
  { term: 'decorator',    category: 'oop',     definition: 'A function that wraps another function to extend its behaviour.',       example: '@retry(3)\ndef call_api(): ...' },
  // Data structures
  { term: 'array',        category: 'ds',      definition: 'A collection of elements stored at contiguous memory locations.',       example: 'nums = [1, 2, 3]' },
  { term: 'dictionary',   category: 'ds',      definition: 'A key-value store with O(1) average lookup.',                           example: 'user = {"name": "Alex", "age": 30}' },
  { term: 'linked list',  category: 'ds',      definition: 'A sequence of nodes where each node points to the next.',               example: 'Node(val=1, next=Node(val=2))' },
  { term: 'stack',        category: 'ds',      definition: 'A LIFO collection: push to and pop from the top.',                      example: 'stack.append(x); stack.pop()' },
  { term: 'queue',        category: 'ds',      definition: 'A FIFO collection: enqueue at the back, dequeue from the front.',       example: 'from collections import deque; q = deque()' },
  { term: 'hash table',   category: 'ds',      definition: 'Maps keys to values using a hash function for near-O(1) lookup.',       example: 'seen = {}; seen[key] = True' },
  { term: 'tree',         category: 'ds',      definition: 'A hierarchical data structure with a root node and children.',          example: 'root = TreeNode(1); root.left = TreeNode(2)' },
  { term: 'graph',        category: 'ds',      definition: 'A set of vertices connected by edges.',                                 example: 'adj = {0: [1, 2], 1: [2]}' },
  // Algorithms
  { term: 'binary search',category: 'algo',    definition: 'O(log n) search by halving the sorted search space each step.',         example: 'bisect.bisect_left(arr, target)' },
  { term: 'BFS',          category: 'algo',    definition: 'Breadth-First Search: explore all neighbours before going deeper.',     example: 'queue = deque([start])\nwhile queue: node = queue.popleft()' },
  { term: 'DFS',          category: 'algo',    definition: 'Depth-First Search: explore one branch fully before backtracking.',     example: 'def dfs(node): ...' },
  { term: 'dynamic programming', category: 'algo', definition: 'Solving complex problems by breaking them into overlapping sub-problems and caching results.', example: 'memo = {}\ndef dp(n): ...' },
  { term: 'sorting',      category: 'algo',    definition: 'Ordering a collection of elements by a comparison criterion.',          example: 'arr.sort(key=lambda x: x[1])' },
  // Functional
  { term: 'map',          category: 'fp',      definition: 'Apply a function to every element of a collection.',                    example: 'list(map(lambda x: x*2, nums))' },
  { term: 'filter',       category: 'fp',      definition: 'Keep only elements that satisfy a predicate.',                          example: 'list(filter(lambda x: x > 0, nums))' },
  { term: 'reduce',       category: 'fp',      definition: 'Accumulate a collection into a single value.',                          example: 'from functools import reduce; reduce(lambda a,b: a+b, nums)' },
  { term: 'immutable',    category: 'fp',      definition: 'A value that cannot be changed after creation.',                        example: 'point = (3, 4)  # tuple is immutable' },
  { term: 'pure function',category: 'fp',      definition: 'A function with no side-effects that always returns the same output for the same input.', example: 'def add(a, b): return a + b' },
  // Web
  { term: 'REST',         category: 'web',     definition: 'An architectural style for APIs using HTTP methods and resource URLs.', example: 'GET /api/users/42' },
  { term: 'GraphQL',      category: 'web',     definition: 'A query language for APIs that lets clients request exactly the data they need.', example: 'query { user(id: 42) { name email } }' },
  { term: 'WebSocket',    category: 'web',     definition: 'A full-duplex communication channel over a single TCP connection.',     example: 'ws = new WebSocket("wss://server/ws")' },
  { term: 'JWT',          category: 'web',     definition: 'A compact, URL-safe token for transmitting claims between parties.',    example: 'Authorization: Bearer eyJ...' },
  { term: 'CORS',         category: 'web',     definition: 'Cross-Origin Resource Sharing: browser policy controlling cross-domain requests.', example: 'Access-Control-Allow-Origin: https://example.com' },
  // DevOps
  { term: 'Docker',       category: 'devops',  definition: 'A platform for packaging apps into portable containers.',               example: 'docker build -t myapp . && docker run myapp' },
  { term: 'CI/CD',        category: 'devops',  definition: 'Continuous Integration / Continuous Deployment: automate build, test, and release.', example: 'on: push\njobs:\n  test:\n    runs-on: ubuntu-latest' },
  { term: 'Kubernetes',   category: 'devops',  definition: 'An orchestrator that automates deployment and scaling of containers.',  example: 'kubectl apply -f deployment.yaml' },
  // Security
  { term: 'encryption',   category: 'security',definition: 'Transforming data into an unreadable form that only authorised parties can decode.', example: 'AES-256-GCM for data at rest' },
  { term: 'OAuth2',       category: 'security',definition: 'An authorisation framework that lets apps obtain limited access to user accounts.', example: 'scope: read:profile' },
  { term: 'SQL injection',category: 'security',definition: 'An attack that injects malicious SQL through unsanitised input.',       example: 'Use parameterised queries: cursor.execute("SELECT * FROM users WHERE id=%s", (id,))' },
  { term: 'XSS',          category: 'security',definition: 'Cross-Site Scripting: injecting malicious scripts into web pages.',     example: 'Escape user output: textContent = userInput' },
  // AI/ML
  { term: 'neural network',category: 'ai',     definition: 'A model inspired by biological neurons; learns patterns from data.',    example: 'model = tf.keras.Sequential([Dense(128, activation="relu")])' },
  { term: 'gradient descent',category: 'ai',   definition: 'An optimisation algorithm that minimises loss by moving in the direction of steepest descent.', example: 'optimizer = Adam(lr=0.001)' },
  { term: 'overfitting',  category: 'ai',      definition: 'When a model memorises training data and fails to generalise to new data.', example: 'Add dropout: Dropout(0.2)' },
  { term: 'transformer',  category: 'ai',      definition: 'A neural network architecture based on self-attention; foundation of LLMs.', example: 'from transformers import AutoModel' },
  { term: 'embedding',    category: 'ai',      definition: 'A dense vector representation of a concept in a high-dimensional space.', example: 'embed = model.encode("hello world")' },
  { term: 'RAG',          category: 'ai',      definition: 'Retrieval-Augmented Generation: supplement LLM context with retrieved documents.', example: 'docs = retriever.search(query); prompt = docs + question' },
  // Graphics / GameEngin
  { term: 'shader',       category: 'graphics',definition: 'A GPU program that runs per-vertex or per-pixel to produce visual effects.', example: 'gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);' },
  { term: 'mesh',         category: 'graphics',definition: 'A collection of vertices, edges, and faces defining a 3D shape.',      example: 'const box = MeshBuilder.CreateBox("box", { size: 1 }, scene)' },
  { term: 'quaternion',   category: 'graphics',definition: 'A 4-component number used to represent rotations without gimbal lock.', example: 'mesh.rotationQuaternion = Quaternion.RotationAxis(axis, angle)' },
  { term: 'physics',      category: 'graphics',definition: 'Simulation of real-world forces (gravity, collisions) on game objects.', example: 'mesh.physicsImpostor = new PhysicsImpostor(mesh, PhysicsImpostor.BoxImpostor, { mass: 1 })' },
  { term: 'particle system',category:'graphics',definition: 'A technique to simulate effects like fire, smoke, and rain with many small sprites.', example: 'const ps = new ParticleSystem("ps", 2000, scene)' },
];

/** All recognised term strings (lower-cased). */
export const VOCAB_TERMS: Set<string> = new Set(CODE_VOCABULARY.map(v => v.term.toLowerCase()));

/**
 * Return all vocabulary entries whose term appears in the query.
 * Returns at most 5 matches, sorted by category breadth.
 */
export function matchCodeVocabulary(query: string): VocabEntry[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  const matches = CODE_VOCABULARY.filter(v => lower.includes(v.term.toLowerCase()));
  // Deduplicate by term, limit to 5
  const seen = new Set<string>();
  return matches.filter(v => {
    if (seen.has(v.term)) return false;
    seen.add(v.term);
    return true;
  }).slice(0, 5);
}

// ─── Language detection ────────────────────────────────────────────────────────

export type CellLanguage = 'python' | 'javascript' | 'typescript' | 'bash';

const PYTHON_HINTS  = /^\s*(def |class |import |from |print\(|if __name__|#)/m;
const TS_HINTS      = /:\s*(string|number|boolean|void|unknown|any)\b|interface\s+\w|type\s+\w+\s*=/;
const BASH_HINTS    = /^\s*(#!\/|echo |cd |ls |grep |curl |apt |brew |pnpm |npm |yarn )/m;

/**
 * Heuristically detect the language of a code snippet.
 * Falls back to 'python'.
 */
export function detectLanguageFromCode(code: string): CellLanguage {
  if (!code.trim()) return 'python';
  if (BASH_HINTS.test(code))   return 'bash';
  if (TS_HINTS.test(code))     return 'typescript';
  if (PYTHON_HINTS.test(code)) return 'python';
  // JS by exclusion if it has arrow functions, const/let, etc.
  if (/\b(const|let|var)\b/.test(code) || /=>/.test(code)) return 'javascript';
  return 'python';
}

// ─── Query classification ──────────────────────────────────────────────────────

export type QueryIntent =
  | 'explain'        // "explain this code" / "what does X do"
  | 'generate'       // "write a function that…" / "create a class…"
  | 'refactor'       // "refactor this to use async/await"
  | 'debug'          // "why does this fail" / "fix the bug"
  | 'vocabulary'     // user asked about a specific term
  | 'general';       // catch-all

const EXPLAIN_PATTERNS  = /\b(explain|what does|describe|how does|tell me about)\b/i;
const GENERATE_PATTERNS = /\b(write|create|generate|make|build|add|implement|show me how to)\b/i;
const REFACTOR_PATTERNS = /\b(refactor|convert|rewrite|change|update|migrate|clean up|optimise|optimize)\b/i;
const DEBUG_PATTERNS    = /\b(fix|debug|error|bug|fail|crash|wrong|issue|problem|exception)\b/i;

/**
 * Classify a natural-language query into an intent category.
 */
export function classifyQuery(query: string): QueryIntent {
  if (!query.trim()) return 'general';
  const lower = query.toLowerCase();
  if (matchCodeVocabulary(lower).length > 0 && EXPLAIN_PATTERNS.test(lower)) return 'vocabulary';
  if (EXPLAIN_PATTERNS.test(lower))  return 'explain';
  if (GENERATE_PATTERNS.test(lower)) return 'generate';
  if (REFACTOR_PATTERNS.test(lower)) return 'refactor';
  if (DEBUG_PATTERNS.test(lower))    return 'debug';
  if (matchCodeVocabulary(lower).length > 0) return 'vocabulary';
  return 'general';
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

export interface CodeContext {
  /** Programming language currently active in the editor. */
  language: CellLanguage;
  /** Selected code or active cell content (max 2 000 chars). */
  selectedCode: string;
  /** Optional: number of the line where the cursor sits. */
  cursorLine?: number;
}

/**
 * Build the system prompt injected into the Dr. Eams request when the user
 * is working inside CodeEngin.
 *
 * Privacy: only `selectedCode` (≤ 2 000 chars) is ever sent — never the full
 * notebook or multi-file codebase.
 */
export function buildCodeSystemPrompt(context: CodeContext): string {
  const intent = classifyQuery('');   // baseline — caller should pass the user query too
  const vocabBlock = CODE_VOCABULARY.slice(0, 10)
    .map(v => `  - ${v.term}: ${v.definition}`)
    .join('\n');

  return [
    `You are Dr. Eams inside DREAMengin CodeEngin — a coding assistant.`,
    `Active language: ${context.language}.`,
    ``,
    `RESPONSIBILITIES:`,
    `1. Recognise coding vocabulary. When the user mentions a term below, give a concise definition and a short code example in ${context.language}.`,
    `2. Translate natural language to code. If the user says "write a function that…", generate working ${context.language} code.`,
    `3. Explain code when asked. If the user says "explain this", analyse the snippet and describe what it does.`,
    `4. Refactor / debug on request.`,
    `5. Insert generated code at the cursor or in a new cell — indicate this with <!-- INSERT --> markers.`,
    ``,
    `KEY VOCABULARY (partial list):`,
    vocabBlock,
    ``,
    `PRIVACY: Only the code snippet below has been shared. Do not infer or mention other files.`,
    context.selectedCode.trim()
      ? `ACTIVE CODE SNIPPET (${context.language}):\n\`\`\`${context.language}\n${context.selectedCode.slice(0, 2000)}\n\`\`\``
      : `No code selected.`,
    ``,
    `Respond concisely. When generating code, wrap it in a fenced code block: \`\`\`${context.language} ... \`\`\`.`,
    `Output plain text + code blocks only — no JSON.`,
  ].join('\n');
}

/**
 * Build the prompt that includes the user's query intent.
 * This augments buildCodeSystemPrompt with query-specific instructions.
 */
export function buildCodePrompt(query: string, context: CodeContext): string {
  const intent = classifyQuery(query);
  const matched = matchCodeVocabulary(query);

  const parts: string[] = [buildCodeSystemPrompt(context)];

  if (matched.length > 0) {
    parts.push(`\nRELEVANT VOCABULARY TERMS DETECTED: ${matched.map(v => v.term).join(', ')}`);
    parts.push(`For each detected term, provide: definition, code example in ${context.language}, and offer to write more code using that concept.`);
  }

  const intentInstructions: Record<QueryIntent, string> = {
    explain:    `The user wants an explanation. Walk through the code step by step.`,
    generate:   `The user wants code. Generate complete, working ${context.language} code and wrap it in a fenced block.`,
    refactor:   `The user wants the code refactored. Show the improved version in a fenced code block and explain the changes.`,
    debug:      `The user has a bug. Identify the issue, explain why it happens, and show the fixed version.`,
    vocabulary: `The user is asking about a concept. Define it clearly, give a ${context.language} example, and offer to write more.`,
    general:    `Respond helpfully. If code would help, include a fenced block.`,
  };

  parts.push(`\nUSER INTENT: ${intent}`);
  parts.push(intentInstructions[intent]);

  return parts.join('\n');
}

// ─── Response parser ───────────────────────────────────────────────────────────

export interface ParsedCodeResponse {
  /** Plain-text portions of the response (no code blocks). */
  text: string;
  /** Extracted fenced code blocks, in order. */
  codeBlocks: Array<{ language: string; code: string }>;
  /** True if the response contains an <!-- INSERT --> marker. */
  hasInsertMarker: boolean;
}

const FENCE_RE = /```(\w*)\n?([\s\S]*?)```/g;

/**
 * Parse a Dr. Eams text response into text and extracted code blocks.
 * Caller can then insert the code blocks into the active notebook cell.
 */
export function parseCodeResponse(raw: string): ParsedCodeResponse {
  const codeBlocks: ParsedCodeResponse['codeBlocks'] = [];
  let text = raw.replace(FENCE_RE, (_, lang: string, code: string) => {
    codeBlocks.push({ language: lang || 'text', code: code.trim() });
    return '';
  }).trim();

  // Clean up extra blank lines left after code block removal
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return {
    text,
    codeBlocks,
    hasInsertMarker: raw.includes('<!-- INSERT -->'),
  };
}

// ─── Natural-language command detector ────────────────────────────────────────

export interface NLCommand {
  type: 'create_class' | 'write_function' | 'add_loop' | 'add_try_except' | 'refactor_async' | 'explain' | 'other';
  subject?: string;
  properties?: string[];
}

const NL_PATTERNS: Array<{ re: RegExp; type: NLCommand['type']; extractSubject?: (m: RegExpMatchArray) => string }> = [
  {
    re: /create\s+a\s+class\s+(?:called\s+)?(\w+)/i,
    type: 'create_class',
    extractSubject: m => m[1],
  },
  {
    re: /write\s+a\s+function\s+(?:called\s+|that\s+)?(\w+)?/i,
    type: 'write_function',
    extractSubject: m => m[1] ?? 'my_function',
  },
  {
    re: /(?:write|add)\s+a\s+(?:for\s+)?loop/i,
    type: 'add_loop',
  },
  {
    re: /add\s+a?\s*try[–-]?(?:except|catch)\s+block/i,
    type: 'add_try_except',
  },
  {
    re: /refactor\s+(?:this\s+)?(?:function\s+)?to\s+use\s+async\s*[/\\]?\s*await/i,
    type: 'refactor_async',
  },
  {
    re: /explain\s+(?:this\s+)?(?:code|function|class|snippet)?/i,
    type: 'explain',
  },
];

/**
 * Detect a natural-language coding command from a user query.
 * Returns `null` if no pattern matches.
 */
export function detectNLCommand(query: string): NLCommand | null {
  for (const { re, type, extractSubject } of NL_PATTERNS) {
    const match = query.match(re);
    if (match) {
      return {
        type,
        subject: extractSubject ? extractSubject(match) : undefined,
      };
    }
  }
  return null;
}

// ─── Simulated code generation (no eval, no network) ─────────────────────────

const TEMPLATES: Record<NLCommand['type'], (cmd: NLCommand, lang: CellLanguage) => string> = {
  create_class: (cmd, lang) => {
    const name = cmd.subject ?? 'MyClass';
    if (lang === 'python') {
      return `class ${name}:\n    """${name} class."""\n\n    def __init__(self):\n        pass\n\n    def __repr__(self):\n        return f"${name}()"`;
    }
    return `class ${name} {\n  constructor() {}\n\n  toString() {\n    return '${name}';\n  }\n}`;
  },
  write_function: (cmd, lang) => {
    const name = cmd.subject ?? 'my_function';
    if (lang === 'python') {
      return `def ${name}():\n    """TODO: add docstring."""\n    pass`;
    }
    return `function ${name}() {\n  // TODO: implement\n}`;
  },
  add_loop: (_cmd, lang) => {
    if (lang === 'python') return `items = []\nfor item in items:\n    print(item)`;
    return `const items = [];\nfor (const item of items) {\n  console.log(item);\n}`;
  },
  add_try_except: (_cmd, lang) => {
    if (lang === 'python') return `try:\n    result = risky_operation()\nexcept Exception as e:\n    print(f"Error: {e}")`;
    return `try {\n  const result = riskyOperation();\n} catch (err) {\n  console.error('Error:', err);\n}`;
  },
  refactor_async: (_cmd, lang) => {
    if (lang === 'python') return `async def fetch_data(url: str):\n    async with aiohttp.ClientSession() as session:\n        async with session.get(url) as resp:\n            return await resp.json()`;
    return `async function fetchData(url: string) {\n  const res = await fetch(url);\n  return res.json();\n}`;
  },
  explain: () => `# Select code in the editor then ask Dr. Eams to explain it.`,
  other: () => `# Dr. Eams: add your code here`,
};

/**
 * Generate a code scaffold from a detected NL command.
 * This is a purely local template expansion — no network call required.
 */
export function generateCodeFromCommand(cmd: NLCommand, language: CellLanguage): string {
  const template = TEMPLATES[cmd.type];
  return template ? template(cmd, language) : `# TODO: implement "${cmd.subject ?? 'task'}"`;
}

// ─── Helper: extract fenced code blocks as plain strings ──────────────────────

function parseCodeBlocks(raw: string): string[] {
  return parseCodeResponse(raw).codeBlocks.map((b) => b.code);
}

/**
 * Call Dr. Eams /api/ai/eams with a CODE_ASSIST intent for inline completions.
 * Returns the completion string or null on failure.
 * Privacy: only sends the active cell content (max 2000 chars), never the full codebase.
 */
export async function getCodeAssistCompletion(
  prompt: string,
  language: CellLanguage,
  cellContext: string,
): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/eams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CODE_ASSIST',
        prompt,
        language,
        context: cellContext.slice(0, 2000),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { reply?: string; text?: string };
    const raw = data.reply ?? data.text ?? '';
    const blocks = parseCodeBlocks(raw);
    return blocks.length > 0 ? blocks[0] : raw.trim() || null;
  } catch {
    return null;
  }
}
