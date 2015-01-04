// nominal.ts
/// <reference path="typings/foo/foo.d.ts"/>

interface Internal {
  export : number
}

export function nominal(): void {
  function internal(i: Internal): void {
    return;
  }
  return;
}

export class Exported {
  export : boolean;  // Use the keyword 'export' to try to trick the generator
}

