FROM node:20-alpine AS builder
WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache git python3 make g++ sqlite-dev

# Copy package files
COPY package.json package-lock.json ./

# Force native rebuild
RUN npm install --ignore-scripts && npm rebuild better-sqlite3

# Copy remaining app files
COPY . .

# Build Next.js
RUN npm run build

# Final run stage
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src
COPY --from=builder /app/db ./db
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY ./data.db ./data.db

EXPOSE 4000
CMD ["npm", "start"]
