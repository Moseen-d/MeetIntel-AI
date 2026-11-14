"use client";

import React, { useState } from "react";
import {
  Building2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  FileText
} from "lucide-react";

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<"briefing" | "sources">("briefing");

  return (
    <section id="showcase" className="max-w-6xl mx-auto px-4 sm:px-6 mb-24 sm:mb-32">
      {/* Section Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-wider font-semibold text-[#E83FCB] mb-2 block">
          Platform Showcase
        </span>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#111111] tracking-tight">
          Executive Dossier Preview
        </h2>
        <p className="text-sm text-[#777777] mt-2 max-w-xl mx-auto">
          Generated in seconds before your critical conversation. Strictly source-backed from the last 30 days.
        </p>
      </div>

      {/* Main Dark Dashboard Container */}
      <div className="bg-[#171717] border border-neutral-800 rounded-2xl md:rounded-3xl shadow-dashboard overflow-hidden text-neutral-200">
        {/* Dashboard Window Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/50">
          {/* Window dots */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-neutral-700/80" />
            <span className="w-3 h-3 rounded-full bg-neutral-700/80" />
            <span className="w-3 h-3 rounded-full bg-neutral-700/80" />
            <span className="ml-2 text-xs font-mono text-neutral-400 hidden sm:inline">
              meetintel-agent://nvidia/job-interview
            </span>
          </div>

          {/* Central Target Info */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 font-medium text-white flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#E83FCB]" /> NVIDIA Corporation
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-800/60 border border-neutral-700/70 text-neutral-300 hidden md:inline">
              Purpose: Job Interview
            </span>
          </div>

          {/* Right Demo Tag */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Verified
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
              Interactive Demo
            </span>
          </div>
        </div>

        {/* Dashboard Subnav & Metainfo */}
        <div className="px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">Research Window</span>
              <span className="font-medium text-neutral-200">Last 30 Days (Oct – Nov 2024)</span>
            </div>
            <div className="h-6 w-[1px] bg-neutral-800 hidden sm:block" />
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">Sources Processed</span>
              <span className="font-medium text-neutral-200">6 Verified Articles</span>
            </div>
            <div className="h-6 w-[1px] bg-neutral-800 hidden sm:block" />
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase tracking-wider">Meeting Alignment</span>
              <span className="font-medium text-[#E83FCB]">AI Solutions Architect</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("briefing")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === "briefing"
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Briefing View
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === "sources"
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Source Grounding (6)
            </button>
          </div>
        </div>

        {/* Main Dashboard Preview Grid */}
        <div className="p-6 md:p-8">
          {activeTab === "briefing" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: TLDR & Key Developments (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Executive TL;DR */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E83FCB]" /> Executive Summary
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">Grounded via Tavily</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    NVIDIA has officially initiated volume customer shipments of its flagship Blackwell B200 AI GPUs to Microsoft Azure, AWS, and Google Cloud [1]. The company delivered record data center earnings of $30.8B, though enterprise hyperscaler deployment velocity is increasingly gated by regional data center power substation and liquid cooling capacities [2, 3].
                  </p>
                </div>

                {/* Key Developments */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                    <h3 className="font-display text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#E83FCB]" /> Key 30-Day Developments
                    </h3>
                    <span className="text-[11px] text-neutral-400">Ranked by Strategic Impact</span>
                  </div>

                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          Blackwell Ultra GPU Volume Deliveries to Cloud Hyperscalers
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-neutral-400">Oct 28</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-rose-950/60 text-rose-300 border border-rose-800/50">
                            Critical
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        NVIDIA confirmed volume deliveries of GB200 NVL72 and B200 systems to major cloud providers [1]. Production is sold out for the next 12 months with unprecedented demand across training and inference clusters [2].
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                        <span>Sources:</span>
                        <span className="text-neutral-400 underline decoration-neutral-700">NVIDIA Newsroom [1]</span>
                        <span>•</span>
                        <span className="text-neutral-400 underline decoration-neutral-700">Reuters [2]</span>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          Record Data Center Revenue of $30.8B (94% YoY Growth)
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-neutral-400">Oct 22</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                            Verified
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Quarterly performance outperformed consensus estimates, driven predominantly by enterprise LLM training and reasoning compute clusters [3].
                      </p>
                    </div>

                    {/* Item 3 */}
                    <div className="p-3.5 rounded-lg bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          Sovereign AI Infrastructure Alliances in Japan and Europe
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-neutral-400">Oct 15</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                            Single Source
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Direct agreements with national telecoms to construct localized sovereign supercomputers powered by DGX SuperPODs [4].
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Meeting Intelligence & Suggested Questions (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Interview Intelligence Box */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Lightbulb className="w-4 h-4 text-[#E83FCB]" />
                    <h3 className="font-display text-xs uppercase tracking-wider font-semibold text-white">
                      Meeting Intelligence: Job Interview
                    </h3>
                  </div>
                  <ul className="space-y-2.5 text-xs text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E83FCB] shrink-0 mt-1.5" />
                      <span>
                        <strong className="text-white">Address Thermal Engineering:</strong> Mention practical strategies for retrofitting legacy enterprise data centers to accommodate 120kW liquid-cooled Blackwell racks.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E83FCB] shrink-0 mt-1.5" />
                      <span>
                        <strong className="text-white">Software Moat:</strong> Emphasize experience with CUDA 12.8 native FP4 precision to demonstrate up-to-date awareness of recent inference speedups.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Suggested High-Conviction Questions */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center gap-2 mb-2.5">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-display text-xs uppercase tracking-wider font-semibold text-white">
                      Suggested Strategic Questions
                    </h3>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800/80 text-neutral-300">
                      "Given the 100kW+ rack density of GB200 NVL72, what retrofit engineering assistance is NVIDIA prioritizing for enterprise colocation partners without liquid cooling?"
                    </div>
                    <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800/80 text-neutral-300">
                      "With inferencing workloads expanding faster than frontier training, how do you see customer capex balancing between Blackwell GPUs and custom inference ASICs?"
                    </div>
                  </div>
                </div>

                {/* Risks Flagged */}
                <div className="p-3 rounded-lg bg-neutral-900/30 border border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Power grid bottlenecks flagged as primary rollout constraint
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">[2, 3]</span>
                </div>
              </div>
            </div>
          ) : (
            /* Sources Grounding Tab */
            <div className="space-y-3 max-w-3xl">
              <p className="text-xs text-neutral-400 mb-4">
                Every assertion in MeetIntel AI is anchored to a verifiable URL retrieved via Tavily within the last 30 days:
              </p>
              {[
                { id: 1, title: "NVIDIA Commences Volume Blackwell Shipments to Cloud Providers", url: "https://nvidianews.nvidia.com/news/blackwell-architecture-volume-shipments", domain: "nvidianews.nvidia.com", date: "2024-10-28" },
                { id: 2, title: "Reuters: Jensen Huang on Blackwell Demand and Supply Chain Realities", url: "https://www.reuters.com/technology/nvidia-blackwell-demand-supply-chain-2024", domain: "reuters.com", date: "2024-10-22" },
                { id: 3, title: "Bloomberg: NVIDIA Financial Results & AI Infrastructure Outlook", url: "https://www.bloomberg.com/news/articles/nvidia-quarterly-earnings-datacenter-surge", domain: "bloomberg.com", date: "2024-10-22" },
                { id: 4, title: "TechCrunch: NVIDIA Deepens Sovereign AI Footprint with Telecom Alliances", url: "https://techcrunch.com/2024/10/15/nvidia-sovereign-ai-telecom-europe-asia", domain: "techcrunch.com", date: "2024-10-15" },
                { id: 5, title: "Wall Street Journal: US Scrutiny Over Semiconductor Export Regulations", url: "https://www.wsj.com/tech/nvidia-china-export-restrictions-review", domain: "wsj.com", date: "2024-10-19" },
              ].map((s) => (
                <div key={s.id} className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-neutral-500 font-semibold">[{s.id}]</span>
                    <div>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-[#E83FCB] transition-colors flex items-center gap-1">
                        <span>{s.title}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-500" />
                      </a>
                      <span className="text-neutral-500 text-[11px] font-mono">{s.domain} • {s.date}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">Verified</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dashboard Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Ready to generate dossiers for your own scheduled meetings</span>
          </div>

          <a
            href="#app"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#E83FCB] hover:bg-[#D428B7] transition-all shadow-subtle"
          >
            <span>Research Your Upcoming Meeting</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
