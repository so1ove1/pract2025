import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Serve static files
app.use(express.static('.'));

// Handle all routes
app.get('*', (req, res) => {
  // Check if request is for an API endpoint
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // For all other routes, serve the index.html
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});