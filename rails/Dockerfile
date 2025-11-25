#
# NOTE: This Dockerfile is used for building ALL dev and prod images
#
# It utilizes Docker's multi-stage build to handle dependencies.
# Adjust with caution!
#

# == Development Image
#
# Also used as the base for building assets for prod images.
ARG RUBY_BASE_IMAGE="ruby:3.2.4-alpine3.19"
FROM ${RUBY_BASE_IMAGE} as devcore

RUN if command -v apk >/dev/null; then \
      apk --no-cache add --update \
        build-base \
        linux-headers \
        less \
        nodejs \
        python3 \
        yarn \
        tzdata \
        postgresql-dev \
        postgresql-client \
        postgresql \
        libffi-dev \
        libxml2-dev \
        libxslt-dev \
        libc6-compat \
        vips \
        ffmpeg \
        poppler; \
    else \
      apt-get update && \
      apt-get install -y --no-install-recommends \
        build-essential \
        git \
        less \
        nodejs \
        npm \
        python3 \
        tzdata \
        libpq-dev \
        libffi-dev \
        libxml2-dev \
        libxslt1-dev \
        libvips \
        ffmpeg \
        poppler-utils \
        iproute2 && \
      npm install -g yarn && \
      rm -rf /var/lib/apt/lists/*; \
    fi && \
    gem install bundler --no-document --force -v '~> 2.4.7'

WORKDIR /tmp

COPY rails/Gemfile* /tmp/
RUN bundle config set --local path /usr/local/bundle && \
    bundle config set --local retry 5 && \
    bundle config build.nokogiri --use-system-libraries && \
    bundle install --retry=5

WORKDIR /api

# == Transient step for building assets
FROM devcore as builder

COPY ./rails /api

# So we can build assets for prod with dev dependencies
RUN bin/rake assets:precompile

# == Final Production Image
#
# Start from base Ruby image so we can keep image size slim
# Final image can be used for online or offline mode.
ARG RUBY_BASE_IMAGE
FROM ${RUBY_BASE_IMAGE} as prod

EXPOSE 3000

ENV RAILS_ENV="production" \
    AUTO_RUN_MIGRATIONS=on \
    DATABASE_URL=""

RUN if command -v apk >/dev/null; then \
      apk --no-cache add \
        tzdata \
        postgresql-client \
        nodejs \
        libffi \
        libxml2 \
        libxslt \
        libc6-compat \
        vips \
        ffmpeg \
        poppler; \
    else \
      apt-get update && \
      apt-get install -y --no-install-recommends \
        tzdata \
        postgresql-client \
        nodejs \
        npm \
        libffi8 \
        libffi-dev \
        libxml2 \
        libxslt1.1 \
        libvips \
        ffmpeg \
        poppler-utils \
        iproute2 && \
      npm install -g yarn && \
      rm -rf /var/lib/apt/lists/*; \
    fi && \
    gem install bundler --no-document --force

# Set deployment to true, bundled to vendor/bundle
RUN bundle config set deployment 'true'

# Copy sourcecode
COPY ./rails /api

# Copy in bundled gems from devcore
COPY --from=devcore /usr/local/bundle /api/vendor/bundle
# Copy in precompiled assets from build
COPY --from=builder /api/public/assets /api/public/assets
COPY --from=builder /api/public/packs /api/public/packs

WORKDIR /api

CMD ["scripts/server"]
