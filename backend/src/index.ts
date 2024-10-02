import express from "express";
import cors from "cors";


// Create a new express application
const app = express();
app.use(express.json());
app.use(cors());
// Define a route to handle GET requests at the root path ("/")
app.get("/", (req, res) => {
  // Send a JSON response with the message "Hello, World!"
  res.json({ message: "Hello, World!" });
});


// Define a route to handle POST requests at the "/api/echo" path
