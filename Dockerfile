# ── Stage 1: Build Frontend (runs in PARALLEL with Stage 2) ──
FROM node:20-alpine AS fe-builder
WORKDIR /app/frontend
ENV NODE_OPTIONS="--max-old-space-size=1024"

COPY client/package*.json client/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps --no-audit --no-fund --loglevel error || npm install --legacy-peer-deps --no-audit --no-fund --loglevel error || npm install --no-audit --no-fund --loglevel error
COPY client/ .
RUN find . -name "*.sh" -exec chmod +x {} + 2>/dev/null || true
RUN chmod +x node_modules/.bin/* 2>/dev/null || true
ARG AES_SECRET_KEY=""
ENV AES_SECRET_KEY=$AES_SECRET_KEY
ARG CLIENT_URL=""
ENV CLIENT_URL=$CLIENT_URL
ARG CLOUDINARY_API_KEY=""
ENV CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET=""
ENV CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET
ARG CLOUDINARY_CLOUD_NAME=""
ENV CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME
ARG EMAIL_PASS=""
ENV EMAIL_PASS=$EMAIL_PASS
ARG EMAIL_USER=""
ENV EMAIL_USER=$EMAIL_USER
ARG ENCRYPTION_KEY=""
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ARG GEMINI_API_KEY=""
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ARG GOOGLE_CALLBACK_URL=""
ENV GOOGLE_CALLBACK_URL=$GOOGLE_CALLBACK_URL
ARG GOOGLE_CLIENT_ID=""
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET=""
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ARG GROQ_API_KEY=""
ENV GROQ_API_KEY=$GROQ_API_KEY
ARG JWT_EXPIRE=""
ENV JWT_EXPIRE=$JWT_EXPIRE
ARG JWT_SECRET=""
ENV JWT_SECRET=$JWT_SECRET
ARG MONGODB_URI=""
ENV MONGODB_URI=$MONGODB_URI
ARG OPENAI_API_KEY=""
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ARG RAZORPAY_KEY_ID=""
ENV RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
ARG RAZORPAY_KEY_SECRET=""
ENV RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
ARG TWILIO_ACCOUNT_SID=""
ENV TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
ARG TWILIO_AUTH_TOKEN=""
ENV TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
ARG TWILIO_PHONE_NUMBER=""
ENV TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ARG VITE_RAZORPAY_KEY_ID=""
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID
ARG VITE_SOCKET_URL=""
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ARG MONGO_URI=""
ENV MONGO_URI=$MONGO_URI
ARG NEWS_API_KEY=""
ENV NEWS_API_KEY=$NEWS_API_KEY
ARG VITE_FIREBASE_API_KEY=""
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_APP_ID=""
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_AUTH_DOMAIN=""
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=""
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_PROJECT_ID=""
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_VAPID_KEY=""
ENV VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY
ARG REACT_APP_API_URL=""
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN node -e " \
  const fs = require('fs'); \
  const files = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.cjs']; \
  for (const f of files) { \
    if (fs.existsSync(f)) { \
      let code = fs.readFileSync(f, 'utf8'); \
      if (!code.includes('reportCompressedSize')) { \
        code = code.replace(/plugins\\s*:\\s*\\[/, \'build: { minify: false, reportCompressedSize: false, sourcemap: false, rollupOptions: { maxParallelFileOps: 2, output: { manualChunks(id) { if (id.includes(\\'node_modules\\')) { if (id.includes(\\'recharts\\') || id.includes(\\'d3\\')) return \\'vendor-charts\\'; if (id.includes(\\'lucide-react\\')) return \\'vendor-icons\\'; if (id.includes(\\'firebase\\')) return \\'vendor-firebase\\'; return \\'vendor\\'; } } } } },\\n  plugins: [\'); \
        fs.writeFileSync(f, code); \
        console.log('SRE: Injected Vite memory optimizations'); \
      } \
      break; \
    } \
  } \
" 2>/dev/null || true
RUN npm run build || npx vite build

# ── Stage 2: Install & Build Backend (runs in PARALLEL with Stage 1) ──
FROM node:20-alpine AS be-builder
WORKDIR /app
# SRE Optimization: Force sequential execution under memory limits by copying from fe-builder stage
COPY --from=fe-builder /app/frontend/package*.json /tmp/dummy-fe-pkg.json

COPY server/package*.json server/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm install --legacy-peer-deps --no-audit --no-fund --loglevel error 2>/dev/null || npm install --no-audit --no-fund --loglevel error
COPY server/ .
RUN find . -name "*.sh" -exec chmod +x {} + 2>/dev/null || true
RUN chmod +x node_modules/.bin/* 2>/dev/null || true
RUN npm prune --production --no-audit --no-fund --loglevel error || true

# ── Stage 3: Final SRE container ──
FROM node:20-alpine
RUN apk add --no-cache curl nginx tini ca-certificates
RUN npm install -g pm2 --silent

WORKDIR /app
COPY --from=be-builder /app ./
COPY --from=fe-builder /app/frontend/dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html; \
    _LP_F=$(find /usr/share/nginx/html -name "index.html" 2>/dev/null | head -1); \
    if [ -z "$_LP_F" ]; then _LP_F=$(find /usr/share/nginx/html -name "*.html" 2>/dev/null | head -1); fi; \
    if [ -n "$_LP_F" ]; then MAIN_HTML=$(basename "$_LP_F"); else MAIN_HTML=""; fi; \
    if [ -z "$MAIN_HTML" ]; then \
        printf '%s' 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgICA8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CiAgICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+CiAgICA8dGl0bGU+V2VsY29tZSB0byBMYXVuY2hMaXZlPC90aXRsZT4KICAgIDxsaW5rIGhyZWY9Imh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9T3V0Zml0OndnaHRAMzAwOzQwMDs2MDA7ODAwJmRpc3BsYXk9c3dhcCIgcmVsPSJzdHlsZXNoZWV0Ij4KICAgIDxzdHlsZT4KICAgICAgICAqe2JveC1zaXppbmc6Ym9yZGVyLWJveDttYXJnaW46MDtwYWRkaW5nOjB9CiAgICAgICAgYm9keXtmb250LWZhbWlseTonT3V0Zml0JyxzYW5zLXNlcmlmO2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KDEzNWRlZywjMGYxNzJhIDAlLCMxZTFiNGIgMTAwJSk7Y29sb3I6I2Y4ZmFmYzttaW4taGVpZ2h0OjEwMHZoO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcn0KICAgICAgICAuY29udGFpbmVye21heC13aWR0aDo2MDBweDtwYWRkaW5nOjQwcHg7YmFja2dyb3VuZDpyZ2JhKDMwLDQxLDU5LDAuNyk7YmFja2Ryb3AtZmlsdGVyOmJsdXIoMTJweCk7Ym9yZGVyOjFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LDAuMSk7Ym9yZGVyLXJhZGl1czoyNHB4O3RleHQtYWxpZ246Y2VudGVyO2JveC1zaGFkb3c6MCAyMHB4IDUwcHggcmdiYSgwLDAsMCwwLjMpfQogICAgICAgIGgxe2ZvbnQtc2l6ZToyLjVyZW07Zm9udC13ZWlnaHQ6ODAwO21hcmdpbi1ib3R0b206MTZweDtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwjMzhiZGY4LCM4MThjZjgpOy13ZWJraXQtYmFja2dyb3VuZC1jbGlwOnRleHQ7LXdlYmtpdC10ZXh0LWZpbGwtY29sb3I6dHJhbnNwYXJlbnR9CiAgICAgICAgcHtjb2xvcjojOTRhM2I4O2ZvbnQtc2l6ZToxLjFyZW07bGluZS1oZWlnaHQ6MS42O21hcmdpbi1ib3R0b206MjRweH0KICAgICAgICAucm9ja2V0e2ZvbnQtc2l6ZTo0cmVtO21hcmdpbi1ib3R0b206MjBweDtkaXNwbGF5OmlubGluZS1ibG9jazthbmltYXRpb246ZmxvYXQgM3MgZWFzZS1pbi1vdXQgaW5maW5pdGV9CiAgICAgICAgLmluc3RydWN0aW9uc3tiYWNrZ3JvdW5kOnJnYmEoMTUsMjMsNDIsMC41KTtwYWRkaW5nOjIwcHg7Ym9yZGVyLXJhZGl1czoxMnB4O3RleHQtYWxpZ246bGVmdDttYXJnaW4tYm90dG9tOjI0cHg7Ym9yZGVyLWxlZnQ6NHB4IHNvbGlkICM4MThjZjh9CiAgICAgICAgLmluc3RydWN0aW9ucyBoM3tmb250LXNpemU6MXJlbTttYXJnaW4tYm90dG9tOjhweDtjb2xvcjojY2JkNWUxfQogICAgICAgIC5pbnN0cnVjdGlvbnMgY29kZXtmb250LWZhbWlseTptb25vc3BhY2U7Y29sb3I6IzM4YmRmODtiYWNrZ3JvdW5kOnJnYmEoNTYsMTg5LDI0OCwwLjEpO3BhZGRpbmc6MnB4IDZweDtib3JkZXItcmFkaXVzOjRweH0KICAgICAgICAuZm9vdGVye2NvbG9yOiM2NDc0OGI7Zm9udC1zaXplOjAuOXJlbX0KICAgICAgICBAa2V5ZnJhbWVzIGZsb2F0ezAlLDEwMCV7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoMCl9NTAle3RyYW5zZm9ybTp0cmFuc2xhdGVZKC0xMHB4KX19CiAgICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgogICAgPGRpdiBjbGFzcz0iY29udGFpbmVyIj4KICAgICAgICA8ZGl2IGNsYXNzPSJyb2NrZXQiPiYjeDFGNjgwOzwvZGl2PgogICAgICAgIDxoMT5Zb3VyIFNpdGUgaXMgTGl2ZSBvbiBMYXVuY2hMaXZlITwvaDE+CiAgICAgICAgPHA+WW91ciBjb250YWluZXIgZGVwbG95ZWQgc3VjY2Vzc2Z1bGx5LiBBZGQgYW4gPGNvZGU+aW5kZXguaHRtbDwvY29kZT4gdG8geW91ciByZXBvIGFuZCByZWRlcGxveSB0byBwdWJsaXNoIHlvdXIgY29udGVudC48L3A+CiAgICAgICAgPGRpdiBjbGFzcz0iaW5zdHJ1Y3Rpb25zIj4KICAgICAgICAgICAgPGgzPkhvdyB0byBwdWJsaXNoIHlvdXIgY29udGVudDo8L2gzPgogICAgICAgICAgICA8cCBzdHlsZT0iZm9udC1zaXplOjAuOTVyZW07bWFyZ2luLWJvdHRvbTowIj5BZGQgYW4gPGNvZGU+aW5kZXguaHRtbDwvY29kZT4gZmlsZSB0byB0aGUgcm9vdCBvZiB5b3VyIHJlcG9zaXRvcnkgYW5kIHRyaWdnZXIgYSByZWRlcGxveSBmcm9tIHlvdXIgTGF1bmNoTGl2ZSBkYXNoYm9hcmQuPC9wPgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImZvb3RlciI+UG93ZXJlZCBieSBMYXVuY2hMaXZlIFNlcnZlcmxlc3MgQ29udGFpbmVyczwvZGl2PgogICAgPC9kaXY+CjwvYm9keT4KPC9odG1sPg==' | base64 -d > /usr/share/nginx/html/index.html; \
        MAIN_HTML="index.html"; \
    fi; \
    mkdir -p /etc/nginx/http.d; \
    rm -f /etc/nginx/conf.d/default.conf; \
    printf '%s' 'c2VydmVyIHsKICAgIGxpc3RlbiAzMDAwOwogICAgcm9vdCAvdXNyL3NoYXJlL25naW54L2h0bWw7CiAgICBpbmRleCBNQUlOX0hUTUxfUExBQ0VIT0xERVI7CgogICAgYWRkX2hlYWRlciBYLUZyYW1lLU9wdGlvbnMgIlNBTUVPUklHSU4iIGFsd2F5czsKICAgIGFkZF9oZWFkZXIgWC1Db250ZW50LVR5cGUtT3B0aW9ucyAibm9zbmlmZiIgYWx3YXlzOwogICAgYWRkX2hlYWRlciBYLVhTUy1Qcm90ZWN0aW9uICIxOyBtb2RlPWJsb2NrIiBhbHdheXM7CiAgICBhZGRfaGVhZGVyIFJlZmVycmVyLVBvbGljeSAibm8tcmVmZXJyZXItd2hlbi1kb3duZ3JhZGUiIGFsd2F5czsKCiAgICBnemlwIG9uOwogICAgZ3ppcF92YXJ5IG9uOwogICAgZ3ppcF9wcm94aWVkIGFueTsKICAgIGd6aXBfY29tcF9sZXZlbCA2OwogICAgZ3ppcF9taW5fbGVuZ3RoIDI1NjsKICAgIGd6aXBfdHlwZXMgdGV4dC9wbGFpbiB0ZXh0L2NzcyBhcHBsaWNhdGlvbi9qc29uIGFwcGxpY2F0aW9uL2phdmFzY3JpcHQgdGV4dC94bWwgYXBwbGljYXRpb24veG1sK3JzcyBpbWFnZS9zdmcreG1sOwoKICAgIGxvY2F0aW9uIH4qIFwuKGpzfGNzc3xwbmd8anBnfGpwZWd8Z2lmfGljb3xzdmd8d29mZnx3b2ZmMnx0dGZ8ZW90KSQgewogICAgICAgIGV4cGlyZXMgMXk7CiAgICAgICAgYWRkX2hlYWRlciBDYWNoZS1Db250cm9sICJwdWJsaWMsIG5vLXRyYW5zZm9ybSI7CiAgICB9CiAgICBsb2NhdGlvbiAvYXBpLyB7CiAgICAgICAgcHJveHlfcGFzcyBodHRwOi8vMTI3LjAuMC4xOjQwMDA7CiAgICAgICAgcHJveHlfaHR0cF92ZXJzaW9uIDEuMTsKICAgICAgICBwcm94eV9zZXRfaGVhZGVyIFVwZ3JhZGUgJGh0dHBfdXBncmFkZTsKICAgICAgICBwcm94eV9zZXRfaGVhZGVyIENvbm5lY3Rpb24gdXBncmFkZTsKICAgICAgICBwcm94eV9zZXRfaGVhZGVyIEhvc3QgJGhvc3Q7CiAgICB9CiAgICBsb2NhdGlvbiAvc29ja2V0LmlvLyB7CiAgICAgICAgcHJveHlfcGFzcyBodHRwOi8vMTI3LjAuMC4xOjQwMDA7CiAgICAgICAgcHJveHlfaHR0cF92ZXJzaW9uIDEuMTsKICAgICAgICBwcm94eV9zZXRfaGVhZGVyIFVwZ3JhZGUgJGh0dHBfdXBncmFkZTsKICAgICAgICBwcm94eV9zZXRfaGVhZGVyIENvbm5lY3Rpb24gdXBncmFkZTsKICAgIH0KCiAgICBsb2NhdGlvbiAvIHsKICAgICAgICB0cnlfZmlsZXMgJHVyaSAkdXJpLyAkdXJpLmh0bWwgL01BSU5fSFRNTF9QTEFDRUhPTERFUjsKICAgIH0KfQ==' | base64 -d | sed "s|MAIN_HTML_PLACEHOLDER|$MAIN_HTML|g" > /etc/nginx/http.d/default.conf
ENV PORT=4000
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3000/ || exit 1
RUN printf '#!/bin/sh\nset -e\nln -sf /dev/stdout /var/log/nginx/access.log\nln -sf /dev/stderr /var/log/nginx/error.log\nnginx\npm2-runtime start server.js --name backend\n' > /app/start.sh && chmod +x /app/start.sh
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]