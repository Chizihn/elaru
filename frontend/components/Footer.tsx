import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <Image
              src="/elaru-logo.png"
              width={100}
              height={50}
              alt="Elaru Logo"
              className="rounded-full"
            />
            <p className="text-sm text-muted-foreground">
              Building the trust layer for the agentic economy.
            </p>
          </div>
          <div>
            <h4 className="font-semibold  text-foreground mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/agents"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Browse Agents
                </Link>
              </li>
              <li>
                <Link
                  href="/register-agent"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Register Agent
                </Link>
              </li>
              <li>
                <Link
                  href="/validator"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Validator Node
                </Link>
              </li>
              <li>
                <Link
                  href="/proof"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Proof Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/documentation"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/widget"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Widget SDK
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Chizihn/elaru-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Network</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://testnet.snowtrace.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Snowtrace Explorer
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  AVAX Faucet
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  USDC Faucet
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground border-t border-border pt-8">
          © 2025 Elaru.AI. Built on Avalanche. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
