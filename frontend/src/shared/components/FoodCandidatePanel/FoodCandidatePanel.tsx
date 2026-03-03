'use client';

import { useState, useEffect } from 'react';
import { foodHistoryService, type FoodSuggestion, type SuggestionsResponse } from '../../../core/api/services';

export interface FoodCandidate {
  food_name: string;
  brand_name: string | null;
  quantity: number;
  unit: string;
  nutrition: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
  };
  meal_type?: string;
}

export interface FoodCandidatePanelProps {
  userId: string;
  mealType: string;
  onSelect: (food: FoodCandidate) => void;
}

export const FoodCandidatePanel: React.FC<FoodCandidatePanelProps> = ({
  userId,
  mealType,
  onSelect,
}) => {
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodSuggestion[]>([]);
  const [popularFoods, setPopularFoods] = useState<FoodSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'recent' | 'popular'>('suggestions');

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const [suggestionsData, recentData, popularData] = await Promise.all([
          foodHistoryService.getSuggestions(userId),
          foodHistoryService.getRecent(userId, 10),
          foodHistoryService.getPopular(userId, 10),
        ]);
        
        setSuggestions(suggestionsData.suggestions || []);
        setRecentFoods(recentData.map(item => ({
          food_name: item.food_name,
          brand_name: item.brand_name,
          avg_quantity: item.quantity,
          unit: item.unit,
          nutrition: item.nutrition,
          log_count: 1,
          last_logged: item.logged_at,
        })));
        setPopularFoods(popularData);
      } catch (error) {
        console.error('Failed to load food candidates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const getCurrentFoods = () => {
    switch (activeTab) {
      case 'suggestions':
        return suggestions;
      case 'recent':
        return recentFoods;
      case 'popular':
        return popularFoods;
      default:
        return [];
    }
  };

  const handleSelect = (food: FoodSuggestion) => {
    onSelect({
      food_name: food.food_name,
      brand_name: food.brand_name,
      quantity: food.avg_quantity || 100,
      unit: food.unit || 'g',
      nutrition: food.nutrition as FoodCandidate['nutrition'],
      meal_type: mealType,
    });
  };

  const getCalories = (food: FoodSuggestion): number => {
    const nutrition = food.nutrition as { calories?: number } | undefined;
    return nutrition?.calories || 0;
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-pulse flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-32 h-16 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentFoods = getCurrentFoods();

  return (
    <div className="mb-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'suggestions'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          💡 For You
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'recent'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          🕐 Recent
        </button>
        <button
          onClick={() => setActiveTab('popular')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'popular'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          ⭐ Favorites
        </button>
      </div>

      {/* Food Chips */}
      {currentFoods.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-4">
          No suggestions yet. Start logging foods!
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {currentFoods.map((food, index) => (
            <button
              key={`${food.food_name}-${index}`}
              onClick={() => handleSelect(food)}
              className="flex-shrink-0 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-left hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/10 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-2 min-w-[120px]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-900 truncate">
                    {food.food_name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {getCalories(food)} kcal • {Math.round(food.avg_quantity || 0)}{food.unit}
                  </div>
                </div>
                <span className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  +
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodCandidatePanel;
