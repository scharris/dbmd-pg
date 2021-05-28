with (import <nixpkgs> {});

mkShell {
  buildInputs = [
    deno
  ];

  shellHook = ''
    echo Welcome to the dbmd-pg project.
  '';
}
