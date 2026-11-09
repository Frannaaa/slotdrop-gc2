// Fran/M1: static submission guard for the maximum-two-page GC2 business PDF.
// Inspects actual binary PDF pages in CI; page count is not a visual readability review.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

test('final business PDF exists, has exactly two page objects and is not encrypted', async () => {
  const file=await readFile(new URL('../docs/SlotDrop_GC2_Summary.pdf',import.meta.url));
  assert.equal(file.subarray(0,5).toString('latin1'),'%PDF-');
  assert.ok(file.length>1500,'PDF is unexpectedly small');
  // ReportLab-style PDF page dictionaries are outside compressed content streams.
  const bytes=file.toString('latin1');
  const pages=[...bytes.matchAll(/\/Type\s*\/Page\b/g)];
  assert.equal(pages.length,2,
    'The PDF must contain exactly two Page dictionaries; perform manual PDF review if an object-stream variant uses a different layout.');
  assert.doesNotMatch(bytes,/\/Encrypt\b/, 'Instructor must not need a PDF password');
  assert.doesNotMatch(bytes,/\/JavaScript\b|\/JS\b/, 'The course summary should not embed scripts');
  // Cannot prove contrast, fonts, cropping or business claims; reviewer must open both pages.
});
