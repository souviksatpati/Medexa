#!/bin/bash
set -e
service postgresql start

sudo -u postgres psql -f /mnt/e/Medexa-New-Final/backend/scripts/init_db.sql || true

CONF=$(ls /etc/postgresql/*/main/postgresql.conf | head -n 1)
HBA=$(ls /etc/postgresql/*/main/pg_hba.conf | head -n 1)

sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$CONF"
echo "host all all 0.0.0.0/0 trust" >> "$HBA"
echo "host all all ::/0 trust" >> "$HBA"

service postgresql restart
echo "PostgreSQL setup complete and running!"
