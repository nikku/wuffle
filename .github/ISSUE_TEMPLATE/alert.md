---
name: Alert
about: Report an alert after initial investigation
title: '"<AlertName>:<Symptom/Possible Root Cause> (e.g GrafanaTerminated:  DB deployment
  terminates Grafana)"  '
labels: bug, next-bug
assignees: ''

---

## STOP!!   Check if there is an open bug for these combo alert + symptom, add an occurrence of this alert as evidence to the existing bug rather than opening a new one 

## Description
<<  Describe the investigation outcome here.  Based on initial investigation select the
priority label as per the table below>> 

Affected Party  | Severity Level | WorkAround | Priority |
 -- | -- | -- | --
 Customer | High | Not Exists | P1 
 Customer | High | Exists |P2
 Customer | Low | Not Exists | P2
 Customer | Low | Exists | P3
  Team  | High | Not Exists | P2
 Team | High | Exists |P4
 Team | Low | Not Exists | P4
 Team | Low | Exists | P4
 

## Logs/Metrics
<< relevant logs or metrics because they are ephemeral 
include the commands used to generate any output that's added to the issue>>

## Additional Information (Optional)
<< enough information for any member to pick it up and play it independently
it's not required to suggest a solution or fix >>
