"use client";

import { useState, type ReactNode } from "react";

type ScheduleService = "cabs" | "goods-transport";

const SERVICE_LABEL: Record<ScheduleService, string> = {
  cabs: "Book a cab",
  "goods-transport": "Find transport",
};

export function SpecialScheduleTabs({
  service,
  serviceContent,
  scheduleContent,
}: {
  service: ScheduleService;
  serviceContent: ReactNode;
  scheduleContent: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"service" | "schedule">("service");
  const tabs = [
    { id: "service" as const, label: SERVICE_LABEL[service] },
    { id: "schedule" as const, label: "Special Schedule" },
  ];

  return (
    <section className="pt-1">
      <div role="tablist" aria-label={`${SERVICE_LABEL[service]} options`} className="flex gap-2 border-b border-[var(--border)] px-4 md:px-7">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-3 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{activeTab === "service" ? serviceContent : scheduleContent}</div>
    </section>
  );
}
