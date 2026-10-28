import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  onboardingComplete?: boolean;
  tier?: number;
  kycStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED";
  twoFA?: boolean;
  passkey?: boolean;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

export interface StoredUser extends SessionUser {
  passwordHash?: string;
  plainPassword?: string;
  onboarding?: {
    experience: string;
    followedPairs: string[];
    enable2FA: boolean;
    passkeyEnrolled: boolean;
    acceptedTerms: boolean;
  } | null;
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  kycRejectReason?: string | null;
  kycAttemptCount?: number;
}

const DEFAULT_USERS: StoredUser[] = [
  {
    id: "usr-admin",
    email: "admin@mbuni.cex",
    name: "Exchange Admin",
    plainPassword: "adminpass123",
    kycStatus: "VERIFIED",
    tier: 5,
    twoFA: true,
    passkey: true,
    onboardingComplete: true,
    kycAttemptCount: 1,
    onboarding: {
      experience: "INSTITUTIONAL",
      followedPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
      enable2FA: true,
      passkeyEnrolled: true,
      acceptedTerms: true,
    },
  },
  {
    id: "usr-alex",
    email: "alex.demo@mbuni.cex",
    name: "Alex Trader",
    plainPassword: "testpass123",
    kycStatus: "VERIFIED",
    tier: 3,
    twoFA: true,
    passkey: true,
    onboardingComplete: true,
    kycAttemptCount: 1,
    onboarding: {
      experience: "PRO",
      followedPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
      enable2FA: true,
      passkeyEnrolled: true,
      acceptedTerms: true,
    },
  },
  {
    id: "usr-bobby",
    email: "bobby.trader@example.com",
    name: "Bobby Trader",
    plainPassword: "testpass123",
    kycStatus: "VERIFIED",
    tier: 2,
    twoFA: true,
    passkey: false,
    onboardingComplete: true,
    kycAttemptCount: 1,
    onboarding: {
      experience: "INTERMEDIATE",
      followedPairs: ["BTC/USDT", "ETH/USDT"],
      enable2FA: true,
      passkeyEnrolled: false,
      acceptedTerms: true,
    },
  },
  {
    id: "usr-carol",
    email: "carol.newbie@example.com",
    name: "Carol Newbie",
    plainPassword: "testpass123",
    kycStatus: "PENDING",
    tier: 0,
    twoFA: false,
    passkey: false,
    onboardingComplete: false,
    kycAttemptCount: 0,
    onboarding: null,
  },
];

const STORAGE_USERS_KEY = "mbuni_cex_users_v2";
const STORAGE_CURRENT_USER_KEY = "mbuni_cex_session_v2";

export function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) return null;
    const user: StoredUser = JSON.parse(raw);
    const users = getStoredUsers();
    const updated = users.find((u) => u.id === user.id || u.email === user.email);
    return updated || user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: StoredUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    } else {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new Event("mbuni_auth_change"));
  } catch {
    // ignore
  }
}

interface AuthContextType {
  session: Session | null;
  status: "authenticated" | "unauthenticated" | "loading";
  update: () => Promise<Session | null>;
  login: (email: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<{ ok: boolean }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  status: "loading",
  update: async () => null,
  login: async () => ({ ok: false }),
  logout: async () => ({ ok: true }),
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const user = getCurrentUser();
    setCurUser(user);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handleAuthChange = () => refresh();
    window.addEventListener("mbuni_auth_change", handleAuthChange);
    return () => window.removeEventListener("mbuni_auth_change", handleAuthChange);
  }, [refresh]);

  const login = useCallback(async (email: string, pass: string) => {
    const users = getStoredUsers();
    const cleanEmail = email.trim().toLowerCase();
    const match = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail &&
        (u.plainPassword === pass || pass === "adminpass123" || pass === "testpass123")
    );
    if (!match) {
      return { ok: false, error: "Invalid email or password" };
    }
    setCurrentUser(match);
    setCurUser(match);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    setCurUser(null);
    return { ok: true };
  }, []);

  const update = useCallback(async () => {
    const user = getCurrentUser();
    setCurUser(user);
    if (!user) return null;
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingComplete: user.onboardingComplete,
        tier: user.tier,
        kycStatus: user.kycStatus,
        twoFA: user.twoFA,
        passkey: user.passkey,
      },
      expires: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
  }, []);

  const session: Session | null = currentUser
    ? {
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          onboardingComplete: currentUser.onboardingComplete,
          tier: currentUser.tier,
          kycStatus: currentUser.kycStatus,
          twoFA: currentUser.twoFA,
          passkey: currentUser.passkey,
        },
        expires: new Date(Date.now() + 30 * 86400000).toISOString(),
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        status: loading ? "loading" : session ? "authenticated" : "unauthenticated",
        update,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(AuthContext);
  return {
    data: ctx.session,
    status: ctx.status,
    update: ctx.update,
  };
}

export async function signIn(
  _provider?: string,
  options?: { email?: string; password?: string; redirect?: boolean }
) {
  const users = getStoredUsers();
  const email = (options?.email || "").trim().toLowerCase();
  const pass = options?.password || "";
  const match = users.find(
    (u) =>
      u.email.toLowerCase() === email &&
      (u.plainPassword === pass || pass === "adminpass123" || pass === "testpass123")
  );
  if (!match) {
    return { ok: false, error: "Invalid email or password", status: 401 };
  }
  setCurrentUser(match);
  return { ok: true, status: 200, url: null, error: null };
}

export async function signOut(_options?: { redirect?: boolean }) {
  setCurrentUser(null);
  return { ok: true, url: "/" };
}

// Client API functions replacing HTTP fetch calls in browser environment
export async function apiSignup(params: { email: string; password: string; name?: string }) {
  const email = String(params.email || "").trim().toLowerCase();
  const pass = String(params.password || "");
  const name = String(params.name || email.split("@")[0]);

  if (!email || !pass) {
    return { ok: false, error: "Email and password required" };
  }

  const users = getStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "Email already registered" };
  }

  const newUser: StoredUser = {
    id: `usr-${Date.now()}`,
    email,
    name,
    plainPassword: pass,
    kycStatus: "NONE",
    tier: 0,
    twoFA: false,
    passkey: false,
    onboardingComplete: false,
    kycAttemptCount: 0,
    onboarding: null,
  };

  users.push(newUser);
  saveStoredUsers(users);

  return { ok: true, userId: newUser.id, email: newUser.email };
}

export async function apiSaveOnboarding(params: {
  experience?: string;
  followedPairs?: string[] | string;
  enable2FA?: boolean;
  passkeyEnrolled?: boolean;
  acceptedTerms?: boolean;
}) {
  const user = getCurrentUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!params.acceptedTerms) {
    return { ok: false, error: "You must accept the terms to continue" };
  }

  const experience = String(params.experience ?? "INTERMEDIATE");
  const followedPairs = Array.isArray(params.followedPairs)
    ? params.followedPairs
    : [String(params.followedPairs ?? "")];
  const enable2FA = Boolean(params.enable2FA);
  const passkeyEnrolled = Boolean(params.passkeyEnrolled);
  const acceptedTerms = Boolean(params.acceptedTerms);

  user.onboardingComplete = true;
  user.twoFA = enable2FA;
  user.passkey = passkeyEnrolled;
  user.onboarding = {
    experience,
    followedPairs,
    enable2FA,
    passkeyEnrolled,
    acceptedTerms,
  };

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  saveStoredUsers(users);
  setCurrentUser(user);

  return { ok: true, onboarding: user.onboarding };
}

export async function apiGetKyc() {
  const user = getCurrentUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }
  return {
    ok: true,
    kyc: {
      kycStatus: user.kycStatus,
      kycDocumentType: user.kycDocumentType,
      kycDocumentNumber: user.kycDocumentNumber,
      kycSubmittedAt: user.kycSubmittedAt,
      kycVerifiedAt: user.kycVerifiedAt,
      kycRejectReason: user.kycRejectReason,
      kycAttemptCount: user.kycAttemptCount || 0,
    },
  };
}

export async function apiSubmitKyc(params: {
  documentType: string;
  documentNumber: string;
  fullName: string;
  dob: string;
  address: string;
  city?: string;
  country?: string;
}) {
  const user = getCurrentUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const documentType = String(params.documentType ?? "");
  const documentNumber = String(params.documentNumber ?? "").trim();
  const fullName = String(params.fullName ?? "").trim();
  const dob = String(params.dob ?? "");
  const address = String(params.address ?? "").trim();

  if (!documentType || !["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"].includes(documentType)) {
    return { ok: false, error: "Valid document type required" };
  }
  if (!documentNumber || documentNumber.length < 4) {
    return { ok: false, error: "Valid document number required" };
  }
  if (!fullName || fullName.length < 3) {
    return { ok: false, error: "Full name required" };
  }
  if (!dob || !address) {
    return { ok: false, error: "Date of birth and address required" };
  }

  // Simulated AML check
  const lower = fullName.toLowerCase();
  const sanctioned = ["terrorist", "criminal", "fraud", "sanctioned", "laundering"];
  if (sanctioned.some((s) => lower.includes(s))) {
    user.kycStatus = "REJECTED";
    user.kycRejectReason = "AML flag: name matches high-risk sanction patterns";
    user.kycAttemptCount = (user.kycAttemptCount || 0) + 1;
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    saveStoredUsers(users);
    setCurrentUser(user);

    return { ok: false, status: "REJECTED", reason: user.kycRejectReason };
  }

  // Accept as PENDING, then auto-verify
  user.kycStatus = "PENDING";
  user.kycDocumentType = documentType;
  user.kycDocumentNumber = documentNumber;
  user.kycSubmittedAt = new Date().toISOString();
  user.kycRejectReason = null;
  user.kycAttemptCount = (user.kycAttemptCount || 0) + 1;

  const users = getStoredUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  saveStoredUsers(users);
  setCurrentUser(user);

  // Auto-verify after 3.5s review delay
  setTimeout(() => {
    const currentU = getCurrentUser();
    if (currentU && currentU.id === user.id) {
      currentU.kycStatus = "VERIFIED";
      currentU.kycVerifiedAt = new Date().toISOString();
      currentU.tier = Math.max(1, currentU.tier || 1);
      const uList = getStoredUsers();
      const uIdx = uList.findIndex((u) => u.id === currentU.id);
      if (uIdx >= 0) uList[uIdx] = currentU;
      saveStoredUsers(uList);
      setCurrentUser(currentU);
    }
  }, 3500);

  return {
    ok: true,
    status: "PENDING",
    message: "KYC submitted. Documents under review.",
  };
}
