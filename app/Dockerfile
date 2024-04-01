FROM alpine:3.18 as builder

# generate a self-signed certificate to be used by nginx. 
# This is only for development purpose. In production, provide a valid certificate at runtime.
RUN apk add --no-cache openssl \
    && openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
    -subj "/C=SG/ST=State/L=City/O=Organization/CN=localhost" \
    -keyout /tmp/cert.key -out /tmp/cert.crt

# generate a strong Diffie-Hellman group
RUN openssl dhparam -dsaparam -out /tmp/dhparam.pem 4096

FROM nginxinc/nginx-unprivileged:stable-alpine3.18-slim

# required to support running in ecs with readonly root filesystem
USER root
RUN set -eux; chmod 777 /tmp
VOLUME ["/tmp"]

# revert to non-root nginx user
USER nginx

# remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# copy generated self-signed cert
COPY --from=builder --chown=nginx:root /tmp/cert.key /etc/nginx/ssl/default/cert.key
COPY --from=builder --chown=nginx:root /tmp/cert.crt /etc/nginx/ssl/default/cert.crt

# copy generated dhparam
COPY --from=builder --chown=nginx:root /tmp/dhparam.pem /etc/nginx/ssl/dhparam.pem

# copy nginx config
COPY --chown=nginx:root nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:root plugins.d /etc/nginx/plugins.d
COPY --chown=nginx:root sites-enabled.d /etc/nginx/sites-enabled.d

EXPOSE 8443
