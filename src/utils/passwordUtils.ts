export interface PasswordStrength {
  score: number; // 0-4 (Very Weak, Weak, Fair, Good, Strong)
  label: string;
  color: string;
  percentage: number;
  feedback: string[];
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
  feedback.push('auth.password_requirements.length');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
  feedback.push('auth.password_requirements.lowercase');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
  feedback.push('auth.password_requirements.uppercase');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
  feedback.push('auth.password_requirements.number');
  }
  
  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
  feedback.push('auth.password_requirements.special');
  }
  
  // Additional length bonus
  if (password.length >= 12) {
    score += 1;
  }
  
  // Cap the score at 4
  score = Math.min(score, 4);
  
  const strengthLevels = [
  { label: 'auth.password_strength.very_weak', color: '#ef4444', percentage: 20 }, // red-500
  { label: 'auth.password_strength.weak', color: '#f97316', percentage: 40 },      // orange-500
  { label: 'auth.password_strength.fair', color: '#eab308', percentage: 60 },      // yellow-500
  { label: 'auth.password_strength.good', color: '#22c55e', percentage: 80 },      // green-500
  { label: 'auth.password_strength.strong', color: '#16a34a', percentage: 100 },   // green-600
  ];
  
  const currentLevel = strengthLevels[score] || strengthLevels[0];
  
  return {
    score,
    label: currentLevel.label,
    color: currentLevel.color,
    percentage: currentLevel.percentage,
    feedback: feedback.slice(0, 3), // Limit to 3 feedback items
  };
};

export const getPasswordRequirements = () => [
  'auth.password_requirements.length',
  'auth.password_requirements.lowercase',
  'auth.password_requirements.uppercase',
  'auth.password_requirements.number',
  'auth.password_requirements.special',
];
