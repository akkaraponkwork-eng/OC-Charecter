import Navbar from '@/components/Navbar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/');
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
        {children}
      </main>
    </>
  );
}
