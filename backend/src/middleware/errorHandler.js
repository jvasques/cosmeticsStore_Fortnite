export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Erro inesperado";
  res.status(status).json({ error: message });
}