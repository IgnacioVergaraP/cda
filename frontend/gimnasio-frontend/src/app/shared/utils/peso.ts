export type UnidadPeso = 'kg' | 'lb' | 'otro';

export interface PesoSugerido {
  unidad: UnidadPeso;
  valor: number | null;
  texto: string;
}

export function interpretarPeso(peso: string | null | undefined): PesoSugerido {
  const texto = peso?.trim() ?? '';
  if (!texto) return { unidad: 'kg', valor: null, texto: '' };
  const match = texto.match(/^(\d+(?:[.,]\d+)?)\s*(kg|lbs?)?$/i);
  if (!match) return { unidad: 'otro', valor: null, texto };
  const valor = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(valor)) return { unidad: 'otro', valor: null, texto };
  return { unidad: match[2]?.toLowerCase().startsWith('lb') ? 'lb' : 'kg', valor, texto: '' };
}

export function pesoEnKg(peso: string): number | null {
  const { unidad, valor } = interpretarPeso(peso);
  if (valor === null || unidad === 'otro') return null;
  return unidad === 'lb' ? Math.round(valor * 0.45359237 * 100) / 100 : valor;
}
