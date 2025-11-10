import { Pipe, PipeTransform } from '@angular/core';
import { shareReplay, tap } from 'rxjs';
import { ApiService } from '../services/api.service';

@Pipe({
  name: 'signedUrl',
  standalone: true,
})
export class SignedUrlPipe implements PipeTransform {
  private readonly cache = new Map<string, ReturnType<ApiService['signedUrl']>>();

  constructor(private apiService: ApiService) {}

  transform(fileName?: string) {
    if (!fileName) {
      return undefined;
    }

    if (this.cache.has(fileName)) {
      return this.cache.get(fileName);
    }

    const request$ = this.apiService.signedUrl(fileName).pipe(
      tap({
        error: () => this.cache.delete(fileName),
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    this.cache.set(fileName, request$);
    return request$;
  }
}
