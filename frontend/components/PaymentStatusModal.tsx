'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2, Copy, Check } from 'lucide-react';

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash?: string;
  proofId?: string;
  onViewResult?: () => void;
}

export function PaymentStatusModal({
  isOpen,
  onClose,
  txHash = '0xABC123D456E789F0123456789ABCDEF123456789',
  proofId = '987654321ZyxWvUtSrQpOnMkJiHgFeDcBa123456',
  onViewResult
}: PaymentStatusModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);

  const steps = [
    { id: 1, label: 'Agent Selected' },
    { id: 2, label: 'Task Submitted' },
    { id: 3, label: 'Review Requested' },
    { id: 4, label: 'Payment Confirmed' },
    { id: 5, label: 'Processing' },
    { id: 6, label: 'Complete' }
  ];

  // Simulate progress
  useEffect(() => {
    if (currentStep < 6) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const copyToClipboard = (text: string, type: 'tx' | 'proof') => {
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedProof(true);
      setTimeout(() => setCopiedProof(false), 2000);
    }
  };

  const progress = (currentStep / 6) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-background to-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Payment Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Step Indicators */}
          <div className="flex justify-between items-center relative">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                </div>
              );
            })}
            {/* Connecting Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0" />
          </div>

          {/* Current Step Label */}
          <div className="text-center">
            <p className="text-lg font-semibold">
              Step {currentStep} of 6: {steps[currentStep - 1]?.label}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500 transition-all duration-500 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  {currentStep < 6 && <Loader2 className="h-3 w-3 animate-spin text-white" />}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {currentStep < 6 ? 'Processing...' : 'Payment confirmed! Your agent is now working.'}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="bg-card/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground"># Transaction Hash</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(txHash, 'tx')}
                >
                  {copiedTx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm font-mono break-all">{txHash}</p>
            </div>

            <div className="bg-card/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">🛡️ Proof ID</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(proofId, 'proof')}
                >
                  {copiedProof ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm font-mono break-all">{proofId}</p>
            </div>

            {/* Block Explorer Link */}
            <div className="flex justify-center">
              <a
                href={`https://testnet.snowtrace.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-500 hover:text-teal-400 flex items-center gap-2"
              >
                <span>View on Avalanche Explorer</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="text-center text-sm text-muted-foreground">
            Estimated time: {currentStep < 6 ? '8 seconds' : 'Completed'}
          </div>

          {/* View Result Button */}
          {currentStep === 6 && (
            <Button
              onClick={onViewResult || onClose}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-lg font-semibold"
            >
              View Result
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
