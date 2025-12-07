import { Outlet } from 'react-router-dom';
import CallNotification from '../components/CallNotification';

/**
 * RootLayout - Wrapper component that includes global UI elements
 * This ensures CallNotification is within the Router context
 */
function RootLayout() {
  return (
    <>
      <Outlet />
      <CallNotification />
    </>
  );
}

export default RootLayout;
