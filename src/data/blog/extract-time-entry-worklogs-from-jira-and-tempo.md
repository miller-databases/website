---
title: Extract time entry worklogs from Jira and Tempo with .NET API integration
author: Daniel Miller
pubDatetime: 2025-05-26T03:16:55.000Z
modDatetime: 2025-05-26T03:16:55.000Z
featured: false
draft: false
tags:
  - api-integration
ogImage: ../../assets/images/posts/extract-time-entry-worklogs-from-jira-and-tempo/office.jpg
description: Jira API + Tempo API + .NET 9 = Extract the data you need! Jira and Tempo are incredibly powerful together. Jira gives you customizable workflows and issue…
---

**Jira API + Tempo API + .NET 9 = Extract the data you need!**

Jira and Tempo are incredibly powerful together. Jira gives you customizable workflows and issue tracking. Tempo brings in robust time tracking, resource planning, and cost analysis. Together, they offer a flexible platform for managing projects and understanding how your teams work.

But here's the challenge: That **flexibility** can become a limitation when it comes to **reporting**. You can capture almost any kind of data — but try to generate a specific summary of hours by worker or by a custom field on issues with the built-in UI alone, and you might hit a few speed bumps.

I created a simple open-source project to help: [**Jira-Tempo Integration**](https://github.com/daniel-miller/jira-tempo-integration)

This tool connects to both the **Jira API** and the **Tempo API** to extract detailed time entries — including issue details and custom fields — and generates clean **CSV outputs** that are easy to drop into Excel. It’s built for real-world needs like:

-   Summarizing hours by **account** (from a Jira custom field)
-   Breaking down hours per **team member**
-   Handling **API pagination** and custom field identifiers
-   Supporting **date range inputs**

It's not plug-and-play — you’ll need to adjust it for your Jira/Tempo configuration — but it is transparent, extensible, and battle-tested in a live environment. It’s a great place to start if you’re stuck trying to figure out how to extract specific data for reporting that goes beyond what the UI can deliver.

Want to see how the logic works? The main code is clean and easy to modify:

```
var jira = new JiraClient(settings);

var tempo = new TempoClient(settings, jira);

var entries = await tempo.GetTimeEntries(settings.Since, settings.Until);

var list = entries.OrderBy(x => x.Date)
  .ThenBy(x => x.Worker)
  .ThenBy(x => x.Account)
  .ThenBy(x => x.Type)
  .ThenBy(x => x.Issue)
  .ToList();

BuildReports(list);
```

Get the source code here:  
🔗 [https://github.com/daniel-miller/jira-tempo-integration](https://github.com/daniel-miller/jira-tempo-integration)

If you need a hand trying to get that _one_ report out from your Jira and Tempo setup then drop me a note. Or create your own fork of the repository on GitHub and make it your own!

---

This article was originally posted on LinkedIn:  
[https://www.linkedin.com/pulse/making-jira-tempo-work-you-how-extract-time-entry-worklogs-miller-r1lqc](https://www.linkedin.com/pulse/making-jira-tempo-work-you-how-extract-time-entry-worklogs-miller-r1lqc)
