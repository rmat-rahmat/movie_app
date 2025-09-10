import React from 'react';
import { useTranslation } from 'react-i18next';
import { checkPasswordStrength, PasswordStrength } from '@/utils/passwordUtils';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  showRequirements = true 
}) => {
  const { t } = useTranslation();
  const strength: PasswordStrength = checkPasswordStrength(password);
  
  if (!password) return null;
  
  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${strength.percentage}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: strength.color }}
        >
          {t(strength.label)}
        </span>
      </div>
      
      {/* Feedback */}
      {showRequirements && strength.feedback.length > 0 && (
        <div className="text-xs text-gray-400">
          <ul className="list-none space-y-1">
            {strength.feedback.map((item, index) => (
              <li key={index} className="flex items-center gap-1">
                <span className="text-red-400">•</span>
                {t(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
