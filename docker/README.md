# docker/

| 文件 | 用途 | 负责 |
|---|---|---|
| `compose.dev.yml` | 本地开发依赖（MySQL 8.0 / Redis 7 / MinIO） | 架构骨架 |
| `Dockerfile.server`、`compose.prod.yml`、`nginx/` | 生产 / 预发部署（§13.2） | 部署流水线 issue |

> 本地没有 Docker 时，也可以连接团队共享的 dev 数据库；**真实客户数据不得进入 dev 和 staging（§13.6）**。
