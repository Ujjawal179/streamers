# Use the official Node.js image as a base
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for installing dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (e.g., TypeScript compilation and Prisma generation)
RUN npm run build

# Expose the port that your app will run on (default to 3000)
EXPOSE 3001

# Start the application
CMD ["npm", "run", "dev"]
