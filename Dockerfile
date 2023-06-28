# Use an official Node runtime as the base image
FROM node:16

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json / yarn.lock file into the root directory of the app
COPY package*.json yarn.lock ./

# Install all dependencies
RUN yarn install --production

RUN npm run setup

RUN yarn build

# Bundle the source code inside the Docker image
COPY . .

# Start command to run your application
CMD ["yarn", "start"]
