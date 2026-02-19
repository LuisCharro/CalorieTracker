import Link from 'next/link';
import { Button, Card } from '../shared/components';
import { Layout } from '../shared/layout';

export default function LandingPage() {
  return (
    <Layout maxWidth="full">
      <div className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <header className="border-b border-neutral-200 bg-white">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-neutral-900">CalorieTracker</span>
              </div>
              <nav className="hidden sm:flex items-center gap-6">
                <Link href="/features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                  Features
                </Link>
                <Link href="/privacy" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                  Privacy
                </Link>
                <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                  Log In
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up Free</Button>
                </Link>
              </nav>
              <div className="flex sm:hidden items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="outline">Log In</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <main className="flex-1">
          <section className="bg-gradient-to-b from-primary-50 to-white py-20 sm:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
                  Track Your Nutrition,
                  <span className="text-primary-600"> Own Your Data</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-neutral-600">
                  A simple, privacy-focused calorie tracker that puts you in control.
                  Log meals, track progress, and achieve your health goals—without compromising your data.
                </p>
                <div className="mt-10 flex items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg">Get Started Free</Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline">Log In</Button>
                  </Link>
                </div>
                <p className="mt-4 text-sm text-neutral-500">
                  No credit card required • GDPR compliant • Privacy first
                </p>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold text-neutral-900">
                  Everything You Need, Nothing You Don't
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  Focused features for effective nutrition tracking
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Easy Food Logging</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Quick text input to log meals. No tedious searching through databases.
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Goal Tracking</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Set calorie goals and track your progress with intuitive dashboards.
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Privacy First</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Your data stays yours. GDPR compliant with full export and deletion rights.
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Lightning Fast</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Local-first architecture means instant loading and offline capability.
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Data Ownership</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Export your data anytime. Delete your account permanently if you choose.
                  </p>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">100% Free</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    No subscriptions, no hidden fees, no ads. Just simple tracking.
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-primary-600 py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold text-white">
                  Ready to Take Control of Your Nutrition?
                </h2>
                <p className="mt-4 text-lg text-primary-100">
                  Join thousands of users who trust CalorieTracker for their health journey.
                </p>
                <div className="mt-10">
                  <Link href="/signup">
                    <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200 bg-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-neutral-900">CalorieTracker</span>
                </div>
                <p className="text-sm text-neutral-600">
                  Simple, privacy-focused nutrition tracking for a healthier you.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li><Link href="/features" className="hover:text-neutral-900">Features</Link></li>
                  <li><Link href="/privacy" className="hover:text-neutral-900">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-neutral-900">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">Account</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li><Link href="/login" className="hover:text-neutral-900">Log In</Link></li>
                  <li><Link href="/signup" className="hover:text-neutral-900">Sign Up</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li><Link href="/privacy" className="hover:text-neutral-900">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-neutral-900">Terms of Service</Link></li>
                  <li><Link href="/gdpr" className="hover:text-neutral-900">GDPR Rights</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
              <p>&copy; 2024 CalorieTracker. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}
