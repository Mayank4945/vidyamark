/**
 * Utility functions for common operations
 */

/**
 * Format percentage with 2 decimal places
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * Get grade based on percentage
 */
export const getGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
};

/**
 * Get grade color for display
 */
export const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return '#51cf66';
    case 'B+':
    case 'B':
      return '#4dabf7';
    case 'C+':
    case 'C':
      return '#ffd93d';
    case 'F':
      return '#ff6b6b';
    default:
      return '#999';
  }
};

/**
 * Format date
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Download file from blob
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Calculate average
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Format marks with validation
 */
export const formatMarks = (marks: number, maxMarks: number = 100): string => {
  if (marks > maxMarks) return 'Invalid';
  return `${marks}/${maxMarks}`;
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pass':
      return 'green';
    case 'fail':
      return 'red';
    case 'absent':
      return 'orange';
    default:
      return 'blue';
  }
};
