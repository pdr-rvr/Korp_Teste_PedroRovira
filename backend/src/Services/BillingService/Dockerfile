# Stage 1: Base runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Stage 2: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/BuildingBlocks/BuildingBlocks.Common/BuildingBlocks.Common.csproj", "src/BuildingBlocks/BuildingBlocks.Common/"]
COPY ["src/Services/BillingService/BillingService.csproj", "src/Services/BillingService/"]

RUN dotnet restore "src/Services/BillingService/BillingService.csproj"

COPY . .
WORKDIR "/src/src/Services/BillingService"
RUN dotnet build "BillingService.csproj" -c Release -o /app/build

# Stage 3: Publish
FROM build AS publish
RUN dotnet publish "BillingService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Final runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BillingService.dll"]
