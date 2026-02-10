import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`   Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   Login:    POST http://localhost:${PORT}/api/auth/login`);
});
