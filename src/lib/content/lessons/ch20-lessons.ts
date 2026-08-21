import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch20Lessons: Record<string, Lesson> = {
  'nginx-reverse-proxy-fundamentals': {
    id: '20-01',
    slug: 'nginx-reverse-proxy-fundamentals',
    chapterId: 20,
    order: 1,
    title: 'Nginx Reverse Proxy Fundamentals',
    description: 'Learn the core concepts of using Nginx as a reverse proxy for FastAPI applications.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.nginx],
    prerequisites: [],
    objectives: [
      'Configure upstream block for FastAPI backends',
      'Pass correct proxy headers (X-Real-IP, X-Forwarded-For)',
      'Set proxy_pass and location blocks',
      'Test proxy configuration with curl'
    ],
    sections: [
      {
        id: 'proxy-concepts',
        type: 'concept',
        title: 'Understanding Reverse Proxying for FastAPI',
        content: `While Uvicorn (with or without Gunicorn) is excellent at executing asynchronous Python code, it is not designed to be a public-facing web server. It lacks robust connection handling, TLS termination, and protection against slow-loris attacks. This is where Nginx comes in as a reverse proxy.
        
A reverse proxy sits in front of your application servers, receiving client requests and forwarding them to the appropriate backend. Nginx handles the heavy lifting of raw TCP connections, buffering slow client requests, and ensuring that Uvicorn only receives fully-formed HTTP requests that it can process quickly.

To configure this, we define an \`upstream\` block that points to our FastAPI instances, and a \`server\` block that listens on public ports and proxies traffic using the \`proxy_pass\` directive.`
      },
      {
        id: 'proxy-implementation',
        type: 'implementation',
        title: 'Basic Proxy Configuration',
        content: `Here is a fundamental Nginx configuration that proxies traffic to a FastAPI backend running on port 8000. It ensures that the client's original IP and protocol information is preserved by setting standard proxy headers.`,
        codeExample: {
          id: 'basic-proxy',
          language: 'nginx',
          title: 'nginx.conf',
          filename: 'nginx.conf',
          code: `http {
    # Define the backend FastAPI servers
    upstream fastapi_backend {
        server 127.0.0.1:8000;
    }

    server {
        listen 80;
        server_name api.example.com;

        location / {
            # Forward requests to the upstream
            proxy_pass http://fastapi_backend;

            # Pass essential headers to the backend
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Optional: Disable buffering for immediate response streaming
            # proxy_buffering off;
        }
    }
}`
        }
      },
      {
        id: 'docker-compose-setup',
        type: 'architecture',
        title: 'Nginx + FastAPI in Docker Compose',
        content: `In a containerized environment, Nginx and FastAPI typically run in separate containers. Docker's internal DNS handles resolving the FastAPI container name to its IP address, making the configuration even simpler.`,
        codeExample: {
          id: 'docker-proxy-setup',
          title: 'Docker Nginx Setup',
          files: {
            'docker-compose.yml': {
              language: 'yaml',
              code: `version: '3.8'
services:
  api:
    build: .
    expose:
      - "8000"
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api`
            },
            'nginx.conf': {
              language: 'nginx',
              code: `events {}
http {
    upstream fastapi {
        # 'api' matches the docker-compose service name
        server api:8000;
    }

    server {
        listen 80;
        location / {
            proxy_pass http://fastapi;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'challenge-proxy-headers',
        title: 'Configure Forwarded Headers',
        description: 'Configure Nginx to proxy requests to an upstream named "auth_service", but ensure that a custom header "X-Proxy-Route" is injected with the value "nginx-ingress".',
        hint: 'Use the proxy_set_header directive inside your location block.',
        solution: 'Use proxy_set_header to inject custom headers into the upstream request.',
        solutionCode: {
          id: 'sol-proxy-headers',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `location /auth {
    proxy_pass http://auth_service;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Proxy-Route "nginx-ingress";
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-proxy-headers',
        question: 'Why do we need to set X-Forwarded-For and X-Real-IP headers in Nginx?',
        answer: 'When a request passes through a proxy, the backend application sees the connection originating from the proxy\'s IP address, not the client\'s. These headers preserve the original client IP and the chain of proxies the request passed through, which is essential for rate limiting, auditing, and geographic routing within the FastAPI application.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-uvicorn-forwarded',
        severity: 'critical',
        content: 'When using Nginx with FastAPI, you MUST configure Uvicorn to trust forwarded headers (e.g., --proxy-headers and --forwarded-allow-ips), otherwise FastAPI will see the proxy\'s IP address and potentially the wrong HTTP scheme (http instead of https).'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-ip-spoofing',
        scenario: 'IP Spoofing via Headers',
        problem: 'A rate-limiting implementation in FastAPI relied on the X-Forwarded-For header, but clients were injecting fake X-Forwarded-For headers to bypass limits.',
        solution: 'Nginx was configured to overwrite any client-provided X-Forwarded-For headers with the actual IP address ($remote_addr) for direct connections, or strictly append it using $proxy_add_x_forwarded_for in a multi-tier proxy architecture.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-trailing-slash',
        title: 'Trailing Slashes in proxy_pass',
        description: 'Adding or omitting a trailing slash in proxy_pass dramatically changes how Nginx resolves the URI.',
        badCode: {
          id: 'bad-slash',
          language: 'nginx',
          title: '❌ Wrong Way (Strips /api)',
          code: `location /api/ {
    # The trailing slash means Nginx will strip /api/ from the URL
    proxy_pass http://backend/;
}`
        },
        goodCode: {
          id: 'good-slash',
          language: 'nginx',
          title: '✅ Correct Way (Preserves URI)',
          code: `location /api/ {
    # No trailing slash passes the full URI unchanged
    proxy_pass http://backend;
}`
        }
      }
    ],
    codeExamples: [],
  },
  'tls-https-setup': {
    id: '20-02',
    slug: 'tls-https-setup',
    chapterId: 20,
    order: 2,
    title: 'TLS/HTTPS Configuration',
    description: 'Secure your FastAPI deployments by configuring robust TLS and HTTPS termination in Nginx.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.nginx],
    prerequisites: ['20-01'],
    objectives: [
      'Obtain certificates from Lets Encrypt with Certbot',
      'Configure modern TLS cipher suites',
      'Enable HSTS and OCSP stapling',
      'Configure automatic certificate renewal'
    ],
    sections: [
      {
        id: 'tls-concepts',
        type: 'concept',
        title: 'TLS Termination at the Edge',
        content: `Managing SSL/TLS certificates inside Python application servers is complex, inefficient, and requires frequent restarts. The industry standard practice is 'TLS Termination'—handling HTTPS encryption entirely at the reverse proxy layer (Nginx) and communicating over plain HTTP to the local backend instances.

By terminating TLS at Nginx, we benefit from highly optimized OpenSSL implementations, hardware acceleration (if available), and simplified certificate management using tools like Certbot and Let's Encrypt. The proxy then passes the 'X-Forwarded-Proto: https' header so FastAPI knows the client connected securely, ensuring URLs generated by the app use the correct scheme.`
      },
      {
        id: 'tls-implementation',
        type: 'implementation',
        title: 'Modern TLS Configuration',
        content: `A secure TLS configuration disables outdated protocols (like TLSv1.0 and 1.1), specifies strong cipher suites, and enables advanced features like OCSP stapling and HTTP Strict Transport Security (HSTS).`,
        codeExample: {
          id: 'tls-config',
          language: 'nginx',
          title: 'nginx.conf (TLS)',
          filename: 'nginx.conf',
          code: `server {
    listen 80;
    server_name api.example.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # Certificate locations (usually managed by certbot)
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # Modern TLS settings (Mozilla Modern profile)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Session caching for better performance
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;

    # HSTS (requires HTTPS)
    add_header Strict-Transport-Security "max-age=63072000" always;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 1.1.1.1 valid=300s;
    resolver_timeout 5s;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme; # Crucial for FastAPI
    }
}`
        }
      },
      {
        id: 'certbot-automation',
        type: 'production',
        title: 'Automating Let\'s Encrypt with Certbot',
        content: `In production, you should never manage certificates manually. Certbot automates obtaining and renewing certificates from Let's Encrypt. For Nginx, the \`--nginx\` plugin can automatically modify your configuration files to insert the correct \`ssl_certificate\` paths.
        
To ensure zero downtime, set up a cron job or systemd timer to run \`certbot renew --quiet\`. When a certificate is renewed, certbot will automatically reload Nginx without dropping active connections.`
      }
    ],
    challenges: [
      {
        id: 'challenge-http-redirect',
        title: 'Force HTTPS Redirect',
        description: 'Write an Nginx server block that listens on port 80 and redirects all traffic to the exact same URI on HTTPS.',
        hint: 'Use the return directive with a 301 status code and Nginx variables.',
        solution: 'Using a 301 return is more efficient than a rewrite rule for HTTPS redirection.',
        solutionCode: {
          id: 'sol-https-redirect',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `server {
    listen 80;
    server_name myapi.com;
    return 301 https://$host$request_uri;
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-hsts',
        question: 'What is HSTS and why should it be enabled on an API?',
        answer: 'HTTP Strict Transport Security (HSTS) is a header that instructs the client (browser or HTTP client) to only communicate with the server over HTTPS, even if the user typed http://. It prevents downgrade attacks and ensures future connections are automatically secure without requiring an initial redirect.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-dhparam',
        severity: 'warning',
        content: 'For maximum security, generate a custom Diffie-Hellman parameter file using `openssl dhparam -out /etc/nginx/dhparam.pem 2048` and reference it in Nginx using `ssl_dhparam`.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-expired-cert',
        scenario: 'The Silent Certificate Expiry',
        problem: 'An API went down because Let\'s Encrypt certificates expired. The automated renewal failed because Nginx was aggressively rate-limiting the /.well-known/acme-challenge/ path used by Certbot.',
        solution: 'Added a specific location block for /.well-known/acme-challenge/ that bypassed rate limits and served files directly from a dedicated webroot directory, bypassing the FastAPI proxy.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-proxy-proto',
        title: 'Missing X-Forwarded-Proto Header',
        description: 'Failing to pass the protocol scheme to FastAPI causes issues with generated URLs (like OAuth2 redirects).',
        badCode: {
          id: 'bad-proto',
          language: 'nginx',
          title: '❌ Wrong Way (FastAPI thinks it is HTTP)',
          code: `proxy_set_header Host $host;
# Missing X-Forwarded-Proto`
        },
        goodCode: {
          id: 'good-proto',
          language: 'nginx',
          title: '✅ Correct Way',
          code: `proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;`
        }
      }
    ],
    codeExamples: [],
  },
  'load-balancing': {
    id: '20-03',
    slug: 'load-balancing',
    chapterId: 20,
    order: 3,
    title: 'Load Balancing Algorithms',
    description: 'Scale your FastAPI backends horizontally using Nginx load balancing features.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.nginx],
    prerequisites: ['20-01'],
    objectives: [
      'Configure round-robin, least-connections, and IP-hash',
      'Add health checks to upstream servers',
      'Configure upstream weights for gradual traffic shifts',
      'Implement backup servers for failover'
    ],
    sections: [
      {
        id: 'lb-concepts',
        type: 'concept',
        title: 'Scaling Out with Upstream Load Balancing',
        content: `When a single FastAPI instance can no longer handle the traffic volume, we scale horizontally by adding more instances. Nginx acts as the load balancer, distributing incoming requests across a pool of backend servers defined in an \`upstream\` block.
        
By default, Nginx uses a Round Robin algorithm, sending requests to each server sequentially. However, APIs with varied request processing times might benefit from \`least_conn\` (routing to the server with the fewest active connections), while stateful applications (which you should avoid in REST APIs) might use \`ip_hash\` for sticky sessions.`
      },
      {
        id: 'lb-implementation',
        type: 'implementation',
        title: 'Load Balancing Configuration',
        content: `This example demonstrates advanced load balancing: it uses the least connections algorithm, assigns different weights to servers (perhaps because one runs on faster hardware), marks a server as a fallback backup, and configures passive health checks (max_fails).`,
        codeExample: {
          id: 'lb-config',
          language: 'nginx',
          title: 'nginx.conf (Load Balancing)',
          filename: 'nginx.conf',
          code: `http {
    upstream api_servers {
        # Use least connected algorithm instead of round-robin
        least_conn;

        # Primary servers with health check parameters
        # max_fails: number of failures before marking down
        # fail_timeout: time to wait before trying again
        server 10.0.0.10:8000 weight=3 max_fails=3 fail_timeout=30s;
        server 10.0.0.11:8000 weight=1 max_fails=3 fail_timeout=30s;
        
        # Backup server only receives traffic if primaries are down
        server 10.0.0.12:8000 backup;
    }

    server {
        listen 80;
        server_name api.example.com;

        location / {
            proxy_pass http://api_servers;
            
            # Standard proxy headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            
            # Retry next server if the current one fails or times out
            proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
        }
    }
}`
        }
      },
      {
        id: 'active-health-checks',
        type: 'production',
        title: 'Passive vs Active Health Checks',
        content: `The open-source version of Nginx only supports passive health checks—it monitors actual client requests, and if a server returns a 502/timeout, it increments a failure counter. If \`max_fails\` is reached within \`fail_timeout\`, the server is marked offline. 
        
This means some users might experience errors before Nginx detects a down server. To mitigate this, ensure your \`proxy_next_upstream\` directive is configured to transparently retry failed requests on a different server so the client never sees the error.`
      }
    ],
    challenges: [
      {
        id: 'challenge-ip-hash',
        title: 'Implement Sticky Sessions',
        description: 'Modify an upstream block named "ml_backend" to ensure that requests from the same client IP address always go to the same backend server.',
        hint: 'Look for the ip_hash directive.',
        solution: 'The ip_hash directive uses the client\'s IP address to compute a hash that determines the backend server.',
        solutionCode: {
          id: 'sol-ip-hash',
          language: 'nginx',
          title: 'Solution',
          filename: 'nginx.conf',
          code: `upstream ml_backend {
    ip_hash;
    server 192.168.1.10:8000;
    server 192.168.1.11:8000;
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-lb-algorithms',
        question: 'When would you prefer least_conn over round-robin for a FastAPI application?',
        answer: 'least_conn is preferable when the API endpoints have highly variable processing times. For example, if some requests trigger heavy machine learning inferences while others are quick database lookups, round-robin might inadvertently send multiple heavy requests to the same server, overloading it. least_conn dynamically balances based on current load.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-proxy-next-upstream',
        severity: 'warning',
        content: 'Be careful using proxy_next_upstream with non-idempotent POST requests. If a request reaches the backend but times out responding to Nginx, Nginx might retry the POST on another server, potentially duplicating database inserts.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-thundering-herd',
        scenario: 'The Startup Thundering Herd',
        problem: 'When doing a rolling restart, a single new FastAPI instance came online before others and immediately received a massive spike of traffic, overwhelming it instantly.',
        solution: 'Implemented a slow-start mechanism using external scripts and health checks, and utilized the Nginx Plus `slow_start` parameter (or adjusted weight manually via configuration management) to gradually ramp up traffic to new nodes.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-stateful-backends',
        title: 'Relying on Nginx Sticky Sessions for Auth',
        description: 'Using ip_hash because your authentication state is stored in memory on a single FastAPI instance.',
        badCode: {
          id: 'bad-state',
          language: 'nginx',
          title: '❌ Bad Architecture',
          code: `upstream api {
    ip_hash; # Used to mask a bad, stateful backend design
}`
        },
        goodCode: {
          id: 'good-state',
          language: 'nginx',
          title: '✅ Correct Architecture',
          code: `upstream api {
    least_conn; # Backends should be stateless, storing sessions in Redis
}`
        }
      }
    ],
    codeExamples: [],
  },
  'websocket-proxying': {
    id: '20-04',
    slug: 'websocket-proxying',
    chapterId: 20,
    order: 4,
    title: 'WebSocket Proxying',
    description: 'Properly configure Nginx to proxy long-lived bidirectional WebSocket connections for real-time FastAPI endpoints.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.nginx, technologies.websockets],
    prerequisites: ['20-01'],
    objectives: [
      'Set Upgrade and Connection headers for WebSocket',
      'Configure proxy_read_timeout for long-lived connections',
      'Test WebSocket proxying with wscat',
      'Handle WebSocket connection pooling in Nginx'
    ],
    sections: [
      {
        id: 'websocket-concepts',
        type: 'concept',
        title: 'The HTTP Upgrade Mechanism',
        content: `FastAPI natively supports WebSockets, enabling real-time bidirectional communication. However, Nginx does not proxy WebSockets out of the box. 
        
A WebSocket connection begins as a standard HTTP/1.1 request containing specific \`Upgrade: websocket\` and \`Connection: Upgrade\` headers. The server responds with a 101 Switching Protocols status, and the TCP connection is kept open. By default, Nginx intercepts and drops these headers, preventing the upgrade. We must explicitly configure Nginx to pass these headers to the FastAPI backend.`
      },
      {
        id: 'websocket-implementation',
        type: 'implementation',
        title: 'WebSocket Proxy Configuration',
        content: `To enable WebSocket proxying, we dynamically determine the value of the Connection header based on the presence of the Upgrade header, and set a longer timeout, as WebSockets are idle for long periods.`,
        codeExample: {
          id: 'ws-config',
          language: 'nginx',
          title: 'nginx.conf (WebSockets)',
          filename: 'nginx.conf',
          code: `http {
    # If the client sends an Upgrade header, we set Connection to "upgrade"
    # Otherwise, we default to "close"
    map $http_upgrade $connection_upgrade {
        default upgrade;
        ''      close;
    }

    upstream fastapi_ws {
        server 127.0.0.1:8000;
    }

    server {
        listen 80;
        server_name ws.example.com;

        # Specific location for WebSockets
        location /ws/ {
            proxy_pass http://fastapi_ws;
            
            # Standard headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            
            # WebSocket specific headers
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            
            # Crucial: Increase timeouts for long-lived idle connections
            # Default is 60s, which will prematurely drop quiet WebSockets
            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
        }
    }
}`
        }
      },
      {
        id: 'websocket-production',
        type: 'production',
        title: 'Worker Connections and Limits',
        content: `WebSockets fundamentally change how Nginx utilizes resources. Standard HTTP requests consume a worker connection for a few milliseconds. A WebSocket holds that connection open indefinitely.
        
Ensure your Nginx \`worker_connections\` directive (in the \`events\` block) is set high enough to handle your peak concurrent WebSocket users, multiplied by the fact that Nginx uses 2 connections per proxy (one to client, one to backend). A setting of \`worker_connections 10240;\` is common for real-time apps.`
      }
    ],
    challenges: [
      {
        id: 'challenge-ws-timeout',
        title: 'Fixing Disconnecting Sockets',
        description: 'Users of your real-time chat app complain that they are randomly disconnected if no one sends a message for exactly one minute. Update the Nginx proxy settings to prevent this.',
        hint: 'Nginx closes proxy connections after 60 seconds of inactivity by default.',
        solution: 'Increase proxy_read_timeout and proxy_send_timeout to a duration longer than your expected idle time (or longer than your application-level ping/pong interval).',
        solutionCode: {
          id: 'sol-ws-timeout',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `location /ws/ {
    proxy_pass http://backend;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_read_timeout 1d; # Keep alive for 1 day of idle
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-ws-upgrade',
        question: 'Explain the mechanism of how Nginx handles a WebSocket connection upgrade.',
        answer: 'Nginx natively parses HTTP. When a client requests a WebSocket, it sends an HTTP GET with an "Upgrade: websocket" header. Nginx must be configured to proxy these exact headers to the backend. When the backend (FastAPI) replies with a 101 Switching Protocols response, Nginx switches the connection into a raw TCP tunnel, streaming bytes back and forth without interpreting them as HTTP requests until the connection is closed.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-ws-ping',
        severity: 'info',
        content: 'Instead of setting an infinitely long proxy_read_timeout, implement WebSocket ping/pong frames in your FastAPI application (or client side) to keep the connection active and detect disconnected clients rapidly.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-file-descriptor-exhaustion',
        scenario: 'File Descriptor Exhaustion during an Event',
        problem: 'During a live event, a real-time leaderboard app crashed Nginx. Error logs showed "worker_connections are not enough" and "Too many open files".',
        solution: 'Increased the OS level file descriptor limits (ulimit -n) and increased `worker_connections` in Nginx from 1024 to 65535, recognizing that WebSockets hold connections open.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-hardcoding-connection',
        title: 'Hardcoding Connection Header Globally',
        description: 'Setting Connection to "upgrade" globally breaks HTTP keep-alives for standard requests.',
        badCode: {
          id: 'bad-ws-header',
          language: 'nginx',
          title: '❌ Wrong Way (Breaks normal HTTP)',
          code: `proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade"; # Applies to ALL requests`
        },
        goodCode: {
          id: 'good-ws-header',
          language: 'nginx',
          title: '✅ Correct Way (Dynamic resolution)',
          code: `map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
# Later in config:
proxy_set_header Connection $connection_upgrade;`
        }
      }
    ],
    codeExamples: [],
  },
  'compression-performance': {
    id: '20-05',
    slug: 'compression-performance',
    chapterId: 20,
    order: 5,
    title: 'Compression & Performance Tuning',
    description: 'Optimize API response times and throughput using Gzip, keepalives, and system tuning.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.nginx],
    prerequisites: ['20-01'],
    objectives: [
      'Enable Gzip compression for API responses',
      'Configure worker_processes and worker_connections',
      'Enable keepalive connections to upstream',
      'Use sendfile for static file serving'
    ],
    sections: [
      {
        id: 'perf-concepts',
        type: 'concept',
        title: 'Performance Layers in Nginx',
        content: `Nginx performance tuning for a FastAPI backend revolves around three core areas: reducing payload size (compression), reusing TCP connections (keepalives), and optimizing Nginx's usage of underlying OS resources (workers and sendfile).
        
JSON responses from APIs are highly text-heavy and compress exceptionally well. By offloading Gzip or Brotli compression to Nginx, we free up the Python process (which is bound by the GIL) from doing CPU-intensive compression work, allowing it to serve more requests per second.`
      },
      {
        id: 'perf-implementation',
        type: 'implementation',
        title: 'Tuning Configuration',
        content: `This configuration demonstrates enabling aggressive Gzip compression specifically targeted at JSON, setting up upstream keepalives to prevent TCP handshake overhead with FastAPI, and tuning OS-level worker usage.`,
        codeExample: {
          id: 'perf-config',
          language: 'nginx',
          title: 'nginx.conf (Performance)',
          filename: 'nginx.conf',
          code: `user www-data;
# Auto detects number of CPU cores
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 8192;
    # Optmized event polling on Linux
    use epoll;
    multi_accept on;
}

http {
    # --- Compression Settings ---
    gzip on;
    gzip_comp_level 5; # 5 is the sweet spot between CPU usage and compression ratio
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    
    # Crucial: Target JSON and other API-specific mime types
    gzip_types
        application/json
        application/xml
        text/css
        text/plain
        application/javascript;

    # --- Upstream Keepalives ---
    upstream fastapi_pool {
        server 127.0.0.1:8000;
        # Maintain 32 idle connections to the upstream
        keepalive 32;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://fastapi_pool;
            
            # Required for upstream keepalives to work (HTTP/1.1)
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            
            proxy_set_header Host $host;
        }
    }
}`
        }
      },
      {
        id: 'keepalive-architecture',
        type: 'architecture',
        title: 'The Value of Upstream Keepalives',
        content: `By default, Nginx opens a new TCP connection to the backend FastAPI server for every single incoming request, and closes it immediately after. This creates massive overhead (TCP handshakes, ephemeral port exhaustion, TIME_WAIT sockets).
        
By setting \`keepalive\` in the \`upstream\` block and forcing HTTP/1.1 via \`proxy_http_version\`, Nginx maintains a pool of persistent connections to Uvicorn, drastically reducing latency and CPU usage on both ends.`
      }
    ],
    challenges: [
      {
        id: 'challenge-gzip-json',
        title: 'Compress JSON Responses',
        description: 'You noticed that large 2MB JSON responses from your API are not being compressed, despite gzip being set to "on". Fix the configuration.',
        hint: 'Nginx only compresses text/html by default.',
        solution: 'You must explicitly add application/json to the gzip_types directive.',
        solutionCode: {
          id: 'sol-gzip-json',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `gzip on;
gzip_types application/json;
gzip_min_length 1000;`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-compression-location',
        question: 'Should you enable Gzip compression in FastAPI (via GZipMiddleware) or in Nginx? Why?',
        answer: 'You should almost always enable compression in Nginx, not FastAPI. Compression is CPU intensive. Python, especially due to the Global Interpreter Lock (GIL), is not efficient at concurrent heavy CPU tasks. Offloading this to Nginx (which is highly optimized in C) frees the Python event loop to handle more requests.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-brotli',
        severity: 'info',
        content: 'Consider compiling Nginx with the Brotli module. Brotli consistently outperforms Gzip for JSON payloads, providing smaller file sizes with comparable CPU usage.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-port-exhaustion',
        scenario: 'Ephemeral Port Exhaustion',
        problem: 'Under high load, Nginx started throwing 502 errors. The server had thousands of sockets in TIME_WAIT state, exhausting available local ports.',
        solution: 'Enabled upstream keepalives in Nginx (using `keepalive`, `proxy_http_version 1.1`, and clearing the `Connection` header) to reuse connections to FastAPI, reducing new TCP handshakes and eliminating TIME_WAIT buildup.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-keepalive',
        title: 'Incomplete Keepalive Configuration',
        description: 'Setting keepalive in the upstream block but forgetting the HTTP/1.1 settings in the proxy block renders it useless.',
        badCode: {
          id: 'bad-keep',
          language: 'nginx',
          title: '❌ Wrong Way (Fails to use Keepalives)',
          code: `upstream api {
    server 127.0.0.1:8000;
    keepalive 32;
}
location / {
    proxy_pass http://api;
    # Nginx defaults to HTTP/1.0 to upstreams, which closes connections
}`
        },
        goodCode: {
          id: 'good-keep',
          language: 'nginx',
          title: '✅ Correct Way',
          code: `upstream api {
    server 127.0.0.1:8000;
    keepalive 32;
}
location / {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}`
        }
      }
    ],
    codeExamples: [],
  },
  'nginx-security-headers': {
    id: '20-06',
    slug: 'nginx-security-headers',
    chapterId: 20,
    order: 6,
    title: 'Security Headers in Nginx',
    description: 'Harden your API perimeter by injecting HTTP security headers and restricting payloads at the proxy layer.',
    duration: 35,
    difficulty: 'expert',
    technologies: [technologies.nginx],
    prerequisites: ['20-01'],
    objectives: [
      'Add HSTS, CSP, X-Frame-Options in Nginx',
      'Block server version disclosure',
      'Configure client_max_body_size limits',
      'Implement basic DDoS mitigation with limit_req'
    ],
    sections: [
      {
        id: 'security-concepts',
        type: 'concept',
        title: 'Hardening the Perimeter',
        content: `While FastAPI can inject security headers via middleware, it is a best practice to enforce baseline security at the outermost layer of your infrastructure: Nginx. This ensures that even static files or error pages (like 502 Bad Gateway) generated directly by Nginx carry the correct security posture.
        
Security headers instruct browsers on how to handle content, preventing XSS, clickjacking, and MIME-sniffing. Additionally, Nginx is excellent at rejecting oversized payloads or malformed requests long before they consume Python memory.`
      },
      {
        id: 'security-implementation',
        type: 'implementation',
        title: 'Security Configuration',
        content: `Here is a comprehensive block of security headers and payload restrictions suitable for a JSON API.`,
        codeExample: {
          id: 'security-config',
          language: 'nginx',
          title: 'nginx.conf (Security)',
          filename: 'nginx.conf',
          code: `http {
    # Don't send Nginx version number in error pages or Server header
    server_tokens off;

    # Protect against Clickjacking
    add_header X-Frame-Options "DENY" always;
    
    # Protect against MIME sniffing vulnerabilities
    add_header X-Content-Type-Options "nosniff" always;
    
    # XSS Protection (mostly legacy, but good for older browsers)
    add_header X-XSS-Protection "1; mode=block" always;
    
    # HSTS - Force HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Content Security Policy (Basic API profile)
    add_header Content-Security-Policy "default-src 'none'; frame-ancestors 'none';" always;

    server {
        listen 443 ssl;
        
        # Limit the max upload size to prevent memory exhaustion / DoS
        # E.g., reject any request body larger than 5 Megabytes
        client_max_body_size 5M;
        
        # Timeout aggressive slow-loris attacks
        client_body_timeout 10s;
        client_header_timeout 10s;

        location / {
            proxy_pass http://fastapi;
        }
    }
}`
        }
      },
      {
        id: 'hide-server-tokens',
        type: 'production',
        title: 'Information Disclosure',
        content: `By default, Nginx returns its exact version number (e.g., \`Server: nginx/1.23.4\`). If a vulnerability is found in that specific version, automated scanners will immediately target your server. Setting \`server_tokens off;\` removes the version number. You should also ensure FastAPI/Uvicorn isn't sending a \`Server: uvicorn\` header by customizing the Uvicorn initialization if necessary, or stripping it in Nginx using \`proxy_hide_header Server;\`.`
      }
    ],
    challenges: [
      {
        id: 'challenge-body-size',
        title: 'Restrict Upload Sizes',
        description: 'You have a generic API where most requests are small JSON payloads (< 100KB), but one specific endpoint `/upload/image` needs to accept files up to 10MB. Configure Nginx to enforce this securely.',
        hint: 'You can set client_max_body_size differently inside specific location blocks.',
        solution: 'Set a restrictive global client_max_body_size, and override it with a larger value inside the specific location block for the upload endpoint.',
        solutionCode: {
          id: 'sol-body-size',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `server {
    # Global default: very small
    client_max_body_size 100K;

    location / {
        proxy_pass http://backend;
    }

    location /upload/image {
        # Specific override: 10 Megabytes
        client_max_body_size 10M;
        proxy_pass http://backend;
    }
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-nosniff',
        question: 'What attack does the X-Content-Type-Options: nosniff header prevent?',
        answer: 'It prevents MIME sniffing. Without it, if a user uploads a malicious script disguised with a .jpg extension (or text/plain content type), the browser might analyze the content, realize it is JavaScript, and execute it in the context of the site, leading to XSS. "nosniff" forces the browser to strictly honor the declared Content-Type header.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-always',
        severity: 'warning',
        content: 'When using add_header, always append the "always" parameter. Without "always", Nginx will NOT add the headers to error responses (like 400, 404, 500), leaving those pages vulnerable to exploitation.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-slow-loris',
        scenario: 'The Slow-Loris Attack',
        problem: 'The FastAPI application became unresponsive. An attacker was opening thousands of connections and sending HTTP headers one byte every 5 seconds, exhausting all worker connections.',
        solution: 'Implemented strict `client_header_timeout 5s;` and `client_body_timeout 5s;` in Nginx, causing the proxy to aggressively sever connections from slow clients before they reached Uvicorn.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-header-inheritance',
        title: 'Nginx add_header Inheritance Trap',
        description: 'If you define add_header in a server block, and then use add_header again inside a location block, the server block headers are COMPLETELY overridden and lost for that location.',
        badCode: {
          id: 'bad-inherit',
          language: 'nginx',
          title: '❌ Wrong Way (Loses HSTS and X-Frame)',
          code: `server {
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    
    location /custom {
        # This completely erases the two headers above for this route!
        add_header Custom-Header "Value";
    }
}`
        },
        goodCode: {
          id: 'good-inherit',
          language: 'nginx',
          title: '✅ Correct Way',
          code: `server {
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    
    location /custom {
        # Must duplicate the server headers
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "DENY" always;
        add_header Custom-Header "Value";
    }
}`
        }
      }
    ],
    codeExamples: [],
  },
  'nginx-rate-limiting': {
    id: '20-07',
    slug: 'nginx-rate-limiting',
    chapterId: 20,
    order: 7,
    title: 'Rate Limiting at the Nginx Layer',
    description: 'Protect your API from abuse and denial-of-service by enforcing rate limits directly at the Nginx edge.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.nginx],
    prerequisites: ['20-01'],
    objectives: [
      'Use limit_req_zone for per-IP rate limiting',
      'Use limit_conn_zone for connection limits',
      'Return custom 429 responses',
      'Whitelist internal networks from rate limiting'
    ],
    sections: [
      {
        id: 'rate-limit-concepts',
        type: 'concept',
        title: 'Why Rate Limit in Nginx?',
        content: `While you can implement rate limiting inside FastAPI using tools like SlowApi or Redis, doing it in Python consumes CPU cycles and application resources. For raw brute-force protection, volumetric DDoS mitigation, or global endpoint limiting, Nginx is vastly more efficient.
        
Nginx uses the leaky bucket algorithm. You define a "zone" (a shared memory space where Nginx tracks states) based on a key (usually the client IP), and then apply that zone to specific locations. Nginx can drop excess requests instantly with a 503 or 429 status code without waking up the Python process.`
      },
      {
        id: 'rate-limit-implementation',
        type: 'implementation',
        title: 'Configuring Zones and Limits',
        content: `In this configuration, we define a rate limit of 10 requests per second per IP. We also use the \`burst\` and \`nodelay\` parameters to allow temporary traffic spikes while still strictly enforcing the long-term rate.`,
        codeExample: {
          id: 'rate-limit-config',
          language: 'nginx',
          title: 'nginx.conf (Rate Limiting)',
          filename: 'nginx.conf',
          code: `http {
    # Define memory zone 'api_limit' tracking client IPs ($binary_remote_addr is smaller)
    # 10m means 10 Megabytes of memory (stores ~160,000 IPs)
    # rate=10r/s means 10 requests per second
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    # Define connection limits (how many concurrent connections per IP)
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Return HTTP 429 (Too Many Requests) instead of default 503
    limit_req_status 429;
    limit_conn_status 429;

    server {
        listen 80;

        location /api/ {
            # Apply the limit. 
            # burst=20 allows an instant burst of 20 requests.
            # nodelay means those 20 requests are processed immediately, not artificially delayed.
            limit_req zone=api_limit burst=20 nodelay;
            
            # Limit to 5 concurrent connections per IP
            limit_conn conn_limit 5;

            proxy_pass http://fastapi;
        }
        
        # Custom JSON response for rate limits
        error_page 429 /429.json;
        location = /429.json {
            default_type application/json;
            return 429 '{"detail": "Too Many Requests - Rate limit exceeded"}';
        }
    }
}`
        }
      },
      {
        id: 'rate-limit-whitelist',
        type: 'architecture',
        title: 'Whitelisting with Nginx Maps',
        content: `Often, you want to apply rate limits to external users but allow internal microservices or office IPs unlimited access. We achieve this using Nginx \`map\` blocks. We map the client IP to a variable; if it's a known IP, we return an empty string. The \`limit_req_zone\` ignores empty keys, effectively bypassing the limit.`
      }
    ],
    challenges: [
      {
        id: 'challenge-whitelist',
        title: 'Whitelist Internal IPs',
        description: 'Using the map directive, configure Nginx so that the IP 10.0.0.5 bypasses rate limiting, while all other IPs are subject to a 5r/s limit.',
        hint: 'Map the $binary_remote_addr to a new variable, returning an empty string for the whitelisted IP and the actual IP for others.',
        solution: 'Use map to conditionally pass the IP address to the limit_req_zone.',
        solutionCode: {
          id: 'sol-whitelist',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `http {
    map $remote_addr $limit_key {
        10.0.0.5  "";       # Empty string bypasses limit
        default   $binary_remote_addr;
    }
    
    limit_req_zone $limit_key zone=api_limit:10m rate=5r/s;
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-burst-nodelay',
        question: 'Explain the difference between applying limit_req with "burst=20" versus "burst=20 nodelay".',
        answer: 'Without nodelay, Nginx will queue the burst requests and artificial delay their execution to strictly conform to the configured rate (e.g., passing one request every 100ms). This slows down the client experience. With nodelay, Nginx immediately processes all 20 burst requests instantly, but marks the bucket as "full". Future requests will be rejected until the bucket naturally drains at the configured rate.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-proxy-ip',
        severity: 'critical',
        content: 'If Nginx is behind an AWS ALB or Cloudflare, $binary_remote_addr will be the IP of the load balancer! You MUST use the real_ip module (`set_real_ip_from` and `real_ip_header X-Forwarded-For`) to extract the true client IP before rate limiting.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-global-lockout',
        scenario: 'NAT Gateway Lockout',
        problem: 'A strict IP-based rate limit was implemented. Suddenly, a corporate client reported their entire office could not access the API.',
        solution: 'The entire corporate office shared a single public IP address via NAT. The IP-based rate limit was too aggressive for a multi-user NAT. Switched the rate limiting key from $binary_remote_addr to an authenticated JWT claim (e.g., $http_authorization) extracted in Nginx, mapping limits to user IDs rather than IPs.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-global-rate',
        title: 'Applying Limits Globally Without Exclusions',
        description: 'Applying rate limits to the entire server block inadvertently limits health-check endpoints, causing load balancers to mark the instance as dead.',
        badCode: {
          id: 'bad-global',
          language: 'nginx',
          title: '❌ Wrong Way (Limits everything)',
          code: `server {
    limit_req zone=api_limit;
    location / { proxy_pass http://api; }
    location /health { proxy_pass http://api; }
}`
        },
        goodCode: {
          id: 'good-global',
          language: 'nginx',
          title: '✅ Correct Way (Targeted Limits)',
          code: `server {
    location / { 
        limit_req zone=api_limit;
        proxy_pass http://api; 
    }
    location /health { 
        # No limits on health checks
        proxy_pass http://api; 
    }
}`
        }
      }
    ],
    codeExamples: [],
  },
  'caching-static-assets': {
    id: '20-08',
    slug: 'caching-static-assets',
    chapterId: 20,
    order: 8,
    title: 'Caching & Static Asset Serving',
    description: 'Dramatically reduce FastAPI load by caching API responses and serving static files directly from Nginx.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.nginx],
    prerequisites: ['20-01'],
    objectives: [
      'Serve static files with cache-control headers',
      'Configure proxy_cache for upstream responses',
      'Use cache-busting strategies for deployments',
      'Configure CDN origin configuration in Nginx'
    ],
    sections: [
      {
        id: 'static-concepts',
        type: 'concept',
        title: 'Offloading to the Edge',
        content: `While FastAPI provides \`StaticFiles\` for serving HTML, CSS, and images, Python is relatively slow at I/O operations compared to Nginx. Nginx was built to serve static files efficiently using advanced OS capabilities like \`sendfile\`, which transfers data directly from the disk to the network socket without passing through user space.

Furthermore, Nginx can cache the JSON responses from your FastAPI endpoints (Microcaching). For read-heavy, low-mutation endpoints (like product catalogs or public configurations), caching responses in Nginx memory/disk for even just 5 seconds can absorb thousands of concurrent requests, shielding the database entirely.`
      },
      {
        id: 'caching-implementation',
        type: 'implementation',
        title: 'Static Files and Microcaching',
        content: `This configuration demonstrates setting up an efficient static file server alongside a microcache for API routes.`,
        codeExample: {
          id: 'cache-config',
          language: 'nginx',
          title: 'nginx.conf (Caching)',
          filename: 'nginx.conf',
          code: `http {
    # Define a cache path for API responses
    # keys_zone: Name and RAM allocated for cache keys
    # max_size: Maximum disk space for cached data
    proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

    server {
        listen 80;
        
        # 1. Highly optimized static file serving
        location /static/ {
            alias /var/www/app/static/;
            
            # Use OS sendfile
            sendfile on;
            tcp_nopush on;
            
            # Tell browser to cache aggressively (1 year)
            expires 1y;
            add_header Cache-Control "public, no-transform";
            
            # Disable access logging for static files to save I/O
            access_log off;
        }

        # 2. Proxy with Microcaching for read-heavy endpoint
        location /api/v1/catalog {
            proxy_pass http://fastapi;
            
            # Enable cache
            proxy_cache api_cache;
            
            # Use a robust cache key (scheme + method + host + uri)
            proxy_cache_key $scheme$request_method$host$request_uri;
            
            # Only cache GET and HEAD
            proxy_cache_methods GET HEAD;
            
            # Cache 200 responses for 1 minute
            proxy_cache_valid 200 1m;
            
            # Serve stale cache if backend is down or timing out
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            
            # Lock concurrent requests to prevent cache stampede
            proxy_cache_lock on;
            
            # Add header to debug cache hits/misses
            add_header X-Proxy-Cache $upstream_cache_status;
        }
    }
}`
        }
      },
      {
        id: 'cache-stampede',
        type: 'architecture',
        title: 'Preventing Cache Stampedes',
        content: `A cache stampede occurs when a highly requested cached item expires, and suddenly hundreds of concurrent requests bypass the cache and hit the database simultaneously, crushing the system.
        
By enabling \`proxy_cache_lock on;\`, Nginx ensures that if the cache is missing/expired, only ONE request is allowed to pass to FastAPI. The other 99 requests queue up in Nginx and wait. Once the single request returns, Nginx caches it and instantly serves the 99 waiting clients from the new cache.`
      }
    ],
    challenges: [
      {
        id: 'challenge-cache-bypass',
        title: 'Bypass Cache on Demand',
        description: 'Configure the microcache so that if a client sends a specific header "X-Bypass-Cache: true", Nginx skips the cache and fetches fresh data from FastAPI.',
        hint: 'Use the proxy_cache_bypass directive combined with an Nginx HTTP variable.',
        solution: 'The proxy_cache_bypass directive takes variables. If any evaluate to true, the cache is bypassed.',
        solutionCode: {
          id: 'sol-bypass',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `location /api/ {
    proxy_cache api_cache;
    # $http_x_bypass_cache reads the X-Bypass-Cache header
    proxy_cache_bypass $http_x_bypass_cache;
    proxy_pass http://backend;
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-sendfile',
        question: 'What is the "sendfile" directive in Nginx and why is it important for static assets?',
        answer: 'Normally, sending a file over a network requires reading data from disk into kernel space, copying it to user space (Nginx application memory), and copying it back to kernel space to write to the network socket. The `sendfile on` directive uses a Linux system call that transfers data directly from the file descriptor to the socket inside kernel space, bypassing user space entirely, resulting in massive CPU and memory savings.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-auth-cache',
        severity: 'critical',
        content: 'NEVER apply `proxy_cache` to endpoints that return user-specific or authenticated data without adding the user identifier (like an auth token or session cookie) to the `proxy_cache_key`. Otherwise, User A might see User B\'s private data.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-cache-invalidation',
        scenario: 'The Phantom Data Update',
        problem: 'Content editors updated product prices in the database, but the API kept returning old prices for hours. FastAPI lacked caching, so the team was confused.',
        solution: 'Found that Nginx proxy_cache was enabled with a 24-hour TTL, but no invalidation strategy was built. Switched to short 1-minute microcaching, and implemented an Nginx `proxy_cache_purge` configuration (requires Nginx Plus or 3rd party module) triggered by FastAPI webhooks upon database changes.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-alias-root',
        title: 'Root vs Alias Directives',
        description: 'Using `root` instead of `alias` causes 404 errors because Nginx appends the location path to the root path.',
        badCode: {
          id: 'bad-root',
          language: 'nginx',
          title: '❌ Wrong Way (Looks in /var/www/static/static/file.jpg)',
          code: `location /static/ {
    root /var/www/static/;
}`
        },
        goodCode: {
          id: 'good-alias',
          language: 'nginx',
          title: '✅ Correct Way (Looks in /var/www/static/file.jpg)',
          code: `location /static/ {
    alias /var/www/static/;
}`
        }
      }
    ],
    codeExamples: [],
  },
  'monitoring-nginx': {
    id: '20-09',
    slug: 'monitoring-nginx',
    chapterId: 20,
    order: 9,
    title: 'Monitoring Nginx with Prometheus',
    description: 'Gain deep visibility into proxy performance, connection states, and upstream health.',
    duration: 35,
    difficulty: 'expert',
    technologies: [technologies.nginx, technologies.prometheus],
    prerequisites: ['20-01'],
    objectives: [
      'Install nginx-prometheus-exporter',
      'Configure stub_status for metrics',
      'Import Nginx Grafana dashboard',
      'Alert on upstream error rate'
    ],
    sections: [
      {
        id: 'monitoring-concepts',
        type: 'concept',
        title: 'Visibility at the Edge',
        content: `Nginx is the front door to your FastAPI application. If Nginx is dropping connections, running out of workers, or seeing upstream 502 Bad Gateway errors, your application is functionally down, even if FastAPI itself is healthy. 
        
Monitoring Nginx requires exposing its internal state. While open-source Nginx provides basic metrics via the \`stub_status\` module, we combine this with the \`nginx-prometheus-exporter\` to scrape these metrics, convert them to Prometheus format, and visualize them in Grafana.`
      },
      {
        id: 'monitoring-implementation',
        type: 'implementation',
        title: 'Exposing Metrics',
        content: `First, we must configure a private endpoint in Nginx that exposes the \`stub_status\` metrics. It is crucial to restrict access to this endpoint to prevent information leakage.`,
        codeExample: {
          id: 'status-config',
          language: 'nginx',
          title: 'nginx.conf (stub_status)',
          filename: 'nginx.conf',
          code: `server {
    # Listen on a private port for internal monitoring
    listen 8080;
    server_name localhost;

    location /stub_status {
        # Enable the basic status module
        stub_status;
        
        # Security: Only allow local access (where the exporter runs)
        allow 127.0.0.1;
        allow 10.0.0.0/8; # Allow internal VPC subnet
        deny all;
        
        # Disable logging for scrape requests to save disk I/O
        access_log off;
    }
}`
        }
      },
      {
        id: 'docker-monitoring',
        type: 'architecture',
        title: 'Prometheus Exporter in Docker',
        content: `The official \`nginx-prometheus-exporter\` connects to the \`stub_status\` endpoint, translates the plain-text metrics into Prometheus time-series format, and exposes them on port 9113.`,
        codeExample: {
          id: 'exporter-compose',
          title: 'docker-compose.yml',
          files: {
            'docker-compose.yml': {
              language: 'yaml',
              code: `version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "8080:8080" # Exposed internally
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    command:
      - "-nginx.scrape-uri=http://nginx:8080/stub_status"
    ports:
      - "9113:9113"
    depends_on:
      - nginx`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'challenge-log-format',
        title: 'JSON Access Logs',
        description: 'Update the Nginx configuration to output access logs in JSON format. This makes it easier for log aggregators (like ELK/Datadog) to parse metrics like upstream response time.',
        hint: 'Use the log_format directive and construct a JSON string using Nginx variables like $request_time and $upstream_response_time.',
        solution: 'Define a custom log_format that formats the output as JSON, then apply it with the access_log directive.',
        solutionCode: {
          id: 'sol-json-logs',
          language: 'nginx',
          title: 'Solution Configuration',
          filename: 'nginx.conf',
          code: `http {
    log_format json_combined escape=json '{'
        '"time_local":"$time_local",'
        '"remote_addr":"$remote_addr",'
        '"request":"$request",'
        '"status":"$status",'
        '"request_time":"$request_time",'
        '"upstream_response_time":"$upstream_response_time"'
    '}';
    
    access_log /var/log/nginx/access.log json_combined;
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-request-time',
        question: 'What is the difference between $request_time and $upstream_response_time in Nginx logs?',
        answer: '$request_time is the total time elapsed from when Nginx reads the first byte of the client request until the last byte of the response is sent back to the client. $upstream_response_time is purely the time Nginx spent waiting for the backend (FastAPI) to process the request. If $request_time is high but $upstream_response_time is low, the bottleneck is a slow client connection (like a user on 3G network), not the Python application.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-stub-status-limits',
        severity: 'warning',
        content: 'The open-source stub_status module only provides global server metrics (total connections, requests). It does NOT provide per-upstream or per-location metrics. For granular API endpoint metrics, you must parse the access logs using a tool like Promtail/Loki or use a third-party module like nginx-vts.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-active-connections',
        scenario: 'The Hidden Connection Leak',
        problem: 'Memory usage on the API servers was fine, but users were experiencing timeouts. Grafana showed active connections in Nginx climbing linearly over a week.',
        solution: 'The stub_status "Waiting" metric showed thousands of idle connections. A misconfigured keepalive timeout in Nginx combined with dropped TCP packets at the firewall level left sockets in a half-open state. Lowered `keepalive_timeout` and implemented TCP keepalive probes at the OS level.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-public-status',
        title: 'Exposing stub_status Publicly',
        description: 'Leaving the /stub_status endpoint accessible to the public leaks infrastructure scaling data to attackers.',
        badCode: {
          id: 'bad-status',
          language: 'nginx',
          title: '❌ Wrong Way (Publicly exposed)',
          code: `server {
    listen 80;
    location /stub_status {
        stub_status;
        # Missing allow/deny rules
    }
}`
        },
        goodCode: {
          id: 'good-status',
          language: 'nginx',
          title: '✅ Correct Way (IP Restricted)',
          code: `server {
    listen 80;
    location /stub_status {
        stub_status;
        allow 127.0.0.1;
        deny all;
    }
}`
        }
      }
    ],
    codeExamples: [],
  }
};
