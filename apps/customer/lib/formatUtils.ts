/**
 * Format utilities for the Tabeza application
 */

// Number formatting with thousand separator
export const formatNumber = (num: number | string, decimals = 0): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Currency formatting with thousand separator and KSh prefix
export const formatCurrency = (amount: number | string, decimals = 0): string => {
  const formatted = formatNumber(amount, decimals);
  return `KSh ${formatted}`;
};

// Time formatting to digital format (HH:MM:SS)
export const formatDigitalTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Time formatting to MM:SS (for shorter durations)
export const formatTimeMMSS = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format duration from milliseconds to digital time
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  return formatDigitalTime(seconds);
};

// Format percentage with thousand separator
export const formatPercentage = (value: number | string, decimals = 1): string => {
  const formatted = formatNumber(value, decimals);
  return `${formatted}%`;
};

// Format large numbers with abbreviations (K, M, B)
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
};
