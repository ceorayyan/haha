// Branding Configuration Management
export interface BrandingConfig {
  websiteName: string;
  logoUrl: string | null;
  logoType: 'text' | 'image'; // 'text' for text-based logo, 'image' for image
}

const DEFAULT_BRANDING: BrandingConfig = {
  websiteName: 'Research Nexus',
  logoUrl: null,
  logoType: 'text',
};

const STORAGE_KEY = 'branding_config';

// SIMPLIFIED: No API calls, just return cached or default branding
export async function getBrandingConfig(): Promise<BrandingConfig> {
  if (typeof window === 'undefined') {
    return DEFAULT_BRANDING;
  }

  // Try to get from localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse branding config:', error);
  }

  return DEFAULT_BRANDING;
}

export function setBrandingConfig(config: BrandingConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('brandingConfigChanged', { detail: config }));
  } catch (error) {
    console.error('Failed to save branding config:', error);
  }
}

export function getLogoInitial(websiteName: string): string {
  return websiteName.charAt(0).toUpperCase();
}

export async function updateWebsiteName(name: string): Promise<void> {
  const config = await getBrandingConfig();
  config.websiteName = name;
  setBrandingConfig(config);
}

export async function updateLogo(logoUrl: string | null, logoType: 'text' | 'image' = 'image'): Promise<void> {
  const config = await getBrandingConfig();
  config.logoUrl = logoUrl;
  config.logoType = logoType;
  setBrandingConfig(config);
}

export async function clearLogo(): Promise<void> {
  const config = await getBrandingConfig();
  config.logoUrl = null;
  config.logoType = 'text';
  setBrandingConfig(config);
}
