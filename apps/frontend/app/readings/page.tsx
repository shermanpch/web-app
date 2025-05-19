"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ContentContainer from "@/components/layout/ContentContainer";
import Heading from "@/components/ui/heading";
import { userApi } from "@/lib/api/endpoints/user";
import { UserReadingHistoryEntry } from "@/types/divination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  calculateCoordsFromNumbers,
  getInitialHexagramLines,
  getFinalHexagramLines,
} from "@/lib/divinationUtils";
import AnimatedHexagram from "@/components/divination/AnimatedHexagram";

export default function ReadingsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Fetch paginated readings for the current page
  const {
    data: paginatedData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["userReadings", currentPage],
    queryFn: () =>
      userApi.getUserReadings({ page: currentPage, limit: pageSize }),
    staleTime: 1000 * 60 * 5, // 5 minutes - prevent frequent refetches
    refetchOnMount: true, // Enable refetch on mount to get latest data
  });

  // Extract pagination info
  const totalPages = paginatedData?.total_pages || 0;
  const totalItems = paginatedData?.total_items || 0;
  
  // Memoize readings to ensure stable reference
  const readings = useMemo(() => paginatedData?.items || [], [paginatedData]);

  // Initialize filteredReadings with an empty array, not a state derived from readings
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Delete dialogs state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);

  // Calculate filtered readings directly in the component instead of using state
  const filteredReadings = useMemo(() => {
    if (!searchQuery.trim()) {
      return readings;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    return readings.filter(
      (reading: UserReadingHistoryEntry) =>
        reading.question.toLowerCase().includes(lowercaseQuery) ||
        (reading.prediction?.hexagram_name || "")
          .toLowerCase()
          .includes(lowercaseQuery) ||
        (reading.clarifying_question || "")
          .toLowerCase()
          .includes(lowercaseQuery),
    );
  }, [searchQuery, readings]);

  // Delete a single reading mutation
  const deleteReadingMutation = useMutation({
    mutationFn: userApi.deleteReading,
    onSuccess: () => {
      // Invalidate the readings query cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["userReadings"] });
      setShowDeleteDialog(false);
      setReadingToDelete(null);
    },
    onError: (err) => {
      console.error("Error deleting reading:", err);
    },
  });

  // Delete all readings mutation
  const deleteAllReadingsMutation = useMutation({
    mutationFn: userApi.deleteAllReadings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userReadings"] });
      setShowDeleteAllDialog(false);
    },
    onError: (err) => {
      console.error("Error deleting all readings:", err);
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedReadingId(expandedReadingId === id ? null : id);
  };

  // Show confirmation dialog for deleting a single reading
  const handleDeleteClick = (e: React.MouseEvent, readingId: string) => {
    e.stopPropagation(); // Prevent the card from expanding when clicking delete
    setReadingToDelete(readingId);
    setShowDeleteDialog(true);
  };

  // Show confirmation dialog for deleting all readings
  const handleDeleteAllClick = () => {
    if (readings.length === 0) return; // Don't show dialog if no readings
    setShowDeleteAllDialog(true);
  };

  // Delete a single reading
  const confirmDeleteReading = async () => {
    if (!readingToDelete) return;
    deleteReadingMutation.mutate(readingToDelete);
  };

  // Delete all readings
  const confirmDeleteAllReadings = async () => {
    deleteAllReadingsMutation.mutate();
  };

  // Handle pagination
  const goToNextPage = () => {
    if (!isFetching && currentPage < totalPages) {
      setCurrentPage((old) => old + 1);
    }
  };

  const goToPreviousPage = () => {
    setCurrentPage((old) => Math.max(old - 1, 1));
  };

  return (
    <PageLayout>
      <ContentContainer className="max-w-5xl">
        <Heading>Your Reading History</Heading>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <Input
              className="w-full py-2 pl-9 pr-4 bg-[#EDE6D6]/90 text-gray-800 rounded-full border-none placeholder:text-gray-500"
              placeholder="Search your readings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Delete All button moved below search */}
        {readings.length > 0 && (
          <div className="flex justify-end mt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteAllClick}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-gray-200 text-center mt-6">
            Loading your readings...
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-6">
            <p className="font-medium">Error loading readings</p>
            <p className="text-sm">{(error as Error).message}</p>
            <Button
              variant="outline"
              className="mt-2 bg-white hover:bg-gray-100"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : totalItems === 0 ? (
          <div className="bg-[#EDE6D6] rounded-2xl p-8 text-center shadow-lg mt-6">
            <p className="text-gray-800 text-lg font-serif">
              You haven&apos;t made any I Ching readings yet.
            </p>
            <Button
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => (window.location.href = "/try-now")}
            >
              Start Your First Reading
            </Button>
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="bg-[#EDE6D6] rounded-2xl p-8 text-center shadow-lg mt-6">
            {searchQuery.trim() ? (
              <>
                <p className="text-gray-800 text-lg font-serif">
                  No readings match your search.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 bg-white hover:bg-gray-100 border-gray-300 text-gray-800"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <p className="text-gray-800 text-lg font-serif">
                No readings found for the current page.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-6 mt-6">
              {filteredReadings
                .sort(
                  (a: UserReadingHistoryEntry, b: UserReadingHistoryEntry) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .map((reading) => (
                  <div
                    key={reading.id}
                    className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                      expandedReadingId === reading.id
                        ? "border border-amber-600/30"
                        : ""
                    }`}
                  >
                    {/* Reading Header - Always visible */}
                    <div
                      className={`p-6 cursor-pointer bg-[#EDE6D6] ${expandedReadingId === reading.id ? "border-b border-amber-600/20" : ""}`}
                    >
                      <div className="flex justify-between items-start">
                        <div
                          onClick={() => toggleExpand(reading.id)}
                          className="flex-grow"
                        >
                          <p className="text-sm text-gray-700">
                            {format(
                              new Date(reading.created_at),
                              "MMMM d, yyyy 'at' h:mm a",
                            )}
                          </p>
                          <h3 className="text-xl text-gray-800 font-serif font-medium mt-1">
                            {reading.prediction?.hexagram_name && (
                              <span className="font-bold mr-2">
                                {reading.prediction.hexagram_name}
                              </span>
                            )}
                            {reading.question}
                          </h3>
                        </div>
                        <div className="flex items-center">
                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2 text-gray-500 hover:text-red-600 hover:bg-transparent"
                            onClick={(e) => handleDeleteClick(e, reading.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>

                          {/* Expand/collapse button */}
                          <button
                            className="text-gray-700"
                            aria-label={
                              expandedReadingId === reading.id
                                ? "Collapse"
                                : "Expand"
                            }
                            onClick={() => toggleExpand(reading.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-6 w-6 transition-transform duration-300 ${expandedReadingId === reading.id ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedReadingId === reading.id && reading.prediction && (
                      <div className="bg-[#EDE6D6] p-6">
                        {/* Hexagram Animations Section */}
                        <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-8 md:space-x-12 space-y-6 sm:space-y-0 mb-6 border-b border-amber-600/20 pb-6">
                          {(() => {
                            const { parentCoord, childCoord } =
                              calculateCoordsFromNumbers(
                                reading.first_number,
                                reading.second_number,
                                reading.third_number,
                              );
                            const initialLines =
                              getInitialHexagramLines(parentCoord);
                            const finalLines = getFinalHexagramLines(
                              initialLines,
                              parseInt(childCoord),
                            );

                            return (
                              <>
                                <div className="text-center">
                                  <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto">
                                    <AnimatedHexagram lines={initialLines} />
                                  </div>
                                  <p className="text-gray-700 font-serif text-sm mt-1">
                                    Primary
                                  </p>
                                </div>

                                <div className="text-amber-700 text-3xl transform sm:rotate-0 rotate-90">
                                  →
                                </div>

                                <div className="text-center">
                                  <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto">
                                    <AnimatedHexagram lines={finalLines} />
                                  </div>
                                  <p className="text-gray-700 font-serif text-sm mt-1">
                                    Transformed
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Keywords Section */}
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-800 font-serif">
                            Summary
                          </h4>
                          <p className="text-gray-700 italic font-serif">
                            {reading.prediction.summary}
                          </p>
                        </div>

                        {/* Primary Interpretation Section */}
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-800 font-serif">
                            Primary Hexagram Interpretation
                          </h4>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 -mt-1">
                            <span className="text-gray-900 font-medium font-serif">{reading.prediction.hexagram_name}</span>
                            <span className="text-gray-700 italic font-serif">{reading.prediction.pinyin}</span>
                          </div>
                          <p className="text-gray-700 font-serif">
                            {reading.prediction.interpretation}
                          </p>
                        </div>

                        {/* Changing Line Section */}
                        {reading.prediction.line_change && (
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-800 font-serif">
                              Changing Line
                            </h4>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 -mt-1">
                              <span className="text-gray-900 font-medium font-serif">{reading.prediction.line_change.line}</span>
                              <span className="text-gray-700 italic font-serif">{reading.prediction.line_change.pinyin}</span>
                            </div>
                            <p className="text-gray-700 font-serif">
                              {reading.prediction.line_change.interpretation}
                            </p>
                          </div>
                        )}

                        {/* Transformed Hexagram Section */}
                        {reading.prediction.result && (
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-800 font-serif">
                              Transformed Hexagram
                            </h4>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 -mt-1">
                              <span className="text-gray-900 font-medium font-serif">{reading.prediction.result.name}</span>
                              <span className="text-gray-700 italic font-serif">{reading.prediction.result.pinyin || "dì shuǐ shī"}</span>
                            </div>
                            <p className="text-gray-700 font-serif">
                              {reading.prediction.result.interpretation}
                            </p>
                          </div>
                        )}

                        {/* Advice Section */}
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-800 font-serif">
                            Advice
                          </h4>
                          <p className="text-gray-700 font-serif">
                            {reading.prediction.advice}
                          </p>
                        </div>

                        {/* Deep Dive Details Section */}
                        {reading.mode === "deep_dive" && reading.prediction.deep_dive_details && (
                          <>
                            <hr className="my-6 border-amber-600/30" />
                            
                            <div className="mb-4">
                              <h4 className="font-bold text-gray-800 font-serif">
                                Deeper Insights: Primary Hexagram
                              </h4>
                              <p className="text-gray-700 font-serif">
                                {reading.prediction.deep_dive_details.expanded_primary_interpretation}
                              </p>
                            </div>
                            
                            <hr className="my-6 border-amber-600/30" />
                            
                            <div className="mb-4">
                              <h4 className="font-bold text-gray-800 font-serif">
                                Significance of the Changing Line
                              </h4>
                              <p className="text-gray-700 font-serif">
                                {reading.prediction.deep_dive_details.contextual_changing_line_interpretation}
                              </p>
                            </div>
                            
                            <hr className="my-6 border-amber-600/30" />
                            
                            <div className="mb-4">
                              <h4 className="font-bold text-gray-800 font-serif">
                                Deeper Insights: Transformed Hexagram
                              </h4>
                              <p className="text-gray-700 font-serif">
                                {reading.prediction.deep_dive_details.expanded_transformed_interpretation}
                              </p>
                            </div>
                            
                            <hr className="my-6 border-amber-600/30" />
                            
                            <div className="mb-4">
                              <h4 className="font-bold text-gray-800 font-serif">
                                Key Themes & Lessons
                              </h4>
                              <ul className="list-disc list-inside text-gray-700 font-serif pl-2 space-y-2">
                                {reading.prediction.deep_dive_details.thematic_connections.map((theme, index) => (
                                  <li key={index}>
                                    {theme}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <hr className="my-6 border-amber-600/30" />
                            
                            <div className="mb-4">
                              <h4 className="font-bold text-gray-800 font-serif">
                                Tailored Guidance & Reflections
                              </h4>
                              <p className="text-gray-700 font-serif">
                                {reading.prediction.deep_dive_details.actionable_insights_and_reflections}
                              </p>
                            </div>
                            
                            {reading.prediction.deep_dive_details.potential_pitfalls && (
                              <>
                                <hr className="my-6 border-amber-600/30" />
                                
                                <div className="mb-4">
                                  <h4 className="font-bold text-gray-800 font-serif">
                                    Potential Pitfalls to Consider
                                  </h4>
                                  <p className="text-gray-700 font-serif">
                                    {reading.prediction.deep_dive_details.potential_pitfalls}
                                  </p>
                                </div>
                              </>
                            )}
                            
                            {reading.prediction.deep_dive_details.key_strengths && (
                              <>
                                <hr className="my-6 border-amber-600/30" />
                                
                                <div className="mb-4">
                                  <h4 className="font-bold text-gray-800 font-serif">
                                    Key Strengths to Leverage
                                  </h4>
                                  <p className="text-gray-700 font-serif">
                                    {reading.prediction.deep_dive_details.key_strengths}
                                  </p>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* Clarifying Question Section */}
                        {reading.clarifying_question &&
                          reading.clarifying_answer && (
                            <div className="mt-6 pt-4 border-t border-amber-600/20">
                              <h4 className="font-bold text-gray-800 font-serif mb-2">
                                Clarification Question
                              </h4>
                              <p className="text-gray-700 font-serif mb-4">
                                {reading.clarifying_question}
                              </p>

                              <h4 className="font-bold text-gray-800 font-serif mb-2">
                                Clarification Answer
                              </h4>
                              <p className="text-gray-700 font-serif">
                                {reading.clarifying_answer}
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Pagination controls - only show if we have readings and not filtering */}
            {!isLoading && !error && totalItems > 0 && !searchQuery && (
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={isLoading || isFetching || currentPage <= 1}
                  className="bg-[#EDE6D6]/90 border-none hover:bg-[#E2D7C2] text-gray-800"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <span className="text-sm text-gray-200">
                  Page {currentPage}{totalPages > 0 ? ` of ${totalPages}` : ""}
                </span>

                <Button
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={isLoading || isFetching || currentPage >= totalPages}
                  className="bg-[#EDE6D6]/90 border-none hover:bg-[#E2D7C2] text-gray-800"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Delete Reading Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-[#EDE6D6] text-gray-800 p-6 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-serif font-medium">
                Delete Reading
              </DialogTitle>
              <DialogDescription className="text-gray-700 mt-2">
                Are you sure you want to delete this reading? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="bg-white hover:bg-gray-100 border-gray-300 text-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteReading}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteReadingMutation.isPending}
              >
                {deleteReadingMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete All Readings Confirmation Dialog */}
        <Dialog
          open={showDeleteAllDialog}
          onOpenChange={setShowDeleteAllDialog}
        >
          <DialogContent className="bg-[#EDE6D6] text-gray-800 p-6 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-serif font-medium flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                Delete All Readings
              </DialogTitle>
              <DialogDescription className="text-gray-700 mt-2">
                Are you sure you want to delete all your I Ching reading
                history? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllDialog(false)}
                className="bg-white hover:bg-gray-100 border-gray-300 text-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAllReadings}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteAllReadingsMutation.isPending}
              >
                {deleteAllReadingsMutation.isPending
                  ? "Deleting All..."
                  : "Delete All"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ContentContainer>
    </PageLayout>
  );
}
