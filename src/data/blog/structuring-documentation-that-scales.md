---
title: Structuring documentation that scales
author: Daniel Miller
pubDatetime: 2025-06-15T14:41:30.000Z
modDatetime: 2025-06-15T14:41:30.000Z
featured: false
draft: false
tags:
  - software-development
  - process-improvement
ogImage: ../../assets/images/posts/structuring-documentation-that-scales/documentation.jpg
description: This article presents the structure for a consolidated documentation portal to support multiple audiences and promote the long-term maintainability of a…
---

This article presents the structure for a consolidated documentation portal to support multiple audiences and promote the long-term maintainability of a large and ever-evolving software system.

## Big systems...

I work on some pretty big systems. [Shift iQ](https://www.shiftiq.com/) is one of them - it's a learning management platform, also known as the Competency Management and Development System ([CMDS](https://www.keyeracmds.com/)) in the Canadian oil and gas industry.

And it is a big system. Of course, "big" is always a relative term, because it begs the question: "big compared to what?"

It's a multitenant platform that manages hundreds of millions of records for tens of thousands of users, working in multiple enterprises with multiple companies comprised of multiple offices, departments, and teams.

The codebase contains over two million lines, implementing functionality in more than twenty integrated application subsystems - including assessments, achievements, registrations, programs, courses, gradebooks, logbooks, surveys, and competency frameworks.

No, it isn't managing trillions of rows of data, and it isn't handling millions of transactions per minute, but - comparatively speaking - it's a big system.

## And a bit of history...

The product was launched in 2010, fifteen years ago, so it is well-established as a mature and proven platform.

As you can imagine, with all its size and history, documentation for the system exists in many different places, authored and managed using many different tools and applications - including (to name just a few) integrated help topics, SharePoint sites, Word and PDF documents, website content management systems (custom, commercial, and open-source), Confluence wikis, Jira support tickets, Excel spreadsheets, YouTube videos, Vimeo clips, OpenAPI specifications, Postman collections, and (of course) developer comments written into the source code.

Several years ago we took the first few steps toward opening the source code. There are countless technical and business advantages to open source. Open source systems promote transparency, flexibility, and community-driven innovation. They allow developers from all over the world to participate in the development, improvement, and quality assurance of the code. They reduce vendor lock-in and lead to more secure and more cost-effective software solutions that evolve and adapt more quickly than closed source systems.

However... before publishing the source code to the world, we need to get a better handle on the documentation! Great documentation is essential for an open source system because it encourages and facilitates adoption by new users and contributors, making the project more accessible and sustainable. Clear and thorough docs enable everyone who is interested in the system to understand it, use it, and build upon it without relying on the original developers - which is key to community growth and long-term success.

### And a little extra rationale...

Open source or closed source, documentation is important. Everyone knows the reasons for this, so rationale doesn't need a lot of discussion or debate. No one with any experience needs a lesson on the benefits of having good documentation, or the risks of missing documentation, or (worse) the dangers of having bad documentation.

Even so, it's worthwhile to mention one thing: Good product documentation is more than just helpful. It's a strategic advantage.

-   It empowers users and administrators,
-   reduces support overhead,
-   accelerates developer onboarding, and
-   keeps complex systems maintainable over time.

Clear, well-structured docs bridge the gap between design intent and real-world use, enabling teams to work faster and with greater confidence.

To quote the researchers at Gitbook in their [2025 State of the Docs](https://www.stateofdocs.com/2025/) report:

> Documentation is no longer just a support tool - it's a real business asset. And good documentation doesn't just support a product - it makes the whole experience better, from the moment someone first hears about it, through onboarding, and into advanced usage.

It's also increasingly evident that good documentation improves the scalability (and saleability!) of a software system. It establishes credibility and demonstrates the system is ready for real-world use with a robust and stable foundation.

## Deciding an approach

Content authors tend to be quite fond of the tools they currently use, whatever they are, and if it's possible to avoid too much disruption to that, then it's always a wise approach. This means the consolidation effort needs to be oriented more toward "publication" of content, and less toward "authoring" it.

A consolidated documentation portal needs authoring capabilities, obviously, but it shouldn't prohibit the use of authoring tools outside it, and it needs to support easy navigation to content that might need to be hosted outside it (for whatever reason).

This means we need a documentation platform that is designed - first and foremost - to serve as an information hub.

In the end, with regard to platform, I decided on a two-pronged approach:

1.  The website for the product should be the primary starting point for access to all its documentation. Content pages on the site should provide information about the product at a high level, with a focus on promoting its benefits. Blog posts and newsletters should be integral to website, including announcements, release notes, feature highlights, case studies, and so on.
2.  All other documentation related to the product should be managed in, coordinated through, and accessed via a user-friendly and collaborative platform with excellent features for content creation, editing, and sharing.

## Selecting the platform(s)

There is a staggering number of options available today for website content management systems and software documentation portals. In fact, there are so many alternatives that if you dive too deep down the rabbit hole you might never emerge with a selection. The [paradox of choice](https://www.youtube.com/watch?v=VO6XEQIsCoM) can easily paralyze even the very best of us.

So do your own research on this, of course, and find a platform that works for you and your team. But try not to spend too much time on the research. All the best platforms include excellent features that support the export and import of content, so if you select a platform and then later decide another option might be a better fit, then the odds are good you can make the switch if/when it's needed.

In the end I decided on two platforms, rather than one: a website content management system for promotional material (to include blog posts and newsletters), and a documentation system for everything else.

### Content management system

If budget is not a driving constraint then there are many (many!) excellent commercial options. [HubSpot](https://www.hubspot.com/) is certainly a frontrunner in this space. Other great options include [Framer](https://www.framer.com/), [Webflow](https://webflow.com/), [Hashnode](https://hashnode.com/), [YCode](https://www.ycode.com/), [Wix](https://www.wix.com/), and [Squarespace](https://www.squarespace.com/).

If budget is more of a driver, then [Ghost](https://ghost.org/) is a simple, lightweight, budget-friendly, open-source solution for websites, blogs, and newsletters. [WordPress](https://wordpress.org/) is the most popular content management system in the world today, so you really can't go wrong if you select this for a large and/or complex site - especially if your organization has extensive plugin requirements.

HubSpot and Ghost are my personal Top Two favorites here. Budget will decide the winner for our team.

> Static site generators and headless content management systems are growing in popularity. If you're interested (and tech savvy) then you may want to check out tools like [Eleventy](https://www.11ty.dev/), [Strapi](https://strapi.io/), [Contentful](https://www.contentful.com/), [Hygraph](https://hygraph.com/), and [Sanity](https://www.sanity.io/).

### Documentation and knowledge base system

I have a lot of experience with [Confluence](https://www.atlassian.com/software/confluence) (which I love) and [SharePoint](https://support.microsoft.com/en-us/office/what-is-sharepoint-97b915e6-651b-43b2-827d-fb25777f446f) (which I love less), and I hear a lot of great things about [Notion](https://www.notion.com/), but in the end I selected [GitBook](https://www.gitbook.com/) for our documentation portal.

GitBook is a modern platform that enables teams to write, organize, and share knowledge in a clean, collaborative user interface. It supports [Markdown](https://www.markdownguide.org/) and version control, and it integrates very nicely with tools like [GitHub](https://github.com/), which makes it especially ideal for technical documentation and open source projects.

After choosing GitBook, I discovered it is the platform used by the [Linux Foundation](https://docs.linuxfoundation.org/) for its documentation. This bodes well, but time will tell if it is best-suited to the job for which I selected it...

## Structuring the Docs

And now, for those who have powered through my rambling commentary thus far, here are the gritty details (proposed and not yet implemented!) for the structure of our documentation and knowledge base.

At the highest level, the documentation will be structured into seven parts:

1.  Website
2.  Guides
3.  Help Topics
4.  Public API Reference
5.  Internal Developer Reference
6.  Infrastructure and Operations
7.  Open Source and Samples

I did not select seven for its esoteric significance, but it is a happy coincidence if you're inclined toward mysticism. (For the benefit of the majority who are probably not: many traditions view 7 as a number of divine perfection and completeness.)

### Outlining the table of contents

The seven parts will be divided into sections, as follows:

**1 - Website**

-   Product Information
-   Blog/Newsletter
-   Community Information

**2 - Guides**

-   Getting Started
-   Use Cases
-   Best Practices
-   Integration Guides

**3 - Help Topics**

-   Troubleshooting
-   Frequently Asked Questions
-   Known Issues
-   Error Codes and Messages

**4 - Public API Reference**

-   Overview
-   Authentication and Authorization
-   Endpoints Reference
-   Request and Response Formats
-   Rate Limits and Throttling
-   API Change Log
-   SDKs & Tools

**5 - Internal Developer Reference**

-   Code Reference
-   Domain Model Overview
-   Service Architecture
-   Internal APIs
-   Contributor Guide

**6 - Infrastructure and Operations**

-   Configuration Management
-   Deployment Pipeline
-   Monitoring and Alerts
-   Disaster Recovery and Backup
-   Scaling and Performance

**7 - Open Source and Samples**

-   Quick-Start Samples
-   Demo Web Apps
-   CLI Tools
-   GitHub Repositories

---

## More details on the structure

Here is a (tentative) description for each part and section, to help guide and direct the team as we collect and compile our documentation into the structure outlined above.

---

## 1 - Website

-   **Purpose:** Provide visitors, prospective users, and contributors with general, promotional, and corporate information.
-   **Audience:** Potential customers, partners, developers, media, and casual visitors.
-   **Value:** This section shapes the first impression of the product. It generates and supports interest and awareness.

### Product Information

The website is the starting point and the primary hub to access all product documentation. Content pages describe the system at a high level. Promotional content includes case studies, product overview videos, feature highlights, and FAQs.

### Blog/Newsletter

System updates, product announcements, release notes, feature spotlights, usage tips, and community highlights.

### Community Information

About the community, leadership, contact details, partnership information, and other community/corporate resources.

---

## 2 - Guides

-   **Purpose:** Help users and developers understand how to get started and use the system effectively.
-   **Audience:** Users, administrators, operators, and developers.
-   **Value:** This section reduces onboarding time and help readers build mental models quickly.

### Getting Started

Includes account creation, workspace setup, initial registration and sign-in, and general configuration settings.

### Use Cases

Step-by-step workflows for solving real business problems using the system, aligned with real-world scenarios.

### Best Practices

Recommendations for scalable and secure implementation, covering architectural patterns, performance tips, and secure configuration.

### Integration Guides

Detailed instructions for connecting with third-party systems, APIs, or other platforms.

---

## 3 - Help Topics

-   **Purpose:** Provide immediate support for common issues and questions.
-   **Audience:** End users, administrators, developers, and support teams seeking fast answers.
-   **Value:** This section reduces support burden and enables user self-service.

### Troubleshooting

Diagnostic steps and resolutions for common problems, errors, or unexpected behavior.

### Frequently Asked Questions

Straightforward answers to high-frequency user and developer questions.

### Known Issues

Current product limitations, confirmed bugs, and workarounds (as applicable).

### Error Codes and Messages

Catalog of error messages with explanations, causes, and suggested resolutions.

---

## 4 - Public API Reference

-   **Purpose:** Provide developers with the technical documentation needed to integrate their system with the public APIs.
-   **Audience:** External developers, technical partners, and integration teams.
-   **Value:** This section drives adoption and reduces friction for integrators.

### Overview

Introduction to the API: what it does, how it’s structured, and how to start using it.

### Authentication and Authorization

Guidance on using API tokens, OAuth flows, scopes, and managing client credentials.

### Endpoints Reference

Detailed technical specifcations for all public endpoints, with parameters, examples, and expected responses.

### Request and Response Formats

Conventions for HTTP verbs, pagination, JSON payload structures, status codes, and standard headers.

### Rate Limits and Throttling

Explanation of usage limits, retry behavior, and headers for tracking rate usage.

### API Change Log

Versioned record of updates, deprecations, and important behavioral changes.

### SDKs and Tools

Links to client SDKs, code generators, and Postman/Insomnia collections to test and explore the API.

---

## 5 - Internal Developer Reference

-   **Purpose:** Expose internal system architecture and implementation details to development and engineering teams.
-   **Audience:** Internal developers, technical leads, QA engineers, and contributors.
-   **Value:** This section enables maintainability, onboarding, and internal knowledge sharing.

### Code Reference

Docs auto-generated from source code using DocFX, including all interfaces, classes, methods, and properties.

### Domain Model Overview

Explanation of core business entities and how they relate.

### Service Architecture

System diagrams and descriptions of services, inter-service communication, and boundaries.

### Internal APIs

Documentation of internal-only REST endpoints used across services.

### Contributor Guide

Instructions for local development environment setup, branching strategy, code style, tests, and CI/CD pipeline contributions.

---

## 6 - Infrastructure and Operations

-   **Purpose:** Document operational procedures and infrastructure configuration.
-   **Audience:** DevOps engineers, site reliability engineers, platform engineers, and those responsible for deployment and system health.
-   **Value:** This section supports smooth deployment, reliability, disaster readiness, and long-term scalability.

### Configuration Management

Details about managing environment-specific configurations, secret storage, feature flags, etc.

### Deployment Pipeline

Overview of CI/CD workflows, staging/production releases, and rollback procedures.

### Monitoring and Alerts

Dashboards, logs, thresholds, and incident response procedures using the observability stack.

### Disaster Recovery and Backup

Backup strategies, restore procedures, and disaster recovery playbooks.

### Scaling and Performance

Guidance on system performance tuning, load testing tools, and scaling strategies for high availability.

---

## In closing...

Whew, that was a much longer article than I planned. If you made it all the way through then I'll say what Stephen King sometimes says in the afterword to his books: "Thank you, gentle reader."

If you have indeed read this article from start to finish, then I expect you care about communication, in its written form, as deeply as I do - and I'd welcome your feedback on the structure I have presented.

I'm committed to making the results of our documentation initiative as helpful, accurate, and comprehensive as possible. I'll post updates here on LinkedIn periodically, to let you know how it goes.

---

This article was originally posted on LinkedIn: [https://www.linkedin.com/pulse/structuring-documentation-scales-daniel-miller-yyr7c](https://www.linkedin.com/pulse/structuring-documentation-scales-daniel-miller-yyr7c)
