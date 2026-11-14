"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 no-print">
      <nav
        className={`w-full max-w-5xl rounded-full px-5 py-2.5 flex items-center justify-between transition-all duration-200 border ${
          scrolled
            ? "bg-white/85 backdrop-blur-md border-[#EEEEEE] shadow-nav"
            : "bg-white/95 backdrop-blur-sm border-[#EEEEEE] shadow-subtle"
        }`}
      >
        {/* Left: Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-[#111111] flex items-center justify-center text-white relative">
            <span className="font-display font-bold text-sm tracking-tight">M</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#E83FCB]" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-[#111111]">
            MeetIntel<span className="text-[#E83FCB]">.ai</span>
          </span>
        </a>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-[#777777]">
          <a
            href="#features"
            className="hover:text-[#111111] transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#111111] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#showcase"
            className="hover:text-[#111111] transition-colors"
          >
            Product Preview
          </a>
          <a
            href="#app"
            className="hover:text-[#111111] transition-colors flex items-center gap-1"
          >
            <span>Research App</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E83FCB]" />
          </a>
        </div>

        {/* Right: CTA button */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="#app"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#111111] hover:bg-[#E83FCB] active:scale-95 transition-all shadow-subtle"
          >
            <span>Start Researching</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1 text-[#111111] focus:outline-none"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-4 right-4 bg-white border border-[#EEEEEE] rounded-2xl shadow-card p-5 flex flex-col gap-4 text-sm font-medium text-[#111111] md:hidden">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1 text-[#777777] hover:text-[#111111]"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1 text-[#777777] hover:text-[#111111]"
          >
            How It Works
          </a>
          <a
            href="#showcase"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1 text-[#777777] hover:text-[#111111]"
          >
            Product Preview
          </a>
          <a
            href="#app"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-center rounded-full text-white bg-[#111111] hover:bg-[#E83FCB] transition-colors"
          >
            Start Researching
          </a>
        </div>
      )}
    </header>
  );
}
