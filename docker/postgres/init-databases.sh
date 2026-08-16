#!/bin/bash
set -e

# Criar banco adicional para o microsserviço de faturamento (BillingService)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE korp_billing_db;
    GRANT ALL PRIVILEGES ON DATABASE korp_billing_db TO $POSTGRES_USER;
EOSQL
