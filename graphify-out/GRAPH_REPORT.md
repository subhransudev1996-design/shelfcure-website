# Graph Report - website  (2026-04-24)

## Corpus Check
- 134 files · ~933,951 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 339 nodes · 326 edges · 16 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `load()` - 19 edges
2. `handleSubmit()` - 10 edges
3. `useInView()` - 8 edges
4. `POST()` - 7 edges
5. `test()` - 6 edges
6. `MouseGlow()` - 5 edges
7. `friendlyError()` - 5 edges
8. `isToday()` - 5 edges
9. `isYesterday()` - 5 edges
10. `isThisWeek()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `handleSubmit()` --calls--> `formatCurrency()`  [INFERRED]
  src\app\panel\suppliers\new\page.tsx → src\lib\utils\format.ts
- `load()` --calls--> `handleSavePurchase()`  [INFERRED]
  src\app\panel\reports\stock\page.tsx → src\app\panel\purchases\page.tsx
- `diagnose()` --calls--> `createClient()`  [INFERRED]
  src\app\auth-debug\page.tsx → src\lib\supabase\client.ts
- `testLogin()` --calls--> `createClient()`  [INFERRED]
  src\app\auth-debug\page.tsx → src\lib\supabase\client.ts
- `load()` --calls--> `handleEditBatch()`  [INFERRED]
  src\app\panel\reports\stock\page.tsx → src\app\panel\inventory\[id]\page.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (13): applyCustom(), applyRange(), daysToExpiry(), daysUntil(), expiryStatus(), handleAddBatch(), handleAdjust(), handleConfirmAccept() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (10): fmtDate(), fmtTime(), handleExport(), handleSavePurchase(), isThisMonth(), isThisWeek(), isToday(), isYesterday() (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (2): handleClick(), handleSave()

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (9): adjustQty(), getMaxReturnable(), getTotalReceived(), getUpp(), groupBySupplier(), handleSubmit(), returnAllItems(), set() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (9): formatCurrency(), formatDate(), formatRelativeTime(), monthRange(), getMonthRange(), handleAdd(), handleDeleteCategory(), setF() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (9): createClient(), diagnose(), testLogin(), POST(), postprocessHsnBatch(), postprocessItemAmounts(), repairJson(), test() (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.24
Nodes (3): MouseGlow(), useCounter(), useInView()

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (3): downloadJson(), fmt(), pad()

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (3): friendlyError(), handleLogin(), handleRegister()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (2): emptyLine(), safeUUID()

### Community 13 - "Community 13"
Cohesion: 0.6
Nodes (5): normalizeHeader(), parseCsvText(), parseDate(), parseNum(), parsePurchaseCsv()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (2): handleDownload(), handleShareWhatsApp()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (2): emptyItem(), handleAdd()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (2): buildFinYearOptions(), getFinYear()

### Community 20 - "Community 20"
Cohesion: 0.83
Nodes (3): main(), testAnnualGstQuery(), testPurchaseReturns()

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (2): StatCard(), useCountUp()

## Knowledge Gaps
- **Thin community `Community 2`** (18 nodes): `applyMaster()`, `handleAddCat()`, `handleAddLine()`, `handleClick()`, `handleFileUpload()`, `handleQuickAddSupplier()`, `handleRemoveLine()`, `handleSave()`, `newEmptyLine()`, `onMasterSelect()`, `savePurchase()`, `search()`, `searchLocal()`, `searchMaster()`, `searchSup()`, `page.tsx`, `page.tsx`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (7 nodes): `emptyLine()`, `linkMedicine()`, `removeLine()`, `safeUUID()`, `save()`, `updateLine()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (5 nodes): `handleDownload()`, `handleShareWhatsApp()`, `setField()`, `updateFestival()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (5 nodes): `emptyItem()`, `handleAdd()`, `handleLink()`, `lineAmount()`, `PurchaseGrid.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `buildFinYearOptions()`, `getFinYear()`, `handleExportJson()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (3 nodes): `StatCard.tsx`, `StatCard()`, `useCountUp()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load()` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `handleSubmit()` connect `Community 3` to `Community 8`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `test()` connect `Community 5` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `load()` (e.g. with `handleAddBatch()` and `handleEditBatch()`) actually correct?**
  _`load()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `test()` (e.g. with `repairJson()` and `postprocessHsnBatch()`) actually correct?**
  _`test()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._