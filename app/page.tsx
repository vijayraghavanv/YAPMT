'use client';

import { LLMSetup } from "@/components/setup/llm-setup";
import { ProjectList } from "@/components/projects/project-list";
import { Setting } from "@/types/settings";
import { useEffect, useState } from "react";

export default function Home() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings`);
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSettings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      Loading...
    </div>;
  }

  const hasLLMKey = settings.some(
    setting => setting.key === 'openai_api_key' || setting.key === 'anthropic_api_key'
  );

  if (!hasLLMKey) {
    return <LLMSetup />;
  }

  return <ProjectList />;
}
