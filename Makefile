.PHONY: proto clean

PROTO_OUT := src/generated
# Go modules paths
GOPATH := $(shell go env GOPATH)
DB_SERVICE_PROTO := $(GOPATH)/pkg/mod/github.com/yhonda-ohishi/db_service@v1.1.0/src/proto
SCRAPER_PROTO := $(GOPATH)/pkg/mod/github.com/yhonda-ohishi/etc_meisai_scraper@v0.0.22/src/proto
DESKTOP_SERVER_PROTO := ../desktop-server/proto

proto:
	@echo "Generating TypeScript from proto files..."
	@echo "  - db_service proto: $(DB_SERVICE_PROTO)"
	@echo "  - scraper proto: $(SCRAPER_PROTO)"
	@echo "  - desktop-server proto: $(DESKTOP_SERVER_PROTO)"
	@mkdir -p $(PROTO_OUT)
	protoc \
		--plugin=protoc-gen-ts=cmd /c "node node_modules/@protobuf-ts/plugin/bin/protoc-gen-ts" \
		--ts_opt=generate_dependencies,client_grpc1 \
		--ts_out=$(PROTO_OUT) \
		--proto_path=$(DB_SERVICE_PROTO) \
		--proto_path=$(SCRAPER_PROTO) \
		--proto_path=$(DESKTOP_SERVER_PROTO) \
		$(DB_SERVICE_PROTO)/ryohi.proto \
		$(SCRAPER_PROTO)/download.proto \
		$(SCRAPER_PROTO)/download_buffer.proto \
		$(DESKTOP_SERVER_PROTO)/database.proto
	@echo "✓ Proto files compiled successfully from Go modules!"

clean:
	rm -rf $(PROTO_OUT)/*
