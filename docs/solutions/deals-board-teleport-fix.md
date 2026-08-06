# Deals board teleport (Pre-Sales / Sales Team filters)

## Problem
Dragging a deal into New while on Sales Team (or into Proposition while on Pre-Sales) made the card disappear — it had moved into the other team filter’s stage/amount bucket.

## Root cause
`SalesPipeline` filtered deals by team tab (`inquiry`/`quoted<$500` vs `quoted`/`booked`) while columns still accepted cross-bucket drops that updated stage/amount.

## Fix
Remove team tabs and show all deals on one board (Wave 0). Column amount thresholds and DnD remain.

## Prevention
Do not split a single kanban’s visible set by a secondary filter that the same board’s drop targets can violate.
