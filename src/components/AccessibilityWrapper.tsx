import { useEffect, useRef } from "react";

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  announceOnMount?: string;
  trapFocus?: boolean;
  restoreFocus?: boolean;
}

export function AccessibilityWrapper({
  children,
  announceOnMount,
  trapFocus = false,
  restoreFocus = false,
}: AccessibilityWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement;
    }

    if (announceOnMount) {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = announceOnMount;
      document.body.appendChild(announcement);

      return () => {
        document.body.removeChild(announcement);
      };
    }
  }, [announceOnMount, restoreFocus]);

  useEffect(() => {
    if (!trapFocus) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [trapFocus]);

  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElementRef.current) {
        (previousActiveElementRef.current as HTMLElement).focus();
      }
    };
  }, [restoreFocus]);

  return (
    <div ref={containerRef} className="focus-visible-enhanced">
      {children}
    </div>
  );
}