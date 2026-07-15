import { AuthProvider } from '../../../components/auth/AuthProvider';
import { LoggedInHome } from '../../../components/home/LoggedInHome';

export const metadata = {
  title: 'Home redesign (signed-in) — preview | CCCSolutions',
  description: 'Design mock of the signed-in home / For You feed. Reference only, not wired up.',
};

export default function SignedInHomePreview() {
  return (
    <AuthProvider>
      <LoggedInHome />
    </AuthProvider>
  );
}
