import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ToastProvider } from '@/shared/ui';

export const Route = createRootRoute({
  component: () => (
    <ToastProvider>
      <Outlet />
      <TanStackRouterDevtools />
    </ToastProvider>
  ),
});
