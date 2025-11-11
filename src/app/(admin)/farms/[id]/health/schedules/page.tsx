import { Metadata } from 'next';
import HealthSchedulesContent from './HealthSchedulesContent';

export const metadata: Metadata = {
  title: 'Health Schedules | FarmOrbit - Farm Management Platform',
  description: 'Plan recurring livestock health tasks and automate reminders with FarmOrbit health schedules.',
};

export default function HealthSchedulesPage() {
  return <HealthSchedulesContent />;
}
