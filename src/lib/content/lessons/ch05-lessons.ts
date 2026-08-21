import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch05Lessons: Record<string, Lesson> = {
  'authentication-architecture': {
    id: '05-01',
    slug: 'authentication-architecture',
    chapterId: 5,
    order: 1,
    title: 'Authentication Architecture Overview',
    description: 'Compare session-based vs token-based auth and understand stateless JWT trade-offs.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['04-01'],
    objectives: [
      'Compare session-based vs token-based auth',
      'Understand stateless JWT trade-offs',
      'Choose the right auth strategy for your use case',
      'Understand the security implications of each approach'
    ],
    sections: [
      {
        id: 'arch-concept',
        type: 'concept',
        title: 'Authentication vs. Authorization',
        content: `Authentication is the process of verifying who a user is (e.g., logging in with a username and password). Authorization is the process of verifying what they have access to (e.g., checking if they have an 'admin' role).

In modern web applications, the two dominant architectures for maintaining user state after authentication are **session-based** (stateful) and **token-based** (stateless) architectures. 

Session-based auth stores the session state on the server (in memory, a database, or Redis) and gives the client a session ID via a cookie. Token-based auth, typically using JWTs (JSON Web Tokens), stores the user claims in the token itself and is sent by the client in the Authorization header. Each has significant trade-offs regarding scalability, revocation, and security.`
      },
      {
        id: 'arch-implementation',
        type: 'implementation',
        title: 'Choosing the Right Strategy',
        content: `For single-page applications (SPAs) talking to APIs, token-based architectures are very popular due to decoupling and statelessness. However, if you require immediate, guaranteed revocation of access (e.g., an enterprise banking application), session-based architectures or a hybrid token approach with short-lived access tokens and stateful refresh tokens is necessary.`,
        codeExample: {
          id: 'auth-strategy-code',
          language: 'python',
          title: 'Hybrid Approach Concept',
          filename: 'auth_hybrid.py',
          code: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_token_stateless(token: str) -> dict:
    # 1. Fast, stateless verification (signature, expiry)
    # returns claims payload
    pass

def verify_token_stateful(token_jti: str) -> bool:
    # 2. Check distributed cache (e.g., Redis) to ensure token isn't revoked
    pass

async def get_current_user(token: str = Depends(oauth2_scheme)):
    claims = verify_token_stateless(token)
    if not verify_token_stateful(claims['jti']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    return claims["sub"]`
        }
      }
    ],
    challenges: [
      {
        id: 'challenge-arch',
        title: 'Design an Auth Strategy',
        description: 'Consider a highly distributed microservices architecture where immediate revocation is required. Describe the trade-offs of using pure stateless JWTs vs stateful sessions.',
        hint: 'Think about where token validation happens.',
        solution: 'In a microservices architecture, pure stateless JWTs are great for performance because each service can validate the signature independently. However, immediate revocation is impossible without a centralized revocation list (blocklist). A common pattern is to use short-lived access tokens (e.g., 5-15 minutes) to bound the risk window, and use a stateful refresh token to obtain new access tokens.',
        solutionCode: {
          id: 'sol-arch',
          language: 'python',
          title: 'Access Token Expiry',
          filename: 'config.py',
          code: `ACCESS_TOKEN_EXPIRE_MINUTES = 15\nREFRESH_TOKEN_EXPIRE_DAYS = 7`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-arch-1',
        question: 'What happens if a stateless JWT is compromised?',
        answer: 'Since the token is stateless and the server does not track it, the attacker can use it until it expires. This is why access tokens must have short lifespans and sensitive actions should require re-authentication or check a revocation list.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-arch-1',
        severity: 'critical',
        content: 'Never use stateless JWTs with long expirations (e.g., > 1 hour) for critical applications. Always combine with a token revocation list or refresh token architecture.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'oauth2-authorization-code-flow': {
    id: '05-02',
    slug: 'oauth2-authorization-code-flow',
    chapterId: 5,
    order: 2,
    title: 'OAuth 2.0 Authorization Code Flow',
    description: 'Implement the full authorization code flow and exchange authorization codes for tokens.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.oauth2, technologies.fastapi],
    prerequisites: ['05-01'],
    objectives: [
      'Implement the full authorization code flow',
      'Generate and validate state parameters',
      'Exchange authorization codes for tokens',
      'Handle OAuth errors gracefully'
    ],
    sections: [
      {
        id: 'oauth2-concept',
        type: 'concept',
        title: 'The Authorization Code Flow',
        content: `The OAuth 2.0 Authorization Code Flow is designed for confidential clients (like backend servers) that can securely store a client secret. 

The flow works like this:
1. The client redirects the user to the Authorization Server.
2. The user authenticates and grants consent.
3. The server redirects back to the client with an authorization code.
4. The client backend securely exchanges the code (and client secret) for access and refresh tokens.

This prevents the tokens from ever being exposed to the user's browser, making it much more secure than the deprecated Implicit Flow.`
      },
      {
        id: 'oauth2-implementation',
        type: 'implementation',
        title: 'Implementing the Callback Endpoint',
        content: `In FastAPI, the callback endpoint receives the authorization code and exchanges it via a server-to-server HTTP request to the Identity Provider (IdP).`,
        codeExample: {
          id: 'oauth2-code',
          language: 'python',
          title: 'OAuth2 Callback',
          filename: 'main.py',
          code: `import httpx
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
CLIENT_ID = "my_client_id"
CLIENT_SECRET = "my_client_secret"
TOKEN_URL = "https://oauth2.provider.com/token"

@app.get("/callback")
async def oauth2_callback(code: str, state: str, request: Request):
    if state != request.session.get("oauth_state"):
        raise HTTPException(status_code=400, detail="Invalid state parameter")
        
    async with httpx.AsyncClient() as client:
        response = await client.post(
            TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uri": "https://yourapp.com/callback"
            }
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code")
        
    tokens = response.json()
    return {"access_token": tokens["access_token"]}`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-oauth2',
        title: 'Implement State Verification',
        description: 'How would you securely generate and verify the state parameter to prevent CSRF attacks in OAuth2?',
        hint: 'Use a cryptographically secure random generator and store it in an HttpOnly cookie or secure session before redirecting.',
        solution: 'Generate a strong random string, store it securely, and include it in the URL.',
        solutionCode: {
          id: 'sol-oauth2',
          language: 'python',
          title: 'State Generation',
          filename: 'auth.py',
          code: `import secrets\nstate = secrets.token_urlsafe(32)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-oauth2',
        question: 'Why use the Authorization Code Flow instead of the Implicit Flow?',
        answer: 'The Implicit Flow exposes the token in the URL fragment. The Authorization Code Flow keeps tokens completely server-side.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-oauth2',
        severity: 'critical',
        content: 'Always validate the state parameter.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'pkce-security': {
    id: '05-03',
    slug: 'pkce-security',
    chapterId: 5,
    order: 3,
    title: 'PKCE: Proof Key for Code Exchange',
    description: 'Generate cryptographically secure code verifiers and validate PKCE on the server side.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.oauth2, technologies.fastapi],
    prerequisites: ['05-02'],
    objectives: [
      'Generate cryptographically secure code verifiers',
      'Compute the code challenge correctly',
      'Validate PKCE on the server side',
      'Understand why PKCE is mandatory for SPAs'
    ],
    sections: [
      {
        id: 'pkce-concept',
        type: 'concept',
        title: 'What is PKCE?',
        content: `PKCE mitigates the authorization code interception attack. When a client initiates the flow, it generates a random secret (code_verifier) and sends a hashed version (code_challenge) to the server.`
      },
      {
        id: 'pkce-impl',
        type: 'implementation',
        title: 'Implementing PKCE in Python',
        content: `Generating the code verifier and code challenge correctly is crucial.`,
        codeExample: {
          id: 'pkce-code',
          language: 'python',
          title: 'PKCE Generation',
          filename: 'pkce_utils.py',
          code: `import base64
import hashlib
import secrets
import string

def generate_pkce_pair():
    alphabet = string.ascii_letters + string.digits + "-._~"
    code_verifier = ''.join(secrets.choice(alphabet) for _ in range(128))
    sha256_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')
    return code_verifier, code_challenge`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-pkce',
        title: 'Server-Side PKCE Validation',
        description: 'How do you validate the PKCE code verifier?',
        hint: 'Hash and compare.',
        solution: 'Hash the received verifier and compare it to the stored challenge.',
        solutionCode: {
          id: 'sol-pkce',
          language: 'python',
          title: 'PKCE Validation',
          filename: 'token_endpoint.py',
          code: `import secrets\ndef verify_pkce(stored, received):\n    pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-pkce',
        question: 'Why is PKCE required for SPAs?',
        answer: 'SPAs cannot securely store a client secret.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-pkce',
        severity: 'warning',
        content: 'Always use S256 method.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'google-oauth-integration': {
    id: '05-04',
    slug: 'google-oauth-integration',
    chapterId: 5,
    order: 4,
    title: 'Google OAuth Integration',
    description: 'Configure Google OAuth 2.0 credentials and verify Google ID tokens server-side.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.oauth2, technologies.fastapi],
    prerequisites: ['05-02'],
    objectives: [
      'Configure Google OAuth 2.0 credentials',
      'Verify Google ID tokens server-side',
      'Extract user identity from ID token claims',
      'Handle account linking for existing users'
    ],
    sections: [
      {
        id: 'google-concept',
        type: 'concept',
        title: 'OpenID Connect (OIDC) and Google',
        content: `Google's authentication mechanism is built on OpenID Connect (OIDC).`
      },
      {
        id: 'google-impl',
        type: 'implementation',
        title: 'Verifying Google ID Tokens',
        content: `Never trust an ID token passed directly from a client without validating its signature.`,
        codeExample: {
          id: 'google-code',
          language: 'python',
          title: 'Google Token Verification',
          filename: 'google_auth.py',
          code: `from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException

GOOGLE_CLIENT_ID = "your-client-id"

def verify_google_token(token: str):
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        return id_info
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-google',
        title: 'Account Linking Strategy',
        description: 'How do you handle users signing up with email, then using Google?',
        hint: 'Trust verified emails.',
        solution: 'Link the accounts if the email matches and is verified.',
        solutionCode: {
          id: 'sol-google',
          language: 'python',
          title: 'Account Linking',
          filename: 'auth_service.py',
          code: `def link_account(email):\n    pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-google',
        question: 'Why verify the ID token signature?',
        answer: 'To prevent spoofing claims.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-google',
        severity: 'critical',
        content: 'Verify the aud claim.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'jwt-implementation': {
    id: '05-05',
    slug: 'jwt-implementation',
    chapterId: 5,
    order: 5,
    title: 'JWT Access Tokens: Implementation & Security',
    description: 'Sign JWTs correctly, validate signatures, and design secure claims.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.jwt, technologies.fastapi],
    prerequisites: ['05-01'],
    objectives: [
      'Sign JWTs with RS256 or HS256 correctly',
      'Validate signature, expiry, and audience',
      'Design JWT claims for your application',
      'Avoid the alg:none attack and other JWT pitfalls'
    ],
    sections: [
      {
        id: 'jwt-concept',
        type: 'concept',
        title: 'Asymmetric vs Symmetric JWT Signing',
        content: `JWTs can be signed symmetrically (e.g., HS256) or asymmetrically (e.g., RS256).`
      },
      {
        id: 'jwt-impl',
        type: 'implementation',
        title: 'Secure JWT Implementation',
        content: `Use PyJWT securely.`,
        codeExample: {
          id: 'jwt-code',
          language: 'python',
          title: 'JWT Service',
          filename: 'jwt_service.py',
          code: `import jwt

SECRET_KEY = "secret"
ALGORITHM = "HS256"

def verify_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-jwt',
        title: 'Defend against alg:none',
        description: 'Prevent the alg:none attack.',
        hint: 'Enforce algorithms.',
        solution: 'Pass algorithms explicitly.',
        solutionCode: {
          id: 'sol-jwt',
          language: 'python',
          title: 'Strict Algorithm Verification',
          filename: 'verify.py',
          code: `jwt.decode(token, key, algorithms=["HS256"])`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-jwt',
        question: 'What is jti?',
        answer: 'Unique identifier for the token.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-jwt',
        severity: 'warning',
        content: 'No sensitive data in JWT.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'refresh-token-rotation': {
    id: '05-06',
    slug: 'refresh-token-rotation',
    chapterId: 5,
    order: 6,
    title: 'Refresh Tokens & Token Rotation',
    description: 'Store refresh tokens securely, implement rotation, and detect stolen token families.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.jwt, technologies.postgresql, technologies.fastapi],
    prerequisites: ['05-05'],
    objectives: [
      'Store refresh tokens securely in the database',
      'Implement refresh token rotation on use',
      'Detect and invalidate stolen refresh token families',
      'Set appropriate TTLs for access and refresh tokens'
    ],
    sections: [
      {
        id: 'refresh-concept',
        type: 'concept',
        title: 'Why Refresh Tokens?',
        content: `Access tokens are short-lived. Refresh tokens are stateful and long-lived.`
      },
      {
        id: 'refresh-rotation',
        type: 'architecture',
        title: 'Refresh Token Rotation',
        content: `Every time a refresh token is used, issue a new one.`
      },
      {
        id: 'refresh-impl',
        type: 'implementation',
        title: 'Implementing Rotation',
        content: `Track usage in DB.`,
        codeExample: {
          id: 'refresh-code',
          language: 'python',
          title: 'Refresh Token Logic',
          filename: 'refresh_logic.py',
          code: `def handle_refresh(db, token):\n    pass`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-refresh',
        title: 'Revoke User Sessions',
        description: 'How to log out everywhere?',
        hint: 'Delete from DB.',
        solution: 'Delete all refresh tokens.',
        solutionCode: {
          id: 'sol-refresh',
          language: 'python',
          title: 'Global Logout',
          filename: 'auth.py',
          code: `def logout_all(user_id):\n    pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-refresh',
        question: 'Why not use long access tokens?',
        answer: 'Immediate revocation is hard without stateful refresh tokens.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-refresh',
        severity: 'critical',
        content: 'Use HttpOnly cookies.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'session-based-auth': {
    id: '05-07',
    slug: 'session-based-auth',
    chapterId: 5,
    order: 7,
    title: 'Session-Based Authentication with Redis',
    description: 'Create and store sessions in Redis, manage expiration, and rotate session IDs.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['05-01'],
    objectives: [
      'Create and store sessions in Redis',
      'Set session expiration and sliding windows',
      'Rotate session IDs after authentication',
      'Handle session cleanup on logout'
    ],
    sections: [
      {
        id: 'session-concept',
        type: 'concept',
        title: 'Stateful Sessions',
        content: `Redis is great for fast distributed session management.`
      },
      {
        id: 'session-impl',
        type: 'implementation',
        title: 'Redis Session',
        content: `Use Redis to map cookie ID to user.`,
        codeExample: {
          id: 'session-code',
          language: 'python',
          title: 'Redis Sessions',
          filename: 'session.py',
          code: `import redis\nclient = redis.Redis()`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-session',
        title: 'Prevent Fixation',
        description: 'How to prevent session fixation?',
        hint: 'Rotate on login.',
        solution: 'Create new ID.',
        solutionCode: {
          id: 'sol-session',
          language: 'python',
          title: 'Rotation',
          filename: 'login.py',
          code: `def login():\n    pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-session',
        question: 'Redis vs JWT?',
        answer: 'Redis requires network call, JWT is stateless.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-session',
        severity: 'info',
        content: 'Use Redis cluster.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'rbac-implementation': {
    id: '05-08',
    slug: 'rbac-implementation',
    chapterId: 5,
    order: 8,
    title: 'Role-Based Access Control (RBAC)',
    description: 'Design role/permission data models and implement permission checking in FastAPI.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: ['05-05'],
    objectives: [
      'Design the roles and permissions data model',
      'Implement permission checking as FastAPI dependencies',
      'Handle role inheritance and composition',
      'Cache permissions for performance'
    ],
    sections: [
      {
        id: 'rbac-concept',
        type: 'concept',
        title: 'Designing an RBAC System',
        content: `Grant permissions to roles, assign roles to users.`
      },
      {
        id: 'rbac-impl',
        type: 'implementation',
        title: 'FastAPI RBAC',
        content: `Use Dependency Injection for auth checks.`,
        codeExample: {
          id: 'rbac-code',
          language: 'python',
          title: 'RBAC Dependency',
          filename: 'deps.py',
          code: `from fastapi import Depends\n\nclass RequirePermissions:\n    pass`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-rbac',
        title: 'N+1 Queries',
        description: 'Optimize permissions fetch.',
        hint: 'Eager loading.',
        solution: 'Use joinedload.',
        solutionCode: {
          id: 'sol-rbac',
          language: 'python',
          title: 'Eager Load',
          filename: 'db.py',
          code: `query.options(joinedload(User.roles))`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-rbac',
        question: 'Gateway vs Service auth?',
        answer: 'Gateway for authentication, Service for fine-grained authorization.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-rbac',
        severity: 'info',
        content: 'Cache permissions in Redis.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'abac-attribute-based': {
    id: '05-09',
    slug: 'abac-attribute-based',
    chapterId: 5,
    order: 9,
    title: 'Attribute-Based Access Control (ABAC)',
    description: 'Define ABAC policies as structured rules and evaluate them dynamically.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['05-08'],
    objectives: [
      'Define ABAC policies as structured rules',
      'Evaluate policies at request time',
      'Combine RBAC and ABAC for practical systems',
      'Handle ABAC performance at scale'
    ],
    sections: [
      {
        id: 'abac-concept',
        type: 'concept',
        title: 'Contextual Security',
        content: `ABAC evaluates context (user, resource, action, environment).`
      },
      {
        id: 'abac-impl',
        type: 'implementation',
        title: 'ABAC Engine',
        content: `Python implementation of policies.`,
        codeExample: {
          id: 'abac-code',
          language: 'python',
          title: 'Policy Eval',
          filename: 'abac.py',
          code: `def can_edit(user, resource):\n    pass`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-abac',
        title: 'Database ABAC',
        description: 'How to list resources?',
        hint: 'Translate to SQL.',
        solution: 'Translate logic to WHERE clauses.',
        solutionCode: {
          id: 'sol-abac',
          language: 'python',
          title: 'SQL ABAC',
          filename: 'repo.py',
          code: `query.filter(Resource.owner_id == user.id)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-abac',
        question: 'Combine RBAC and ABAC?',
        answer: 'RBAC first as fast filter, then ABAC.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-abac',
        severity: 'info',
        content: 'Consider OPA.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'csrf-protection': {
    id: '05-10',
    slug: 'csrf-protection',
    chapterId: 5,
    order: 10,
    title: 'CSRF Protection',
    description: 'Understand CSRF attacks and implement double-submit cookie protection in FastAPI.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['05-07'],
    objectives: [
      'Understand when CSRF attacks are possible',
      'Implement double-submit cookie CSRF protection',
      'Use SameSite=Strict on session cookies',
      'Test CSRF protection correctly'
    ],
    sections: [
      {
        id: 'csrf-concept',
        type: 'concept',
        title: 'CSRF Threat',
        content: `CSRF is only a threat if you use cookies for auth.`
      },
      {
        id: 'csrf-impl',
        type: 'implementation',
        title: 'Mitigating CSRF',
        content: `Use SameSite and Double Submit Cookies.`,
        codeExample: {
          id: 'csrf-code',
          language: 'python',
          title: 'CSRF Middleware',
          filename: 'csrf.py',
          code: `class CSRFMiddleware:\n    pass`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-csrf',
        title: 'Configure Cookies',
        description: 'Secure cookies.',
        hint: 'SameSite.',
        solution: 'Use secure, httponly, samesite parameters.',
        solutionCode: {
          id: 'sol-csrf',
          language: 'python',
          title: 'Secure Cookies',
          filename: 'cookie.py',
          code: `response.set_cookie(samesite="lax", secure=True, httponly=True)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-csrf',
        question: 'Why not CORS?',
        answer: 'CORS prevents reading, CSRF is about executing actions.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-csrf',
        severity: 'warning',
        content: 'SameSite=Strict can break navigation.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'api-key-authentication': {
    id: '05-11',
    slug: 'api-key-authentication',
    chapterId: 5,
    order: 11,
    title: 'API Key Authentication',
    description: 'Generate, hash, and manage secure API keys for programmatic access.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: ['05-01'],
    objectives: [
      'Generate cryptographically secure API keys',
      'Hash API keys before storage',
      'Implement key scopes for fine-grained access',
      'Revoke and rotate API keys safely'
    ],
    sections: [
      {
        id: 'apikey-concept',
        type: 'concept',
        title: 'Designing API Keys',
        content: `API Keys should be treated like passwords and hashed.`
      },
      {
        id: 'apikey-impl',
        type: 'implementation',
        title: 'Hashing API Keys',
        content: `SHA-256 is sufficient.`,
        codeExample: {
          id: 'apikey-code',
          language: 'python',
          title: 'API Keys',
          filename: 'api_keys.py',
          code: `import hashlib\nhashlib.sha256(key.encode()).hexdigest()`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-apikey',
        title: 'Prefixes',
        description: 'Why use prefixes like sk_test_?',
        hint: 'Scanning tools.',
        solution: 'Helps secret scanners and devs.',
        solutionCode: {
          id: 'sol-apikey',
          language: 'python',
          title: 'Prefix',
          filename: 'prefix.py',
          code: `prefix="sk_live_"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-apikey',
        question: 'Rainbow tables on API keys?',
        answer: 'No, high entropy makes them immune.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-apikey',
        severity: 'info',
        content: 'Cache key hashes.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'service-to-service-auth': {
    id: '05-12',
    slug: 'service-to-service-auth',
    chapterId: 5,
    order: 12,
    title: 'Service-to-Service Authentication',
    description: 'Implement secure machine-to-machine authentication within microservice architectures.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.jwt],
    prerequisites: ['05-05'],
    objectives: [
      'Issue service identity JWTs',
      'Validate service tokens in target services',
      'Rotate service credentials without downtime',
      'Implement mTLS as an alternative'
    ],
    sections: [
      {
        id: 's2s-concept',
        type: 'concept',
        title: 'Zero Trust',
        content: `Every service request must be authenticated.`
      },
      {
        id: 's2s-impl',
        type: 'implementation',
        title: 'Service JWTs',
        content: `Sign with private key, verify with public.`,
        codeExample: {
          id: 's2s-code',
          language: 'python',
          title: 'Service JWT',
          filename: 's2s.py',
          code: `def generate_service_token():\n    pass`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-s2s',
        title: 'mTLS',
        description: 'How to avoid app logic?',
        hint: 'Service Mesh.',
        solution: 'Use a Service Mesh.',
        solutionCode: {
          id: 'sol-s2s',
          language: 'python',
          title: 'mTLS',
          filename: 'mesh.py',
          code: `# Handled by sidecar`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-s2s',
        question: 'Why audience claim?',
        answer: 'Prevents token reuse across services.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-s2s',
        severity: 'warning',
        content: 'Rotate public keys.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'mfa-implementation': {
    id: '05-13',
    slug: 'mfa-implementation',
    chapterId: 5,
    order: 13,
    title: 'Multi-Factor Authentication (TOTP)',
    description: 'Implement Time-Based One-Time Passwords (TOTP) and manage MFA flows.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: ['05-01'],
    objectives: [
      'Generate and validate TOTP codes',
      'Store TOTP secrets securely',
      'Implement backup codes for account recovery',
      'Handle MFA in JWT flows'
    ],
    sections: [
      {
        id: 'mfa-concept',
        type: 'concept',
        title: 'TOTP',
        content: `Shared secret + time window.`
      },
      {
        id: 'mfa-impl',
        type: 'implementation',
        title: 'PyOTP',
        content: `Use pyotp.`,
        codeExample: {
          id: 'mfa-code',
          language: 'python',
          title: 'TOTP',
          filename: 'totp.py',
          code: `import pyotp\ntotp = pyotp.TOTP(secret)`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-mfa',
        title: 'MFA Flow',
        description: 'How to handle half-login?',
        hint: 'Intermediate token.',
        solution: 'Issue a temporary token valid only for verify endpoint.',
        solutionCode: {
          id: 'sol-mfa',
          language: 'python',
          title: 'Pending Token',
          filename: 'mfa.py',
          code: `create_jwt({"type": "mfa_pending"})`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-mfa',
        question: 'Clock drift?',
        answer: 'Allow 1 window of drift.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-mfa',
        severity: 'critical',
        content: 'Implement backup codes.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  }
};
