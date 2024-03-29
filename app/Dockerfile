FROM nginxinc/nginx-unprivileged:stable-alpine3.18-slim

# required to support running in ecs with readonly root filesystem
USER root
RUN set -eux; chmod 777 /tmp
VOLUME ["/tmp"]

# revert to non-root nginx user
USER nginx
