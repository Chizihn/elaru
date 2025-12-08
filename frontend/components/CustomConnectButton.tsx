"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function CustomConnectButton() {
  const { isAuthenticated } = useAuth();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="default"
                    size="default"
                    className="font-bold uppercase"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="destructive">
                    Wrong network
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  <div
                    className="hidden md:flex items-center px-4 py-2 bg-muted border-2 border-border text-sm font-bold uppercase cursor-pointer text-foreground hover:border-primary transition-colors"
                    onClick={openChainModal}
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          overflow: "hidden",
                          marginRight: 8,
                          border: "2px solid hsl(var(--foreground))",
                        }}
                      >
                        {chain.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </div>

                  <Button
                    onClick={openAccountModal}
                    variant="secondary"
                    className={`hover:bg-secondary/80 transition-all ${
                      isAuthenticated ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {account.displayBalance &&
                      !account.displayBalance.includes("NaN") ? (
                        <span className="hidden sm:inline-block text-muted-foreground mr-1">
                          {account.displayBalance}
                        </span>
                      ) : null}
                      <span className="font-semibold">
                        {account.displayName}
                      </span>
                      {isAuthenticated && (
                        <div className="h-2 w-2 bg-accent border border-foreground animate-pulse" />
                      )}
                    </div>
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
