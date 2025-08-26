# Postgres 16 with pgvector
FROM postgres:16

RUN apt-get update && apt-get install -y postgresql-server-dev-16 build-essential git curl && rm -rf /var/lib/apt/lists/*

# Install pgvector from source (works without internet? requires git)
RUN git clone https://github.com/pgvector/pgvector.git /tmp/pgvector \
  && cd /tmp/pgvector \
  && make \
  && make install \
  && rm -rf /tmp/pgvector

COPY docker/init.sql /docker-entrypoint-initdb.d/01-init.sql

