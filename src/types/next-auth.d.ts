<<<<<<< HEAD
cat > src/types/next-auth.d.ts <<'EOF'
import { DefaultSession, DefaultUser } from "next-auth";
=======
<<<<<<< HEAD
import { DefaultSession, DefaultUser } from 'next-auth';
=======
import { DefaultSession, DefaultUser } from "next-auth";
>>>>>>> d8e11c2 (chore(lint): eslint --fix import sort)
>>>>>>> c255c5f (chore(lint): sort imports and remove unused import)

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
