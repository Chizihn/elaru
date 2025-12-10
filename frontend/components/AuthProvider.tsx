"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useMutation } from "@apollo/client/react";
import { loginAction, logoutAction } from "@/app/actions/auth";
import { AUTHENTICATE } from "@/graphql/mutations/auth";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  address: `0x${string}` | undefined;
  logout: () => void;
}

interface AuthData {
  authenticate: {
    token: string;
  };
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  address: undefined,
  logout: () => {},
});

export function AuthProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string;
}) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [authenticate] = useMutation<AuthData>(AUTHENTICATE);

  const authInProgress = useRef(false);

  const handleAuth = useCallback(async () => {
    if (!address || authInProgress.current) return;
    authInProgress.current = true;
    console.log("AuthProvider: Starting authentication flow for", address);

    try {
      // 1. Request nonce
      console.log("AuthProvider: Requesting nonce...");
      const nonceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/graphql` ||
          "http://localhost:4000/graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query { requestNonce(walletAddress: "${address}") }`,
          }),
        }
      );
      const { data, errors } = await nonceResponse.json();
      if (errors) {
        console.error("AuthProvider: Nonce request failed", errors);
        throw new Error("Failed to get nonce");
      }

      const nonce = data.requestNonce;
      console.log("AuthProvider: Got nonce:", nonce);

      // 2. Sign message
      const message = `Sign this message to authenticate with Elaru\n\nNonce: ${nonce}`;
      // const message = `Sign this message to authenticate with Elaru`;

      console.log("AuthProvider: Requesting signature...");
      const signature = await signMessageAsync({ message });
      console.log("AuthProvider: Got signature");

      // 3. Authenticate
      console.log("AuthProvider: Authenticating with backend...");
      const result = await authenticate({
        variables: {
          walletAddress: address,
          signature,
        },
      });
      console.log("AuthProvider: Authentication successful");

      const authToken = result.data?.authenticate.token;
      if (authToken) {
        localStorage.setItem("auth_token", authToken);
        if (address) localStorage.setItem("auth_address", address);
        setToken(authToken);
        await loginAction(authToken);
      }
    } catch (error) {
      console.error("AuthProvider: Authentication failed:", error);
      // Disconnect wallet on auth failure to prevent "stuck" state
      disconnect();
      logout();
    } finally {
      authInProgress.current = false;
    }
  }, [address, authenticate, disconnect, signMessageAsync]);

  useEffect(() => {
    // 1. Detect Explicit Disconnect / Wallet Switch
    if (!isConnected && token) {
      console.log("AuthProvider: Wallet disconnected, clearing session.");
      logout();
      return;
    }

    // 2. Check for wallet address mismatch (Switch Account)
    if (isConnected && address && token) {
      const lastAddress = localStorage.getItem("auth_address");
      if (lastAddress && lastAddress.toLowerCase() !== address.toLowerCase()) {
        console.warn("AuthProvider: Wallet changed, logging out old user.");
        logout();
        return;
      }
    }

    // 3. Sync token to localStorage
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_address");
    }

    // 4. Auto-authenticate
    if (isConnected && address && !token && !authInProgress.current) {
      console.log("AuthProvider: triggering flow for", address);
      handleAuth();
    }
  }, [isConnected, address, token, handleAuth]);

  const logout = async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_address");
    setToken(null);
    await logoutAction();
  };

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, address, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
