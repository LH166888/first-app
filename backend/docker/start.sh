#!/bin/bash
#
# 容器启动脚本（Render 用）。
# 关键顺序不能乱：
#   1. config:cache 必须在启动时做，不能烘进镜像 —— 它会把环境变量「固化」
#      进缓存文件，而镜像构建时还没有 Render 的 env。
#   2. migrate / db:seed 放在启动时，才能保证首次部署就把表建好。
#   3. 最后才起 Apache。
#
# 幂等性：migrate 只跑未执行的迁移；db:seed 内部用 upsert，
# 重复部署不会重复插入或报唯一键冲突。

set -euo pipefail

cd /var/www/html

echo "[start] 清理构建期可能残留的缓存..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Render 的 Secret File 挂在 /etc/secrets/ 下，属主 root、权限收紧，
# Apache 工作进程(www-data)读不到 → 运行时连库报 "failed loading cafile stream"。
# 启动脚本以 root 身份运行，这里把 CA 复制到 www-data 可读的 storage 目录并放开权限，
# 再让 MYSQL_ATTR_SSL_CA 指向复制后的路径（见 Render 环境变量）。
echo "[start] 复制 Aiven CA 证书到 www-data 可读目录..."
mkdir -p /var/www/html/storage/certs
cp /etc/secrets/aiven-ca.pem /var/www/html/storage/certs/aiven-ca.pem
chmod 644 /var/www/html/storage/certs/aiven-ca.pem

# 注意：不做 route:cache —— routes/api.php 的 /user 与 web.php 首页是闭包路由，
# route:cache 遇闭包会报「Unable to prepare route ... Uses Closure」，配合 set -e 会让容器启动崩溃。
# config:cache / view:cache 无此问题，正常生成。
echo "[start] 生成生产缓存（config / view）..."
php artisan config:cache
php artisan view:cache

echo "[start] 执行数据库迁移..."
php artisan migrate --force

echo "[start] 灌入车型种子数据（幂等 upsert）..."
php artisan db:seed --force

echo "[start] 启动 Apache（监听 80，Render 会转发 \$PORT 流量过来）..."
exec apache2-foreground
