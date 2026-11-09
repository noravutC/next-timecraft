import type { Metadata } from 'next';
import { LegalPage } from '../_components/legal/legal-page';
import {
  PRIVACY_SECTIONS,
  PRIVACY_SUMMARY,
} from '../_components/legal/privacy-sections';

export const metadata: Metadata = {
  title: 'Privacy policy · TimeCraft',
  description:
    'What TimeCraft stores, which services handle it, and the choices you have.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy policy"
      summary={PRIVACY_SUMMARY}
      sections={PRIVACY_SECTIONS}
    />
  );
}
