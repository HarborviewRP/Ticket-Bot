# Use an official Node runtime as the base image
FROM node:16

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json / yarn.lock file into the root directory of the app
COPY package*.json yarn.lock ./

# Install all dependencies
RUN yarn install --production

# Bundle the source code inside the Docker image
COPY . .

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN yarn build

# Start command to run your application
CMD ["yarn", "start"]