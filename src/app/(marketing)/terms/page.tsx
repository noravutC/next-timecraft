import type { Metadata } from 'next';
import { LegalPage } from '../_components/legal/legal-page';
import {
  TERMS_SECTIONS,
  TERMS_SUMMARY,
} from '../_components/legal/terms-sections';

export const metadata: Metadata = {
  title: 'Terms of use · TimeCraft',
  description:
    'The terms for using TimeCraft: your account, your content, fair use and what’s not guaranteed.',
};

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms of use"
      summary={TERMS_SUMMARY}
      sections={TERMS_SECTIONS}
    />
  );
}
