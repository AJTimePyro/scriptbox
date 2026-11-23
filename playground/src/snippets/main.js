// Sensor statistics and min/max from a reading set
const readings = [21.5, 23.0, 19.8, 25.4, 22.1, 24.6];

const sum = readings.reduce((total, value) => total + value, 0);
const average = sum / readings.length;
const sorted = [...readings].sort((a, b) => a - b);
const median = (sorted[2] + sorted[3]) / 2;

console.log("Sensor readings:", readings.join(", "));
console.log("Sample size:", readings.length);
console.log("Average :", average.toFixed(2));
console.log("Median  :", median.toFixed(2));
console.log("Min/Max :", sorted[0], "/", sorted[sorted.length - 1]);
