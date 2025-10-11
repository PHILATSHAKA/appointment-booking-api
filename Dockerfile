# Use official Node.js LTS image
# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /apps/service

# Copy package files first (for caching layers)
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy built dist (must run `npm run build` before docker build)
COPY dist ./dist

# Expose port
EXPOSE 4000

# Run the built server
CMD ["node", "dist/src/app.js"]


# FROM node:22-alpine


# # Set working directory

# # Copy pnpm configuration as it uses JFrog registry proxy.
# COPY ./.npmrc /apps/service/.npmrc

# RUN cat /apps/service/.npmrc

# # Copy service source into container
# COPY /dist /apps/service/

# # Copy package files first (for caching)
# COPY /package.json /apps/service/package.json
# COPY /package-lock.json /apps/service/package-lock.json

# WORKDIR /apps/service

# RUN npm ci --omit=dev

# # Install dependencies
# #RUN npm install

# # Copy all source files
# #COPY . .

# # Build TypeScript
# # RUN npm run build   # make sure this outputs to /dist

# # Expose port
# EXPOSE 4000

# # Run the built server
# CMD ["node", "/apps/service/app.js"]
