<<<<<<< HEAD
cat > src/app/api/auth/[...nextauth]/route.ts <<'EOF'
// src/app/api/auth/[...nextauth]/route.ts
import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';
=======
<<<<<<< HEAD
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
=======
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';

import { authOptions } from '@/lib/auth';
>>>>>>> d8e11c2 (chore(lint): eslint --fix import sort)
>>>>>>> c255c5f (chore(lint): sort imports and remove unused import)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
EOF

cat > src/types/next-auth.d.ts <<'EOF'
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}
EOF
