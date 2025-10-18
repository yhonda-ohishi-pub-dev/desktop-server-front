import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { DatabaseServiceClient } from "../generated/database.client";
import {
  ETCMeisaiServiceClient,
  DTakoUriageKeihiServiceClient,
  DTakoFerryRowsServiceClient,
  ETCMeisaiMappingServiceClient
} from "../generated/ryohi.client";
import { DownloadServiceClient } from "../generated/download.client";
import { DownloadBufferServiceClient } from "../generated/download_buffer.client";

const transport = new GrpcWebFetchTransport({
  baseUrl: "http://localhost:8080",
});

// Database Service
export const databaseClient = new DatabaseServiceClient(transport);

// Ryohi Services (db_service)
export const etcMeisaiClient = new ETCMeisaiServiceClient(transport);
export const dtakoUriageKeihiClient = new DTakoUriageKeihiServiceClient(transport);
export const dtakoFerryRowsClient = new DTakoFerryRowsServiceClient(transport);
export const etcMeisaiMappingClient = new ETCMeisaiMappingServiceClient(transport);

// Download Services (etc_meisai_scraper)
export const downloadClient = new DownloadServiceClient(transport);
export const downloadBufferClient = new DownloadBufferServiceClient(transport);
