# Strategy: Pre-build on Host (Native Speed), then package the standalone runtime.
# This avoids QEMU crashing during 'next build' on Mac Silicon and keeps the final image small.

FROM node:20-bullseye-slim AS native-deps

WORKDIR /app

# Install only in the builder stage so we can regenerate Linux-native runtime binaries
# without shipping the full dependency tree in the final image.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY scripts/build/prepare-runtime-deps.sh ./scripts/build/prepare-runtime-deps.sh

RUN corepack enable && corepack prepare pnpm@8.14.0 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate
RUN sh ./scripts/build/prepare-runtime-deps.sh export /app/node_modules /runtime-deps
RUN rm -rf /root/.cache/prisma

FROM node:20-bullseye-slim

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the minimal standalone runtime emitted by Next.js.
COPY --chown=nextjs:nodejs .next-prod/standalone ./
COPY --chown=nextjs:nodejs .next-prod/static ./.next-prod/static
COPY --from=native-deps --chown=nextjs:nodejs /runtime-deps /runtime-deps
COPY --from=native-deps --chown=nextjs:nodejs /app/scripts/build/prepare-runtime-deps.sh /usr/local/bin/prepare-runtime-deps.sh

# Replace host-native binaries inside standalone's pnpm store with Linux-native runtime files.
RUN sh /usr/local/bin/prepare-runtime-deps.sh inject /app/node_modules /runtime-deps \
  && rm -rf /runtime-deps

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
