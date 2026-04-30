---
title: Automate your website content migration with the Ghost Admin API
author: Daniel Miller
pubDatetime: 2025-06-25T17:10:00.000Z
modDatetime: 2025-06-25T17:10:00.000Z
featured: false
draft: false
tags:
  - api-integration
ogImage: ../../assets/images/posts/automate-your-website-content-migration-with-the-ghost-admin-api/ghost-integration.jpg
description: Recently we migrated over a hundred pages from a custom website content management system into Ghost with a simple homegrown ETL utility — and it took less…
---

Recently we migrated over a hundred pages from a custom website content management system into Ghost with a simple homegrown ETL utility — and it took less than a day.

## Why Ghost?

In a [previous article](/posts/structuring-documentation-that-scales/), I mentioned [Ghost](https://ghost.org/) as part of my software system documentation initiative. Last week we took the first steps by migrating over a hundred pages and blog posts from a custom web site content management system into the Ghost platform.

Ghost is an open-source content management system that is especially well-suited to web sites with a blog or newsletter focus, and its [Admin API](https://ghost.org/docs/admin-api/) provides an excellent set of tools for bulk-import of content from other sites and systems.

My team created a simple [Extract, Transform, Load](https://en.wikipedia.org/wiki/Extract,_transform,_load) (ETL) utility to help automate the migration between platforms. A copy of the source code for the ETL utility is available on [GitHub](https://github.com/daniel-miller/ghost-integration), and in this article I'll summarize how it works.

## A simple two-step migration

The migration process is a simple two-step.

### Step 1: Export your existing content

First, you'll need to export the content from the system you're using now. Most website content management systems make this easy to do. You'll probably need to get your hands a little muddy with some scripting, but that's a one-time problem with plenty of resources and solutions available to help.

I consolidated the content this particular project into a single text file, which is also handy as an emergency backup for the company's archive.

The content is prepared and structured into JSON file format, so it is "machine-friendly" for the next step. Here's a quick example of how it looks:

```
[
  {
    "Name": "2025-06-21-safety-compliance",
    "Day": "21",
    "Month": "June 2025",
    "Date": "2025-06-21T10:15:00-06:00",
    "Title": "New Safety Compliance Course!",
    "Summary": "A new safety compliance course has been released and is mandatory for all field technicians.",
    "Content": "### New Safety Compliance Course Now Available\n\nThe new **Safety Compliance for Field Operations** course is now live. This e-learning module focuses on updated safety protocols and response procedures.\n\nThis course is *mandatory* for all field technicians and must be completed by **July 15, 2025**.\n\n#### How to Access the Course:\n1. Go to the **Homepage**.\n2. Click your **Training Plan**.\n3. Locate **Safety Compliance for Field Operations**.\n\nIf it\u2019s not listed, use the search bar under **e-Learning**.\n\n> **Note**: Completion of this course replaces the previous version and unlocks updated site access credentials.\n\nFor help, contact the Training Coordinator.\n\nStay safe,\n\n**Your HSE Team**"
  },
  {
    "Name": "2025-06-24-maintenance-alert",
    "Day": "24",
    "Month": "June 2025",
    "Date": "2025-06-24T08:00:00-06:00",
    "Title": "Scheduled Maintenance - June 28",
    "Summary": "The platform will undergo scheduled maintenance on June 28. Expect temporary downtime.",
    "Content": "### Scheduled Maintenance on June 28\n\nWe are performing **system maintenance** on the platform:\n\n- \ud83d\uddd3 **Date**: Saturday, June 28, 2025  \n- \ud83d\udd57 **Time**: 08:00 AM \u2013 04:00 PM (MDT)\n\nDuring this period, **access to training modules and dashboards will be unavailable**.\n\n#### What You Need to Know:\n- Please complete any required training **before June 28**.\n- No data will be modified during this maintenance window.\n\nIf you experience issues after maintenance, clear your browser cache or contact the support team.\n\nWe appreciate your understanding!"
  }
]
```

### Step 2: Import your content into Ghost

Sign in to your Ghost dashboard and navigate to Your Profile page. Scroll to the bottom and look for the Staff Access Token. All you need is a copy of your token, and you're all set.

The command to import your content will look like this:

```
dotnet run --project src -- import-pages --url <ghost-url> --key <staff-token> --input <pages.json>
```

The programming is easy to understand. The main part of the logic is implemented in one simple method that looks like this:

I battle-tested this code with a site that contains more than 7000 pages, and it worked flawlessly, so the odds are good that it can handle whatever you want to throw at it.

It is important to note the Ghost Admin API endpoint for creating a new page requires a list of items, rather than a single item, which means you can migrate pages individually or in batches.

And you can import a lot more than just pages. If you need to bulk-load blog posts, subscription tiers, newsletters, discount offers, members, images, and/or webhooks... the API includes features to support all of that.

## Ghost and Spectre

I can't resist a brief technical tangent here...

I discovered [Spectre.Console](https://spectreconsole.net/) not long ago. It's a [open-source library](https://github.com/spectreconsole/spectre.console) that makes it easier to build beautiful console applications.

Spectre is no relation to Ghost, but I love the synchronicity. 👻

Speaking very generally for just a moment, the topic of console applications is a growing interest for me. Console applications might seem like ancient relics, created by dinosaurs for other dinosaurs... but there is growing evidence to support the argument that "command-line-first" development is a valuable software architecture pattern — and may become the primary software development paradigm of the future.

It's a topic for another article another day, but some experts believe [CLI-based development could change software development forever](https://www.danielfullstack.com/article/cli-based-development-could-change-software-development-forever).

## Resources

The [Ghost Admin API Docs](https://ghost.org/docs/admin-api/) are excellent. The content management UI for the Ghost platform uses the Admin API, which means everything Ghost Admin can do is also possible with the API.

The [**Ghost Resources**](https://ghost.org/resources/) page is another excellent place to get started building and publishing content. If you're looking for a new platform to host and manage the content for your site, then I encourage you to check out it.

### Our source code

The source code for our Ghost Integration project is available here: [**https://github.com/daniel-miller/ghost-integration**](https://github.com/daniel-miller/ghost-integration)

Fair warning: it isn't plug-and-play. You’ll need to look after Step One yourself, and to implement Step Two you'll need to modify the code so it fits with your Ghost configuration. So it's only a lightweight starter kit for your Ghost integration, but if you need an example of the programming steps to connect to the API and bulk-import your content, then you might find it helpful.

If you need a hand getting your content loaded into a Ghost-powered site then send me a note. And, of course, you can create a fork of my GitHub repository and make the project your own.

#GhostCMS #ContentMigration #DotNetDevelopers #CommandLineTools #ETL #BuildInPublic
