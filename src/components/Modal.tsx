"use client";

import Image from "next/image";
import { useEffect } from "react";

/** The overlay every form and dialog shares. */
const Modal = ({
  onClose,
  children,
  closeDisabled = false,
}: {
  onClose: () => void;
  children: React.ReactNode;
  closeDisabled?: boolean;
}) => {
  // Escape closes, and the page behind stops scrolling while the modal is up.
  // Clicking the backdrop deliberately does not close it: a stray click would
  // throw away a half-filled form.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, closeDisabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-2xl md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%] dark:bg-gray-800"
      >
        {children}
        <button
          type="button"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Close"
        >
          <Image src="/close.png" alt="" width={14} height={14} />
        </button>
      </div>
    </div>
  );
};

export default Modal;
