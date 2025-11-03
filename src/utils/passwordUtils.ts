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
  
  // Check basic requirements (must all be satisfied for score > 2)
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Collect feedback for missing basic requirements
  if (!hasMinLength) {
    feedback.push('auth.password_requirements.length');
  }
  if (!hasLowercase) {
    feedback.push('auth.password_requirements.lowercase');
  }
  if (!hasNumber) {
    feedback.push('auth.password_requirements.number');
  }
  if (!hasSpecial) {
    feedback.push('auth.password_requirements.special');
  }
  
  // Check if all 4 basic requirements are met
  const basicRequirementsMet = hasMinLength && hasLowercase && hasNumber && hasSpecial;
  
  if (!basicRequirementsMet) {
    // If basic requirements not met, cap score at 2 (Fair)
    let partialScore = 0;
    if (hasMinLength) partialScore += 0.5;
    if (hasLowercase) partialScore += 0.5;
    if (hasNumber) partialScore += 0.5;
    if (hasSpecial) partialScore += 0.5;
    
    score = Math.min(Math.floor(partialScore), 2);
  } else {
    // All basic requirements met - start at Good (3)
    score = 3;
    
    // Additional factors can now increase strength
    // Check for uppercase letters
    const hasUppercase = /[A-Z]/.test(password);
    if (hasUppercase) {
      score += 0.5;
    }
    
    // Check for longer length
    if (password.length >= 12) {
      score += 0.5;
    }
    
    // Cap at Strong (4)
    score = Math.min(Math.floor(score), 4);
  }
  
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
  'auth.password_requirements.number',
  'auth.password_requirements.special',
];
