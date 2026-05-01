// Branding Configuration Management
import api from './api';

export interface BrandingConfig {
  websiteName: string;
  logoUrl: string | null;
  logoType: 'text' | 'image'; // 'text' for text-based logo, 'image' for image
}

const DEFAULT_BRANDING: BrandingConfig = {
  websiteName: 'StataNex.Ai',
  logoUrl: null,
  logoType: 'text',
};

const STORAGE_KEY = 'branding_config';
const CACHE_EXPIRY_KEY = 'branding_cache_expiry';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Fetch branding from API and cache in localStorage
export async function getBrandingConfig(): Promise<BrandingConfig> {
  if (typeof window === 'undefined') {
    return DEFAULT_BRANDING;
  }

  // Try to get from localStorage first
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (stored && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse branding config from cache:', error);
  }

  // If not in cache or expired, fetch from API
  try {
    const settings = await api.getSettings();
    const config: BrandingConfig = {
      websiteName: settings.website_name || 'StataNex.Ai',
      logoUrl: settings.logo_url || null,
      logoType: settings.logo_url ? 'image' : 'text',
    };
    
    // Cache in localStorage with expiry
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    } catch (e) {
      console.warn('Failed to cache branding config:', e);
    }
    
    return config;
  } catch (error) {
    console.error('Failed to fetch branding from API:', error);
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
