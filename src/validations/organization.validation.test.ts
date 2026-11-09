import { describe, expect, it } from 'vitest';
import { createOrganizationSchema } from './organization.validation';

const withLogo = (logo: string | null) =>
  createOrganizationSchema.safeParse({ name: 'Northwind', logo }).success;

describe('createOrganizationSchema logo', () => {
  it('takes the square data URL the picker makes, or none', () => {
    expect(withLogo('data:image/webp;base64,UklGRhIAAABXRUJQ')).toBe(true);
    expect(withLogo('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(withLogo(null)).toBe(true);
  });

  it('refuses remote URLs, SVG and oversized images', () => {
    expect(withLogo('https://example.com/logo.png')).toBe(false);
    expect(withLogo('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(withLogo(`data:image/png;base64,${'A'.repeat(200_000)}`)).toBe(
      false,
    );
  });
});
