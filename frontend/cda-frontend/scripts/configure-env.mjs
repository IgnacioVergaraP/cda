import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Solo se publican estas tres variables; ninguna clave de backend.
const local = {};
try {
  const contents = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match) local[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const get = (name) => (process.env[name] ?? local[name] ?? '').trim();
const config = {
  apiUrl: get('CDA_API_URL') || 'http://localhost:5000/api',
  supabaseUrl: get('CDA_SUPABASE_URL') || 'https://configure-cda.supabase.co',
  supabaseAnonKey: get('CDA_SUPABASE_ANON_KEY') || 'configure-cda-public-key',
};

if (process.env.VERCEL) {
  for (const name of ['CDA_API_URL', 'CDA_SUPABASE_URL', 'CDA_SUPABASE_ANON_KEY']) {
    if (!get(name)) throw new Error(`Falta ${name} en el proyecto frontend de Vercel.`);
  }
  for (const value of [config.apiUrl, config.supabaseUrl]) {
    if (new URL(value).protocol !== 'https:') throw new Error('Las URLs de producción deben usar HTTPS.');
  }
}

const key = config.supabaseAnonKey;
if (key.startsWith('sb_secret_')) throw new Error('Usa una clave pública de Supabase en el frontend.');
if (key.split('.').length === 3) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('El frontend solo admite JWT con rol anon.');
}

const target = fileURLToPath(new URL('../src/environments/client-config.generated.ts', import.meta.url));
writeFileSync(target, `// Generado por scripts/configure-env.mjs.\nexport const clientConfig = ${JSON.stringify(config, null, 2)};\n`);
console.log('Configuración pública de CDA generada.');
