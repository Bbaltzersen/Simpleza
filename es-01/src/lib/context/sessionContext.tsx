import { auth0 } from "@/lib/auth0";
import Layout from "../../app/layout"; 
import { SessionHandler } from "@/lib/context/sessionHandler"; 

export default async function SessionProvider({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();

  return (
    <SessionHandler session={session}>
      <Layout>{children}</Layout>
    </SessionHandler>
  );
}
