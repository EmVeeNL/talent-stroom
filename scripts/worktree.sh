#!/usr/bin/env bash
# Manage git worktrees for parallel agent work (Claude, Codex).
#
#   scripts/worktree.sh new <slug> <branch>   create worktree from origin/main and install deps
#   scripts/worktree.sh codex <slug> <model> <prompt-file>
#                                             run Codex non-interactively inside the worktree
#   scripts/worktree.sh list                  list worktrees with their PR state
#   scripts/worktree.sh remove <slug>         remove worktree, its log and local branch
#   scripts/worktree.sh clean                 remove every worktree whose PR is merged or closed
#
# Worktrees live outside the repository so tooling (ESLint, Prettier, pnpm) never scans them.
set -euo pipefail

REPO="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
BASE="${WORKTREE_BASE:-$(dirname "$REPO")/talentstroom-worktrees}"
LOGS="$BASE/.logs"

die() { echo "error: $*" >&2; exit 1; }

branch_of() { git -C "$BASE/$1" rev-parse --abbrev-ref HEAD; }

pr_state() {
  (cd "$REPO" && gh pr view "$1" --json state --jq .state 2>/dev/null) || echo "NONE"
}

cmd_new() {
  local slug="${1:?slug}" branch="${2:?branch}" dir="$BASE/$1"
  [[ -e "$dir" ]] && die "$dir already exists"
  mkdir -p "$BASE" "$LOGS"
  git -C "$REPO" fetch --quiet origin main
  git -C "$REPO" worktree add --quiet -b "$branch" "$dir" origin/main
  (cd "$dir" && pnpm install --frozen-lockfile --prefer-offline --silent)
  echo "$dir"
}

cmd_codex() {
  local slug="${1:?slug}" model="${2:?model}" prompt="${3:?prompt file}" dir="$BASE/$1"
  [[ -d "$dir" ]] || die "no worktree $dir"
  mkdir -p "$LOGS"
  # Network is enabled for package installs; minimumReleaseAge still applies (ADR 0005).
  codex exec \
    --model "$model" \
    --cd "$dir" \
    --sandbox workspace-write \
    -c sandbox_workspace_write.network_access=true \
    --output-last-message "$LOGS/$slug.result.md" \
    - <"$prompt" >"$LOGS/$slug.log" 2>&1
  echo "result: $LOGS/$slug.result.md"
}

cmd_list() {
  [[ -d "$BASE" ]] || { echo "no worktrees"; return; }
  for dir in "$BASE"/*/; do
    [[ -d "$dir" ]] || continue
    local slug branch
    slug="$(basename "$dir")"
    branch="$(branch_of "$slug")"
    printf '%-28s %-40s %s\n' "$slug" "$branch" "$(pr_state "$branch")"
  done
}

cmd_remove() {
  local slug="${1:?slug}" dir="$BASE/$1" branch
  [[ -d "$dir" ]] || die "no worktree $dir"
  branch="$(branch_of "$slug")"
  git -C "$REPO" worktree remove --force "$dir"
  git -C "$REPO" branch -D "$branch" >/dev/null 2>&1 || true
  rm -f "$LOGS/$slug".*
  git -C "$REPO" worktree prune
  echo "removed $slug ($branch)"
}

cmd_clean() {
  [[ -d "$BASE" ]] || return 0
  for dir in "$BASE"/*/; do
    [[ -d "$dir" ]] || continue
    local slug state
    slug="$(basename "$dir")"
    state="$(pr_state "$(branch_of "$slug")")"
    if [[ "$state" == "MERGED" || "$state" == "CLOSED" ]]; then cmd_remove "$slug"; fi
  done
  rmdir "$LOGS" "$BASE" 2>/dev/null || true
}

case "${1:-}" in
  new) shift; cmd_new "$@" ;;
  codex) shift; cmd_codex "$@" ;;
  list) cmd_list ;;
  remove) shift; cmd_remove "$@" ;;
  clean) cmd_clean ;;
  *) sed -n '2,12p' "$0"; exit 1 ;;
esac
