FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist .
RUN npm install -g serve
EXPOSE 5173
CMD sh -c 'if [ -n "$VITE_API_URL" ]; then find /app -name "*.js" -exec sed -i "s|__API_URL__|$VITE_API_URL|g" {} +; fi && serve -s . -l $PORT'
