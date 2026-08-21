import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch24Lessons: Record<string, Lesson> = {
  'slo-sla-sli': {
    id: '24-01',
    slug: 'slo-sla-sli',
    chapterId: 24,
    order: 1,
    title: 'SLOs, SLAs & SLIs: Defining Reliability',
    description: 'Learn the foundational concepts of Site Reliability Engineering and how to define meaningful reliability metrics.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.prometheus, technologies.grafana],
    prerequisites: [],
    objectives: [
      'Write SLIs that measure user-visible reliability',
      'Define SLO targets based on business requirements',
      'Design SLAs as external commitments',
      'Avoid common SLO definition mistakes'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'Understanding Reliability Metrics',
        content: `Reliability is arguably the most important feature of any system. If a system isn't reliable, users won't trust it or use it, regardless of how many other features it has. Site Reliability Engineering (SRE) introduces a framework for thinking about and measuring reliability using three key terms: SLIs, SLOs, and SLAs.

An SLI (Service Level Indicator) is a carefully defined quantitative measure of some aspect of the level of service that is provided. Most services consider request latency, error rate, and system throughput. An SLO (Service Level Objective) is a target value or range of values for a service level that is measured by an SLI. A natural structure for SLOs is SLI ≤ target, or lower bound ≤ SLI ≤ upper bound.

An SLA (Service Level Agreement) is an explicit or implicit contract with your users that includes consequences of meeting (or missing) the SLOs they contain. The consequences are most easily recognized when they are financial—a rebate or a penalty—but they can take other forms.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing SLIs in Prometheus',
        content: `A good SLI should directly measure the user experience. Instead of measuring CPU utilization, measure the percentage of HTTP requests that complete in under 200ms. In Prometheus, we often calculate SLIs as a ratio of "good" events to "total" events.

For example, to calculate an availability SLI, we can take the ratio of successful HTTP requests (status 2xx or 3xx) to total HTTP requests. This tells us what percentage of requests the user experienced as successful.`,
        codeExample: {
          id: 'prometheus-sli',
          language: 'python',
          title: 'Prometheus SLI Queries',
          filename: 'queries.promql',
          code: `# Availability SLI: Good Requests / Total Requests
# We consider 5xx as failures, everything else is a "good" request
sum(rate(http_requests_total{status!~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m]))

# Latency SLI: Requests under 250ms / Total Requests
sum(rate(http_request_duration_seconds_bucket{le="0.25"}[5m]))
/
sum(rate(http_request_duration_seconds_count[5m]))`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Defining Meaningful SLOs',
        content: `When defining SLOs, a common mistake is to aim for 100% reliability. This is practically impossible and prohibitively expensive. Instead, aim for a number that balances reliability with the ability to ship new features quickly, such as 99.9% (three nines).

Another common pitfall is measuring things the user doesn't care about. The user doesn't care if your database CPU is at 90%, they care if their checkout process completes successfully. Always measure as close to the user as possible, ideally at the load balancer or API gateway level.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'define-sli',
        title: 'Define an SLI',
        description: 'Write a Prometheus query for a latency SLI where the goal is 95% of requests complete in under 500ms.',
        hint: 'Use the `http_request_duration_seconds_bucket` metric and calculate the ratio.',
        solution: 'You need to divide the rate of requests in the bucket le="0.5" by the total rate of requests.',
        solutionCode: {
          id: 'define-sli-sol',
          language: 'python',
          title: 'Latency SLI Solution',
          filename: 'solution.promql',
          code: `sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
/
sum(rate(http_request_duration_seconds_count[5m]))`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'sli-vs-slo',
        question: 'What is the difference between an SLI and an SLO?',
        answer: 'An SLI (Service Level Indicator) is the actual measurement of a service metric, such as "99.2% of requests succeeded". An SLO (Service Level Objective) is the target we set for that indicator, such as "99.9% of requests must succeed". The SLI is the reality, the SLO is the goal.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'slo-target',
        severity: 'warning',
        content: 'Do not set SLOs based on current performance if current performance is arbitrarily high. Set SLOs based on what users actually need and business requirements dictate.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'error-budgets': {
    id: '24-02',
    slug: 'error-budgets',
    chapterId: 24,
    order: 2,
    title: 'Error Budgets',
    description: 'Learn how to use error budgets to balance reliability with feature velocity.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.prometheus, technologies.grafana],
    prerequisites: ['24-01'],
    objectives: [
      'Calculate error budget from SLO',
      'Track error budget consumption in real-time',
      'Use error budget policy to gate releases',
      'Implement burn rate alerts'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'The Concept of Error Budgets',
        content: `If your SLO is 99.9% availability, that means you are allowed 0.1% unavailability. This 0.1% is your Error Budget. It is a mathematical expression of the acceptable unreliability of your service. In a 30-day month, a 99.9% SLO allows for 43.2 minutes of downtime.

The Error Budget is a shared metric between product development and operations (SRE). When the budget is plentiful, developers can push features rapidly, taking risks. When the budget is depleted, feature launches are frozen, and all engineering effort is redirected towards improving reliability until the budget recovers.

This mechanism removes the inherent friction between dev (who want to move fast) and ops (who want stability) by providing a data-driven rule for when to prioritize which.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Alerting on Burn Rates',
        content: `Alerting on raw error rates often leads to alert fatigue. Instead, modern SRE practices advocate for alerting on "burn rates." A burn rate is how fast you are consuming your error budget relative to the time window.

A burn rate of 1 means you are consuming the budget at exactly the rate that will leave you with 0 budget at the end of the window (e.g., 30 days). A burn rate of 10 means you are consuming it 10 times faster, meaning you will exhaust your 30-day budget in 3 days. We typically alert when burn rates are high over a short period, or moderate over a longer period.`,
        codeExample: {
          id: 'burn-rate-alert',
          language: 'python',
          title: 'Prometheus Burn Rate Alert',
          filename: 'alerting_rules.yml',
          code: `groups:
- name: SLOs
  rules:
  # Alert if we are burning budget 14x faster than allowed over 1 hour
  # This consumes 2% of a 30-day budget in 1 hour
  - alert: HighErrorRate
    expr: |
      (
        sum(rate(http_requests_total{status=~"5.."}[1h]))
        /
        sum(rate(http_requests_total[1h]))
      ) > (0.001 * 14)  # Assuming a 99.9% SLO (0.001 budget)
    severity: page
    annotations:
      summary: "High error budget burn rate detected"`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Error Budget Policies',
        content: `An Error Budget is useless without a policy enforcing it. An Error Budget Policy is a written agreement signed by engineering and product leadership detailing what happens when the budget is exhausted.

Typical actions include halting new feature deployments, redirecting all developer time to bug fixes and reliability work, and requiring a postmortem for the budget depletion. Crucially, leadership must enforce this policy, even if it delays a highly anticipated feature.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'calc-budget',
        title: 'Calculate Error Budget',
        description: 'Calculate the allowed downtime in minutes for a 30-day month with a 99.95% SLO.',
        hint: 'Find the total minutes in 30 days, then calculate 0.05% of that.',
        solution: 'Total minutes = 30 * 24 * 60 = 43200. Allowed downtime = 43200 * (1 - 0.9995) = 21.6 minutes.',
        solutionCode: {
          id: 'calc-budget-sol',
          language: 'python',
          title: 'Calculation',
          filename: 'calc.py',
          code: `total_minutes = 30 * 24 * 60
slo = 0.9995
budget_minutes = total_minutes * (1 - slo)
print(f"Budget: {budget_minutes:.1f} minutes")`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'what-is-error-budget',
        question: 'Explain the concept of an Error Budget and how it affects deployment frequency.',
        answer: 'An error budget is the acceptable level of unreliability (100% minus the SLO). It acts as a control mechanism: as long as there is remaining budget, teams can deploy frequently. If the budget is exhausted, deployments are paused to focus on reliability until the budget recovers.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'enforce-policy',
        severity: 'critical',
        content: 'Error budget policies must have executive buy-in. If management overrules a feature freeze when the budget is blown, the entire system loses its meaning.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'incident-response': {
    id: '24-03',
    slug: 'incident-response',
    chapterId: 24,
    order: 3,
    title: 'Incident Response & On-Call Engineering',
    description: 'Learn how to manage high-severity production incidents effectively and organize on-call rotations.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.prometheus],
    prerequisites: [],
    objectives: [
      'Define incident severity levels',
      'Write runbooks for common incident types',
      'Implement paging and escalation policies',
      'Conduct effective incident retrospectives'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'Incident Management Framework',
        content: `When a critical production system fails, chaos often ensues if there isn't a structured incident response plan. A robust incident management framework defines clear roles: an Incident Commander (IC) who coordinates the response and makes decisions, an Operations Lead who executes technical changes, and a Communications Lead who updates stakeholders.

Incidents should be classified by severity. For example, SEV-1 might mean the entire platform is down, SEV-2 means a core feature is broken for many users, and SEV-3 is a minor issue affecting a small subset. These severities dictate the response speed (e.g., paging someone out of bed vs. handling it next business day).`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Writing Effective Runbooks',
        content: `A runbook is a set of standardized procedures for handling specific types of alerts. When an engineer is paged at 3 AM, they shouldn't have to guess what to do. The alert should link directly to a runbook that outlines how to verify the issue, potential causes, and immediate mitigation steps.

Runbooks must be kept up-to-date. A stale runbook is worse than no runbook, as it can lead engineers down the wrong path during a stressful situation.`,
        codeExample: {
          id: 'runbook-template',
          language: 'python',
          title: 'Runbook Template (Markdown)',
          filename: 'high_latency_runbook.md',
          code: `# Runbook: High API Latency (>500ms)

## 1. Verification
- Check Grafana dashboard [Link] to confirm latency is sustained.
- Verify if a specific endpoint or all endpoints are affected.

## 2. Mitigation (Immediate Actions)
- If a recent deployment occurred (check Jenkins/GitOps), ROLL BACK immediately.
- If database CPU is >90%, consider scaling read replicas.
- If Redis is unreachable, check network connectivity.

## 3. Investigation
- Check application logs in Kibana for specific slow queries or exceptions.
- Check third-party API status pages (e.g., Stripe, AWS).

## 4. Escalation
- If issue persists > 15 minutes, page the Database Team.`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'On-Call Health',
        content: `Being on-call can be stressful and lead to burnout if not managed properly. Organizations must ensure that alert volume is low (only page on actionable, user-impacting issues) and that compensation or time-off is provided for on-call duties.

Escalation policies are crucial. If the primary on-call engineer doesn't acknowledge an alert within 5 minutes, it should automatically escalate to a secondary, and eventually to management. This ensures that no critical alert goes unnoticed, while also providing a safety net for the primary engineer.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'define-sev',
        title: 'Define Severity Levels',
        description: 'Categorize the following incidents into SEV-1 (Critical), SEV-2 (Major), or SEV-3 (Minor): A) Typo on the about page. B) Core payment processing is failing for all users. C) Search feature is slow for 10% of users.',
        hint: 'Think about business impact and user experience.',
        solution: 'A: SEV-3 (Minor), B: SEV-1 (Critical), C: SEV-2 (Major).',
        solutionCode: {
          id: 'define-sev-sol',
          language: 'python',
          title: 'Severities',
          filename: 'sevs.txt',
          code: `A -> SEV-3
B -> SEV-1
C -> SEV-2`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'ic-role',
        question: 'What is the role of an Incident Commander during a major outage?',
        answer: 'The Incident Commander (IC) is responsible for coordinating the overall response. They do not typically execute technical fixes; instead, they assign tasks, manage communication, maintain the incident state, and make critical decisions (like deciding to fail over to a backup database).',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'alert-fatigue',
        severity: 'warning',
        content: 'If an alert routinely wakes engineers up but requires no action, delete the alert. Alert fatigue causes engineers to ignore real emergencies.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'the-bystander-effect',
        scenario: 'The Bystander Outage',
        problem: 'A database alert fired in a general Slack channel. Three engineers saw it, but each assumed someone else was handling it. The system went down for 45 minutes.',
        solution: 'Implemented PagerDuty with targeted paging and a strict escalation policy requiring explicit acknowledgment.'
      }
    ],
    commonMistakes: []
  },
  'graceful-degradation-production': {
    id: '24-04',
    slug: 'graceful-degradation-production',
    chapterId: 24,
    order: 4,
    title: 'Graceful Degradation in Production',
    description: 'Design systems that fail partially and maintain core functionality during outages.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.redis],
    prerequisites: [],
    objectives: [
      'Identify critical vs degradable features',
      'Implement feature flags for emergency shutoff',
      'Return cached responses when backend is down',
      'Communicate degradation to users gracefully'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'Failing Gracefully',
        content: `In distributed systems, failures are inevitable. A downstream service will timeout, a database will become overloaded, or a network link will drop. Graceful degradation is the practice of designing your application to provide a reduced but functional experience when dependencies fail, rather than crashing completely.

For an e-commerce site, the ability to checkout is critical. The "Recommendations for You" widget is not. If the recommendation service goes down, the product page should still load, simply omitting the recommendations or showing a static fallback.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing Fallbacks in FastAPI',
        content: `When calling external services or heavy database queries, always wrap them in try-except blocks with sensible fallbacks. You can return cached data, static default data, or simply a 200 OK with missing fields instead of throwing a 500 error.`,
        codeExample: {
          id: 'graceful-fallback',
          language: 'python',
          title: 'Graceful Degradation Example',
          filename: 'app/main.py',
          code: `from fastapi import FastAPI, HTTPException
import httpx
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

async def get_recommendations(user_id: int):
    try:
        # Simulate call to flaky recommendation service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://recommendation-service/api/v1/users/{user_id}",
                timeout=1.0 # Strict timeout!
            )
            response.raise_for_status()
            return response.json()
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        logger.warning(f"Recommendation service failed for user {user_id}: {e}")
        # Return fallback data instead of crashing
        return [{"item_id": "top-seller-1"}, {"item_id": "top-seller-2"}]

@app.get("/users/{user_id}/dashboard")
async def get_dashboard(user_id: int):
    # Core functionality
    user_data = {"id": user_id, "name": "John Doe"} 
    
    # Degradable functionality
    recs = await get_recommendations(user_id)
    
    return {
        "user": user_data,
        "recommendations": recs
    }`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Feature Flags as Kill Switches',
        content: `Feature flags aren't just for rolling out new features; they are powerful operational tools. By wrapping heavy or non-critical features in feature flags, you can instantly turn them off during a high-load event (like a Black Friday sale) to shed load and protect core systems.

These operational toggle should be stored in a highly available, fast datastore (like Redis or a dedicated service like LaunchDarkly) so they can be changed without redeploying the application.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'circuit-breaker',
        title: 'Concept Check',
        description: 'Why is a 1-second timeout crucial in the graceful degradation example?',
        hint: 'What happens to the calling service if the downstream service takes 30 seconds to fail?',
        solution: 'Without a short timeout, the calling service will hang waiting for the slow response, tying up worker threads and eventually causing a cascading failure where the caller also crashes.',
        solutionCode: {
          id: 'cb-sol',
          language: 'python',
          title: 'Answer',
          filename: 'answer.txt',
          code: `To prevent cascading failures and thread exhaustion.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'what-is-graceful-degradation',
        question: 'Give an example of graceful degradation in a system you have designed or used.',
        answer: 'When Netflix loads, if the personalized recommendation engine is down, it falls back to showing globally popular shows. The user can still watch content, even if it is not tailored to them. This prevents a non-critical system from breaking the core user journey.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'test-fallbacks',
        severity: 'warning',
        content: 'Fallbacks must be tested. An untested fallback path is likely broken. Use Chaos Engineering to occasionally force the fallback path in production.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'chaos-engineering': {
    id: '24-05',
    slug: 'chaos-engineering',
    chapterId: 24,
    order: 5,
    title: 'Chaos Engineering in Production',
    description: 'Proactively test your system resilience by injecting controlled failures.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.kubernetes, technologies.fastapi],
    prerequisites: ['24-04'],
    objectives: [
      'Design a chaos experiment hypothesis',
      'Use Chaos Monkey for Kubernetes pod kills',
      'Inject latency with toxiproxy',
      'Document and share chaos experiment results'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'The Principles of Chaos Engineering',
        content: `Chaos Engineering is the discipline of experimenting on a system in order to build confidence in the system's capability to withstand turbulent conditions in production. It is not about randomly breaking things; it is a methodical scientific process.

You start with a hypothesis about steady-state behavior (e.g., "If the payment gateway API latency increases by 2 seconds, the checkout process will still succeed within 5 seconds"). You then inject the failure, observe the system, and compare the result to the hypothesis. If the hypothesis is wrong, you've found a weakness to fix before it causes an actual outage.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Designing an Experiment',
        content: `A typical chaos experiment follows a strict structure. First, define the steady state (normal metrics). Second, define the fault to inject (e.g., network latency, pod deletion). Third, run the experiment. Fourth, measure the impact and halt the experiment if the impact exceeds an acceptable blast radius.`,
        codeExample: {
          id: 'chaos-experiment',
          language: 'python',
          title: 'Chaos Experiment Document',
          filename: 'experiment.md',
          code: `# Experiment: Redis Latency Injection

## Hypothesis
If Redis experiences 500ms of latency, the web API will continue serving requests successfully, falling back to database reads, though overall latency will increase by ~500ms. Error rates should remain < 1%.

## Blast Radius
Production environment, targeting only 5% of traffic via a specific feature flag.

## Injection Method
Use Toxiproxy to inject 500ms latency to the Redis connection pool.

## Rollback Plan
Immediately disable Toxiproxy rules and reset Redis connections if HTTP 5xx errors exceed 2%.`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Executing in Production',
        content: `While you should start practicing chaos engineering in staging environments, the ultimate goal is to run experiments in production. Staging environments rarely match the scale, traffic patterns, and configuration quirks of production.

However, executing in production requires immense care. You must have robust monitoring, automated blast-radius containment, and an immediate "kill switch" for the experiment.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'chaos-hypothesis',
        title: 'Formulate a Hypothesis',
        description: 'Write a chaos experiment hypothesis for what happens when 1 out of 3 instances of your backend API is randomly terminated.',
        hint: 'Think about load balancing and retry mechanisms.',
        solution: 'If one backend instance is terminated, the load balancer will route traffic to the remaining two instances. Overall error rate should not spike above 0.1% due to client-side retries, and system capacity should remain sufficient.',
        solutionCode: {
          id: 'chaos-hypothesis-sol',
          language: 'python',
          title: 'Hypothesis',
          filename: 'hypothesis.md',
          code: `Hypothesis: Terminating 1 of 3 pods will cause a brief momentary spike in 502s, but automated retries and load balancer health checks will mitigate impact within 5 seconds.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'why-chaos',
        question: 'Why would an organization intentionally break things in production using Chaos Engineering?',
        answer: 'To discover hidden weaknesses and validate assumptions about redundancy and fault tolerance before they cause unscheduled, uncontrolled outages. It verifies that automated failovers, timeouts, and fallbacks actually work in the real world.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'start-small',
        severity: 'info',
        content: 'Never start Chaos Engineering in production. Start in a dev environment, move to staging, and only proceed to production when the system proves resilient in lower environments.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'database-backup-recovery': {
    id: '24-06',
    slug: 'database-backup-recovery',
    chapterId: 24,
    order: 6,
    title: 'Database Backup & Point-in-Time Recovery',
    description: 'Ensure data durability with robust PostgreSQL backup strategies and WAL archiving.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.postgresql],
    prerequisites: [],
    objectives: [
      'Configure continuous WAL archiving',
      'Use pg_dump for logical backups',
      'Implement point-in-time recovery (PITR)',
      'Test recovery procedure monthly'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'Types of Backups',
        content: `A database is only as good as its backups. In PostgreSQL, there are two primary types of backups: Logical and Physical. Logical backups (using \`pg_dump\`) extract data into SQL statements. They are highly portable and good for migrating between versions, but slow to restore.

Physical backups take a snapshot of the actual data files on disk. When combined with Write-Ahead Log (WAL) archiving, physical backups enable Point-in-Time Recovery (PITR). PITR allows you to restore the database to its exact state at any specific microsecond in the past, which is crucial if someone accidentally drops a table or runs a destructive UPDATE.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'WAL Archiving and PITR',
        content: `PostgreSQL writes every change to a WAL file before applying it to the data files. By continuously archiving these WAL files to secure storage (like AWS S3) using tools like \`pgBackRest\` or \`WAL-G\`, you maintain a continuous record of changes.

To perform a recovery, you restore a base physical backup, and then configure PostgreSQL to replay the archived WAL files up to the target timestamp.`,
        codeExample: {
          id: 'postgres-wal',
          language: 'python',
          title: 'postgresql.conf (WAL Archiving)',
          filename: 'postgresql.conf',
          code: `# Enable WAL archiving
archive_mode = on

# Command to execute to archive a completed WAL file segment.
# In production, use pgbackrest or wal-g instead of a simple cp.
archive_command = 'cp %p /mnt/network_drive/archive/%f'

# Level of information written to the WAL
wal_level = replica`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Untested Backups are Useless',
        content: `Schrödinger's Backup: The condition of any backup is unknown until you try to restore it. Many companies discover their backups are corrupted, incomplete, or take days to restore only during an actual crisis.

You must automate the testing of your backups. Regularly (e.g., weekly) restore a recent backup to an isolated environment, run data integrity checks, and verify the time it takes to restore. Document this Recovery Time Objective (RTO).`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'pg-dump-cmd',
        title: 'Logical Backup',
        description: 'Write the pg_dump command to create a compressed, custom-format backup of a database named "prod_db".',
        hint: 'Use the -Fc flag for custom format.',
        solution: 'pg_dump -Fc -d prod_db -f prod_db_backup.dump',
        solutionCode: {
          id: 'pg-dump-sol',
          language: 'python',
          title: 'Command',
          filename: 'cmd.sh',
          code: `pg_dump -Fc -d prod_db -f prod_db_backup.dump`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'pitr-explanation',
        question: 'Explain how Point-in-Time Recovery (PITR) works in PostgreSQL.',
        answer: 'PITR uses a base physical backup combined with archived Write-Ahead Logs (WAL). To restore, PostgreSQL loads the base backup and sequentially replays the transactions recorded in the WAL files until it reaches the exact user-specified timestamp, stopping right before a catastrophic error occurred.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'offsite-backups',
        severity: 'critical',
        content: 'Always store backups in a different physical location and different cloud provider account than the primary database to protect against region-wide outages or compromised accounts.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'gitlab-outage',
        scenario: 'The GitLab 2017 Database Outage',
        problem: 'An engineer accidentally deleted the primary production database directory. Out of 5 different backup mechanisms deployed, none were working or tested successfully.',
        solution: 'Required restoring from a 6-hour-old LVM snapshot, resulting in significant data loss. Highlighted the critical need for automated, tested restoration procedures.'
      }
    ],
    commonMistakes: []
  },
  'high-availability-database': {
    id: '24-07',
    slug: 'high-availability-database',
    chapterId: 24,
    order: 7,
    title: 'High Availability PostgreSQL',
    description: 'Configure streaming replication and automatic failover for zero-downtime databases.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.postgresql, technologies.kubernetes],
    prerequisites: ['24-06'],
    objectives: [
      'Configure PostgreSQL streaming replication',
      'Use Patroni for automatic failover',
      'Perform controlled primary promotion',
      'Monitor replication lag and alert on threshold'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'Streaming Replication',
        content: `While backups protect against data loss, they take time to restore, leading to downtime. High Availability (HA) ensures the database remains accessible even if the primary server fails. In PostgreSQL, this is typically achieved using Streaming Replication.

A Primary node accepts all read and write traffic. It streams its Write-Ahead Logs (WAL) over the network to one or more Replica nodes. The replicas continuously apply these logs, maintaining an almost real-time copy of the data. Replicas can also serve read-only queries, allowing you to scale read capacity.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Automatic Failover with Patroni',
        content: `If the primary node crashes, a replica must be promoted to become the new primary. Doing this manually is slow and error-prone. Tools like Patroni manage this automatically. 

Patroni relies on a Distributed Configuration Store (like etcd, Consul, or ZooKeeper) to maintain cluster state and manage leader election. If the primary fails to heartbeat, the cluster votes, and a replica is promoted. Connections are then routed to the new primary using a tool like HAProxy or PgBouncer.`,
        codeExample: {
          id: 'patroni-config',
          language: 'python',
          title: 'Patroni Configuration Snippet',
          filename: 'patroni.yml',
          code: `scope: prod-cluster
namespace: /db/
name: postgres-node-1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 10.0.0.1:8008

etcd:
  host: 10.0.0.10:2379

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 10.0.0.1:5432
  data_dir: /var/lib/postgresql/data
  parameters:
    max_connections: 200
    wal_level: replica
    hot_standby: on`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Managing Replication Lag',
        content: `Replication is usually asynchronous, meaning the primary commits a transaction before the replica has applied it. This creates "replication lag." If a client writes data to the primary and immediately reads from a replica, they might see stale data.

You must monitor replication lag closely. High lag indicates a network issue or an overloaded replica. Alert heavily if lag exceeds acceptable business thresholds (e.g., > 2 seconds).`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'sync-vs-async',
        title: 'Replication Types',
        description: 'What is the trade-off of using Synchronous replication instead of Asynchronous replication?',
        hint: 'Think about what happens to the primary if the replica goes offline.',
        solution: 'Synchronous replication guarantees zero data loss because a transaction is not committed until the replica confirms receipt. However, it increases latency for writes and can cause the primary to hang if the replica is unreachable.',
        solutionCode: {
          id: 'sync-vs-async-sol',
          language: 'python',
          title: 'Answer',
          filename: 'answer.txt',
          code: `Sync ensures no data loss but sacrifices write availability and latency.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'split-brain',
        question: 'What is the "split-brain" problem in highly available databases, and how is it prevented?',
        answer: 'Split-brain occurs when a network partition separates the primary from replicas, and both sides elect a new primary, resulting in two nodes accepting writes and diverging data. It is prevented by using a quorum-based consensus system (like etcd/Zookeeper with 3+ nodes) where a node must receive majority votes to become or remain primary.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'split-reads',
        severity: 'warning',
        content: 'When routing read traffic to replicas, ensure your application logic can tolerate slight eventual consistency due to replication lag.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'deployment-safety': {
    id: '24-08',
    slug: 'deployment-safety',
    chapterId: 24,
    order: 8,
    title: 'Safe Deployment Practices',
    description: 'Techniques for deploying code to production with zero downtime and minimal risk.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.kubernetes, technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Use feature flags to decouple deployment from release',
      'Implement dark launches for traffic shadowing',
      'Set up automatic rollback on SLO violation',
      'Define deployment freeze windows'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'Deployment vs. Release',
        content: `A critical modern software concept is separating Deployment from Release. Deployment is the technical act of putting new code onto servers. Release is the business act of exposing that new functionality to users.

By decoupling the two using Feature Flags, you can deploy code to production constantly (even dozens of times a day) while the features remain hidden. Product managers can then toggle the flags to "release" features to specific users, beta groups, or globally, without requiring an engineering deployment. This drastically reduces the risk of any single deployment.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Canary Deployments',
        content: `A Canary deployment rolls out a new version to a small subset of servers or users (e.g., 5% of traffic) while the rest continue using the stable version. You monitor the metrics of the canary (error rates, latency). If they are healthy, you gradually increase traffic to 100%. If they fail, you route traffic back to the stable version.

This limits the blast radius of a bad deployment. If a bug escapes QA, it only affects 5% of users instead of 100%.`,
        codeExample: {
          id: 'kubernetes-canary',
          language: 'python',
          title: 'Conceptual Kubernetes Canary (CLI)',
          filename: 'canary.sh',
          code: `# Route 90% of traffic to v1, 10% to v2 (Canary)
# (In practice, this is done via Service Meshes like Istio or Ingress Controllers)

# Watch SLO metrics for 5 minutes
check_error_rates()

if [ $ERROR_RATE -gt $THRESHOLD ]; then
    echo "Canary failed! Rolling back..."
    # Route 100% traffic back to v1
    rollback_to_v1()
else
    echo "Canary stable. Proceeding to 50%..."
    # Scale v2 to 50%, evaluate again
fi`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Automated Rollbacks',
        content: `Deployments should be fully automated, and so should rollbacks. If a deployment causes an alert to fire (e.g., latency spikes above SLO), the deployment pipeline should automatically detect this and revert to the previous known-good state.

Relying on humans to notice a metric spike and manually run a rollback script is too slow and error-prone during an active incident.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'blue-green',
        title: 'Blue/Green Deployment',
        description: 'Describe the difference between a Canary deployment and a Blue/Green deployment.',
        hint: 'Think about infrastructure duplication and traffic routing.',
        solution: 'Blue/Green maintains two identical parallel environments. Code is deployed to the inactive one (Green), tested, and then a load balancer flips 100% of traffic to it instantly. Canary gradually shifts traffic to the new version on shared infrastructure.',
        solutionCode: {
          id: 'bg-sol',
          language: 'python',
          title: 'Answer',
          filename: 'answer.txt',
          code: `Blue/Green is an instantaneous 100% switch between two full environments. Canary is a gradual percentage shift.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'feature-flag-debt',
        question: 'What is a significant downside of using Feature Flags heavily, and how do you manage it?',
        answer: 'Feature flags create technical debt and code complexity. Multiple active flags create an exponentially large testing matrix (combinatorial explosion). You manage this by aggressively removing old feature flags and their associated dead code as soon as a feature is fully released and stable.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'db-migrations',
        severity: 'critical',
        content: 'Zero-downtime deployments require backwards-compatible database migrations. You cannot drop a column if the old version of the app is still running during a rollout.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'postmortems': {
    id: '24-09',
    slug: 'postmortems',
    chapterId: 24,
    order: 9,
    title: 'Blameless Postmortems',
    description: 'Learn from failures by conducting blameless post-incident reviews.',
    duration: 40,
    difficulty: 'production',
    technologies: [technologies.fastapi],
    prerequisites: ['24-03'],
    objectives: [
      'Write timeline of events without blame',
      'Identify contributing factors (not root cause)',
      'Generate actionable items with owners',
      'Track action item completion after incidents'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'The Blameless Culture',
        content: `A postmortem is a written record of an incident, its impact, the actions taken to mitigate it, its underlying causes, and the follow-up actions to prevent recurrence.

Crucially, postmortems must be blameless. You must assume that everyone involved acted with the best intentions based on the information they had at the time. If an engineer deleted production data, the root cause is not "Engineer made a mistake." The root cause is "The system allowed a human to easily delete production data without safeguards." Blame creates fear; fear hides information; hidden information guarantees repeat failures.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Structuring the Postmortem',
        content: `A good postmortem follows a standard template. It starts with a summary of impact, a detailed timeline of events (including when things were noticed vs. when they broke), a deep dive into the technical factors, and finally, a list of Action Items.

Action Items are the most critical part. They must be specific, assigned to an owner, and tracked to completion. "Improve monitoring" is a bad action item. "Add Prometheus alert for CPU > 85% on Auth Service, assigned to Alice, by Friday" is a good action item.`,
        codeExample: {
          id: 'postmortem-template',
          language: 'python',
          title: 'Postmortem Template Excerpt',
          filename: 'postmortem.md',
          code: `# Postmortem: Auth Service Outage (Oct 12)

## Summary
Between 14:00 and 14:45 UTC, the Auth API returned 500s, preventing user login.

## Timeline
- 13:55: Deployment of Auth Service v2.4 begins.
- 14:00: Deployment completes.
- 14:05: Customer Success reports login issues.
- 14:10: High error rate alert fires.
- 14:15: Incident Commander (Bob) begins investigation.
- 14:25: Operations Lead (Alice) rolls back to v2.3.
- 14:45: Service restored and stable.

## Contributing Factors
- The new code expected a database column that was not yet migrated.
- The CI pipeline did not test migrations against the staging DB.

## Action Items
1. [Alice] Update CI pipeline to run DB migrations before application deployment.
2. [Bob] Implement a pre-flight check for database schema validation.`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Beyond "Root Cause"',
        content: `In complex distributed systems, there is rarely a single "Root Cause." Failures usually result from a combination of multiple factors aligning (Swiss Cheese model). 

Focus on identifying "Contributing Factors" rather than a singular root cause. This leads to a more holistic understanding of the system's vulnerabilities and produces more robust action items.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'rewrite-blame',
        title: 'Rewrite Blame',
        description: 'Rewrite the following statement to be blameless: "John accidentally deployed the wrong config file because he was rushing, which broke the caching layer."',
        hint: 'Focus on the system, the process, and the lack of guardrails.',
        solution: 'An incorrect configuration file was deployed to production. The deployment process lacked automated validation of the configuration syntax, and the manual review step was bypassed.',
        solutionCode: {
          id: 'rewrite-sol',
          language: 'python',
          title: 'Blameless Statement',
          filename: 'blameless.txt',
          code: `An invalid config was deployed due to missing automated validation in the pipeline.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'why-blameless',
        question: 'Why is it important for a postmortem to be strictly blameless?',
        answer: 'If engineers fear being blamed or fired for mistakes, they will hide details, cover up errors, and avoid taking risks. A blameless culture encourages transparency, allowing the team to discover the true systemic vulnerabilities and fix them, preventing the issue from happening again.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'action-item-debt',
        severity: 'warning',
        content: 'Postmortem action items must be prioritized alongside feature work. An organization with hundreds of unresolved action items is operating with severe, unmitigated risks.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'toil-elimination': {
    id: '24-10',
    slug: 'toil-elimination',
    chapterId: 24,
    order: 10,
    title: 'Toil Elimination & Automation',
    description: 'Identify and eliminate repetitive operational work to focus on engineering.',
    duration: 40,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Define toil and measure it honestly',
      'Identify top toil sources in your operations',
      'Automate repetitive operational tasks',
      'Track toil reduction over quarters'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'What is Toil?',
        content: `In SRE, "Toil" is a specific type of work tied to running a production service that tends to be manual, repetitive, automatable, tactical, devoid of enduring value, and scales linearly as a service grows.

Examples of toil include: manually resetting passwords, restarting a flaky service every week, manually scaling databases, and running recurring SQL scripts for business reports. SRE aims to cap toil at 50% of an engineer's time. The remaining 50% must be spent on engineering: creating enduring value, writing automation, and improving architecture.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Automating Toil Away',
        content: `When you identify a repetitive task, the goal is to engineer it out of existence. This could mean writing a Python script to automate a task, or better yet, building self-service tools so other teams can do it themselves safely without involving operations.`,
        codeExample: {
          id: 'automation-script',
          language: 'python',
          title: 'Automation Script Example',
          filename: 'scripts/cleanup_stale_sessions.py',
          code: `import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Toil: Manually deleting expired sessions from the DB every week to save space.
# Solution: A script deployed as a Kubernetes CronJob.

async def cleanup_sessions():
    engine = create_async_engine("postgresql+asyncpg://user:pass@db/prod")
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    
    async with engine.begin() as conn:
        result = await conn.execute(
            text("DELETE FROM sessions WHERE last_accessed < :cutoff"),
            {"cutoff": cutoff_date}
        )
        logger.info(f"Deleted {result.rowcount} stale sessions.")

if __name__ == "__main__":
    asyncio.run(cleanup_sessions())`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Self-Service Platforms',
        content: `The highest form of toil elimination is building an Internal Developer Platform (IDP). Instead of developers filing a Jira ticket to "Provision a new Redis cluster" (which an Ops engineer manually executes), the Ops engineer builds a self-service portal or CLI where developers can provision their own approved, standardized Redis clusters instantly.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'identify-toil',
        title: 'Identify Toil',
        description: 'Which of these is Toil? A) Designing a new microservice architecture. B) Manually expanding a persistent volume claim in Kubernetes every time it reaches 90%. C) Writing a postmortem document.',
        hint: 'Look for tasks that are repetitive, lack enduring value, and scale linearly with growth.',
        solution: 'B is Toil. A is engineering design. C is an operational duty but creates enduring value (preventing future outages).',
        solutionCode: {
          id: 'id-toil-sol',
          language: 'python',
          title: 'Answer',
          filename: 'answer.txt',
          code: `B. Manually expanding the volume is repetitive and automatable.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'toil-definition',
        question: 'Define "Toil" in the context of SRE and explain why it is dangerous.',
        answer: 'Toil is manual, repetitive, automatable work that scales linearly with the system size. It is dangerous because if an organization does not eliminate toil, operational work will eventually consume 100% of engineering time as the company grows, bringing product development to a standstill and causing engineer burnout.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'measure-toil',
        severity: 'info',
        content: 'You cannot reduce what you do not measure. Require engineers to track the hours spent on toil vs. project work to identify the most painful processes.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'reliability-culture': {
    id: '24-11',
    slug: 'reliability-culture',
    chapterId: 24,
    order: 11,
    title: 'Building a Reliability Culture',
    description: 'Transform organizational mindsets to prioritize system stability alongside feature velocity.',
    duration: 35,
    difficulty: 'production',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Define on-call rotation and compensation',
      'Implement game days for resilience practice',
      'Share incident learnings across teams',
      'Make reliability a first-class product requirement'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'Reliability is a Feature',
        content: `Tools and architectures alone cannot guarantee reliability; it requires a cultural shift. Reliability must be viewed as a first-class product feature, not just an "ops problem."

Product Managers must understand that 100% uptime is impossible, and they must prioritize technical debt reduction and reliability work alongside new features. Engineers must take ownership of the code they write by running it in production and being on-call for it (often called "You build it, you run it").`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Running Game Days',
        content: `A Game Day is a scheduled, coordinated exercise where a team intentionally injects failures into a system to practice incident response and uncover weaknesses. It is a fire drill for software engineers.

During a Game Day, you gather the team, define a scenario (e.g., "The primary database region goes offline"), execute the failure, and watch how the team, tools, and systems respond. This builds muscle memory for real incidents.`,
        codeExample: {
          id: 'game-day-plan',
          language: 'python',
          title: 'Game Day Scenario Document',
          filename: 'gameday_plan.md',
          code: `# Game Day: Redis Failure Scenario

## Objective
Verify that the application gracefully degrades to database reads when the Redis cache cluster is unreachable, and ensure alerts fire within 2 minutes.

## Roles
- Commander: Sarah (runs the exercise)
- Observer: David (takes notes on what breaks)
- Responder: On-call engineer (reacts to alerts)

## Execution Steps (14:00 UTC)
1. Sarah applies network policy to block traffic to Redis in the Staging environment.
2. Team observes Slack alerts and Grafana dashboards.
3. Responder follows the "Redis Unavailable" runbook.
4. At 14:30, Sarah removes the network policy to restore service.

## Post-Game Review
Discuss what went well, what alerts were missing, and update the runbook.`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Psychological Safety',
        content: `A true reliability culture requires psychological safety. Engineers must feel safe reporting near-misses, admitting mistakes, and raising concerns about system fragility without fear of reprimand.

Organizations that punish mistakes inadvertently incentivize hiding problems, which guarantees those problems will eventually cause catastrophic outages.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'devops-culture',
        title: 'You Build It, You Run It',
        description: 'What is the primary benefit of having software developers participate in on-call rotations for the services they write?',
        hint: 'Think about incentive alignment.',
        solution: 'It aligns incentives. If a developer is paged at 2 AM for a flaky bug they wrote, they are highly incentivized to fix the bug permanently the next day. This creates a natural feedback loop that improves software quality.',
        solutionCode: {
          id: 'devops-sol',
          language: 'python',
          title: 'Answer',
          filename: 'answer.txt',
          code: `Creates a direct feedback loop that incentivizes writing reliable code.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'game-day-vs-chaos',
        question: 'What is the difference between a Game Day and Chaos Engineering?',
        answer: 'Chaos Engineering is often an automated, continuous process of injecting small, controlled failures to test system hypotheses. A Game Day is a human-centric, scheduled team exercise designed to practice incident response, communication, and process execution during a simulated major failure.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'share-learnings',
        severity: 'info',
        content: 'Postmortems should be publicly accessible within the company. Consider hosting monthly "Incident Review" meetings where teams present their most interesting failures to spread knowledge.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  }
};
