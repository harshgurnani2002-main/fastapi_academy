import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch06Lessons: Record<string, Lesson> = {
  'owasp-api-security-top-10': {
    id: '06-01',
    slug: 'owasp-api-security-top-10',
    chapterId: 6,
    order: 1,
    title: 'OWASP API Security Top 10',
    description: 'Understand the most critical API security risks and how they apply to FastAPI.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Identify the OWASP API Security Top 10 risks',
      'Map each risk to FastAPI-specific vulnerabilities',
      'Prioritize security fixes by risk level',
      'Use OWASP as a security checklist',
    ],
    sections: [
      {
        id: 'concept-owasp',
        type: 'concept',
        title: 'The OWASP API Security Top 10',
        content: `The OWASP (Open Web Application Security Project) API Security Top 10 is a foundational document that outlines the most critical security risks specifically tailored to APIs. Unlike traditional web applications, APIs expose underlying data structures and business logic directly, making them unique targets for attackers.

Understanding these risks is paramount for any API developer. We will focus on how these vulnerabilities manifest in Python and FastAPI, moving beyond abstract definitions into concrete examples. A vulnerability in FastAPI often occurs not because of flaws in the framework, but because of incorrect implementation of authentication, authorization, input validation, or configuration by the developer.

By using this Top 10 list as a baseline, we can systematically review our architecture, code, and deployment strategies to eliminate entire classes of vulnerabilities before they reach production.`,
      },
      {
        id: 'implementation-bola',
        type: 'implementation',
        title: 'Broken Object Level Authorization (BOLA)',
        content: `BOLA (formerly IDOR) is consistently the #1 API vulnerability. It occurs when an application does not adequately check if the user requesting an object actually has permission to access or modify it. 

In FastAPI, this typically happens when developers rely solely on endpoint authentication but fail to implement authorization checks against the requested resource ID. An attacker can simply authenticate with their own account, capture the API request, and change the \`id\` parameter to access another user's data.

To prevent BOLA, you must assert authorization on *every* object access. The context of the request (the authenticated user) must be checked against the owner or permissions of the resource.`,
        codeExample: {
          id: 'bola-example',
          language: 'python',
          title: 'Vulnerable vs Secure BOLA',
          filename: 'bola_prevention.py',
          code: `from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import Document, User
from .auth import get_current_user

router = APIRouter()

# ❌ VULNERABLE TO BOLA (Broken Object Level Authorization)
@router.get("/documents/vulnerable/{doc_id}")
async def get_document_vulnerable(
    doc_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Authentication ONLY
):
    # The application fetches the document by ID without checking ownership
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # An attacker can fetch ANY document by simply iterating doc_ids
    return document

# ✅ SECURE: Preventing BOLA
@router.get("/documents/secure/{doc_id}")
async def get_document_secure(
    doc_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # The query explicitly requires the document to belong to the current_user
    document = db.query(Document).filter(
        Document.id == doc_id,
        Document.owner_id == current_user.id  # <-- The Authorization Check
    ).first()
    
    if not document:
        # Note: Returning 404 instead of 403 prevents ID enumeration
        raise HTTPException(status_code=404, detail="Document not found")
        
    return document`,
        },
      },
      {
        id: 'production-bflac',
        type: 'production',
        title: 'Mass Assignment & BFLA',
        content: `Mass Assignment occurs when client-provided data is bound directly to internal objects without filtering. In FastAPI, this is often mitigated by Pydantic models, but developers can inadvertently re-introduce it if they use a single schema for both input and database models, or use \`**kwargs\` to update ORM objects blindly.

Broken Function Level Authorization (BFLA) happens when administrative endpoints are not properly protected. Attackers might discover hidden endpoints (like \`/api/v1/admin/users\`) and access them. Role-Based Access Control (RBAC) middleware or robust dependencies are essential to verify not just authentication, but the specific roles required for an endpoint.`,
      },
    ],
    commonMistakes: [
      {
        id: 'cm-mass-assignment',
        title: 'Mass Assignment via Blind Updates',
        description: 'Applying all fields from an incoming request directly to an ORM model without filtering out protected fields like `is_admin`.',
        badCode: {
          id: 'bad-mass-assign',
          language: 'python',
          title: '❌ Wrong Way',
          code: `# Assume UserUpdate schema contains an optional 'is_admin' field
@router.patch("/users/me")
def update_me(update_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    
    # Blindly updating all fields provided by the client
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(user, key, value) 
        
    db.commit()
    return user`,
        },
        goodCode: {
          id: 'good-mass-assign',
          language: 'python',
          title: '✅ Correct Way',
          code: `# Define a strict schema that only allows specific fields
class SafeUserUpdate(BaseModel):
    email: Optional[EmailStr]
    full_name: Optional[str]
    # is_admin is strictly excluded from this schema

@router.patch("/users/me")
def update_me(update_data: SafeUserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(user, key, value) 
        
    db.commit()
    return user`,
        },
      },
    ],
    interviewQuestions: [
      {
        id: 'iq-owasp-bola',
        question: 'How do you prevent Broken Object Level Authorization (BOLA) in a multi-tenant FastAPI application?',
        answer: 'BOLA is prevented by asserting ownership or tenant context on every database query. In SQLAlchemy, we append a filter for the `tenant_id` derived securely from the authenticated token context. We never rely solely on the resource ID provided in the URL path.',
        difficulty: 'expert',
      },
    ],
    productionNotes: [
      {
        id: 'pn-owasp-404',
        severity: 'info',
        content: 'When an authorization check fails (e.g., in a BOLA check), returning a 404 (Not Found) instead of 403 (Forbidden) is often preferred to prevent attackers from enumerating valid resource IDs.',
      },
    ],
    codeExamples: [],
    challenges: [],
    realWorldScenarios: [],
  },
  'sql-injection': {
    id: '06-02',
    slug: 'sql-injection',
    chapterId: 6,
    order: 2,
    title: 'SQL Injection: Attacks & Defenses',
    description: 'Learn how SQL injection happens, even with ORMs, and how to write secure queries.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.sqlalchemy, technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Reproduce SQL injection in vulnerable FastAPI code',
      'Use SQLAlchemy parameterized queries correctly',
      'Validate and sanitize user input',
      'Use ORMs to eliminate injection vectors',
    ],
    sections: [
      {
        id: 'concept-sqli',
        type: 'concept',
        title: 'The Anatomy of SQL Injection',
        content: `SQL Injection (SQLi) is a classic attack vector where malicious user input alters the structure of a backend database query. While modern ORMs like SQLAlchemy protect against basic SQL injection by using parameterized queries automatically, developers can still introduce vulnerabilities by using raw SQL, string formatting, or insecure ORM extensions.

In an SQLi attack, the payload often includes characters like \`'\`, \`;\`, or \`--\` to prematurely terminate a string literal and inject arbitrary SQL commands. This can lead to data exfiltration, data modification, or complete database compromise.

The defense strategy is two-fold: never trust user input (validation) and strictly separate code (the SQL statement) from data (the parameters) via parameterized queries.`,
      },
      {
        id: 'implementation-sqli',
        type: 'implementation',
        title: 'Vulnerable and Secure Database Access',
        content: `The most common way SQLi is introduced in Python is through f-strings or standard string formatting (\`%\` or \`.format()\`) to construct queries dynamically. 

When you format a string, the database receives a single, unified text block and parses it. If the input contains SQL commands, they are executed. Parameterized queries, conversely, send the query structure and the parameters separately. The database driver ensures that the parameters are treated strictly as data, neutralizing any injected commands.`,
        codeExample: {
          id: 'sqli-example',
          language: 'python',
          title: 'Raw SQL Injection vs Parameterization',
          filename: 'db_queries.py',
          code: `from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import get_db

router = APIRouter()

# ❌ VULNERABLE: String formatting for raw SQL
@router.get("/users/search_vulnerable")
def search_users_vulnerable(username: str, db: Session = Depends(get_db)):
    # Attacker input:  admin'; DROP TABLE users; --
    # Resulting SQL:   SELECT * FROM users WHERE username = 'admin'; DROP TABLE users; --'
    
    query = f"SELECT * FROM users WHERE username = '{username}'"
    result = db.execute(text(query)).fetchall()
    return result

# ✅ SECURE: Parameterized raw SQL
@router.get("/users/search_secure_raw")
def search_users_secure_raw(username: str, db: Session = Depends(get_db)):
    # The :username syntax defines a parameter
    query = text("SELECT * FROM users WHERE username = :username")
    
    # Parameters are passed securely via the driver
    result = db.execute(query, {"username": username}).fetchall()
    return result

# ✅ MOST SECURE: Using the ORM paradigm
@router.get("/users/search_secure_orm")
def search_users_secure_orm(username: str, db: Session = Depends(get_db)):
    # The ORM handles parameterization entirely automatically
    from .models import User
    result = db.query(User).filter(User.username == username).all()
    return result`,
        },
      },
      {
        id: 'production-sqli',
        type: 'production',
        title: 'Advanced Injection Scenarios',
        content: `While ` + "`WHERE`" + ` clause injection is common, developers often forget that ` + "`ORDER BY`" + ` and table names cannot be parameterized in standard SQL drivers. If you allow dynamic sorting by a user-provided column name, you cannot simply pass it as a parameter.

In these cases, you must use strict allow-listing. Check the user's input against a predefined list of valid column names before incorporating it into the query structure. Pydantic enums are excellent for enforcing this at the API boundary.`,
      },
    ],
    challenges: [
      {
        id: 'ch-sqli-sort',
        title: 'Secure Dynamic Sorting',
        description: 'Implement a secure endpoint that sorts a list of users dynamically based on a client-provided column name (e.g., `email`, `created_at`). Prevent SQL injection in the `ORDER BY` clause.',
        hint: 'You cannot parameterize table or column names. Use a Pydantic Enum to strictly allow-list the sortable columns.',
        solution: 'By defining an Enum for the allowed sort columns, Pydantic will reject any input that does not match. We can then safely use the validated input to construct the ORM query.',
        solutionCode: {
          id: 'sol-sqli-sort',
          language: 'python',
          title: 'Secure Dynamic Sorting',
          filename: 'sort.py',
          code: `from enum import Enum
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc
from .database import get_db
from .models import User

router = APIRouter()

# 1. Define allowed columns strictly
class SortColumn(str, Enum):
    username = "username"
    email = "email"
    created_at = "created_at"

@router.get("/users/sorted")
def get_sorted_users(
    sort_by: SortColumn = Query(SortColumn.created_at), 
    db: Session = Depends(get_db)
):
    # Pydantic has already validated that sort_by is safe
    # We can use getattr safely on the model class
    sort_attr = getattr(User, sort_by.value)
    
    users = db.query(User).order_by(asc(sort_attr)).all()
    return users`,
        },
      },
    ],
    interviewQuestions: [
      {
        id: 'iq-sqli-orm',
        question: 'Can you have a SQL injection vulnerability even if you are using SQLAlchemy ORM?',
        answer: 'Yes. While basic queries (`.filter(User.id == input)`) are parameterized and safe, developers can introduce SQL injection by using `text()` incorrectly with string formatting, or by accepting dynamic column names for `order_by()` without allow-listing.',
        difficulty: 'advanced',
      },
    ],
    codeExamples: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'ssrf-protection': {
    id: '06-03',
    slug: 'ssrf-protection',
    chapterId: 6,
    order: 3,
    title: 'SSRF: Server-Side Request Forgery',
    description: 'Prevent attackers from using your API to attack internal network resources.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Demonstrate an SSRF attack against metadata endpoints',
      'Implement URL validation and allowlisting',
      'Block private IP ranges in outbound requests',
      'Use SSRF-safe HTTP client configurations',
    ],
    sections: [
      {
        id: 'concept-ssrf',
        type: 'concept',
        title: 'Understanding SSRF',
        content: `Server-Side Request Forgery (SSRF) occurs when a web application fetches a remote resource without validating the user-supplied URL. This allows an attacker to coerce the application to send crafted requests to unexpected destinations.

SSRF is particularly devastating in cloud environments (like AWS, GCP, Azure). Attackers can point the URL to the internal cloud metadata service (e.g., \`169.254.169.254\`) to extract sensitive IAM role credentials. Alternatively, they can scan internal networks, bypassing external firewalls, or interact with unauthenticated internal microservices (like Redis or internal administration panels).

Mitigating SSRF requires a defense-in-depth approach involving input validation, strict allow-listing, disabling automatic redirects, and network-level egress filtering.`,
      },
      {
        id: 'implementation-ssrf',
        type: 'implementation',
        title: 'SSRF Attack and Defense',
        content: `A typical feature susceptible to SSRF is a webhook configuration or a link preview generator. The application takes a URL, uses ` + "`httpx`" + ` or ` + "`requests`" + ` to fetch the content, and returns it.

If the URL is \`http://127.0.0.1:6379\`, the app might attempt to speak HTTP to the local Redis instance, potentially corrupting data or gaining code execution.

To fix this, we must resolve the URL to an IP address *before* making the request, and check if that IP falls within reserved, private, or loopback ranges.`,
        codeExample: {
          id: 'ssrf-example',
          language: 'python',
          title: 'SSRF Prevention with IP Checking',
          filename: 'webhook.py',
          code: `import ipaddress
import socket
from urllib.parse import urlparse
import httpx
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import HttpUrl

router = APIRouter()

def is_safe_url(url_str: str) -> bool:
    """Validates that a URL does not resolve to an internal/private IP."""
    try:
        parsed = urlparse(url_str)
        hostname = parsed.hostname
        if not hostname:
            return False
            
        # Resolve hostname to IP
        # Note: This is a basic check. Advanced attacks use DNS rebinding.
        ip_addr = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip_addr)
        
        # Check against private, loopback, and reserved ranges
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved:
            return False
            
        # AWS metadata endpoint check specifically
        if str(ip_obj) == "169.254.169.254":
            return False
            
        return True
    except Exception:
        return False

@router.post("/webhooks/register")
async def register_webhook(target_url: HttpUrl):
    url_str = str(target_url)
    
    # 1. Validate the URL before making any requests
    if not is_safe_url(url_str):
        raise HTTPException(status_code=400, detail="Invalid target URL (SSRF Prevention)")
        
    # 2. Make the request (Disabling redirects is crucial)
    async with httpx.AsyncClient(follow_redirects=False, timeout=5.0) as client:
        try:
            # We enforce HTTPS where possible
            if not url_str.startswith("https://"):
                 raise HTTPException(status_code=400, detail="HTTPS required")
                 
            response = await client.get(url_str)
            return {"status": "Success", "code": response.status_code}
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Request failed")`,
        },
      },
      {
        id: 'architecture-ssrf',
        type: 'architecture',
        title: 'Advanced SSRF & DNS Rebinding',
        content: `Application-level URL validation has limitations. Attackers can use DNS Rebinding: they control a domain whose DNS server first responds with a safe, public IP during the validation phase, but responds with an internal IP (like \`127.0.0.1\`) milliseconds later when the actual HTTP client makes the connection.

To truly stop advanced SSRF, network-level controls are required. The microservice initiating outbound requests should be deployed in an isolated network segment (like an AWS Security Group or a Kubernetes NetworkPolicy) that strictly forbids outbound traffic to internal IP ranges or requires routing through a secure egress proxy.`,
      },
    ],
    realWorldScenarios: [
      {
        id: 'rws-capital-one',
        scenario: 'Cloud Metadata Exfiltration',
        problem: 'An attacker exploited an SSRF vulnerability in a cloud-hosted web application firewall (WAF) to query the AWS IMDS (Instance Metadata Service).',
        solution: 'The attack was mitigated by upgrading to IMDSv2, which requires session tokens via specific HTTP headers, rendering simple SSRF GET requests ineffective against the metadata service. Egress filtering was also strictly applied.',
      },
    ],
    interviewQuestions: [
      {
        id: 'iq-ssrf-dns',
        question: 'Why is application-level IP checking not enough to prevent all SSRF attacks?',
        answer: 'Application-level checks are vulnerable to DNS Rebinding and Time-of-Check to Time-of-Use (TOCTOU) flaws. The validation step may resolve a domain to a safe IP, but the subsequent HTTP request might resolve to a malicious internal IP due to a rapid DNS update by the attacker.',
        difficulty: 'expert',
      },
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    commonMistakes: [],
  },
  'cors-configuration': {
    id: '06-04',
    slug: 'cors-configuration',
    chapterId: 6,
    order: 4,
    title: 'CORS: Correct Configuration',
    description: 'Properly configure Cross-Origin Resource Sharing in FastAPI.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Understand the Same-Origin Policy',
      'Configure FastAPI CORSMiddleware correctly',
      'Avoid the wildcard CORS trap',
      'Test CORS configuration with browser requests',
    ],
    sections: [
      {
        id: 'concept-cors',
        type: 'concept',
        title: 'Demystifying CORS',
        content: `Cross-Origin Resource Sharing (CORS) is a security feature implemented by web browsers, not servers. By default, browsers enforce the Same-Origin Policy (SOP), which prevents JavaScript running on \`https://app.example.com\` from making API requests to \`https://api.otherdomain.com\`.

CORS is the mechanism that allows a server to explicitly declare which origins are permitted to bypass the SOP. The browser sends a preliminary \`OPTIONS\` request (a preflight) to the server. The server responds with specific headers (like \`Access-Control-Allow-Origin\`), and the browser decides whether to permit the actual request.

A severe misconfiguration is the "Wildcard CORS" problem, where a server sets \`Access-Control-Allow-Origin: *\` and allows credentials. This allows ANY malicious website a user visits to make authenticated requests to your API on their behalf.`,
      },
      {
        id: 'implementation-cors',
        type: 'implementation',
        title: 'Configuring CORSMiddleware',
        content: `FastAPI provides a built-in ` + "`CORSMiddleware`" + ` based on Starlette. Configuration requires precision. You must define explicitly which origins, HTTP methods, and headers are permitted.

If your API uses cookies for authentication (like session IDs or HttpOnly JWTs), you must set ` + "`allow_credentials=True`" + `. When credentials are allowed, the browser enforces that ` + "`allow_origins`" + ` CANNOT be a wildcard (\`*\`). It must be a specific list of domains.`,
        codeExample: {
          id: 'cors-setup',
          language: 'python',
          title: 'Secure CORS Configuration',
          filename: 'main.py',
          code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Retrieve allowed origins from environment configuration
# E.g., "https://app.mycompany.com,https://admin.mycompany.com"
origins_str = os.getenv("CORS_ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

# In development, you might append localhost
if os.getenv("ENVIRONMENT") == "development":
    allowed_origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

app.add_middleware(
    CORSMiddleware,
    # ✅ SECURE: Explicitly listed origins, never "*" in production
    allow_origins=allowed_origins,
    
    # Required if your frontend sends cookies or Authorization headers
    allow_credentials=True,
    
    # Restrict allowed methods to only what is necessary
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    
    # Restrict allowed headers, or use ["*"] if safe
    allow_headers=[
        "Content-Type", 
        "Authorization", 
        "Accept", 
        "X-Requested-With"
    ],
    
    # Optional: Expose specific headers to the frontend JS
    expose_headers=["X-Pagination-Total"],
    
    # Cache the preflight response for 600 seconds to improve performance
    max_age=600,
)`,
        },
      },
      {
        id: 'production-cors',
        type: 'production',
        title: 'Dynamic Origins and Regular Expressions',
        content: `Sometimes you need dynamic origins, for instance, if you generate preview URLs for pull requests (e.g., \`https://pr-123.app.mycompany.com\`). Setting a static list is impossible here.

FastAPI's \`CORSMiddleware\` allows the \`allow_origin_regex\` parameter. This lets you specify a regex pattern to match origins. Be extremely careful constructing these regexes. Missing an escape character (like \`.\` instead of \`\\.\`) can inadvertently allow domains like \`appXmycompany.com\` (owned by an attacker) instead of \`app.mycompany.com\`.`,
      },
    ],
    productionNotes: [
      {
        id: 'pn-cors-cache',
        severity: 'info',
        content: 'Preflight OPTIONS requests add latency. Setting the `max_age` parameter in CORSMiddleware instructs browsers to cache the CORS check, saving a round-trip on subsequent requests for the given duration.',
      },
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'password-hashing-argon2': {
    id: '06-05',
    slug: 'password-hashing-argon2',
    chapterId: 6,
    order: 5,
    title: 'Password Hashing with Argon2',
    description: 'Implement state-of-the-art password hashing to protect user credentials.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Use argon2-cffi for password hashing',
      'Configure Argon2 parameters for security vs speed',
      'Implement password verification correctly',
      'Migrate from bcrypt to Argon2',
    ],
    sections: [
      {
        id: 'concept-argon2',
        type: 'concept',
        title: 'Why Argon2?',
        content: `Password hashing algorithms must be purposefully slow to deter brute-force and dictionary attacks. While bcrypt has been the standard for years, the Password Hashing Competition (PHC) selected Argon2 as the modern winner.

Argon2 is specifically designed to resist GPU-based cracking. It achieves this by being memory-hard. You configure it to require a significant amount of RAM to compute the hash. Since GPUs have relatively little RAM per core compared to CPUs, parallelizing an Argon2 cracking attack on a GPU cluster is cost-prohibitive.

Argon2id (a variant of Argon2) is the recommended algorithm, balancing resistance against both GPU attacks and side-channel timing attacks.`,
      },
      {
        id: 'implementation-argon',
        type: 'implementation',
        title: 'Implementing Passlib with Argon2',
        content: `The easiest way to use Argon2 in FastAPI is via the ` + "`passlib`" + ` library, combined with the ` + "`argon2-cffi`" + ` package.

When configuring Argon2, you balance security against server performance. A common baseline is to tune the parameters so that hashing takes roughly 250-500ms on your production hardware. This is imperceptible during login but devastating for attackers trying billions of hashes per second.`,
        codeExample: {
          id: 'argon2-setup',
          language: 'python',
          title: 'Argon2 Hashing Context',
          filename: 'security.py',
          code: `from passlib.context import CryptContext
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# We use Passlib to manage our hashing context
# This allows for easy upgrading of algorithms in the future
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    
    # Optional: Configure Argon2 parameters directly if needed
    # Default parameters in modern passlib/argon2 are usually sufficient
    # argon2__time_cost=2,
    # argon2__memory_cost=102400, # ~100MB RAM per hash
    # argon2__parallelism=8
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates an Argon2 hash for a new password."""
    return pwd_context.hash(password)

def needs_password_rehash(hashed_password: str) -> bool:
    """Checks if the hash needs upgrading due to changed parameters."""
    return pwd_context.needs_update(hashed_password)`,
        },
      },
    ],
    interviewQuestions: [
      {
        id: 'iq-argon2-memory',
        question: 'What makes Argon2 superior to older algorithms like MD5 or even bcrypt for password hashing?',
        answer: 'Argon2 is memory-hard. Unlike MD5 (which is fast and trivial to crack) or bcrypt (which is CPU-intensive but requires little memory), Argon2 requires a configurable, large block of memory to compute the hash. This nullifies the advantage of using thousands of GPU cores for offline cracking, as GPUs have limited memory bandwidth per core.',
        difficulty: 'expert',
      },
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'security-headers': {
    id: '06-06',
    slug: 'security-headers',
    chapterId: 6,
    order: 6,
    title: 'Security Headers',
    description: 'Configure HTTP response headers to harden the application against client-side attacks.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.nginx],
    prerequisites: [],
    objectives: [
      'Implement Content-Security-Policy',
      'Add Strict-Transport-Security (HSTS)',
      'Use X-Frame-Options and X-Content-Type-Options',
      'Configure Referrer-Policy correctly',
    ],
    sections: [
      {
        id: 'concept-headers',
        type: 'concept',
        title: 'Defense in the Browser',
        content: `Security headers are HTTP response headers that instruct the client's web browser to enable strict security protocols. They act as a critical layer of defense against client-side vulnerabilities, particularly Cross-Site Scripting (XSS), Clickjacking, and Man-in-the-Middle (MitM) attacks.

While these are traditionally handled by a reverse proxy like Nginx or an API Gateway, configuring them directly in FastAPI ensures that the application is inherently secure, regardless of where or how it is deployed.

The most potent, but also most complex, header is the Content-Security-Policy (CSP), which dictates exactly which domains the browser is allowed to load resources (scripts, styles, images) from.`,
      },
      {
        id: 'implementation-headers',
        type: 'implementation',
        title: 'Middleware for Security Headers',
        content: `In FastAPI, you can inject security headers globally using a custom middleware.

Here we add HSTS (forcing HTTPS), X-Content-Type-Options (preventing MIME sniffing), X-Frame-Options (preventing clickjacking via iframes), and a basic CSP for an API (restricting everything since APIs shouldn't render HTML).`,
        codeExample: {
          id: 'headers-middleware',
          language: 'python',
          title: 'Security Headers Middleware',
          filename: 'middleware.py',
          code: `from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

app = FastAPI()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # 1. HSTS: Force browsers to use HTTPS strictly for 1 year
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # 2. Prevent MIME-sniffing (browser guessing content type and executing it)
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # 3. Prevent Clickjacking by disallowing framing
        response.headers["X-Frame-Options"] = "DENY"
        
        # 4. Control referrer information sent in outbound links
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # 5. Content-Security-Policy tailored for an API
        # default-src 'none' blocks all external resources from executing in the context of this response
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none';"
        
        return response

app.add_middleware(SecurityHeadersMiddleware)`,
        },
      },
    ],
    commonMistakes: [
      {
        id: 'cm-hsts',
        title: 'Missing HSTS over HTTP',
        description: 'Sending the HSTS header over an unencrypted HTTP connection. Browsers ignore HSTS headers unless delivered over a secure HTTPS connection.',
        badCode: {
          id: 'bad-hsts',
          language: 'python',
          title: 'Ignored HSTS',
          code: `# If this app runs behind a load balancer terminating TLS,
# and the app serves HTTP, the browser might ignore it if 
# the proxy doesn't pass it securely.`,
        },
        goodCode: {
          id: 'good-hsts',
          language: 'python',
          title: 'Proxy Configuration',
          code: `# It's often better to set HSTS at the Nginx/Load Balancer level:
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
        },
      },
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
  },
  'file-upload-security': {
    id: '06-07',
    slug: 'file-upload-security',
    chapterId: 6,
    order: 7,
    title: 'File Upload Security',
    description: 'Safely handle user-uploaded files to prevent malicious code execution.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Validate file types by magic bytes, not extension',
      'Implement file size limits',
      'Store uploads outside the web root',
      'Scan uploads with antivirus in background jobs',
    ],
    sections: [
      {
        id: 'concept-uploads',
        type: 'concept',
        title: 'The Risks of File Uploads',
        content: `Allowing users to upload files is inherently dangerous. A naive implementation might allow an attacker to upload an executable script (like a Python file or a PHP shell), which they could then trick the server into executing.

Furthermore, attackers might upload massive files to exhaust disk space (Denial of Service), or upload malware to distribute to other users.

Securing uploads involves strict size limits, verifying the actual file content (not just the extension), randomizing filenames, and storing files safely—preferably on an isolated object store like AWS S3 rather than the local filesystem.`,
      },
      {
        id: 'implementation-uploads',
        type: 'implementation',
        title: 'Secure Upload Endpoint',
        content: `Relying on the filename extension or the \`Content-Type\` header provided by the client is unsafe; both can be trivially spoofed. 

To determine true file type, we must read the "magic bytes"—the first few bytes of the file header. The \`python-magic\` library binds to ` + "`libmagic`" + ` to accurately identify file types. Additionally, we enforce size limits using Starlette's stream controls or HTTP server limits.`,
        codeExample: {
          id: 'secure-upload',
          language: 'python',
          title: 'Validating File Content',
          filename: 'upload.py',
          code: `import uuid
import os
import magic  # pip install python-magic
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post("/upload")
async def secure_upload(file: UploadFile = File(...)):
    # 1. Size Limit Check (Read chunk by chunk)
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
        
    # 2. Magic Bytes Content Validation
    # Identify MIME type from actual file content, not the extension
    mime_type = magic.from_buffer(file_bytes, mime=True)
    
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type")
        
    # 3. Secure Filename Generation
    # NEVER trust the user-provided filename. Generate a new UUID.
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
    safe_filename = f"{uuid.uuid4()}.{ext}"
    
    # 4. Storage outside Web Root
    # Ideally, push to S3. If local, save outside the API directory.
    upload_dir = "/var/app/data/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    return {"message": "Upload successful", "id": safe_filename}`,
        },
      },
    ],
    productionNotes: [
      {
        id: 'pn-upload-s3',
        severity: 'critical',
        content: 'Never serve user-uploaded files directly from your API application process. Upload them directly to a dedicated blob store (like AWS S3) via pre-signed URLs, or serve them from a CDN/Nginx layer that forces the `Content-Disposition: attachment` header to prevent XSS via SVG or HTML files.',
      },
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'brute-force-protection': {
    id: '06-08',
    slug: 'brute-force-protection',
    chapterId: 6,
    order: 8,
    title: 'Brute-Force Protection & Account Lockout',
    description: 'Implement rate limiting and lockouts to protect authentication endpoints.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.redis],
    prerequisites: [],
    objectives: [
      'Implement per-IP rate limiting on auth endpoints',
      'Add account lockout after N failed attempts',
      'Use exponential backoff in lockout timers',
      'Implement CAPTCHA for suspicious traffic',
    ],
    sections: [
      {
        id: 'concept-bruteforce',
        type: 'concept',
        title: 'Defending Authentication',
        content: `Authentication endpoints (\`/login\`, \`/password-reset\`) are high-value targets. Attackers use automated tools to perform brute-force attacks (trying millions of passwords against one account) or credential stuffing (trying lists of known leaked passwords across many accounts).

Defending these endpoints requires multiple layers. Network-level rate limiting (e.g., in an API Gateway) provides baseline defense. However, application-level logic is needed to implement Account Lockout—temporarily disabling an account after consecutive failed login attempts, regardless of the attacker's IP address.`,
      },
      {
        id: 'implementation-lockout',
        type: 'implementation',
        title: 'Implementing Account Lockout with Redis',
        content: `A robust lockout system tracks failed attempts. If the threshold is exceeded, the account is locked for a duration. Redis is ideal for this because of its atomic operations and automatic key expiration (TTL).`,
        codeExample: {
          id: 'redis-lockout',
          language: 'python',
          title: 'Account Lockout Logic',
          filename: 'auth.py',
          code: `import redis.asyncio as redis
from fastapi import APIRouter, HTTPException, Depends
from .models import LoginRequest
from .security import verify_password
from .database import get_db, Session
from .models import User

router = APIRouter()
redis_client = redis.Redis(host='localhost', port=6379, db=0)

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900 # 15 minutes

@router.post("/login")
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    email = credentials.email
    lock_key = f"lockout:{email}"
    attempts_key = f"attempts:{email}"
    
    # 1. Check if account is currently locked
    if await redis_client.exists(lock_key):
        ttl = await redis_client.ttl(lock_key)
        raise HTTPException(
            status_code=429, 
            detail=f"Account temporarily locked. Try again in {ttl}s"
        )
        
    # 2. Fetch User (Simulate constant-time lookup if missing)
    user = db.query(User).filter(User.email == email).first()
    
    # 3. Verify Password
    if not user or not verify_password(credentials.password, user.hashed_password):
        # Increment failed attempts atomically
        attempts = await redis_client.incr(attempts_key)
        
        if attempts == 1:
            # Set expiry on the attempts counter (e.g., reset after 1 hour)
            await redis_client.expire(attempts_key, 3600)
            
        if attempts >= MAX_FAILED_ATTEMPTS:
            # Trigger Lockout
            await redis_client.setex(lock_key, LOCKOUT_DURATION_SECONDS, "locked")
            await redis_client.delete(attempts_key) # Reset attempts
            
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # 4. Successful Login - clear previous failures
    await redis_client.delete(attempts_key)
    
    return {"access_token": "...", "token_type": "bearer"}`,
        },
      },
    ],
    interviewQuestions: [
      {
        id: 'iq-lockout-dos',
        question: 'What is the primary risk of implementing Account Lockout, and how do you mitigate it?',
        answer: 'The primary risk is Denial of Service (DoS). An attacker can intentionally trigger failed logins for legitimate users, locking them out of the system. Mitigation strategies include soft lockouts (requiring a CAPTCHA instead of completely blocking access), exponential backoff for lock durations, or sending a one-time unlock link to the user email.',
        difficulty: 'expert',
      },
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'secrets-management': {
    id: '06-09',
    slug: 'secrets-management',
    chapterId: 6,
    order: 9,
    title: 'Secrets Management in Production',
    description: 'Securely manage API keys, database URLs, and passwords in production environments.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.python, technologies.docker],
    prerequisites: [],
    objectives: [
      'Use environment variables for secrets',
      'Integrate with HashiCorp Vault or AWS Secrets Manager',
      'Rotate secrets without downtime',
      'Detect secrets committed to git',
    ],
    sections: [
      {
        id: 'concept-secrets',
        type: 'concept',
        title: 'Beyond the .env file',
        content: `Hardcoding secrets (API keys, database passwords) in source code is a critical vulnerability. The standard practice is to use environment variables, often loaded from a \`.env\` file during development using Pydantic's \`BaseSettings\`.

However, in robust production environments, injecting secrets directly as environment variables into containers can be insecure. Environment variables can be accidentally leaked via crash dumps, application tracing, or process inspection (e.g., via \`docker inspect\`).

Enterprise applications utilize centralized Secrets Management systems like AWS Secrets Manager, HashiCorp Vault, or Kubernetes Secrets. These systems provide encryption at rest, access control, audit logging, and automated secret rotation.`,
      },
      {
        id: 'implementation-secrets',
        type: 'implementation',
        title: 'Fetching Secrets at Runtime',
        content: `Instead of injecting the database password as an environment variable, the application can securely authenticate to a Secrets Manager at startup and retrieve the necessary credentials dynamically.`,
        codeExample: {
          id: 'aws-secrets',
          language: 'python',
          title: 'AWS Secrets Manager Integration',
          filename: 'config.py',
          code: `import boto3
import json
from pydantic_settings import BaseSettings

def get_secret(secret_name: str, region_name: str = "us-east-1") -> dict:
    """Fetches a secret payload from AWS Secrets Manager."""
    # Boto3 uses IAM roles attached to the EC2/ECS/Pod automatically
    session = boto3.session.Session()
    client = session.client(service_name='secretsmanager', region_name=region_name)
    
    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        secret_string = get_secret_value_response['SecretString']
        return json.loads(secret_string)
    except Exception as e:
        # Log securely; never log the exception detail if it contains the secret
        raise RuntimeError("Failed to fetch secrets") from e

class Settings(BaseSettings):
    app_env: str = "production"
    db_host: str
    db_name: str
    db_user: str = ""
    db_password: str = ""
    
    def load_production_secrets(self):
        if self.app_env == "production":
            secrets = get_secret("prod/api/database")
            self.db_user = secrets.get("username")
            self.db_password = secrets.get("password")

settings = Settings()
# Explicitly load secrets at startup
settings.load_production_secrets()

def get_database_url():
    return f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}/{settings.db_name}"`,
        },
      },
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'dependency-security': {
    id: '06-10',
    slug: 'dependency-security',
    chapterId: 6,
    order: 10,
    title: 'Dependency & Supply Chain Security',
    description: 'Protect your application from vulnerable third-party packages.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.python, technologies.docker],
    prerequisites: [],
    objectives: [
      'Use pip-audit to scan for known CVEs',
      'Pin dependencies with hashes',
      'Monitor for new vulnerabilities with Dependabot',
      'Use Trivy for container image scanning',
    ],
    sections: [
      {
        id: 'concept-supply-chain',
        type: 'concept',
        title: 'The Software Supply Chain',
        content: `Modern Python applications consist mostly of third-party code. A vulnerability in a dependency (like Pydantic, Starlette, or an XML parser) is a vulnerability in your application. Supply chain attacks occur when malicious code is injected into popular packages on PyPI.

Securing the supply chain involves pinning exact versions of dependencies, verifying cryptographic hashes of downloaded packages, and continuously scanning your dependency tree against databases of Common Vulnerabilities and Exposures (CVEs).`,
      },
      {
        id: 'implementation-scanning',
        type: 'implementation',
        title: 'Auditing Dependencies',
        content: `Using tools like \`pip-audit\` or \`safety\`, you can check your \`requirements.txt\` or \`poetry.lock\` against known vulnerability databases. This should be a mandatory step in your CI/CD pipeline. 

Furthermore, generating requirements files with hashes ensures that the exact bytes downloaded during a build match what the developer tested, preventing "dependency confusion" or compromised PyPI mirrors.`,
        codeExample: {
          id: 'pip-audit',
          language: 'bash',
          title: 'CI/CD Security Scanning Commands',
          filename: 'ci.sh',
          code: `# Generate a strict requirements file with hashes
pip-compile --generate-hashes requirements.in > requirements.txt

# Install from hashed requirements
pip install --require-hashes -r requirements.txt

# Audit installed packages for known vulnerabilities
pip-audit

# Alternatively, using Trivy to scan the entire filesystem or Docker image
trivy fs /path/to/project
trivy image my-fastapi-app:latest`,
        },
      },
    ],
    realWorldScenarios: [
      {
        id: 'rws-supply-chain',
        scenario: 'Malicious PyPI Packages',
        problem: 'Typosquatting: Attackers publish packages with names slightly misspelled (e.g., `fast-api` instead of `fastapi`) containing malicious code that exfiltrates environment variables (secrets) upon installation.',
        solution: 'Always verify package names. Use locked requirements files with hashes. Run builds in isolated CI environments without access to production secrets.',
      },
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
  },
  'secure-docker-images': {
    id: '06-11',
    slug: 'secure-docker-images',
    chapterId: 6,
    order: 11,
    title: 'Secure Docker Images',
    description: 'Build minimal, secure Docker containers for FastAPI production deployments.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.docker],
    prerequisites: [],
    objectives: [
      'Use distroless or slim Python base images',
      'Run containers as non-root user',
      'Use multi-stage builds to minimize attack surface',
      'Scan images with Trivy in CI pipeline',
    ],
    sections: [
      {
        id: 'concept-docker-sec',
        type: 'concept',
        title: 'Container Attack Surface',
        content: `Docker containers isolate applications, but a poorly built image can still pose massive security risks. A common mistake is using full OS base images (like \`ubuntu\`) and running the application as the \`root\` user inside the container. 

If an attacker achieves Remote Code Execution (RCE) via a vulnerability in your FastAPI app, a root user and a shell environment full of tools (curl, wget, compilers) makes escalating privileges and moving laterally across the network trivial.

Secure images minimize the attack surface by containing *only* what is necessary to run the app (no shell, no package managers) and running the process as an unprivileged user.`,
      },
      {
        id: 'implementation-dockerfile',
        type: 'implementation',
        title: 'The Secure Multi-Stage Dockerfile',
        content: `A multi-stage build separates the build environment (compilers, headers) from the runtime environment. The runtime uses a minimal "slim" image. Crucially, we create a non-root user and switch to it before executing the application.`,
        codeExample: {
          id: 'secure-dockerfile',
          language: 'docker',
          title: 'Production-Ready Dockerfile',
          filename: 'Dockerfile',
          code: `# ----- STAGE 1: Build Environment -----
FROM python:3.11-slim AS builder

WORKDIR /app
# Install system dependencies needed for compilation (e.g., psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev

COPY requirements.txt .
# Install dependencies into a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# ----- STAGE 2: Runtime Environment -----
FROM python:3.11-slim AS runtime

# Install only the runtime dependencies (e.g., libpq for postgres)
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy the compiled virtual environment from the builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY ./app ./app

# Change ownership of the app directory to the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose port and define entrypoint
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`,
        },
      },
    ],
    productionNotes: [
      {
        id: 'pn-docker-root',
        severity: 'critical',
        content: 'Kubernetes administrators should enforce Pod Security Standards (PSS) that explicitly forbid containers from running as root or escalating privileges, providing a hard guardrail against misconfigured Dockerfiles.',
      },
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
};
