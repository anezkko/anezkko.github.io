#!/usr/bin/env bash
# Guards repository visibility for `gh` commands Claude runs (PreToolUse on Bash):
#  - `gh repo create` with no visibility flag is refused, with a note to add --private
#  - `gh repo create --public` and `gh repo edit --visibility public` stop and ask the person first
cmd=$(jq -r '.tool_input.command // ""')

decide() {  # $1 = deny | ask, $2 = reason
  jq -n --arg d "$1" --arg r "$2" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: $d, permissionDecisionReason: $r}}'
  exit 0
}

if grep -Eq '(^|[^[:alnum:]_-])gh[[:space:]]+repo[[:space:]]+create([[:space:]]|$)' <<<"$cmd"; then
  if grep -Eq -- '--public([[:space:]=]|$)|--visibility[[:space:]=]+public' <<<"$cmd"; then
    decide ask "This creates a PUBLIC repository: anyone on the internet can see it. Confirm that's intended."
  elif ! grep -Eq -- '--private([[:space:]=]|$)|--internal([[:space:]=]|$)|--visibility[[:space:]=]+(private|internal)' <<<"$cmd"; then
    decide deny "Repositories are private by default here: re-run gh repo create with --private (only use --public if the person explicitly asked for a public repo)."
  fi
fi

if grep -Eq '(^|[^[:alnum:]_-])gh[[:space:]]+repo[[:space:]]+edit([[:space:]]|$)' <<<"$cmd" \
   && grep -Eq -- '--visibility[[:space:]=]+public' <<<"$cmd"; then
  decide ask "This makes an existing repository PUBLIC: its code and history become visible to anyone. Confirm that's intended."
fi
exit 0
