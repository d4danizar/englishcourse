"use client";

import { useState } from "react";

export function StampImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    <img
      src={src}
      alt=""
      className="absolute -left-20 -top-4 h-40 w-40 object-contain opacity-80 -rotate-12 mix-blend-multiply pointer-events-none"
      onError={() => setHasError(true)}
    />
  );
}
