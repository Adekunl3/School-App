"use client";

import Image from "next/image";

/** The overlay FormModal uses, for dialogs that are not a module's own form. */
const Modal = ({
  onClose,
  children,
  closeDisabled = false,
}: {
  onClose: () => void;
  children: React.ReactNode;
  closeDisabled?: boolean;
}) => (
  <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
    <div className="bg-white p-4 rounded-md relative w-full md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[45%] max-h-[90vh] overflow-y-auto">
      {children}
      <button
        type="button"
        className="absolute top-4 right-4 cursor-pointer disabled:opacity-40"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Close"
      >
        <Image src="/close.png" alt="" width={14} height={14} />
      </button>
    </div>
  </div>
);

export default Modal;
