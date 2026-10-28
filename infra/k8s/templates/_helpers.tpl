{{/*
Common helpers for the Mbuni CEX Helm chart.
*/}}

{{- define "mbuni-cex.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "mbuni-cex.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if .Values.fullnameOverride -}}
{{- $name = .Values.fullnameOverride -}}
{{- end -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "mbuni-cex.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels applied to every resource.
*/}}
{{- define "mbuni-cex.labels" -}}
helm.sh/chart: {{ include "mbuni-cex.chart" . }}
{{ include "mbuni-cex.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: mbuni-cex
{{- end -}}

{{/*
Selector labels — must be unique per deployment for matchLabels to work.
*/}}
{{- define "mbuni-cex.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mbuni-cex.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Service account name — use the override if provided, otherwise generate one.
*/}}
{{- define "mbuni-cex.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "mbuni-cex.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Resolve the secret name to use for env secrets.
*/}}
{{- define "mbuni-cex.secretName" -}}
{{- if .Values.secretExistingSecretName -}}
{{- .Values.secretExistingSecretName -}}
{{- else -}}
{{- include "mbuni-cex.fullname" . -}}
{{- end -}}
{{- end -}}
