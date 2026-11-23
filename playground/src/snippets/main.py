# Compute Fibonacci sequence and statistics
def fibonacci(n: int) -> list[int]:
    seq = [0, 1]
    for _ in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print("Calculating Fibonacci sequence (10 terms):")
fib_series = fibonacci(10)
for i, num in enumerate(fib_series):
    print(f"  F({i}) = {num}")

print(f"Total terms: {len(fib_series)} | Sum: {sum(fib_series)}")
