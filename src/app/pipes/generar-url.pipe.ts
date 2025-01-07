import { Pipe, PipeTransform } from '@angular/core';
import { ApiService } from '../services/api.service';

@Pipe({
  name: 'signedUrl',
  standalone: true
})
export class SignedUrlPipe implements PipeTransform {
  constructor(
    private apiService: ApiService,
  ) {}

  transform(fileName?: string) {
    if(!fileName) return;
    return this.apiService.signedUrl(fileName);
  }
}
