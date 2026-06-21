# Use an official Node runtime as a parent image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# In a pure Express app, there's no build step, but this allows us to prune dev dependencies
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source code from builder
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/scripts ./scripts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port the app runs on
EXPOSE 5000

# Run the application
CMD ["npm", "start"]
