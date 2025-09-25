import React from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxStars = 5, 
  size = 'md',
  showValue = false,
  className = ''
}) => {
  // Ensure rating is between 0 and maxStars * 2 (assuming rating is out of 10)
  const normalizedRating = Math.max(0, Math.min(rating, maxStars * 2));
  const filledStars = Math.ceil(normalizedRating / 2);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const starSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        {[...Array(maxStars)].map((_, idx: number) => (
          <svg
            key={idx}
            xmlns="http://www.w3.org/2000/svg"
            className={`${starSize} ${
              idx < filledStars ? 'text-[#fbb033]' : 'text-gray-400'
            }`}
            fill={idx < filledStars ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={idx < filledStars ? 0 : 1}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
            />
          </svg>
        ))}
      </div>
      {showValue && (
        <span className="ml-2 text-sm text-gray-400">
          {(normalizedRating / 2).toFixed(1)}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;