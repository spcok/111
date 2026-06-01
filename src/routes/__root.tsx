// ============================================================================
// File: src/routes/__root.tsx
// ============================================================================
import React from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppLayout } from '../components/layout/AppLayout';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}