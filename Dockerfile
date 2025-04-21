# Step 1: Build the Angular app
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine

# Install envsubst (from gettext)
RUN apk add --no-cache gettext

# Copy built Angular app from the builder stage
COPY --from=builder /app/dist/leave_management_frontend /usr/share/nginx/html

# Copy custom nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the template env file
COPY ./src/assets/env.template.js /usr/share/nginx/html/assets/env.template.js

# Copy the entrypoint.sh script into the container
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entry point to run entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
