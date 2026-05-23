# 0-monolith-vs-microservices — e2e results

## 2026-05-23T02:58:00Z — Re-verified by audit session

Compose uses two profiles (`monolith`, `microservices`) that share host port 8080.

### Monolith profile

| Flow | Result | Stdout summary |
|---|---|---|
| 2.1.4.1 Start monolith, hit `/api/search` | FAIL | Spring monolith image returns `404 NOT_FOUND` for `/api/search`; only `/` (static frontend) and `/actuator/health` return 200. The image content does not match the documented endpoint. |

### Microservices profile

| Flow | Result | Stdout summary |
|---|---|---|
| 2.1.4.2 5 sequential `/api/search` calls through NGINX gateway | PASS | All 5 return search-service JSON `{service:"Search Service", hostname, results:["Product 1",...]}` with the same hostname (only 1 replica) |
| 2.1.4.3 Fault isolation (stop payment-service, search still works) | PASS | After `docker stop payment-service`: `/api/search` returns 200 with full payload; `/api/payment` returns 502. Confirms blast-radius isolation. |

Verified 2/3 flows. Flow 1 fails due to monolith image not exposing `/api/search`.

### Collateral note

While freeing host port 8080, a previously running container `kafka-ui` (restart policy `unless-stopped`) was stopped. It appears to have been auto-removed during a subsequent `docker compose down -v` because it shared the network of another project that owned it. Re-launch the user's Kafka UI manually if it is needed.
