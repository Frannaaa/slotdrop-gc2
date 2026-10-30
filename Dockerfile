FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server ./server
COPY --chown=node:node public ./public
COPY --chown=node:node db ./db
COPY --chown=node:node tools/db-init.mjs ./tools/db-init.mjs
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]
