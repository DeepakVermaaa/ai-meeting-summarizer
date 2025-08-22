import { Pipe, PipeTransform } from '@angular/core';

/**
 * Replaces all occurrences of a string with another string
 * Used for formatting status names like 'on_track' to 'on track'
 */
@Pipe({
  name: 'replace'
})
export class ReplacePipe implements PipeTransform {
  transform(value: string, search: string, replacement: string): string {
    if (!value || !search) {
      return value;
    }

    return value.split(search).join(replacement);
  }
}