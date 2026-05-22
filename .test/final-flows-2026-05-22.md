# M3 Kubernetes Fundamentals — Final Flow Test Results (2026-05-22)

## L0 — Monolith vs Microservices (Docker compose, tested earlier)

```
Monolith profile:
GET http://localhost:8080/api/search → {"service":"Monolith Service","module":"Search",...}
GET http://localhost:8080/api/payment → {"service":"Monolith Service","module":"Payment",...}

Microservices profile (nginx routing):
GET http://localhost:8080/api/search → {"service":"Search Service",...}
GET http://localhost:8080/api/payment → {"service":"Payment Service",...}
```

**Status: ✓ PASS**

## L1 — Introduction to Kubernetes

Pure K8s YAML files; no docker compose. Files validated for YAML syntax (no apply to live cluster in this run):

- `.kubernetes/00-namespace.yaml` ✓
- `.kubernetes/deployment-status-service.yaml` ✓
- `.kubernetes/service-status-service.yaml` ✓

**Status: ✓ YAML VALIDATED, not deployed**

## L2 — Kubernetes Core Concepts (Cache-Aside MySQL + Redis)

Backend service image rebuilt: `starciacademy/system-design-kubernetes-core-concepts-backend:latest`. Service code was rewritten this session to fix duplicate `ConfigService` imports and properly inject config.

K8s manifests validated:
- `.kubernetes/backend.yaml` ✓
- `.kubernetes/mysql.yaml` ✓
- `.kubernetes/redis.yaml` ✓

**Status: ✓ Image built + YAML VALIDATED, not deployed** (requires minikube/kind to spin up MySQL + Redis + backend stack for end-to-end test)

## L3 — Complex Applications and Helm Charts

Helm chart values validated:
- `.helm/mongodb-sharded/values.yaml` ✓
- `.helm/postgresql-ha/values.yaml` ✓
- `.helm/redis-cluster/values.yaml` ✓

**Status: ✓ YAML VALIDATED, charts not installed**

## L4 — Kubernetes on Cloud (Ingress + cert-manager)

Backend service image rebuilt: `starciacademy/system-design-kubernetes-on-cloud-backend:latest` (same cache-aside logic as L2).

Both `.kubernetes/` and `.helm/` manifests validated:
- `backend.yaml`, `mysql.yaml`, `redis.yaml`, `ingress.yaml`, `cluster-issuer.yaml` ✓ (×2 in .kubernetes + .helm)
- `cert-manager/values.yaml`, `nginx-ingress-controller/values.yaml` ✓

**Status: ✓ Image built + YAML VALIDATED, not deployed** (requires cloud K8s + DNS + cert-manager)

## Image Naming (all under `starciacademy/system-design-`)

- `system-design-monolith-vs-microservices-monolith-service:latest`
- `system-design-monolith-vs-microservices-search-service:latest`
- `system-design-monolith-vs-microservices-payment-service:latest`
- `system-design-kubernetes-core-concepts-backend:latest`
- `system-design-kubernetes-on-cloud-backend:latest`

## Note on Cluster Deployment

M3 L1–L4 are designed as Kubernetes labs. End-to-end verification on a live cluster (minikube, kind, or cloud K8s) is **out of scope** for this packaging pass. The YAML/Helm files are syntactically valid and reference correct image names. Students will run `kubectl apply -f .kubernetes/` against their own cluster as part of the lab exercise.
