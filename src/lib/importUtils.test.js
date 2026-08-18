import { describe, it, expect } from 'vitest';
import { pickField, classifyImportRow } from '@/lib/importUtils';

describe('pickField', () => {
  it('matches headers case- and space-insensitively', () => {
    const row = { ' First Name ': 'Moshe', 'Last Name': 'Cohen' };
    expect(pickField(row, ['first name'])).toBe('Moshe');
    expect(pickField(row, ['Last Name'])).toBe('Cohen');
  });

  it('returns the first non-empty candidate', () => {
    const row = { ID: '', 'Student ID': '123' };
    expect(pickField(row, ['ID', 'Student ID'])).toBe('123');
  });

  it('returns empty string when nothing matches', () => {
    expect(pickField({ a: 'x' }, ['b', 'c'])).toBe('');
  });

  it('trims values', () => {
    expect(pickField({ Name: '  Yossi  ' }, ['name'])).toBe('Yossi');
  });
});

describe('classifyImportRow', () => {
  it('flags rows without a name as invalid', () => {
    expect(classifyImportRow({ externalId: '1', hasName: false, existsInDb: false, seenInFile: false })).toBe('invalid');
  });

  it('flags in-file repeats of an external id as duplicate', () => {
    expect(classifyImportRow({ externalId: '1', hasName: true, existsInDb: false, seenInFile: true })).toBe('duplicate');
  });

  it('marks existing external ids as update', () => {
    expect(classifyImportRow({ externalId: '1', hasName: true, existsInDb: true, seenInFile: false })).toBe('update');
  });

  it('marks unknown ids and id-less rows as new', () => {
    expect(classifyImportRow({ externalId: '9', hasName: true, existsInDb: false, seenInFile: false })).toBe('new');
    expect(classifyImportRow({ externalId: null, hasName: true, existsInDb: false, seenInFile: false })).toBe('new');
  });
});
