"use server";

import { cookies } from "next/headers";
import { BranchLocation } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BRANCH_COOKIE = "active-branch";
const VALID_BRANCHES = Object.values(BranchLocation);

export async function setActiveBranch(branch: string) {
  // Validate — only accept known enum values
  if (!VALID_BRANCHES.includes(branch as BranchLocation)) {
    throw new Error(`Invalid branch: ${branch}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(BRANCH_COOKIE, branch, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: false, // must be readable client-side too
    sameSite: "lax",
  });
}

export async function getActiveBranch(): Promise<BranchLocation> {
  const cookieStore = await cookies();
  const value = cookieStore.get(BRANCH_COOKIE)?.value;

  if (value && VALID_BRANCHES.includes(value as BranchLocation)) {
    return value as BranchLocation;
  }
  return BranchLocation.KARTASURA; // default fallback
}

export async function getBranchFilter(): Promise<{ branch: BranchLocation }> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "";

  if (role === "SUPER_ADMIN" || role === "MANAGER") {
    const activeBranch = await getActiveBranch();
    return { branch: activeBranch };
  }

  const userBranch = (session?.user?.branch ?? BranchLocation.KARTASURA) as BranchLocation;
  return { branch: userBranch };
}
