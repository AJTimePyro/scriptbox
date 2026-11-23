# Summary statistics and vector operations
scores <- c(88, 92, 79, 93, 85, 91, 74, 96, 82, 89)

cat("Input scores:", paste(scores, collapse = ", "), "\n")
cat("Sample size :", length(scores), "\n")
cat("Mean score  :", mean(scores), "\n")
cat("Median score:", median(scores), "\n")
cat("Std Dev     :", round(sd(scores), 2), "\n\n")

cat("Five-number summary:\n")
print(summary(scores))
