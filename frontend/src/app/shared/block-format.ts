const DECIMALS = 8, SYMBOL = 'DOGE', FEE_UNIT = 'koinu/B', FEE_SCALE = 1;

// Presentation only: never round provider data or detail-page amounts.
export function compactBlockNumber(value: number, amount = false, locale = 'en-US'): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs > 0 && abs < 0.001) { const threshold = (0.001).toLocaleString(locale, {useGrouping: false, maximumFractionDigits: 3}); return (value < 0 ? '>−' : '<') + threshold; }
  if (abs >= 1000) {
    const units = ['', 'k', 'M', 'B', 'T'];
    let group = Math.min(4, Math.floor(Math.log10(abs) / 3));
    let scaled = Number((value / 1000 ** group).toPrecision(3));
    if (Math.abs(scaled) >= 1000 && group < 4) { group++; scaled /= 1000; }
    return scaled.toLocaleString(locale, { maximumSignificantDigits: 3, useGrouping: false }) + units[group];
  }
  return value.toLocaleString(locale, amount
    ? { minimumFractionDigits: 2, maximumFractionDigits: 3, useGrouping: false }
    : { maximumSignificantDigits: 3, useGrouping: false });
}

export function compactBlockAmount(value: number | string, atomic = false, locale = 'en-US'): string {
  if (value == null) return '—';
  return compactBlockNumber(Number(value) / (atomic ? 1 : 10 ** DECIMALS), !atomic, locale);
}

export function exactBlockAmount(value: number | string): string {
  if (value == null) return '—';
  try {
    const n = BigInt(value), abs = n < 0n ? -n : n, scale = 10n ** BigInt(DECIMALS);
    const fraction = (abs % scale).toString().padStart(DECIMALS, '0').replace(/0+$/, '');
    return (n < 0n ? '-' : '') + (abs / scale).toString() + (fraction ? '.' + fraction : '');
  } catch { return '—'; }
}

export function blockValueDetails(total: number | string, median: number, min: number, max: number, locale = 'en-US'): string {
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
  const localDecimal = (value: string) => decimal === '.' ? value : value.replace('.', decimal);
  const rate = (value: number) => value == null || !Number.isFinite(value) ? '—' : localDecimal(String(value / FEE_SCALE));
  const amount = localDecimal(exactBlockAmount(total)), middle = rate(median), low = rate(min), high = rate(max);
  return $localize`:@@tx-taxi.doge.strip.details:Total fees: ${amount}:amount: ${SYMBOL}:symbol:. Median fee rate: ${middle}:median: ${FEE_UNIT}:unit:. Fee range: ${low}:min:–${high}:max: ${FEE_UNIT}:unit2:.`;
}
