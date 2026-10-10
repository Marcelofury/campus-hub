export function notFound(_request, response) {
  response.status(404).json({ error: "Route not found." });
}

export function errorHandler(error, _request, response, next) {
  console.error("Campus Hub API error:", error);
  void next;
  response.status(500).json({ error: "The campus service could not complete that request." });
}
