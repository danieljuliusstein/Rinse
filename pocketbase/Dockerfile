FROM alpine:3.20

ARG PB_VERSION=0.39.1

RUN apk add --no-cache ca-certificates wget unzip \
  && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O /tmp/pb.zip \
  && unzip /tmp/pb.zip -d /pb \
  && rm /tmp/pb.zip \
  && chmod +x /pb/pocketbase

COPY pb_hooks /pb/pb_hooks
COPY pb_migrations /pb/pb_migrations

WORKDIR /pb

VOLUME ["/pb/pb_data"]

EXPOSE 8080

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data", "--hooksDir=/pb/pb_hooks", "--migrationsDir=/pb/pb_migrations"]
