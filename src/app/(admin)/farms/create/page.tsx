import FarmForm from '@/components/farms/FarmForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Farm | FarmOrbit - Farm Management Dashboard',
  description: 'Create a new farm in your portfolio',
};

export default function CreateFarmPage() {
  return (
    <div data-testid="create-farm-page">
      <FarmForm />
    </div>
  );
}

