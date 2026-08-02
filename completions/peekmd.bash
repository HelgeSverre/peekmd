# bash completion for peekmd
# Install: source completions/peekmd.bash (or copy to /etc/bash_completion.d/)

_peekmd() {
  local cur
  cur="${COMP_WORDS[COMP_CWORD]}"
  if [[ "$cur" == -* ]]; then
    COMPREPLY=($(compgen -W "--version -v --no-open --no-browser --help" -- "$cur"))
  else
    COMPREPLY=($(compgen -f -X '!*.md' -- "$cur"))
  fi
}

complete -F _peekmd peekmd
