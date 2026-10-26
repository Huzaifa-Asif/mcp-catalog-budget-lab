const enc = new TextEncoder();
export const LIMITS = Object.freeze({ maxBytes: 2_097_152, maxTools: 2_000, maxFindings: 500 });
const bytes = value => enc.encode(JSON.stringify(value)).length;
const text = value => typeof value === 'string' ? value : '';
const norm = value => text(value).toLowerCase().replace(/\s+/g, ' ').trim();
function preflightValue(root) {
  const stack=[{value:root,depth:0,exit:false}]; const active=new Set(); let nodes=0;
  while(stack.length){ const item=stack.pop(); const {value,depth}=item; if(!value||typeof value!=='object') continue; if(item.exit){active.delete(value);continue;} if(depth>512) throw new Error('JSON nesting exceeds 512 levels.'); if(active.has(value)) throw new Error('Input must not contain circular values.'); active.add(value); stack.push({value,depth,exit:true}); if(++nodes>200_000) throw new Error('Input object graph exceeds 200000 containers.'); const children=Array.isArray(value)?value:Object.values(value); for(let i=children.length-1;i>=0;i--) stack.push({value:children[i],depth:depth+1,exit:false}); }
}

export function extractTools(value) {
  const tools = Array.isArray(value) ? value : value?.tools ?? value?.result?.tools;
  if (!Array.isArray(tools)) throw new Error('Expected a tool array, {tools:[…]}, or {result:{tools:[…]}}.');
  if (tools.length > LIMITS.maxTools) throw new Error(`Catalog exceeds ${LIMITS.maxTools} tools.`);
  return tools;
}

function visitSchema(schema, stats) {
  const stack = [{ value: schema, depth: 0 }]; let visited = 0;
  while (stack.length) {
    const { value, depth } = stack.pop();
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    if (++visited > 20_000) { stats.truncated = true; break; }
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    for (const key of ['oneOf', 'anyOf', 'allOf']) if (Array.isArray(value[key])) { stats.branches += value[key].length; for (const child of value[key]) stack.push({ value: child, depth: depth + 1 }); }
    if (Array.isArray(value.enum)) stats.enumValues += value.enum.length;
    if (value.properties && typeof value.properties === 'object') for (const [name, property] of Object.entries(value.properties)) { stats.properties += 1; if (!norm(property?.description)) stats.undocumented.push(name); stack.push({ value: property, depth: depth + 1 }); }
    if (value.items) stack.push({ value: value.items, depth: depth + 1 });
  }
}

export function analyzeCatalog(input) {
  preflightValue(input);
  const inputBytes = bytes(input);
  if (inputBytes > LIMITS.maxBytes) throw new Error(`Input exceeds ${LIMITS.maxBytes} UTF-8 serialized bytes.`);
  const tools = extractTools(input);
  const errors = []; const ordinary = []; let droppedFindings = 0; let errorCount = 0;
  const add = (code, severity, tool, message, evidence) => {
    const finding = { code, severity, tool, message, evidence: text(evidence).replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').slice(0, 180) };
    if (severity === 'error') { errorCount += 1; if (errors.length < LIMITS.maxFindings) errors.push(finding); else droppedFindings += 1; }
    else if (ordinary.length < LIMITS.maxFindings) ordinary.push(finding);
    else droppedFindings += 1;
  };
  const contributions = [];
  const descriptions = new Map(); const names = new Map();
  let catalogBytes = 2;
  tools.forEach((tool, index) => {
    if (!tool || typeof tool !== 'object' || Array.isArray(tool)) throw new Error(`Tool at index ${index} must be an object.`);
    const name = text(tool.name).trim() || `(tool ${index + 1})`;
    const size = bytes(tool);
    catalogBytes += size + (index ? 1 : 0);
    const schema = { properties: 0, undocumented: [], maxDepth: 0, branches: 0, enumValues: 0, truncated: false };
    visitSchema(tool.inputSchema, schema);
    contributions.push({ name, bytes: size, descriptionChars: text(tool.description).length, ...schema });
    if (!text(tool.name).trim()) add('missing_name', 'error', name, 'Tool has no usable name.', `index ${index}`);
    else names.set(name, [...(names.get(name) || []), index]);
    if (!norm(tool.description)) add('missing_description', 'warning', name, 'Tool has no description.', 'description is empty');
    if (text(tool.description).length > 600) add('long_description', 'warning', name, 'Description is longer than the review threshold.', `${text(tool.description).length} characters`);
    if (schema.undocumented.length) add('undocumented_parameters', 'warning', name, 'Input properties lack descriptions.', schema.undocumented.slice(0, 8).join(', '));
    if (schema.maxDepth > 6) add('deep_schema', 'info', name, 'Input schema is deeply nested.', `depth ${schema.maxDepth}`);
    if (schema.enumValues > 50) add('large_enum', 'info', name, 'Input schema contains many enum values.', `${schema.enumValues} values`);
    if (schema.truncated) add('schema_scan_truncated', 'warning', name, 'Schema analysis stopped at its node bound.', 'more than 20000 visited schema nodes');
    const d = norm(tool.description);
    if (d) descriptions.set(d, [...(descriptions.get(d) || []), name]);
  });
  for (const [name, indexes] of names) if (indexes.length > 1) add('duplicate_name', 'error', name, 'Tool names must be unique within the catalog.', `indexes ${indexes.slice(0, 8).join(', ')}`);
  for (const [description, names] of descriptions) if (names.length > 1) add('repeated_description', 'warning', names.join(', '), 'Multiple tools use the same normalized description.', `${names.length} tools; ${description.slice(0, 100)}`);
  contributions.sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
  const largest = contributions[0]?.bytes || 0;
  for (const c of contributions) if (catalogBytes && c.bytes / catalogBytes >= 0.25 && c.bytes === largest) add('dominant_tool', 'info', c.name, 'One tool contributes at least 25% of catalog bytes.', `${((c.bytes / catalogBytes) * 100).toFixed(1)}%`);
  const ordinaryCapacity = Math.max(0, LIMITS.maxFindings - errors.length);
  const findings = [...errors, ...ordinary.slice(0, ordinaryCapacity)];
  droppedFindings += Math.max(0, ordinary.length - ordinaryCapacity);
  return { version: 1, summary: { tools: tools.length, catalogBytes, sourceBytes: inputBytes, estimatedTokens: { value: Math.ceil(catalogBytes / 4), method: 'rough UTF-8 bytes ÷ 4 heuristic; not a provider tokenizer or cost estimate' }, findings: findings.length, errorFindings: errorCount, truncated: droppedFindings > 0, droppedFindings }, contributions, findings, limits: LIMITS };
}

export function parseAndAnalyze(source) {
  if (typeof source !== 'string') throw new TypeError('Source must be text.');
  if (enc.encode(source).length > LIMITS.maxBytes) throw new Error(`Input exceeds ${LIMITS.maxBytes} UTF-8 bytes.`);
  let value; try { value = JSON.parse(source); } catch { throw new Error('Input is not valid JSON.'); }
  return analyzeCatalog(value);
}
