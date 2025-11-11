import { Metadata } from 'next';
import BreedingRecordsContent from './BreedingRecordsContent';

export const metadata: Metadata = {
  title: 'Breeding Records | FarmOrbit - Farm Management Platform',
  description: 'Log breeding events, monitor gestation timelines, and track livestock fertility performance with FarmOrbit.',
};

export default function BreedingRecordsPage() {
  return <BreedingRecordsContent />;
}
