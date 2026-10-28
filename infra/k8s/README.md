# Mbuni CEX — Helm Chart

Helm chart for deploying Mbuni CEX to Kubernetes.

## Quick start

```bash
# Install (using managed Postgres + secrets via --set)
helm install mbuni-cex infra/k8s/ \
  --create-namespace \
  --namespace mbuni-cex \
  --set config.NEXTAUTH_URL="https://cex.your-domain.com" \
  --set envSecrets.DATABASE_URL="postgresql://user:pass@host:5432/mbuni_cex?schema=public" \
  --set envSecrets.NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  --set ingress.hosts[0].host="cex.your-domain.com"

# Or with a values overlay
helm install mbuni-cex infra/k8s/ \
  --namespace mbuni-cex \
  -f infra/k8s/values.yaml \
  -f infra/k8s/values-prod.yaml \
  -f /path/to/secrets.yaml
```

## Upgrade

```bash
helm upgrade mbuni-cex infra/k8s/ \
  --namespace mbuni-cex \
  -f infra/k8s/values.yaml \
  -f infra/k8s/values-prod.yaml \
  -f /path/to/secrets.yaml
```

## Uninstall

```bash
helm uninstall mbuni-cex --namespace mbuni-cex
# (Optional) delete the namespace
kubectl delete namespace mbuni-cex
```

## Templates

| File | What it creates |
|---|---|
| `serviceaccount.yaml` | ServiceAccount (no IAM by default) |
| `secret.yaml` | Secret with `DATABASE_URL` + `NEXTAUTH_SECRET` (skipped if `secretExistingSecretName` is set) |
| `configmap.yaml` | ConfigMap with non-secret env vars (`NEXTAUTH_URL`, `NODE_ENV`) |
| `deployment.yaml` | Deployment with rolling updates, probes, resources, security context |
| `service.yaml` | ClusterIP Service on port 80 → 3000 |
| `ingress.yaml` | Ingress with TLS (cert-manager) |
| `hpa.yaml` | HorizontalPodAutoscaler (CPU + memory) |
| `pdb.yaml` | PodDisruptionBudget (keeps `minAvailable` pods during node drains) |
| `migration-job.yaml` | pre-install/pre-upgrade Job that runs `prisma db push` |
| `networkpolicy.yaml` | (Optional) NetworkPolicy locking down egress to DNS + HTTPS + DB CIDR |

## Managing secrets

**Don't commit real secrets to git.** Three options:

### 1. `--set` on the command line (one-off deploys)

```bash
helm upgrade mbuni-cex infra/k8s/ \
  --set envSecrets.DATABASE_URL="..." \
  --set envSecrets.NEXTAUTH_SECRET="..."
```

### 2. External Secrets Operator (recommended for prod)

Create an `ExternalSecret` that pulls from Vault / AWS Secrets Manager / GCP Secret Manager:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: mbuni-cex-ext-secret
  namespace: mbuni-cex
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: mbuni-cex-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: mbuni-cex/prod
        property: database_url
    - secretKey: NEXTAUTH_SECRET
      remoteRef:
        key: mbuni-cex/prod
        property: nextauth_secret
```

Then in `values.yaml`:

```yaml
secretExistingSecretName: "mbuni-cex-secrets"
```

### 3. Sealed Secrets (GitOps-friendly)

```bash
echo -n 'postgresql://...' | kubectl create secret generic mbuni-cex-secrets \
  --dry-run=client --from-file=DATABASE_URL=/dev/stdin -o yaml | \
  kubeseal --format yaml > infra/k8s/sealed-secret.yaml
```

Commit `sealed-secret.yaml` to git. Set `secretExistingSecretName: "mbuni-cex-secrets"` in `values.yaml`.

## Production values

See `values-prod.yaml` for an overlay that enables:

- 3 replicas (min) / 20 replicas (max) with HPA
- Topology spread constraints across AZs
- NetworkPolicy with DB egress CIDR
- Proper migrations via `prisma migrate deploy`
- PDB with `minAvailable: 2`
- Tighter resources

## GitOps with ArgoCD

```bash
argocd app create mbuni-cex \
  --repo https://github.com/your-org/mbuni-cex \
  --path infra/k8s \
  --dest-namespace mbuni-cex \
  --dest-server https://kubernetes.default.svc \
  --sync-policy auto \
  --auto-prune \
  --self-heal
```
