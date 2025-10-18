import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { DatabaseServiceClient } from "../generated/database.client";

const transport = new GrpcWebFetchTransport({
  baseUrl: "http://localhost:8080",
});

export const databaseClient = new DatabaseServiceClient(transport);
