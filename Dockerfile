FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV VUE_APP_USE_CDN=false
ENV VUE_APP_TITLE=RAIOT
ENV VUE_APP_API_BASE_URL=/richard
RUN npm run build

FROM nginx:1.28-alpine
ENV TASK_API_UPSTREAM=task-api:8010
ENV JAVA_API_UPSTREAM=backend:8002
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
