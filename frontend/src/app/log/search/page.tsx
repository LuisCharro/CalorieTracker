'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardBody } from '../../../shared/components';
import { Layout, Header, Navigation } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { RouteGuard } from '../../../core/auth/routeGuard';

interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export default function LogSearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mockSearchResults: FoodSearchResult[] = [
    { id: '1', name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
    { id: '2', name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: '1 cup cooked' },
    { id: '3', name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingSize: '1 cup' },
    { id: '4', name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, servingSize: '170g' },
    { id: '5', name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g' },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Mock search - in production, this would call a food API
      await new Promise(resolve => setTimeout(resolve, 500));
      const filtered = mockSearchResults.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered.length > 0 ? filtered : mockSearchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFood = (food: FoodSearchResult) => {
    router.push(`/log/confirm?foodId=${food.id}&foodName=${encodeURIComponent(food.name)}&calories=${food.calories}&protein=${food.protein}&carbs=${food.carbs}&fat=${food.fat}`);
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="lg">
        <div className="min-h-screen pb-24">
          <Header title="Search Food" />

          <Card className="mb-6">
            <CardBody>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="search"
                    placeholder="Search for a food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} isLoading={isLoading}>
                  Search
                </Button>
              </div>
            </CardBody>
          </Card>

          {results.length > 0 ? (
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Search Results
                </h3>
                <div className="space-y-3">
                  {results.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="w-full rounded-lg border border-neutral-200 p-4 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-neutral-900">{food.name}</div>
                          {food.brand && (
                            <div className="text-sm text-neutral-500">{food.brand}</div>
                          )}
                          <div className="text-xs text-neutral-400 mt-1">
                            {food.servingSize}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary-600">{food.calories} cal</div>
                          <div className="text-xs text-neutral-500">
                            P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <p>Search for a food to get started</p>
            </div>
          )}
        </div>

        <Navigation
          items={[
            { label: 'Today', href: '/today', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
            { label: 'Log', href: '/log', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
            { label: 'History', href: '/history', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { label: 'Settings', href: '/settings/profile', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
          ]}
          activePath="/log"
        />
      </Layout>
    </RouteGuard>
  );
}
