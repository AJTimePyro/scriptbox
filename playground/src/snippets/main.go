package main

import (
	"fmt"
	"sort"
)

type Reading struct {
	Label string
	Value float64
}

func main() {
	readings := []Reading{
		{"sensor-1", 21.5},
		{"sensor-2", 23.0},
		{"sensor-3", 19.8},
		{"sensor-4", 25.4},
		{"sensor-5", 22.1},
		{"sensor-6", 24.6},
	}

	values := make([]float64, 0, len(readings))
	sum := 0.0

	fmt.Println("Sensor readings (Go wasm):")
	for _, reading := range readings {
		sum += reading.Value
		values = append(values, reading.Value)
		fmt.Printf("  %s: %.1f C\n", reading.Label, reading.Value)
	}

	sort.Float64s(values)
	median := (values[2] + values[3]) / 2

	fmt.Printf("Sample size: %d\n", len(values))
	fmt.Printf("Average : %.2f C\n", sum/float64(len(values)))
	fmt.Printf("Median  : %.2f C\n", median)
	fmt.Printf("Min/Max : %.1f / %.1f C\n", values[0], values[len(values)-1])
}
