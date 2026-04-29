import { useState } from 'react';

interface BrandingSettings {
  website_name: string;
  logo_url: string | null;
}

const DEFAULT_BRANDING: BrandingSettings = {
  website_name: 'Research Nexus',
  logo_url: '/logo-static.png',
};

// Temporarily disable API fetch to stop reload loop
export function useBranding() {
  const [branding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading] = useState(false);

  // TODO: Re-enable API fetch after fixing the reload loop
  // For now, just return default branding

  return { branding, loading };
}
