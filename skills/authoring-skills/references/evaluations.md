# Evaluation-driven skill development

## Contents

- Why evaluations come first
- The loop
- Evaluation file format
- Writing good expected_behavior entries
- Observing agent behavior
- Turning observations into edits

## Why evaluations come first

A skill written before its evaluations documents imagined problems. Writing three evaluations first forces the gap to be concrete, and gives an objective signal that the skill body can be trimmed without losing effectiveness.

## The loop

1. **Identify the gap.** Run representative tasks with no skill loaded. Record the exact failures: wrong library, missing filter, skipped validation, wrong output shape.
2. **Create three evaluations** covering those failures.
3. **Establish the baseline.** Score the no-skill runs against the evaluations. This is what the skill must beat.
4. **Write the minimum body** needed to close the gap. Nothing speculative.
5. **Run the evaluations** with the skill loaded in a fresh session.
6. **Compare to baseline and refine.** Repeat from step 4 until all three pass.

## Evaluation file format

One JSON object per evaluation.

```json
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Reads the PDF using an appropriate PDF processing library or CLI tool",
    "Extracts text from every page without skipping any",
    "Writes the extracted text to output.txt in readable form"
  ]
}
```

There is no built-in runner. Store these under the skill's `evaluations/` directory, one file per scenario, and score them manually or with your own harness. Add a `setup` array listing the repository or fixture state the scenario assumes when the evaluation depends on more than the input files.

Worked examples in this repo: `skills/cor-code/evaluations/`.

## Writing good expected_behavior entries

- Observable, not internal: "writes output.txt", not "understands the format".
- One behavior per entry so a partial pass is visible.
- Include the negative cases the baseline failed: "does not skip pages", "excludes test accounts".
- Avoid naming a specific library unless the choice is actually required.

## Observing agent behavior

When running evaluations, watch navigation as well as output:

- **Unexpected read order** → the structure is not as intuitive as assumed.
- **References never followed** → links are not prominent or explicit enough.
- **Same file read every time** → that content belongs in SKILL.md.
- **Bundled file never opened** → it is unnecessary or poorly signaled.

## Turning observations into edits

Bring the specific observed behavior back to the skill, not a guess:

- Rule ignored → raise its prominence or change "always X" to "MUST X".
- Step skipped → convert prose into a numbered step with a validation gate.
- Wrong skill triggered → rewrite the `description` triggers, not the body.
- Over-explained answer → delete the explanation the model did not need.

Re-run the same evaluation after every edit. One change at a time keeps the cause attributable.
