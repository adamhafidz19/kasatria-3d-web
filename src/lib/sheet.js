import Papa from 'papaparse';
import {
  MAX_TILES,
  NET_WORTH_THRESHOLDS,
} from '../config.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function cleanValue(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function parseMoney(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseFloat(cleanValue(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNetWorth(value) {
  return currencyFormatter.format(parseMoney(value));
}

export function getNetWorthTier(value) {
  const netWorth = parseMoney(value);

  if (netWorth > NET_WORTH_THRESHOLDS.HIGH) {
    return 'high';
  }

  if (netWorth > NET_WORTH_THRESHOLDS.MEDIUM) {
    return 'medium';
  }

  return 'low';
}

function normalizeRecord(row, index) {
  const name = cleanValue(row.Name) || 'Unknown';
  const netWorth = parseMoney(row['Net Worth']);

  return {
    id: index + 1,
    name,
    photo: cleanValue(row.Photo),
    age: cleanValue(row.Age) || '-',
    country: cleanValue(row.Country) || '--',
    interest: cleanValue(row.Interest) || '-',
    netWorth,
    netWorthFormatted: formatNetWorth(netWorth),
    tier: getNetWorthTier(netWorth),
  };
}

export function parseSheetCsv(csvText) {
  const result = Papa.parse(String(csvText ?? '').replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
  });

  if (!result.data.length) {
    throw new Error('The Google Sheet returned no records.');
  }

  return result.data
    .filter((row) =>
      Object.values(row).some((value) => cleanValue(value) !== '')
    )
    .slice(0, MAX_TILES)
    .map(normalizeRecord);
}
