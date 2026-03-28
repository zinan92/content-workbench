# Manual Browser Verification for VAL-INTAKE-006 and VAL-CANDIDATES-009

## Test 1: VAL-INTAKE-006 - Recoverable Discovery Failure

**Setup:**
Set environment variable to trigger discovery failure:
```bash
CONTENT_WORKBENCH_DISCOVERY_MODE=fail-on-resolution
```

**Steps:**
1. Navigate to http://127.0.0.1:3100
2. Enter a supported Douyin creator link: `https://www.douyin.com/user/MS4wLjABAAAAtest`
3. Click "Continue"
4. Observe: Yellow warning box appears with "Resolution Failed" title
5. Observe: Error message about profile being private/deleted/unavailable
6. Observe: Link is preserved in the input field
7. Observe: "You can try again" helper text is shown
8. Change the link to something else and resubmit
9. Verify: Error clears and new submission works

**Expected Evidence:**
- Screenshot of yellow resolution failure warning
- Screenshot showing preserved link in input
- Network tab showing POST /api/intake -> 422 response
- Console errors (if any)

## Test 2: VAL-CANDIDATES-009 - Partial Discovery Results

**Setup:**
Set environment variable to trigger partial discovery:
```bash
CONTENT_WORKBENCH_DISCOVERY_MODE=partial
```

**Steps:**
1. Navigate to http://127.0.0.1:3100
2. Enter a supported Douyin creator link: `https://www.douyin.com/user/MS4wLjABAAAApartial`
3. Click "Continue"
4. Observe: Navigation to candidate review page
5. Observe: Yellow "Partial Results" warning banner at top
6. Observe: Message: "Discovery returned only part of the available content. You can still review and select..."
7. Observe: Candidate table is rendered with fewer items (should be 3 instead of 8)
8. Verify: Candidates are properly structured with scores and selection controls
9. Select one or more candidates
10. Verify: Selection state is preserved despite partial results

**Expected Evidence:**
- Screenshot of partial results warning banner
- Screenshot of usable candidate table with partial data
- Network tab showing GET /api/sessions/{id} -> isPartial: true
- Console errors (if any)

## Test 3: Normal Flow (Baseline)

**Setup:**
No special environment variable (or `CONTENT_WORKBENCH_DISCOVERY_MODE=fixtures`)

**Steps:**
1. Navigate to http://127.0.0.1:3100
2. Enter a supported Douyin creator link: `https://www.douyin.com/user/MS4wLjABAAAAnormal`
3. Click "Continue"
4. Observe: Navigation to candidate review page
5. Observe: NO partial results warning
6. Observe: Full candidate table with 8 items
7. Verify: isPartial is false in the response

**Expected Evidence:**
- Screenshot showing no warning banner
- Screenshot of full candidate table
- Network tab showing isPartial: false
