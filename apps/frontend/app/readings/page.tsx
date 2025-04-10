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

export default function ReadingsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Fetch readings using React Query with pagination
  const {
    data: readings = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["userReadings", currentPage],
    queryFn: () =>
      userApi.getUserReadings({ page: currentPage, limit: pageSize }),
    staleTime: 1000 * 60 * 5, // 5 minutes - prevent frequent refetches
    refetchOnMount: false, // Don't refetch automatically on mount
  });

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
    if (!isFetching && readings.length === pageSize) {
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
        ) : readings.length === 0 && currentPage === 1 ? (
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
            <p className="text-gray-800 text-lg font-serif">
              No readings match your search.
            </p>
            <Button
              variant="outline"
              className="mt-4 bg-white hover:bg-gray-100 border-gray-300"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
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
                          <p className="text-sm text-gray-600">
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
                        {/* Keywords Section */}
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-800 font-serif">
                            Keywords
                          </h4>
                          <p className="text-gray-700 italic font-serif">
                            {reading.prediction.summary}
                          </p>
                        </div>

                        {/* Initial Interpretation Section */}
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-800 font-serif">
                            Initial Interpretation
                          </h4>
                          <p className="text-gray-700 font-serif">
                            The hexagram {reading.prediction.hexagram_name}{" "}
                            {reading.prediction.interpretation}
                          </p>
                        </div>

                        {/* Changing Line Section */}
                        {reading.prediction.line_change && (
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-800 font-serif">
                              Changing Line (
                              {reading.prediction.line_change.line})
                            </h4>
                            <p className="text-gray-700 font-serif">
                              {reading.prediction.line_change.interpretation}
                            </p>
                          </div>
                        )}

                        {/* Resulting Hexagram Section */}
                        {reading.prediction.result && (
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-800 font-serif">
                              Resulting Hexagram (
                              {reading.prediction.result.name})
                            </h4>
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

            {/* Pagination Controls */}
            <div className="flex justify-center items-center space-x-4 mt-8">
              <Button
                onClick={goToPreviousPage}
                disabled={currentPage === 1 || isLoading}
                className="bg-[#D8CDBA] hover:bg-[#C8BDA9] text-gray-800"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <span className="text-gray-200 font-serif">
                Page {currentPage}
              </span>
              <Button
                onClick={goToNextPage}
                disabled={readings.length < pageSize || isLoading}
                className="bg-[#D8CDBA] hover:bg-[#C8BDA9] text-gray-800"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Delete Confirmation Dialogs */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Delete Reading
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete this reading? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>

            {deleteReadingMutation.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  {(deleteReadingMutation.error as Error).message}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteReadingMutation.isPending}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteReading}
                disabled={deleteReadingMutation.isPending}
                className="ml-2 bg-red-600 hover:bg-red-700"
              >
                {deleteReadingMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showDeleteAllDialog}
          onOpenChange={setShowDeleteAllDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Delete All Readings
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete <strong>all</strong> your I
                Ching readings? This action <strong>cannot</strong> be undone.
              </DialogDescription>
            </DialogHeader>

            {deleteAllReadingsMutation.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  {(deleteAllReadingsMutation.error as Error).message}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllDialog(false)}
                disabled={deleteAllReadingsMutation.isPending}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAllReadings}
                disabled={deleteAllReadingsMutation.isPending}
                className="ml-2 bg-red-600 hover:bg-red-700"
              >
                {deleteAllReadingsMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete All"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ContentContainer>
    </PageLayout>
  );
}
