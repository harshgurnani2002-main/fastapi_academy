import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch21Lessons: Record<string, Lesson> = {
  'kubernetes-fundamentals': {
    id: '21-01',
    slug: 'kubernetes-fundamentals',
    chapterId: 21,
    order: 1,
    title: 'Kubernetes Architecture & Core Concepts',
    description: 'Understand the building blocks of Kubernetes and the declarative control plane.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.kubernetes],
    prerequisites: [],
    objectives: [
      'Explain control plane components (API server, scheduler, etc)',
      'Understand the declarative reconciliation loop',
      'Navigate clusters with kubectl',
      'Read Pod logs and describe events'
    ],
    sections: [
      {
        id: 'k8s-architecture',
        type: 'concept',
        title: 'The Kubernetes Control Plane',
        content: `Kubernetes is a distributed system designed to manage containerized applications across a cluster of nodes. The architecture is split into two main parts: the Control Plane (the "brain") and the Worker Nodes (the "muscle").

The Control Plane consists of several critical components: the **API Server** is the gateway that exposes the Kubernetes API and is the only component that communicates directly with the etcd datastore. The **Scheduler** watches for newly created Pods that have no assigned node and selects a node for them to run on. The **Controller Manager** runs controller processes (like the Deployment or ReplicaSet controllers) that constantly compare the desired state with the actual state and take action to reconcile them.

Worker nodes run the **Kubelet**, an agent that ensures containers are running in a Pod as described by the API server, and **Kube-proxy**, which maintains network rules on nodes to allow network communication to your Pods from network sessions inside or outside of your cluster.`
      },
      {
        id: 'declarative-state',
        type: 'concept',
        title: 'Declarative Reconciliation Loop',
        content: `A core principle of Kubernetes is the declarative approach. Instead of telling Kubernetes *how* to do something (imperative), you tell it *what* you want the final state to look like (declarative). You submit a YAML manifest detailing your desired state (e.g., "I want 3 replicas of the FastAPI app running version 1.2").

Kubernetes operates on continuous reconciliation loops. Controllers constantly watch the state of the cluster through the API Server. If a worker node crashes and takes down one of your FastAPI replicas, the ReplicaSet controller notices that the actual state (2 replicas) doesn't match the desired state (3 replicas). It immediately asks the API server to create a new Pod, which the scheduler then assigns to a healthy node.

This self-healing capability is what makes Kubernetes so powerful for running highly available production applications.`
      },
      {
        id: 'kubectl-basics',
        type: 'implementation',
        title: 'Navigating with kubectl',
        content: `The primary tool for interacting with the Kubernetes API is \`kubectl\`. While you will eventually automate deployments via CI/CD, mastering \`kubectl\` is essential for debugging and cluster exploration.

Key commands revolve around getting resources, describing them for detailed state/events, and viewing logs.`,
        codeExample: {
          id: 'kubectl-commands',
          language: 'bash',
          title: 'Essential kubectl commands',
          filename: 'terminal.sh',
          code: `# View all running pods in the current namespace
kubectl get pods

# View detailed information and events for a specific pod
kubectl describe pod fastapi-app-7d58f55c-xk2pz

# Stream logs from a container within a pod
kubectl logs -f fastapi-app-7d58f55c-xk2pz

# Execute an interactive shell inside a running pod
kubectl exec -it fastapi-app-7d58f55c-xk2pz -- /bin/bash

# Port forward a pod's port to your local machine for debugging
kubectl port-forward pod/fastapi-app-7d58f55c-xk2pz 8000:8000`
        }
      }
    ],
    challenges: [
      {
        id: 'debug-pending-pod',
        title: 'Debug a Pending Pod',
        description: 'A pod has been stuck in the "Pending" state for 5 minutes. Explain how you would determine why it is not starting.',
        hint: 'Use the command that provides detailed state and events for a resource.',
        solution: 'You would use `kubectl describe pod <pod-name>`. The `describe` output will list events at the bottom. A common reason for a Pending pod is insufficient resources on nodes (e.g., "Insufficient cpu" or "Insufficient memory"), which prevents the scheduler from finding a node to place the pod on. Another reason could be unmet node selectors or taints.',
        solutionCode: {
          id: 'describe-pod',
          language: 'bash',
          title: 'Debugging Command',
          filename: 'debug.sh',
          code: `kubectl describe pod stuck-pod-name | grep -A 10 "Events:"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'etcd-role',
        question: 'What is the role of etcd in Kubernetes?',
        answer: 'etcd is a highly available, consistent distributed key-value store used as Kubernetes\' backing store for all cluster data. It holds the desired and actual state of the cluster. Only the API server communicates directly with etcd.',
        difficulty: 'expert'
      },
      {
        id: 'imperative-vs-declarative',
        question: 'Explain the difference between imperative and declarative management in Kubernetes.',
        answer: 'Imperative management uses specific commands to change the cluster state step-by-step (e.g., `kubectl run`). Declarative management uses manifest files to declare the desired end state (e.g., `kubectl apply -f deployment.yaml`), and Kubernetes automatically determines the steps to reach and maintain that state.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'kube-system',
        severity: 'critical',
        content: 'Never deploy application workloads to the `kube-system` namespace. Keep your apps in separate namespaces to isolate resources and RBAC rules.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'api-server-overload',
        scenario: 'API Server OOM',
        problem: 'A runaway script executed `kubectl get pods -A` rapidly in a loop against a massive cluster, causing the API server to run out of memory and crash.',
        solution: 'Implemented API priority and fairness configurations to rate-limit aggressive clients, and configured monitoring alerts for API server memory utilization.'
      }
    ],
    commonMistakes: [
      {
        id: 'editing-live',
        title: 'Editing live resources manually',
        description: 'Using `kubectl edit` to change resources in production instead of updating the source-controlled YAML manifests.',
        badCode: {
          id: 'manual-edit',
          language: 'bash',
          title: '❌ Wrong Way',
          code: `kubectl edit deployment my-fastapi-app\n# This creates configuration drift from Git`
        },
        goodCode: {
          id: 'gitops-edit',
          language: 'bash',
          title: '✅ Correct Way',
          code: `# Update deployment.yaml in Git, then let CI/CD apply it, or manually:\nkubectl apply -f deployment.yaml`
        }
      }
    ],
    codeExamples: [],
  },
  'pods-deployments': {
    id: '21-02',
    slug: 'pods-deployments',
    chapterId: 21,
    order: 2,
    title: 'Pods & Deployments',
    description: 'Package your FastAPI app in Pods and manage them reliably with Deployments.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.kubernetes, technologies.fastapi],
    prerequisites: ['21-01'],
    objectives: [
      'Write a Deployment YAML for FastAPI',
      'Configure resource requests and limits',
      'Set deployment strategy (RollingUpdate)',
      'Configure pod disruption budgets'
    ],
    sections: [
      {
        id: 'pods-concept',
        type: 'concept',
        title: 'Understanding Pods vs. Deployments',
        content: `A **Pod** is the smallest deployable compute unit in Kubernetes. It encapsulates one or more containers (usually just one, plus maybe some sidecars like a logging agent) that share storage, network namespace, and lifecycle. However, Pods are ephemeral. If a node dies, the Pod dies with it, and Kubernetes will not automatically reschedule an isolated Pod.

To achieve high availability and self-healing, we almost never create Pods directly. Instead, we use a **Deployment**. A Deployment manages ReplicaSets, which in turn manage the Pods. If you tell a Deployment you want 3 replicas, it ensures exactly 3 Pods are running at all times. It also orchestrates updates, allowing you to transition smoothly from version v1 to v2 of your application without downtime.`
      },
      {
        id: 'fastapi-deployment',
        type: 'implementation',
        title: 'Writing a FastAPI Deployment',
        content: `Let's write a production-ready Deployment manifest for a FastAPI application. Notice how we specify labels, the container image, ports, and crucially: resource requests and limits.

**Requests** define the guaranteed resources the pod needs to run; the scheduler uses this to find a node with enough capacity.
**Limits** define the hard cap; if the container exceeds its memory limit, the OS will OOMKill it. If it exceeds CPU limits, it will be throttled.`,
        codeExample: {
          id: 'deployment-yaml',
          language: 'yaml',
          title: 'FastAPI Deployment',
          filename: 'deployment.yaml',
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-backend
  labels:
    app: fastapi
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fastapi
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: fastapi
    spec:
      containers:
      - name: api
        image: myregistry.com/fastapi-app:v1.2.0
        ports:
        - containerPort: 8000
        resources:
          requests:
            cpu: "200m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        env:
        - name: WORKERS
          value: "4"`
        }
      },
      {
        id: 'pod-disruption-budgets',
        type: 'production',
        title: 'Pod Disruption Budgets (PDB)',
        content: `When cluster administrators perform node maintenance (like upgrading the Kubernetes version or draining nodes), pods are evicted and rescheduled. Without constraints, an admin could accidentally drain all nodes running your replicas simultaneously, causing an outage.

A **Pod Disruption Budget (PDB)** prevents this by defining the minimum number (or percentage) of available pods that must be maintained during voluntary disruptions.`,
        codeExample: {
          id: 'pdb-yaml',
          language: 'yaml',
          title: 'PDB Configuration',
          filename: 'pdb.yaml',
          code: `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: fastapi-backend-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: fastapi`
        }
      }
    ],
    challenges: [
      {
        id: 'resource-limits',
        title: 'Configure Resource Limits',
        description: 'Update a deployment template to request 100m CPU and limit memory to 200Mi.',
        hint: 'Under `resources` in the container spec, use `requests` for CPU and `limits` for memory.',
        solution: 'You must specify the resources section accurately to ensure stable pod scheduling and prevent OOM kills.',
        solutionCode: {
          id: 'res-sol',
          language: 'yaml',
          title: 'Solution YAML snippet',
          filename: 'snippet.yaml',
          code: `resources:
  requests:
    cpu: "100m"
  limits:
    memory: "200Mi"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'requests-vs-limits',
        question: 'What happens if a pod uses more memory than its request, but less than its limit? What if it exceeds its limit?',
        answer: 'If a pod exceeds its request, it continues to run normally as long as the node has available memory and it remains below its limit. However, if the node faces memory pressure, pods exceeding their requests are more likely to be evicted. If a pod exceeds its hard memory limit, the container is OOMKilled (Out Of Memory Killed) immediately.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'oom-kills',
        severity: 'critical',
        content: 'Python applications (like FastAPI) can consume significant memory under load. Always benchmark your app to set accurate memory limits. Too low, and you get OOMKills; too high, and you waste expensive cluster resources.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'cpu-throttling',
        scenario: 'Excessive CPU Throttling',
        problem: 'A FastAPI service had very low CPU limits (100m). During traffic spikes, the CPU was heavily throttled by the Linux cgroup, leading to high latency and dropped requests without the pod ever crashing.',
        solution: 'Analyzed Prometheus CPU metrics and increased the CPU limit to 500m, completely resolving the artificial latency.'
      }
    ],
    commonMistakes: [
      {
        id: 'missing-resources',
        title: 'Not defining resources',
        description: 'Deploying pods without CPU/Memory requests and limits allows them to consume all node resources, potentially starving critical cluster components.',
        badCode: {
          id: 'no-resources',
          language: 'yaml',
          title: '❌ Wrong Way',
          code: `containers:
- name: api
  image: fastapi-app:v1`
        },
        goodCode: {
          id: 'with-resources',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `containers:
- name: api
  image: fastapi-app:v1
  resources:
    requests:
      cpu: "100m"
      memory: "128Mi"`
        }
      }
    ],
    codeExamples: [],
  },
  'services-networking': {
    id: '21-03',
    slug: 'services-networking',
    chapterId: 21,
    order: 3,
    title: 'Services & Kubernetes Networking',
    description: 'Expose your Pods reliably using Kubernetes Services and internal DNS.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.kubernetes],
    prerequisites: ['21-02'],
    objectives: [
      'Understand Kubernetes networking model',
      'Create ClusterIP services for internal access',
      'Use DNS for service discovery between pods',
      'Expose services with LoadBalancer for external access'
    ],
    sections: [
      {
        id: 'k8s-networking-model',
        type: 'concept',
        title: 'The Ephemeral IP Problem',
        content: `In Kubernetes, every Pod gets its own IP address within the cluster network. This flat network means Pods can communicate with each other directly without NAT. However, because Pods are ephemeral—they are constantly created, destroyed, and rescheduled—their IP addresses change frequently.

If your frontend tries to talk to your FastAPI backend using a hardcoded Pod IP, the connection will break as soon as that Pod is replaced. 

To solve this, Kubernetes provides the **Service** resource. A Service acts as a stable, virtual IP address and load balancer for a dynamically changing set of Pods. It uses label selectors (e.g., \`app: fastapi\`) to figure out which Pods to route traffic to.`
      },
      {
        id: 'clusterip',
        type: 'implementation',
        title: 'Internal Routing with ClusterIP',
        content: `The default type of Service is \`ClusterIP\`. It creates a virtual IP that is only reachable from *inside* the Kubernetes cluster. 

Additionally, CoreDNS (the cluster's internal DNS server) automatically creates a DNS record for the Service. If you create a service named \`fastapi-svc\` in the \`default\` namespace, other pods can reach it simply by making HTTP requests to \`http://fastapi-svc\`.`,
        codeExample: {
          id: 'clusterip-yaml',
          language: 'yaml',
          title: 'ClusterIP Service',
          filename: 'service.yaml',
          code: `apiVersion: v1
kind: Service
metadata:
  name: fastapi-svc
  namespace: backend
spec:
  type: ClusterIP
  selector:
    app: fastapi
  ports:
    - protocol: TCP
      port: 80         # Port exposed by the Service (DNS resolves to this)
      targetPort: 8000 # Port the FastAPI container is actually listening on`
        }
      },
      {
        id: 'loadbalancer',
        type: 'architecture',
        title: 'External Access with LoadBalancer',
        content: `To expose a Service to the outside world (the internet), you can change its type to \`LoadBalancer\`. When running on a cloud provider like AWS, GCP, or Azure, Kubernetes will automatically provision a native cloud load balancer (e.g., an AWS ALB or NLB) and route external traffic into your cluster nodes and down to your pods.

While useful, creating a \`LoadBalancer\` service for *every* app gets expensive because it provisions a new cloud resource each time. In production, we usually use an Ingress Controller (covered in a later lesson) and only provision one LoadBalancer.`,
        codeExample: {
          id: 'loadbalancer-yaml',
          language: 'yaml',
          title: 'LoadBalancer Service',
          filename: 'lb-service.yaml',
          code: `apiVersion: v1
kind: Service
metadata:
  name: fastapi-public-svc
spec:
  type: LoadBalancer
  selector:
    app: fastapi
  ports:
    - protocol: TCP
      port: 443
      targetPort: 8000`
        }
      }
    ],
    challenges: [
      {
        id: 'cross-namespace',
        title: 'Cross-Namespace Communication',
        description: 'You have a FastAPI service named `users-api` in the `auth` namespace. How would a frontend pod in the `web` namespace access it via DNS?',
        hint: 'Kubernetes DNS follows the pattern `<service-name>.<namespace>.svc.cluster.local`.',
        solution: 'The frontend pod would send requests to `http://users-api.auth.svc.cluster.local` (or simply `http://users-api.auth` depending on search domains).',
        solutionCode: {
          id: 'dns-url',
          language: 'python',
          title: 'Python Request',
          filename: 'request.py',
          code: `import httpx

response = httpx.get("http://users-api.auth.svc.cluster.local/users")`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'targetport-vs-port',
        question: 'In a Kubernetes Service, what is the difference between `port`, `targetPort`, and `nodePort`?',
        answer: '`port` is the port exposed by the Service itself within the cluster. `targetPort` is the port the actual container is listening on inside the Pod. `nodePort` is a specific port (usually 30000-32767) opened on every worker node\'s IP that routes to the service.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'headless-svc',
        severity: 'info',
        content: 'For stateful applications like databases (e.g., Cassandra or StatefulSets), you often use a "Headless Service" (setting `clusterIP: None`). This skips the load balancing proxy and returns the direct Pod IPs via DNS, allowing the client to handle the connection strategy.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'endpoint-mismatch',
        scenario: 'Service finding zero pods',
        problem: 'A newly created Service was routing traffic nowhere, resulting in connection refused errors. The Pods were running and healthy.',
        solution: 'The Service `selector` had a typo (`app: fast-api` instead of `app: fastapi`). The Service endpoints list was empty. Correcting the selector instantly linked the Service to the Pods.'
      }
    ],
    commonMistakes: [
      {
        id: 'hardcoded-ips',
        title: 'Hardcoding Pod IPs',
        description: 'Applications trying to communicate using Pod IP addresses instead of Service DNS names.',
        badCode: {
          id: 'bad-ip',
          language: 'python',
          title: '❌ Wrong Way',
          code: `REDIS_HOST = "10.244.1.55"  # Pod IP will change on restart`
        },
        goodCode: {
          id: 'good-dns',
          language: 'python',
          title: '✅ Correct Way',
          code: `REDIS_HOST = "redis-service.default.svc.cluster.local"`
        }
      }
    ],
    codeExamples: [],
  },
  'configmaps-secrets': {
    id: '21-04',
    slug: 'configmaps-secrets',
    chapterId: 21,
    order: 4,
    title: 'ConfigMaps & Secrets',
    description: 'Decouple configuration and sensitive data from your container images.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.kubernetes],
    prerequisites: ['21-02'],
    objectives: [
      'Create ConfigMaps for non-sensitive config',
      'Use Secrets for database passwords and API keys',
      'Mount ConfigMaps and Secrets as environment variables',
      'Use external secret operators for production'
    ],
    sections: [
      {
        id: 'config-decoupling',
        type: 'concept',
        title: 'Decoupling Configuration',
        content: `A core tenet of the Twelve-Factor App methodology is storing configuration in the environment. Your Docker image should be environment-agnostic; the exact same image should run in Staging and Production, with only the configuration altering its behavior.

Kubernetes provides two objects for this: **ConfigMaps** for non-sensitive data (log levels, external URLs, theme colors) and **Secrets** for sensitive data (database passwords, TLS certificates, API keys). Both can be injected into Pods either as environment variables or as files mounted in a volume.`
      },
      {
        id: 'using-configmaps-secrets',
        type: 'implementation',
        title: 'Injecting Config into FastAPI',
        content: `Let's define a ConfigMap and a Secret, and then modify our Deployment to inject them as environment variables that FastAPI (via Pydantic BaseSettings) will automatically read.

*Note: In Kubernetes YAML, Secret data must be base64 encoded. (e.g., \`echo -n "supersecret" | base64\`)*`,
        codeExample: {
          id: 'config-manifests',
          language: 'yaml',
          title: 'ConfigMaps, Secrets, and Deployment',
          files: {
            'k8s/configmap.yaml': {
              language: 'yaml',
              code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: fastapi-config
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  CORS_ORIGINS: '["https://myapp.com"]'`
            },
            'k8s/secret.yaml': {
              language: 'yaml',
              code: `apiVersion: v1
kind: Secret
metadata:
  name: fastapi-secrets
type: Opaque
data:
  # echo -n "postgres://user:pass@db:5432/db" | base64
  DATABASE_URL: cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGI6NTQzMi9kYg==`
            },
            'k8s/deployment.yaml': {
              language: 'yaml',
              code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fastapi
  template:
    metadata:
      labels:
        app: fastapi
    spec:
      containers:
      - name: api
        image: fastapi-app:v1
        envFrom:
        - configMapRef:
            name: fastapi-config
        - secretRef:
            name: fastapi-secrets`
            }
          }
        }
      },
      {
        id: 'external-secrets',
        type: 'production',
        title: 'Production Secrets Management',
        content: `While Kubernetes Secrets prevent passwords from being baked into images, they are inherently weak. By default, they are just base64 encoded, not encrypted, and storing them in your Git repository (GitOps) is a major security risk.

In production, you should use tools like **External Secrets Operator (ESO)** or **Sealed Secrets**. ESO connects to external providers like AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault, fetches the secure data, and dynamically generates the Kubernetes Secret object in memory.`
      }
    ],
    challenges: [
      {
        id: 'mount-volume',
        title: 'Mount Secret as a File',
        description: 'Instead of an environment variable, mount the `fastapi-secrets` Secret as a file at `/etc/secrets/db_url`.',
        hint: 'You need to define a `volumes` block at the pod spec level, and a `volumeMounts` block inside the container spec.',
        solution: 'Mounting secrets as volumes is useful for TLS certificates or configuration files that an app expects to read from disk.',
        solutionCode: {
          id: 'volume-mount',
          language: 'yaml',
          title: 'Volume Mount Solution',
          filename: 'deployment-volumes.yaml',
          code: `    spec:
      containers:
      - name: api
        image: fastapi-app:v1
        volumeMounts:
        - name: secret-volume
          mountPath: /etc/secrets
          readOnly: true
      volumes:
      - name: secret-volume
        secret:
          secretName: fastapi-secrets`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'base64-security',
        question: 'Are Kubernetes Secrets secure by default? Why or why not?',
        answer: 'No, by default they are only base64 encoded, which is not encryption. Anyone with access to the Secret object in the cluster can decode it. To secure them, cluster administrators must enable encryption at rest for etcd, and RBAC must strictly limit who can read Secret objects.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'config-reloads',
        severity: 'warning',
        content: 'When you update a ConfigMap or Secret that is mounted as an environment variable, running Pods DO NOT automatically pick up the new values. You must trigger a rolling restart of the Deployment to apply the changes (e.g., `kubectl rollout restart deployment/fastapi`).'
      }
    ],
    realWorldScenarios: [
      {
        id: 'secret-in-git',
        scenario: 'Committed Secrets',
        problem: 'A developer committed a raw `secret.yaml` file with base64-encoded production database credentials to a public GitHub repository. The database was compromised.',
        solution: 'Credentials were rotated. The team adopted Mozilla SOPS (Secrets OPerationS) to encrypt the YAML files before committing them to Git.'
      }
    ],
    commonMistakes: [
      {
        id: 'env-vs-envfrom',
        title: 'Clunky environment variable mapping',
        description: 'Mapping dozens of config values individually instead of injecting the whole ConfigMap.',
        badCode: {
          id: 'individual-env',
          language: 'yaml',
          title: '❌ Wrong Way',
          code: `env:
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: config
      key: LOG_LEVEL
# ... repeated 20 times`
        },
        goodCode: {
          id: 'envfrom',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `envFrom:
- configMapRef:
    name: config`
        }
      }
    ],
    codeExamples: [],
  },
  'ingress-configuration': {
    id: '21-05',
    slug: 'ingress-configuration',
    chapterId: 21,
    order: 5,
    title: 'Ingress & External Access',
    description: 'Route external HTTP/HTTPS traffic to your internal services using Ingress.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.kubernetes, technologies.nginx],
    prerequisites: ['21-03'],
    objectives: [
      'Deploy Nginx Ingress Controller',
      'Configure Ingress rules for FastAPI',
      'Add TLS with cert-manager',
      'Configure rate limiting annotations'
    ],
    sections: [
      {
        id: 'ingress-concept',
        type: 'concept',
        title: 'Beyond LoadBalancers: The Ingress Controller',
        content: `As mentioned earlier, creating a cloud LoadBalancer for every microservice is expensive and inefficient. An **Ingress Controller** solves this. It acts as a single entry point (backed by one LoadBalancer) that handles reverse proxying, URL routing, SSL termination, and load balancing for the entire cluster.

The most popular choice is the NGINX Ingress Controller. 

An **Ingress** object is simply a set of routing rules (e.g., "route traffic for api.myapp.com to the fastapi-service"). The controller watches for these rules and dynamically updates its NGINX configuration.`
      },
      {
        id: 'ingress-rules',
        type: 'implementation',
        title: 'Routing Traffic to FastAPI',
        content: `Here is how we define an Ingress resource to route traffic from a specific domain name to our internal FastAPI ClusterIP service. We can also use annotations to configure NGINX behavior, such as CORS, rate limiting, or rewrite rules.`,
        codeExample: {
          id: 'ingress-yaml',
          language: 'yaml',
          title: 'Ingress configuration',
          filename: 'ingress.yaml',
          code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fastapi-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    # NGINX specific annotations
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/limit-rps: "50"
spec:
  rules:
  - host: api.myproductionapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fastapi-svc
            port:
              number: 80`
        }
      },
      {
        id: 'tls-cert-manager',
        type: 'production',
        title: 'Automated TLS with cert-manager',
        content: `Serving traffic over HTTPS is mandatory. Kubernetes has a powerful add-on called **cert-manager** that automates the provisioning and renewal of Let's Encrypt certificates.

By adding a specific annotation and a \`tls\` block to your Ingress, cert-manager will automatically perform the ACME challenge, generate the certificate, store it in a Kubernetes Secret, and configure NGINX to use it.`
      }
    ],
    challenges: [
      {
        id: 'tls-challenge',
        title: 'Add TLS to Ingress',
        description: 'Update the previous Ingress YAML to request a Let\'s Encrypt certificate named `fastapi-tls` using the cluster-issuer named `letsencrypt-prod`.',
        hint: 'Add the `cert-manager.io/cluster-issuer` annotation and the `tls` array block under `spec`.',
        solution: 'The cert-manager controller reads the annotation, provisions the cert for the hosts listed in the tls block, and saves it to the specified secretName.',
        solutionCode: {
          id: 'tls-sol',
          language: 'yaml',
          title: 'TLS Ingress snippet',
          filename: 'ingress-tls.yaml',
          code: `metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.myproductionapp.com
    secretName: fastapi-tls
  rules:
  # ... (rest of rules)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'ingress-vs-service',
        question: 'What is the functional difference between an Ingress and a Service of type LoadBalancer?',
        answer: 'A LoadBalancer Service operates at Layer 4 (TCP/UDP), provisioning a cloud load balancer per service without understanding HTTP routing. An Ingress operates at Layer 7 (HTTP/HTTPS), providing name-based virtual hosting, path routing, and SSL termination for multiple services behind a single IP/LoadBalancer.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'ingress-class',
        severity: 'critical',
        content: 'Always define the `ingressClassName` (or use the older `kubernetes.io/ingress.class` annotation) on your Ingress objects. In clusters with multiple controllers (e.g., an internal and external NGINX controller), this prevents conflicts.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'large-uploads',
        scenario: '413 Request Entity Too Large',
        problem: 'Users uploading 5MB images to the FastAPI backend were receiving 413 errors, even though FastAPI had no size limits configured.',
        solution: 'The NGINX Ingress Controller defaults to a 1MB max body size. Added the annotation `nginx.ingress.kubernetes.io/proxy-body-size: "20m"` to the Ingress resource.'
      }
    ],
    commonMistakes: [
      {
        id: 'missing-pathtype',
        title: 'Incorrect Path Matching',
        description: 'Not understanding `Prefix` vs `Exact` pathTypes can lead to 404 errors for sub-routes.',
        badCode: {
          id: 'exact-path',
          language: 'yaml',
          title: '❌ Wrong Way',
          code: `path: /
pathType: Exact
# Only the root path '/' works. '/users' returns 404.`
        },
        goodCode: {
          id: 'prefix-path',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `path: /
pathType: Prefix
# Matches '/' and anything under it like '/users'`
        }
      }
    ],
    codeExamples: [],
  },
  'horizontal-pod-autoscaling': {
    id: '21-06',
    slug: 'horizontal-pod-autoscaling',
    chapterId: 21,
    order: 6,
    title: 'Horizontal Pod Autoscaling',
    description: 'Automatically scale your FastAPI replicas up and down based on traffic and resource usage.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.kubernetes, technologies.prometheus],
    prerequisites: ['21-02'],
    objectives: [
      'Configure CPU-based HPA',
      'Set up custom metrics HPA with Prometheus',
      'Configure scale-down stabilization',
      'Test autoscaling with load generation'
    ],
    sections: [
      {
        id: 'hpa-concepts',
        type: 'concept',
        title: 'Dynamic Scaling in Kubernetes',
        content: `Workloads are rarely static. Traffic spikes during the day and drops at night. Manually adjusting the \`replicas\` count in your Deployment is tedious and slow to react.

The **Horizontal Pod Autoscaler (HPA)** automatically updates a workload resource (like a Deployment) to match demand. It periodically queries the resource metrics API (usually backed by the metrics-server) to get CPU and memory usage for your pods. If average CPU utilization exceeds your defined threshold, it calculates how many new pods are needed and scales the Deployment up.`
      },
      {
        id: 'cpu-hpa',
        type: 'implementation',
        title: 'Configuring CPU-Based Scaling',
        content: `To use HPA based on CPU, your Deployment **must** have CPU requests defined (otherwise the HPA cannot calculate a percentage). 

Here is an HPA that maintains an average CPU utilization of 70% across all FastAPI pods, scaling between 2 and 10 replicas.`,
        codeExample: {
          id: 'hpa-yaml',
          language: 'yaml',
          title: 'HPA Manifest',
          filename: 'hpa.yaml',
          code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fastapi-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fastapi-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70`
        }
      },
      {
        id: 'custom-metrics-hpa',
        type: 'architecture',
        title: 'Scaling on Custom Metrics',
        content: `CPU and memory aren't always the best indicators of load. For example, an async FastAPI app might be struggling with a massive backlog of queue messages while CPU remains low.

Using the **Prometheus Adapter**, HPA can scale based on custom metrics. You could scale your background Celery workers based on the length of a RabbitMQ queue, or scale FastAPI based on Requests Per Second (RPS) metrics scraped by Prometheus. This provides highly accurate, business-logic-driven scaling.`
      }
    ],
    challenges: [
      {
        id: 'hpa-behavior',
        title: 'HPA Behavior Analysis',
        description: 'You have an HPA with `targetCPUUtilization: 50`, `min: 2`, `max: 10`. Current state: 2 pods running, CPU usages are 90% and 110%. How many total pods will the HPA scale to on its next cycle?',
        hint: 'Desired Replicas = ceil[currentReplicas * ( currentMetricValue / desiredMetricValue )]',
        solution: 'Average current usage = (90 + 110) / 2 = 100%. Desired = ceil[2 * (100 / 50)] = ceil[4] = 4. The HPA will scale to 4 pods.',
        solutionCode: {
          id: 'hpa-math',
          language: 'python',
          title: 'HPA Formula',
          filename: 'math.py',
          code: `current_replicas = 2
avg_cpu = 100
target_cpu = 50

import math
desired = math.ceil(current_replicas * (avg_cpu / target_cpu))
print(desired)  # Output: 4`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'scale-down-thrashing',
        question: 'What is scale-down stabilization in HPA and why is it important?',
        answer: 'Scale-down stabilization prevents "thrashing"—where the HPA rapidly scales up and down due to fluctuating metrics. By default, HPA respects a 5-minute stabilization window for scaling down. It looks at the recommendations over the last 5 minutes and picks the highest one, ensuring the load has genuinely subsided before removing pods.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'cluster-autoscaler',
        severity: 'critical',
        content: 'HPA only adds Pods. If your worker nodes are full, the new Pods will remain in a "Pending" state. To handle this, you must also run the Cluster Autoscaler (or Karpenter), which monitors for Pending pods and automatically provisions new EC2/GCP instances to add to the cluster.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'missing-requests-hpa',
        scenario: 'HPA Unknown state',
        problem: 'An HPA was deployed but `kubectl get hpa` showed `<unknown>/70%` for targets, and the application never scaled during a traffic spike.',
        solution: 'The target Deployment was missing `resources.requests.cpu`. HPA calculates utilization as a percentage of the requested CPU. Once requests were added to the Deployment, the metrics populated and scaling worked.'
      }
    ],
    commonMistakes: [
      {
        id: 'memory-hpa',
        title: 'Scaling on Memory',
        description: 'Using memory utilization for HPA in Python applications is notoriously unreliable.',
        badCode: {
          id: 'mem-scale',
          language: 'yaml',
          title: '❌ Bad Practice',
          code: `metrics:
- type: Resource
  resource:
    name: memory
    target:
      type: Utilization
      averageUtilization: 60`
        },
        goodCode: {
          id: 'cpu-scale',
          language: 'yaml',
          title: '✅ Better Practice',
          code: `# Scale on CPU or custom Request Per Second metrics
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70`
        }
      }
    ],
    codeExamples: [],
  },
  'health-probes-k8s': {
    id: '21-07',
    slug: 'health-probes-k8s',
    chapterId: 21,
    order: 7,
    title: 'Kubernetes Health Probes',
    description: 'Ensure traffic only goes to healthy pods and automatically restart deadlocked containers.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.kubernetes, technologies.fastapi],
    prerequisites: ['21-02'],
    objectives: [
      'Configure readiness probe for traffic routing',
      'Configure liveness probe for restart on hang',
      'Configure startup probe for slow-starting containers',
      'Test probe behavior by deliberately failing endpoints'
    ],
    sections: [
      {
        id: 'probes-concept',
        type: 'concept',
        title: 'Liveness, Readiness, and Startup Probes',
        content: `Kubernetes needs to know the actual state of your application, not just if the container process is running. A FastAPI app might be running, but deadlocked on a database connection, unable to serve requests. 

Kubernetes provides three types of probes:
1. **Liveness Probe**: "Is the app dead?" If this fails, the kubelet kills the container and restarts it.
2. **Readiness Probe**: "Is the app ready to receive HTTP traffic?" If this fails, the endpoint controller removes the Pod's IP from the Service, stopping traffic from routing to it.
3. **Startup Probe**: "Has the application finished its initial startup?" Used for legacy apps that take a long time to boot, suppressing the other probes until it passes.`
      },
      {
        id: 'fastapi-health-endpoints',
        type: 'implementation',
        title: 'Implementing Health Endpoints in FastAPI',
        content: `First, we need to expose health check endpoints in our FastAPI code. We create a simple \`/health/liveness\` that just returns 200 OK to prove the event loop is alive. 

Then we create \`/health/readiness\` which actually verifies critical dependencies, like the database connection, before accepting traffic.`,
        codeExample: {
          id: 'health-code',
          language: 'python',
          title: 'FastAPI Health Endpoints',
          filename: 'health.py',
          code: `from fastapi import APIRouter, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

router = APIRouter(tags=["Health"])

@router.get("/health/liveness")
async def liveness_probe():
    # If the async loop can respond to this, we are alive
    return {"status": "alive"}

@router.get("/health/readiness")
async def readiness_probe(db: AsyncSession, response: Response):
    try:
        # Verify database connectivity
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        # If DB is down, return 503 Service Unavailable
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unhealthy", "detail": "Database connection failed"}`
        }
      },
      {
        id: 'probe-yaml',
        type: 'implementation',
        title: 'Configuring Probes in Deployment',
        content: `Now we configure the Kubernetes Deployment to utilize these endpoints. We set \`initialDelaySeconds\` to give the app time to start, and \`periodSeconds\` to define how often to check.`,
        codeExample: {
          id: 'probe-manifest',
          language: 'yaml',
          title: 'Deployment Probes',
          filename: 'deployment.yaml',
          code: `      containers:
      - name: api
        image: fastapi-app:v1
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 3`
        }
      }
    ],
    challenges: [
      {
        id: 'probe-failure',
        title: 'Analyze Probe Failure',
        description: 'Your liveness probe fails consecutively, reaching the `failureThreshold`. What action does Kubernetes take immediately?',
        hint: 'The liveness probe determines if the container needs a reboot.',
        solution: 'Kubernetes (specifically the kubelet on the node) will kill the container and restart it according to the pod\'s `restartPolicy` (which defaults to Always). It will also emit an event "Liveness probe failed: HTTP probe failed... Killing container".',
        solutionCode: {
          id: 'probe-events',
          language: 'bash',
          title: 'Check events',
          filename: 'events.sh',
          code: `kubectl describe pod <pod-name> | grep -i liveness`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'liveness-vs-readiness',
        question: 'Why should your liveness probe generally NOT check external dependencies like databases?',
        answer: 'If your liveness probe checks the database, and the database goes down for 30 seconds, the liveness probe will fail and Kubernetes will restart your Pods. Restarting your API pods doesn\'t fix the database; it just causes a chaotic thundering herd when the DB recovers. Only the Readiness probe should check dependencies to stop routing traffic during outages.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'startup-probe-usage',
        severity: 'info',
        content: 'If your FastAPI app runs heavy ML model loading on startup that takes 30-60 seconds, configure a `startupProbe`. It disables liveness and readiness checks until the startup probe succeeds, preventing Kubernetes from prematurely killing the pod while it\'s still initializing.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'cascading-failure',
        scenario: 'Cascading Pod Restarts',
        problem: 'A database slowdown caused liveness probes to time out. Kubernetes restarted the pods. The restarting pods put more load on the DB during initialization, causing more liveness timeouts and a complete cluster crash loop.',
        solution: 'Removed the database check from the liveness probe endpoint (`/health/liveness`), moving it strictly to the readiness probe. This allowed pods to wait patiently for the DB to recover without restarting.'
      }
    ],
    commonMistakes: [
      {
        id: 'no-probes',
        title: 'Omitting Probes',
        description: 'Without probes, a zero-downtime rolling update is impossible, because Kubernetes assumes the pod is ready the second the container process starts, routing traffic to it before Uvicorn/FastAPI are actually bound to the port.',
        badCode: {
          id: 'no-probes-yaml',
          language: 'yaml',
          title: '❌ Wrong Way',
          code: `containers:
- name: api
  image: app:v1
  # No liveness/readiness probes`
        },
        goodCode: {
          id: 'with-probes-yaml',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `containers:
- name: api
  image: app:v1
  readinessProbe:
    httpGet:
      path: /health
      port: 8000`
        }
      }
    ],
    codeExamples: [],
  },
  'rolling-deployments': {
    id: '21-08',
    slug: 'rolling-deployments',
    chapterId: 21,
    order: 8,
    title: 'Zero-Downtime Rolling Deployments',
    description: 'Update application versions safely without dropping a single user request.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.kubernetes],
    prerequisites: ['21-02', '21-07'],
    objectives: [
      'Configure RollingUpdate maxSurge and maxUnavailable',
      'Use readiness probes to control rollout speed',
      'Monitor rollout progress with kubectl rollout status',
      'Roll back failed deployments immediately'
    ],
    sections: [
      {
        id: 'rolling-concept',
        type: 'concept',
        title: 'The Rolling Update Strategy',
        content: `When you update the image tag in a Deployment, Kubernetes doesn't shut down all existing pods at once. By default, it uses the **RollingUpdate** strategy.

It works incrementally: it creates a new ReplicaSet for the new version, scales it up by a few pods, waits for them to become **Ready** (via Readiness Probes), and then scales down the old ReplicaSet. This process repeats until all pods are running the new version.

If a new pod fails its readiness probe (e.g., due to a crash loop on bad code), the rollout pauses. The old pods continue serving traffic, meaning a bad deployment causes zero downtime.`
      },
      {
        id: 'surge-unavailable',
        type: 'architecture',
        title: 'maxSurge and maxUnavailable',
        content: `You control the speed and safety of the rollout using two parameters in the Deployment spec:

- **maxSurge**: How many pods can be created over the desired number of replicas during the update.
- **maxUnavailable**: How many pods can be unavailable below the desired number of replicas.

For highly critical APIs, you might set \`maxUnavailable: 0\` and \`maxSurge: 25%\`. This guarantees 100% capacity is always available during the deploy, though it requires extra node capacity to run the surge pods.`,
        codeExample: {
          id: 'rolling-yaml',
          language: 'yaml',
          title: 'RollingUpdate Configuration',
          filename: 'strategy.yaml',
          code: `spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Will scale up to 5 pods max during deploy
      maxUnavailable: 0  # Will never drop below 4 healthy pods`
        }
      },
      {
        id: 'rollout-commands',
        type: 'implementation',
        title: 'Managing Rollouts via CLI',
        content: `You can track the progress of a rollout or abort it using \`kubectl rollout\`. If a deployment gets stuck or introduces a critical bug, rolling back is instant because the old ReplicaSet is kept around (scaled to 0).`,
        codeExample: {
          id: 'rollout-cli',
          language: 'bash',
          title: 'Rollout Commands',
          filename: 'commands.sh',
          code: `# Trigger an update by changing the image
kubectl set image deployment/fastapi api=my-registry/fastapi:v2.0.0

# Watch the rollout progress in real-time
kubectl rollout status deployment/fastapi

# Uh oh, v2.0.0 is broken! Roll back to the previous version instantly
kubectl rollout undo deployment/fastapi`
        }
      }
    ],
    challenges: [
      {
        id: 'rollout-stuck',
        title: 'Diagnose a Stuck Rollout',
        description: 'You deployed a new image. `kubectl get pods` shows 2 old pods running, and 1 new pod in `CrashLoopBackOff`. The rollout has stopped progressing. Explain why.',
        hint: 'Consider the interaction between readiness probes and the RollingUpdate mechanism.',
        solution: 'The new pod is crashing, so it never passes its readiness probe. Because the Deployment strategy prevents removing old pods until new ones are ready (to respect maxUnavailable), the rollout correctly halts, preventing the bad code from taking down the entire service.',
        solutionCode: {
          id: 'stuck-check',
          language: 'bash',
          title: 'Check Status',
          filename: 'check.sh',
          code: `kubectl get rs
# You will see the new ReplicaSet stuck at 1/1 desired, 0 ready`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'graceful-shutdown',
        question: 'Why is handling SIGTERM gracefully in your FastAPI app critical for zero-downtime rolling updates?',
        answer: 'During a rolling update, Kubernetes sends a SIGTERM signal to old pods to shut them down. If your app ignores SIGTERM or exits abruptly, currently processing requests will be dropped, causing 502 Bad Gateway errors for clients. FastAPI/Uvicorn handles SIGTERM by stopping new requests and finishing active ones (graceful shutdown).',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pre-stop-hook',
        severity: 'warning',
        content: 'Due to asynchronous propagation of endpoint removal in kube-proxy, a pod might still receive traffic for a split second after receiving SIGTERM. Use a Kubernetes `preStop` lifecycle hook (e.g., `sleep 5`) to delay the SIGTERM to Uvicorn, ensuring it handles remaining incoming packets cleanly.'
      }
    ],
    realWorldScenarios: [
      {
        id: '502-during-deploy',
        scenario: 'Dropped Requests on Deploy',
        problem: 'Despite proper readiness probes and rolling updates, API clients reported a flurry of 502 Bad Gateway errors exactly at the moment deployments occurred.',
        solution: 'Implemented a `preStop` hook to sleep for 5 seconds before allowing the SIGTERM to reach the container. This gave cloud load balancers and iptables rules enough time to update and stop sending new traffic to the terminating pod.'
      }
    ],
    commonMistakes: [
      {
        id: 'recreate-strategy',
        title: 'Using Recreate Strategy',
        description: 'Setting the deployment strategy to `Recreate` kills all old pods before starting new ones, guaranteeing absolute downtime.',
        badCode: {
          id: 'recreate',
          language: 'yaml',
          title: '❌ Wrong Way',
          code: `strategy:
  type: Recreate`
        },
        goodCode: {
          id: 'rolling',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `strategy:
  type: RollingUpdate`
        }
      }
    ],
    codeExamples: [],
  },
  'blue-green-deployments': {
    id: '21-09',
    slug: 'blue-green-deployments',
    chapterId: 21,
    order: 9,
    title: 'Blue/Green Deployments',
    description: 'Deploy safely by running two identical environments and switching traffic instantly.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.kubernetes],
    prerequisites: ['21-08'],
    objectives: [
      'Create separate blue and green Deployments',
      'Switch traffic by updating Service selector',
      'Validate green deployment before switching',
      'Roll back instantly by switching selector back'
    ],
    sections: [
      {
        id: 'blue-green-concept',
        type: 'concept',
        title: 'What is Blue/Green Deployment?',
        content: `While Rolling Updates are great, they have a drawback: during the rollout, both version A and version B are serving production traffic simultaneously. If your frontend strictly requires version B's API response, users might experience inconsistent behavior depending on which pod serves their request.

**Blue/Green Deployment** solves this. You maintain two completely separate environments (or Deployments in Kubernetes). 
- **Blue** is currently running the old version and receiving all production traffic.
- **Green** is deployed with the new version. It receives NO production traffic.

You run integration tests against Green. Once verified, you flip a switch at the Service or Ingress level to route 100% of traffic to Green instantly. If something breaks, you flip the switch back to Blue.`
      },
      {
        id: 'service-switching',
        type: 'implementation',
        title: 'Switching Traffic with Services',
        content: `In standard Kubernetes, Blue/Green is implemented by modifying the \`selector\` of the main Service. We deploy v1 with label \`version: blue\` and v2 with label \`version: green\`.`,
        codeExample: {
          id: 'bg-yaml',
          language: 'yaml',
          title: 'Blue/Green Service Switch',
          files: {
            'k8s/blue-deployment.yaml': {
              language: 'yaml',
              code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fastapi
      version: blue
  template:
    metadata:
      labels:
        app: fastapi
        version: blue
    spec:
      containers:
      - name: api
        image: fastapi:v1.0.0`
            },
            'k8s/green-deployment.yaml': {
              language: 'yaml',
              code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fastapi
      version: green
  template:
    metadata:
      labels:
        app: fastapi
        version: green
    spec:
      containers:
      - name: api
        image: fastapi:v2.0.0`
            },
            'k8s/service.yaml': {
              language: 'yaml',
              code: `apiVersion: v1
kind: Service
metadata:
  name: fastapi-production-svc
spec:
  type: ClusterIP
  selector:
    app: fastapi
    # Change this from 'blue' to 'green' and apply to cut over
    version: green
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000`
            }
          }
        }
      },
      {
        id: 'argo-rollouts',
        type: 'architecture',
        title: 'Automating Blue/Green',
        content: `Doing this manually with \`kubectl patch service\` is risky and unscalable. In production, teams use GitOps controllers like **Argo Rollouts** or **Flagger**. 

With Argo Rollouts, you replace your \`Deployment\` with a \`Rollout\` custom resource. Argo manages the Blue/Green ReplicaSets and automatically executes pre-promotion testing and traffic cutting via an Ingress controller or Service Mesh.`
      }
    ],
    challenges: [
      {
        id: 'db-migrations-bg',
        title: 'Database Migrations in Blue/Green',
        description: 'You are switching traffic from v1 (Blue) to v2 (Green). v2 requires dropping a column in the PostgreSQL database. When do you run the migration?',
        hint: 'Consider what happens to the Blue deployment if you drop the column while it is still serving traffic.',
        solution: 'You cannot perform destructive database migrations (like dropping columns) in a standard Blue/Green deploy, because Blue and Green share the same database. If you drop the column for Green, Blue will immediately crash. Database migrations must be backwards compatible; you stop using the column in v2, wait for the deployment to finish successfully, and drop the column in a future v3 deployment.',
        solutionCode: {
          id: 'migration-strategy',
          language: 'markdown',
          title: 'Backward Compatible Migrations',
          filename: 'notes.md',
          code: `Phase 1: Add new column, code writes to both, reads from old.
Phase 2: Code writes to both, reads from new.
Phase 3: Code writes to new, reads from new.
Phase 4: Drop old column.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'cost-of-blue-green',
        question: 'What is the primary infrastructure drawback of a Blue/Green deployment strategy?',
        answer: 'The primary drawback is resource cost. Because you must spin up an entire identical replica of your production environment (Green) before shifting traffic, you need 2x the compute capacity during the deployment window.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'warm-up',
        severity: 'warning',
        content: 'Before cutting traffic to Green, ensure the pods are warmed up. Python applications might need to load ML models, and connection pools need to be established. Hitting Green with 100% production traffic while cold can cause massive latency spikes.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'bg-cache-miss',
        scenario: 'The Cold Cache Catastrophe',
        problem: 'Traffic was instantly switched to Green. Because the Green pods were brand new, their local in-memory caches were entirely empty. The sudden 100% cache miss rate overwhelmed the backend database, bringing down the service.',
        solution: 'Implemented cache warming scripts in the CI/CD pipeline that fired thousands of read requests against the Green internal service IP to populate caches *before* the service selector was updated.'
      }
    ],
    commonMistakes: [
      {
        id: 'bg-long-lived',
        title: 'Keeping Blue Alive Indefinitely',
        description: 'Leaving the Blue environment running for days after a successful deployment to Green wastes expensive cluster resources.',
        badCode: {
          id: 'keep-blue',
          language: 'bash',
          title: '❌ Wrong Way',
          code: `# Switching to green, but leaving blue pods running forever`
        },
        goodCode: {
          id: 'kill-blue',
          language: 'bash',
          title: '✅ Correct Way',
          code: `# Wait 1 hour for monitoring confirmation, then scale down Blue
kubectl scale deployment fastapi-blue --replicas=0`
        }
      }
    ],
    codeExamples: [],
  },
  'canary-releases': {
    id: '21-10',
    slug: 'canary-releases',
    chapterId: 21,
    order: 10,
    title: 'Canary Releases',
    description: 'Test new code on a small percentage of live users before full rollout.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.kubernetes, technologies.nginx],
    prerequisites: ['21-08'],
    objectives: [
      'Implement canary by running multiple Deployments',
      'Use Ingress annotations for traffic splitting',
      'Monitor canary vs baseline metrics',
      'Automate canary promotion with flagger'
    ],
    sections: [
      {
        id: 'canary-concept',
        type: 'concept',
        title: 'The Canary Concept',
        content: `Named after the "canary in a coal mine," a Canary release mitigates risk by rolling out a new version of an application to a small subset of users (e.g., 5%). 

You monitor the health, error rates, and performance of that 5% over a period of time. If metrics degrade, you abort the rollout, impacting only a tiny fraction of your user base. If metrics remain healthy, you gradually increase traffic (e.g., 10%, 25%, 50%, 100%) until the new version completely replaces the old.`
      },
      {
        id: 'nginx-canary',
        type: 'implementation',
        title: 'Traffic Splitting with NGINX Ingress',
        content: `To implement a Canary, we need two separate Deployments and two Services (production and canary). We then use a second Ingress resource with specific NGINX annotations that instruct the Ingress Controller to route a percentage of traffic destined for the main domain over to the canary service.`,
        codeExample: {
          id: 'canary-ingress',
          language: 'yaml',
          title: 'Canary Ingress Annotations',
          filename: 'ingress-canary.yaml',
          code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fastapi-canary-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    # Enable canary behavior
    nginx.ingress.kubernetes.io/canary: "true"
    # Route 10% of traffic to this ingress's backend
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
  - host: api.myproductionapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fastapi-canary-svc # Points to new version pods
            port:
              number: 80`
        }
      },
      {
        id: 'flagger-automation',
        type: 'architecture',
        title: 'Automated Progressive Delivery',
        content: `Manually editing YAML files to adjust weights (10%, then 20%...) and checking Grafana dashboards manually is error-prone.

Enter **Flagger** (part of the Flux ecosystem). Flagger automates the entire process. You define a \`Canary\` custom resource. Flagger talks to your Service Mesh (Istio, Linkerd) or Ingress (NGINX), sets the initial weight to 5%, queries Prometheus for error rates and latency, and automatically promotes or rolls back the deployment based on the metrics.`
      }
    ],
    challenges: [
      {
        id: 'header-canary',
        title: 'Targeted Canary Testing',
        description: 'Instead of random percentage traffic splitting, how can you configure the NGINX canary ingress to ONLY route traffic to the canary deployment if a specific HTTP header `X-Canary: always` is present?',
        hint: 'NGINX ingress supports canary by header annotations.',
        solution: 'You replace the `canary-weight` annotation with header-based routing annotations. This allows QA teams to test the production canary safely before opening it to real users.',
        solutionCode: {
          id: 'header-yaml',
          language: 'yaml',
          title: 'Header Canary Annotation',
          filename: 'snippet.yaml',
          code: `annotations:
  nginx.ingress.kubernetes.io/canary: "true"
  nginx.ingress.kubernetes.io/canary-by-header: "X-Canary"
  nginx.ingress.kubernetes.io/canary-by-header-value: "always"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'canary-vs-bluegreen',
        question: 'When would you choose Canary deployments over Blue/Green deployments?',
        answer: 'You choose Canary when you want to minimize the blast radius of a potential bug. Blue/Green cuts 100% of traffic instantly; if there is a subtle bug not caught in testing, all users are impacted. Canary exposes the bug to only 5% of users. However, Canary is more complex to set up and requires highly reliable automated observability (Prometheus) to evaluate the canary\'s health.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'baseline-comparison',
        severity: 'info',
        content: 'When evaluating a canary, don\'t compare it to historical metrics. Traffic patterns change. Instead, spin up a small "baseline" deployment of the old code alongside the canary, receiving the same 5% traffic, and compare the canary directly against the baseline to eliminate environmental variables.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'sticky-sessions',
        scenario: 'Canary Session Breakage',
        problem: 'A frontend SPA made multiple sequential API calls. During a 10% canary split, requests randomly bounced between the production v1 API and the canary v2 API, causing payload incompatibility and frontend crashes.',
        solution: 'Enabled session affinity (sticky sessions) via cookie routing in the NGINX canary annotations. This ensured that once a user was routed to the canary, all subsequent requests from that user stayed on the canary.'
      }
    ],
    commonMistakes: [
      {
        id: 'manual-canary',
        title: 'Replica-based Canary (Poor Man\'s Canary)',
        description: 'Trying to achieve canary routing by running 9 pods of v1 and 1 pod of v2 behind the same Service without an Ingress controller/Mesh managing weights.',
        badCode: {
          id: 'replica-canary',
          language: 'yaml',
          title: '❌ Wrong Way',
          code: `# Scaling v1 to 9 and v2 to 1. 
# It works roughly as 10%, but you have zero control over session stickiness, headers, or metric-based automated rollback.`
        },
        goodCode: {
          id: 'ingress-canary',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `# Use Ingress annotations or a Service Mesh to cleanly split traffic independent of pod scaling.`
        }
      }
    ],
    codeExamples: [],
  },
  'stateful-workloads': {
    id: '21-11',
    slug: 'stateful-workloads',
    chapterId: 21,
    order: 11,
    title: 'StatefulSets for Databases',
    description: 'Run stateful applications like PostgreSQL and Redis securely on Kubernetes.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.kubernetes, technologies.postgresql, technologies.redis],
    prerequisites: ['21-02'],
    objectives: [
      'Use StatefulSets for ordered pod naming',
      'Configure PersistentVolumeClaims for storage',
      'Configure pod anti-affinity for HA placement',
      'Backup StatefulSet data in production'
    ],
    sections: [
      {
        id: 'statefulset-concept',
        type: 'concept',
        title: 'Deployments vs StatefulSets',
        content: `FastAPI is stateless; any pod can handle any request, and pods can be destroyed at random. Databases like PostgreSQL or Redis are stateful. They write data to disk. 

If you use a Deployment for a database, and the pod restarts on a different node, it loses its disk data (ephemeral storage). Furthermore, Deployments create pods with random hashes (\`db-7d58f55c-x\`). Distributed databases rely on stable network identities to form clusters (knowing who the master and replicas are).

A **StatefulSet** provides:
1. **Stable Network Identity**: Pods are created sequentially (\`db-0\`, \`db-1\`, \`db-2\`). If \`db-0\` dies, it is restarted with the exact same name and DNS address.
2. **Stable Storage**: Every pod gets its own dedicated PersistentVolume. If \`db-0\` moves to a new node, its specific disk is detached and moved with it.`
      },
      {
        id: 'pvc-volumes',
        type: 'implementation',
        title: 'PersistentVolumeClaims (PVC)',
        content: `To get stable storage, a StatefulSet uses a \`volumeClaimTemplate\`. When the StatefulSet creates \`db-0\`, it dynamically provisions a real cloud disk (like AWS EBS) using a StorageClass, and binds it to that pod.`,
        codeExample: {
          id: 'statefulset-yaml',
          language: 'yaml',
          title: 'PostgreSQL StatefulSet',
          filename: 'postgres-sts.yaml',
          code: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        volumeMounts:
        - name: pgdata
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: pgdata
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 50Gi`
        }
      },
      {
        id: 'pod-anti-affinity',
        type: 'architecture',
        title: 'High Availability with Anti-Affinity',
        content: `If you run a 3-node Redis cluster using a StatefulSet, you do not want all 3 pods scheduled onto the *same* physical worker node. If that node crashes, your entire database goes down.

You use **PodAntiAffinity** to instruct the Kubernetes scheduler: "Do not place this pod on a node that already has a pod with label \`app: redis\`." This spreads your stateful workloads evenly across availability zones.`
      }
    ],
    challenges: [
      {
        id: 'headless-service',
        title: 'Create a Headless Service',
        description: 'A StatefulSet requires a "Headless Service" to control the domain of its pods. Write a Service YAML that is headless.',
        hint: 'A headless service skips the load balancer and returns raw pod IPs. Set clusterIP to None.',
        solution: 'Setting `clusterIP: None` tells Kubernetes not to assign a virtual IP. Instead, CoreDNS returns A records pointing directly to the Pod IPs (e.g., `postgres-0.postgres-headless`).',
        solutionCode: {
          id: 'headless-yaml',
          language: 'yaml',
          title: 'Headless Service',
          filename: 'service.yaml',
          code: `apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'statefulset-scaling',
        question: 'What happens when you scale a StatefulSet down from 3 replicas to 2?',
        answer: 'StatefulSets scale down in strict reverse order. It will terminate `pod-2` first. It will NOT delete the PersistentVolumeClaim (PVC) associated with `pod-2`. This ensures data safety; if you scale back up to 3, `pod-2` is recreated and reattaches to its existing data.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'managed-dbs',
        severity: 'critical',
        content: 'While you CAN run databases in Kubernetes, standard industry advice is: DON\'T. Use managed cloud databases (AWS RDS, GCP Cloud SQL) for critical relational data. Operating highly available Postgres clusters in k8s requires specialized knowledge and Operators (like Zalando or CrunchyData). Use K8s for stateless apps; use Cloud for stateful DBs.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'pvc-expand',
        scenario: 'Disk Full Outage',
        problem: 'A Redis StatefulSet hit 100% disk usage on its 10Gi PVC. The pod began crashlooping. Changing the `storage: 20Gi` in the StatefulSet manifest threw an error, as volumeClaimTemplates are immutable.',
        solution: 'You cannot edit the StatefulSet template to expand storage. Instead, we had to edit the underlying PVC object directly (`kubectl edit pvc data-redis-0`) to request 20Gi, which triggered the cloud provider to expand the EBS volume on the fly.'
      }
    ],
    commonMistakes: [
      {
        id: 'deployment-db',
        title: 'Running DBs in Deployments',
        description: 'Using a Deployment for a database causes data loss upon pod rescheduling.',
        badCode: {
          id: 'dep-db',
          language: 'yaml',
          title: '❌ Wrong Way',
          code: `kind: Deployment
metadata:
  name: mongodb`
        },
        goodCode: {
          id: 'sts-db',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `kind: StatefulSet
metadata:
  name: mongodb`
        }
      }
    ],
    codeExamples: [],
  },
  'kubernetes-observability': {
    id: '21-12',
    slug: 'kubernetes-observability',
    chapterId: 21,
    order: 12,
    title: 'Kubernetes Cluster Observability',
    description: 'Monitor cluster health, pod metrics, and node resources using the Prometheus stack.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.kubernetes, technologies.prometheus, technologies.grafana],
    prerequisites: ['21-01'],
    objectives: [
      'Deploy kube-state-metrics for pod metrics',
      'Deploy node-exporter for node metrics',
      'Import Kubernetes Grafana dashboards',
      'Alert on node resource pressure'
    ],
    sections: [
      {
        id: 'observability-concept',
        type: 'concept',
        title: 'The Kubernetes Observability Stack',
        content: `When running microservices in a cluster, traditional server monitoring is insufficient. Pods are ephemeral, IP addresses change, and applications are distributed across many nodes. 

The industry standard observability stack for Kubernetes is **Prometheus** (metrics storage and scraping), **Grafana** (visualization), and **Alertmanager** (routing alerts).

To get cluster-level metrics, we rely on two critical components:
1. **kube-state-metrics**: Connects to the Kubernetes API and generates metrics about the state of objects (e.g., "How many pods are pending?", "Is this deployment fully rolled out?").
2. **node-exporter**: Runs as a DaemonSet on every worker node to export hardware metrics (CPU, RAM, Disk I/O, Network) of the underlying VM/server.`
      },
      {
        id: 'daemonset-exporter',
        type: 'implementation',
        title: 'Deploying Node Exporter via DaemonSet',
        content: `A **DaemonSet** ensures that exactly one copy of a Pod runs on *every* node in the cluster. When the cluster autoscaler adds a new node, the DaemonSet automatically schedules a node-exporter pod on it.`,
        codeExample: {
          id: 'daemonset-yaml',
          language: 'yaml',
          title: 'Node Exporter DaemonSet',
          filename: 'daemonset.yaml',
          code: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      containers:
      - name: node-exporter
        image: prom/node-exporter:v1.5.0
        ports:
        - containerPort: 9100
          hostPort: 9100`
        }
      },
      {
        id: 'prometheus-alerts',
        type: 'architecture',
        title: 'Critical Cluster Alerts',
        content: `With Prometheus scraping kube-state-metrics and node-exporter, we configure rules to alert us via Slack or PagerDuty before users notice an issue.

Key alerts include:
- **KubePodCrashLooping**: A pod is restarting repeatedly.
- **KubeNodeNotReady**: A worker node has gone offline.
- **NodeMemoryHigh**: A node is running out of RAM, risking OOM kills.
- **KubeDeploymentReplicasMismatch**: A deployment cannot reach its desired replica count (often due to scheduling failures).`
      }
    ],
    challenges: [
      {
        id: 'promql-challenge',
        title: 'PromQL CrashLoop Alert',
        description: 'Write a PromQL expression that returns true if a container has restarted more than 5 times in the last 10 minutes.',
        hint: 'Use the `kube_pod_container_status_restarts_total` metric and the `increase()` function.',
        solution: 'The `increase()` function calculates the absolute increase in a counter over a time window. This is the exact query used by Prometheus Alertmanager to trigger CrashLoopBackOff alerts.',
        solutionCode: {
          id: 'promql-query',
          language: 'promql',
          title: 'PromQL Query',
          filename: 'alert.rules',
          code: `increase(kube_pod_container_status_restarts_total[10m]) > 5`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'metrics-server-vs-prometheus',
        question: 'What is the difference between the Kubernetes metrics-server and Prometheus?',
        answer: 'metrics-server is a lightweight, in-memory system used purely by the core Kubernetes API (specifically for the Horizontal Pod Autoscaler and `kubectl top`). It does not store historical data. Prometheus is a heavy-duty time-series database meant for long-term storage, advanced querying (PromQL), custom application metrics, and alerting.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'kube-prometheus-stack',
        severity: 'info',
        content: 'Do not deploy Prometheus, Grafana, and Alertmanager manually using raw YAMLs. Use the `kube-prometheus-stack` Helm chart. It bundles the entire stack, pre-configured with dozens of industry-standard dashboards and alerting rules specifically designed for Kubernetes.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'ephemeral-disk-full',
        scenario: 'The Silent Node Killer',
        problem: 'Application pods were randomly being evicted from nodes. CPU and Memory alerts were completely green.',
        solution: 'The application was writing temporary files to local disk instead of stdout or a PVC. The node\'s ephemeral root disk filled up (Disk Pressure). Added Prometheus alerts for `node_filesystem_avail_bytes` to catch disk exhaustion before kubelet eviction kicks in.'
      }
    ],
    commonMistakes: [
      {
        id: 'missing-limits-monitoring',
        title: 'Ignoring OOMKills',
        description: 'Relying only on application-level exception tracking (like Sentry) and missing container crashes.',
        badCode: {
          id: 'bad-monitor',
          language: 'python',
          title: '❌ Wrong Way',
          code: `# Thinking Sentry will catch all errors. 
# Sentry cannot catch an OOMKill because the OS kills the process instantly (SIGKILL) before the Python exception handler runs.`
        },
        goodCode: {
          id: 'good-monitor',
          language: 'yaml',
          title: '✅ Correct Way',
          code: `# Configure Prometheus alerts for the specific OOMKill metric:
# kube_pod_container_status_last_terminated_reason == "OOMKilled"`
        }
      }
    ],
    codeExamples: [],
  }
};
