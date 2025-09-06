import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  showTotal?: boolean;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  onRatingChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  totalReviews,
  showTotal = true,
  size = "md",
  readonly = true,
  onRatingChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="flex items-center" data-testid="star-rating">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rating;
          const halfFilled = star - 0.5 <= rating && star > rating;
          
          return (
            <button
              key={star}
              type="button"
              className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
              onClick={() => handleStarClick(star)}
              disabled={readonly}
              data-testid={`star-${star}`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : halfFilled
                    ? "fill-yellow-400/50 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            </button>
          );
        })}
      </div>
      
      {showTotal && (
        <div className="ml-2 text-sm text-muted-foreground" data-testid="rating-summary">
          <span className="font-medium" data-testid="rating-value">
            {rating.toFixed(1)}
          </span>
          {totalReviews !== undefined && (
            <span className="ml-1" data-testid="total-reviews">
              ({totalReviews} {totalReviews === 1 ? "avaliação" : "avaliações"})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
