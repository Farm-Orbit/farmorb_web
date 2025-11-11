import { Metadata } from 'next';
import HealthRecordsContent from './HealthRecordsContent';

export const metadata: Metadata = {
  title: 'Health Records | FarmOrbit - Farm Management Platform',
  description: 'Centralize livestock health records, treatments, and inspections with FarmOrbit.',
};

export default function HealthRecordsPage() {
  return <HealthRecordsContent />;
}
