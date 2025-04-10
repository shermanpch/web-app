/**
 * Calculates parent and child coordinates from three input numbers
 */
export function calculateCoordsFromNumbers(
  n1: number,
  n2: number,
  n3: number,
): { parentCoord: string; childCoord: string } {
  return {
    parentCoord: `${n1 % 8}-${n2 % 8}`,
    childCoord: `${n3 % 6}`,
  };
}

/**
 * Maps a digit (0-7) to its corresponding trigram line pattern
 * Each trigram array is ordered from top to bottom:
 * [top line, middle line, bottom line]
 */
export function getTrigramLines(digit: number): ("solid" | "broken")[] {
  // Ensure the digit is within valid range and is a number
  const validDigit = !isNaN(digit) ? Math.abs(Math.floor(digit % 8)) : 0;

  const trigramMap: { [key: number]: ("solid" | "broken")[] } = {
    1: ["solid", "solid", "solid"], // ☰ Heaven
    2: ["broken", "solid", "solid"], // ☱ Lake
    3: ["solid", "broken", "solid"], // ☲ Fire
    4: ["broken", "broken", "solid"], // ☳ Thunder
    5: ["solid", "solid", "broken"], // ☴ Wind
    6: ["broken", "solid", "broken"], // ☵ Water
    7: ["solid", "broken", "broken"], // ☶ Mountain
    0: ["broken", "broken", "broken"], // ☷ Earth
  };

  return trigramMap[validDigit];
}

/**
 * Generates the initial hexagram lines from a parent coordinate
 * For parent coordinate "X-Y":
 * - X is the top trigram
 * - Y is the bottom trigram
 * Returns array of 6 lines ordered from bottom to top to match display order
 */
export function getInitialHexagramLines(
  parentCoord: string,
): ("solid" | "broken")[] {
  // Default lines if input is invalid
  const defaultLines: ("solid" | "broken")[] = Array(6).fill("broken");

  try {
    // Validate parent coordinate format
    if (!parentCoord || !parentCoord.includes("-")) {
      return defaultLines;
    }

    const [topDigitStr, bottomDigitStr] = parentCoord.split("-");
    const bottomDigit = parseInt(bottomDigitStr);
    const topDigit = parseInt(topDigitStr);

    // Check if both digits are valid numbers
    if (isNaN(bottomDigit) || isNaN(topDigit)) {
      return defaultLines;
    }

    const bottomTrigram = getTrigramLines(bottomDigit); // [top, middle, bottom] of bottom trigram
    const topTrigram = getTrigramLines(topDigit); // [top, middle, bottom] of top trigram

    // Verify both trigrams were generated successfully
    if (!bottomTrigram || !topTrigram) {
      return defaultLines;
    }

    // Combine trigrams in the correct order (bottom to top)
    // First reverse each trigram to get bottom-to-top order
    const reversedBottom = [...bottomTrigram].reverse(); // [bottom, middle, top] of bottom trigram
    const reversedTop = [...topTrigram].reverse(); // [bottom, middle, top] of top trigram

    // Then combine with bottom trigram first
    return [...reversedBottom, ...reversedTop];
  } catch (error) {
    console.error("Error generating initial hexagram lines:", error);
    return defaultLines;
  }
}

/**
 * Generates the final hexagram lines by modifying the initial lines based on the child coordinate
 */
export function getFinalHexagramLines(
  initialLines: ("solid" | "broken")[],
  childCoord: number,
): ("solid" | "broken")[] {
  try {
    // Validate inputs
    if (!Array.isArray(initialLines) || initialLines.length !== 6) {
      return Array(6).fill("broken");
    }

    const finalLines = [...initialLines];
    const validChildCoord = !isNaN(childCoord)
      ? Math.abs(Math.floor(childCoord % 6))
      : 0;

    const indexMap: { [key: number]: number } = {
      0: 5, // top line
      1: 0, // bottom line
      2: 1,
      3: 2,
      4: 3,
      5: 4,
    };

    const indexToChange = indexMap[validChildCoord];
    finalLines[indexToChange] =
      finalLines[indexToChange] === "solid" ? "broken" : "solid";

    return finalLines;
  } catch (error) {
    console.error("Error generating final hexagram lines:", error);
    return Array(6).fill("broken");
  }
}
