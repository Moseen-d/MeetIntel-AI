import { Briefing } from "./schema";

export const MOCK_BRIEFINGS: Record<string, Briefing> = {
  nvidia: {
    subject: "NVIDIA",
    meetingTime: new Date(Date.now() + 86400000).toISOString(),
    tldr: "NVIDIA has entered volume production and shipments of its flagship Blackwell B200 AI GPUs to major cloud hyperscalers. The company reported record quarterly data center revenue of $30.8B, though supply constraints and data center power capacity remain the primary headwinds for enterprise deployments.",
    keyDevelopments: [
      {
        headline: "Blackwell Ultra GPU Volume Deliveries Commence",
        summary: "NVIDIA has officially begun volume shipments of its GB200 NVL72 and B200 systems to Microsoft Azure, AWS, and Google Cloud [1]. Jensen Huang confirmed that Blackwell demand remains unprecedented with production sold out for the next 12 months [2].",
        date: "2024-10-28",
        confidence: "verified",
        sources: [
          { title: "NVIDIA Commences Volume Blackwell Shipments to Cloud Providers", url: "https://nvidianews.nvidia.com/news/blackwell-architecture-volume-shipments" },
          { title: "Reuters: Jensen Huang on Blackwell Demand and Supply Chain Realities", url: "https://www.reuters.com/technology/nvidia-blackwell-demand-supply-chain-2024" },
        ],
      },
      {
        headline: "Record Data Center Earnings of $30.8B Driven by Generative AI Scaling",
        summary: "Quarterly revenue climbed 94% year-over-year, beating Wall Street consensus, driven overwhelmingly by generative AI training and reasoning clusters [2].",
        date: "2024-10-22",
        confidence: "verified",
        sources: [
          { title: "Reuters: Jensen Huang on Blackwell Demand and Supply Chain Realities", url: "https://www.reuters.com/technology/nvidia-blackwell-demand-supply-chain-2024" },
          { title: "Bloomberg: NVIDIA Financial Results & AI Infrastructure Outlook", url: "https://www.bloomberg.com/news/articles/nvidia-quarterly-earnings-datacenter-surge" },
        ],
      },
      {
        headline: "Strategic Expansion into Sovereign AI Infrastructure in Europe & Asia",
        summary: "NVIDIA announced direct partnerships with national telecom operators in Japan and France to build localized sovereign AI supercomputers powered by DGX SuperPODs [3].",
        date: "2024-10-15",
        confidence: "single-source",
        sources: [
          { title: "TechCrunch: NVIDIA Deepens Sovereign AI Footprint with Telecom Alliances", url: "https://techcrunch.com/2024/10/15/nvidia-sovereign-ai-telecom-europe-asia" },
        ],
      },
    ],
    leadershipAndPeople: [
      {
        headline: "Jensen Huang Emphasizes Physical AI & Industrial Robotics at GTC Keynote",
        summary: "CEO Jensen Huang outlined NVIDIA's next trillion-dollar frontier as 'Physical AI'—autonomous robots and smart factories simulated via NVIDIA Omniverse and Cosmos foundation models [1].",
        date: "2024-10-25",
        confidence: "verified",
        sources: [
          { title: "NVIDIA Commences Volume Blackwell Shipments to Cloud Providers", url: "https://nvidianews.nvidia.com/news/blackwell-architecture-volume-shipments" },
          { title: "TechCrunch: NVIDIA Deepens Sovereign AI Footprint with Telecom Alliances", url: "https://techcrunch.com/2024/10/15/nvidia-sovereign-ai-telecom-europe-asia" },
        ],
      },
      {
        headline: "Leadership Additions to Silicon Packaging and CoWoS Engineering",
        summary: "NVIDIA appointed former TSMC packaging executive David Lin to oversee next-gen advanced multi-die packaging resilience amid global wafer bottlenecks [3].",
        date: "2024-10-12",
        confidence: "single-source",
        sources: [
          { title: "TechCrunch: NVIDIA Deepens Sovereign AI Footprint with Telecom Alliances", url: "https://techcrunch.com/2024/10/15/nvidia-sovereign-ai-telecom-europe-asia" },
        ],
      },
    ],
    productsAndAnnouncements: [
      {
        headline: "CUDA 12.8 Release with FP4 Precision Support for Inference Scaling",
        summary: "The CUDA software update unlocks native 4-bit floating point matrix math, cutting inference memory footprint by 50% while maintaining accuracy on Blackwell tensor cores [1].",
        date: "2024-10-20",
        confidence: "verified",
        sources: [
          { title: "NVIDIA Commences Volume Blackwell Shipments to Cloud Providers", url: "https://nvidianews.nvidia.com/news/blackwell-architecture-volume-shipments" },
        ],
      },
      {
        headline: "Spectrum-X Ethernet Networking Adoption Across Tier-2 Clouds",
        summary: "NVIDIA's Spectrum-X Ethernet switches achieved 1.6 Tbps interconnect bandwidth, challenging traditional InfiniBand dominance in multi-tenant AI clusters [3].",
        date: "2024-10-18",
        confidence: "single-source",
        sources: [
          { title: "TechCrunch: NVIDIA Deepens Sovereign AI Footprint with Telecom Alliances", url: "https://techcrunch.com/2024/10/15/nvidia-sovereign-ai-telecom-europe-asia" },
        ],
      },
    ],
    risksAndOpenUncertainties: [
      {
        headline: "Hyperscaler Data Center Power & Cooling Grid Bottlenecks",
        summary: "Industry analysts flag that power grid interconnection delays (up to 3 years in Northern Virginia and Ireland) could slow the deployment rate of 120kW Blackwell liquid-cooled racks [2].",
        date: "2024-10-24",
        confidence: "verified",
        sources: [
          { title: "Reuters: Jensen Huang on Blackwell Demand and Supply Chain Realities", url: "https://www.reuters.com/technology/nvidia-blackwell-demand-supply-chain-2024" },
          { title: "Bloomberg: NVIDIA Financial Results & AI Infrastructure Outlook", url: "https://www.bloomberg.com/news/articles/nvidia-quarterly-earnings-datacenter-surge" },
        ],
      },
      {
        headline: "Geopolitical Export Controls & Chinese Market Market-Share Erosion",
        summary: "Reports suggest US regulators are evaluating stricter tiering on customized chips (H20), with domestic Chinese accelerators gaining ground among local hyperscalers [4].",
        date: "2024-10-19",
        confidence: "uncertain",
        sources: [
          { title: "Wall Street Journal: US Scrutiny Over Semiconductor Export Loopholes", url: "https://www.wsj.com/tech/nvidia-china-export-restrictions-review" },
        ],
      },
    ],
    talkingPoints: [
      "Congratulate on Blackwell mass production ramp and the swift engineering resolution of liquid-cooling manifold thermal tolerances.",
      "Explore how NVIDIA views the balance between proprietary InfiniBand architectures and Spectrum-X Ethernet for enterprise clusters.",
      "Discuss strategies for mitigating data center power substation constraints (e.g. modular SMR nuclear or colocation alternatives).",
      "Inquire how their enterprise software revenue (NVIDIA AI Enterprise) is tracking relative to silicon hardware.",
    ],
    openQuestions: [
      "Given the 100kW+ rack density of GB200 NVL72, what retrofit assistance is NVIDIA providing to enterprise colocation partners without direct liquid cooling?",
      "How is NVIDIA balancing allocation between Tier-1 cloud hyperscalers and sovereign AI national initiatives over the next 4 quarters?",
      "With inferencing workloads expanding faster than training, how do you expect customer capex allocation to shift between B200 and specialized inference accelerators?",
    ],
    sources: [
      { id: 1, title: "NVIDIA Commences Volume Blackwell Shipments to Cloud Providers", url: "https://nvidianews.nvidia.com/news/blackwell-architecture-volume-shipments", date: "2024-10-28" },
      { id: 2, title: "Reuters: Jensen Huang on Blackwell Demand and Supply Chain Realities", url: "https://www.reuters.com/technology/nvidia-blackwell-demand-supply-chain-2024", date: "2024-10-22" },
      { id: 3, title: "TechCrunch: NVIDIA Deepens Sovereign AI Footprint with Telecom Alliances", url: "https://techcrunch.com/2024/10/15/nvidia-sovereign-ai-telecom-europe-asia", date: "2024-10-15" },
      { id: 4, title: "Wall Street Journal: US Scrutiny Over Semiconductor Export Loopholes", url: "https://www.wsj.com/tech/nvidia-china-export-restrictions-review", date: "2024-10-19" },
      { id: 5, title: "Bloomberg: NVIDIA Financial Results & AI Infrastructure Outlook", url: "https://www.bloomberg.com/news/articles/nvidia-quarterly-earnings-datacenter-surge", date: "2024-10-22" },
    ],
    generatedAt: new Date().toISOString(),
    coverageNote: "Covers the last 30 days",
    isLowData: false,
  },

  anthropic: {
    subject: "Anthropic",
    meetingTime: new Date(Date.now() + 86400000).toISOString(),
    tldr: "Anthropic released the upgraded Claude 3.5 Sonnet featuring industry-first 'Computer Use' capability in public beta, allowing the model to interact with desktop GUIs. Concurrently, Amazon committed an additional $4B investment as enterprise Claude adoption surges across Fortune 500 legal and engineering workflows.",
    keyDevelopments: [
      {
        headline: "Launch of 'Computer Use' API on Upgraded Claude 3.5 Sonnet",
        summary: "Anthropic introduced a groundbreaking API feature enabling Claude 3.5 Sonnet to interpret screens, move the cursor, click buttons, and type text to automate complex multi-step computer tasks [1]. Early enterprise testers include Asana, Canva, and DoorDash [2].",
        date: "2024-10-22",
        confidence: "verified",
        sources: [
          { title: "Anthropic Newsroom: Introducing Computer Use and 3.5 Sonnet Upgrades", url: "https://www.anthropic.com/news/3-5-models-and-computer-use" },
          { title: "The Verge: Anthropic's Claude Can Now Control Your PC", url: "https://www.theverge.com/2024/10/22/anthropic-claude-computer-use-ai-agent" },
        ],
      },
      {
        headline: "Amazon Completes $4B Total Strategic Investment & Trainium2 Alignment",
        summary: "Amazon deepened its partnership with an additional capital tranche, establishing AWS as Anthropic's primary cloud training partner using next-gen AWS Trainium2 custom accelerators [3].",
        date: "2024-10-27",
        confidence: "verified",
        sources: [
          { title: "Financial Times: Amazon Completes Multi-Billion Investment in Anthropic", url: "https://www.ft.com/content/amazon-anthropic-investment-trainium-deal" },
          { title: "Reuters: AWS and Anthropic Expand Strategic AI Collaboration", url: "https://www.reuters.com/business/amazon-anthropic-expand-cloud-ai-partnership-2024" },
        ],
      },
      {
        headline: "Release of 3.5 Haiku with State-of-the-Art Coding Efficiency",
        summary: "Announced Claude 3.5 Haiku, delivering performance matching the previous generation flagship Claude 3 Opus at a fraction of the latency and cost [1].",
        date: "2024-10-22",
        confidence: "single-source",
        sources: [
          { title: "Anthropic Newsroom: Introducing Computer Use and 3.5 Sonnet Upgrades", url: "https://www.anthropic.com/news/3-5-models-and-computer-use" },
        ],
      },
    ],
    leadershipAndPeople: [
      {
        headline: "Dario Amodei Publishes 'Machines of Loving Grace' Manifesto",
        summary: "CEO Dario Amodei released an extensive 15,000-word essay laying out a grounded, optimistic vision of powerful AI compressing 50-100 years of biological disease eradication and economic development into 5-10 years [4].",
        date: "2024-10-11",
        confidence: "verified",
        sources: [
          { title: "Dario Amodei: Machines of Loving Grace — How AI Could Transform the World", url: "https://darioamodei.com/machines-of-loving-grace" },
          { title: "The Verge: Anthropic's Claude Can Now Control Your PC", url: "https://www.theverge.com/2024/10/22/anthropic-claude-computer-use-ai-agent" },
        ],
      },
    ],
    productsAndAnnouncements: [
      {
        headline: "Claude Enterprise Plan Rollout with GitHub Integration",
        summary: "Anthropic expanded enterprise security features, adding native GitHub repository syncing and enterprise admin role management for software teams [1].",
        date: "2024-10-18",
        confidence: "single-source",
        sources: [
          { title: "Anthropic Newsroom: Introducing Computer Use and 3.5 Sonnet Upgrades", url: "https://www.anthropic.com/news/3-5-models-and-computer-use" },
        ],
      },
    ],
    risksAndOpenUncertainties: [
      {
        headline: "Security Vector of Prompt Injection in Autonomous Computer Use",
        summary: "Security researchers demonstrated that prompt injection via untrusted web pages could trick computer-use agents into executing unauthorized clipboard or terminal actions [2]. Anthropic noted safeguard classifiers are actively being tuned [1].",
        date: "2024-10-24",
        confidence: "verified",
        sources: [
          { title: "Anthropic Newsroom: Introducing Computer Use and 3.5 Sonnet Upgrades", url: "https://www.anthropic.com/news/3-5-models-and-computer-use" },
          { title: "The Verge: Anthropic's Claude Can Now Control Your PC", url: "https://www.theverge.com/2024/10/22/anthropic-claude-computer-use-ai-agent" },
        ],
      },
      {
        headline: "Multi-Cloud Compute Availability and Margin Pressures",
        summary: "Market analysts note that while Anthropic supports both AWS Bedrock and Google Cloud Vertex AI, multi-cloud overhead and frontier training cluster capex require sustained high enterprise ARR growth [3].",
        date: "2024-10-26",
        confidence: "single-source",
        sources: [
          { title: "Financial Times: Amazon Completes Multi-Billion Investment in Anthropic", url: "https://www.ft.com/content/amazon-anthropic-investment-trainium-deal" },
        ],
      },
    ],
    talkingPoints: [
      "Commend the team on the breakthrough release of the Computer Use API, highlighting developer reception.",
      "Explore customer adoption patterns for Claude 3.5 Sonnet vs. Haiku in production agentic workflows.",
      "Discuss how Anthropic's Responsible Scaling Policy (RSP) is evolving as models approach ASL-3 capability thresholds.",
      "Discuss enterprise integration priorities (e.g. SOC2 Type II, on-prem VPC deployments, fine-tuning).",
    ],
    openQuestions: [
      "What mitigations does Anthropic recommend for enterprise clients deploying Computer Use against sensitive internal applications prone to indirect prompt injection?",
      "How is Anthropic navigating cluster workload distribution across AWS Trainium2 versus NVIDIA H100/Blackwell infrastructure?",
      "When can enterprise customers anticipate Claude 3.5 Opus release timelines, and what reasoning benchmarks is it targeting?",
    ],
    sources: [
      { id: 1, title: "Anthropic Newsroom: Introducing Computer Use and 3.5 Sonnet Upgrades", url: "https://www.anthropic.com/news/3-5-models-and-computer-use", date: "2024-10-22" },
      { id: 2, title: "The Verge: Anthropic's Claude Can Now Control Your PC", url: "https://www.theverge.com/2024/10/22/anthropic-claude-computer-use-ai-agent", date: "2024-10-22" },
      { id: 3, title: "Financial Times: Amazon Completes Multi-Billion Investment in Anthropic", url: "https://www.ft.com/content/amazon-anthropic-investment-trainium-deal", date: "2024-10-27" },
      { id: 4, title: "Dario Amodei: Machines of Loving Grace — How AI Could Transform the World", url: "https://darioamodei.com/machines-of-loving-grace", date: "2024-10-11" },
      { id: 5, title: "Reuters: AWS and Anthropic Expand Strategic AI Collaboration", url: "https://www.reuters.com/business/amazon-anthropic-expand-cloud-ai-partnership-2024", date: "2024-10-27" },
    ],
    generatedAt: new Date().toISOString(),
    coverageNote: "Covers the last 30 days",
    isLowData: false,
  },

  "satya nadella": {
    subject: "Satya Nadella",
    meetingTime: new Date(Date.now() + 86400000).toISOString(),
    tldr: "Satya Nadella has spearheaded Microsoft's pivot from assistive 'copilots' to autonomous enterprise AI agents, highlighted by major Copilot Studio agent builder announcements. Simultaneously, he executed a landmark 20-year power purchase agreement to restart the Three Mile Island nuclear plant to supply zero-carbon baseload electricity for Microsoft's AI data centers.",
    keyDevelopments: [
      {
        headline: "Announces Autonomous AI Agents in Copilot Studio at London Summit",
        summary: "Nadella unveiled 10 new autonomous agents embedded within Dynamics 365, enabling businesses to automate sales qualification, supplier communication, and customer service workflows without human handoffs [1]. He emphasized that 'agents will be the new apps' [2].",
        date: "2024-10-21",
        confidence: "verified",
        sources: [
          { title: "Microsoft Official Blog: Satya Nadella on the Shift to Autonomous AI Agents", url: "https://blogs.microsoft.com/blog/2024/10/21/autonomous-ai-agents-copilot-studio" },
          { title: "CNBC: Satya Nadella Explains Why Autonomous Agents are the Next Software Paradigm", url: "https://www.cnbc.com/2024/10/21/microsoft-satya-nadella-autonomous-ai-agents.html" },
        ],
      },
      {
        headline: "Landmark 20-Year Nuclear Power Agreement with Constellation Energy",
        summary: "Under Nadella's direction, Microsoft signed an exclusive agreement to restart the Unit 1 reactor at Three Mile Island (renamed Crane Clean Energy Center), providing over 800 megawatts of carbon-free electricity dedicated to Microsoft AI servers [3].",
        date: "2024-09-20",
        confidence: "verified",
        sources: [
          { title: "Bloomberg: Microsoft Deal Restarts Three Mile Island Nuclear Power Plant", url: "https://www.bloomberg.com/news/articles/2024-09-20/three-mile-island-restart-microsoft-ai" },
          { title: "Wall Street Journal: Tech Giants Turn to Nuclear Energy for AI Data Centers", url: "https://www.wsj.com/business/energy-oil/microsoft-nuclear-power-constellation-energy" },
        ],
      },
      {
        headline: "Microsoft AI Business Hits $10 Billion Annual Revenue Run Rate",
        summary: "Nadella disclosed during the quarterly shareholder address that Microsoft's AI business surpassed a $10B annual run rate faster than any software segment in the company's 49-year history [4].",
        date: "2024-10-30",
        confidence: "verified",
        sources: [
          { title: "Reuters: Microsoft Beats Wall Street Expectations on Azure AI Acceleration", url: "https://www.reuters.com/technology/microsoft-q1-earnings-azure-ai-growth-2024" },
          { title: "CNBC: Satya Nadella Explains Why Autonomous Agents are the Next Software Paradigm", url: "https://www.cnbc.com/2024/10/21/microsoft-satya-nadella-autonomous-ai-agents.html" },
        ],
      },
    ],
    leadershipAndPeople: [
      {
        headline: "Consolidation of Consumer and Enterprise AI Under Microsoft AI Division",
        summary: "Nadella reaffirmed the structural alignment between Mustafa Suleyman's Microsoft AI group (consumer products, Copilot app) and Scott Guthrie's Cloud + AI platform engineering [1].",
        date: "2024-10-14",
        confidence: "single-source",
        sources: [
          { title: "Microsoft Official Blog: Satya Nadella on the Shift to Autonomous AI Agents", url: "https://blogs.microsoft.com/blog/2024/10/21/autonomous-ai-agents-copilot-studio" },
        ],
      },
    ],
    productsAndAnnouncements: [
      {
        headline: "Copilot Voice and Daily Briefings Overhaul on Mobile",
        summary: "Unveiled natural conversational voice capabilities for Copilot, repositioning it as a warm, personalized companion across Windows 11 and mobile apps [2].",
        date: "2024-10-01",
        confidence: "verified",
        sources: [
          { title: "CNBC: Satya Nadella Explains Why Autonomous Agents are the Next Software Paradigm", url: "https://www.cnbc.com/2024/10/21/microsoft-satya-nadella-autonomous-ai-agents.html" },
        ],
      },
    ],
    risksAndOpenUncertainties: [
      {
        headline: "Antitrust Scrutiny Over Cloud Software Bundling in Europe",
        summary: "The European Commission and UK CMA continue inquiries into whether Teams and Copilot integration within Microsoft 365 infringes fair digital market practices [5].",
        date: "2024-10-18",
        confidence: "uncertain",
        sources: [
          { title: "Financial Times: European Regulators Weigh Next Steps in Microsoft AI Probes", url: "https://www.ft.com/content/microsoft-eu-antitrust-cloud-scrutiny" },
        ],
      },
      {
        headline: "Capital Expenditure Acceleration vs. Investor ROI Timelines",
        summary: "With quarterly capital expenditures reaching $20B (predominantly cloud servers and real estate), financial analysts question near-term margin dilution before enterprise agent productivity monetizes at scale [4].",
        date: "2024-10-30",
        confidence: "single-source",
        sources: [
          { title: "Reuters: Microsoft Beats Wall Street Expectations on Azure AI Acceleration", url: "https://www.reuters.com/technology/microsoft-q1-earnings-azure-ai-growth-2024" },
        ],
      },
    ],
    talkingPoints: [
      "Acknowledge the bold strategic milestone of securing nuclear baseload power to anchor Microsoft's sustainable AI growth.",
      "Discuss Nadella's perspective on the organizational transition from copilots to self-orchestrating agents in Dynamics and Office 365.",
      "Explore how Azure's model catalog (Phi-3, OpenAI o1/GPT-4o, Mistral) is evolving for enterprise hybrid-cloud clients.",
      "Inquire into feedback from enterprise CIOs on ROI metrics from Copilot for Microsoft 365 deployments.",
    ],
    openQuestions: [
      "How is Microsoft structured to resolve potential channel conflicts between custom internal agents built by enterprise clients and out-of-the-box Dynamics 365 agents?",
      "Given the multi-year timeline to bring restarted nuclear reactors online, how is Microsoft managing interim power grid interconnect delays for near-term Azure cluster expansions?",
      "What are the key governance and auditability guardrails Microsoft is implementing to prevent hallucinated actions in autonomous Copilot agents acting on corporate databases?",
    ],
    sources: [
      { id: 1, title: "Microsoft Official Blog: Satya Nadella on the Shift to Autonomous AI Agents", url: "https://blogs.microsoft.com/blog/2024/10/21/autonomous-ai-agents-copilot-studio", date: "2024-10-21" },
      { id: 2, title: "CNBC: Satya Nadella Explains Why Autonomous Agents are the Next Software Paradigm", url: "https://www.cnbc.com/2024/10/21/microsoft-satya-nadella-autonomous-ai-agents.html", date: "2024-10-21" },
      { id: 3, title: "Bloomberg: Microsoft Deal Restarts Three Mile Island Nuclear Power Plant", url: "https://www.bloomberg.com/news/articles/2024-09-20/three-mile-island-restart-microsoft-ai", date: "2024-09-20" },
      { id: 4, title: "Reuters: Microsoft Beats Wall Street Expectations on Azure AI Acceleration", url: "https://www.reuters.com/technology/microsoft-q1-earnings-azure-ai-growth-2024", date: "2024-10-30" },
      { id: 5, title: "Financial Times: European Regulators Weigh Next Steps in Microsoft AI Probes", url: "https://www.ft.com/content/microsoft-eu-antitrust-cloud-scrutiny", date: "2024-10-18" },
    ],
    generatedAt: new Date().toISOString(),
    coverageNote: "Covers the last 30 days",
    isLowData: false,
  },
};

/**
 * Returns a high-fidelity mock briefing for known subjects, or dynamically generates
 * a realistic 30-day template briefing for arbitrary subjects.
 */
export function getMockBriefing(
  subject: string,
  type: "company" | "person",
  meetingTime: string,
  context?: string
): Briefing {
  const normalized = subject.toLowerCase().trim();

  for (const [key, briefing] of Object.entries(MOCK_BRIEFINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        ...briefing,
        meetingTime: meetingTime || briefing.meetingTime,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // Generic dynamic fallback for any other subject in mock mode
  const cleanSubject = subject.trim();
  const isCompany = type === "company";

  return {
    subject: cleanSubject,
    meetingTime: meetingTime || new Date().toISOString(),
    tldr: `${cleanSubject} has continued active operations over the past 30 days, prioritizing execution across core initiatives and customer partnerships. Market discussions highlight ongoing investments in scaling and efficiency amidst shifting industry dynamics.`,
    keyDevelopments: [
      {
        headline: `${cleanSubject} Announces Strategic Expansion and Q4 Roadmap`,
        summary: `Recent statements indicate ${cleanSubject} is prioritizing customer retention and scaling strategic commercial initiatives over the upcoming quarter [1]. Industry coverage emphasizes operational resilience [2].`,
        date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0],
        confidence: "verified",
        sources: [
          { title: `${cleanSubject} Quarterly Strategy and Operational Overview`, url: `https://news.example.com/${encodeURIComponent(cleanSubject)}/operations` },
          { title: `Industry Wire: Recent Market Moves by ${cleanSubject}`, url: `https://wire.example.com/${encodeURIComponent(cleanSubject)}/market-moves` },
        ],
      },
      {
        headline: `Partnership and Ecosystem Broadening`,
        summary: `New collaboration agreements were announced to integrate services with cross-industry enterprise platforms [2].`,
        date: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
        confidence: "single-source",
        sources: [
          { title: `Industry Wire: Recent Market Moves by ${cleanSubject}`, url: `https://wire.example.com/${encodeURIComponent(cleanSubject)}/market-moves` },
        ],
      },
    ],
    leadershipAndPeople: [
      {
        headline: `${isCompany ? "Executive Leadership Team Focus" : "Key Speaking Appearance and Vision"}`,
        summary: `${isCompany ? `${cleanSubject}'s executive bench reiterated focus on sustainable operating margins and talent development [1].` : `${cleanSubject} recently participated in industry dialogue emphasizing modernization and technological readiness [2].`}`,
        date: new Date(Date.now() - 18 * 86400000).toISOString().split("T")[0],
        confidence: "single-source",
        sources: [
          { title: `${cleanSubject} Quarterly Strategy and Operational Overview`, url: `https://news.example.com/${encodeURIComponent(cleanSubject)}/operations` },
        ],
      },
    ],
    productsAndAnnouncements: [
      {
        headline: `Platform Feature Refinements and Security Updates`,
        summary: `Introduced incremental service reliability enhancements and compliance updates for enterprise clients [1].`,
        date: new Date(Date.now() - 21 * 86400000).toISOString().split("T")[0],
        confidence: "single-source",
        sources: [
          { title: `${cleanSubject} Quarterly Strategy and Operational Overview`, url: `https://news.example.com/${encodeURIComponent(cleanSubject)}/operations` },
        ],
      },
    ],
    risksAndOpenUncertainties: [
      {
        headline: "Macro Headwinds and Competitive Density",
        summary: `Market analysts cite competitive pricing pressure and customer procurement review cycles as key considerations for the coming quarter [3].`,
        date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
        confidence: "uncertain",
        sources: [
          { title: `Market Analysis: Competitive Landscape and Outlook`, url: `https://insights.example.com/analysis/${encodeURIComponent(cleanSubject)}` },
        ],
      },
    ],
    talkingPoints: [
      `Acknowledge recent milestones in expanding operational capacity over the last month.`,
      `Discuss key objectives outlined for the current quarterly cycle.`,
      `Inquire about strategic resource allocation in response to market shifts.`,
    ],
    openQuestions: [
      `What are the immediate high-priority milestones ${cleanSubject} is tracking over the next 90 days?`,
      `How are recent competitive developments shaping your team's tactical priorities?`,
      `Where do you see the greatest untapped synergy in our upcoming meeting discussion?`,
    ],
    sources: [
      { id: 1, title: `${cleanSubject} Quarterly Strategy and Operational Overview`, url: `https://news.example.com/${encodeURIComponent(cleanSubject)}/operations`, date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0] },
      { id: 2, title: `Industry Wire: Recent Market Moves by ${cleanSubject}`, url: `https://wire.example.com/${encodeURIComponent(cleanSubject)}/market-moves`, date: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0] },
      { id: 3, title: `Market Analysis: Competitive Landscape and Outlook`, url: `https://insights.example.com/analysis/${encodeURIComponent(cleanSubject)}`, date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0] },
    ],
    generatedAt: new Date().toISOString(),
    coverageNote: "Covers the last 30 days",
    isLowData: false,
  };
}
