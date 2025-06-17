'use client';

import ProfilePage from '@/components/profile/ProfilePage';
import withAuth from '@/components/auth/withAuth';

// Protect the ProfilePage with authentication
const ProtectedProfilePage = withAuth(ProfilePage);

export default function Profile() {
  return <ProtectedProfilePage />;
}
