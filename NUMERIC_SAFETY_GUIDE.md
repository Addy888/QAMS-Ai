# Numeric Safety Quick Reference Card

## 🚨 Critical Rule

**NEVER call `.toFixed()` on unvalidated values!**

```typescript
// ❌ DANGER - Will crash!
const display = value.toFixed(2);

// ✅ SAFE - Always works
const display = Number.isFinite(value) ? value.toFixed(2) : "—";
```

---

## 📋 Quick Checklist

Before calling `.toFixed()`, ask:

1. ✅ Is the value `null` or `undefined`?
2. ✅ Could it be a string (`"2.5"` or `"Pending"`)?
3. ✅ Could it be `NaN` or `Infinity`?
4. ✅ Could it be a non-numeric type?

If **ANY** answer is "yes", use the safe patterns below.

---

## ✅ Safe Patterns

### Pattern 1: Simple Null Check + Finite Check
```typescript
if (value === null || !Number.isFinite(value)) {
  return "—";
}
return value.toFixed(1);
```

### Pattern 2: Inline Ternary
```typescript
const display = value === null || !Number.isFinite(value) 
  ? "—" 
  : `${value.toFixed(1)}%`;
```

### Pattern 3: Type + Finite Check
```typescript
if (typeof value === "number" && Number.isFinite(value)) {
  return value.toFixed(1);
}
return "—";
```

### Pattern 4: Safe Parser (for unknown types)
```typescript
const safeParseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || /[a-zA-Z]/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  
  return null;
};

const numericValue = safeParseNumber(unknownValue);
if (numericValue !== null) {
  return numericValue.toFixed(1);
}
return "—";
```

---

## 🎯 Real-World Examples

### Example 1: Display Score
```typescript
// ❌ UNSAFE
<span>{score.toFixed(1)}%</span>

// ✅ SAFE
<span>
  {score === null || !Number.isFinite(score) ? "—" : `${score.toFixed(1)}%`}
</span>
```

### Example 2: Function That Returns Formatted String
```typescript
// ❌ UNSAFE
function formatScore(score: number | null): string {
  if (score === null) return "—";
  return `${score.toFixed(1)}%`;  // Could crash if score is NaN
}

// ✅ SAFE
function formatScore(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return "—";
  return `${score.toFixed(1)}%`;
}
```

### Example 3: Conditional Rendering
```typescript
// ❌ UNSAFE
{value && (
  <Badge>{value.toFixed(1)}</Badge>
)}

// ✅ SAFE
{typeof value === "number" && Number.isFinite(value) && (
  <Badge>{value.toFixed(1)}</Badge>
)}
```

### Example 4: Backend Response Parsing
```typescript
interface BackendResponse {
  delay?: number | string | null;  // ✅ Honest type
}

// ❌ UNSAFE - Assumes it's always a number
const display = response.delay.toFixed(1);

// ✅ SAFE - Handles all possibilities
const numericDelay = safeParseNumber(response.delay);
const display = numericDelay !== null ? numericDelay.toFixed(1) : "—";
```

---

## 🔍 Why `Number.isFinite()` Instead of Just Null Check?

### The Problem with Just Null Checks
```typescript
// ❌ INCOMPLETE SAFETY
if (value !== null) {
  return value.toFixed(1);  // Still crashes on NaN, Infinity, or strings!
}
```

### Values That Pass Null Check But Crash `.toFixed()`
```typescript
NaN                  // typeof === "number" but crashes toFixed()
Infinity             // typeof === "number" but crashes toFixed()
-Infinity            // typeof === "number" but crashes toFixed()
"2.5"                // truthy value but crashes toFixed()
"Pending"            // truthy value but crashes toFixed()
undefined            // not null but crashes toFixed()
```

### The Complete Solution
```typescript
// ✅ COMPLETE SAFETY
if (Number.isFinite(value)) {
  return value.toFixed(1);  // Guaranteed safe!
}
```

**`Number.isFinite()` returns `true` ONLY if:**
1. Value is exactly type `number`
2. Value is not `NaN`
3. Value is not `Infinity` or `-Infinity`

---

## 🧪 Test Cases

### Test Your Implementation With These Values

```typescript
const testValues = [
  null,           // Should show "—"
  undefined,      // Should show "—"
  2.5,            // Should show "2.5"
  "2.5",          // Should show "2.5" (after parsing)
  "Pending",      // Should show "—"
  "N/A",          // Should show "—"
  "",             // Should show "—"
  NaN,            // Should show "—"
  Infinity,       // Should show "—"
  -Infinity,      // Should show "—"
  0,              // Should show "0.0"
  -1.5,           // Should show "-1.5"
];
```

---

## 🏗️ TypeScript Type Definitions

### ✅ Honest Types (Match Reality)
```typescript
// Backend returns string or null
interface APIResponse {
  openingDelay?: string | null;
}

// Frontend accepts both for flexibility
interface FrontendRecord {
  openingDelay?: number | string | null;
}
```

### ❌ Dishonest Types (Create False Confidence)
```typescript
// DON'T DO THIS - Backend actually returns string
interface APIResponse {
  openingDelay?: number;  // ❌ Lie!
}
```

---

## 📚 Common Scenarios

### Scenario 1: Calculating Percentages
```typescript
// ❌ UNSAFE
const percentage = (score / total * 100).toFixed(1);

// ✅ SAFE
const raw = (score / total * 100);
const percentage = Number.isFinite(raw) ? raw.toFixed(1) : "—";
```

### Scenario 2: Division by Zero
```typescript
// ❌ UNSAFE - Results in Infinity
const average = total / count;
return average.toFixed(1);  // Crashes if count is 0!

// ✅ SAFE
if (count === 0 || !Number.isFinite(total)) return "—";
const average = total / count;
return Number.isFinite(average) ? average.toFixed(1) : "—";
```

### Scenario 3: User Input
```typescript
// ❌ UNSAFE
const inputValue = parseFloat(userInput);
return inputValue.toFixed(2);  // Crashes if userInput is "hello"

// ✅ SAFE
const inputValue = parseFloat(userInput);
if (!Number.isFinite(inputValue)) {
  return "Invalid input";
}
return inputValue.toFixed(2);
```

### Scenario 4: Optional Chaining
```typescript
// ❌ STILL UNSAFE
const display = data?.score?.toFixed(1);  // toFixed still crashes if score is NaN

// ✅ SAFE
const score = data?.score;
const display = score != null && Number.isFinite(score) 
  ? score.toFixed(1) 
  : "—";
```

---

## 🎓 Training Examples

### Before & After

#### Before (Crash-Prone)
```typescript
function renderDelay(delay: number | null) {
  if (delay === null) return "—";
  return `${delay.toFixed(1)} sec`;
}
```

#### After (Production-Safe)
```typescript
function renderDelay(delay: number | string | null | undefined) {
  const numericDelay = safeParseNumber(delay);
  if (numericDelay === null) return "—";
  return `${numericDelay.toFixed(1)} sec`;
}
```

---

## 🛡️ Defense in Depth

### Layer 1: TypeScript Types
```typescript
interface Response {
  value?: number | string | null;  // Honest type
}
```

### Layer 2: Runtime Validation
```typescript
const safeValue = safeParseNumber(response.value);
```

### Layer 3: Finite Check
```typescript
if (!Number.isFinite(safeValue)) return "—";
```

### Layer 4: Safe Display
```typescript
return safeValue.toFixed(1);  // Now guaranteed safe!
```

---

## 📊 Decision Tree

```
Is the value from a safe calculation (e.g., Math operations)?
├─ YES → Just check Number.isFinite()
└─ NO (from API/user input/database)
   └─ Use safeParseNumber() + Number.isFinite()

Need to display a fallback?
├─ YES → Use ternary: Number.isFinite(v) ? v.toFixed(1) : "—"
└─ NO → Use early return: if (!Number.isFinite(v)) return;
```

---

## 🚀 Quick Wins

### Find Unsafe Code
Search your codebase for:
```regex
\.toFixed\(
```

For each match, verify it's protected by `Number.isFinite()` check.

### Template for New Code
```typescript
// Always start with this template
const safeDisplay = (value: unknown): string => {
  const num = safeParseNumber(value);
  if (num === null) return "—";
  return num.toFixed(1);
};
```

---

## 💡 Remember

1. **Trust nothing** from external sources (API, database, user input)
2. **`null` check alone is not enough** - always add `Number.isFinite()`
3. **Use `safeParseNumber()`** for values that might be strings
4. **Test with edge cases**: `null`, `NaN`, `Infinity`, `"string"`
5. **Keep types honest** - reflect what the backend actually returns

---

## 📞 When in Doubt

```typescript
// This pattern never fails
if (!Number.isFinite(value)) {
  return "—";
}
return value.toFixed(desiredPrecision);
```

---

**Last Updated:** January 2026  
**Status:** ✅ Production Guidelines
