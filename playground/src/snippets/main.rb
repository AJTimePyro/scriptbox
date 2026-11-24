# Ruby idioms: blocks, hashes, methods, interpolation, and stdlib.

require "json"

def total(*numbers)
  numbers.sum
end

scores = { "alpha" => 3, "beta" => 5, "gamma" => 7 }

scores.each do |name, score|
  status = score > 5 ? "high" : "low"
  printf("%-6s %2d  %s\n", name, score, status)
end

puts "total: #{total(*scores.values)}"
puts JSON.generate(scores)
