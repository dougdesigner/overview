// Test the percentage formatting logic

// Format percentage: show integers without decimals, non-integers with up to 2 decimal places
const formatPercentage = (value) => {
  // Check if the value is effectively an integer (within floating point precision)
  if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.0001) {
    return Math.round(value).toString()
  }
  // For non-integers, use up to 2 decimal places and remove trailing zeros
  return value.toFixed(2).replace(/\.?0+$/, '')
}

// Test cases
const testCases = [
  { input: 40, expected: "40" },
  { input: 33.333333, expected: "33.33" },
  { input: 33.5, expected: "33.5" },
  { input: 33.50, expected: "33.5" },
  { input: 0.1, expected: "0.1" },
  { input: 0.12, expected: "0.12" },
  { input: 0.123, expected: "0.12" },
  { input: 100, expected: "100" },
  { input: 99.99999, expected: "100" }, // Close to integer
  { input: 12.00001, expected: "12" }, // Close to integer
  { input: 25.25, expected: "25.25" },
  { input: 25.20, expected: "25.2" },
]

console.log("Testing percentage formatting:")
console.log("=============================")

testCases.forEach(({ input, expected }) => {
  const result = formatPercentage(input)
  const passed = result === expected
  console.log(
    `${passed ? "✓" : "✗"} ${input} → "${result}"${
      passed ? "" : ` (expected "${expected}")`
    }`
  )
})

console.log("\nAll tests completed!")