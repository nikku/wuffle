---
name: Bug
about: report (potential) unexpected behaviour affecting platform functionality
title: "<< In less than 10 words explain the unexpected behaviour>>"
labels: bug, next-bug
assignees: ''

---

<< An initial assessment is required before reporting any bug in order to answer the following questions:
   a) What is the impact:
       High: inability to perform a normal operation
       Low: business as usual but life has become harder.
   b) Is this issue affecting Customer (App Team) or only Core Team?
   c) Is there any workaround?

Based on initial assessment select a priority label as per the table below

Affected Party  | Impact Level | WorkAround | Priority |
 -- | -- | -- | --
 Customer | High | Not Exists | P1
 Customer | High | Exists |P2
 Customer | Low | Not Exists | P2
 Customer | Low | Exists | P3
 Team  | High | Not Exists | P2
 Team | High | Exists |P3
 Team | Low | Not Exists | P4
 Team | Low | Exists | P4

 >>

## What is the unexpected behaviour being reported?
<< 1) In less than 2 lines describe the observed symptom or potential issue waiting to unfold
 2) Point out the source that exposed this symptom: e.g. incident/team-complaints, test failure, code-review >>

## What would be the expected behaviour?
<< Based on the initial investigation, how the platform is expected to behave in an ideal scenario >>

## What is the workaround? (must if priority is selected based on available workaround )
<< Steps should be clear enough  for a support person  to communicate to app team on customer-facing issues >>

---
## Additional info
<< Any info that would help someone other than bug reporter to investigate and implement a fix  >>
### Steps to reproduce, if repeatable:
### Logs and Graphs:
<< If not reproducible, ephemeral logs/context information should be preserved >>
### Known/Recommended steps to remedy the situation:

----
## Regression(to be filled in by assignee) 
<< detail regression test(s) added to ensure impacted functionality isn't lost again or justify if no test is needed>>
