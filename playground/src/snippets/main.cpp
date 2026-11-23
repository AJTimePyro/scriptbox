#include <iostream>
#include <vector>
#include <iomanip>

int main() {
    std::vector<double> readings = {21.5, 23.0, 19.8, 25.4, 22.1, 24.6};
    std::cout << "Sensor readings (C++ wasm):\n";

    double sum = 0.0;
    for (size_t i = 0; i < readings.size(); ++i) {
        sum += readings[i];
        std::cout << "  sensor[" << i << "] = " << readings[i] << " C\n";
    }

    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Average: " << (sum / readings.size()) << " C\n";
    return 0;
}
