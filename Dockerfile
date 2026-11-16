# The published @portproof/mcp bundle as a local stdio MCP server, built from the GitHub release mirror
# (for MCP clients and directories that run servers in a container).
#
#   docker build -t portproof-mcp .
#   docker run -i --rm portproof-mcp                           # public tools only
#   docker run -i --rm -e PORTPROOF_API_KEY portproof-mcp      # passes the key from your shell environment
#
# No build step: dist/index.js is the published bundle; only its runtime dependencies are installed.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY LICENSE llms.txt ./
COPY dist/index.js dist/index.js
USER node
# stdio: keep stdin open (docker run -i). Without PORTPROOF_API_KEY only the public tools work:
# get_pricing, get_status, list_countries, search_inventory and quote.
CMD ["node", "dist/index.js"]
