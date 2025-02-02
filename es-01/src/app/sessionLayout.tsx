import { auth0 } from "@/lib/auth0";
import Layout from "./layout"; // Import your existing layout
import { SessionProvider } from "@/lib/context/sessionContext"; // Create a separate session context

export default async function SessionLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();

  return (
    <SessionProvider session={session}>
      <Layout>{children}</Layout>
    </SessionProvider>
  );
}
