"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Trash2, AlertTriangle } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
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

export default function ReadingsPage() {
  const [readings, setReadings] = useState<UserReadingHistoryEntry[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<
    UserReadingHistoryEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Delete dialogs state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadings();
  }, []);

  async function fetchReadings() {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUserReadings();
      setReadings(data);
      setFilteredReadings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load readings");
      console.error("Error fetching readings:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filter readings when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReadings(readings);
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = readings.filter(
      (reading) =>
        reading.question.toLowerCase().includes(lowercaseQuery) ||
        (reading.prediction?.hexagram_name || "")
          .toLowerCase()
          .includes(lowercaseQuery) ||
        (reading.clarifying_question || "")
          .toLowerCase()
          .includes(lowercaseQuery),
    );

    setFilteredReadings(filtered);
  }, [searchQuery, readings]);

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

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await userApi.deleteReading(readingToDelete);

      // Update state by removing the deleted reading
      setReadings((prevReadings) =>
        prevReadings.filter((r) => r.id !== readingToDelete),
      );

      // Close the dialog
      setShowDeleteDialog(false);
      setReadingToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete reading",
      );
      console.error("Error deleting reading:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Delete all readings
  const confirmDeleteAllReadings = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await userApi.deleteAllReadings();

      // Update state by clearing all readings
      setReadings([]);
      setFilteredReadings([]);

      // Close the dialog
      setShowDeleteAllDialog(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete all readings",
      );
      console.error("Error deleting all readings:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        {/* Centered title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 font-serif text-center">
          Your Reading History
        </h1>

        {/* Search Bar */}
        <div className="mb-4 mx-auto max-w-lg">
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
            />
          </div>
        </div>

        {/* Delete All button moved below search */}
        {readings.length > 0 && (
          <div className="flex justify-end mb-6">
            <Button
              variant="destructive"
              onClick={handleDeleteAllClick}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error loading readings</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              className="mt-2 bg-white hover:bg-gray-100"
              onClick={() => fetchReadings()}
            >
              Try Again
            </Button>
          </div>
        ) : readings.length === 0 ? (
          <div className="bg-[#EDE6D6] rounded-2xl p-8 text-center shadow-lg">
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
          <div className="bg-[#EDE6D6] rounded-2xl p-8 text-center shadow-lg">
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
          <div className="space-y-6">
            {filteredReadings
              .sort(
                (a, b) =>
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
                            Changing Line ({reading.prediction.line_change.line}
                            )
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
                            Resulting Hexagram ({reading.prediction.result.name}
                            )
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
                              Your Clarifying Question
                            </h4>
                            <p className="text-gray-700 font-serif mb-4 italic">
                              &ldquo;{reading.clarifying_question}&rdquo;
                            </p>

                            <h4 className="font-bold text-gray-800 font-serif mb-2">
                              Response
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
        )}
      </div>

      {/* Delete Single Reading Confirmation Dialog */}
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

          {deleteError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{deleteError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteReading}
              disabled={deleteLoading}
              className="ml-2 bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
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

      {/* Delete All Readings Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete All Readings
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <strong>all</strong> your I Ching
              readings? This action <strong>cannot</strong> be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{deleteError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={deleteLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAllReadings}
              disabled={deleteLoading}
              className="ml-2 bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
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
    </PageLayout>
  );
}
