import { ReactNode, Suspense } from 'react';
import { Panel } from '@/components/ui/panel';

export type LoadingSkeletonVariant = 'form' | 'compact' | 'detailed';

interface SuspenseWrapperProps {
  children: ReactNode;
  variant?: LoadingSkeletonVariant;
  fallback?: ReactNode;
}

/**
 * Default loading skeletons for different UI patterns
 */
export const LoadingSkeletons = {
  /**
   * Standard form loading skeleton with label, inputs and button
   */
  form: (
    <Panel>
      <div className="p-6">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-6 bg-gray-700 rounded-md w-1/3 mb-6"></div>
          <div className="h-10 bg-gray-800 rounded-md w-full mb-4"></div>
          <div className="h-10 bg-gray-800 rounded-md w-full mb-6"></div>
          <div className="h-10 bg-primary/30 rounded-md w-full"></div>
        </div>
      </div>
    </Panel>
  ),
  
  /**
   * Compact form with just a heading, one input and a button
   */
  compact: (
    <Panel>
      <div className="p-6">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-4 bg-gray-700 rounded-md w-3/4 mb-6"></div>
          <div className="h-10 bg-gray-800 rounded-md w-full mb-4"></div>
          <div className="h-10 bg-primary/30 rounded-md w-full"></div>
        </div>
      </div>
    </Panel>
  ),
  
  /**
   * Detailed form with multiple sections, labels and inputs
   */
  detailed: (
    <Panel>
      <div className="p-6">
        <div className="animate-pulse space-y-6 w-full">
          <div className="h-6 bg-gray-700 rounded-md w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-700 rounded-md w-1/4"></div>
            <div className="h-10 bg-gray-800 rounded-md w-full"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-700 rounded-md w-1/4"></div>
            <div className="h-10 bg-gray-800 rounded-md w-full"></div>
          </div>
          <div className="h-10 bg-primary/30 rounded-md w-full"></div>
        </div>
      </div>
    </Panel>
  ),
};

/**
 * SuspenseWrapper - A reusable component for wrapping content in Suspense with standard loading skeletons
 * 
 * @example
 * // Basic usage with default form skeleton
 * <SuspenseWrapper>
 *   <YourComponent />
 * </SuspenseWrapper>
 * 
 * @example
 * // With a specific skeleton variant
 * <SuspenseWrapper variant="compact">
 *   <YourComponent />
 * </SuspenseWrapper>
 * 
 * @example
 * // With custom fallback
 * <SuspenseWrapper fallback={<YourCustomSkeleton />}>
 *   <YourComponent />
 * </SuspenseWrapper>
 */
export function SuspenseWrapper({ 
  children, 
  variant = 'form',
  fallback 
}: SuspenseWrapperProps) {
  // Use the provided fallback or select from predefined skeletons
  const fallbackComponent = fallback || LoadingSkeletons[variant];
  
  return (
    <Suspense fallback={fallbackComponent}>
      {children}
    </Suspense>
  );
} 