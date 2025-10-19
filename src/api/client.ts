import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { DatabaseServiceClient } from "../generated/database.client";
import {
  ETCMeisaiServiceClient,
  DTakoUriageKeihiServiceClient,
  DTakoFerryRowsServiceClient,
  DTakoFerryRowsProdServiceClient,
  ETCMeisaiMappingServiceClient,
  DTakoRowsServiceClient,
  DTakoEventsServiceClient,
  CarsServiceClient,
  DriversServiceClient
} from "../generated/ryohi.client";
import { DownloadServiceClient } from "../generated/download.client";
import { DownloadBufferServiceClient } from "../generated/download_buffer.client";

const transport = new GrpcWebFetchTransport({
  baseUrl: "http://localhost:8080/api",  // desktop-serverのgRPC-Webエンドポイント
});

// Database Service
export const databaseClient = new DatabaseServiceClient(transport);

// Ryohi Services (db_service - Local DB)
export const etcMeisaiClient = new ETCMeisaiServiceClient(transport);
export const dtakoUriageKeihiClient = new DTakoUriageKeihiServiceClient(transport);
export const dtakoFerryRowsClient = new DTakoFerryRowsServiceClient(transport);
export const etcMeisaiMappingClient = new ETCMeisaiMappingServiceClient(transport);

// Production DB Services (Read-only)
export const dtakoFerryRowsProdClient = new DTakoFerryRowsProdServiceClient(transport); // 9,007 rows
export const dtakoRowsClient = new DTakoRowsServiceClient(transport); // 運行データ
export const dtakoEventsClient = new DTakoEventsServiceClient(transport); // イベント情報
export const carsClient = new CarsServiceClient(transport); // 車両マスタ - 529台
export const driversClient = new DriversServiceClient(transport); // ドライバーマスタ - 377名

// Download Services (etc_meisai_scraper)
export const downloadClient = new DownloadServiceClient(transport);
export const downloadBufferClient = new DownloadBufferServiceClient(transport);
