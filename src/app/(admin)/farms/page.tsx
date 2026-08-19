import { redirect } from 'next/navigation';

/**
 * Farms live on the home page now. Kept as a redirect so existing links,
 * bookmarks and any saved URLs still land somewhere sensible.
 */
export default function FarmsPage() {
  redirect('/');
}
