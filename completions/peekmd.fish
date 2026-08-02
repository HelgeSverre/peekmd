# fish completion for peekmd
# Install: cp completions/peekmd.fish ~/.config/fish/completions/

complete -c peekmd -s v -l version -d 'Print the version number'
complete -c peekmd -l no-open -d 'Do not open the browser (server only)'
complete -c peekmd -l no-browser -d 'Alias for --no-open'
complete -c peekmd -l help -d 'Show help'
complete -c peekmd -F -d 'Markdown file'
