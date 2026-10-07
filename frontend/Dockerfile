FROM node:20-slim

WORKDIR /app

# Install dependencies exactly as locked in package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
