"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 fixed inset-0 w-full h-full  max-w-2xl translate-x-[-50%] left-[50%] translate-y-[-50%] top-[50%]  border bg-card dark:bg-background p-0 lg:max-h-[90vh] flex flex-col shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5  p-6 pb-4 border-b flex-shrink-0",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("p-6 pt-4 border-t flex-shrink-0", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

interface DialogFooterWithButtonProps {
  buttonMessage: string;
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const DialogFooterWithButton = ({
  buttonMessage,
  onClick,
  className,
  children,
  disabled,
}: DialogFooterWithButtonProps) => (
  <DialogFooter className={className}>
    <div className="flex justify-end items-center gap-2">
      {children}
      <Button
        onClick={onClick}
        disabled={disabled}
        className="bg-primary hover:bg-blue-700 px-6 text-white"
      >
        {buttonMessage}
      </Button>
    </div>
  </DialogFooter>
);
DialogFooterWithButton.displayName = "DialogFooterWithButton";

interface DialogFooterWithTwoButtonsProps {
  primaryButton: {
    message: string;
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
    variant?:
      | "default"
      | "outline"
      | "secondary"
      | "ghost"
      | "link"
      | "destructive";
  };
  secondaryButton: {
    message: string;
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
    variant?:
      | "default"
      | "outline"
      | "secondary"
      | "ghost"
      | "link"
      | "destructive";
  };
  className?: string;
}

const DialogFooterWithTwoButtons = ({
  primaryButton,
  secondaryButton,
  className,
}: DialogFooterWithTwoButtonsProps) => (
  <DialogFooter className={className}>
    <div className="flex gap-3">
      <Button
        onClick={primaryButton.onClick}
        className={`flex-1 ${primaryButton.className || ""}`}
      >
        {primaryButton.icon}
        {primaryButton.message}
      </Button>
      <Button
        variant={secondaryButton.variant || "outline"}
        onClick={secondaryButton.onClick}
        className={secondaryButton.className}
      >
        {secondaryButton.icon}
        {secondaryButton.message}
      </Button>
    </div>
  </DialogFooter>
);
DialogFooterWithTwoButtons.displayName = "DialogFooterWithTwoButtons";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-2xl font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm mt-2 text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogFooterWithButton,
  DialogFooterWithTwoButtons,
  DialogTitle,
  DialogDescription,
};
