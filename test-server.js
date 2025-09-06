// Simple test to check if the server can start
console.log("Testing server startup...");

try {
  const express = require("express");
  const cors = require("cors");
  const fs = require("fs");
  const path = require("path");
  
  console.log("All imports successful");
  
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  app.get("/test", (req, res) => {
    res.json({ message: "Server is working!" });
  });
  
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Test server listening on http://localhost:${PORT}`);
  });
  
} catch (error) {
  console.error("Error:", error);
}


