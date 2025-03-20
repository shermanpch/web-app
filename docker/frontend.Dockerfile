FROM node:18-alpine

WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set working directory to frontend app
WORKDIR /app/apps/frontend

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"] 