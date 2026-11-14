"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProductShowcase } from "@/components/ProductShowcase";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { BriefingForm } from "@/components/BriefingForm";
import { LoadingStepper } from "@/components/LoadingStepper";
import { BriefingCard } from "@/components/BriefingCard";
import { RecentBriefings } from "@/components/RecentBriefings";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Footer } from "@/components/Footer";
import { BriefRequest, Briefing, PipelineEvent, PipelineStage } from "@/lib/schema";

const STORAGE_KEY = "meetintel_saved_briefings";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage>("Planning queries");
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [stageData, setStageData] = useState<any>(null);
  const [briefing, setBriefing] = useState<(Briefing & { purpose?: string }) | null>(null);
  const [lastRequest, setLastRequest] = useState<(BriefRequest & { purpose?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedBriefings, setSavedBriefings] = useState<(Briefing & { purpose?: string })[]>([]);

  // Load saved briefings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedBriefings(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to read briefings from localStorage", e);
    }
  }, []);

  const saveBriefingToStorage = (newBriefing: Briefing & { purpose?: string }) => {
    try {
      const updated = [
        newBriefing,
        ...savedBriefings.filter(
          (b) =>
            b.subject.toLowerCase() !== newBriefing.subject.toLowerCase() ||
            b.generatedAt !== newBriefing.generatedAt
        ),
      ].slice(0, 8); // keep last 8
      setSavedBriefings(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist briefing", e);
    }
  };

  const handleClearHistory = () => {
    setSavedBriefings([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleDeleteOne = (subject: string, generatedAt?: string) => {
    const updated = savedBriefings.filter(
      (b) => !(b.subject === subject && b.generatedAt === generatedAt)
    );
    setSavedBriefings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const startBriefingGeneration = async (request: BriefRequest & { purpose?: string }) => {
    setIsLoading(true);
    setError(null);
    setCurrentStage("Planning queries");
    setCurrentMessage("Initializing research agent...");
    setStageData(null);
    setLastRequest(request);

    // Auto-scroll to research area if needed
    const appEl = document.getElementById("app");
    if (appEl) {
      appEl.scrollIntoView({ behavior: "smooth" });
    }

    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.slice(5).trim();
            try {
              const event: PipelineEvent = JSON.parse(jsonStr);
              if (event.stage === "Error") {
                const detailedError =
                  event.message && !event.message.includes("fetch failed")
                    ? event.message
                    : event.error || "Backend research workflow encountered an error.";
                throw new Error(detailedError);
              }

              setCurrentStage(event.stage);
              setCurrentMessage(event.message);
              if (event.data) {
                setStageData(event.data);
              }

              if (event.stage === "Complete" && event.data) {
                const completeBriefing = {
                  ...(event.data as Briefing),
                  purpose: request.purpose,
                };
                setBriefing(completeBriefing);
                saveBriefingToStorage(completeBriefing);
              }
            } catch (parseErr: any) {
              if (parseErr.message && !parseErr.message.includes("JSON")) {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Briefing streaming error:", err);
      const rawMsg = err.message || "";
      const displayMsg =
        rawMsg === "fetch failed"
          ? "Unable to reach the live FastAPI backend service at http://127.0.0.1:8000. Please ensure the backend is running by executing: python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"
          : rawMsg || "Failed to generate briefing. Please check connection and retry.";
      setError(displayMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white selection:bg-[#FDF2FA] selection:text-[#E83FCB]">
      {/* Floating Navbar */}
      <Navbar />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <HeroSection />

        {/* Product Showcase (Dark dashboard container with NVIDIA demo) */}
        <ProductShowcase />

        {/* Features Section (6-item grid) */}
        <FeaturesSection />

        {/* How It Works (3 horizontal steps) */}
        <HowItWorksSection />

        {/* Live Research Application Section */}
        <section className="px-6 py-12 bg-[#F8F8F8] border-t border-[#EEEEEE]">
          <div className="max-w-4xl mx-auto">
            {/* Input Form */}
            <BriefingForm onSubmit={startBriefingGeneration} isLoading={isLoading} />

            {/* Error Notification */}
            {error && (
              <ErrorNotice
                message={error}
                onRetry={lastRequest ? () => startBriefingGeneration(lastRequest) : undefined}
              />
            )}

            {/* Loading Stepper */}
            {isLoading && (
              <div className="my-8">
                <LoadingStepper
                  currentStage={currentStage}
                  currentMessage={currentMessage}
                  stageData={stageData}
                />
              </div>
            )}

            {/* Formatted Report Card */}
            {!isLoading && briefing && (
              <BriefingCard
                briefing={briefing}
                onRegenerate={lastRequest ? () => startBriefingGeneration(lastRequest) : undefined}
                isRegenerating={isLoading}
              />
            )}

            {/* Recent Briefings History */}
            <RecentBriefings
              briefings={savedBriefings}
              onSelect={(selected) => {
                setBriefing(selected);
                const appEl = document.getElementById("app");
                if (appEl) appEl.scrollIntoView({ behavior: "smooth" });
              }}
              onClear={handleClearHistory}
              onDeleteOne={handleDeleteOne}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
