"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingHeroForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    router.push(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your work email"
        required
        className="flex-1 px-5 py-4 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white placeholder-gray-500 focus:outline-none focus:border-[#01696F] focus:ring-1 focus:ring-[#01696F]/30 transition-all text-base"
      />
      <button
        type="submit"
        className="px-6 py-4 bg-[#01696F] hover:bg-[#0C4E54] text-white font-semibold rounded-xl transition-colors text-base whitespace-nowrap shadow-lg shadow-[#01696F]/20"
      >
        Get Free Access →
      </button>
    </form>
  );
}
