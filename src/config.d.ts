/** Type declarations for the vanilla-JS settings module (config.js). */

export interface DomainProfile {
  name: string;
  domain: string;
}

export interface PersonalBests {
  bestRatio: number;
  totalCompressions: number;
}

export function detectCurrentDomain(): string;
export function getDefaultDomain(): string;
export function getDomain(): string;
export function setDomain(domain: string): void;
export function clearDomain(): void;
export function hasCustomDomain(): boolean;
export function getDomainProfiles(): DomainProfile[];
export function addDomainProfile(name: string, domain: string): DomainProfile[];
export function removeDomainProfile(domain: string): DomainProfile[];
export function getErrorCorrectionLevel(): string;
export function setErrorCorrectionLevel(level: string): void;
export function getPersonalBests(): PersonalBests;
export function recordCompressionResult(originalLen: number, compressedLen: number): PersonalBests;
export function getTheme(): string;
export function setTheme(theme: string): void;
