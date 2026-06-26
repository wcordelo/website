if (import.meta.main) {
  const { startServer } = await import("./server.js");
  startServer();
}
