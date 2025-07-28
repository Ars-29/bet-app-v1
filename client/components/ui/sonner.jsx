"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "light" } = useTheme()

  return (
    <>
      <style jsx global>{`
        .toaster {
          --toast-transition: transform 0.3s ease-out;
        }
        .toast {
          transform-origin: top center;
        }
        .toast[data-state="open"] {
          animation: slideInFromTop 0.3s ease-out;
        }
        .toast[data-state="closed"] {
          animation: slideOutToTop 0.3s ease-out;
        }
        @keyframes slideInFromTop {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideOutToTop {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `}</style>
      <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          // Custom colors for different toast types - lighter and more transparent
          "--normal-bg": "rgba(255, 255, 255, 0.95)",
          "--normal-text": "#1f2937",
          "--normal-border": "rgba(229, 231, 235, 0.8)",
          "--success-bg": "rgba(240, 253, 244, 0.95)",
          "--success-text": "#166534",
          "--success-border": "rgba(187, 247, 208, 0.8)",
          "--error-bg": "rgba(254, 242, 242, 0.95)",
          "--error-text": "#dc2626",
          "--error-border": "rgba(254, 202, 202, 0.8)",
          "--warning-bg": "rgba(255, 251, 235, 0.95)",
          "--warning-text": "#d97706",
          "--warning-border": "rgba(254, 215, 170, 0.8)",
          "--info-bg": "rgba(239, 246, 255, 0.95)",
          "--info-text": "#1d4ed8",
          "--info-border": "rgba(191, 219, 254, 0.8)"
        }
      }
      toastOptions={{
        style: {
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        className: "toast rounded-none",
        duration: 5000,
      }}
      {...props} />
    </>
  );
}

export { Toaster }
