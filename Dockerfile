# Use a compatible base image for your Mac architecture
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of the app
COPY . .

CMD ["npm", "start"]
