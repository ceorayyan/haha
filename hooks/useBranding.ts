import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface BrandingSettings {
  website_name: string;
  logo_url: string | null;
}

let cachedBranding: BrandingSettings | null = null;
let fetchPromise: Promise<BrandingSettings> | null = null;

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings | null>(cachedBranding);
  const [loading, setLoading] = useState(!cachedBranding);

  useEffect(() => {
    if (cachedBranding) {
      setBranding(cachedBranding);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = api.getSettings()
        .then((settings) => {
          const brandingData: BrandingSettings = {
            website_name: settings.website_name || 'Research Nexus',
            logo_url: settings.logo_url || '/logo-static.png',
          };
          cachedBranding = brandingData;
          return brandingData;
        })
        .catch((error) => {
          console.error('Failed to fetch branding:', error);
          const defaultBranding: BrandingSettings = {
            website_name: 'Research Nexus',
            logo_url: '/logo-static.png',
          };
          cachedBranding = defaultBranding;
          return defaultBranding;
        })
        .finally(() => {
          fetchPromise = null;
        });
    }

    fetchPromise.then((brandingData) => {
      setBranding(brandingData);
      setLoading(false);
    });
  }, []);

  return { branding, loading };
}
