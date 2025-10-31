'use client';

import React from 'react';
import InvitationsTable from '@/components/invitations/InvitationsTable';

const InvitationsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full">
        <InvitationsTable />
      </div>
    </div>
  );
};

export default InvitationsPage;
