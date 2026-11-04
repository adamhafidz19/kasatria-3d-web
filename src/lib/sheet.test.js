import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNetWorth,
  getNetWorthTier,
  parseMoney,
  parseSheetCsv,
} from './sheet.js';

const SAMPLE_CSV = `Name,Photo,Age,Country,Interest,Net Worth
Lee Siew Suan,https://example.com/019.jpg,25,CN,Writing,"$251,260.80"
New Yee Chian,https://example.com/020.jpg,23,CN,Cooking,"$60,393.60"
`;

test('parseMoney handles formatted currency strings', () => {
  assert.equal(parseMoney('$251,260.80'), 251260.8);
  assert.equal(parseMoney('  $1,000  '), 1000);
  assert.equal(parseMoney(42.5), 42.5);
  assert.equal(parseMoney('not a number'), 0);
});

test('formatNetWorth keeps two decimal places', () => {
  assert.equal(formatNetWorth('$251,260.80'), '$251,260.80');
  assert.equal(formatNetWorth(100000), '$100,000.00');
});

test('net worth tiers use strict upper thresholds', () => {
  assert.equal(getNetWorthTier(99999.99), 'low');
  assert.equal(getNetWorthTier(100000), 'low');
  assert.equal(getNetWorthTier(100000.01), 'medium');
  assert.equal(getNetWorthTier(200000), 'medium');
  assert.equal(getNetWorthTier(200000.01), 'high');
});

test('parseSheetCsv normalizes records and tiers', () => {
  const records = parseSheetCsv(SAMPLE_CSV);

  assert.equal(records.length, 2);
  assert.deepEqual(records[0], {
    id: 1,
    name: 'Lee Siew Suan',
    photo: 'https://example.com/019.jpg',
    age: '25',
    country: 'CN',
    interest: 'Writing',
    netWorth: 251260.8,
    netWorthFormatted: '$251,260.80',
    tier: 'high',
  });
  assert.equal(records[1].tier, 'low');
});

test('parseSheetCsv handles a BOM and padded headers', () => {
  const records = parseSheetCsv(
    '\uFEFF Name , Photo , Age , Country , Interest , Net Worth \n  Jane Doe  ,  , 30 , MY , Reading , "$100,000.00"'
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].name, 'Jane Doe');
  assert.equal(records[0].photo, '');
  assert.equal(records[0].tier, 'low');
});
