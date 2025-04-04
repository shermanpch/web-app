"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/table";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@ui/dialog";
import { UserReadingHistoryEntry } from "@/types/divination";
import Image from "next/image";

interface ReadingsTableProps {
  readings: UserReadingHistoryEntry[];
}

// Helper to format date (consider moving to a utils file)
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    // Use toLocaleString for user-friendly format based on locale
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium", // e.g., "Sep 9, 2023"
      timeStyle: "short", // e.g., "1:45 PM"
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return "Invalid Date";
  }
};

// Helper to calculate hexagram coordinates from reading numbers
const calculateHexagramCoordinates = (reading: UserReadingHistoryEntry) => {
  const parentCoord = `${reading.first_number % 8}-${reading.second_number % 8}`;
  const childCoord = `${reading.third_number % 6}`;
  return { parentCoord, childCoord };
};

export default function ReadingsTable({ readings }: ReadingsTableProps) {
  if (!readings || readings.length === 0) {
    // This case should ideally be handled by the parent component,
    // but adding a check here is safe.
    return <p>No readings found.</p>;
  }

  return (
    <Table>
      <TableCaption>A list of your past I Ching readings.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px] min-w-[180px]">Date</TableHead>
          <TableHead className="min-w-[200px]">Question</TableHead>
          <TableHead className="min-w-[200px]">Prediction Details</TableHead>
          <TableHead className="min-w-[200px]">Clarifying Question</TableHead>
          <TableHead className="min-w-[200px]">Clarifying Answer</TableHead>
          <TableHead className="text-right min-w-[100px]">Language</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {readings.map((reading) => {
          // Calculate hexagram coordinates for image fetching
          const { parentCoord, childCoord } = calculateHexagramCoordinates(reading);
          
          return (
            <TableRow key={reading.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {formatDate(reading.created_at)}
              </TableCell>
              <TableCell className="whitespace-normal">{reading.question || 'N/A'}</TableCell>
              <TableCell>
                {reading.prediction ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Prediction Details</DialogTitle>
                        <DialogDescription>
                          For your question: &quot;{reading.question}&quot;
                        </DialogDescription>
                      </DialogHeader>
                      {/* Structured Prediction Display */}
                      <div className="grid gap-4 py-4 text-sm">
                        <h4 className="font-semibold text-lg mb-2">Hexagram: {reading.prediction.hexagram_name || 'N/A'}</h4>
                        <div className="space-y-3">
                          <p><strong className="font-medium text-foreground">Summary:</strong> <span className="text-muted-foreground">{reading.prediction.summary || 'N/A'}</span></p>
                          <div>
                            <strong className="font-medium text-foreground block mb-1">Interpretation:</strong>
                            <p className="text-muted-foreground whitespace-pre-wrap">{reading.prediction.interpretation || 'N/A'}</p>
                          </div>
                          {reading.prediction.line_change && (
                            <div>
                              <strong className="font-medium text-foreground block mb-1">Changing Line ({reading.prediction.line_change.line || 'N/A'}):</strong>
                              <p className="text-muted-foreground whitespace-pre-wrap">{reading.prediction.line_change.interpretation || 'N/A'}</p>
                            </div>
                          )}
                          {reading.prediction.result && (
                            <div>
                              <strong className="font-medium text-foreground block mb-1">Resulting Hexagram ({reading.prediction.result.name || 'N/A'}):</strong>
                              <p className="text-muted-foreground whitespace-pre-wrap">{reading.prediction.result.interpretation || 'N/A'}</p>
                            </div>
                          )}
                          <div>
                            <strong className="font-medium text-foreground block mb-1">Advice:</strong>
                            <p className="text-muted-foreground whitespace-pre-wrap">{reading.prediction.advice || 'N/A'}</p>
                          </div>
                          {/* Use backend proxy for image loading instead of direct Supabase URL */}
                          <div className="mt-4 border-t pt-4">
                            <Image 
                              src={`/api/divination/iching-image?parent_coord=${parentCoord}&child_coord=${childCoord}`}
                              alt={`Hexagram ${reading.prediction.hexagram_name}`} 
                              width={300}
                              height={300}
                              className="rounded-md border max-w-xs mx-auto shadow-md" 
                              unoptimized={true}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Close
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className="text-sm text-muted-foreground italic">N/A</span>
                )}
              </TableCell>
              <TableCell className="whitespace-normal">{reading.clarifying_question || 'N/A'}</TableCell>
              <TableCell className="whitespace-normal">{reading.clarifying_answer || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{reading.language || 'N/A'}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
} 