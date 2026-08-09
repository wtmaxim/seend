import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";

import { sendInvitationEmail, sendResetPasswordEmail } from "@/lib/email";
import { getOrganizationLimits } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  appName: "Seend",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ to: user.email, name: user.name, url });
    },
  },
  experimental: {
    joins: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      membershipLimit: async (_user, organization) => {
        const limits = await getOrganizationLimits(organization.id);
        return limits.members;
      },
      sendInvitationEmail: async (data) => {
        const url = `${process.env.BETTER_AUTH_URL}/accept-invitation?id=${data.id}`;
        await sendInvitationEmail({
          to: data.email,
          organizationName: data.organization.name,
          inviterEmail: data.inviter.user.email,
          url,
        });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

