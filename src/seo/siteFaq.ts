import { CURRENT_ROLE } from '../data/resume';

export const SITE_FAQ = [
  {
    question: 'Are you taking on AI enablement engagements?',
    answer: `I’m planning to take on select AI enablement engagements in 2027 to help teams scale. I currently work as ${CURRENT_ROLE.role} at ${CURRENT_ROLE.org}.`,
  },
  {
    question: 'What AI work do you lead at Handl Health?',
    answer:
      'I lead adoption across Operations, Customer Success, Sales, Marketing, and Legal. I administer and provision Claude Enterprise, manage connectors, pilot tools, and train all employees in role-specific workflows. I also manage AI usage and data-handling policies and research agentic engineering methods for product data integrity.',
  },
  {
    question: 'What IT responsibilities do you manage?',
    answer:
      'I run IT as the sole lead using AI workflows. I manage Google Workspace, identity and access, SSO, onboarding and offboarding, JAMF Pro and Protect, SaaS vendors and licenses, and endpoint support.',
  },
  {
    question: 'What does the 2× figure mean?',
    answer:
      'The 2× figure refers to business value relative to AI spend at Handl Health, not doubled employee productivity.',
  },
  {
    question: 'What platform and AI work did you do at Bello?',
    answer:
      'From July 2023 to May 2026, I built a React, Next.js, and TypeScript platform serving 60K+ users. My AI content pipelines handled aggregation, validation, and generation and supported 1M+ downloads. I used Pulumi on AWS and GCP to reduce manual infrastructure operations by 90%+ and built ClickHouse and BigQuery analytics with 10× lower query latency.',
  },
  {
    question: 'What creator products did you build?',
    answer:
      'At Bello, I built Blueprint Protocol, which generated $2M+ in creator revenue. I also built onchain loyalty and rewards systems that distributed $1M+ in incentives and increased retention from 30% to 60%. The systems ran across Ethereum, Base, Optimism, and Zora.',
  },
  {
    question: 'What architecture and security work did you do at Elphi?',
    answer:
      'I co-founded and architected a cloud-native mortgage platform on GCP and Firebase that reduced loan origination time by 30%+. I supported SOC 2 audit efforts with Drata and JAMF and established CI/CD, testing, and monitoring. I also improved performance, reliability, and operations by 25%+.',
  },
  {
    question: 'What engineering leadership experience do you have?',
    answer:
      'At Elphi, I grew the engineering team from 2 to 10+ across frontend, backend, and infrastructure, managed and mentored engineers, and led architecture through seed-stage fundraising. At Handl Health, I train employees across departments and lead IT on my own.',
  },
  {
    question: 'What is your aerospace background?',
    answer:
      'I earned a BS in Aerospace Engineering at MIT, studying from 2014 to 2019. I built spacecraft sequencing software at NASA JPL, validated REXIS flight hardware for OSIRIS-REx at MIT Space Systems Lab, and analyzed thermodynamics and structures at Lockheed Martin’s Skunk Works.',
  },
  {
    question: 'Where are you based?',
    answer: 'Los Angeles, California. I work remotely.',
  },
  {
    question: 'How soon do you reply?',
    answer: 'I aim to reply within 48 hours.',
  },
] as const;
