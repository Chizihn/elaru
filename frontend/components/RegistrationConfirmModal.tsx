"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { AlertTriangle, ShieldCheck, Scale, DollarSign, Clock, FileText } from "lucide-react";

interface FormData {
  name: string;
  serviceType: string;
  description: string;
  endpoint: string;
  price: string;
  stakeAmount: string;
  responseType: string;
}

interface RegistrationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: FormData;
  isPending: boolean;
}

export function RegistrationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  isPending,
}: RegistrationConfirmModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedSlashing, setAcceptedSlashing] = useState(false);

  const handleConfirm = () => {
    if (acceptedTerms && acceptedSlashing) {
      onConfirm();
    }
  };

  const canProceed = acceptedTerms && acceptedSlashing;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Confirm Agent Registration
          </DialogTitle>
          <DialogDescription>
            Please review your agent details and accept the terms before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Summary */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4" />
              Agent Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium text-foreground">{formData.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Service Type:</span>
                <p className="font-medium text-foreground">{formData.serviceType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Price per Request:</span>
                <p className="font-medium text-foreground">{formData.price} USDC</p>
              </div>
              <div>
                <span className="text-muted-foreground">Stake Amount:</span>
                <p className="font-medium text-primary">{formData.stakeAmount} AVAX</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Endpoint:</span>
                <p className="font-mono text-xs break-all text-foreground">{formData.endpoint}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <p className="text-sm text-foreground">{formData.description}</p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground">
              <Scale className="h-4 w-4" />
              Terms & Conditions
            </h3>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-orange-500">Economic Accountability</p>
                  <p className="text-sm text-muted-foreground">
                    Your staked AVAX serves as collateral. Poor performance (reviews below 3 stars) 
                    will result in automatic slashing of 0.1 AVAX per incident.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Staking Requirement</p>
                  <p className="text-muted-foreground">
                    You are staking <strong>{formData.stakeAmount} AVAX</strong> as collateral. 
                    If your stake falls below the minimum threshold, your agent will be deactivated.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Clock className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Response Time & Quality</p>
                  <p className="text-muted-foreground">
                    Your agent must respond to requests within a reasonable time. 
                    Users can leave reviews that directly impact your reputation score.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Truthfulness Requirement</p>
                  <p className="text-muted-foreground">
                    Your agent must provide accurate, truthful information. 
                    Deliberately false responses may result in slashing and deactivation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/20">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="border-2 border-primary data-[state=checked]:bg-primary"
              />
              <label
                htmlFor="terms"
                className="text-sm leading-tight cursor-pointer text-foreground"
              >
                I understand that my agent will be publicly listed and users will pay 
                <strong> {formData.price} USDC</strong> per request. I agree to provide 
                quality service and maintain my endpoint availability.
              </label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/20">
              <Checkbox
                id="slashing"
                checked={acceptedSlashing}
                onCheckedChange={(checked) => setAcceptedSlashing(checked as boolean)}
                className="border-2 border-primary data-[state=checked]:bg-primary"
              />
              <label
                htmlFor="slashing"
                className="text-sm leading-tight cursor-pointer text-foreground"
              >
                I understand that <strong>{formData.stakeAmount} AVAX</strong> will be 
                staked as collateral and may be <strong className="text-red-500">slashed</strong> if 
                my agent provides poor or incorrect responses. I accept the economic 
                accountability model.
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="link" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canProceed || isPending}
            variant="gradient"
          >
            {isPending ? "Processing..." : "Confirm & Stake"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
