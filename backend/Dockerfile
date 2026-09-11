# syntax=docker/dockerfile:1
#
# 车帮后端生产镜像（Render 部署用）
# 多阶段构建：先用 composer 官方镜像装依赖，再把 vendor 拷进运行时镜像，
# 避免在运行时镜像里装 Composer 与编译工具，镜像更小。
#
# 目标环境：Render Web Service（Docker 环境）
#   - Render 会把宿主机的 $PORT 映射到容器内 80 端口（见 docker/apache.conf）
#   - 容器无状态：数据在 Aiven MySQL，文件系统临时

# ---------- 阶段 1：安装 PHP 依赖 ----------
FROM composer:2 AS vendor

WORKDIR /app

# 只拷依赖清单，让这一层能被 Docker 缓存复用
COPY composer.json composer.lock ./

# --no-scripts：此时 artisan 还不在（Laravel 的 post-autoload-dump 会跑 artisan，
# 而 artisan 需要完整代码树），脚本留到运行时执行
RUN composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --prefer-dist \
        --optimize-autoloader \
        --no-scripts

# ---------- 阶段 2：运行时镜像 ----------
FROM php:8.2-apache

# PHP 扩展：pdo_mysql（连 Aiven MySQL）、mbstring / bcmath / zip（Laravel 基础依赖）、
# opcache（生产性能）。gd 体积较大，若后续做图片处理再打开。
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libzip-dev \
        libonig-dev \
        unzip \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        bcmath \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Apache：开重写模块（public/.htaccess 的前端控制器重写要用）
RUN a2enmod rewrite

# Apache 站点配置：DocumentRoot 指向 public/，允许 .htaccess 覆盖
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

# 先拷代码，再把阶段 1 的 vendor 覆盖进来
COPY . .
COPY --from=vendor /app/vendor ./vendor

# Laravel 需要写 storage/ 与 bootstrap/cache/，交给 www-data
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache \
    && chmod +x docker/start.sh

# 容器内固定监听 80；Render 通过 PORT 环境变量把外部流量转发到这里
EXPOSE 80

CMD ["docker/start.sh"]
