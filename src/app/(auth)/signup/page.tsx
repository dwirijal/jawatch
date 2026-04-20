import type { Metadata } from 'next';
import { SignupPage } from '@/features/auth/SignupPage';

export const metadata: Metadata = {
  title: 'Signup',
  robots: {
    index: false,
    follow: false,
  },
};

export default SignupPage;
