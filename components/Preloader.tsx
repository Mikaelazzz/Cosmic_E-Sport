"use client";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function Preloader({ onFinish }: { onFinish: () => void }) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch("/preloader.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  useEffect(() => {
    if (!animationData) return;
    // Hide after animation duration (default 2s fallback)
    const duration = (animationData.op / animationData.fr) * 1000 || 2000;
    const timeout = setTimeout(() => {
      onFinish();
    }, duration);
    return () => clearTimeout(timeout);
  }, [animationData, onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {animationData && (
        <Lottie animationData={animationData} style={{ width: 220, height: 220 }} loop={false} />
      )}
    </div>
  );
}
