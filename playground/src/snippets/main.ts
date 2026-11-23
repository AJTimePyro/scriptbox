// Typed sensor records with summary statistics
interface Reading {
  label: string;
  value: number;
}

const readings: Reading[] = [
  { label: "sensor-1", value: 21.5 },
  { label: "sensor-2", value: 23.0 },
  { label: "sensor-3", value: 19.8 },
  { label: "sensor-4", value: 25.4 },
];

const values: number[] = readings.map((reading) => reading.value);
const average: number = values.reduce((sum, value) => sum + value, 0) / values.length;
const peak: Reading = readings.reduce((best, reading) =>
  reading.value > best.value ? reading : best
);

console.log("Sensor readings:");
readings.forEach((reading) => console.log(`  ${reading.label}: ${reading.value.toFixed(1)} C`));
console.log(`Average: ${average.toFixed(2)} C`);
console.log(`Peak: ${peak.label} at ${peak.value.toFixed(1)} C`);
